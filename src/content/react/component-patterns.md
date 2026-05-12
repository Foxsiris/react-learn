## 📝 Теория

### Зачем паттерны

Паттерны компонентов — проверенные временем решения для типичных задач:
- **Разделение ответственности** (логика vs UI).
- **Переиспользование** (DRY).
- **Гибкость API** для пользователя компонента.
- **Композиция** вместо наследования.

Знание паттернов делает код предсказуемым и легко расширяемым.

---

### Container / Presentational

**Идея:** разделить **логику** и **представление**.

| Container (Smart) | Presentational (Dumb) |
|---|---|
| State, fetch, callbacks | Только UI, нет state |
| Без UI (или минимальный wrapper) | Без логики |
| Не переиспользуется | Переиспользуется |
| Тестируется через интеграцию | Тестируется через snapshots/props |

```tsx
// Container — бизнес-логика
function UserListContainer() {
  const { data: users, isLoading, error } = useUsers();
  const handleDelete = useCallback((id: number) => deleteUser(id), []);
  
  if (isLoading) return <Skeleton />;
  if (error) return <Error message={error.message} />;
  
  return <UserList users={users} onDelete={handleDelete} />;
}

// Presentational — pure UI
type UserListProps = {
  users: User[];
  onDelete: (id: number) => void;
};

function UserList({ users, onDelete }: UserListProps) {
  return (
    <ul>
      {users.map(u => (
        <li key={u.id}>
          {u.name}
          <button onClick={() => onDelete(u.id)}>✕</button>
        </li>
      ))}
    </ul>
  );
}
```

**Сегодня хуки** размывают границу: container логика часто живёт в кастомном хуке, а компонент остаётся одним файлом:

```tsx
function UserList() {
  const { users, isLoading, deleteUser } = useUserList();
  // ... UI
}
```

Container/Presentational — всё ещё полезный паттерн для больших компонентов.

---

### Compound Components

**Идея:** связанные компоненты, общающиеся через **общий контекст**. Пользователь композирует их декларативно.

**Примеры из библиотек:**
- `<Tabs><Tab/></Tabs>`
- `<Select><Option/></Select>`
- `<Menu><MenuItem/></Menu>`
- `<Form><Form.Field/></Form>`

```tsx
const TabsContext = createContext<{
  active: string;
  setActive: (s: string) => void;
} | null>(null);

function Tabs({ children, defaultValue }: { children: ReactNode; defaultValue: string }) {
  const [active, setActive] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({ children }: { children: ReactNode }) {
  return <div role="tablist">{children}</div>;
}

function TabsTrigger({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(TabsContext)!;
  return (
    <button
      role="tab"
      aria-selected={ctx.active === value}
      onClick={() => ctx.setActive(value)}
    >
      {children}
    </button>
  );
}

function TabsContent({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(TabsContext)!;
  return ctx.active === value ? <div role="tabpanel">{children}</div> : null;
}

// Привязываем к Tabs.X для красивого API
Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

// Использование — выразительно
<Tabs defaultValue="profile">
  <Tabs.List>
    <Tabs.Trigger value="profile">Профиль</Tabs.Trigger>
    <Tabs.Trigger value="orders">Заказы</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="profile"><ProfileForm /></Tabs.Content>
  <Tabs.Content value="orders"><OrdersList /></Tabs.Content>
</Tabs>
```

**Преимущества:**
- Гибкий порядок и стилизация.
- Можно вставлять любой контент между подкомпонентами.
- Self-documenting API.

---

### Controlled vs Uncontrolled Compound

```tsx
// Uncontrolled — Tabs хранит state внутри
<Tabs defaultValue="a">...</Tabs>

// Controlled — родитель управляет state
<Tabs value={tab} onValueChange={setTab}>...</Tabs>
```

Хорошие компоненты поддерживают оба:

```tsx
function Tabs({ value, defaultValue, onValueChange, children }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const active = isControlled ? value : internal;
  
  const setActive = (v: string) => {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  };
  
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}
```

---

### Render Props (легкий вариант)

```tsx
// Компонент принимает функцию-renderer
<DataLoader url="/api/users">
  {(users) => <UserList users={users} />}
</DataLoader>

function DataLoader({ url, children }: { url: string; children: (data: any) => ReactNode }) {
  const { data, loading } = useFetch(url);
  if (loading) return <Spinner />;
  return <>{children(data)}</>;
}
```

Подробнее в [Render Props HOC](Render%20Props%20HOC.md).

---

### Slots / Multi-children

Альтернатива compound — именованные slots через props:

```tsx
type LayoutProps = {
  header?: ReactNode;
  sidebar?: ReactNode;
  content: ReactNode;
  footer?: ReactNode;
};

function Layout({ header, sidebar, content, footer }: LayoutProps) {
  return (
    <div className="layout">
      {header && <header>{header}</header>}
      <main>
        {sidebar && <aside>{sidebar}</aside>}
        <div>{content}</div>
      </main>
      {footer && <footer>{footer}</footer>}
    </div>
  );
}

<Layout
  header={<Header />}
  sidebar={<Nav />}
  content={<Page />}
  footer={<Footer />}
/>
```

Compound даёт больше гибкости, slots — больше структуры.

---

### Provider Pattern

Через context "пробрасываем" значение глубоко вниз:

```tsx
const ThemeContext = createContext<Theme>("light");

function ThemeProvider({ theme, children }: { theme: Theme; children: ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

function Button() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>...</button>;
}
```

---

### Custom Hooks (главный паттерн сегодня)

Большинство паттернов до хуков — теперь хуки:

```tsx
// Вместо HOC withAuth
function useRequireAuth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!user) navigate("/login"); }, [user]);
  return user;
}

// Вместо render props
function MouseTracker() {
  const { x, y } = useMousePosition();
  return <div>X: {x}, Y: {y}</div>;
}
```

---

### State Reducer Pattern (Kent C. Dodds)

Пользователь компонента может изменить логику reducer'а:

```tsx
function useCounter({ initialCount = 0, reducer = defaultReducer } = {}) {
  const [state, dispatch] = useReducer(reducer, { count: initialCount });
  return { state, dispatch };
}

// User компонента может переопределить логику
const myReducer = (state, action) => {
  if (action.type === "INCREMENT" && state.count >= 10) return state;
  return defaultReducer(state, action);
};

const { state, dispatch } = useCounter({ reducer: myReducer });
```

---

### Control Props Pattern

Component может работать как controlled или uncontrolled:

```tsx
function Toggle({ on: controlledOn, defaultOn = false, onToggle }: ToggleProps) {
  const [internalOn, setInternalOn] = useState(defaultOn);
  const isControlled = controlledOn !== undefined;
  const on = isControlled ? controlledOn : internalOn;
  
  const toggle = () => {
    if (!isControlled) setInternalOn(o => !o);
    onToggle?.(!on);
  };
  
  return <button onClick={toggle}>{on ? "ON" : "OFF"}</button>;
}
```

---

### Prop Getters Pattern

Компонент даёт пользователю функцию, которая возвращает props для элемента:

```tsx
function useToggle() {
  const [on, setOn] = useState(false);
  
  const getTogglerProps = ({ onClick, ...rest } = {} as any) => ({
    "aria-pressed": on,
    onClick: (e: any) => {
      onClick?.(e);
      setOn(o => !o);
    },
    ...rest,
  });
  
  return { on, getTogglerProps };
}

const { on, getTogglerProps } = useToggle();
<button {...getTogglerProps({ onClick: handleClick })}>
  {on ? "ON" : "OFF"}
</button>
```

---

### State Initialization Pattern

```tsx
function useCounter(initialCount: number | (() => number)) {
  const [count, setCount] = useState(initialCount);
  // ...
}

// Lazy init — функция вычисляется один раз
useCounter(() => loadFromStorage());
```

---

### Lifting State Up

Когда несколько компонентов делят state — поднимай его в общего родителя:

```tsx
// ❌ Каждый компонент имеет свой state
function ComponentA() { const [x, setX] = useState(); ... }
function ComponentB() { const [y, setY] = useState(); ... }

// ✅ Lifted up
function Parent() {
  const [shared, setShared] = useState();
  return (
    <>
      <ComponentA value={shared} onChange={setShared} />
      <ComponentB value={shared} />
    </>
  );
}
```

---

### Composition over Inheritance

React не использует наследование классов для UI. Используй композицию:

```tsx
// ❌ Inheritance
class Modal extends React.Component { ... }
class WarningModal extends Modal { ... }  // anti-pattern

// ✅ Composition
function WarningModal({ children }) {
  return (
    <Modal>
      <WarningIcon />
      {children}
    </Modal>
  );
}
```

---

### Headless UI

Современный паттерн: компонент даёт **только логику**, а UI пользователь делает сам.

Примеры: Radix UI, Headless UI, TanStack Table.

```tsx
// Radix — Dialog
<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay className="my-overlay" />
    <Dialog.Content className="my-content">
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Desc</Dialog.Description>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
// Все стили — твои
```

Headless = compound + полная свобода стилей.

---

## ⚠️ Подводные камни

### 1. Container/Presentational — overengineering для маленьких

```tsx
// ❌ Раздробить простой компонент на 2
function Card() { ... }
function CardContainer() { return <Card />; }

// Если нет переиспользования — не нужно
```

### 2. Compound — children type strict

```tsx
<Tabs>
  <RandomComponent />  // ← компонент не Tab, ломается
</Tabs>
```

Решение — TypeScript типизация children как `ReactElement<TabProps>`. Или runtime проверки.

### 3. HOC vs Hooks

```tsx
// ❌ Старый стиль
const Enhanced = withAuth(withTheme(withLoader(Component)));

// ✅ Хуки
function Component() {
  const auth = useAuth();
  const theme = useTheme();
  const loader = useLoader();
}
```

HOC создают "wrapper hell".

### 4. Compound + Server Components

В RSC compound компоненты должны иметь "use client" в провайдере (так как используется context).

### 5. Render props + memoization

```tsx
// ❌ Inline функция — каждый рендер новая
<DataLoader>{(data) => <List data={data} />}</DataLoader>

// useCallback может помочь, но обычно нормально
```

### 6. Slots vs children — смешивать

```tsx
// ❌
<Modal title={<Title />}>
  <Modal.Header>...</Modal.Header>  // ← конфликт с title prop
</Modal>
```

Выбери один подход.

### 7. Compound: dot-syntax и tree shaking

```tsx
Modal.Header = ModalHeader;
// Bundler не может tree-shake — Modal импортирует ModalHeader

// Решение — отдельные именованные экспорты
export { Modal, ModalHeader, ModalBody };
```

### 8. Container делает слишком много

```tsx
// ❌ Container с 500 строк логики
function PageContainer() {
  // 30 useState, 10 useEffect, fetch, validation...
}

// ✅ Раздели на хуки
function PageContainer() {
  const { data } = useData();
  const { form } = useForm();
  const { handleSubmit } = useSubmit();
  // ...
}
```

### 9. Provider Hell

```tsx
<ThemeProvider>
  <QueryProvider>
    <RouterProvider>
      <AuthProvider>
        <ToastProvider>
          <App />
```

Объединяй провайдеры:

```tsx
function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <RouterProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
```

### 10. Compound + dynamic children

```tsx
// ❌ Map в children compound — проблема с key/ref
<Tabs>
  {tabs.map(t => <Tabs.Trigger key={t.id} value={t.id}>{t.label}</Tabs.Trigger>)}
</Tabs>
// Работает, но если tabs меняются часто — пересоздание каждый раз
```

---

## 🔬 Тонкие моменты

**Compound + forwardRef**

```tsx
const Tabs = forwardRef<HTMLDivElement, TabsProps>((props, ref) => {
  // ...
});
Tabs.List = TabsList;
// TypeScript может не любить — нужен `as` cast
```

**Context isolation**

```tsx
// Один большой context — все ре-рендерится вместе
// Решение: множественные context (state + dispatch отдельно)

const StateCtx = createContext(...);
const DispatchCtx = createContext(...);
```

**Polymorphic compound**

```tsx
<Tabs as="section">
  <Tabs.List as="nav">
    <Tabs.Trigger as="a" href="...">Tab 1</Tabs.Trigger>
```

Сложно, но мощно (Radix позволяет через asChild).

**Composition с Slot (Radix)**

```tsx
<Dialog.Trigger asChild>
  <MyButton>Open</MyButton>
</Dialog.Trigger>
// Dialog.Trigger "сливается" с MyButton (не оборачивает)
```

Реализуется через Radix Slot или собственный.

**Inversion of Control**

Compound = inversion of control: пользователь сам решает как композировать. Хорошее API даёт пользователю контроль, но устанавливает разумные defaults.

**Headless + styling library**

Radix + Tailwind — популярная комбинация. Headless даёт логику, Tailwind — стили.

**Form Compound (RHF Controller)**

```tsx
<Form>
  <Form.Field name="email" rules={{ required: true }}>
    {({ field, fieldState }) => (
      <Input {...field} error={fieldState.error?.message} />
    )}
  </Form.Field>
</Form>
```

Render props внутри compound — мощная комбинация.

**Provider Pattern + Zustand**

Иногда не нужен Provider — Zustand работает без него. Но Provider даёт scope (например, разные stores на разных частях UI).

**State Reducer для Library Author**

Pattern особенно полезен для библиотек, где user может захотеть переопределить logic.

**Implicit / explicit пропс**

Compound: дочерние компоненты получают данные через context (implicit). Slots: через props (explicit). Compound — лаконичнее, но менее очевидно. Slots — verbose, но прозрачнее.

---

## 🧩 Задачи для закрепления

**Задача 1 — Compound Accordion**
Реализуй Accordion: Accordion.Root, Accordion.Item, Accordion.Trigger, Accordion.Content. Поддержи single и multiple expanded.

**Задача 2 — Compound Select с keyboard**
Select с Option. Поддержи keyboard navigation (Arrow, Enter, Escape). Через context передавай selected/highlighted state.

**Задача 3 — Container vs hook**
Возьми старый container component (из legacy). Перепиши на функциональный с custom hook. Сравни читаемость.

**Задача 4 — Controlled и uncontrolled**
Реализуй <Switch> которое работает в обоих режимах (controlled value vs internal state).

**Задача 5 — Slots Layout**
Реализуй <Layout header={...} sidebar={...} content={...} footer={...}/>. Поддержи responsive (sidebar скрыт на mobile).

**Задача 6 — Render Props DataLoader**
Универсальный <DataLoader url> с children-as-function. Передавай { data, loading, error, refetch }.

**Задача 7 — Headless table**
Реализуй headless хук useTable, который даёт getHeaderProps, getRowProps, getCellProps. UI — пишет пользователь.

**Задача 8 — Provider Pattern theme**
ThemeProvider с context. Хук useTheme. Кнопка переключения. Сохранение в localStorage.

**Задача 9 — State Reducer Counter**
useCounter с возможностью переопределить reducer пользователем. Демонстрируй case "не может уйти ниже 0".

**Задача 10 — Composition без classes**
Возьми пример class inheritance из ООП кода. Перепиши в React composition. Покажи преимущества.
