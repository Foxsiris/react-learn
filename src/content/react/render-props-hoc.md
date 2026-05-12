## 📝 Теория

### Зачем знать legacy паттерны

**Render Props** и **HOC (Higher Order Components)** — паттерны до эры хуков (React < 16.8). Сейчас почти всегда заменяются кастомными хуками, но:

1. Встречаются в **legacy коде** — придётся читать и поддерживать.
2. Используются в **библиотеках** (React Router до v6, Formik, react-redux `connect`).
3. Полезны для определённых случаев (cross-cutting concerns без context).
4. Понимание паттернов помогает осознать, **почему хуки лучше**.

---

### Render Props

**Идея:** компонент передаёт данные/логику через **функцию-проп**. Пользователь решает, что рендерить.

```tsx
type MouseProps = {
  render: (pos: { x: number; y: number }) => ReactNode;
};

function MouseTracker({ render }: MouseProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  
  return (
    <div onMouseMove={e => setPos({ x: e.clientX, y: e.clientY })}>
      {render(pos)}
    </div>
  );
}

<MouseTracker render={({ x, y }) => <span>X:{x} Y:{y}</span>} />
```

**Альтернатива через children:**

```tsx
type Props = { children: (data: Data) => ReactNode };

function DataLoader({ url, children }: Props & { url: string }) {
  const { data, loading } = useFetch(url);
  if (loading) return <Spinner />;
  return <>{children(data)}</>;
}

<DataLoader url="/api/users">
  {users => users.map(u => <UserCard key={u.id} user={u} />)}
</DataLoader>
```

---

### HOC (Higher Order Component)

**Идея:** функция, принимающая компонент и возвращающая новый компонент с расширенной функциональностью.

```tsx
function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    return <Component {...props} />;
  };
}

const ProtectedDashboard = withAuth(Dashboard);

// Использование
<Routes>
  <Route path="/dashboard" element={<ProtectedDashboard />} />
</Routes>
```

**Имя HOC по convention — `with*`**: withAuth, withLoader, withTheme.

---

### HOC с дополнительными аргументами

```tsx
function withLogging<P extends object>(Component: React.ComponentType<P>, name: string) {
  return function LoggedComponent(props: P) {
    useEffect(() => {
      console.log(`${name} mounted`);
      return () => console.log(`${name} unmounted`);
    }, []);
    return <Component {...props} />;
  };
}

const LoggedDashboard = withLogging(Dashboard, "Dashboard");

// Curried:
function withLogging(name: string) {
  return function <P>(Component: React.ComponentType<P>) {
    return function (props: P) { ... };
  };
}

withLogging("Dashboard")(Dashboard);
```

---

### Пример: withErrorBoundary

```tsx
class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback: ReactNode = <div>Error</div>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

const SafeDashboard = withErrorBoundary(Dashboard, <ErrorFallback />);
```

---

### Пример: connect (react-redux legacy)

```tsx
function mapStateToProps(state: RootState) {
  return { user: state.auth.user, count: state.counter.value };
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    increment: () => dispatch({ type: "INCREMENT" }),
  };
}

const Counter = connect(mapStateToProps, mapDispatchToProps)(CounterComponent);
// CounterComponent получит { user, count, increment } из store
```

Сейчас `useSelector + useDispatch` (хуки) делают то же самое чище.

---

### Composition HOC (function composition)

```tsx
const enhance = compose(
  withAuth,
  withTheme,
  withLogger,
);

const Enhanced = enhance(Component);
// = withAuth(withTheme(withLogger(Component)))
```

Создаёт **wrapper hell** — много вложенных HOC.

---

### Render Props + HOC: эквивалентность

Render props и HOC — изоморфны (можно конвертировать друг в друга):

```tsx
// HOC версия
const Enhanced = withMouse(Component);

// Render props версия
<Mouse>{(pos) => <Component {...pos} />}</Mouse>
```

Хуки заменяют оба:

```tsx
function Component() {
  const pos = useMouse();
  // ...
}
```

---

### Перевод HOC → Hook

```tsx
// HOC
function withWindowSize<P>(Component: React.ComponentType<P & { size: Size }>) {
  return function (props: P) {
    const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
    useEffect(() => {
      const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, []);
    return <Component {...props} size={size} />;
  };
}
const ResponsiveCmp = withWindowSize(Component);

// Hook
function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

function Component() {
  const size = useWindowSize();
  // ...
}
```

Хуки выигрывают:
- Меньше вложенности.
- Лучше TypeScript.
- Легче композировать (несколько хуков — линейно, HOC — wrapper hell).

---

### Когда HOC всё ещё полезен

1. **Cross-cutting concerns в библиотеках:**
   - withAuth для роутинга.
   - withTracking для аналитики.
2. **Wrapping non-React code** (например, классовые компоненты в legacy).
3. **Forwarding ref + расширение:**
   ```tsx
   const Forwarded = forwardRef((props, ref) => <Component {...props} ref={ref} />);
   ```

---

### Когда render props всё ещё полезны

1. **Библиотеки с гибким UI** (Headless Table, Popper).
2. **Когда нужна inline customization рендера**:
   ```tsx
   <Tooltip render={({ pos }) => <CustomTooltip style={pos} />} />
   ```

Но обычно — лучше `as` prop, slots, или Headless хуки.

---

### Анти-паттерн: HOC внутри render

```tsx
// ❌ Создаёт новый тип компонента каждый рендер
function Parent() {
  const Enhanced = withAuth(Child);  // ← новый компонент!
  return <Enhanced />;
}
// React теряет state, размонтирует/монтирует
```

```tsx
// ✅ HOC создаётся один раз вне компонента
const EnhancedChild = withAuth(Child);

function Parent() {
  return <EnhancedChild />;
}
```

---

### displayName для DevTools

```tsx
function withAuth<P>(Component: React.ComponentType<P>) {
  function AuthenticatedComponent(props: P) { ... }
  
  AuthenticatedComponent.displayName = `withAuth(${
    Component.displayName ?? Component.name ?? "Component"
  })`;
  
  return AuthenticatedComponent;
}
// В DevTools: "withAuth(Dashboard)" вместо "AuthenticatedComponent"
```

---

### Forwarding refs через HOC

```tsx
function withLogger<P>(Component: React.ComponentType<P>) {
  return forwardRef<unknown, P>((props, ref) => {
    useEffect(() => console.log("mount"), []);
    return <Component {...props} ref={ref} />;
  });
}
// Без forwardRef — ref не пробрасывается через HOC
```

---

### hoist-non-react-statics

HOC не копируют статические методы:

```tsx
class Component extends React.Component {
  static handleAction = () => { ... };
}

const Wrapped = withSomething(Component);
Wrapped.handleAction;  // ❌ undefined
```

Решение — `hoist-non-react-statics` библиотека:

```tsx
import hoistNonReactStatics from "hoist-non-react-statics";

function withSomething(Component) {
  function Wrapped(props) { ... }
  hoistNonReactStatics(Wrapped, Component);
  return Wrapped;
}
```

С функциональными компонентами эта проблема не возникает.

---

## ⚠️ Подводные камни

### 1. HOC внутри render

```tsx
// ❌ Новый Enhanced каждый рендер → state теряется
function Parent() {
  const Enhanced = withSomething(Child);
  return <Enhanced />;
}
```

### 2. Wrapper hell

```tsx
const Enhanced = withAuth(
  withTheme(
    withLogger(
      withErrorBoundary(
        withTracking(Component)
      )
    )
  )
);
// Сложно читать, дебажить
```

### 3. Конфликт props

```tsx
function withFoo(Component) {
  return function (props) {
    return <Component {...props} foo="hoc-value" />;
  };
}

<Wrapped foo="from-parent" />
// foo будет "hoc-value" (HOC переопределяет)
// Или наоборот — порядок spread меняет
```

### 4. TypeScript для HOC сложен

```tsx
// Generic HOC с правильными типами — много работы
function withAuth<P extends { user: User }>(
  Component: React.ComponentType<P>
): React.ComponentType<Omit<P, "user">> { ... }
```

Хуки проще типизировать.

### 5. forwardRef нужно явно

```tsx
function withLogger(Component) {
  return function Wrapped(props) {  // ← без forwardRef
    return <Component {...props} />;
  };
}

const Enhanced = withLogger(Input);
const ref = useRef();
<Enhanced ref={ref} />  // ❌ ref не работает
```

### 6. Render props и performance

```tsx
// Inline функция — каждый рендер новая
<DataLoader>{data => <Heavy data={data} />}</DataLoader>
// Heavy ре-рендерится при каждом render родителя
```

Можно `useCallback`, но обычно overhead не критичный.

### 7. Test HOC сложно

```tsx
// Тестировать withAuth(Component) — нужно mockedAuth
// Хук useAuth — легко мокать через context
```

### 8. Render props и Hook конфликт

```tsx
<Renderer>
  {(data) => {
    const [count, setCount] = useState(0);  // ✅ это компонент
    return <div>{data}{count}</div>;
  }}
</Renderer>
// Внутри children-функции — это новый component, можно использовать хуки
// Но это не очевидно
```

### 9. HOC и React.memo

```tsx
// ❌ memo внутри HOC может конфликтовать с memo снаружи
const MemoComp = memo(withSomething(Comp));
// ↑ HOC возвращает новый тип → memo проверяет propse от обёртки
```

### 10. children как функция — не intuitive

```tsx
<Wrap>{data => <X data={data} />}</Wrap>
// Многим разработчикам непонятно, что это
// Render-prop через explicit `render` prop понятнее
```

---

## 🔬 Тонкие моменты

**Render Props vs Component as Prop**

```tsx
// Render prop — функция
<X render={() => <Y />} />

// Component as prop — типы
<X component={Y} />
// или
<X as={Y} />
```

Component as prop — Less flexible, но проще.

**HOC composition с pipe / compose**

```tsx
import { compose } from "lodash";
const enhance = compose(withAuth, withTheme);
// = (X) => withAuth(withTheme(X))
```

**HOC + lifecycle methods (старый class style)**

```tsx
function withMount<P>(Component: React.ComponentType<P>) {
  return class extends React.Component<P> {
    componentDidMount() { console.log("mount"); }
    render() { return <Component {...this.props} />; }
  };
}
// До хуков — вот так
```

**Render prop с типизированным сигналом**

```tsx
type RenderProps<T> = {
  render: (state: T) => ReactNode;
};

function MouseTracker({ render }: RenderProps<{ x: number; y: number }>) { ... }
```

**Function as child (FaC) vs render prop**

Это одно и то же. "Function as child" — когда передаётся через children, "render prop" — через named prop. Семантически одинаково.

**HOC и React 18 Concurrent**

HOC обычно работают, но если используется `useId` или другие новые API внутри — проверь.

**Render props в Suspense**

```tsx
<Suspense fallback={<Loader />}>
  <DataFetcher>
    {(data) => <Component data={data} />}
  </DataFetcher>
</Suspense>
// Suspense будет работать
```

**HOC мутация props**

```tsx
// ❌ Mutate
function withFoo(Comp) {
  return (props) => {
    props.foo = "bar";  // ← ❌ mutate props
    return <Comp {...props} />;
  };
}

// ✅ Spread с new
return <Comp {...props} foo="bar" />;
```

**Render Props и context**

Внутри children-функции `useContext` работает нормально:

```tsx
<Provider value={...}>
  <Renderer>
    {(data) => {
      const ctx = useContext(MyCtx);
      return <X />;
    }}
  </Renderer>
</Provider>
```

**Migrate strategy: HOC → Hook**

1. Оставь HOC, добавь рядом hook.
2. Постепенно переноси usage на hook.
3. Удали HOC, когда никто не использует.

---

## 🧩 Задачи для закрепления

**Задача 1 — withAuth → useAuth**
Реализуй HOC withAuth. Перепиши на useAuth хук. Сравни код.

**Задача 2 — withErrorBoundary**
HOC оборачивающий любой компонент в ErrorBoundary с custom fallback. Хук — невозможен (Error Boundary только в classes), но можно сделать через библиотеку.

**Задача 3 — Render props mouse tracker**
Реализуй <MouseTracker> с render props. Затем — useMousePosition хук. Сравни.

**Задача 4 — Connect-style HOC**
Реализуй упрощённый connect(mapState, mapDispatch)(Component) для своего store. Покажи, как useSelector / useDispatch чище.

**Задача 5 — Compose + HOC**
Используй compose для wrapper-цепочки. Затем покажи эквивалент через хуки.

**Задача 6 — Render props DataLoader**
Generic <DataLoader<T> url> с children-as-function. Передавай { data, loading, error, refetch }.

**Задача 7 — Headless component vs render props**
Реализуй Tooltip двумя способами: render props (`<Tooltip render={...}>`) и compound (`<Tooltip><Tooltip.Trigger/><Tooltip.Content/></Tooltip>`). Сравни DX.

**Задача 8 — TypeScript HOC**
Типизируй withAuth корректно: компонент получает user prop, наружу — без user.

**Задача 9 — forwardRef через HOC**
Реализуй withForwardedRef HOC, который пробрасывает ref на дочерний компонент. Используй forwardRef внутри.

**Задача 10 — Migration legacy → modern**
Возьми устаревший проект на render props (например, react-motion). Перепиши один компонент с использованием хуков (если есть аналог).
