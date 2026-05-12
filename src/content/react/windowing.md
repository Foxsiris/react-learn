## 📝 Теория

### Что такое windowing (виртуализация)

**Windowing** (или **virtualization**) — техника рендеринга **только видимых элементов** длинного списка. Вместо 10 000 DOM-узлов в памяти — только ~20 (видимые в окне просмотра).

```
[Виртуальный список 10 000 элементов]
                ┃
        ╔═══════╋═══════╗  ← окно просмотра (viewport)
        ║       ┃       ║
[item 234][item 235] visible
[item 236][item 237] visible
...      [item 245] visible
        ╚═══════╋═══════╝
                ┃
       (всё остальное — НЕ в DOM)
```

### Зачем нужно

Без виртуализации 10 000 элементов = 10 000 DOM-узлов = десятки MB памяти, медленный layout, лагающий скролл. С виртуализацией — постоянно ~20 узлов в DOM, плавно даже на миллион элементов.

### Когда использовать

- ✅ Длинные списки (1000+ элементов).
- ✅ Чаты с большим количеством сообщений.
- ✅ Большие таблицы.
- ✅ Грид с тысячами карточек.

### Когда НЕ нужно

- ❌ Короткие списки (< 100) — виртуализация добавляет сложности без пользы.
- ❌ Накладные расходы могут быть выше выигрыша.
- ❌ SEO — виртуализированный контент **не доступен** crawler-ам без специальных мер.

---

### Популярные библиотеки

| | react-window | react-virtuoso | TanStack Virtual |
|---|---|---|---|
| Автор | Brian Vaughn (React Core) | Petyo Ivanov | TanStack |
| Размер | ~6KB | ~30KB | ~5KB |
| API | Простой | Богатый (sticky headers, group, etc.) | Гибкий, headless |
| Variable size | Через VariableSizeList | Из коробки | Из коробки |
| Sticky headers | Нет | Да | Через примеры |
| Лучше для | Простые случаи | Сложные UI | Кастомизация |

---

### react-window — базовый пример

```tsx
import { FixedSizeList } from "react-window";

const items = Array.from({ length: 10_000 }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
}));

function Row({ index, style }: { index: number; style: React.CSSProperties }) {
  return (
    <div style={style}>      {/* style ОБЯЗАТЕЛЕН — содержит position, top, height */}
      {items[index].name}
    </div>
  );
}

function App() {
  return (
    <FixedSizeList
      height={600}        // высота viewport в px
      width="100%"
      itemCount={items.length}
      itemSize={50}       // высота одной строки
    >
      {Row}
    </FixedSizeList>
  );
}
```

### Как это работает

1. `FixedSizeList` создаёт контейнер высотой 600px с `overflow: scroll`.
2. Внутри контейнера — невидимый "thumb" высотой `itemCount * itemSize` (10 000 × 50 = 500 000px).
3. Видимые строки (~12-15 в viewport) рендерятся с `position: absolute` и нужным `top`.
4. При скролле React пересчитывает, какие строки видимы.

---

### VariableSizeList — переменная высота

```tsx
import { VariableSizeList } from "react-window";
import { useRef } from "react";

function App() {
  const listRef = useRef<VariableSizeList>(null);
  
  // Размер каждого элемента
  const getItemSize = (index: number) => {
    return items[index].isExpanded ? 200 : 50;
  };

  return (
    <VariableSizeList
      ref={listRef}
      height={600}
      width="100%"
      itemCount={items.length}
      itemSize={getItemSize}
    >
      {({ index, style }) => (
        <div style={style}>
          {items[index].name}
        </div>
      )}
    </VariableSizeList>
  );
}

// При изменении высоты — нужно сбросить кеш
function toggleItem(index: number) {
  // ...
  listRef.current?.resetAfterIndex(index);
}
```

---

### FixedSizeGrid — двумерная виртуализация

```tsx
import { FixedSizeGrid } from "react-window";

<FixedSizeGrid
  columnCount={1000}
  columnWidth={100}
  rowCount={1000}
  rowHeight={50}
  height={600}
  width={800}
>
  {({ columnIndex, rowIndex, style }) => (
    <div style={style}>
      {rowIndex},{columnIndex}
    </div>
  )}
</FixedSizeGrid>
// Из 1 000 000 ячеек рендерится только ~96 (8 cols × 12 rows)
```

---

### TanStack Virtual — гибкий headless

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

function App() {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,        // примерный размер для оптимизации
    overscan: 5,                    // сколько лишних строк рендерить (для плавности скролла)
  });

  return (
    <div
      ref={parentRef}
      style={{
        height: 600,
        overflow: "auto",
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Динамический размер с TanStack Virtual

```tsx
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
  measureElement: (el) => el.getBoundingClientRect().height,  // динамический замер
});

// В ряду:
<div ref={virtualizer.measureElement} data-index={virtualItem.index}>
  {items[virtualItem.index].content}  // высота определяется автоматически
</div>
```

---

### Infinite scroll + виртуализация

Часто хочется:
1. Виртуализированный список.
2. Подгрузка следующих страниц при скролле.

```tsx
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({...});
const items = data?.pages.flatMap(p => p.items) ?? [];

const virtualizer = useVirtualizer({
  count: hasNextPage ? items.length + 1 : items.length,  // +1 для loader-row
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
});

// Эффект подгрузки
useEffect(() => {
  const lastItem = virtualizer.getVirtualItems().at(-1);
  if (lastItem && lastItem.index >= items.length - 1 && hasNextPage) {
    fetchNextPage();
  }
}, [virtualizer.getVirtualItems(), items.length, hasNextPage]);

return (
  <div ref={parentRef} style={{ height: 600, overflow: "auto" }}>
    <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
      {virtualizer.getVirtualItems().map(vi => (
        <div key={vi.key} style={{ position: "absolute", transform: `translateY(${vi.start}px)`, height: vi.size }}>
          {vi.index >= items.length ? "Loading..." : items[vi.index].name}
        </div>
      ))}
    </div>
  </div>
);
```

---

### Виртуализированная таблица

```tsx
// Часто используется TanStack Table + TanStack Virtual
import { useReactTable } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualTable({ data, columns }) {
  const table = useReactTable({ data, columns, ... });
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  const { rows } = table.getRowModel();
  
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 35,
    overscan: 10,
  });
  
  return (
    <div ref={tableContainerRef} style={{ height: 600, overflow: "auto" }}>
      <table>
        <thead>...</thead>
        <tbody style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map(vi => {
            const row = rows[vi.index];
            return (
              <tr key={row.id} style={{ position: "absolute", transform: `translateY(${vi.start}px)` }}>
                {row.getVisibleCells().map(cell => <td key={cell.id}>{...}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

---

## ⚠️ Подводные камни

### 1. Забыл `style` в render-функции

```tsx
// ❌ Без style — все элементы наложатся друг на друга
<FixedSizeList ...>
  {({ index }) => <div>{items[index]}</div>}  {/* нет style! */}
</FixedSizeList>

// ✅ Передаём style
<FixedSizeList ...>
  {({ index, style }) => <div style={style}>{items[index]}</div>}
</FixedSizeList>
```

### 2. Не задана высота контейнера

```tsx
// ❌ height не задан → не понятно, что виртуализировать
<FixedSizeList height={undefined} ... />

// ✅ Высота явно
<FixedSizeList height={600} ... />

// ✅ Auto-size через AutoSizer
import AutoSizer from "react-virtualized-auto-sizer";
<AutoSizer>
  {({ height, width }) => (
    <FixedSizeList height={height} width={width} ... />
  )}
</AutoSizer>
```

### 3. Динамическая высота без resetAfterIndex

```tsx
// ❌ Изменили getItemSize — кеш старый, элементы наложатся
const [expanded, setExpanded] = useState(false);
const getItemSize = (i) => expanded ? 200 : 50;

// ✅ Сбрось кеш при изменении
useEffect(() => {
  listRef.current?.resetAfterIndex(0);
}, [expanded]);
```

### 4. Поиск/Find в браузере не находит виртуализированный контент

Cmd+F ищет в DOM. Виртуальные элементы вне viewport — не в DOM. Решения:
- Свой поиск с подсветкой + scroll к найденному.
- Не виртуализировать, если важен поиск.

### 5. SEO

Crawlers видят только то, что в DOM при первой отрисовке. Виртуальный список — пуст для них.

Решения:
- SSR с тем же количеством DOM-узлов (но SSR + virt-лайт сложно).
- Не виртуализировать SEO-критичные страницы.
- Подгружать SEO-критичный список без виртуализации.

### 6. Sticky headers / footers

Виртуальный список не понимает sticky из коробки. react-virtuoso умеет, react-window — нет.

### 7. Поведение DOM-фокуса

Если фокус был на элементе, который ушёл за пределы viewport (виртуально удалился из DOM) — фокус потерян. Сложный кейс с автокомплитом и множественным выбором.

### 8. Resize

При изменении размера контейнера — нужно ресетить виртуализер:
```tsx
// react-window — пересчитает сам
// TanStack Virtual — useResizeObserver
```

---

## 🔬 Тонкие моменты

**`overscan` — буфер**

```tsx
useVirtualizer({ overscan: 5 });
// Рендерит +5 строк выше и ниже viewport
// Делает скролл плавнее (не видно "появления" новых строк)
// Но больше DOM-узлов
```

**`scrollToIndex` — программный скролл**

```tsx
// react-window
listRef.current?.scrollToItem(500, "center");

// TanStack Virtual
virtualizer.scrollToIndex(500, { align: "center" });
```

**Виртуализация и анимации**

CSS-анимации на исчезающих элементах не сработают (элементы внезапно убираются из DOM). Для анимации появления/исчезания — нужны кастомные подходы (например, framer-motion с layoutId).

**Мобильный скролл**

На мобилках есть momentum scrolling. Виртуальные списки работают, но нужно тестировать на реальных устройствах — иногда элементы "догоняют" скролл с задержкой.

**Memo на ряды**

```tsx
const Row = React.memo(function Row({ index, style }) {
  return <div style={style}>{items[index].name}</div>;
});
// Ряды не пересоздаются при скролле, только если index изменился
```

**Container ref vs window**

```tsx
// Виртуализация внутри контейнера (overflow: auto)
useVirtualizer({ getScrollElement: () => containerRef.current });

// Виртуализация всей страницы
import { useWindowVirtualizer } from "@tanstack/react-virtual";
const virtualizer = useWindowVirtualizer({ count, estimateSize });
```

**CSS Containment**

```css
.list-item { contain: layout style paint; }
/* Браузер изолирует элемент → быстрее layout */
```

**Производительность TanStack Virtual vs react-window**

TanStack Virtual обычно чуть быстрее на больших количествах + лучше работает с динамическими размерами. react-window — проще API.

---

## 🧩 Задачи для закрепления

**Задача 1 — Чат на 100 000 сообщений**
Реализуй чат через `react-window` (FixedSizeList). Каждое сообщение — фиксированной высоты (например, 60px). Покажи, что скролл плавный, FPS 60.

**Задача 2 — VariableSizeList**
Сделай список FAQ — заголовок + раскрывающийся ответ. Используй `VariableSizeList`. При раскрытии — `resetAfterIndex`.

**Задача 3 — Bidirectional infinite scroll**
Чат, в котором при скролле вверх подгружаются старые сообщения, при скролле вниз — новые. Виртуализация + InfiniteQuery (двунаправленный).

**Задача 4 — Виртуализированная таблица**
Таблица с 5 000 строк × 10 колонок. Используй `useVirtualizer` для рядов. Сравни производительность без виртуализации (если получится загрузить).

**Задача 5 — Grid 1M ячеек**
Сетка 1 000 × 1 000 ячеек (как Excel). Используй `FixedSizeGrid`. Каждая ячейка — input. Покажи, что приложение работает плавно.

**Задача 6 — Search в виртуальном списке**
Виртуализированный список + поле поиска. При вводе — фильтрация (виртуальный индекс пересчитывается). При нахождении — подсветка + scrollToIndex.

**Задача 7 — Sticky headers**
Список с группировкой (по дате, по категории). Заголовок группы — sticky. Используй `react-virtuoso` (он умеет из коробки) или реализуй через absolute positioning.

**Задача 8 — Auto-sizing rows**
Список комментариев. Каждый комментарий имеет произвольную длину (от 1 до 50 строк). Используй TanStack Virtual с `measureElement` для динамических высот.

**Задача 9 — Scroll restoration**
При навигации между страницами — запоминай scroll position. При возврате — восстанавливай. Используй `scrollToIndex` или `scrollOffset`.

**Задача 10 — Сравнение библиотек**
Реализуй один и тот же список в:
1. Без виртуализации.
2. react-window.
3. TanStack Virtual.
4. react-virtuoso.

Сравни код, размер bundle, производительность, удобство.
