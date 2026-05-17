export type TopicStatus = "done" | "review" | "skip" | "todo";

export interface CodeExample {
  title: string;
  description?: string;
  code: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  theory: string;
  examples: CodeExample[];
  links?: { title: string; url: string }[];
  quiz?: QuizQuestion[];
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
    id: "react",
    emoji: "⚛️",
    title: "React",
    description: "Всё про React — от JSX и хуков до производительности и TypeScript",
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
      // ─── New topics sourced from the Obsidian "Brain" vault ──────────────
      // For each entry below, full content lives in src/content/react/<id>.md
      // and is rendered by TopicPage via getBrainNote(topic.id).
      { id: "hook-types", title: "Типизация хуков", description: "useState, useRef, useReducer — типы и дженерики", theory: "", examples: [] },
      { id: "utility-types", title: "Utility types", description: "Partial, Pick, Omit, Record, ReturnType", theory: "", examples: [] },
      { id: "generic-components", title: "Generic компоненты", description: "Параметризованные компоненты на TypeScript", theory: "", examples: [] },
      { id: "render-props-hoc", title: "Render Props и HOC", description: "Классические паттерны переиспользования логики", theory: "", examples: [] },
      { id: "component-patterns", title: "Паттерны компонентов", description: "Compound components, slots, controlled/uncontrolled", theory: "", examples: [] },
      { id: "atomic-design", title: "Atomic Design", description: "Atoms, molecules, organisms — структура UI-библиотеки", theory: "", examples: [] },
      { id: "fsd", title: "Feature-Sliced Design", description: "Слои app/pages/widgets/features/entities/shared", theory: "", examples: [] },
      { id: "monorepo", title: "Monorepo", description: "pnpm workspaces, Turborepo, общие пакеты", theory: "", examples: [] },
      { id: "redux-toolkit", title: "Redux Toolkit", description: "createSlice, RTK Query, современный Redux", theory: "", examples: [] },
      { id: "jotai-recoil", title: "Jotai и Recoil", description: "Atomic state — альтернатива Redux/Zustand", theory: "", examples: [] },
      { id: "state-management-comparison", title: "Сравнение state-менеджеров", description: "Context vs Redux vs Zustand vs Jotai — когда что", theory: "", examples: [] },
      { id: "use-navigate-params", title: "useNavigate и useParams", description: "Навигация и параметры URL в React Router", theory: "", examples: [] },
      { id: "nested-routes", title: "Вложенные маршруты", description: "Outlet, layout-routes, индексные маршруты", theory: "", examples: [] },
      { id: "protected-routes", title: "Protected routes", description: "Защищённые маршруты, redirect для неавторизованных", theory: "", examples: [] },
      { id: "lazy-routes", title: "Lazy loading роутов", description: "React.lazy + Suspense для роутов", theory: "", examples: [] },
      { id: "use-field-array", title: "useFieldArray (RHF)", description: "Динамические массивы полей в React Hook Form", theory: "", examples: [] },
      { id: "controlled-vs-rhf", title: "Controlled forms vs RHF", description: "Когда хватает useState, а когда нужен RHF", theory: "", examples: [] },
      { id: "validation-zod-yup", title: "Валидация: Zod и Yup", description: "Схемы валидации форм и API-данных", theory: "", examples: [] },
      { id: "batching", title: "Batching (React 18)", description: "Автоматическая батчинг рендеров, flushSync", theory: "", examples: [] },
      { id: "concurrent-mode", title: "Concurrent режим", description: "useTransition, useDeferredValue, прерываемый рендер", theory: "", examples: [] },
      { id: "windowing", title: "Windowing (виртуализация)", description: "react-window / react-virtual для длинных списков", theory: "", examples: [] },
      { id: "profiling", title: "Профилирование", description: "React DevTools Profiler, поиск медленных рендеров", theory: "", examples: [] },
      { id: "jest", title: "Jest", description: "Запуск тестов, моки, snapshot-тесты", theory: "", examples: [] },
      { id: "vitest", title: "Vitest", description: "Тесты для Vite-проектов — Jest-совместимый раннер", theory: "", examples: [] },
      { id: "rtl", title: "React Testing Library", description: "Тестирование компонентов от лица пользователя", theory: "", examples: [] },
      { id: "render-hook", title: "renderHook", description: "Тестирование кастомных хуков через @testing-library/react", theory: "", examples: [] },
      { id: "integration-tests", title: "Интеграционные тесты", description: "Полные пользовательские сценарии в jsdom", theory: "", examples: [] },
      { id: "msw", title: "MSW (Mock Service Worker)", description: "Моки HTTP-запросов для тестов и dev", theory: "", examples: [] },
      { id: "storybook", title: "Storybook", description: "Изолированная разработка компонентов и визуальные тесты", theory: "", examples: [] },
      { id: "vite", title: "Vite", description: "Сборщик: dev-server на ESM, билд через Rollup", theory: "", examples: [] },
      { id: "eslint-prettier", title: "ESLint + Prettier", description: "Линтинг и форматирование кода", theory: "", examples: [] },
      { id: "husky-lint-staged", title: "Husky + lint-staged", description: "Git-хуки: автозапуск линтеров перед коммитом", theory: "", examples: [] },
      { id: "nextjs", title: "Next.js", description: "App Router, RSC, SSR/SSG/ISR — фреймворк поверх React", theory: "", examples: [] },
    ],
  },
  {
    id: "algorithms",
    emoji: "📘",
    title: "Грокаем алгоритмы",
    description: "База алгоритмов и структур данных через призму фронтенда",
    topics: [
      {
        id: "big-o",
        title: "Big O — нотация сложности",
        description: "Как читать O(1), O(n), O(n log n), O(n²)",
        theory: r(`
**Big O** — это **верхняя оценка скорости роста** числа операций при увеличении входа \`n\`. Не «сколько миллисекунд», а «как кривая ведёт себя на больших данных». Константы и младшие слагаемые отбрасываются: \`O(3n + 7)\` → \`O(n)\`.

\`\`\`
n = 10        n = 1000      n = 1_000_000
O(1)          1             1             1
O(log n)      ~3            ~10           ~20
O(n)          10            1 000         1 000 000
O(n log n)    ~30           ~10 000       ~20 000 000
O(n²)         100           1 000 000     10¹²  💀
O(2ⁿ)         1024          🔥            🔥
\`\`\`

**Шпаргалка по операциям JS:**

| Операция | Сложность |
|---|---|
| \`arr[i]\`, \`arr.push/pop\` | O(1) |
| \`arr.unshift/shift\` | **O(n)** — сдвигает все элементы |
| \`arr.includes/indexOf\` | O(n) |
| \`arr.sort()\` | O(n log n) |
| \`set.has/add/delete\` | O(1) средний |
| \`map.get/set/has\` | O(1) средний |
| Spread \`[...arr]\` | O(n) |

**Как считать сложность кода:**
- Один цикл по \`n\` → \`O(n)\`
- Вложенный цикл → \`O(n²)\`
- Цикл с делением пополам → \`O(log n)\`
- Рекурсия с двумя вызовами без мемо → \`O(2ⁿ)\`

**Подводные камни:**
- \`.includes\` внутри цикла превращает \`O(n)\` в \`O(n²)\` — лучше \`Set\`
- \`shift/unshift\` — это \`O(n)\` под капотом
- Spread в цикле — тоже \`O(n²)\`: \`result = [...result, x]\`

**Память тоже считается.** \`arr.reverse()\` — O(n) время, O(1) память. \`[...arr].reverse()\` — O(n)/O(n).
        `),
        examples: [
          {
            title: "Сравниваем O(n²) и O(n) на практике",
            code: r(`
import { useState } from "react";

// O(n²) — includes на каждой итерации
function uniqueSlow(arr) {
  const unique = [];
  for (const x of arr) if (!unique.includes(x)) unique.push(x);
  return unique;
}

// O(n) — Set
function uniqueFast(arr) {
  return [...new Set(arr)];
}

export default function App() {
  const [n, setN] = useState(2000);
  const [result, setResult] = useState(null);

  const run = () => {
    const arr = Array.from({ length: n }, () => Math.floor(Math.random() * (n / 2)));
    const t1 = performance.now();
    uniqueSlow(arr);
    const slow = performance.now() - t1;
    const t2 = performance.now();
    uniqueFast(arr);
    const fast = performance.now() - t2;
    setResult({ slow: slow.toFixed(2), fast: fast.toFixed(2), ratio: (slow / fast).toFixed(1) });
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <label>n = </label>
      <input type="number" value={n} onChange={e => setN(+e.target.value)} />
      <button onClick={run} style={{ marginLeft: 8 }}>Замерить</button>
      {result && (
        <div style={{ marginTop: 12 }}>
          <p>O(n²) includes: <b>{result.slow} ms</b></p>
          <p>O(n) Set:      <b>{result.fast} ms</b></p>
          <p>Разница: <b>×{result.ratio}</b></p>
        </div>
      )}
    </div>
  );
}
`),
          },
          {
            title: "Two Sum: O(n²) vs O(n)",
            code: r(`
export default function App() {
  // O(n²) — двойной цикл
  function twoSumSlow(nums, target) {
    for (let i = 0; i < nums.length; i++)
      for (let j = i + 1; j < nums.length; j++)
        if (nums[i] + nums[j] === target) return [i, j];
    return null;
  }

  // O(n) — Map: для каждого x ищем target - x
  function twoSumFast(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
      const need = target - nums[i];
      if (seen.has(need)) return [seen.get(need), i];
      seen.set(nums[i], i);
    }
    return null;
  }

  const nums = [2, 7, 11, 15, 3, 6, 8];
  const target = 17;

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <p>nums = [{nums.join(", ")}]</p>
      <p>target = {target}</p>
      <p>O(n²): {JSON.stringify(twoSumSlow(nums, target))}</p>
      <p>O(n):  {JSON.stringify(twoSumFast(nums, target))}</p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "binary-search",
        title: "Бинарный поиск",
        description: "O(log n) — повсюду: от виртуализации до git bisect",
        theory: r(`
Если массив **отсортирован**, не нужно пробегать его целиком: каждый раз делим пополам и спрашиваем «искомое больше или меньше середины?». За один шаг отсекается ровно половина.

Линейный поиск — до \`n\` сравнений. Бинарный — до \`log₂(n)\`. Для 1 000 000 элементов: **миллион vs 20**.

\`\`\`js
function binarySearch(sorted, target) {
  let low = 0;
  let high = sorted.length - 1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (sorted[mid] === target) return mid;
    if (sorted[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}
\`\`\`

**Где это во фронте:**
- **Виртуализация** (\`react-window\`, \`@tanstack/virtual\`) — найти, какой элемент сейчас сверху экрана по \`scrollTop\` среди известных \`offsets\`.
- **Insertion point** в отсортированных коллекциях — \`lowerBound\` для вставки сообщения в чат без полной пересортировки.
- **git bisect** — буквально бинарный поиск по истории коммитов.
- **Autocomplete** по отсортированному списку.

**Подводные камни:**
- Массив **обязательно** отсортирован — иначе случайный результат.
- Бесконечный цикл, если \`low = mid\` вместо \`mid + 1\`.
- \`"10" < "2"\` — JS сравнивает строки лексикографически.

**«Бинарный поиск по ответу»** — мощная техника: ищешь минимальную ширину колонки, при которой текст помещается без переноса в \`N\` строк, перебором по \`[1, maxWidth]\` с проверкой «помещается?».
        `),
        examples: [
          {
            title: "Интерактивный бинарный поиск",
            code: r(`
import { useState } from "react";

const arr = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25];

export default function App() {
  const [target, setTarget] = useState(13);
  const [steps, setSteps] = useState([]);

  const run = () => {
    const log = [];
    let low = 0, high = arr.length - 1;
    while (low <= high) {
      const mid = low + ((high - low) >> 1);
      log.push({ low, high, mid, value: arr[mid] });
      if (arr[mid] === target) { log.push({ found: mid }); break; }
      if (arr[mid] < target) low = mid + 1;
      else high = mid - 1;
    }
    if (!log.some(s => s.found !== undefined)) log.push({ found: -1 });
    setSteps(log);
  };

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <p>arr = [{arr.join(", ")}]</p>
      <label>target: </label>
      <input type="number" value={target} onChange={e => setTarget(+e.target.value)} />
      <button onClick={run} style={{ marginLeft: 8 }}>Найти</button>
      <ol style={{ marginTop: 12 }}>
        {steps.map((s, i) =>
          s.found !== undefined
            ? <li key={i}><b>{s.found >= 0 ? "Найдено на индексе " + s.found : "Не найдено"}</b></li>
            : <li key={i}>low={s.low}, high={s.high}, mid={s.mid} → arr[mid]={s.value}</li>
        )}
      </ol>
    </div>
  );
}
`),
          },
          {
            title: "lowerBound — куда вставить, чтобы сохранить порядок",
            code: r(`
import { useState } from "react";

function lowerBound(arr, target) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export default function App() {
  const [items, setItems] = useState([10, 20, 30, 40, 50]);
  const [val, setVal] = useState(25);

  const insert = () => {
    const idx = lowerBound(items, val);
    const next = [...items];
    next.splice(idx, 0, val);
    setItems(next);
  };

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <p>Массив: [{items.join(", ")}]</p>
      <input type="number" value={val} onChange={e => setVal(+e.target.value)} />
      <button onClick={insert} style={{ marginLeft: 8 }}>Вставить</button>
      <p>Позиция вставки {val}: <b>{lowerBound(items, val)}</b></p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "arrays-vs-lists",
        title: "Массивы vs Связные списки",
        description: "Кеш-локальность, LRU, React Fiber",
        theory: r(`
**Массив** — непрерывная область памяти. Адрес элемента вычисляется арифметикой → **доступ по индексу O(1)**. Вставка в начало — O(n) (сдвиг всех элементов).

**Связный список** — каждый узел хранит значение и указатель на следующий. Доступ по индексу — O(n). Вставка/удаление при наличии указателя на узел — **O(1)**.

| Операция | Массив | Связный список |
|---|---|---|
| Чтение по индексу | **O(1)** | O(n) |
| Вставка в начало | **O(n)** | **O(1)** |
| Вставка в середину | O(n) | O(1) с указателем |
| Удаление | O(n) | O(1) с указателем |
| Кеш-локальность | ✅ | ❌ |

**Где это во фронте:**
- **React Fiber** — связный список с указателями \`child\`, \`sibling\`, \`return\`. Reconciler обходит fiber-узлы итеративно, чтобы можно было прерываться (Concurrent Mode).
- **LRU-кеш** — двусвязный список + Map. Используется в \`swr\`, \`react-query\` для удаления старых записей.
- **Очередь эффектов** в React — тоже список.

**Подводные камни:**
- \`Array.prototype.shift\` — O(n) (сдвигает все индексы). Очередь на \`shift\` тормозит.
- У связного списка плохая кеш-локальность — на маленьких \`n\` массив почти всегда быстрее.
- Дырки в массиве (\`arr[10000] = x\`) → V8 переключается на hash-режим, доступ замедляется.

**LRU за O(1)** = двусвязный список + Map. Map даёт O(1) поиск узла, список даёт O(1) перемещение в начало и удаление с конца. Классический вопрос на мидл-собесе.
        `),
        examples: [
          {
            title: "LRU-кеш на двусвязном списке",
            code: r(`
import { useState } from "react";

class DNode {
  constructor(key, value) {
    this.key = key; this.value = value;
    this.prev = null; this.next = null;
  }
}

class LRU {
  constructor(capacity) {
    this.cap = capacity;
    this.map = new Map();
    this.head = new DNode();
    this.tail = new DNode();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }
  _remove(n) { n.prev.next = n.next; n.next.prev = n.prev; }
  _addFront(n) {
    n.next = this.head.next; n.prev = this.head;
    this.head.next.prev = n; this.head.next = n;
  }
  get(key) {
    if (!this.map.has(key)) return null;
    const n = this.map.get(key);
    this._remove(n); this._addFront(n);
    return n.value;
  }
  set(key, value) {
    if (this.map.has(key)) {
      const n = this.map.get(key);
      n.value = value;
      this._remove(n); this._addFront(n);
      return;
    }
    if (this.map.size === this.cap) {
      const lru = this.tail.prev;
      this._remove(lru); this.map.delete(lru.key);
    }
    const n = new DNode(key, value);
    this._addFront(n); this.map.set(key, n);
  }
  toArray() {
    const out = []; let cur = this.head.next;
    while (cur !== this.tail) { out.push([cur.key, cur.value]); cur = cur.next; }
    return out;
  }
}

const lru = new LRU(3);

export default function App() {
  const [, setTick] = useState(0);

  const action = (fn) => { fn(); setTick(t => t + 1); };

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <p>LRU capacity = 3</p>
      <button onClick={() => action(() => lru.set("A", 1))}>set A=1</button>
      <button onClick={() => action(() => lru.set("B", 2))}>set B=2</button>
      <button onClick={() => action(() => lru.set("C", 3))}>set C=3</button>
      <button onClick={() => action(() => lru.set("D", 4))}>set D=4 (выкинет хвост)</button>
      <button onClick={() => action(() => lru.get("A"))}>get A (в начало)</button>
      <p>Состояние (от свежего к старому):</p>
      <pre>{JSON.stringify(lru.toArray(), null, 2)}</pre>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "recursion",
        title: "Рекурсия",
        description: "База, шаг, стек вызовов, рекурсивные компоненты",
        theory: r(`
Любая рекурсивная функция = **база** (условие выхода) + **рекурсивный шаг** (вызов себя с меньшим аргументом). Без базы — \`Maximum call stack size exceeded\`.

Каждый вызов кладёт «фрейм» на стек. JS-движок держит ~10 000–20 000 фреймов. Глубокая рекурсия по большим данным → \`RangeError\`.

**Когда рекурсия — естественное решение:** данные сами рекурсивны — деревья, JSON, AST, DOM, файловая система.

**Рекурсивный компонент** во фронте — это меню с подменю, дерево комментариев, файловое дерево:

\`\`\`jsx
function MenuItem({ item }) {
  return (
    <li>
      {item.label}
      {item.children?.length > 0 && (
        <ul>
          {item.children.map(c => <MenuItem key={c.id} item={c} />)}
        </ul>
      )}
    </li>
  );
}
\`\`\`

**Divide & Conquer** — рекурсивная стратегия: раздели → реши → объедини. Так устроены Quicksort, Mergesort, бинарный поиск, и React diff поддеревьев.

**Подводные камни:**
- Забыл базу или база не достигается → переполнение стека.
- Лишние пересчёты: \`fib(n)\` без мемо — O(2ⁿ).
- Мутация общих структур внутри рекурсии — соседи увидят изменения.

**React Fiber отказался от рекурсии.** В React 16 reconciler переписан с рекурсии на итеративный обход линкед-листа fiber-узлов. Цель — возможность прерывать работу (Concurrent Mode).
        `),
        examples: [
          {
            title: "Рекурсивный компонент: дерево комментариев",
            code: r(`
const thread = {
  id: 1, author: "Аня", text: "Тема обсуждения", likes: 3,
  replies: [
    { id: 2, author: "Боб", text: "Согласен", likes: 1, replies: [
      { id: 4, author: "Аня", text: "Спасибо", likes: 5, replies: [] },
    ]},
    { id: 3, author: "Чарли", text: "А я нет", likes: 0, replies: [] },
  ],
};

function Comment({ node, depth = 0 }) {
  return (
    <div style={{ marginLeft: depth * 24, padding: 8, borderLeft: "2px solid #444" }}>
      <b>{node.author}</b> · ❤ {node.likes}
      <div>{node.text}</div>
      {node.replies.map(child => (
        <Comment key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

function totalLikes(node) {
  let sum = node.likes;
  for (const c of node.replies) sum += totalLikes(c);
  return sum;
}

export default function App() {
  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h3>Всего лайков: {totalLikes(thread)}</h3>
      <Comment node={thread} />
    </div>
  );
}
`),
          },
          {
            title: "deepFlatten: рекурсия vs итерация через стек",
            code: r(`
import { useState } from "react";

function deepFlatten(arr) {
  const out = [];
  for (const x of arr) {
    if (Array.isArray(x)) out.push(...deepFlatten(x));
    else out.push(x);
  }
  return out;
}

function deepFlattenIter(arr) {
  const out = [];
  const stack = [arr];
  while (stack.length) {
    const top = stack.pop();
    for (const x of top) {
      if (Array.isArray(x)) stack.push(x);
      else out.unshift(x);
    }
  }
  return out;
}

export default function App() {
  const input = [1, [2, [3, [4, [5, [6]]]]], 7];
  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <p>Вход: {JSON.stringify(input)}</p>
      <p>Рекурсия: {JSON.stringify(deepFlatten(input))}</p>
      <p>Стек: {JSON.stringify(deepFlattenIter(input))}</p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "quicksort",
        title: "Быстрая сортировка",
        description: "Divide & conquer, Quickselect, что под капотом sort()",
        theory: r(`
**Quicksort** = классика divide & conquer:
1. Выбираем **опорный элемент (pivot)**.
2. Делим массив на части: \`< pivot\`, \`= pivot\`, \`> pivot\`.
3. Рекурсивно сортируем обе.
4. Склеиваем.

| | Время | Память |
|---|---|---|
| Лучший / Средний | **O(n log n)** | O(log n) |
| Худший (плохой pivot) | O(n²) | O(n) |

**Худший случай** — когда pivot всё время минимум/максимум (отсортированный массив + pivot = первый элемент). Лечится случайным выбором или «медианой трёх».

**Где это во фронте:**
- Прямо — почти нигде, есть \`Array.prototype.sort\`.
- **V8 использует Timsort** (merge + insertion), не quicksort.
- **Quickselect** — найти k-й по величине за среднее O(n). «Топ-3 пользователя по активности» без полной сортировки.
- Идея divide & conquer применима к React reconciliation.

**Сравнение базовых сортировок:**

| Алгоритм | Среднее | Худшее | Память | Стабильна? |
|---|---|---|---|---|
| Quicksort | O(n log n) | O(n²) | O(log n) | ❌ |
| Mergesort | O(n log n) | O(n log n) | O(n) | ✅ |
| \`Array.sort\` (Timsort) | O(n log n) | O(n log n) | O(n) | ✅ |

**Подводные камни sort():**
- \`[10, 2, 1].sort()\` → \`[1, 10, 2]\` — лексикографически! Нужен компаратор \`(a, b) => a - b\`.
- \`sort\` мутирует массив (\`toSorted\` в ES2023 — копирующий).
- \`(a, b) => a > b\` неверно — нужно число (-1/0/1).
        `),
        examples: [
          {
            title: "Quicksort с тремя массивами (для собеса)",
            code: r(`
import { useState } from "react";

function quicksort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[arr.length >> 1];
  const left = [], right = [], equal = [];
  for (const x of arr) {
    if (x < pivot) left.push(x);
    else if (x > pivot) right.push(x);
    else equal.push(x);
  }
  return [...quicksort(left), ...equal, ...quicksort(right)];
}

export default function App() {
  const [arr, setArr] = useState([5, 2, 9, 1, 5, 6, 3, 8, 7, 4, 5]);
  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <p>Вход:  [{arr.join(", ")}]</p>
      <p>Выход: [{quicksort(arr).join(", ")}]</p>
      <button onClick={() => setArr(Array.from({ length: 10 }, () => Math.floor(Math.random() * 100)))}>
        Случайные
      </button>
    </div>
  );
}
`),
          },
          {
            title: "Quickselect: k-й по величине за O(n)",
            code: r(`
function partition(arr, lo, hi) {
  const pivot = arr[hi];
  let i = lo;
  for (let j = lo; j < hi; j++) {
    if (arr[j] < pivot) { [arr[i], arr[j]] = [arr[j], arr[i]]; i++; }
  }
  [arr[i], arr[hi]] = [arr[hi], arr[i]];
  return i;
}

function quickselect(arr, k, lo = 0, hi = arr.length - 1) {
  if (lo === hi) return arr[lo];
  const p = partition(arr, lo, hi);
  if (k === p) return arr[p];
  return k < p ? quickselect(arr, k, lo, p - 1) : quickselect(arr, k, p + 1, hi);
}

export default function App() {
  const nums = [7, 2, 9, 1, 5, 6, 3, 8, 4];
  const sorted = [...nums].sort((a, b) => a - b);

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <p>Массив: [{nums.join(", ")}]</p>
      <p>Отсортированный: [{sorted.join(", ")}]</p>
      <p>3-й по величине (k=2): <b>{quickselect([...nums], 2)}</b></p>
      <p>Медиана (k=4): <b>{quickselect([...nums], 4)}</b></p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "hash-tables",
        title: "Хеш-таблицы",
        description: "Map, Set, кеш запросов, дедупликация, индексация",
        theory: r(`
Хеш-функция превращает ключ в число — индекс в массиве «корзин». Среднее время поиска — **O(1)**.

Иногда два разных ключа дают один индекс — **коллизия**. Когда коллизий много, таблица перехешируется: новый массив вдвое больше, всё переносится. Это O(n) единоразово, но амортизированно остаётся O(1).

**Map vs Set vs Object:**

| | Map | Set | Object |
|---|---|---|---|
| Ключи | любые | значения = ключи | строки/символы |
| Порядок | вставки | вставки | с оговорками |
| Размер | \`.size\` (O(1)) | \`.size\` (O(1)) | \`Object.keys(o).length\` (O(n)) |
| Сериализация в JSON | ❌ | ❌ | ✅ |

**Правило:** для логики/сторов — \`Map\`. Для DTO/JSON — \`Object\`.

**Где это во фронте:**
- **Кеш запросов** в \`react-query\`, \`swr\` — большая хеш-таблица: \`key → data\`.
- **Дедупликация:** \`[...new Set(arr)]\`.
- **Группировка / индексация** — заменяет \`O(n²) filter\` на \`O(n)\`.
- **Подсчёт частот** — \`Map<char, count>\`.
- **WeakMap** для «приватных» данных, привязанных к DOM-узлу.

**Подводные камни:**
- Объект как ключ работает по ссылке: \`m.set({id: 1}, "a"); m.get({id: 1})\` → \`undefined\`.
- \`Object\` ломается на ключах \`__proto__\`, \`constructor\`, \`hasOwnProperty\` — используй \`Map\` или \`Object.create(null)\`.
- \`JSON.stringify\` нестабилен по порядку ключей — для ключа кеша нормализуй.
        `),
        examples: [
          {
            title: "Замена O(n²) на O(n) индексом",
            code: r(`
const users = [
  { id: 1, name: "Аня" }, { id: 2, name: "Боб" }, { id: 3, name: "Чарли" },
];
const purchases = [
  { userId: 1, item: "Кофе" }, { userId: 2, item: "Чай" },
  { userId: 1, item: "Печенье" }, { userId: 3, item: "Вода" },
];

// O(n*m) — для каждого user ищем линейно
function slowJoin() {
  return users.map(u => ({
    ...u,
    purchases: purchases.filter(p => p.userId === u.id),
  }));
}

// O(n+m) — индексируем один раз
function fastJoin() {
  const byUser = new Map();
  for (const p of purchases) {
    if (!byUser.has(p.userId)) byUser.set(p.userId, []);
    byUser.get(p.userId).push(p);
  }
  return users.map(u => ({ ...u, purchases: byUser.get(u.id) ?? [] }));
}

export default function App() {
  return (
    <div style={{ padding: 20 }}>
      <h4>Через Map (O(n+m)):</h4>
      <pre>{JSON.stringify(fastJoin(), null, 2)}</pre>
    </div>
  );
}
`),
          },
          {
            title: "Подсчёт частот символов",
            code: r(`
import { useState } from "react";

export default function App() {
  const [text, setText] = useState("привет мир привет react");
  const freq = new Map();
  for (const ch of text) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div style={{ padding: 20 }}>
      <input value={text} onChange={e => setText(e.target.value)} style={{ width: "100%" }} />
      <p>Топ символов:</p>
      <ul>
        {top.map(([ch, n]) => (
          <li key={ch}><code>"{ch}"</code> → {n}</li>
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
        id: "bfs-dfs",
        title: "BFS и DFS",
        description: "Обход графов и деревьев: очередь vs стек",
        theory: r(`
**BFS** (поиск в ширину) обходит граф **по уровням**. Использует **очередь FIFO**. Гарантия: первый раз, когда видим вершину, мы пришли к ней по **кратчайшему пути** (в невзвешенном графе).

**DFS** (поиск в глубину) идёт «вглубь до упора», потом откатывается. Использует **стек** (или рекурсию).

**Разница в коде — одна строка:** \`queue.shift()\` (BFS) vs \`stack.pop()\` (DFS).

| Задача | Алгоритм |
|---|---|
| Кратчайший путь (без весов) | **BFS** |
| Топологическая сортировка | DFS (post-order) |
| Все возможные пути | DFS с возвратом |
| Уровни / расстояния | **BFS** |
| Поиск компонент связности | оба |

**Где это во фронте:**
- **Обход DOM / VDOM** — DFS (\`walkDOM\`, JSON-stringify).
- **AST в Babel/ESLint** — DFS (pre-order для enter, post-order для exit).
- **React Fiber commit phase** — post-order DFS: \`useEffect\` дочернего срабатывает **раньше** родительского.
- **Топологическая сортировка модулей** в Webpack — DFS.
- **Поиск «связь 2-го уровня»** в соцграфе — BFS.
- **Levels rendering** дерева комментариев — BFS.

**Сложность:** O(V + E) время, O(V) память.

**Подводные камни:**
- Без \`visited\` Set DFS уходит в бесконечный цикл на циклическом графе.
- \`Array.prototype.shift()\` — O(n)! На больших графах BFS тормозит. Лучше — настоящая очередь с двумя индексами.
- Метить \`visited\` нужно **при добавлении в очередь**, а не при извлечении — иначе одну вершину положим много раз.
- DFS не даёт кратчайший путь, найденный — любой.
        `),
        examples: [
          {
            title: "BFS: кратчайший путь в графе друзей",
            code: r(`
import { useState } from "react";

const friends = new Map([
  ["Аня",   ["Боб", "Дима"]],
  ["Боб",   ["Аня", "Чарли"]],
  ["Чарли", ["Боб", "Ева"]],
  ["Дима",  ["Аня", "Ева"]],
  ["Ева",   ["Чарли", "Дима", "Федя"]],
  ["Федя",  ["Ева"]],
]);

function shortestPath(graph, start, target) {
  const queue = [start];
  const cameFrom = new Map([[start, null]]);
  while (queue.length) {
    const node = queue.shift();
    if (node === target) {
      const path = [];
      for (let n = target; n !== null; n = cameFrom.get(n)) path.unshift(n);
      return path;
    }
    for (const next of graph.get(node) ?? []) {
      if (!cameFrom.has(next)) {
        cameFrom.set(next, node);
        queue.push(next);
      }
    }
  }
  return null;
}

export default function App() {
  const [from, setFrom] = useState("Аня");
  const [to, setTo] = useState("Федя");
  const path = shortestPath(friends, from, to);
  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <p>От: <input value={from} onChange={e => setFrom(e.target.value)} /></p>
      <p>До: <input value={to} onChange={e => setTo(e.target.value)} /></p>
      <p>Путь: <b>{path ? path.join(" → ") : "не найден"}</b></p>
      <p>Степень: <b>{path ? path.length - 1 : "—"}</b></p>
    </div>
  );
}
`),
          },
          {
            title: "DFS: топологическая сортировка",
            code: r(`
const deps = new Map([
  ["App", ["Header", "Main"]],
  ["Main", ["List", "Footer"]],
  ["List", ["Item"]],
  ["Item", []],
  ["Header", ["Logo"]],
  ["Logo", []],
  ["Footer", []],
]);

function topoSort(graph) {
  const visited = new Set();
  const result = [];
  function dfs(u) {
    if (visited.has(u)) return;
    visited.add(u);
    for (const v of graph.get(u) ?? []) dfs(v);
    result.push(u); // post-order
  }
  for (const u of graph.keys()) dfs(u);
  return result.reverse();
}

export default function App() {
  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <p>Граф зависимостей — порядок «кого собрать первым»:</p>
      <ol>{topoSort(deps).map(x => <li key={x}>{x}</li>)}</ol>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "dynamic-programming",
        title: "Динамическое программирование",
        description: "Мемоизация, табулирование, и почему это React.memo",
        theory: r(`
**DP** — это **запоминание промежуточных результатов**, чтобы не считать одно и то же дважды. Применимо, когда задача:
1. Разбивается на подзадачи (overlapping subproblems).
2. Оптимум состоит из оптимумов подзадач (optimal substructure).

**Два стиля:**
- **Top-down (мемоизация):** рекурсивно, кешируем ответы.
- **Bottom-up (табулирование):** итеративно, заполняем таблицу от меньшего к большему.

**Фибоначчи:**
- Наивно — O(2ⁿ).
- С мемо — O(n) время / O(n) память.
- Bottom-up с двумя переменными — O(n) / O(1).

**Классические задачи:**
- **LCS** (Longest Common Subsequence) — основа \`git diff\`.
- **Edit distance** (Левенштейн) — «вы имели в виду…?», fuzzy-поиск.
- **Coin change** — минимум монет (жадный не работает).
- **LIS** — наивно O(n²), с patience sort + бинарный поиск — O(n log n). Используется в **Vue 3 patchKeyedChildren**.

**DP во фронте:**
- \`useMemo\`, \`useCallback\`, \`React.memo\`, \`reselect\` — это DP на уровне инструмента.
- **Diff в reconciler** — без ключей это вариант edit distance O(n²), с ключами — O(n).
- **Кеш высот строк** в виртуализованных таблицах.
- **Вагнер–Фишер** для diff текста — базис \`react-diff-viewer\` и git.

**Подводные камни:**
- Мемо по объекту-ссылке: новый объект каждый рендер ломает мемо.
- Таблица n×m может занять гигабайты — часто можно хранить только последнюю строку.
- Top-down может переполнить стек — переписывай в bottom-up.
- Жадный вместо DP даёт неверный ответ на Knapsack/Coin Change.
        `),
        examples: [
          {
            title: "Фибоначчи: три варианта",
            code: r(`
import { useState } from "react";

let naiveCalls = 0;
function fibNaive(n) {
  naiveCalls++;
  if (n < 2) return n;
  return fibNaive(n - 1) + fibNaive(n - 2);
}

function fibMemo(n, memo = new Map()) {
  if (n < 2) return n;
  if (memo.has(n)) return memo.get(n);
  const v = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  memo.set(n, v);
  return v;
}

function fibTab(n) {
  if (n < 2) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  return b;
}

export default function App() {
  const [n, setN] = useState(20);
  naiveCalls = 0;
  const naive = fibNaive(n);
  const memo = fibMemo(n);
  const tab = fibTab(n);

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <label>n = </label>
      <input type="number" value={n} onChange={e => setN(Math.min(35, +e.target.value))} />
      <p>Наивно (O(2ⁿ)): fib({n}) = {naive}, вызовов: <b>{naiveCalls}</b></p>
      <p>С мемо (O(n)):  fib({n}) = {memo}</p>
      <p>Таблица (O(1) память): fib({n}) = {tab}</p>
    </div>
  );
}
`),
          },
          {
            title: "Edit distance: «вы имели в виду…?»",
            code: r(`
import { useState } from "react";

function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[a.length][b.length];
}

const dict = ["react", "redux", "router", "recoil", "remix", "rxjs", "rust", "rest"];

export default function App() {
  const [q, setQ] = useState("recat");
  const ranked = dict
    .map(w => ({ w, d: editDistance(q.toLowerCase(), w) }))
    .sort((a, b) => a.d - b.d);

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="опечатка" />
      <p>Похоже на:</p>
      <ol>
        {ranked.slice(0, 4).map(({ w, d }) => (
          <li key={w}>{w} (расстояние {d})</li>
        ))}
      </ol>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "greedy",
        title: "Жадные алгоритмы",
        description: "Интервалы, throttle, упаковка галереи",
        theory: r(`
**Жадный** = на каждом шаге берём **локально оптимальный** выбор и надеемся, что суммарно получится глобально оптимально.

**Классические задачи:**

**1. Activity selection.** Максимум непересекающихся интервалов. Стратегия — **сортировка по концу**, потом берём первый подходящий.

**2. Покрытие множеств.** Жадный даёт ln(n)-приближение к NP-hard задаче.

**3. Сдача монетами.** В системе 1/5/10/25 — жадный работает. В системе 1/3/4 для суммы 6: жадный → \`4+1+1\`, оптимум → \`3+3\`. **Жадный не всегда оптимален** — нужно доказывать.

**Где это во фронте:**
- **Throttle / rate-limiting** — token bucket жадно отправляет, как только токен доступен.
- **Перенос строк** в \`<p>\` — greedy line breaking. (TeX использует DP для лучшего вида.)
- **Justified gallery** (Flickr/Unsplash) — жадно набираем картинки в ряд.
- **LRU** — жадно выкидываем самое неиспользуемое.
- **React batching** — жадно набирает обновления в кадр.
- **Дейкстра** — тоже жадный.

**Сложность:** обычно O(n log n) — доминирует сортировка.

**Подводные камни:**
- Жадный ≠ всегда оптимальный. Перед написанием — проверь на каверзном входе.
- Activity selection работает **только** с сортировкой по \`end\`, а не \`start\` или длительности.
- 0/1 Knapsack по «удельной ценности» жадно не решается — нужна DP.

**Хаффман-коды** (gzip, brotli) — оптимальное префиксное кодирование жадным алгоритмом: всегда сливаем два самых редких символа.
        `),
        examples: [
          {
            title: "Activity selection: максимум встреч",
            code: r(`
import { useState } from "react";

function maxIntervals(intervals) {
  const sorted = [...intervals].sort((a, b) => a.end - b.end);
  const chosen = [];
  let lastEnd = -Infinity;
  for (const iv of sorted) {
    if (iv.start >= lastEnd) {
      chosen.push(iv);
      lastEnd = iv.end;
    }
  }
  return chosen;
}

const meetings = [
  { id: "Standup",   start: 9,  end: 9.5 },
  { id: "Дизайн",    start: 10, end: 12 },
  { id: "Обед",      start: 12, end: 13 },
  { id: "Митинг",    start: 11, end: 12.5 },
  { id: "1-on-1",    start: 13, end: 14 },
  { id: "Demo",      start: 13.5, end: 15 },
  { id: "Ретро",     start: 15, end: 16 },
];

export default function App() {
  const [view, setView] = useState("all");
  const data = view === "all" ? meetings : maxIntervals(meetings);
  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <button onClick={() => setView("all")}>Все ({meetings.length})</button>
      <button onClick={() => setView("max")}>Max непересекающихся ({maxIntervals(meetings).length})</button>
      <ul>
        {data.map(m => <li key={m.id}>{m.id}: {m.start}–{m.end}</li>)}
      </ul>
    </div>
  );
}
`),
          },
          {
            title: "Throttle: жадная стратегия",
            code: r(`
import { useState, useRef } from "react";

function throttle(fn, ms) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
  };
}

export default function App() {
  const [count, setCount] = useState(0);
  const [calls, setCalls] = useState(0);
  const throttled = useRef(throttle(() => setCount(c => c + 1), 500)).current;

  return (
    <div style={{ padding: 20 }}>
      <p>Throttle: 500мс — клики «жадно» проходят, как только окно открыто.</p>
      <button onClick={() => { setCalls(c => c + 1); throttled(); }}>
        Кликни много раз!
      </button>
      <p>Всего кликов: <b>{calls}</b></p>
      <p>Прошло throttle: <b>{count}</b></p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "trees-heap-trie",
        title: "Деревья: BST, Heap, Trie",
        description: "BST для порядка, Heap для приоритетов, Trie для autocomplete",
        theory: r(`
Дерево — связный граф без циклов. В нём фронт сталкивается ежедневно: DOM, VDOM, AST, JSON, дерево комментариев.

**1. BST (Binary Search Tree).** Для любого узла: левое поддерево < узел < правое. Операции — O(log n) в среднем, **O(n) в худшем** (вырожденное дерево-список). Гарантия — AVL/Red-Black.

inorder-обход BST даёт **отсортированную последовательность**.

**2. Heap (Min/Max).** Почти полное бинарное дерево, где корень — минимум/максимум. Реализуется массивом: для узла \`i\` дети — \`2i+1\`, \`2i+2\`.
- \`push\` / \`pop\` — O(log n).
- \`peek\` — O(1).
- Построение из массива — O(n).

**Где Heap во фронте:**
- **React Scheduler** буквально использует min-heap по приоритетам задач. Файл \`react-reconciler/src/Scheduler.js\`. Это основа «прерываемой работы» в Concurrent React.
- **Алгоритм Дейкстры** — min-heap для следующей ближайшей вершины.
- **Top-K**: «10 самых популярных» через min-heap размера K.

**3. Trie (префиксное дерево).** Каждый узел — символ; путь от корня — префикс. Операции — O(L), где L — длина строки. **Не зависит от числа слов!**

**Где Trie во фронте:**
- **Autocomplete** для команд (VSCode, Slack \`/команды\`).
- **URL-роутер** в React Router 6 / Vue Router строит trie-подобную структуру для O(L) матчинга.
- **emoji-picker** — поиск по началу имени.

**Подводные камни:**
- Несбалансированный BST на отсортированных данных = связный список.
- Heap — НЕ отсортированный массив. \`h[1]\` и \`h[2]\` могут идти в любом порядке.
- Trie жрёт память: 100K слов = десятки МБ. Лекарство — radix tree.
        `),
        examples: [
          {
            title: "Trie: autocomplete по префиксу",
            code: r(`
import { useState } from "react";

class Trie {
  constructor() { this.root = Object.create(null); }
  insert(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node[ch]) node[ch] = Object.create(null);
      node = node[ch];
    }
    node.$ = true;
  }
  wordsWithPrefix(prefix) {
    let node = this.root;
    for (const ch of prefix) {
      if (!node[ch]) return [];
      node = node[ch];
    }
    const out = [];
    const walk = (n, path) => {
      if (n.$) out.push(path);
      for (const ch in n) if (ch !== "$") walk(n[ch], path + ch);
    };
    walk(node, prefix);
    return out;
  }
}

const trie = new Trie();
["react", "redux", "router", "recoil", "remix", "rxjs", "rust", "rest", "render", "ref"]
  .forEach(w => trie.insert(w));

export default function App() {
  const [q, setQ] = useState("re");
  const matches = q ? trie.wordsWithPrefix(q.toLowerCase()) : [];

  return (
    <div style={{ padding: 20 }}>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="префикс..." />
      <ul>{matches.map(w => <li key={w}>{w}</li>)}</ul>
      {q && matches.length === 0 && <p>Нет совпадений</p>}
    </div>
  );
}
`),
          },
          {
            title: "MinHeap и Top-K за O(n log K)",
            code: r(`
class MinHeap {
  constructor() { this.h = []; }
  push(v) {
    this.h.push(v);
    let i = this.h.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.h[p] <= this.h[i]) break;
      [this.h[p], this.h[i]] = [this.h[i], this.h[p]];
      i = p;
    }
  }
  pop() {
    if (!this.h.length) return undefined;
    const top = this.h[0];
    const last = this.h.pop();
    if (this.h.length) {
      this.h[0] = last;
      let i = 0;
      while (true) {
        const l = 2*i+1, r = 2*i+2;
        let s = i;
        if (l < this.h.length && this.h[l] < this.h[s]) s = l;
        if (r < this.h.length && this.h[r] < this.h[s]) s = r;
        if (s === i) break;
        [this.h[i], this.h[s]] = [this.h[s], this.h[i]];
        i = s;
      }
    }
    return top;
  }
  peek() { return this.h[0]; }
  get size() { return this.h.length; }
}

// Top-K: храним K самых больших через min-heap размера K
function topK(arr, k) {
  const heap = new MinHeap();
  for (const x of arr) {
    if (heap.size < k) heap.push(x);
    else if (x > heap.peek()) { heap.pop(); heap.push(x); }
  }
  return [...heap.h].sort((a, b) => b - a);
}

export default function App() {
  const nums = Array.from({ length: 50 }, () => Math.floor(Math.random() * 1000));
  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <p>50 случайных чисел:</p>
      <p style={{ fontSize: 11 }}>[{nums.join(", ")}]</p>
      <p>Top-5: <b>[{topK(nums, 5).join(", ")}]</b></p>
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
    id: "system-design",
    emoji: "🏗️",
    title: "System Design (фронтенд)",
    description: "Архитектура клиентских приложений: рендеринг, данные, производительность, надёжность",
    topics: [
      {
        id: "rendering-strategies",
        title: "Стратегии рендеринга",
        description: "CSR, SSR, SSG, ISR, Streaming SSR, RSC — что выбрать",
        theory: r(`
Главный вопрос фронтенд-архитектуры: **где и когда превращается код в HTML**. От ответа зависят скорость, SEO, нагрузка на сервер и сложность инфраструктуры.

### CSR — Client-Side Rendering
Сервер отдаёт почти пустой \`<div id="root">\`, всё рисует JS в браузере.
- ✅ Дёшево хостить (статика + CDN), простой деплой, отличная интерактивность после загрузки.
- ❌ Долгий **FCP/LCP** (пустой экран, пока качается и парсится бандл), слабое SEO без пре-рендера.
- Применение: внутренние дашборды, SPA за авторизацией.

### SSR — Server-Side Rendering
HTML собирается на сервере **на каждый запрос**, затем «оживает» в браузере (гидратация).
- ✅ Быстрый контентный FCP, хорошее SEO, свежие данные.
- ❌ Нагрузка на сервер (TTFB растёт), «uncanny valley»: видно, но не кликается до гидратации.
- Применение: маркетплейсы, контент с персонализацией.

### SSG — Static Site Generation
HTML генерится **во время сборки**, раздаётся как статика.
- ✅ Максимально быстрый TTFB, дёшево, безопасно.
- ❌ Данные «застывают» на момент билда, долгая пересборка большого числа страниц.
- Применение: блоги, документация, лендинги.

### ISR — Incremental Static Regeneration
SSG + фоновое обновление: страница пере-генерируется по таймеру или по запросу, не блокируя пользователя.
- Компромисс «статика + почти свежие данные».

### Streaming SSR + RSC
Сервер отдаёт HTML **по кускам** (\`<Suspense>\`-границы стримятся по мере готовности данных). **React Server Components** выполняются только на сервере, не попадают в бандл, не гидратируются.
- ✅ Быстрый первый байт, тяжёлая логика и зависимости остаются на сервере, меньше JS у клиента.
- ❌ Новая ментальная модель, граница «server/client» требует дисциплины.

### Как выбирать

| Критерий | CSR | SSR | SSG | RSC/Streaming |
|---|---|---|---|---|
| TTFB | ⚡ | 🐢 | ⚡⚡ | ⚡ |
| Свежесть данных | ⚡ | ⚡ | 🐢 | ⚡ |
| SEO | ❌ | ✅ | ✅ | ✅ |
| Стоимость инфры | 💲 | 💲💲💲 | 💲 | 💲💲 |
| JS у клиента | много | много | мало | минимум |

**Гидратация** — самая дорогая часть SSR: React заново строит дерево и навешивает обработчики. Лечится **partial / progressive hydration** (островная архитектура — Astro, Qwik с «resumability»).
        `),
        examples: [
          {
            title: "Таймлайн загрузки: CSR vs SSR vs SSG",
            description: "Сравни, когда пользователь видит контент и когда страница становится кликабельной",
            code: r(`
import { useState } from "react";

const STRATEGIES = {
  CSR: { ttfb: 80,  fcp: 1400, tti: 1800, note: "Пустой экран, пока грузится бандл" },
  SSR: { ttfb: 600, fcp: 750,  tti: 1900, note: "Контент рано, клики — после гидратации" },
  SSG: { ttfb: 50,  fcp: 250,  tti: 1500, note: "HTML с CDN мгновенно" },
};

function Bar({ label, ms, max, color }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 12, marginBottom: 2 }}>{label}: {ms}ms</div>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: (ms / max) * 100 + "%" }}
        transition={{ duration: 0.5 }}
        style={{ height: 14, background: color, borderRadius: 4 }}
      />
    </div>
  );
}

export default function App() {
  const [strat, setStrat] = useState("SSG");
  const s = STRATEGIES[strat];
  const max = 2000;

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {Object.keys(STRATEGIES).map((k) => (
          <button
            key={k}
            onClick={() => setStrat(k)}
            style={{
              padding: "6px 14px", borderRadius: 8, cursor: "pointer",
              border: "1px solid #888",
              background: strat === k ? "#6366f1" : "transparent",
              color: strat === k ? "white" : "inherit",
            }}
          >{k}</button>
        ))}
      </div>
      <Bar label="TTFB (первый байт)" ms={s.ttfb} max={max} color="#94a3b8" />
      <Bar label="FCP (виден контент)" ms={s.fcp} max={max} color="#22c55e" />
      <Bar label="TTI (можно кликать)" ms={s.tti} max={max} color="#6366f1" />
      <p style={{ fontSize: 13, color: "#888", marginTop: 12 }}>💡 {s.note}</p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "data-fetching",
        title: "Получение данных и кеширование",
        description: "Waterfall, параллельные запросы, stale-while-revalidate, инвалидация",
        theory: r(`
Серверное состояние — это не то же самое, что состояние UI. Оно **чужое** (живёт на сервере), **устаревает** и **разделяется** между компонентами. Поэтому для него нужны отдельные паттерны.

### Водопады запросов (request waterfall)
Антипаттерн: компонент A грузит данные → внутри рендерит B, который грузит свои данные → и т.д. Запросы выстраиваются в цепочку, и общее время = сумма.

**Лечение:**
- **Hoisting** — поднять загрузку выше, запустить параллельно (\`Promise.all\`).
- **Prefetching** — начать грузить данные до того, как компонент смонтировался (на ховер ссылки, на этапе роутинга).
- **Loaders** в роутере (React Router / Next.js) — данные грузятся параллельно с кодом маршрута.

### Stale-While-Revalidate (SWR)
Стратегия кеша: **сразу отдай из кеша (stale)**, **в фоне сходи за свежим (revalidate)**, обнови UI. Пользователь не видит спиннер на повторных заходах.

\`\`\`
запрос → есть в кеше? → да → показать кеш + фоновый refetch
                      → нет → показать загрузку → запрос → кеш
\`\`\`

### Ключевые понятия (React Query / SWR / RTK Query)
- **queryKey** — нормализованный ключ кеша. От него зависит дедупликация и инвалидация.
- **staleTime** — сколько данные считаются свежими (refetch не нужен).
- **gcTime / cacheTime** — сколько хранить неиспользуемый кеш.
- **Дедупликация** — два компонента с одним ключом → один сетевой запрос.
- **Инвалидация** — после мутации помечаем связанные ключи устаревшими → авто-refetch.

### Нормализация
Если одна сущность встречается в разных списках — храни её **один раз** по id (\`{ users: { 1: {...} } }\`), а списки держат только id. Иначе после правки придётся обновлять её во всех местах.

### Подводные камни
- **Race condition**: пользователь быстро меняет фильтр, ответы приходят не по порядку → показывается старый. Лечится \`AbortController\` или сверкой с актуальным ключом.
- **Over-fetching** — тянем поля «на всякий случай». GraphQL/BFF помогает.
- **Кеш без TTL** растёт бесконечно — нужен \`gcTime\`.
        `),
        examples: [
          {
            title: "Stale-While-Revalidate своими руками",
            description: "Первый заход — спиннер; повторный — мгновенно из кеша + тихий refetch в фоне",
            code: r(`
import { useState, useEffect, useRef } from "react";

const cache = new Map();

function fakeApi(id) {
  return new Promise((res) =>
    setTimeout(() => res({ id, value: Math.floor(Math.random() * 100), at: new Date().toLocaleTimeString() }), 900)
  );
}

function useSWR(key) {
  const [data, setData] = useState(() => cache.get(key) ?? null);
  const [revalidating, setRevalidating] = useState(false);

  useEffect(() => {
    let alive = true;
    setData(cache.get(key) ?? null);
    setRevalidating(true);
    fakeApi(key).then((fresh) => {
      if (!alive) return;
      cache.set(key, fresh);
      setData(fresh);
      setRevalidating(false);
    });
    return () => { alive = false; };
  }, [key]);

  return { data, revalidating, fromCache: cache.has(key) };
}

export default function App() {
  const [id, setId] = useState(1);
  const { data, revalidating } = useSWR(id);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[1, 2, 3].map((n) => (
          <button key={n} onClick={() => setId(n)}
            style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer",
              border: "1px solid #888", background: id === n ? "#6366f1" : "transparent",
              color: id === n ? "white" : "inherit" }}>
            User #{n}
          </button>
        ))}
      </div>
      {!data ? (
        <p>⏳ Первая загрузка...</p>
      ) : (
        <div style={{ border: "1px solid #888", borderRadius: 10, padding: 14 }}>
          <p><b>User #{data.id}</b> · значение: {data.value}</p>
          <p style={{ fontSize: 12, color: "#888" }}>загружено в {data.at}</p>
          {revalidating && <p style={{ fontSize: 12, color: "#22c55e" }}>🔄 обновляю в фоне...</p>}
        </div>
      )}
      <p style={{ fontSize: 12, color: "#888", marginTop: 12 }}>
        Переключайся между юзерами туда-обратно — повторный заход мгновенный.
      </p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "perf-loading",
        title: "Производительность загрузки",
        description: "Бандл, code splitting, prefetch, критический путь, Core Web Vitals",
        theory: r(`
Скорость загрузки — это про **критический путь рендеринга**: что обязательно должно скачаться и выполниться, прежде чем пользователь увидит и сможет использовать страницу.

### Core Web Vitals
- **LCP** (Largest Contentful Paint) — когда отрисован самый большой элемент. Цель < 2.5с. Враги: тяжёлые картинки, медленный сервер, render-blocking ресурсы.
- **CLS** (Cumulative Layout Shift) — «прыжки» вёрстки. Цель < 0.1. Враги: картинки без размеров, шрифты, поздно подгруженные баннеры.
- **INP** (Interaction to Next Paint) — задержка отклика на действие. Цель < 200мс. Враги: долгие задачи в main thread, тяжёлая гидратация.

### Уменьшаем бандл
- **Code splitting** — \`React.lazy(() => import("./Heavy"))\` + \`<Suspense>\`. Делим по роутам и по тяжёлым виджетам (графики, редакторы).
- **Tree shaking** — импортируй именованно (\`import { x } from "lib"\`), избегай side-effect-импортов; \`"sideEffects": false\` в package.json.
- **Анализ** — \`rollup-plugin-visualizer\` / \`source-map-explorer\`: видно, что раздуло бандл (часто moment.js, lodash целиком, дубли версий).

### Управляем загрузкой ресурсов
- \`<link rel="preload">\` — «это нужно скоро, скачай в приоритете» (шрифт, hero-картинка).
- \`<link rel="prefetch">\` — «понадобится на следующей странице, скачай в простое».
- \`rel="preconnect"\` — заранее открыть соединение к стороннему домену (API, CDN).
- \`loading="lazy"\` на \`<img>\` / \`<iframe>\` — отложить вне-экранное.
- \`fetchpriority="high"\` — поднять приоритет LCP-картинки.

### Картинки
Часто 70% веса страницы. Современный формат (AVIF/WebP), \`srcset\` + \`sizes\` для отзывчивости, явные \`width/height\` (против CLS), blur-placeholder.

### Шрифты
\`font-display: swap\` (показать системный, заменить когда загрузится), \`preload\` критичного шрифта, подмножество глифов (subsetting).
        `),
        examples: [
          {
            title: "Ленивая загрузка по IntersectionObserver",
            description: "Карточки грузят «тяжёлый» контент только когда попадают в зону видимости",
            code: r(`
import { useState, useEffect, useRef } from "react";

function LazyCard({ index }) {
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setLoaded(true), 400);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} style={{
      height: 90, borderRadius: 10, marginBottom: 10,
      border: "1px solid #888", display: "flex", alignItems: "center",
      justifyContent: "center", overflow: "hidden",
      background: loaded ? "#6366f1" : "#1e293b", color: "white",
      transition: "background 0.4s",
    }}>
      {loaded ? (
        <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
          ✅ Карточка #{index} загружена
        </motion.span>
      ) : (
        <span style={{ color: "#64748b" }}>⏳ скролль ниже...</span>
      )}
    </div>
  );
}

export default function App() {
  return (
    <div style={{ padding: 20, height: 260, overflowY: "auto", fontFamily: "sans-serif" }}>
      <p style={{ fontSize: 13, color: "#888" }}>Скролль — контент грузится по мере появления:</p>
      {Array.from({ length: 12 }, (_, i) => <LazyCard key={i} index={i + 1} />)}
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "rendering-perf",
        title: "Производительность рендеринга",
        description: "Виртуализация, debounce/throttle, Web Workers, мемоизация",
        theory: r(`
После загрузки начинается вторая битва — за плавность. У браузера ~16мс на кадр (60fps). Всё, что дольше, — это «фриз».

### Виртуализация (windowing)
Список из 10 000 строк → 10 000 DOM-узлов → браузер умирает. Решение: рендерить **только видимые** строки + небольшой буфер. Под капотом — контейнер фиксированной высоты, абсолютно позиционированные видимые элементы, пересчёт диапазона на скролле (часто через бинарный поиск по offsets).
Библиотеки: \`@tanstack/virtual\`, \`react-window\`, \`react-virtuoso\`.

### Debounce vs Throttle
- **Debounce** — выполнить **через X мс после последнего** события. Поиск по мере ввода, авто-сохранение.
- **Throttle** — выполнять **не чаще раза в X мс**. Скролл, resize, mousemove.

\`\`\`js
const debounced = useMemo(() => debounce(fn, 300), []);
\`\`\`

### Web Workers
JS однопоточный. Тяжёлый счёт (парсинг большого CSV, сортировка 1М элементов, обработка изображения) блокирует UI. Worker выполняет это в **отдельном потоке**, общение через \`postMessage\`. Библиотека \`comlink\` превращает это в обычные async-вызовы.

### Мемоизация — без фанатизма
- \`React.memo\` — пропускает ре-рендер при равных пропсах (shallow).
- \`useMemo\` — кеширует дорогое вычисление.
- \`useCallback\` — стабильная ссылка на функцию (нужна, когда функция уходит в \`memo\`-компонент или в deps).

⚠️ Мемоизация **не бесплатна** — сравнение и хранение тоже стоят. Сначала **профилируй** (React DevTools Profiler), потом оптимизируй точечно. Преждевременная мемоизация всего — это шум и баги с устаревшими замыканиями.

### Прочее
- **CSS-анимации / transform** вместо анимаций через JS и layout-свойств (\`top\`, \`width\`).
- **\`content-visibility: auto\`** — браузер сам пропускает рендер вне-экранного.
- **Батчинг** — React 18 батчит \`setState\` даже в промисах и таймерах.
        `),
        examples: [
          {
            title: "Виртуализированный список: 10 000 строк, ~15 в DOM",
            description: "Рендерятся только видимые строки — DOM остаётся крошечным при любом размере данных",
            code: r(`
import { useState, useRef } from "react";

const TOTAL = 10000;
const ROW_H = 32;
const VIEWPORT = 260;

export default function App() {
  const [scrollTop, setScrollTop] = useState(0);
  const buffer = 4;

  const first = Math.max(0, Math.floor(scrollTop / ROW_H) - buffer);
  const visibleCount = Math.ceil(VIEWPORT / ROW_H) + buffer * 2;
  const last = Math.min(TOTAL, first + visibleCount);

  const rows = [];
  for (let i = first; i < last; i++) {
    rows.push(
      <div key={i} style={{
        position: "absolute", top: i * ROW_H, height: ROW_H, left: 0, right: 0,
        display: "flex", alignItems: "center", padding: "0 12px",
        borderBottom: "1px solid #33415555",
        background: i % 2 ? "#1e293b" : "transparent", color: "white",
      }}>
        Строка #{i}
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <p style={{ fontSize: 13, color: "#888" }}>
        Всего строк: {TOTAL.toLocaleString()} · в DOM сейчас: <b>{last - first}</b>
      </p>
      <div
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        style={{ height: VIEWPORT, overflowY: "auto", border: "1px solid #888", borderRadius: 8 }}
      >
        <div style={{ height: TOTAL * ROW_H, position: "relative" }}>{rows}</div>
      </div>
    </div>
  );
}
`),
          },
          {
            title: "Debounce vs Throttle вживую",
            description: "Печатай в поле и води мышкой — увидишь разницу поведения",
            code: r(`
import { useState, useRef } from "react";

export default function App() {
  const [debounced, setDebounced] = useState("");
  const [throttled, setThrottled] = useState(0);
  const [rawKeys, setRawKeys] = useState(0);
  const [rawMoves, setRawMoves] = useState(0);
  const dTimer = useRef(null);
  const tLast = useRef(0);

  const onType = (e) => {
    const v = e.target.value;
    setRawKeys((k) => k + 1);
    clearTimeout(dTimer.current);
    dTimer.current = setTimeout(() => setDebounced(v), 400);
  };

  const onMove = () => {
    setRawMoves((m) => m + 1);
    const now = Date.now();
    if (now - tLast.current >= 200) {
      tLast.current = now;
      setThrottled((t) => t + 1);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <p style={{ fontWeight: 600 }}>Debounce (400мс) — «поиск по вводу»</p>
      <input onChange={onType} placeholder="печатай быстро..."
        style={{ padding: 8, borderRadius: 6, border: "1px solid #888", width: "100%" }} />
      <p style={{ fontSize: 13 }}>нажатий: {rawKeys} → запросов: <b>{debounced ? debounced : "—"}</b></p>

      <p style={{ fontWeight: 600, marginTop: 16 }}>Throttle (200мс) — «обработчик скролла»</p>
      <div onMouseMove={onMove} style={{
        height: 70, border: "1px dashed #888", borderRadius: 8,
        display: "grid", placeItems: "center", color: "#888",
      }}>води здесь мышкой</div>
      <p style={{ fontSize: 13 }}>событий mousemove: {rawMoves} → обработано: <b>{throttled}</b></p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "optimistic-ui",
        title: "Оптимистичный UI и устойчивость к сети",
        description: "Optimistic updates, rollback, retry с backoff, offline-очередь",
        theory: r(`
Сеть медленная и ненадёжная. Хороший фронтенд **не заставляет ждать** и **корректно переживает ошибки**.

### Оптимистичные обновления
Не жди ответа сервера — **сразу обнови UI**, исходя из предположения, что запрос пройдёт. Если упал — **откатись** (rollback) и покажи ошибку.

\`\`\`
клик «лайк» → +1 в UI мгновенно → запрос на сервер
   ├─ успех  → ничего не делаем (UI уже верный)
   └─ ошибка → откат -1 + тост «не получилось»
\`\`\`

Где уместно: лайки, чекбоксы, переименование, добавление в список. Где **не**: платежи, необратимые действия — там нужен честный лоадер.

### Retry с экспоненциальным backoff
Запрос упал из-за сети/5xx → повтори. Но не сразу и не бесконечно: задержки растут \`1с, 2с, 4с, 8с...\` + **jitter** (случайный разброс), чтобы тысячи клиентов не ретраили синхронно («thundering herd»).
Ретраить можно только **идемпотентные** операции (GET, PUT, DELETE), POST — осторожно (нужен idempotency key).

### Offline-очередь
Действия пользователя складываются в очередь (в \`localStorage\`/IndexedDB). При восстановлении сети — проигрываются по порядку. Так работают PWA-«запиши заметку в самолёте».

### Состояния, о которых забывают
У любого асинхронного UI их минимум 4: **idle / loading / success / error**. Плюс часто: **empty** (запрос успешен, но данных нет) и **partial** (часть загрузилась). Скелетоны лучше спиннеров — нет «прыжка» layout.
        `),
        examples: [
          {
            title: "Оптимистичный лайк с откатом при ошибке",
            description: "~40% запросов «падают» — лайк ставится мгновенно, потом откатывается",
            code: r(`
import { useState } from "react";

function fakeRequest() {
  return new Promise((res, rej) =>
    setTimeout(() => (Math.random() < 0.4 ? rej(new Error("network")) : res()), 700)
  );
}

export default function App() {
  const [likes, setLikes] = useState(120);
  const [liked, setLiked] = useState(false);
  const [toast, setToast] = useState(null);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    if (pending) return;
    const prevLiked = liked, prevLikes = likes;
    // оптимистично
    setLiked(!liked);
    setLikes(likes + (liked ? -1 : 1));
    setPending(true);
    setToast(null);
    try {
      await fakeRequest();
    } catch {
      // откат
      setLiked(prevLiked);
      setLikes(prevLikes);
      setToast("❌ Не удалось — откатили");
    } finally {
      setPending(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <motion.button
        onClick={toggle}
        whileTap={{ scale: 0.9 }}
        style={{
          padding: "10px 20px", borderRadius: 12, cursor: "pointer", fontSize: 16,
          border: "1px solid #888",
          background: liked ? "#ef4444" : "transparent",
          color: liked ? "white" : "inherit",
        }}
      >
        {liked ? "❤️" : "🤍"} {likes}
      </motion.button>
      {pending && <span style={{ marginLeft: 10, fontSize: 12, color: "#888" }}>отправка...</span>}
      {toast && <p style={{ color: "#ef4444", fontSize: 13 }}>{toast}</p>}
      <p style={{ fontSize: 12, color: "#888", marginTop: 10 }}>
        UI меняется сразу — сеть догоняет. При ошибке состояние возвращается.
      </p>
    </div>
  );
}
`),
          },
          {
            title: "Retry с экспоненциальным backoff",
            description: "Запрос ретраится с растущими паузами 0.5с → 1с → 2с, плюс jitter",
            code: r(`
import { useState } from "react";

function flakyApi(attempt) {
  // «получается» только с 4-й попытки
  return new Promise((res, rej) =>
    setTimeout(() => (attempt >= 4 ? res("✅ данные получены") : rej(new Error("503"))), 300)
  );
}

export default function App() {
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    setLog([]);
    const add = (m) => setLog((l) => [...l, m]);
    let attempt = 0;
    const maxRetries = 5;
    while (attempt < maxRetries) {
      attempt++;
      try {
        add("Попытка " + attempt + "...");
        const result = await flakyApi(attempt);
        add(result);
        break;
      } catch (e) {
        if (attempt >= maxRetries) { add("💀 Сдаёмся после " + attempt + " попыток"); break; }
        const base = 500 * Math.pow(2, attempt - 1);
        const jitter = Math.floor(Math.random() * 200);
        const delay = base + jitter;
        add("  ↳ упало (" + e.message + "), ждём " + delay + "мс");
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    setRunning(false);
  };

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <button onClick={run} disabled={running}
        style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer", marginBottom: 12 }}>
        {running ? "выполняется..." : "Запустить запрос"}
      </button>
      <div style={{ fontSize: 13, lineHeight: 1.7 }}>
        {log.map((l, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>{l}</motion.div>
        ))}
      </div>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "realtime",
        title: "Реалтайм: WebSocket, SSE, polling",
        description: "Три способа «живых» данных и когда какой выбрать",
        theory: r(`
«Живые» данные (чаты, нотификации, котировки, презенс) можно доставлять тремя способами.

### Short polling
Клиент раз в N секунд спрашивает «что нового?».
- ✅ Тривиально, работает везде, без спецсервера.
- ❌ Задержка до N сек, лишние запросы вхолостую, нагрузка на сервер.
- Когда: данные редко меняются, реалтайм не критичен.

### Long polling
Запрос «висит» открытым, пока сервер не ответит (есть новость или таймаут), затем сразу новый.
- ✅ Почти мгновенно, поверх обычного HTTP.
- ❌ Сложнее на сервере, накладные расходы на переустановку соединений.

### SSE — Server-Sent Events
Однонаправленный поток **сервер → клиент** поверх HTTP (\`EventSource\`).
- ✅ Простой API, авто-reconnect из коробки, проходит через прокси, текстовый протокол.
- ❌ Только в одну сторону, лимит соединений на домен (в HTTP/1.1), нет бинарных данных.
- Когда: лента событий, нотификации, прогресс задачи, стриминг ответа LLM.

### WebSocket
Полнодуплексный канал **клиент ↔ сервер** поверх отдельного протокола (\`ws://\`).
- ✅ Двусторонний, низкая задержка, бинарные данные.
- ❌ Не «бесплатный» HTTP — нужен отдельный инфра-слой, ручной reconnect, heartbeat, масштабирование сложнее.
- Когда: чаты, совместное редактирование, игры, всё интерактивное «туда-обратно».

| | Polling | SSE | WebSocket |
|---|---|---|---|
| Направление | клиент→сервер | сервер→клиент | оба |
| Reconnect | вручную | авто | вручную |
| Протокол | HTTP | HTTP | WS |
| Сложность инфры | низкая | низкая | высокая |

### Что нужно в любом случае
- **Reconnection с backoff** — соединения рвутся всегда.
- **Heartbeat / ping-pong** — обнаружить «мёртвое» соединение.
- **Буфер на время разрыва** — что показать и как догнать пропущенное (по \`lastEventId\`).
- **Backpressure** — что делать, если событий больше, чем UI успевает рисовать (батчинг, throttle).
        `),
        examples: [
          {
            title: "Симуляция: polling vs SSE-поток",
            description: "Слева опрос раз в 2с (видна задержка), справа — мгновенный поток событий",
            code: r(`
import { useState, useEffect } from "react";

export default function App() {
  const [serverValue, setServerValue] = useState(0);
  const [polled, setPolled] = useState(0);
  const [streamed, setStreamed] = useState([]);

  // «сервер» меняет значение каждые 600мс
  useEffect(() => {
    const id = setInterval(() => setServerValue((v) => v + 1), 600);
    return () => clearInterval(id);
  }, []);

  // polling — раз в 2с
  useEffect(() => {
    const id = setInterval(() => setPolled(serverValue), 2000);
    return () => clearInterval(id);
  }, [serverValue]);

  // SSE-поток — реагирует сразу
  useEffect(() => {
    setStreamed((s) => [...s.slice(-5), serverValue]);
  }, [serverValue]);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", display: "flex", gap: 16 }}>
      <div style={{ flex: 1, border: "1px solid #888", borderRadius: 10, padding: 14 }}>
        <p style={{ fontWeight: 600 }}>🔄 Polling (2с)</p>
        <div style={{ fontSize: 32 }}>{polled}</div>
        <p style={{ fontSize: 12, color: "#888" }}>отстаёт от сервера</p>
      </div>
      <div style={{ flex: 1, border: "1px solid #22c55e", borderRadius: 10, padding: 14 }}>
        <p style={{ fontWeight: 600 }}>⚡ SSE-поток</p>
        <div style={{ fontSize: 32 }}>{serverValue}</div>
        <p style={{ fontSize: 12, color: "#888" }}>история: {streamed.join(", ")}</p>
      </div>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "client-storage",
        title: "Клиентское хранилище и оффлайн",
        description: "localStorage, IndexedDB, Cache API, Service Worker, PWA",
        theory: r(`
У браузера несколько хранилищ — с разными гарантиями, лимитами и API.

### localStorage / sessionStorage
- Синхронные, строки, ~5–10 МБ. \`session\` живёт до закрытия вкладки.
- ✅ Простые: настройки темы, флаги онбординга, черновики.
- ❌ Синхронность блокирует поток, нет структурированных данных, не доступны в Worker.
- 🔔 Событие \`storage\` — синхронизация между вкладками одного origin.

### IndexedDB
Асинхронная транзакционная NoSQL-БД в браузере. Сотни МБ+, объекты, индексы, доступна в Worker/Service Worker.
- Сырой API неудобен — берут обёртки: \`idb\`, \`dexie\`.
- Когда: оффлайн-данные, кеш сущностей, большие объёмы.

### Cache API
Хранилище пар \`Request → Response\`. Основа оффлайн-стратегий Service Worker.

### Service Worker
Прокси между приложением и сетью, живёт отдельно от страницы. Перехватывает \`fetch\` и решает: из кеша, из сети, или гибрид.
Стратегии:
- **Cache First** — статика (хешированные ассеты).
- **Network First** — свежие данные с фолбэком на кеш.
- **Stale-While-Revalidate** — кеш сразу + обновление в фоне.

### PWA
Service Worker + Web App Manifest = установка на устройство, оффлайн, push-уведомления.

### Что важно
- **Квоты и вытеснение** — браузер может очистить хранилище под давлением. Критичное — \`navigator.storage.persist()\`.
- **Версионирование** — структура данных меняется; нужны миграции (особенно в IndexedDB).
- **Безопасность** — никаких токенов/секретов в localStorage (доступны любому XSS). Сессии — в httpOnly-cookie.
- **Шифрование** — чувствительное оффлайн-данное шифруй (Web Crypto API).
        `),
        examples: [
          {
            title: "Черновик с автосохранением и синхронизацией вкладок",
            description: "Текст сохраняется в localStorage; открой пример в двух вкладках — увидишь синхронизацию",
            code: r(`
import { useState, useEffect } from "react";

const KEY = "demo-draft";

export default function App() {
  const [text, setText] = useState(() => localStorage.getItem(KEY) ?? "");
  const [saved, setSaved] = useState(true);

  // автосохранение с дебаунсом
  useEffect(() => {
    setSaved(false);
    const id = setTimeout(() => {
      localStorage.setItem(KEY, text);
      setSaved(true);
    }, 500);
    return () => clearTimeout(id);
  }, [text]);

  // синхронизация между вкладками
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY && e.newValue !== null) setText(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Печатай — сохранится в localStorage..."
        style={{ width: "100%", height: 90, padding: 10, borderRadius: 8,
          border: "1px solid #888", fontFamily: "inherit", resize: "vertical" }}
      />
      <p style={{ fontSize: 13, color: saved ? "#22c55e" : "#f59e0b" }}>
        {saved ? "✅ Сохранено" : "✏️ Сохраняю..."}
      </p>
      <p style={{ fontSize: 12, color: "#888" }}>
        Перезагрузи превью — текст останется. Событие <code>storage</code> синхронит вкладки.
      </p>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "component-architecture",
        title: "Архитектура компонентов",
        description: "Композиция, compound components, headless UI, дизайн-токены",
        theory: r(`
Когда компонентов становятся сотни, важна не «фича работает», а **как она устроена** — иначе каждое изменение ломает соседнее.

### Композиция вместо конфигурации
Антипаттерн — «компонент-комбайн» с 30 пропсами (\`showHeader\`, \`headerColor\`, \`headerIcon\`...). Лучше — собирать из мелких частей через \`children\`:

\`\`\`jsx
// ❌ конфигурация
<Card title="..." footer="..." headerAction={...} />
// ✅ композиция
<Card>
  <Card.Header>...</Card.Header>
  <Card.Body>...</Card.Body>
</Card>
\`\`\`

### Compound Components
Группа компонентов, разделяющих неявное состояние через Context. Пользователь свободно расставляет части, состояние «общее». Так устроены \`<Tabs>\`, \`<Accordion>\`, \`<Select>\` в Radix / Headless UI.

### Headless UI
Библиотека даёт **логику и поведение** (состояние, доступность, клавиатура, фокус-менеджмент), но **не даёт стилей**. Ты приносишь свою вёрстку. Radix UI, React Aria, Headless UI, TanStack Table — всё headless. Плюс: дизайн полностью твой, a11y — не твоя забота.

### Дизайн-токены
Именованные переменные дизайна (\`--color-accent\`, \`--space-4\`, \`--radius-md\`) — единый источник правды между Figma и кодом. Темы = разные наборы значений тех же токенов.

### Где проходит граница компонента
- **Презентационный** — только пропсы и разметка, без знания о данных.
- **Контейнерный** — знает про данные/стор, не знает про вёрстку.
- **Слои:** UI-kit → фичи → страницы. Зависимости — только вниз. Подход FSD (Feature-Sliced Design) формализует это.

### Признаки плохой архитектуры
prop drilling на 5 уровней, «бог-компонент» на 800 строк, дубли логики, неясно куда положить новый файл, изменение в одном месте ломает три других.
        `),
        examples: [
          {
            title: "Compound Component: Tabs через Context",
            description: "Части Tabs общаются через контекст — разметку расставляешь как хочешь",
            code: r(`
import { useState, createContext, useContext } from "react";

const TabsCtx = createContext(null);

function Tabs({ children, defaultValue }) {
  const [active, setActive] = useState(defaultValue);
  return <TabsCtx.Provider value={{ active, setActive }}>{children}</TabsCtx.Provider>;
}
function TabList({ children }) {
  return <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #888" }}>{children}</div>;
}
function Tab({ value, children }) {
  const { active, setActive } = useContext(TabsCtx);
  const on = active === value;
  return (
    <button onClick={() => setActive(value)} style={{
      padding: "8px 16px", border: "none", cursor: "pointer", position: "relative",
      background: "transparent", color: on ? "#6366f1" : "#888", fontWeight: on ? 700 : 400,
    }}>
      {children}
      {on && <motion.div layoutId="underline" style={{
        position: "absolute", left: 0, right: 0, bottom: -1, height: 2, background: "#6366f1",
      }} />}
    </button>
  );
}
function TabPanel({ value, children }) {
  const { active } = useContext(TabsCtx);
  if (active !== value) return null;
  return <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
    style={{ padding: 16 }}>{children}</motion.div>;
}

export default function App() {
  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <Tabs defaultValue="a">
        <TabList>
          <Tab value="a">Обзор</Tab>
          <Tab value="b">Спецификация</Tab>
          <Tab value="c">Отзывы</Tab>
        </TabList>
        <TabPanel value="a">📦 Общая информация о продукте.</TabPanel>
        <TabPanel value="b">📐 Технические характеристики.</TabPanel>
        <TabPanel value="c">⭐ Что говорят пользователи.</TabPanel>
      </Tabs>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "frontend-security",
        title: "Безопасность фронтенда",
        description: "XSS, CSP, CSRF, хранение токенов, dangerouslySetInnerHTML",
        theory: r(`
Фронтенд — это код, выполняющийся **на чужой машине в чужом браузере**. Доверять нельзя ничему, что пришло снаружи.

### XSS (Cross-Site Scripting)
Злоумышленник внедряет свой JS в твою страницу — и он выполняется с правами пользователя (читает токены, шлёт запросы от его имени).
- **React защищает по умолчанию**: всё в \`{}\` экранируется.
- **Дыра №1** — \`dangerouslySetInnerHTML\`. Если уж надо рендерить HTML — прогоняй через санитайзер (\`DOMPurify\`).
- **Дыра №2** — \`href={userInput}\` с \`javascript:...\`, \`<a target="_blank">\` без \`rel="noopener"\`.
- Не доверяй данным из URL, localStorage, ответов API — это всё «снаружи».

### CSP — Content Security Policy
HTTP-заголовок, который говорит браузеру «исполняй скрипты только с этих источников». Даже если XSS-инъекция прошла — браузер не выполнит чужой скрипт. Лучшая «вторая линия обороны».

### CSRF (Cross-Site Request Forgery)
Чужой сайт заставляет браузер пользователя отправить запрос на твой API (куки прикрепятся автоматически).
- Защита: \`SameSite=Strict/Lax\` на куках, CSRF-токены, проверка \`Origin\`.

### Хранение токенов
- **localStorage** — доступен любому JS → любой XSS крадёт токен. ❌ для access-токенов.
- **httpOnly cookie** — JS не может прочитать. ✅ но уязвима к CSRF (→ \`SameSite\`).
- Практика: access-токен — короткоживущий в памяти, refresh — в httpOnly-cookie.

### Прочее
- **Зависимости** — \`npm audit\`, обновления; одна скомпрометированная либа = доступ ко всему.
- **Секреты** — в бандле фронтенда **нет приватных ключей**. Всё, что в JS, видно пользователю.
- **CORS** — это защита **сервера**, не клиента; не «безопасность фронта», а правило, кому отвечать.
- **Clickjacking** — \`X-Frame-Options\` / \`frame-ancestors\`, чтобы тебя не встроили в \`<iframe>\`.
        `),
        examples: [
          {
            title: "XSS: почему нельзя рендерить сырой HTML",
            description: "Введи <img src=x onerror=...> — увидишь разницу между экранированием и dangerouslySetInnerHTML",
            code: r(`
import { useState } from "react";

// наивный «санитайзер» — в проде используй DOMPurify
function sanitize(html) {
  return html
    .replace(/<script[\\s\\S]*?<\\/script>/gi, "")
    .replace(/ on\\w+="[^"]*"/gi, "")
    .replace(/ on\\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

export default function App() {
  const [input, setInput] = useState('<img src=x onerror="alert(1)"> <b>жирный</b>');

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <input value={input} onChange={(e) => setInput(e.target.value)}
        style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #888" }} />

      <div style={{ marginTop: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#22c55e" }}>
          ✅ React по умолчанию (экранирует — безопасно):
        </p>
        <div style={{ padding: 10, border: "1px solid #22c55e", borderRadius: 6 }}>{input}</div>
      </div>

      <div style={{ marginTop: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>
          ⚠️ dangerouslySetInnerHTML + санитайзер:
        </p>
        <div style={{ padding: 10, border: "1px solid #f59e0b", borderRadius: 6 }}
          dangerouslySetInnerHTML={{ __html: sanitize(input) }} />
      </div>

      <p style={{ fontSize: 12, color: "#ef4444", marginTop: 10 }}>
        Без санитайзера onerror-обработчик из строки выполнился бы как код.
      </p>
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
    id: "leetcode",
    emoji: "🧩",
    title: "Алгоритмы для LeetCode",
    description: "Ключевые паттерны собеседований с пошаговой анимацией работы",
    topics: [
      {
        id: "sorting-viz",
        title: "Сортировки: визуализация",
        description: "Bubble, Selection, Insertion — как они переставляют элементы",
        theory: r(`
Сортировка — фундамент: на ней строятся бинарный поиск, два указателя, многие жадные алгоритмы. На собеседовании важно не «написать quicksort по памяти», а **понимать trade-off'ы**.

### Простые сортировки — O(n²)
- **Bubble sort** — соседи сравниваются и «всплывают». Медленная, но если за проход не было обменов — массив уже отсортирован (адаптивность).
- **Selection sort** — каждый проход находит минимум и ставит на место. Всегда O(n²), минимум обменов.
- **Insertion sort** — берём элемент и «вставляем» в уже отсортированную часть. **Быстрая на почти отсортированных данных** (O(n) в лучшем случае), стабильная, работает inline — поэтому V8 использует её для коротких подмассивов внутри Timsort.

### Быстрые сортировки — O(n log n)
- **Merge sort** — divide & conquer, стабильная, гарантированные O(n log n), но O(n) доп. памяти.
- **Quick sort** — divide & conquer вокруг pivot, in-place, в среднем быстрее merge, но худший случай O(n²) при плохом pivot.
- **Heap sort** — через кучу, in-place, O(n log n) гарантированно, нестабильная.

### Что спрашивают
- **Стабильность** — сохраняется ли порядок равных элементов. Важно при сортировке по нескольким ключам.
- \`Array.prototype.sort\` в V8 — **Timsort** (гибрид merge + insertion), стабильный с ES2019.
- Без компаратора \`sort()\` сравнивает как **строки**: \`[10, 2, 1].sort()\` → \`[1, 10, 2]\`.

### Задачи LeetCode
912 Sort an Array · 75 Sort Colors (Dutch flag) · 88 Merge Sorted Array · 148 Sort List · 215 Kth Largest Element
        `),
        examples: [
          {
            title: "Визуализатор: Bubble / Selection / Insertion",
            description: "Выбери алгоритм и запусти — жёлтый = сравнение, красный = обмен, зелёный = на месте",
            code: r(`
import { useState, useEffect, useRef } from "react";

function genSteps(input, algo) {
  const a = [...input];
  const n = a.length;
  const steps = [];
  const sorted = [];
  const snap = (compare, swap) => steps.push({ arr: [...a], compare, swap, sorted: [...sorted] });

  if (algo === "bubble") {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        snap([j, j + 1], []);
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          snap([], [j, j + 1]);
        }
      }
      sorted.push(n - i - 1);
    }
  } else if (algo === "selection") {
    for (let i = 0; i < n; i++) {
      let min = i;
      for (let j = i + 1; j < n; j++) {
        snap([min, j], []);
        if (a[j] < a[min]) min = j;
      }
      if (min !== i) { [a[i], a[min]] = [a[min], a[i]]; snap([], [i, min]); }
      sorted.push(i);
    }
  } else {
    sorted.push(0);
    for (let i = 1; i < n; i++) {
      let j = i;
      while (j > 0) {
        snap([j - 1, j], []);
        if (a[j - 1] > a[j]) {
          [a[j - 1], a[j]] = [a[j], a[j - 1]];
          snap([], [j - 1, j]);
          j--;
        } else break;
      }
      sorted.push(i);
    }
  }
  snap([], []);
  return steps;
}

const START = [34, 12, 78, 23, 9, 56, 41, 5, 67, 28];

export default function App() {
  const [algo, setAlgo] = useState("bubble");
  const [steps, setSteps] = useState(() => genSteps(START, "bubble"));
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(120);
  const timer = useRef(null);

  const reset = (nextAlgo) => {
    const newAlgo = nextAlgo || algo;
    setAlgo(newAlgo);
    setSteps(genSteps(START, newAlgo));
    setI(0);
    setPlaying(false);
  };

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setI((prev) => {
        if (prev >= steps.length - 1) { setPlaying(false); return prev; }
        return prev + 1;
      });
    }, speed);
    return () => clearInterval(timer.current);
  }, [playing, speed, steps]);

  const step = steps[i];
  const max = Math.max(...START);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {["bubble", "selection", "insertion"].map((k) => (
          <button key={k} onClick={() => reset(k)} style={{
            padding: "5px 12px", borderRadius: 8, cursor: "pointer", border: "1px solid #888",
            background: algo === k ? "#6366f1" : "transparent", color: algo === k ? "white" : "inherit",
          }}>{k}</button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 150, marginBottom: 10 }}>
        {step.arr.map((v, idx) => {
          let bg = "#6366f1";
          if (step.sorted.includes(idx)) bg = "#22c55e";
          if (step.compare.includes(idx)) bg = "#eab308";
          if (step.swap.includes(idx)) bg = "#ef4444";
          return (
            <motion.div key={idx} layout
              animate={{ height: (v / max) * 140 + 10, backgroundColor: bg }}
              transition={{ duration: 0.15 }}
              style={{ flex: 1, borderRadius: "4px 4px 0 0", display: "flex",
                alignItems: "flex-start", justifyContent: "center", color: "white",
                fontSize: 10, paddingTop: 2 }}
            >{v}</motion.div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={() => setPlaying((p) => !p)} disabled={i >= steps.length - 1}
          style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer" }}>
          {playing ? "⏸ Пауза" : "▶ Старт"}
        </button>
        <button onClick={() => reset()} style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer" }}>↺ Сброс</button>
        <input type="range" min={20} max={400} value={speed}
          onChange={(e) => setSpeed(+e.target.value)} style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "#888" }}>шаг {i}/{steps.length - 1}</span>
      </div>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "binary-search-patterns",
        title: "Бинарный поиск: шаблоны",
        description: "Классика, граница (lower/upper bound), поиск по ответу",
        theory: r(`
Бинарный поиск — это не «найти число в массиве». Это **отсечение половины пространства решений за шаг**. O(log n).

### Условие применимости
Должна существовать **монотонность**: если ответ «да» для x, то и для всех x' по одну сторону. Тогда ищем границу перехода «нет → да».

### Три шаблона

**1. Классический — найти точное значение**
\`\`\`js
let lo = 0, hi = n - 1;
while (lo <= hi) {
  const mid = (lo + hi) >> 1;
  if (a[mid] === target) return mid;
  if (a[mid] < target) lo = mid + 1;
  else hi = mid - 1;
}
return -1;
\`\`\`

**2. Граница (lower bound) — первый элемент >= target**
\`\`\`js
let lo = 0, hi = n;          // hi = n, не n-1
while (lo < hi) {
  const mid = (lo + hi) >> 1;
  if (a[mid] < target) lo = mid + 1;
  else hi = mid;             // mid может быть ответом
}
return lo;
\`\`\`

**3. Поиск по ответу** — пространство = не массив, а диапазон возможных ответов. Есть монотонная функция-предикат \`canDo(x)\` → бинарим по x. Так решаются «минимальная скорость», «минимальный размер», «дни/Коко ест бананы».

### Грабли
- **Зацикливание**: при \`lo < hi\` нельзя писать \`hi = mid - 1\` если mid может быть ответом; при \`lo <= hi\` обязательно сдвигать обе границы.
- **Переполнение** \`(lo + hi)\` — в JS неактуально, но привычка: \`lo + ((hi - lo) >> 1)\`.
- Какой инвариант у границ — держи в голове постоянно: что значит \`lo\`, что значит \`hi\`.

### Задачи LeetCode
704 Binary Search · 35 Search Insert Position · 34 First and Last Position · 33 Search in Rotated Array · 153 Min in Rotated Array · 875 Koko Eating Bananas · 162 Find Peak Element
        `),
        examples: [
          {
            title: "Бинарный поиск шаг за шагом",
            description: "lo/hi сужают зону, mid — текущая проверка; зелёный — найдено",
            code: r(`
import { useState, useEffect, useRef } from "react";

const ARR = [3, 8, 12, 16, 23, 38, 56, 72, 91, 100, 113, 128];

function genSteps(arr, target) {
  const steps = [];
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    steps.push({ lo, hi, mid, found: arr[mid] === target });
    if (arr[mid] === target) break;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  if (!steps.length || !steps[steps.length - 1].found) {
    steps.push({ lo: -1, hi: -1, mid: -1, found: false, done: true });
  }
  return steps;
}

export default function App() {
  const [target, setTarget] = useState(72);
  const [steps, setSteps] = useState(() => genSteps(ARR, 72));
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const reset = (t) => {
    const tt = t === undefined ? target : t;
    setTarget(tt);
    setSteps(genSteps(ARR, tt));
    setI(0);
    setPlaying(false);
  };

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setI((p) => { if (p >= steps.length - 1) { setPlaying(false); return p; } return p + 1; });
    }, 700);
    return () => clearInterval(timer.current);
  }, [playing, steps]);

  const s = steps[i];

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ marginBottom: 12, fontSize: 13 }}>
        target:
        {[16, 72, 113, 50].map((t) => (
          <button key={t} onClick={() => reset(t)} style={{
            margin: "0 4px", padding: "3px 9px", borderRadius: 6, cursor: "pointer",
            border: "1px solid #888", background: target === t ? "#6366f1" : "transparent",
            color: target === t ? "white" : "inherit",
          }}>{t}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {ARR.map((v, idx) => {
          const inRange = s.lo <= idx && idx <= s.hi;
          let bg = inRange ? "#1e293b" : "#0f172a";
          let border = "1px solid #334155";
          if (idx === s.mid) { bg = s.found ? "#22c55e" : "#eab308"; border = "1px solid white"; }
          return (
            <motion.div key={idx} animate={{ backgroundColor: bg }} style={{
              flex: 1, height: 44, border, borderRadius: 6, display: "flex",
              flexDirection: "column", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: 12,
            }}>
              {v}
              <span style={{ fontSize: 9, color: "#94a3b8" }}>
                {idx === s.lo ? "lo" : ""}{idx === s.hi ? (idx === s.lo ? "/hi" : "hi") : ""}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={() => setPlaying((p) => !p)} disabled={i >= steps.length - 1}
          style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer" }}>
          {playing ? "⏸" : "▶"}
        </button>
        <button onClick={() => reset()} style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer" }}>↺</button>
        <span style={{ fontSize: 13, color: "#888" }}>
          {s.done ? "не найдено" : s.found ? "✅ найдено на индексе " + s.mid : "проверяем mid = " + s.mid}
        </span>
      </div>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "two-pointers",
        title: "Два указателя",
        description: "Встречное движение, быстрый/медленный, разделение",
        theory: r(`
Паттерн «два указателя» заменяет вложенный цикл O(n²) на один проход O(n) за счёт того, что указатели **движутся навстречу или с разной скоростью**, не возвращаясь назад.

### Виды

**1. Встречное движение (opposite ends)** — на **отсортированном** массиве. \`left\` с начала, \`right\` с конца, двигаем тот, который приближает к ответу.
- Two Sum II, Valid Palindrome, Container With Most Water, 3Sum (фиксируем один + два указателя).

**2. Быстрый и медленный (fast & slow)** — разная скорость. Поиск цикла (Флойд), середина списка, n-й с конца.
- Linked List Cycle, Middle of Linked List, Happy Number.

**3. Разделение (partition)** — один указатель пишет, другой читает. Удаление дубликатов inline, перемещение нулей, Dutch flag.
- Remove Duplicates, Move Zeroes, Sort Colors.

### Почему это работает (встречное движение)
На отсортированном массиве: если \`a[left] + a[right] > target\`, то и любая пара с этим \`right\` и большим \`left\` тоже больше — значит \`right\` можно безопасно сдвинуть влево, **не теряя решений**. Это инвариант, который надо уметь проговорить на собесе.

### Грабли
- Указатели должны двигаться **монотонно** — иначе не O(n).
- Не перепутать условие остановки: \`left < right\` vs \`left <= right\`.
- Для встречного движения массив **обязан быть отсортирован**.

### Задачи LeetCode
167 Two Sum II · 125 Valid Palindrome · 11 Container With Most Water · 15 3Sum · 26 Remove Duplicates · 283 Move Zeroes · 75 Sort Colors
        `),
        examples: [
          {
            title: "Two Sum на отсортированном массиве",
            description: "left/right сходятся: сумма больше target — двигаем right, меньше — left",
            code: r(`
import { useState, useEffect, useRef } from "react";

const ARR = [2, 5, 8, 12, 17, 21, 26, 30, 38, 45];

function genSteps(arr, target) {
  const steps = [];
  let l = 0, r = arr.length - 1;
  while (l < r) {
    const sum = arr[l] + arr[r];
    steps.push({ l, r, sum, found: sum === target });
    if (sum === target) break;
    if (sum < target) l++;
    else r--;
  }
  return steps;
}

export default function App() {
  const [target, setTarget] = useState(43);
  const [steps, setSteps] = useState(() => genSteps(ARR, 43));
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const reset = (t) => {
    const tt = t === undefined ? target : t;
    setTarget(tt); setSteps(genSteps(ARR, tt)); setI(0); setPlaying(false);
  };

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setI((p) => { if (p >= steps.length - 1) { setPlaying(false); return p; } return p + 1; });
    }, 800);
    return () => clearInterval(timer.current);
  }, [playing, steps]);

  const s = steps[i];

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ marginBottom: 12, fontSize: 13 }}>
        target:
        {[43, 14, 50, 7].map((t) => (
          <button key={t} onClick={() => reset(t)} style={{
            margin: "0 4px", padding: "3px 9px", borderRadius: 6, cursor: "pointer",
            border: "1px solid #888", background: target === t ? "#6366f1" : "transparent",
            color: target === t ? "white" : "inherit",
          }}>{t}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {ARR.map((v, idx) => {
          const isL = idx === s.l, isR = idx === s.r;
          let bg = "#1e293b";
          if (isL || isR) bg = s.found ? "#22c55e" : "#6366f1";
          return (
            <motion.div key={idx} animate={{ backgroundColor: bg, scale: isL || isR ? 1.1 : 1 }}
              style={{ flex: 1, height: 46, borderRadius: 6, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", color: "white", fontSize: 13,
                border: "1px solid #334155" }}>
              {v}
              <span style={{ fontSize: 9, color: "#fbbf24" }}>
                {isL ? "L" : ""}{isR ? "R" : ""}
              </span>
            </motion.div>
          );
        })}
      </div>

      <p style={{ fontSize: 13, color: "#888", minHeight: 20 }}>
        {s ? (s.found
          ? "✅ " + ARR[s.l] + " + " + ARR[s.r] + " = " + target
          : ARR[s.l] + " + " + ARR[s.r] + " = " + s.sum + (s.sum < target ? " < target → L++" : " > target → R--"))
          : ""}
      </p>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setPlaying((p) => !p)} disabled={i >= steps.length - 1}
          style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer" }}>
          {playing ? "⏸" : "▶"}
        </button>
        <button onClick={() => reset()} style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer" }}>↺</button>
      </div>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "sliding-window",
        title: "Скользящее окно",
        description: "Подмассивы и подстроки за один проход",
        theory: r(`
Скользящее окно — частный случай двух указателей для задач про **непрерывный подотрезок** (подмассив / подстрока). Вместо пересчёта каждого окна с нуля — **инкрементально** обновляем при сдвиге границы.

### Окно фиксированного размера
«Максимальная сумма подмассива длины k». Считаем сумму первого окна, дальше: \`+ новый элемент справа, − выпавший слева\`. O(n) вместо O(n·k).

### Окно переменного размера
«Самая длинная подстрока без повторов», «минимальный подмассив с суммой ≥ target». Скелет:
\`\`\`js
let left = 0;
for (let right = 0; right < n; right++) {
  add(a[right]);                    // расширяем окно вправо
  while (/* окно нарушает условие */) {
    remove(a[left]); left++;        // сжимаем слева
  }
  best = Math.max(best, right - left + 1);
}
\`\`\`

Ключевая идея: **right всегда движется вперёд, left тоже только вперёд** → каждый элемент входит и выходит из окна максимум один раз → O(n), хотя есть вложенный \`while\`.

### Что держать в окне
Часто недостаточно одного числа — нужна структура:
- \`Map\`/\`Set\` — для «без повторов», для подсчёта символов.
- Счётчик «сколько условий выполнено» — для «минимальное окно, содержащее все символы T».
- Дек — для «максимум в окне» (monotonic deque).

### Грабли
- Не забыть **сжимать** окно — иначе это не окно, а просто префикс.
- Когда обновлять ответ — до или после сжатия (зависит от того, ищешь max или min).
- Окно переменного размера ≠ «два вложенных цикла»: left не сбрасывается.

### Задачи LeetCode
3 Longest Substring Without Repeating · 76 Minimum Window Substring · 209 Minimum Size Subarray Sum · 424 Longest Repeating Char Replacement · 239 Sliding Window Maximum · 567 Permutation in String
        `),
        examples: [
          {
            title: "Максимальная сумма окна длины k",
            description: "Окно скользит: справа входит элемент, слева выходит — сумма пересчитывается за O(1)",
            code: r(`
import { useState, useEffect, useRef } from "react";

const ARR = [4, 2, 9, 7, 1, 8, 3, 6, 5, 2, 10, 4];
const K = 4;

function genSteps(arr, k) {
  const steps = [];
  let sum = 0;
  for (let i = 0; i < k; i++) sum += arr[i];
  let best = sum, bestStart = 0;
  steps.push({ start: 0, sum, best, bestStart });
  for (let i = k; i < arr.length; i++) {
    sum += arr[i] - arr[i - k];
    if (sum > best) { best = sum; bestStart = i - k + 1; }
    steps.push({ start: i - k + 1, sum, best, bestStart });
  }
  return steps;
}

export default function App() {
  const steps = useRef(genSteps(ARR, K)).current;
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setI((p) => { if (p >= steps.length - 1) { setPlaying(false); return p; } return p + 1; });
    }, 700);
    return () => clearInterval(timer.current);
  }, [playing]);

  const s = steps[i];
  const max = Math.max(...ARR);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 130, marginBottom: 10 }}>
        {ARR.map((v, idx) => {
          const inWindow = idx >= s.start && idx < s.start + K;
          const inBest = idx >= s.bestStart && idx < s.bestStart + K;
          let bg = "#1e293b";
          if (inBest) bg = "#22c55e";
          if (inWindow) bg = "#6366f1";
          return (
            <motion.div key={idx} animate={{ backgroundColor: bg, height: (v / max) * 110 + 16 }}
              style={{ flex: 1, borderRadius: 5, display: "flex", alignItems: "flex-end",
                justifyContent: "center", color: "white", fontSize: 11, paddingBottom: 2 }}>
              {v}
            </motion.div>
          );
        })}
      </div>
      <p style={{ fontSize: 13, color: "#888" }}>
        Окно [{s.start}..{s.start + K - 1}] · сумма = <b style={{ color: "#a5b4fc" }}>{s.sum}</b> ·
        лучшая = <b style={{ color: "#4ade80" }}>{s.best}</b>
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setPlaying((p) => !p)} disabled={i >= steps.length - 1}
          style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer" }}>{playing ? "⏸" : "▶"}</button>
        <button onClick={() => { setI(0); setPlaying(false); }}
          style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer" }}>↺</button>
        <span style={{ fontSize: 12, color: "#888", alignSelf: "center" }}>шаг {i}/{steps.length - 1}</span>
      </div>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "bfs-dfs-grid",
        title: "BFS и DFS по сетке",
        description: "Обход графа, кратчайший путь, заливка, острова",
        theory: r(`
Сетка (2D-матрица) — это граф, где у каждой клетки 4 (или 8) соседей. Большинство «grid»-задач на LeetCode решаются BFS или DFS.

### BFS — поиск в ширину
Очередь (FIFO). Обходит **по слоям**: сначала все соседи на расстоянии 1, потом 2, и т.д.
- ✅ Находит **кратчайший путь** в невзвешенном графе.
- Используй для: shortest path, «за сколько шагов», multi-source (поджечь все апельсины одновременно).

\`\`\`js
const queue = [[start]];
const seen = new Set([key(start)]);
while (queue.length) {
  const cur = queue.shift();
  for (const next of neighbors(cur)) {
    if (seen.has(key(next))) continue;
    seen.add(key(next));
    queue.push(next);
  }
}
\`\`\`

### DFS — поиск в глубину
Стек / рекурсия. Идёт «вглубь до упора», потом откатывается.
- ✅ Проще пишется рекурсивно, естественен для «посчитать компоненту», заливки, backtracking.
- ❌ **Не даёт** кратчайший путь. На больших сетках рекурсия может переполнить стек.
- Используй для: число островов, площадь региона, flood fill.

### Общие приёмы
- **Помечай посещённое сразу** при добавлении в очередь/при входе — иначе клетка попадёт несколько раз.
- Можно метить прямо в матрице (\`grid[r][c] = '0'\`), если разрешено мутировать — экономит память на \`seen\`.
- **Multi-source BFS** — кладём в очередь сразу все стартовые клетки (Rotting Oranges, 01 Matrix).
- Направления: \`[[1,0],[-1,0],[0,1],[0,-1]]\` — выноси в константу.

### Грабли
- \`queue.shift()\` — это O(n)! На больших сетках держи указатель головы или используй деку.
- Проверка границ \`0 <= r < rows && 0 <= c < cols\` — частый source of bugs.
- BFS для кратчайшего пути работает только если **все рёбра равны**; иначе — Дейкстра / 0-1 BFS.

### Задачи LeetCode
200 Number of Islands · 994 Rotting Oranges · 1091 Shortest Path in Binary Matrix · 542 01 Matrix · 130 Surrounded Regions · 733 Flood Fill · 79 Word Search
        `),
        examples: [
          {
            title: "BFS: кратчайший путь в лабиринте",
            description: "Волна расходится от старта (синий) слоями, потом подсвечивается кратчайший путь (зелёный)",
            code: r(`
import { useState, useEffect, useRef } from "react";

const GRID = [
  [0,0,0,0,0,1,0,0],
  [1,1,0,1,0,1,0,1],
  [0,0,0,1,0,0,0,0],
  [0,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,1,0],
  [1,1,1,1,0,1,1,0],
  [0,0,0,0,0,0,0,0],
];
const ROWS = GRID.length, COLS = GRID[0].length;
const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];

function genSteps() {
  const steps = [];
  const seen = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const prev = {};
  let queue = [[0, 0]];
  seen[0][0] = true;
  const order = [];
  while (queue.length) {
    const next = [];
    for (const [r, c] of queue) {
      order.push([r, c]);
      for (const [dr, dc] of DIRS) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS) continue;
        if (seen[nr][nc] || GRID[nr][nc] === 1) continue;
        seen[nr][nc] = true;
        prev[nr + "," + nc] = [r, c];
        next.push([nr, nc]);
      }
    }
    steps.push({ visited: [...order], path: null });
    queue = next;
  }
  // восстановить путь
  const path = [];
  let cur = [ROWS - 1, COLS - 1];
  if (prev[cur[0] + "," + cur[1]] || (cur[0] === 0 && cur[1] === 0)) {
    while (cur) {
      path.push(cur);
      cur = prev[cur[0] + "," + cur[1]];
    }
  }
  steps.push({ visited: [...order], path: path.reverse() });
  return steps;
}

export default function App() {
  const steps = useRef(genSteps()).current;
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setI((p) => { if (p >= steps.length - 1) { setPlaying(false); return p; } return p + 1; });
    }, 280);
    return () => clearInterval(timer.current);
  }, [playing]);

  const s = steps[i];
  const visitedSet = new Set(s.visited.map(([r, c]) => r + "," + c));
  const pathSet = new Set((s.path || []).map(([r, c]) => r + "," + c));

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(" + COLS + ", 1fr)", gap: 3, marginBottom: 10 }}>
        {GRID.map((row, r) => row.map((cell, c) => {
          const key = r + "," + c;
          let bg = "#1e293b";
          if (cell === 1) bg = "#475569";
          else if (pathSet.has(key)) bg = "#22c55e";
          else if (visitedSet.has(key)) bg = "#6366f1";
          if (r === 0 && c === 0) bg = pathSet.has(key) ? "#22c55e" : "#fbbf24";
          if (r === ROWS - 1 && c === COLS - 1) bg = pathSet.has(key) ? "#22c55e" : "#f97316";
          return (
            <motion.div key={key} animate={{ backgroundColor: bg }}
              style={{ aspectRatio: "1", borderRadius: 4 }} />
          );
        }))}
      </div>
      <p style={{ fontSize: 12, color: "#888" }}>
        🟡 старт · 🟠 цель · 🟦 фронт BFS · 🟩 кратчайший путь · ⬛ стена
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setPlaying((p) => !p)} disabled={i >= steps.length - 1}
          style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer" }}>{playing ? "⏸" : "▶"}</button>
        <button onClick={() => { setI(0); setPlaying(true); }}
          style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer" }}>↺</button>
        <span style={{ fontSize: 12, color: "#888", alignSelf: "center" }}>слой {i}/{steps.length - 1}</span>
      </div>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "linked-list-patterns",
        title: "Связные списки",
        description: "Разворот, поиск цикла (Флойд), быстрый/медленный указатель",
        theory: r(`
Связный список на собесе — это проверка на аккуратную работу с указателями. Главный навык — **не потерять ссылку** при перестановке.

### Разворот списка
Классика. Три указателя: \`prev\`, \`cur\`, \`next\`. На каждом шаге запоминаем \`next\`, разворачиваем ссылку \`cur.next = prev\`, сдвигаем всё вперёд.
\`\`\`js
let prev = null, cur = head;
while (cur) {
  const next = cur.next;   // сохранить, иначе потеряем хвост
  cur.next = prev;         // развернуть
  prev = cur;              // сдвинуть
  cur = next;
}
return prev;               // новая голова
\`\`\`

### Быстрый и медленный указатель
\`slow\` идёт по 1 шагу, \`fast\` — по 2.
- **Середина списка**: когда \`fast\` дошёл до конца, \`slow\` — посередине.
- **Поиск цикла (Флойд)**: если есть цикл, \`fast\` рано или поздно «догонит» \`slow\` внутри петли. Если \`fast\` дошёл до \`null\` — цикла нет.
- **Начало цикла**: после встречи переставляем один указатель в head и двигаем оба по 1 — встретятся в начале петли (математика модулярной арифметики).

### n-й элемент с конца
Два указателя с **разрывом в n шагов**: сначала \`fast\` уходит на n вперёд, потом оба идут вместе — когда \`fast\` упрётся в конец, \`slow\` на нужном элементе.

### Приёмы
- **Dummy node** (\`dummy.next = head\`) — избавляет от спецслучая «удаляем/вставляем в голову».
- Рисуй на бумаге — 90% багов видно сразу.
- Рекурсия для списков элегантна, но O(n) стека — на больших списках лучше итеративно.

### Грабли
- Потеря ссылки: переставил \`cur.next\` до того, как сохранил старый \`next\`.
- Зацикливание: забыл обнулить \`.next\` у бывшего хвоста.
- \`fast.next.next\` без проверки \`fast && fast.next\` → \`TypeError\`.

### Задачи LeetCode
206 Reverse Linked List · 141 Linked List Cycle · 142 Cycle II · 876 Middle of the List · 19 Remove Nth From End · 21 Merge Two Sorted · 234 Palindrome Linked List
        `),
        examples: [
          {
            title: "Разворот связного списка",
            description: "prev / cur / next переставляют стрелки — список разворачивается на месте",
            code: r(`
import { useState, useEffect, useRef } from "react";

const VALUES = [10, 20, 30, 40, 50];

function genSteps() {
  const steps = [];
  // модель: массив узлов, links[i] = индекс следующего (или null)
  const links = VALUES.map((_, i) => (i < VALUES.length - 1 ? i + 1 : null));
  let prev = null, cur = 0;
  steps.push({ links: [...links], prev, cur, next: links[cur] });
  while (cur !== null) {
    const next = links[cur];
    links[cur] = prev;
    prev = cur;
    cur = next;
    steps.push({ links: [...links], prev, cur, next: cur !== null ? links[cur] : null });
  }
  return steps;
}

export default function App() {
  const steps = useRef(genSteps()).current;
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setI((p) => { if (p >= steps.length - 1) { setPlaying(false); return p; } return p + 1; });
    }, 900);
    return () => clearInterval(timer.current);
  }, [playing]);

  const s = steps[i];

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {VALUES.map((v, idx) => {
          let ring = "2px solid #334155";
          if (idx === s.cur) ring = "2px solid #eab308";
          else if (idx === s.prev) ring = "2px solid #22c55e";
          return (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <motion.div animate={{ borderColor: ring.split(" ")[2] }} style={{
                width: 44, height: 44, borderRadius: 10, border: ring, display: "flex",
                flexDirection: "column", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: 13, background: "#1e293b",
              }}>
                {v}
                <span style={{ fontSize: 8, color: "#fbbf24" }}>
                  {idx === s.cur ? "cur" : ""}{idx === s.prev ? "prev" : ""}
                </span>
              </motion.div>
              <span style={{ color: "#64748b", fontSize: 16 }}>
                {s.links[idx] === null ? "⦰" : s.links[idx] < idx ? "←" : "→"}
              </span>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 13, color: "#888" }}>
        {i === 0 ? "Старт: prev = null, cur = голова" :
         i === steps.length - 1 ? "✅ Готово — prev стал новой головой" :
         "Развернули стрелку cur → prev, сдвинули указатели"}
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setPlaying((p) => !p)} disabled={i >= steps.length - 1}
          style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer" }}>{playing ? "⏸" : "▶"}</button>
        <button onClick={() => { setI(0); setPlaying(false); }}
          style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer" }}>↺</button>
      </div>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "dp-viz",
        title: "Динамическое программирование",
        description: "Мемоизация, таблица, перекрывающиеся подзадачи",
        theory: r(`
DP — это «рекурсия, которая не считает одно и то же дважды». Применима, когда задача обладает двумя свойствами:
1. **Перекрывающиеся подзадачи** — одни и те же подзадачи встречаются много раз.
2. **Оптимальная подструктура** — ответ задачи строится из ответов подзадач.

### Два стиля
- **Top-down (мемоизация)** — обычная рекурсия + кеш. Пишется быстрее, считает только нужные состояния.
- **Bottom-up (табуляция)** — цикл, заполняем таблицу от базовых случаев. Нет накладных расходов на рекурсию, легко оптимизировать память.

### Как придумать DP-решение
1. **Состояние** — что описывает подзадачу? (\`dp[i]\` = ответ для префикса длины i)
2. **Переход** — как \`dp[i]\` выражается через предыдущие?
3. **База** — самые маленькие случаи.
4. **Порядок** — в каком порядке заполнять, чтобы нужное уже было посчитано.
5. **Ответ** — в какой ячейке итог.

### Классы задач
- **Линейные**: Climbing Stairs, House Robber, Fibonacci — \`dp[i]\` зависит от \`dp[i-1]\`, \`dp[i-2]\`.
- **На сетке**: Unique Paths, Min Path Sum — \`dp[r][c]\` из \`dp[r-1][c]\` и \`dp[r][c-1]\`.
- **Подпоследовательности**: LCS, LIS, Edit Distance — двумерная таблица по двум строкам.
- **Knapsack**: Coin Change, Partition Equal Subset — состояние «предмет + остаток».

### Оптимизация памяти
Если \`dp[i]\` зависит только от \`dp[i-1]\` — не нужна вся таблица, хватит пары переменных (Fibonacci за O(1) памяти). На сетке часто хватает одной строки.

### Грабли
- Неправильно выбранное состояние → переход не выражается. Это 80% сложности DP.
- Забыть базовый случай или границы таблицы.
- Жадность вместо DP: «брать побольше» не всегда оптимально (Coin Change на монетах [1,3,4], сумма 6).

### Задачи LeetCode
70 Climbing Stairs · 198 House Robber · 322 Coin Change · 1143 LCS · 300 LIS · 62 Unique Paths · 64 Min Path Sum · 416 Partition Equal Subset Sum
        `),
        examples: [
          {
            title: "Unique Paths: заполнение DP-таблицы",
            description: "Каждая клетка = сумма верхней и левой. Робот идёт из угла в угол только вправо/вниз",
            code: r(`
import { useState, useEffect, useRef } from "react";

const ROWS = 5, COLS = 7;

function genSteps() {
  const steps = [];
  const dp = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (r === 0 || c === 0) dp[r][c] = 1;
      else dp[r][c] = dp[r - 1][c] + dp[r][c - 1];
      steps.push({ dp: dp.map((row) => [...row]), cur: [r, c] });
    }
  }
  return steps;
}

export default function App() {
  const steps = useRef(genSteps()).current;
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setI((p) => { if (p >= steps.length - 1) { setPlaying(false); return p; } return p + 1; });
    }, 220);
    return () => clearInterval(timer.current);
  }, [playing]);

  const s = steps[i];
  const [cr, cc] = s.cur;

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(" + COLS + ", 1fr)", gap: 4, marginBottom: 10 }}>
        {s.dp.map((row, r) => row.map((val, c) => {
          const filled = r < cr || (r === cr && c <= cc);
          const isCur = r === cr && c === cc;
          const isSource = (r === cr - 1 && c === cc) || (r === cr && c === cc - 1);
          let bg = "#0f172a";
          if (filled) bg = "#1e293b";
          if (isSource) bg = "#6366f1";
          if (isCur) bg = "#eab308";
          return (
            <motion.div key={r + "-" + c} animate={{ backgroundColor: bg }}
              style={{ aspectRatio: "1", borderRadius: 5, display: "grid", placeItems: "center",
                color: "white", fontSize: 12, border: "1px solid #334155" }}>
              {filled ? val : ""}
            </motion.div>
          );
        }))}
      </div>
      <p style={{ fontSize: 13, color: "#888" }}>
        dp[{cr}][{cc}] = верхняя + левая = <b style={{ color: "#fbbf24" }}>{s.dp[cr][cc]}</b>
        {i === steps.length - 1 && "  →  всего путей: " + s.dp[ROWS - 1][COLS - 1]}
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setPlaying((p) => !p)} disabled={i >= steps.length - 1}
          style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer" }}>{playing ? "⏸" : "▶"}</button>
        <button onClick={() => { setI(0); setPlaying(true); }}
          style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer" }}>↺</button>
      </div>
    </div>
  );
}
`),
          },
        ],
      },
      {
        id: "backtracking",
        title: "Бэктрекинг",
        description: "Перебор с возвратом: подмножества, перестановки, N ферзей",
        theory: r(`
Бэктрекинг — систематический перебор всех вариантов: **делаем выбор → идём глубже → отменяем выбор (возврат) → пробуем следующий**. Это DFS по дереву решений.

### Скелет
\`\`\`js
function backtrack(path, choices) {
  if (/* path — готовое решение */) {
    result.push([...path]);   // копию! path меняется дальше
    return;
  }
  for (const choice of choices) {
    if (!isValid(choice)) continue;   // отсечение (pruning)
    path.push(choice);                // выбрали
    backtrack(path, nextChoices);     // углубились
    path.pop();                       // отменили — ВОЗВРАТ
  }
}
\`\`\`

### Три классических класса
- **Подмножества** (Subsets, 2ⁿ штук) — для каждого элемента выбор «взять / не взять».
- **Перестановки** (Permutations, n! штук) — на каждом уровне выбираем неиспользованный элемент.
- **Комбинации / разбиения** (Combination Sum, Partition) — выбираем с ограничением.

### Отсечения (pruning) — это главное
Голый перебор экспоненциален. Бэктрекинг быстр там, где можно **рано отбросить ветку**:
- N ферзей: не ставим ферзя на бьющуюся клетку → не спускаемся в заведомо мёртвую ветку.
- Combination Sum: если текущая сумма уже > target → не продолжаем.
- Сортировка входа + пропуск дубликатов → не генерируем одинаковые решения.

### Сложность
Обычно экспоненциальная: O(2ⁿ), O(n!), O(n·2ⁿ). Бэктрекинг не делает её полиномиальной — он лишь **не тратит время на заведомо невалидные ветки**.

### Грабли
- Сохранять **копию** \`path\`, а не ссылку — иначе все решения окажутся одинаковыми (пустыми).
- Не забыть \`path.pop()\` — состояние «протекает» в соседние ветки.
- Дубликаты: без сортировки и пропуска \`if (i > start && nums[i] === nums[i-1]) continue\` получишь повторы.

### Задачи LeetCode
78 Subsets · 46 Permutations · 39 Combination Sum · 51 N-Queens · 79 Word Search · 17 Letter Combinations · 131 Palindrome Partitioning
        `),
        examples: [
          {
            title: "N ферзей: перебор с возвратом",
            description: "Ферзь ставится в безопасную клетку; если тупик — backtrack (красная вспышка) и пробуем дальше",
            code: r(`
import { useState, useEffect, useRef } from "react";

const N = 6;

function genSteps() {
  const steps = [];
  const cols = new Set(), d1 = new Set(), d2 = new Set();
  const placement = [];
  function solve(row) {
    if (row === N) { steps.push({ placement: [...placement], kind: "solved" }); return true; }
    for (let c = 0; c < N; c++) {
      steps.push({ placement: [...placement], kind: "try", cell: [row, c] });
      if (cols.has(c) || d1.has(row - c) || d2.has(row + c)) {
        steps.push({ placement: [...placement], kind: "reject", cell: [row, c] });
        continue;
      }
      cols.add(c); d1.add(row - c); d2.add(row + c); placement[row] = c;
      steps.push({ placement: [...placement], kind: "place", cell: [row, c] });
      if (solve(row + 1)) return true;
      cols.delete(c); d1.delete(row - c); d2.delete(row + c);
      placement.length = row;
      steps.push({ placement: [...placement], kind: "backtrack", cell: [row, c] });
    }
    return false;
  }
  solve(0);
  return steps;
}

export default function App() {
  const steps = useRef(genSteps()).current;
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setI((p) => { if (p >= steps.length - 1) { setPlaying(false); return p; } return p + 1; });
    }, 90);
    return () => clearInterval(timer.current);
  }, [playing]);

  const s = steps[i];
  const [tr, tc] = s.cell || [-1, -1];

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(" + N + ", 1fr)", gap: 2,
        marginBottom: 10, maxWidth: 300 }}>
        {Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => {
          const hasQueen = s.placement[r] === c;
          const isTry = r === tr && c === tc;
          let bg = (r + c) % 2 ? "#1e293b" : "#0f172a";
          if (isTry && s.kind === "reject") bg = "#7f1d1d";
          if (isTry && s.kind === "backtrack") bg = "#ef4444";
          if (isTry && s.kind === "try") bg = "#854d0e";
          return (
            <motion.div key={r + "-" + c} animate={{ backgroundColor: bg }}
              style={{ aspectRatio: "1", borderRadius: 3, display: "grid", placeItems: "center", fontSize: 16 }}>
              {hasQueen && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>♛</motion.span>
              )}
            </motion.div>
          );
        }))}
      </div>
      <p style={{ fontSize: 13, minHeight: 20, color:
        s.kind === "backtrack" ? "#ef4444" : s.kind === "solved" ? "#22c55e" : "#888" }}>
        {s.kind === "try" && "Пробуем строку " + tr + ", столбец " + tc}
        {s.kind === "reject" && "❌ Клетка бьётся — пропускаем"}
        {s.kind === "place" && "✓ Ферзь поставлен — идём в следующую строку"}
        {s.kind === "backtrack" && "↩ Тупик — снимаем ферзя, возврат"}
        {s.kind === "solved" && "🎉 Решение найдено!"}
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setPlaying((p) => !p)} disabled={i >= steps.length - 1}
          style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer" }}>{playing ? "⏸" : "▶"}</button>
        <button onClick={() => { setI(0); setPlaying(true); }}
          style={{ padding: "6px 14px", borderRadius: 8, cursor: "pointer" }}>↺</button>
        <span style={{ fontSize: 12, color: "#888", alignSelf: "center" }}>шаг {i}/{steps.length - 1}</span>
      </div>
    </div>
  );
}
`),
          },
        ],
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
