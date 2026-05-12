## 📝 Теория

### Что такое useReducer

`useReducer(reducer, initialState)` — альтернатива `useState` для **сложной логики обновления state**. Концепция взята из Redux: `(state, action) => newState`.

```tsx
const [state, dispatch] = useReducer(reducer, initialState);

dispatch({ type: "INCREMENT" });
dispatch({ type: "ADD_TODO", payload: "Купить хлеб" });
```

| | useState | useReducer |
|---|---|---|
| Лучше для | Простой/независимый state | Связанный state, сложные переходы |
| Логика | inline в компоненте | вынесена в чистую функцию |
| Тестируется | вместе с компонентом | reducer тестируется отдельно |
| Производительность | равная | равная (dispatch стабильнее) |
| Понятность изменений | разбросаны по обработчикам | централизованы в reducer |

### Когда useReducer лучше useState

- **Несколько связанных полей** — обновляются вместе или зависят друг от друга.
- **Сложная логика переходов** — много `if`/`switch` для определения нового состояния.
- **Зависимость от предыдущего state** — функциональные обновления + множество источников.
- **State-машина** — фиксированный набор состояний (idle → loading → success/error).
- **Удобство тестирования** — reducer = чистая функция → unit-тесты без React.
- **Передача `dispatch` глубоко вниз** — стабильная ссылка, не нужен useCallback.

---

### Базовый пример с TypeScript

```tsx
// 1. Тип состояния
interface CartItem {
  id: number;
  name: string;
  qty: number;
  price: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  isCheckingOut: boolean;
  error: string | null;
}

// 2. Discriminated union для actions
type CartAction =
  | { type: "ADD";         payload: Omit<CartItem, "qty"> }
  | { type: "REMOVE";      payload: { id: number } }
  | { type: "SET_QTY";     payload: { id: number; qty: number } }
  | { type: "CLEAR" }
  | { type: "CHECKOUT_START" }
  | { type: "CHECKOUT_SUCCESS" }
  | { type: "CHECKOUT_ERROR"; payload: string };

// 3. Чистая функция reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.items.find(i => i.id === action.payload.id);
      const items = existing
        ? state.items.map(i => i.id === action.payload.id ? { ...i, qty: i.qty + 1 } : i)
        : [...state.items, { ...action.payload, qty: 1 }];
      return { ...state, items, total: calcTotal(items) };
    }
    case "REMOVE": {
      const items = state.items.filter(i => i.id !== action.payload.id);
      return { ...state, items, total: calcTotal(items) };
    }
    case "SET_QTY": {
      const items = state.items.map(i =>
        i.id === action.payload.id ? { ...i, qty: action.payload.qty } : i
      ).filter(i => i.qty > 0);
      return { ...state, items, total: calcTotal(items) };
    }
    case "CLEAR":
      return { ...state, items: [], total: 0 };
    case "CHECKOUT_START":
      return { ...state, isCheckingOut: true, error: null };
    case "CHECKOUT_SUCCESS":
      return { ...state, isCheckingOut: false, items: [], total: 0 };
    case "CHECKOUT_ERROR":
      return { ...state, isCheckingOut: false, error: action.payload };
  }
}

function calcTotal(items: CartItem[]) {
  return items.reduce((acc, i) => acc + i.qty * i.price, 0);
}

// 4. Использование в компоненте
const initialState: CartState = {
  items: [],
  total: 0,
  isCheckingOut: false,
  error: null,
};

function Cart() {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = (item: Omit<CartItem, "qty">) =>
    dispatch({ type: "ADD", payload: item });

  const checkout = async () => {
    dispatch({ type: "CHECKOUT_START" });
    try {
      await api.checkout(state.items);
      dispatch({ type: "CHECKOUT_SUCCESS" });
    } catch (e) {
      dispatch({ type: "CHECKOUT_ERROR", payload: (e as Error).message });
    }
  };

  return (/* UI */);
}
```

---

### Ленивая инициализация

Третий аргумент `useReducer` — **функция-инициализатор**:

```tsx
function init(initialUser: { id: number }) {
  return {
    user: initialUser,
    cart: loadFromLocalStorage("cart") ?? [],
    history: loadFromLocalStorage("history") ?? [],
  };
}

const [state, dispatch] = useReducer(reducer, { id: 42 }, init);
// init({ id: 42 }) вызывается ОДИН РАЗ при первом рендере
```

Это полезно когда инициализация дорогая (парсинг localStorage, обработка пропсов).

---

### State-машина на useReducer

Классический use case — "загрузка данных":

```tsx
type Status = "idle" | "loading" | "success" | "error";

interface State {
  status: Status;
  data: User[] | null;
  error: string | null;
}

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; data: User[] }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "RESET" };

function dataReducer(state: State, action: Action): State {
  // ВАЖНО: переходы ограничены текущим состоянием
  switch (state.status) {
    case "idle":
      if (action.type === "FETCH_START") return { ...state, status: "loading" };
      break;
    case "loading":
      if (action.type === "FETCH_SUCCESS") return { status: "success", data: action.data, error: null };
      if (action.type === "FETCH_ERROR")   return { status: "error", data: null, error: action.error };
      break;
    case "success":
    case "error":
      if (action.type === "FETCH_START") return { ...state, status: "loading" };
      if (action.type === "RESET")       return { status: "idle", data: null, error: null };
      break;
  }
  return state;  // невалидный переход — игнорируем
}
```

Это "автомат" — каждое состояние знает, какие действия допустимы. Невозможно случайно установить data в loading.

---

### useReducer + Context — глобальный state

```tsx
const StateCtx    = createContext<State | null>(null);
const DispatchCtx = createContext<React.Dispatch<Action> | null>(null);

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  return (
    <DispatchCtx.Provider value={dispatch}>
      <StateCtx.Provider value={state}>
        {children}
      </StateCtx.Provider>
    </DispatchCtx.Provider>
  );
}

export const useCart    = () => useContext(StateCtx)!;
export const useDispatch = () => useContext(DispatchCtx)!;

// dispatch — стабильная ссылка → потребители ТОЛЬКО dispatch не перерисовываются
function AddButton({ id }) {
  const dispatch = useDispatch();
  return <button onClick={() => dispatch({ type: "ADD", payload: { id, ... } })}>+</button>;
}
```

---

### Action creators

Чтобы не писать `dispatch({ type: "ADD", payload: ... })` руками — функции-обёртки:

```tsx
const actions = {
  add:      (item: CartItem)        => ({ type: "ADD" as const, payload: item }),
  remove:   (id: number)            => ({ type: "REMOVE" as const, payload: { id } }),
  setQty:   (id: number, qty: number) => ({ type: "SET_QTY" as const, payload: { id, qty } }),
};

dispatch(actions.add(newItem));   // вместо dispatch({ type: "ADD", payload: newItem })
```

Это избавляет от опечаток и даёт автокомплит.

---

### Async logic — где её писать

`useReducer` сам по себе **синхронный**. Async-операции (fetch) живут вне reducer:

```tsx
function Component() {
  const [state, dispatch] = useReducer(reducer, init);

  // Async обёртка
  async function loadData(id: number) {
    dispatch({ type: "FETCH_START" });
    try {
      const data = await api.get(`/users/${id}`);
      dispatch({ type: "FETCH_SUCCESS", data });
    } catch (e) {
      dispatch({ type: "FETCH_ERROR", error: (e as Error).message });
    }
  }

  return (...);
}
```

В Redux эту роль играют thunks/sagas. В чистом `useReducer` — обычные функции.

---

## ⚠️ Подводные камни

### 1. Мутация state в reducer

```tsx
// ❌ Мутация — React не увидит изменение (ссылка та же)
case "ADD":
  state.items.push(action.payload);  // мутация!
  return state;

// ✅ Создаём новый объект
case "ADD":
  return { ...state, items: [...state.items, action.payload] };

// ✅ Или используй Immer для удобной "мутации"
import { produce } from "immer";

function reducer(state: State, action: Action): State {
  return produce(state, draft => {
    if (action.type === "ADD") {
      draft.items.push(action.payload);  // безопасно, immer создаст копию
    }
  });
}
```

### 2. Async внутри reducer

```tsx
// ❌ Reducer ДОЛЖЕН быть чистой функцией
function reducer(state, action) {
  if (action.type === "FETCH") {
    fetch("/api").then(...);  // плохо!
    return state;
  }
}

// ✅ Async вне reducer
async function loadData() {
  dispatch({ type: "LOADING" });
  const data = await fetch(...);
  dispatch({ type: "LOADED", data });
}
```

### 3. Забытый default case

```tsx
// ❌ Если type неизвестен — TypeScript промолчит, но рантайм вернёт undefined
function reducer(state, action) {
  switch (action.type) {
    case "INC": return { count: state.count + 1 };
    // нет default → undefined → ошибка
  }
}

// ✅ Default возвращает state без изменений
function reducer(state, action) {
  switch (action.type) {
    case "INC": return { count: state.count + 1 };
    default:    return state;
  }
}

// ✅ Ещё лучше — exhaustive check через TypeScript
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "INC": return ...;
    case "DEC": return ...;
    default: {
      const _exhaustive: never = action;
      return state;
    }
  }
}
// Если забудешь обработать новый action — TS ошибка
```

### 4. State зависит от внешних значений

```tsx
// ❌ Reducer зависит от userId через замыкание
function Component({ userId }) {
  function reducer(state, action) {
    if (action.type === "LOAD") {
      return { ...state, items: loadFor(userId) };  // userId — closure!
    }
  }
  
  const [state, dispatch] = useReducer(reducer, init);
  // На каждом рендере reducer пересоздаётся, но useReducer запоминает первый
  // → userId всегда первоначальный (stale closure)
}

// ✅ Передавай через action payload
function reducer(state, action) {
  if (action.type === "LOAD") {
    return { ...state, items: action.payload.items };
  }
}
dispatch({ type: "LOAD", payload: { items: loadFor(userId) } });
```

### 5. Reducer вне компонента — обязательно

```tsx
// ❌ Объявление reducer внутри компонента — пересоздаётся каждый рендер
function Component() {
  function reducer(state, action) { ... }  // новый ID каждый рендер
  const [state, dispatch] = useReducer(reducer, init);
}

// ✅ Reducer — вне компонента (если возможно)
function reducer(state, action) { ... }

function Component() {
  const [state, dispatch] = useReducer(reducer, init);
}
```

### 6. dispatch не возвращает Promise

```tsx
// ❌ Невозможно дождаться результата dispatch
const result = await dispatch({ type: "LOAD" });  // dispatch возвращает void

// ✅ Используй промежуточные шаги через state или async-функцию-обёртку
async function loadData() {
  dispatch({ type: "LOADING" });
  const data = await api.load();
  dispatch({ type: "LOADED", data });
  return data;  // здесь можно вернуть для caller'а
}
```

---

## 🔬 Тонкие моменты

**`dispatch` имеет стабильную ссылку**

`useReducer` гарантирует, что `dispatch` — одна и та же функция между рендерами. Можно безопасно **не указывать** в deps хуков:

```tsx
useEffect(() => {
  dispatch({ type: "INIT" });
}, []);  // ✅ dispatch не нужен в deps
```

**Bailout — если reducer вернул тот же state**

```tsx
// React сравнит prev === next через Object.is. Если равны — re-render skipped.
case "TOGGLE_FLAG":
  if (state.flag === action.payload) return state;  // ← возвращаем тот же → нет рендера
  return { ...state, flag: action.payload };
```

**reducer пишут как pure function — легко тестировать**

```tsx
// reducer.test.ts
test("ADD добавляет item", () => {
  const result = cartReducer({ items: [], total: 0 }, { type: "ADD", payload: item });
  expect(result.items).toHaveLength(1);
  expect(result.total).toBe(item.price);
});
// ⚡ Тест за 1мс, без React, без mounting
```

**useReducer vs Redux**

| | useReducer | Redux |
|---|---|---|
| Скоуп | внутри компонента / Provider | глобальный store |
| DevTools | через `redux-devtools-extension`/`use-reducer-with-redux-devtools` | встроенно |
| Middleware | ручной (можно реализовать) | thunk, saga, RTK Query |
| Time travel debug | нет | да |
| Persist | сам | redux-persist |

Если приложение маленькое — useReducer + Context хватит. Если большое — лучше Redux Toolkit.

**Immer — почти всегда полезен**

С `immer` можно "мутировать" draft, а на выходе получить иммутабельную копию. Очень удобно для глубоко-вложенных state:

```tsx
import { produce } from "immer";

const reducer = produce((draft: State, action: Action) => {
  switch (action.type) {
    case "ADD_NESTED":
      draft.users[action.userId].posts[action.postId].likes++;
      // безопасно "мутируем", получаем новую иммутабельную копию
      break;
  }
});
```

**Server Components не используют reducer**

В RSC нет хуков. useReducer — только в Client Components.

---

## 🧩 Задачи для закрепления

**Задача 1 — Машина состояний модального окна**
Состояния: `closed | opening | open | closing`. Действия: OPEN, CLOSE. Корректно обрабатывай animation states. Пиши тесты для reducer без React.

**Задача 2 — Cart с Immer**
Реализуй cartReducer (как в примере) с использованием Immer. Сравни читаемость с обычным spread-вариантом.

**Задача 3 — Form reducer**
Реализуй reducer для формы:
- Поля: `email`, `password`, `confirmPassword`.
- State: `{ values, errors, touched, isSubmitting }`.
- Actions: `SET_FIELD`, `BLUR_FIELD`, `SUBMIT_START`, `SUBMIT_SUCCESS`, `SUBMIT_ERROR`, `RESET`.
- Валидация в reducer (email format, пароли совпадают).

**Задача 4 — Mini-Redux через useReducer + Context**
Сделай "глобальный store" приложения для todos:
- `<StoreProvider>` оборачивает `<App>`.
- Хуки `useStore()` и `useDispatch()`.
- Action creators в отдельном файле.
- Selectors в отдельном файле (или просто функции от state).

**Задача 5 — Undo/Redo на reducer**
Расширь reducer счётчика так, чтобы поддерживал:
- `UNDO` — откат к предыдущему state.
- `REDO` — повторить откатанное.

Используй паттерн `{ past: State[], present: State, future: State[] }`.

**Задача 6 — Discriminated union + exhaustive check**
Сделай reducer с 5 actions через discriminated union. Добавь default case с `never`-проверкой. Намеренно "забудь" обработать одно действие — увидишь TS-ошибку.

**Задача 7 — useReducer + DevTools**
Подключи `redux-devtools-extension` к useReducer (используй обёртку или библиотеку `use-reducer-with-redux-devtools`). Логируй все actions, наблюдай time travel.
