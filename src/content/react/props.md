## 📝 Теория

### Что такое Props

Props (сокращение от *properties*) — это механизм передачи данных от родительского компонента к дочернему. Props **иммутабельны** с точки зрения дочернего компонента: он не может их изменить, только читать. Это однонаправленный поток данных (one-way data flow).

```jsx
// Родитель передаёт данные
function Parent() {
  return <Child name="Alice" age={30} isAdmin={true} />;
}

// Дочерний получает как объект props
function Child(props) {
  return <p>{props.name}, {props.age} лет</p>;
}
```

Под капотом React превращает JSX-атрибуты в объект и передаёт его первым аргументом функции компонента.

---

### Деструктуризация props

Деструктуризация — стандартный способ работы с props. Делает код чище.

```jsx
// ❌ Без деструктуризации — многословно
function UserCard(props) {
  return (
    <div>
      <h2>{props.name}</h2>
      <p>{props.email}</p>
      <span>{props.role}</span>
    </div>
  );
}

// ✅ С деструктуризацией в параметрах
function UserCard({ name, email, role }) {
  return (
    <div>
      <h2>{name}</h2>
      <p>{email}</p>
      <span>{role}</span>
    </div>
  );
}

// ✅ С переименованием (если имя prop конфликтует)
function Button({ onClick: handleClick, type: btnType = "button" }) {
  return <button type={btnType} onClick={handleClick}>Click</button>;
}

// ✅ С вложенной деструктуризацией
function Profile({ user: { name, avatar }, settings: { theme } }) {
  return <div className={theme}><img src={avatar} />{name}</div>;
}
```

---

### Значения по умолчанию

**Способ 1: Деструктуризация с дефолтами** (рекомендуется)

```jsx
function Button({ 
  children, 
  variant = "primary",    // если не передан — "primary"
  size = "medium",
  disabled = false,
  onClick = () => {}      // пустая функция-заглушка
}) {
  return (
    <button
      className={`btn btn--${variant} btn--${size}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

**Способ 2: defaultProps** (устаревший, но встречается в legacy-коде)

```jsx
function Button({ children, variant, size }) {
  return <button className={`btn--${variant} btn--${size}`}>{children}</button>;
}

Button.defaultProps = {
  variant: "primary",
  size: "medium",
};

// Для классовых компонентов:
class Button extends React.Component {
  static defaultProps = {
    variant: "primary",
  };
  render() { /* ... */ }
}
```

> ⚠️ `defaultProps` для функциональных компонентов объявлен устаревшим в React 18.3 и будет удалён в будущих версиях. Используйте деструктуризацию с дефолтами.

---

### Специальный prop: children

`children` — это содержимое между открывающим и закрывающим тегами компонента.

```jsx
// Передача JSX как children
function Card({ title, children }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="card-body">{children}</div>
    </div>
  );
}

// Использование
<Card title="Привет">
  <p>Это children — любой JSX</p>
  <Button>Кнопка внутри</Button>
</Card>

// children может быть чем угодно:
// - строкой: <Card>Текст</Card>
// - числом: <Card>{42}</Card>
// - массивом: <Card>{[<A/>, <B/>]}</Card>
// - функцией (render prop паттерн):
<DataProvider>
  {(data) => <Table rows={data} />}
</DataProvider>
```

---

### Spread operator для props

```jsx
// Передача всех props дальше (prop forwarding)
function Wrapper({ className, ...rest }) {
  return <div className={`wrapper ${className}`} {...rest} />;
}

// Объект как источник props
const buttonProps = {
  variant: "danger",
  size: "large",
  disabled: true,
};
<Button {...buttonProps} onClick={handleClick} />

// Эквивалентно:
<Button variant="danger" size="large" disabled={true} onClick={handleClick} />
```

---

### PropTypes — runtime-валидация (без TypeScript)

```jsx
import PropTypes from "prop-types";

function UserCard({ name, age, role, onSelect }) {
  return <div onClick={onSelect}>{name}, {age}, {role}</div>;
}

UserCard.propTypes = {
  name: PropTypes.string.isRequired,
  age: PropTypes.number,
  role: PropTypes.oneOf(["admin", "user", "moderator"]),
  onSelect: PropTypes.func,
  tags: PropTypes.arrayOf(PropTypes.string),
  address: PropTypes.shape({
    city: PropTypes.string,
    zip: PropTypes.string,
  }),
};
```

---

### Паттерны работы с props

**Composition (вместо inheritance):**

```jsx
// ❌ Не наследуем компоненты
// ✅ Передаём компоненты через props

function Dialog({ header, body, footer }) {
  return (
    <div className="dialog">
      <div className="dialog-header">{header}</div>
      <div className="dialog-body">{body}</div>
      <div className="dialog-footer">{footer}</div>
    </div>
  );
}

<Dialog
  header={<h2>Заголовок</h2>}
  body={<p>Контент</p>}
  footer={<Button>OK</Button>}
/>
```

**Render props:**

```jsx
function MouseTracker({ render }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  
  return (
    <div onMouseMove={e => setPos({ x: e.clientX, y: e.clientY })}>
      {render(pos)}
    </div>
  );
}

<MouseTracker render={({ x, y }) => <p>Курсор: {x}, {y}</p>} />
```

---

## ⚠️ Подводные камни

### 1. Мутация props

```jsx
// ❌ НЕЛЬЗЯ — мутируем объект props
function BadComponent({ user }) {
  user.name = "Bob"; // Это ошибка! Props — readonly
  return <p>{user.name}</p>;
}

// ✅ Создаём новый объект
function GoodComponent({ user }) {
  const updatedUser = { ...user, name: "Bob" };
  return <p>{updatedUser.name}</p>;
}
```

### 2. Props drilling (prop drilling problem)

```jsx
// ❌ Передача props через много уровней
function App() {
  const [user, setUser] = useState(null);
  return <Page user={user} />;
}
function Page({ user }) {
  return <Sidebar user={user} />;
}
function Sidebar({ user }) {
  return <UserMenu user={user} />;
}
// UserMenu — единственный, кто реально использует user

// ✅ Решение: Context API или Zustand/Redux
```

### 3. Передача объекта как prop — проблема ссылочного равенства

```jsx
// ❌ Каждый рендер родителя создаёт новый объект
function Parent() {
  return <Child style={{ color: "red" }} />; // новая ссылка каждый раз
}

// ✅ Выносим константу за пределы компонента
const CHILD_STYLE = { color: "red" };

function Parent() {
  return <Child style={CHILD_STYLE} />;
}

// Или используем useMemo если зависит от state
function Parent({ theme }) {
  const style = useMemo(() => ({ color: theme === "dark" ? "white" : "black" }), [theme]);
  return <Child style={style} />;
}
```

### 4. Boolean props — сокращённая запись

```jsx
// ✅ Эти записи эквивалентны:
<Input disabled={true} />
<Input disabled />   // сокращение — только для true

// ❌ Ловушка: disabled={false} ≠ отсутствие disabled
// disabled={false} явно передаёт false — это НЕ то же что не передавать prop

// ❌ Не работает для false:
<Input disabled />        // true
// нет аналога для false кроме disabled={false}
```

### 5. Числовые и строковые props

```jsx
// ❌ Строка vs число — разные типы
<Input maxLength="10" />   // строка "10"
<Input maxLength={10} />   // число 10 ← правильно для числовых атрибутов

// В HTML атрибуты всегда строки, но React props — любой тип JS
// Для TypeScript это поймает компилятор, для JS — PropTypes
```

---

## 🔬 Тонкие моменты

**Порядок props при spread:** последний выигрывает.

```jsx
const defaults = { color: "blue", size: "medium" };
<Button {...defaults} color="red" />
// color будет "red" (переопределяет spread)

<Button color="red" {...defaults} />
// color будет "blue" (spread переопределяет)
```

**Props не обязаны соответствовать HTML-атрибутам:**

```jsx
// Кастомный компонент принимает любые props
<MyChart xAxisData={[1,2,3]} onDataPointClick={handler} />
// xAxisData — не HTML атрибут, но валидный React prop
```

**Функции как props — важна стабильность ссылки:**

```jsx
// ❌ Inline функции создают новую ссылку при каждом рендере
<Button onClick={() => doSomething(id)} />

// ✅ useCallback сохраняет ссылку между рендерами
const handleClick = useCallback(() => doSomething(id), [id]);
<Button onClick={handleClick} />
```

**`key` и `ref` — специальные props, недоступны через `props`:**

```jsx
function Item({ id, key, ref }) {
  // key и ref НЕ попадают в props!
  console.log(key);  // undefined
  console.log(ref);  // undefined
}

// Если нужен key как данные:
<Item id={item.id} itemKey={item.id} key={item.id} />
// Тогда props.itemKey доступен
```

---

## 🧩 Задачи

**Задача 1.** Реализуй компонент `Avatar` с props: `src` (обязательный), `alt`, `size` (sm/md/lg, дефолт md), `shape` (circle/square, дефолт circle). Добавь `className` prop, объединяющийся с внутренними классами.

**Задача 2.** Создай компонент `Badge` с поддержкой composition: принимает `children`, `variant` (success/warning/error/info), иконку через `icon` prop. Реализуй spread для передачи HTML-атрибутов на корневой элемент.

**Задача 3.** Напиши компонент `FormField`, который оборачивает input: принимает `label`, `error`, `helpText`, `required` и передаёт все остальные props через spread непосредственно на `<input>`. Покажи проблему при передаче `className` — как её решить.

**Задача 4.** Реализуй паттерн "Compound Components" для `Tabs`: `<Tabs>`, `<Tabs.List>`, `<Tabs.Tab>`, `<Tabs.Panel>`. Активная вкладка управляется через props `activeTab`/`onTabChange` (controlled), или внутренним state (uncontrolled, если props не переданы).

**Задача 5.** Отрефактори "prop drilling": компонент `App` → `Layout` → `Sidebar` → `UserInfo` → `Avatar`. Только `Avatar` использует `user`. Вынеси `Avatar` выше и передай как prop через composition.
