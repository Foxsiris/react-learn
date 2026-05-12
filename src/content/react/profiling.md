## 📝 Теория

### Зачем профилировать

Перед оптимизацией — **измерь**. Без данных любая оптимизация — гадание. Типичные вопросы, на которые отвечает Profiler:

- Какой компонент рендерится медленнее всех?
- Почему этот компонент рендерится снова, хотя props не менялись?
- Сколько раз компонент рендерится при действии пользователя?
- Где в дереве находится "узкое место"?
- Что произошло после клика → какие компоненты сработали?

### Инструменты профилирования

1. **React DevTools Profiler** — встроенный профайлер React (Chrome/Firefox extension).
2. **`<Profiler>` API** — программный профайлинг (в коде).
3. **Browser Performance tab** — общие JS/CSS метрики, FPS.
4. **Lighthouse** — комплексный аудит.
5. **why-did-you-render** — библиотека для отладки лишних рендеров.

---

### React DevTools Profiler — пошагово

#### Установка

1. Chrome / Firefox → React DevTools extension.
2. F12 → вкладка **Components** или **Profiler**.

#### Запись сессии

```
1. Profiler tab → ⏺ Record (синяя точка)
2. Сделай действие (клик, ввод текста)
3. ⏹ Stop
4. Анализируй
```

#### Анализ

**Flamegraph chart** (по умолчанию):

```
[Большой родитель ──────────────────] (5ms)
   [Header (0ms — серый, не рендерился)]
   [Main (3ms)]
      [Sidebar (1ms)]
      [Content (2ms)]
         [Item × 10 (0.2ms каждый)]
   [Footer (0ms)]
```

- **Серый** = не рендерился (хорошо).
- **Голубой/жёлтый/оранжевый** = рендерился (тёплее = дольше).
- **Ширина** = время рендера.
- **Серый внутри родителя** = его подкомпоненты не рендерились, но он сам рендерился.

**Ranked chart**:

Показывает компоненты в порядке убывания времени рендера. Полезно для поиска топ-N медленных.

**Component chart**:

Выбери конкретный компонент → видишь все его рендеры и время каждого.

#### "Why did this render?" — почему компонент рендерится

```
1. Profiler → ⚙ Settings (шестерёнка)
2. Включи "Record why each component rendered while profiling"
3. Запиши снова
4. Кликни на компонент → справа покажет:
   - Props changed: { onClick, items }
   - State changed: { count }
   - Hooks changed: 1, 3
   - Parent re-rendered (without props change)
```

Это бесценная фича — точно знать, что вызвало ре-рендер.

---

### Программный Profiler API

```tsx
import { Profiler } from "react";

function App() {
  return (
    <Profiler
      id="App"
      onRender={(id, phase, actualDuration, baseDuration, startTime, commitTime) => {
        console.log({
          id,             // "App"
          phase,          // "mount" | "update"
          actualDuration, // фактическое время рендера в ms
          baseDuration,   // время без оптимизаций (теоретическое)
          startTime,      // когда начался рендер
          commitTime,     // когда применились DOM-изменения
        });
      }}
    >
      <Layout>
        <Content />
      </Layout>
    </Profiler>
  );
}
```

**Когда использовать:**
- Логирование производительности в production (с самплированием).
- Автоматические тесты производительности.
- Метрики для аналитики (например, отправка в Sentry/Datadog).

```tsx
// Самплирование — отправляем 1% сессий
const sampleRate = 0.01;
const shouldProfile = Math.random() < sampleRate;

<Profiler id="page" onRender={shouldProfile ? sendToAnalytics : () => {}}>
  <Page />
</Profiler>
```

---

### Browser Performance tab

Помимо React, есть проблемы уровня DOM/CSS/JS:

```
1. F12 → Performance
2. ⏺ Record → действие → ⏹
3. Анализируй:
   - Long tasks (красные блоки) — JS, блокирующий main thread > 50ms
   - FPS (зелёные палочки) — должно быть 60
   - Layout / Paint / Composite события
   - CPU Profile — что выполнялось в JS
```

Полезно для:
- Найти `for`-цикл, который тормозит.
- Увидеть тяжёлые reflow/repaint.
- Замерить общее время от клика до отрисовки.

---

### why-did-you-render

Библиотека для **автоматического обнаружения лишних рендеров** в development.

```bash
npm install --save-dev @welldone-software/why-did-you-render
```

```tsx
// wdyr.ts
import React from "react";
import whyDidYouRender from "@welldone-software/why-did-you-render";

if (process.env.NODE_ENV === "development") {
  whyDidYouRender(React, {
    trackAllPureComponents: true,  // следить за всеми React.memo
  });
}

// main.tsx — импортировать первым
import "./wdyr";
import App from "./App";

// Или для конкретного компонента:
function MyComp() { ... }
MyComp.whyDidYouRender = true;
```

В консоли увидишь:
```
[WDYR] MyComp re-rendered because of props changes:
- onClick: same value but different reference
```

---

### Метрики производительности (web)

#### Web Vitals — что мерить

- **LCP** (Largest Contentful Paint) — время до самого большого элемента. Целевое: < 2.5s.
- **FID** (First Input Delay) — задержка до первого взаимодействия. Целевое: < 100ms.
- **CLS** (Cumulative Layout Shift) — сдвиги layout. Целевое: < 0.1.
- **INP** (Interaction to Next Paint) — задержка от клика до отрисовки. Цель: < 200ms.
- **TTFB** (Time to First Byte) — время до первого байта от сервера.
- **FCP** (First Contentful Paint) — первый видимый контент.

#### Замер в коде

```tsx
import { onCLS, onFID, onLCP, onINP } from "web-vitals";

onLCP(metric => console.log("LCP:", metric));
onFID(metric => console.log("FID:", metric));
onCLS(metric => console.log("CLS:", metric));
onINP(metric => console.log("INP:", metric));
```

Можно отправлять в analytics:
```tsx
onLCP(metric => analytics.send("vitals", metric));
```

---

### Стандартные сценарии профилирования

#### Сценарий 1: Лагает ввод в форму

```
1. Profiler → Record
2. Введи 5 символов в input
3. Stop
4. Смотри: каждый символ → сколько компонентов рендерится
```

Если рендерится много — оборачивай дочерние компоненты в memo, делай поля независимыми.

#### Сценарий 2: Долгий первый рендер

```
1. Profiler → Record
2. Перезагрузи страницу
3. Stop
4. Найди самый "толстый" компонент в первом коммите
```

Решения: lazy loading, разбиение компонента, memo дочерних, code splitting.

#### Сценарий 3: Лишние рендеры при scroll

```
1. Profiler → Record
2. Скролль
3. Stop
4. Если рендерятся компоненты, не зависящие от scroll — bug
```

Решения: throttle обработчиков скролла, не клади scroll в state.

---

## ⚠️ Подводные камни

### 1. Профилирование в dev-режиме

```
Dev: дополнительные проверки, StrictMode дабл-рендер → в 2-3 раза медленнее
Production: реальные цифры
```

Для точных замеров используй **production build** (но React DevTools видит компоненты только в dev/profiling build):

```bash
# Создай специальный profiling build
# В webpack/vite: alias "react-dom" → "react-dom/profiling"
```

### 2. Замер время в DevTools — относительные

Цифры зависят от твоего железа, других вкладок, расширений. Для бенчмарков — закрывай всё лишнее.

### 3. Throttling

Чтобы тестировать на медленных устройствах:
```
DevTools → Performance → CPU: 4× / 6× slowdown
DevTools → Network: Slow 3G
```

### 4. StrictMode дабл-рендер

В StrictMode компоненты рендерятся дважды для отлова side effects. В Profiler это выглядит как "лишние" рендеры. В production не происходит.

### 5. Profiler сам тормозит

Запись потребляет CPU. После окончания снимай Record — иначе пользователь будет наблюдать тормоза.

### 6. Не оптимизируй без нужды

Самая частая ошибка — оборачивать всё в memo/useCallback "на всякий случай". Это:
- Усложняет код.
- Может ухудшить производительность (накладные расходы > выигрыш).
- Скрывает реальные проблемы.

Сначала **измерь**, потом оптимизируй.

---

## 🔬 Тонкие моменты

**Mount vs Update phase**

- **mount** — первый рендер компонента.
- **update** — последующие рендеры.

Mount обычно дороже (создание DOM). Update — только обновление.

**actualDuration vs baseDuration**

- `actualDuration` — реальное время с учётом мемоизации.
- `baseDuration` — теоретическое время если бы memo не помог.

Если `baseDuration >> actualDuration` → memo работает.
Если близки → memo не помогает или его нет.

**Profiler в условиях**

Можно оборачивать только подозрительные ветви:

```tsx
{__DEV__ && <Profiler id="header" onRender={log}>}
  <Header />
{__DEV__ && </Profiler>}
```

**Interactions API (deprecated)**

В старых версиях React был `unstable_trace` для трекинга юзер-действий. Сейчас deprecated — используй обычные lifecycle marker через `performance.mark` / `performance.measure`.

**performance.mark / measure**

```tsx
useEffect(() => {
  performance.mark("page-mounted");
}, []);

// Замер от события до маркера
performance.measure("click-to-render", "click-start", "page-mounted");

// В DevTools Performance видно как кастомные метки
```

**React Native Flipper**

В RN — Flipper / Hermes Profiler — аналогичные инструменты для мобилок.

**Sentry Performance**

В production — Sentry/Datadog/New Relic собирают метрики автоматически. Полезно для real-user monitoring (RUM).

---

## 🧩 Задачи для закрепления

**Задача 1 — Найти лишние рендеры**
Возьми существующее (или своё новое) приложение из 5-10 компонентов. В Profiler найди компонент, который рендерится "впустую" — без изменения props. Включи "Why did this render?" — пойми причину.

**Задача 2 — Оптимизация формы**
Создай форму из 10 полей. Замерь количество рендеров при вводе одного символа. Оберни поля в memo + используй useCallback для обработчиков. Замерь снова — должна быть огромная разница.

**Задача 3 — Тяжёлый список**
Список из 1000 элементов. Каждый элемент — карточка с аватаром, именем, статусом. Замерь:
1. Время первого рендера (mount).
2. Время рендера при изменении одного элемента.

Оптимизируй и сравни.

**Задача 4 — Программный Profiler**
Оберни корневой `<App>` в `<Profiler>` с `onRender`. Логируй медленные рендеры (`actualDuration > 16ms` = пропущенный кадр). Сделай вывод в HUD overlay для разработчика.

**Задача 5 — web-vitals в проекте**
Поставь web-vitals. Логируй LCP, FID, CLS, INP в console (или в analytics). Открой страницу — увидь реальные метрики.

**Задача 6 — Browser Performance tab**
Запиши Performance trace для:
1. Перезагрузка страницы.
2. Клик на тяжёлую кнопку.
3. Печать в input.

Найди long tasks (> 50ms). Оптимизируй.

**Задача 7 — why-did-you-render setup**
Поставь WDYR в проект. Включи `trackAllPureComponents: true`. В консоли появятся предупреждения о "ненужных" рендерах. Исправь 3 самых частых.

**Задача 8 — Lighthouse аудит**
Запусти Lighthouse на своём приложении (DevTools → Lighthouse). Получи Performance score. Прочитай рекомендации, выполни 3 самых полезных. Сравни новый score.

**Задача 9 — Production build profiling**
Создай production build с profiling-версией react-dom. Запусти Profiler — сравни с dev-версией. Цифры должны быть в 2-5 раз быстрее.

**Задача 10 — CPU throttling**
Включи 4× CPU slowdown в Performance tab. Profile действие, которое раньше работало плавно. Найди компоненты, которые тормозят на медленных устройствах.
