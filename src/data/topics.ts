export type TopicStatus = "done" | "review" | "skip" | "todo";

export interface CodeExample {
  title: string;
  description?: string;
  code: string;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  theory: string;
  examples: CodeExample[];
  links?: { title: string; url: string }[];
}

export interface Block {
  id: string;
  title: string;
  emoji: string;
  description: string;
  topics: Topic[];
}

const r = (s: string) => s.replace(/^\n/, "");

export const blocks: Block[] = [
  {
    id: "core",
    emoji: "🔵",
    title: "Core React — Основы",
    description: "Фундамент — без этого дальше нельзя",
    topics: [
      {
        id: "jsx",
        title: "JSX",
        description: "Синтаксис, выражения, условный рендеринг",
        theory: r(`
JSX — это синтаксическое расширение JavaScript, которое выглядит как HTML, но компилируется в обычные вызовы \`React.createElement()\`.

**Ключевые правила:**
- В JSX используется \`className\` вместо \`class\` и \`htmlFor\` вместо \`for\`
- Все атрибуты пишутся в camelCase: \`onClick\`, \`tabIndex\`
- Выражения внутри JSX оборачиваются в фигурные скобки \`{}\`
- Компонент должен возвращать один корневой элемент (или Fragment)
- Самозакрывающиеся теги обязательны: \`<img />\`, \`<br />\`

**Условный рендеринг:**
- \`{condition && <Component />}\` — рендер по условию
- \`{condition ? <A /> : <B />}\` — тернарный оператор
- Возврат \`null\` — не рендерить ничего
        `),
        examples: [
          {
            title: "Базовый JSX и выражения",
            code: r(`
export default function App() {
  const name = "Daniil";
  const isOnline = true;
  const items = ["React", "TypeScript", "Vite"];

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Привет, {name}!</h1>
      <p>Статус: {isOnline ? "🟢 онлайн" : "⚫ оффлайн"}</p>
      {isOnline && <p>Можно работать!</p>}
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
`),
          },
          {
            title: "Fragment vs обёрточный div",
            code: r(`
export default function App() {
  return (
    <>
      <h1>Без лишнего div</h1>
      <p>Fragment не создаёт DOM-узел</p>
    </>
  );
}
`),
          },
        ],
      },
      {
        id: "props",
        title: "Props",
        description: "Передача данных, деструктуризация, defaultProps",
        theory: r(`
Props — это объект параметров, которые родительский компонент передаёт дочернему. Props **только для чтения** — компонент не должен изменять полученные props.

**Передача props:**
- Строки: \`<Component name="Daniil" />\`
- Выражения: \`<Component age={25} active />\` (булевый = true по умолчанию)
- Объекты/массивы: \`<Component data={{ x: 1 }} />\`
- children — особый prop, всё что между открывающим и закрывающим тегом

**Деструктуризация в параметрах** — короткий и читаемый способ:
\`function Card({ title, children }) { ... }\`

**Значения по умолчанию** в современном React задаются через дефолты деструктуризации, а не \`defaultProps\`.
        `),
        examples: [
          {
            title: "Базовая передача props",
            code: r(`
function Greeting({ name, age = 18 }) {
  return (
    <p>
      Привет, <b>{name}</b>! Тебе {age}.
    </p>
  );
}

export default function App() {
  return (
    <div style={{ padding: 20 }}>
      <Greeting name="Даня" age={25} />
      <Greeting name="Гость" />
    </div>
  );
}
`),
          },
          {
            title: "children как prop",
            code: r(`
function Card({ title, children }) {
  return (
    <div style={{
      border: "1px solid #444",
      borderRadius: 8,
      padding: 16,
      margin: 8,
      background: "#1a1a1a",
      color: "white",
    }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div>{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <Card title="О компоненте">
      <p>children — это всё что внутри тега.</p>
      <button>Действие</button>
    </Card>
  );
}
`),
          },
        ],
      },
      {
        id: "state",
        title: "State (useState)",
        description: "Состояние, иммутабельность",
        theory: r(`
**State** — это данные, которые компонент хранит между рендерами. При обновлении state React заново рендерит компонент.

\`const [count, setCount] = useState(0);\`

**Главные правила:**
1. **Никогда не мутируй state напрямую** — всегда создавай новый объект/массив
2. \`setState\` асинхронен — используй функциональную форму \`setCount(c => c + 1)\` когда новое значение зависит от старого
3. Несколько \`setState\` подряд **батчатся** — React сольёт их в один рендер

**Иммутабельные обновления:**
- Объект: \`setUser({ ...user, name: "new" })\`
- Массив: \`setItems([...items, newItem])\`
- Удаление: \`setItems(items.filter(i => i.id !== id))\`
        `),
        examples: [
          {
            title: "Счётчик с функциональным обновлением",
            code: r(`
import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: 20 }}>
      <h1>Счёт: {count}</h1>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
      <button onClick={() => setCount(c => c - 1)}>-1</button>
      <button onClick={() => setCount(0)}>Сброс</button>
      <p>Кнопка тройного клика:</p>
      <button onClick={() => {
        setCount(c => c + 1);
        setCount(c => c + 1);
        setCount(c => c + 1);
      }}>+3</button>
    </div>
  );
}
`),
          },
          {
            title: "Иммутабельное обновление объекта",
            code: r(`
import { useState } from "react";

export default function App() {
  const [user, setUser] = useState({ name: "Daniil", age: 25 });

  return (
    <div style={{ padding: 20 }}>
      <p>{user.name}, {user.age} лет</p>
      <button onClick={() => setUser({ ...user, age: user.age + 1 })}>
        +1 год
      </button>
      <input
        value={user.name}
        onChange={e => setUser({ ...user, name: e.target.value })}
      />
    </div>
  );
}
`),
          },
          {
            title: "Список TODO",
            code: r(`
import { useState } from "react";

export default function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: "Изучить useState" },
  ]);
  const [text, setText] = useState("");

  const add = () => {
    if (!text.trim()) return;
    setTodos([...todos, { id: Date.now(), text }]);
    setText("");
  };

  const remove = (id) =>
    setTodos(todos.filter(t => t.id !== id));

  return (
    <div style={{ padding: 20 }}>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={add}>+</button>
      <ul>
        {todos.map(t => (
          <li key={t.id}>
            {t.text}
            <button onClick={() => remove(t.id)}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "lifecycle",
        title: "Lifecycle (useEffect)",
        description: "useEffect, зависимости, cleanup",
        theory: r(`
**useEffect** — выполняет побочные эффекты после рендера: подписки, запросы, таймеры, ручная работа с DOM.

\`useEffect(() => { ... }, [deps])\`

**Три варианта зависимостей:**
- \`[]\` — выполнить один раз после монтирования
- \`[a, b]\` — каждый раз, когда меняются \`a\` или \`b\`
- *(не указан)* — после каждого рендера

**Cleanup-функция** возвращается из эффекта и вызывается перед следующим запуском и при размонтировании:

\`\`\`js
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id); // cleanup
}, []);
\`\`\`

**Типичные ошибки:**
- Забыть cleanup для таймеров/подписок → утечки памяти
- Забыть зависимость → stale closure
- Запрос в эффекте без AbortController → race condition
        `),
        examples: [
          {
            title: "Таймер с cleanup",
            code: r(`
import { useState, useEffect } from "react";

export default function App() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  return (
    <div style={{ padding: 20 }}>
      <h1>{seconds}s</h1>
      <button onClick={() => setRunning(r => !r)}>
        {running ? "⏸ Пауза" : "▶ Старт"}
      </button>
      <button onClick={() => setSeconds(0)}>Сброс</button>
    </div>
  );
}
`),
          },
          {
            title: "Слушатель размера окна",
            code: r(`
import { useState, useEffect } from "react";

export default function App() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Ширина окна: {width}px</h2>
      <p>Поменяй размер окна — значение обновится.</p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "lists-keys",
        title: "Списки и ключи",
        description: "map, key, reconciliation",
        theory: r(`
Для рендера списков используется \`.map()\`. **Каждому элементу нужен уникальный prop \`key\`** — он помогает React эффективно обновлять DOM.

**Правила key:**
- Уникален среди сиблингов (не глобально)
- Стабилен между рендерами (один элемент — один key)
- \`key={index}\` — антипаттерн, если список меняется (вставки/удаления/сортировка)
- Лучший key — это id из данных

**Что произойдёт без key или с неправильным key:**
- React будет переиспользовать DOM-узлы и состояние не там, где нужно
- Сломаются анимации, фокус, локальный state дочерних компонентов
        `),
        examples: [
          {
            title: "Правильный key из id",
            code: r(`
import { useState } from "react";

export default function App() {
  const [users] = useState([
    { id: "u1", name: "Алиса" },
    { id: "u2", name: "Боб" },
    { id: "u3", name: "Чарли" },
  ]);

  return (
    <ul>
      {users.map(u => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}
`),
          },
        ],
      },
      {
        id: "events",
        title: "События",
        description: "SyntheticEvent, обработчики",
        theory: r(`
React оборачивает нативные DOM-события в **SyntheticEvent** — кросс-браузерную обёртку с одинаковым API.

**Особенности:**
- Имена в camelCase: \`onClick\`, \`onChange\`, \`onSubmit\`
- В обработчик передаётся объект события: \`(e) => { e.preventDefault() }\`
- React делает **делегирование событий** на root-узле — навешивает один listener на корень

**Самые частые методы события:**
- \`e.preventDefault()\` — отменить дефолтное поведение (например, submit формы)
- \`e.stopPropagation()\` — остановить всплытие
- \`e.target.value\` — значение элемента (для input)
- \`e.currentTarget\` — элемент, на котором висит обработчик
        `),
        examples: [
          {
            title: "Форма с preventDefault",
            code: r(`
import { useState } from "react";

export default function App() {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(name);
    setName("");
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 20 }}>
      <input
        placeholder="Имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button type="submit">Отправить</button>
      {submitted && <p>Отправлено: {submitted}</p>}
    </form>
  );
}
`),
          },
        ],
      },
      {
        id: "controlled-uncontrolled",
        title: "Controlled vs Uncontrolled",
        description: "Управляемые и неуправляемые компоненты",
        theory: r(`
**Controlled (управляемый):** value хранится в React state, изменения идут через onChange. React — единый источник истины.

\`<input value={text} onChange={e => setText(e.target.value)} />\`

**Uncontrolled (неуправляемый):** значение живёт в DOM, читается через ref. React не следит за каждым нажатием.

\`<input ref={inputRef} defaultValue="" />\` → \`inputRef.current.value\`

**Когда использовать что:**
- Controlled — нужна валидация, динамический disable кнопки, форматирование на лету
- Uncontrolled — большая форма с одним submit, интеграция с не-React кодом, файловый input (он всегда uncontrolled)
        `),
        examples: [
          {
            title: "Controlled input",
            code: r(`
import { useState } from "react";

export default function App() {
  const [text, setText] = useState("");
  return (
    <div style={{ padding: 20 }}>
      <input value={text} onChange={e => setText(e.target.value)} />
      <p>Длина: {text.length}</p>
      <button disabled={text.length < 3}>
        Submit (нужно минимум 3 символа)
      </button>
    </div>
  );
}
`),
          },
          {
            title: "Uncontrolled через ref",
            code: r(`
import { useRef } from "react";

export default function App() {
  const inputRef = useRef(null);

  const handleSubmit = () => {
    alert("Значение: " + inputRef.current.value);
  };

  return (
    <div style={{ padding: 20 }}>
      <input ref={inputRef} defaultValue="hello" />
      <button onClick={handleSubmit}>Прочитать</button>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "fragments-portals-errors",
        title: "Fragments, Portals, Error Boundaries",
        description: "Полезные обёртки React",
        theory: r(`
**Fragment** \`<>...</>\` — группирует элементы без добавления узла в DOM. Полезно, когда нужно вернуть несколько корней.

**Portal** — рендерит дочерние элементы в произвольный DOM-узел вне иерархии родителя. Используется для модалок, тултипов, toast'ов — чтобы они не страдали от \`overflow: hidden\` родителя.

\`createPortal(<Modal />, document.body)\`

**Error Boundary** — компонент-класс, который ловит ошибки рендера в поддереве и показывает fallback. Только классы, реализующие \`getDerivedStateFromError\` или \`componentDidCatch\`. Не ловит: ошибки в обработчиках событий, async-ошибки, ошибки в самом ErrorBoundary.
        `),
        examples: [
          {
            title: "Portal-модалка",
            code: r(`
import { useState } from "react";
import { createPortal } from "react-dom";

function Modal({ onClose }) {
  return createPortal(
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.6)",
      display: "grid", placeItems: "center"
    }}>
      <div style={{ background: "#222", color: "white", padding: 24, borderRadius: 8 }}>
        <h2>Модалка через Portal</h2>
        <button onClick={onClose}>Закрыть</button>
      </div>
    </div>,
    document.body
  );
}

export default function App() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => setOpen(true)}>Открыть</button>
      {open && <Modal onClose={() => setOpen(false)} />}
    </div>
  );
}
`),
          },
        ],
      },
    ],
  },
  {
    id: "hooks",
    emoji: "🟡",
    title: "Hooks глубоко",
    description: "Всё о хуках — это 80% современного React",
    topics: [
      {
        id: "useref",
        title: "useRef",
        description: "Доступ к DOM, хранение значений без ре-рендера",
        theory: r(`
**useRef** возвращает изменяемый объект \`{ current: value }\`, который сохраняется между рендерами и **не вызывает ре-рендер** при изменении.

**Два основных применения:**
1. **Доступ к DOM-узлу:** \`const ref = useRef(null); <input ref={ref} />\` → \`ref.current.focus()\`
2. **Хранение значений** между рендерами без триггера ре-рендера: предыдущее значение, id таймера, флаг «уже обработали»

**Не используй useRef как state** — изменение \`current\` не вызывает рендер.
        `),
        examples: [
          {
            title: "Фокус на input",
            code: r(`
import { useRef } from "react";

export default function App() {
  const inputRef = useRef(null);
  return (
    <div style={{ padding: 20 }}>
      <input ref={inputRef} placeholder="Кликни кнопку →" />
      <button onClick={() => inputRef.current?.focus()}>
        Сфокусировать
      </button>
    </div>
  );
}
`),
          },
          {
            title: "Счётчик рендеров",
            code: r(`
import { useRef, useState, useEffect } from "react";

export default function App() {
  const [count, setCount] = useState(0);
  const renders = useRef(0);

  useEffect(() => {
    renders.current += 1;
  });

  return (
    <div style={{ padding: 20 }}>
      <p>count: {count}</p>
      <p>Рендеров было: {renders.current}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "usememo",
        title: "useMemo",
        description: "Мемоизация вычислений",
        theory: r(`
**useMemo** запоминает результат функции и возвращает закешированное значение, пока не изменятся зависимости.

\`const value = useMemo(() => expensiveCalc(a, b), [a, b]);\`

**Когда нужен:**
- Тяжёлые вычисления (фильтрация большого массива, парсинг)
- Стабильная ссылка на объект/массив, передаваемый в memo-компонент или в зависимости useEffect

**Когда НЕ нужен:**
- Простые операции (\`a + b\`) — useMemo дороже, чем сам подсчёт
- "На всякий случай" — добавь только когда увидишь тормоза
        `),
        examples: [
          {
            title: "Мемоизация фильтрации",
            code: r(`
import { useState, useMemo } from "react";

const ITEMS = Array.from({ length: 5000 }, (_, i) => "Item " + i);

export default function App() {
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(0);

  const filtered = useMemo(() => {
    console.log("filter run");
    return ITEMS.filter(x => x.includes(query));
  }, [query]);

  return (
    <div style={{ padding: 20 }}>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="filter..." />
      <button onClick={() => setCount(c => c + 1)}>
        ре-рендер ({count})
      </button>
      <p>Найдено: {filtered.length}</p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "usecallback",
        title: "useCallback",
        description: "Мемоизация функций",
        theory: r(`
**useCallback** возвращает мемоизированную версию функции — стабильную ссылку, которая не меняется между рендерами, пока не изменятся зависимости.

\`const onClick = useCallback(() => { ... }, [deps]);\`

Это \`useMemo(() => fn, deps)\` — но для функций.

**Когда нужен:**
- Функция передаётся в \`React.memo\`-компонент как prop
- Функция — зависимость \`useEffect\`/\`useMemo\`/другого \`useCallback\`
- Функция передаётся в кастомный хук, который чувствителен к ссылкам

**Не нужен**, если функция используется только локально и не передаётся в memo/effect.
        `),
        examples: [
          {
            title: "useCallback + React.memo",
            code: r(`
import { useState, useCallback, memo } from "react";

const Child = memo(function Child({ onClick }) {
  console.log("Child render");
  return <button onClick={onClick}>Child кнопка</button>;
});

export default function App() {
  const [count, setCount] = useState(0);
  const [other, setOther] = useState(0);

  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <p>count: {count}, other: {other}</p>
      <Child onClick={handleClick} />
      <button onClick={() => setOther(o => o + 1)}>
        изменить other (Child не должен ре-рендериться)
      </button>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "usecontext",
        title: "useContext",
        description: "Контекст без prop drilling",
        theory: r(`
**Context** позволяет передавать данные через всё дерево компонентов, минуя пропсы.

**Шаги:**
1. Создать контекст: \`const ThemeContext = createContext("light")\`
2. Обернуть поддерево: \`<ThemeContext.Provider value="dark">...\`
3. Прочитать в любом потомке: \`const theme = useContext(ThemeContext)\`

**Подводные камни:**
- При смене value ре-рендерятся все потребители — для частых обновлений лучше Zustand/Redux
- Передавай в value стабильную ссылку (useMemo), если это объект
        `),
        examples: [
          {
            title: "Тема через Context",
            code: r(`
import { createContext, useContext, useState } from "react";

const ThemeContext = createContext("light");

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return (
    <button style={{
      background: theme === "dark" ? "#222" : "#eee",
      color: theme === "dark" ? "white" : "black",
      padding: "8px 16px",
      border: "none",
      borderRadius: 4,
    }}>
      Кнопка темы: {theme}
    </button>
  );
}

export default function App() {
  const [theme, setTheme] = useState("light");
  return (
    <ThemeContext.Provider value={theme}>
      <div style={{ padding: 20 }}>
        <button onClick={() => setTheme(t => t === "light" ? "dark" : "light")}>
          переключить
        </button>
        <ThemedButton />
      </div>
    </ThemeContext.Provider>
  );
}
`),
          },
        ],
      },
      {
        id: "usereducer",
        title: "useReducer",
        description: "Сложный state, паттерн reducer",
        theory: r(`
**useReducer** — альтернатива useState для сложного state с несколькими переходами.

\`const [state, dispatch] = useReducer(reducer, initialState);\`

**Reducer** — pure-функция \`(state, action) => newState\`. Action обычно \`{ type: "...", payload: ... }\`.

**Когда брать useReducer вместо useState:**
- State — объект с многими полями, обновляемыми по-разному
- Следующий state зависит от текущего сложным способом
- Логика обновлений раскидана по компоненту — хочется собрать в одном месте
        `),
        examples: [
          {
            title: "Счётчик через reducer",
            code: r(`
import { useReducer } from "react";

function reducer(state, action) {
  switch (action.type) {
    case "inc": return { count: state.count + 1 };
    case "dec": return { count: state.count - 1 };
    case "reset": return { count: 0 };
    case "set": return { count: action.payload };
    default: return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <div style={{ padding: 20 }}>
      <h1>{state.count}</h1>
      <button onClick={() => dispatch({ type: "inc" })}>+</button>
      <button onClick={() => dispatch({ type: "dec" })}>-</button>
      <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
      <button onClick={() => dispatch({ type: "set", payload: 100 })}>=100</button>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "uselayouteffect",
        title: "useLayoutEffect",
        description: "Отличие от useEffect",
        theory: r(`
**useLayoutEffect** — синхронный эффект, который запускается **до отрисовки** браузером. \`useEffect\` запускается **после**.

| | useEffect | useLayoutEffect |
|---|---|---|
| Когда | После paint | До paint (синхронно) |
| Блокирует UI | Нет | Да |
| Применение | 95% случаев | Измерение DOM, синхронные правки лейаута |

**Используй useLayoutEffect только когда:**
- Нужно прочитать размер/позицию узла и сразу обновить state, чтобы избежать мерцания
- Синхронизировать DOM-мутацию с рендером

В остальных случаях \`useEffect\` — лучше для производительности.
        `),
        examples: [
          {
            title: "Измерение DOM",
            code: r(`
import { useState, useRef, useLayoutEffect } from "react";

export default function App() {
  const boxRef = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    setWidth(boxRef.current.offsetWidth);
  });

  return (
    <div style={{ padding: 20 }}>
      <div ref={boxRef} style={{ width: "60%", background: "#333", color: "white", padding: 12 }}>
        Я измеряюсь
      </div>
      <p>Ширина: {width}px</p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "useid-deferred-transition",
        title: "useId, useDeferredValue, useTransition",
        description: "Новые хуки React 18",
        theory: r(`
**useId** — генерирует уникальный стабильный id, безопасный для SSR. Используй для связывания label/input.

**useTransition** — помечает обновление как "не срочное". UI остаётся отзывчивым.
\`const [isPending, startTransition] = useTransition();\`
\`startTransition(() => setHeavyState(...))\`

**useDeferredValue** — отложенная версия значения. Похоже на debounce, но без таймера: React сам решает, когда обновить.
\`const deferred = useDeferredValue(value);\`
        `),
        examples: [
          {
            title: "useTransition для тяжёлого списка",
            code: r(`
import { useState, useTransition } from "react";

const big = Array.from({ length: 10000 }, (_, i) => "Item " + i);

export default function App() {
  const [q, setQ] = useState("");
  const [filtered, setFiltered] = useState(big);
  const [isPending, startTransition] = useTransition();

  const onChange = (e) => {
    const v = e.target.value;
    setQ(v);
    startTransition(() => {
      setFiltered(big.filter(x => x.includes(v)));
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <input value={q} onChange={onChange} placeholder="Введи цифру" />
      {isPending && <span> загрузка...</span>}
      <p>Найдено: {filtered.length}</p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "custom-hooks",
        title: "Кастомные хуки",
        description: "Правила, примеры написания",
        theory: r(`
**Кастомный хук** — обычная функция, которая начинается с \`use\` и может использовать другие хуки. Способ переиспользовать логику между компонентами.

**Правила:**
1. Имя начинается с \`use\` — иначе линтер не отследит порядок вызовов
2. Хуки вызываются на верхнем уровне, не в условиях/циклах
3. Хуки вызываются только из React-компонентов или других хуков

**Что обычно выносят в хук:**
- Подписки и работа с window (useWindowSize)
- localStorage синхронизация (useLocalStorage)
- Fetch с состояниями (useFetch)
- Дебаунс значения (useDebounce)
        `),
        examples: [
          {
            title: "useLocalStorage",
            code: r(`
import { useState, useEffect } from "react";

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

export default function App() {
  const [name, setName] = useLocalStorage("user-name", "");
  return (
    <div style={{ padding: 20 }}>
      <input value={name} onChange={e => setName(e.target.value)} />
      <p>Сохраняется в localStorage — обнови страницу!</p>
    </div>
  );
}
`),
          },
        ],
      },
    ],
  },
  {
    id: "state-mgmt",
    emoji: "🟠",
    title: "State Management",
    description: "Управление глобальным состоянием",
    topics: [
      {
        id: "context-api",
        title: "Context API",
        description: "Provider, Consumer, оптимизация",
        theory: r(`
**Context** — встроенный механизм передачи данных через дерево. Хорош для редко меняющихся глобальных значений: тема, локаль, текущий пользователь.

**Оптимизация:**
- Разделяй контексты по природе данных (отдельно тема и пользователь)
- Мемоизируй value: \`<Ctx.Provider value={useMemo(() => ({a, b}), [a, b])}>\`
- Для часто меняющихся данных — лучше Zustand/Redux, иначе всё дерево ре-рендерится
        `),
        examples: [
          {
            title: "Контекст пользователя",
            code: r(`
import { createContext, useContext, useState, useMemo } from "react";

const UserCtx = createContext(null);

function useUser() {
  const ctx = useContext(UserCtx);
  if (!ctx) throw new Error("useUser must be inside UserProvider");
  return ctx;
}

function Header() {
  const { user, logout } = useUser();
  return (
    <header style={{ padding: 10, borderBottom: "1px solid #444" }}>
      Привет, {user.name} <button onClick={logout}>выйти</button>
    </header>
  );
}

export default function App() {
  const [user, setUser] = useState({ name: "Даня" });

  const value = useMemo(
    () => ({ user, logout: () => setUser({ name: "Гость" }) }),
    [user]
  );

  return (
    <UserCtx.Provider value={value}>
      <Header />
    </UserCtx.Provider>
  );
}
`),
          },
        ],
      },
      {
        id: "zustand",
        title: "Zustand",
        description: "Базовый стор, actions, selectors",
        theory: r(`
**Zustand** — минималистичный стейт-менеджер. Один хук, без провайдеров.

\`\`\`js
import { create } from "zustand";

const useStore = create((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
}));
\`\`\`

Чтобы избежать лишних ре-рендеров, **используй селекторы**: \`useStore(s => s.count)\` — компонент перерисуется только при изменении \`count\`.

В этом примере мы не подключаем Zustand, но логика та же.
        `),
        examples: [
          {
            title: "Имитация Zustand-стора через useSyncExternalStore",
            code: r(`
import { useSyncExternalStore } from "react";

function createStore(initial) {
  let state = initial;
  const subs = new Set();
  return {
    get: () => state,
    set: (fn) => { state = fn(state); subs.forEach(s => s()); },
    subscribe: (cb) => { subs.add(cb); return () => subs.delete(cb); },
  };
}

const store = createStore({ count: 0 });
const useCount = () =>
  useSyncExternalStore(store.subscribe, () => store.get().count);

export default function App() {
  const count = useCount();
  return (
    <div style={{ padding: 20 }}>
      <h1>{count}</h1>
      <button onClick={() => store.set(s => ({ count: s.count + 1 }))}>+</button>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "react-query",
        title: "React Query (TanStack)",
        description: "Серверный state",
        theory: r(`
**React Query** управляет серверным состоянием: кэширует, инвалидирует, дедуплицирует запросы, повторяет при ошибках.

\`\`\`js
const { data, isLoading, error } = useQuery({
  queryKey: ["users"],
  queryFn: () => fetch("/api/users").then(r => r.json()),
});
\`\`\`

**Ключевые понятия:**
- **queryKey** — уникальный ключ кеша, реагирует на изменения как deps в useEffect
- **staleTime** — сколько данные считаются "свежими" (не перезапрашиваются)
- **cacheTime** — сколько хранить в кеше после анмаунта
- **useMutation** — для POST/PUT/DELETE, с инвалидацией кеша после успеха
        `),
        examples: [
          {
            title: "Ручная имитация fetch с состояниями",
            code: r(`
import { useState, useEffect } from "react";

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch("https://jsonplaceholder.typicode.com/users/1")
      .then(r => r.json())
      .then(d => { if (alive) { setData(d); setLoading(false); } })
      .catch(e => { if (alive) { setError(e); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p>Ошибка</p>;
  return (
    <div style={{ padding: 20 }}>
      <h2>{data.name}</h2>
      <p>{data.email}</p>
    </div>
  );
}
`),
          },
        ],
      },
    ],
  },
  {
    id: "perf",
    emoji: "🔴",
    title: "Производительность",
    description: "React под капотом и оптимизации",
    topics: [
      {
        id: "react-memo",
        title: "React.memo",
        description: "Когда помогает, когда нет",
        theory: r(`
**React.memo** — HOC, который пропускает ре-рендер компонента, если props не изменились (по shallow compare).

\`const MyComp = memo(function MyComp(props) { ... })\`

**Помогает, когда:**
- Компонент часто получает одни и те же props при ре-рендере родителя
- Внутри тяжёлый рендер

**НЕ помогает / даже вредит:**
- Props всегда новые (объекты/функции без useMemo/useCallback)
- Компонент маленький — затраты на сравнение больше, чем экономия
- Внутри много children-нод (shallow check скажет "разные ссылки")
        `),
        examples: [
          {
            title: "memo пропускает ре-рендер",
            code: r(`
import { useState, memo } from "react";

const Child = memo(function Child({ value }) {
  console.log("Child render with", value);
  return <p>value: {value}</p>;
});

export default function App() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);

  return (
    <div style={{ padding: 20 }}>
      <Child value={a} />
      <p>b: {b}</p>
      <button onClick={() => setA(a + 1)}>a (Child ре-рендерится)</button>
      <button onClick={() => setB(b + 1)}>b (Child НЕ ре-рендерится)</button>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "code-splitting",
        title: "Code Splitting",
        description: "React.lazy, Suspense",
        theory: r(`
**Code splitting** разбивает бандл на чанки, чтобы загружать код по требованию.

\`\`\`js
const Heavy = lazy(() => import("./Heavy"));

<Suspense fallback={<Spinner />}>
  <Heavy />
</Suspense>
\`\`\`

Чанк скачается, только когда \`<Heavy />\` появится в дереве. Идеально для:
- Страниц в роутере (\`lazy(() => import("./pages/Settings"))\`)
- Тяжёлых модалок, графиков, редакторов кода
        `),
        examples: [
          {
            title: "Базовый Suspense (без реального lazy)",
            code: r(`
import { Suspense, useState } from "react";

function Heavy() {
  return <p>📦 Тяжёлый компонент загружен</p>;
}

export default function App() {
  const [show, setShow] = useState(false);
  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => setShow(true)}>загрузить</button>
      {show && (
        <Suspense fallback={<p>Loading...</p>}>
          <Heavy />
        </Suspense>
      )}
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "virtual-dom",
        title: "Virtual DOM",
        description: "Diffing, reconciliation",
        theory: r(`
**Virtual DOM** — лёгкое JS-представление UI. React сравнивает старое и новое VDOM-дерево и применяет минимальные изменения в реальный DOM.

**Алгоритм reconciliation:**
1. Сравнение по типу: \`<div>\` vs \`<span>\` → полный рестарт поддерева
2. Сравнение детей по позиции — отсюда важность \`key\` в списках
3. Текстовые и атрибутные изменения применяются точечно

**Fiber** (React 16+) — переписанный reconciler, позволяющий прерывать и приоритизировать работу. Основа для Concurrent Mode.
        `),
        examples: [
          {
            title: "Иллюстрация diffing'а",
            code: r(`
import { useState } from "react";

export default function App() {
  const [order, setOrder] = useState(["A", "B", "C"]);

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => setOrder([...order].reverse())}>reverse</button>
      <ul>
        {order.map(x => (
          <li key={x}>
            <input defaultValue={x} />
          </li>
        ))}
      </ul>
      <p>Без key={"{x}"} state input'ов перепутается!</p>
    </div>
  );
}
`),
          },
        ],
      },
    ],
  },
  {
    id: "routing",
    emoji: "🟣",
    title: "Роутинг",
    description: "Навигация в SPA",
    topics: [
      {
        id: "react-router",
        title: "React Router v6",
        description: "Routes, Route, Outlet",
        theory: r(`
**React Router v6** — стандарт SPA-роутинга в React.

\`\`\`jsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/users/:id" element={<User />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
\`\`\`

**Ключевые элементы:**
- \`<Link to="/path">\` — навигация без перезагрузки
- \`<NavLink>\` — добавляет active-класс
- \`<Outlet />\` — слот для вложенных роутов
- \`useNavigate()\` — программная навигация
- \`useParams()\` — параметры URL
- \`useSearchParams()\` — query-параметры

Эта учебная платформа сама использует React Router — посмотри [App.tsx](src/App.tsx).
        `),
        examples: [],
      },
    ],
  },
  {
    id: "forms",
    emoji: "🟢",
    title: "Формы",
    description: "Работа с формами и валидацией",
    topics: [
      {
        id: "rhf",
        title: "React Hook Form",
        description: "register, handleSubmit, errors",
        theory: r(`
**React Hook Form** — производительная либа форм. Минимум ре-рендеров (uncontrolled под капотом), небольшой размер, удобный API.

\`\`\`jsx
const { register, handleSubmit, formState: { errors } } = useForm();

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register("email", { required: true })} />
  {errors.email && <p>обязательно</p>}
</form>
\`\`\`

В связке с **Zod** через \`zodResolver\` — типобезопасная схема валидации.
        `),
        examples: [
          {
            title: "Ручная валидация (без либы)",
            code: r(`
import { useState } from "react";

export default function App() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Введите корректный email");
      return;
    }
    setError("");
    alert("OK: " + email);
  };

  return (
    <form onSubmit={submit} style={{ padding: 20 }}>
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="email"
      />
      {error && <p style={{ color: "tomato" }}>{error}</p>}
      <button>Submit</button>
    </form>
  );
}
`),
          },
        ],
      },
    ],
  },
  {
    id: "typescript",
    emoji: "🔷",
    title: "TypeScript + React",
    description: "Типизация компонентов",
    topics: [
      {
        id: "props-types",
        title: "Props типы",
        description: "FC, ReactNode, JSX.Element",
        theory: r(`
**Типизация props:**

\`\`\`ts
type Props = {
  title: string;
  count?: number;
  onClick: (id: string) => void;
  children: React.ReactNode;
};

function Card({ title, children, onClick }: Props) { ... }
\`\`\`

**ReactNode vs JSX.Element:**
- \`ReactNode\` — всё, что может рендериться: JSX, строки, числа, null, массивы → используй для \`children\`
- \`JSX.Element\` — конкретно результат JSX → реже нужен явно

**FC<Props>** — устаревший паттерн (раньше неявно добавлял children). Сейчас принято просто типизировать аргумент функции.
        `),
        examples: [],
      },
      {
        id: "event-types",
        title: "Типизация событий",
        description: "ChangeEvent, MouseEvent",
        theory: r(`
**Часто используемые типы:**

\`\`\`ts
onChange={(e: React.ChangeEvent<HTMLInputElement>) => ...}
onClick={(e: React.MouseEvent<HTMLButtonElement>) => ...}
onSubmit={(e: React.FormEvent<HTMLFormElement>) => ...}
onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => ...}
\`\`\`

Если inline-функция передаётся напрямую в JSX, TS обычно сам выводит типы — указывать явно нужно только когда выносишь обработчик в отдельную функцию.
        `),
        examples: [],
      },
    ],
  },
];

// Плоский список всех топиков (удобно для роутинга)
export const allTopics: Topic[] = blocks.flatMap((b) => b.topics);

export function findTopic(id: string): Topic | undefined {
  return allTopics.find((t) => t.id === id);
}

export function findBlockOf(topicId: string): Block | undefined {
  return blocks.find((b) => b.topics.some((t) => t.id === topicId));
}
