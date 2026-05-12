## 📝 Теория

### Что такое JSX
JSX — синтаксический сахар над `React.createElement()`. Он не является ни HTML, ни шаблонным языком — это JavaScript с XML-подобным синтаксисом. Браузер не умеет его читать: Babel/SWC транспилирует JSX в обычные JS-вызовы.

```tsx
// То, что ты пишешь:
const el = <h1 className="title">Hello, {name}</h1>;

// То, во что это превращается (React 17+ new JSX transform):
import { jsx as _jsx } from "react/jsx-runtime";
const el = _jsx("h1", { className: "title", children: `Hello, ${name}` });

// До React 17 — нужен был import React from 'react' в каждом файле:
const el = React.createElement("h1", { className: "title" }, `Hello, ${name}`);
```

### Ключевые правила JSX

**1. Один корневой элемент** — нельзя вернуть два элемента без обёртки:
```tsx
// ❌
return <h1>Заголовок</h1><p>Параграф</p>;

// ✅ Div-обёртка
return <div><h1>Заголовок</h1><p>Параграф</p></div>;

// ✅ Fragment — не создаёт лишний DOM-узел
return <><h1>Заголовок</h1><p>Параграф</p></>;
```

**2. Отличия JSX от HTML:**
```tsx
// HTML-атрибуты → camelCase в JSX
class        → className
for          → htmlFor
tabindex     → tabIndex
stroke-width → strokeWidth

// Стили — объект, не строка
<div style={{ color: "red", fontSize: 16, marginTop: "8px" }}>

// Самозакрывающиеся теги — обязательно /
<img src="..." />
<br />
<input type="text" />

// Комментарии — только через выражение
{/* это комментарий */}
```

**3. Выражения в фигурных скобках** — любой валидный JS:
```tsx
const user = { name: "Daniil", age: 25 };
const items = ["React", "TypeScript", "Node"];

<div>
  {user.name.toUpperCase()}                   {/* строка */}
  {user.age > 18 ? "взрослый" : "ребёнок"}   {/* тернарник */}
  {items.length} элементов                    {/* число */}
  {new Date().toLocaleDateString("ru-RU")}    {/* вызов метода */}
  {items.join(", ")}                          {/* метод массива */}
</div>
```

### Условный рендеринг — все подходы

```tsx
const isLoggedIn = true;
const role = "admin";
const count = 0;
const items = ["a", "b"];

// Подход 1: тернарный оператор — лучший для if/else
{isLoggedIn ? <Dashboard /> : <LoginPage />}

// Подход 2: && — только для "показать/скрыть"
{isLoggedIn && <UserMenu />}

// Подход 3: переменная — хорошо для сложной логики
let content;
if (!isLoggedIn) content = <LoginPage />;
else if (role === "admin") content = <AdminPanel />;
else content = <UserDashboard />;
return <main>{content}</main>;

// Подход 4: switch через немедленно вызываемая функция (IIFE)
{(() => {
  switch (role) {
    case "admin":     return <AdminPanel />;
    case "moderator": return <ModPanel />;
    default:          return <UserPanel />;
  }
})()}

// Подход 5: объект-маппинг (чище чем switch)
const panels: Record<string, JSX.Element> = {
  admin:     <AdminPanel />,
  moderator: <ModPanel />,
  user:      <UserPanel />,
};
{panels[role] ?? <GuestPanel />}

// Подход 6: null для "ничего не рендерить"
{isLoading ? <Spinner /> : null}
```

### Рендер списков

```tsx
const users = [
  { id: 1, name: "Alice", active: true },
  { id: 2, name: "Bob",   active: false },
];

// Базовый map
<ul>
  {users.map(user => (
    <li key={user.id} className={user.active ? "active" : ""}>
      {user.name}
    </li>
  ))}
</ul>

// Фильтрация + map
<ul>
  {users
    .filter(u => u.active)
    .map(u => <li key={u.id}>{u.name}</li>)}
</ul>

// Вложенные списки
{categories.map(cat => (
  <section key={cat.id}>
    <h2>{cat.name}</h2>
    <ul>
      {cat.items.map(item => (
        <li key={item.id}>{item.title}</li>
      ))}
    </ul>
  </section>
))}
```

---

## ⚠️ Подводные камни

### 1. `&&` с нулём — рендерит `0`
```tsx
const count = 0;

// ❌ — рендерит символ "0" в DOM
{count && <span>Найдено: {count}</span>}

// ✅ Явное Boolean приведение
{count > 0 && <span>Найдено: {count}</span>}
{!!count && <span>Найдено: {count}</span>}
{Boolean(count) && <span>Найдено: {count}</span>}

// Та же проблема с пустой строкой:
const name = "";
{name && <p>{name}</p>}  // рендерит "" (пустую строку, но без ошибки)
// ✅ name.length > 0 && ...
```

### 2. Объекты и массивы нельзя рендерить напрямую
```tsx
// ❌ Ошибка: Objects are not valid as a React child
const user = { name: "Daniil" };
<div>{user}</div>

// ✅ Доступ к полю
<div>{user.name}</div>

// ✅ JSON для отладки
<pre>{JSON.stringify(user, null, 2)}</pre>

// ⚠️ Массив примитивов — работает, но без ключей
<div>{["a", "b", "c"]}</div>  // "abc" — но лучше явный map с key
```

### 3. Statement-ы нельзя использовать в JSX
```tsx
// ❌ if, for, while — это statements, не expressions
{if (x) <div />}         // SyntaxError
{for (const i of arr) <li>{i}</li>}  // SyntaxError

// ✅ Только expressions: тернарник, &&, map, вызовы функций
{x ? <div /> : null}
{arr.map(i => <li key={i}>{i}</li>)}
```

### 4. Spread props — осторожно с HTML-атрибутами
```tsx
const props = { isLoading: true, onClick: fn, className: "btn" };

// ❌ isLoading попадёт в DOM — React предупредит
<button {...props}>Click</button>

// ✅ Деструктурируй нестандартные атрибуты
const { isLoading, ...htmlProps } = props;
<button {...htmlProps} disabled={isLoading}>Click</button>
```

### 5. Ключи в списках
```tsx
// ❌ index — баги при вставке/удалении/перестановке
{items.map((item, i) => <Item key={i} {...item} />)}

// ✅ Стабильный уникальный ID
{items.map(item => <Item key={item.id} {...item} />)}
```

---

## 🔬 Тонкие моменты

**`null`, `undefined`, `false` — не рендерятся, но занимают место в vDOM**
```tsx
// Всё это ничего не рендерит:
{null}       // ничего
{undefined}  // ничего
{false}      // ничего
{true}       // ничего — но нельзя как текст!

// Вот почему это работает как "условный рендер":
{isOpen && <Modal />}  // false → ничего; <Modal /> → рендерит
```

**Пробелы и переносы строк**
```tsx
// JSX игнорирует пробелы между элементами (в отличие от HTML)
<span>Hello</span>   <span>World</span>  // HelloWorld без пробела!

// ✅ Явный пробел
<span>Hello</span>{" "}<span>World</span>
// или в одной строке
<span>Hello</span> <span>World</span>  // работает если inline
```

**Вычисляемые имена пропсов**
```tsx
const disabled = { disabled: true };
<input {...disabled} />         // <input disabled>

const key = "aria-label";
<button {...{ [key]: "Close" }}>✕</button>
```

**JSX как значение — полноценное выражение**
```tsx
// Можно присваивать переменной
const icon = isAdmin ? <AdminIcon /> : <UserIcon />;

// Передавать как аргумент
const modal = createPortal(<Modal />, document.body);

// Возвращать из функции
function getContent(type: string) {
  if (type === "video") return <VideoPlayer />;
  if (type === "image") return <ImageViewer />;
  return <TextContent />;
}
```

---

## 🧩 Задачи для закрепления

**Задача 1 — Badge компонент**
Создай компонент `Badge` принимающий `variant: "success" | "warning" | "error" | "info"` и `children`. Цвет и иконка меняются в зависимости от variant. Используй объект-маппинг вместо switch.

**Задача 2 — Склонения**
Компонент `Counter` принимает `count: number` и рендерит правильную форму: «1 задача», «2 задачи», «5 задач», «11 задач».

**Задача 3 — Дерево категорий**
Получи JSON с вложенными категориями (3 уровня), отрендери дерево через рекурсивный компонент. Убедись что ключи корректны на каждом уровне.

**Задача 4 — Условная форма**
Форма с чекбоксом «Юридическое лицо» — при включении показывает дополнительные поля (ИНН, КПП, название компании) с плавной анимацией через CSS transitions.
