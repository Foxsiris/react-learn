## 📝 Теория

### Рендер списков через .map()

Самый распространённый способ отрендерить список — использовать `.map()` внутри JSX. Метод `.map()` возвращает массив JSX-элементов, который React умеет рендерить.

```jsx
const fruits = ["Яблоко", "Банан", "Апельсин"];

function FruitList() {
  return (
    <ul>
      {fruits.map((fruit, index) => (
        <li key={index}>{fruit}</li>
      ))}
    </ul>
  );
}
```

Любой массив JSX-элементов можно встроить в разметку:

```jsx
// Все эти формы валидны:
const items = [<li key="1">Один</li>, <li key="2">Два</li>];
return <ul>{items}</ul>;

// Inline .map():
return <ul>{data.map(item => <li key={item.id}>{item.name}</li>)}</ul>;

// Заранее подготовленный массив:
const listItems = data.map(item => <li key={item.id}>{item.name}</li>);
return <ul>{listItems}</ul>;
```

---

### Фильтрация и трансформация

```jsx
const users = [
  { id: 1, name: "Alice", active: true },
  { id: 2, name: "Bob", active: false },
  { id: 3, name: "Charlie", active: true },
];

// Только активные пользователи:
function ActiveUserList() {
  return (
    <ul>
      {users
        .filter(user => user.active)
        .map(user => (
          <li key={user.id}>{user.name}</li>
        ))
      }
    </ul>
  );
}

// Сортировка + рендер:
function SortedList({ items }) {
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <ul>
      {sorted.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
}
// Важно: [...items] — копия массива перед sort (sort мутирует!)
```

---

### Вложенные списки

```jsx
const categories = [
  { id: 1, name: "Фрукты", items: ["Яблоко", "Банан"] },
  { id: 2, name: "Овощи", items: ["Морковь", "Капуста"] },
];

function CategoryList() {
  return (
    <div>
      {categories.map(category => (
        <div key={category.id}>
          <h3>{category.name}</h3>
          <ul>
            {category.items.map((item, index) => (
              <li key={`${category.id}-${index}`}>{item}</li>
              // Для вложенных списков строим уникальный ключ из parent.id + child.index
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

---

### Ключи (key) — что это и зачем

`key` — это специальный prop, который помогает React определить, какие элементы изменились, добавились или удалились при обновлении списка.

**Без ключей** React перерисовывает весь список. **С ключами** React минимально обновляет DOM.

```jsx
// Без ключей — React не знает, какой элемент какой
<ul>
  <li>Алиса</li>   // Это новый элемент? Или перемещённый?
  <li>Боб</li>
  <li>Чарли</li>
</ul>

// С ключами — React однозначно идентифицирует каждый элемент
<ul>
  <li key="alice">Алиса</li>
  <li key="bob">Боб</li>
  <li key="charlie">Чарли</li>
</ul>
```

---

### Алгоритм reconciliation (сверка)

React использует **diffing algorithm** для сравнения двух деревьев Virtual DOM:

**Правило 1:** Элементы разных типов → полный пересоздание поддерева

```jsx
// До:
<div><Counter /></div>
// После:
<span><Counter /></span>
// React уничтожит div и создаст span. Counter будет сброшен!
```

**Правило 2:** Элементы одного типа → обновление атрибутов, рекурсия вглубь

```jsx
// До:
<div className="old" id="main"><p>Текст</p></div>
// После:
<div className="new" id="main"><p>Текст</p></div>
// React обновит только className, остальное оставит
```

**Правило 3:** Списки → сравнение по ключам

```jsx
// Без ключей — React сравнивает по позиции:
// До:  <li>A</li> <li>B</li>
// После: <li>X</li> <li>A</li> <li>B</li>
// React думает: позиция 0 изменилась (A→X), 1 изменилась (B→A), добавилась 2 (B)
// Реальность: просто добавился X в начало

// С ключами — React правильно понимает:
// key="x" добавился, key="a" и key="b" просто сдвинулись
```

---

### Что использовать как ключ

```jsx
// ✅ ID из базы данных — лучший вариант
items.map(item => <li key={item.id}>{item.name}</li>)

// ✅ Уникальная строка (slug, uuid, etc.)
items.map(item => <li key={item.slug}>{item.title}</li>)

// ⚠️ Индекс массива — ТОЛЬКО если:
// - список статичный (не меняется порядок, нет вставок/удалений)
// - элементы не имеют state и не фокусируются
items.map((item, index) => <li key={index}>{item}</li>)

// ❌ Случайные значения — каждый рендер создаёт новый ключ
items.map(item => <li key={Math.random()}>{item}</li>)
// React думает, что все элементы заменились → перерисовывает всё

// ❌ Индекс при сортируемых/фильтруемых списках
```

---

### Почему индекс как ключ — проблема

```jsx
function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: "Первое" },
    { id: 2, text: "Второе" },
    { id: 3, text: "Третье" },
  ]);

  const removeFirst = () => setTodos(todos.slice(1));

  return (
    <ul>
      {todos.map((todo, index) => (
        // ❌ Используем индекс как ключ
        <TodoItem key={index} todo={todo} />
      ))}
    </ul>
  );
}
```

При удалении первого элемента:
- До: key=0 "Первое", key=1 "Второе", key=2 "Третье"
- После: key=0 "Второе", key=1 "Третье"

React считает, что key=0 (Первое) **изменился** на (Второе) — обновляет контент. Если TodoItem имеет локальный state (чекбокс, фокус) — он **не сбросится**, потому что React думает что это тот же компонент. Баги гарантированы.

```jsx
// ✅ Правильно: используем стабильный id
{todos.map(todo => (
  <TodoItem key={todo.id} todo={todo} />
))}
```

---

### Оптимизация рендера больших списков

```jsx
// Для очень больших списков (тысячи элементов) — виртуализация
// (подробно в теме "Windowing"), но базовые оптимизации:

// 1. React.memo для элементов списка
const ListItem = React.memo(function ListItem({ item, onSelect }) {
  console.log("рендер:", item.id);
  return <li onClick={() => onSelect(item.id)}>{item.name}</li>;
});

// 2. Стабильные callbacks через useCallback
function List({ items }) {
  const handleSelect = useCallback((id) => {
    console.log("selected:", id);
  }, []); // стабильная ссылка

  return (
    <ul>
      {items.map(item => (
        <ListItem key={item.id} item={item} onSelect={handleSelect} />
      ))}
    </ul>
  );
}
```

---

## ⚠️ Подводные камни

### 1. Ключ не уникален в пределах уровня

```jsx
// ❌ Ключи должны быть уникальны среди братьев (siblings), не глобально
// Но они должны быть уникальны на ОДНОМ уровне вложенности!
<ul>
  <li key="1">Первый</li>
  <li key="1">Второй</li>  {/* Дублирующий ключ — баг! */}
</ul>

// ❌ Два разных списка с одинаковыми ключами — ОК (они не siblings)
<ul>
  {listA.map(item => <li key={item.id}>{item.name}</li>)}
</ul>
<ul>
  {listB.map(item => <li key={item.id}>{item.name}</li>)}
</ul>
// Здесь одинаковые id в разных ul — нормально
```

### 2. key передаётся только React, не компоненту

```jsx
function Item({ key, id, name }) {
  console.log(key); // undefined! key не попадает в props
  console.log(id);  // 42
}

<Item key={42} id={42} name="Test" />

// Если нужен key как данные — передай отдельным prop:
<Item key={item.id} itemId={item.id} name={item.name} />
```

### 3. Перемещение компонентов без ключей

```jsx
// ❌ React сравнивает по позиции — оба Input получат чужой state
{showFirst ? (
  <>
    <input placeholder="Первый" />
    <input placeholder="Второй" />
  </>
) : (
  <>
    <input placeholder="Второй" />
    <input placeholder="Первый" />
  </>
)}

// ✅ Ключи обеспечивают правильную идентификацию
{showFirst ? (
  <>
    <input key="first" placeholder="Первый" />
    <input key="second" placeholder="Второй" />
  </>
) : (
  <>
    <input key="second" placeholder="Второй" />
    <input key="first" placeholder="Первый" />
  </>
)}
```

### 4. Генерация ID в render

```jsx
// ❌ nanoid()/uuid() в render — новый ключ каждый рендер
items.map(item => <Item key={nanoid()} {...item} />)

// ✅ ID должен быть частью данных
const [items] = useState(() =>
  rawItems.map(item => ({ ...item, id: nanoid() })) // один раз при инициализации
);
```

---

## 🔬 Тонкие моменты

**key влияет на сохранение state компонента:**

```jsx
// Изменение key = пересоздание компонента с нуля (state сбрасывается)
// Это можно использовать намеренно для сброса state:
<Form key={userId} userId={userId} />
// При смене userId форма полностью пересоздаётся → все поля очищаются
```

**Ключи работают только на одном уровне дерева:**

```jsx
// React сравнивает только "братьев" по ключу
// Элемент с key="a" в одном списке и key="a" в другом — разные компоненты
```

**Fragment с ключом:**

```jsx
// Если нужен ключ на Fragment (нет DOM-элемента):
{items.map(item => (
  <React.Fragment key={item.id}>
    <dt>{item.term}</dt>
    <dd>{item.description}</dd>
  </React.Fragment>
))}
// Краткий синтаксис <> </> не поддерживает key
```

---

## 🧩 Задачи

**Задача 1.** Реализуй компонент `DraggableList`: список элементов с кнопками "▲ вверх" и "▼ вниз". При перемещении используй стабильные ID как ключи. Покажи разницу в поведении с `key={index}` и `key={item.id}` (добавь input в каждый элемент для наглядности).

**Задача 2.** Создай `FilterableTable` с колонками Name, Age, Role. Добавь фильтр по роли и сортировку по имени. Убедись, что ключи стабильны при фильтрации/сортировке.

**Задача 3.** Реализуй бесконечный скролл: при достижении конца списка подгружай ещё 20 элементов. Ключи — ID из API. Обработай случай дублирующихся ID (дедупликация).

**Задача 4.** Реализуй `<dl>` список терминов через `React.Fragment` с ключами. Компонент принимает массив `{ term, definition }`.

**Задача 5.** Создай компонент `AnimatedList` (с использованием CSS transitions): при добавлении нового элемента он появляется с fade-in, при удалении — с fade-out. Объясни, почему правильные ключи критичны для работы анимаций.
