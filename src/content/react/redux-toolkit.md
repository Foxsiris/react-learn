## 📝 Теория

### Что такое Redux Toolkit (RTK)

**Redux Toolkit** — официальная библиотека от команды Redux, решающая боли классического Redux:
- Бесконечный boilerplate (action types + action creators + reducer × 100 раз).
- Ручная иммутабельность через spread-кошмар.
- Сложная настройка store (combineReducers, applyMiddleware, devtools enhancer).
- Async-операции: redux-thunk/saga отдельно.

RTK — это:
- `configureStore` — store с DevTools, middleware, serializability checks из коробки.
- `createSlice` — reducer + actions в одной декларации, Immer внутри.
- `createAsyncThunk` — async actions с авто-генерацией pending/fulfilled/rejected.
- `createEntityAdapter` — нормализация коллекций.
- `RTK Query` — fetching + caching как у React Query, но интегрированно в Redux.

### Когда использовать RTK

- ✅ Большое приложение со сложным глобальным state.
- ✅ Нужны DevTools, time-travel debug, action logging.
- ✅ Несколько команд работает над одной кодовой базой — Redux даёт жёсткую структуру.
- ✅ Нужны middleware (logger, sentry, custom).
- ✅ Server state + client state в одном месте через RTK Query.

### Когда RTK избыточен

- ❌ Small/medium приложение без сложной глобальной логики — Zustand или контексты.
- ❌ Только серверный state — лучше React Query без Redux.

---

### Архитектура: store, slice, action, reducer

```
Action     →  Reducer    →  New State  →  React rerender
(событие)    (функция)     (immutable)   (только подписчики)
```

```tsx
// ── store.ts ─────────────────────────────────────────────
import { configureStore } from "@reduxjs/toolkit";
import { counterSlice } from "./slices/counterSlice";
import { userSlice } from "./slices/userSlice";

export const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
    user:    userSlice.reducer,
  },
  middleware: (gDM) => gDM().concat(loggerMiddleware),
  devTools: process.env.NODE_ENV !== "production",
});

// Типы для всего приложения
export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Хуки с типами (рекомендация RTK)
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### createSlice — slice с reducer-ом

```tsx
// ── slices/counterSlice.ts ───────────────────────────────
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CounterState {
  value: number;
  step: number;
}

const initialState: CounterState = { value: 0, step: 1 };

export const counterSlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    increment: (state) => {
      state.value += state.step;  // ← Immer! "мутация" безопасна
    },
    decrement: (state) => {
      state.value -= state.step;
    },
    setStep: (state, action: PayloadAction<number>) => {
      state.step = action.payload;
    },
    reset: () => initialState,
  },
});

export const { increment, decrement, setStep, reset } = counterSlice.actions;

// Selectors — рядом со slice
export const selectCount = (state: RootState) => state.counter.value;
```

### Подключение в компоненте

```tsx
import { useAppDispatch, useAppSelector } from "./store";
import { increment, selectCount } from "./slices/counterSlice";

function Counter() {
  const count    = useAppSelector(selectCount);
  const dispatch = useAppDispatch();

  return (
    <button onClick={() => dispatch(increment())}>
      Count: {count}
    </button>
  );
}
```

### Provider в корне

```tsx
import { Provider } from "react-redux";
import { store } from "./store";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <App />
  </Provider>
);
```

---

### createAsyncThunk — async actions

```tsx
import { createAsyncThunk } from "@reduxjs/toolkit";

// thunk генерирует 3 actions: pending, fulfilled, rejected
export const fetchUser = createAsyncThunk<
  User,                                  // тип возвращаемого значения (fulfilled.payload)
  number,                                // тип аргумента thunk
  { rejectValue: string }                // опции
>(
  "user/fetch",
  async (id, { rejectWithValue, signal }) => {
    try {
      const res = await fetch(`/api/users/${id}`, { signal });
      if (!res.ok) return rejectWithValue(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

// extraReducers — обрабатываем pending/fulfilled/rejected
const userSlice = createSlice({
  name: "user",
  initialState: {
    data: null as User | null,
    status: "idle" as "idle" | "loading" | "success" | "error",
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending,   (state) => { state.status = "loading"; state.error = null; })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = "success";
        state.data   = action.payload;
      })
      .addCase(fetchUser.rejected,  (state, action) => {
        state.status = "error";
        state.error  = action.payload ?? "Unknown error";
      });
  },
});

// Использование
function UserPage({ id }) {
  const { data, status, error } = useAppSelector(s => s.user);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchUser(id));
  }, [id, dispatch]);

  if (status === "loading") return <Spinner />;
  if (status === "error")   return <Error message={error} />;
  return <UserCard user={data!} />;
}
```

---

### createEntityAdapter — нормализация коллекций

Если у тебя много объектов одного типа (users, posts, comments), нормализованное хранение даёт O(1) доступ по ID:

```tsx
import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";

const usersAdapter = createEntityAdapter<User>({
  selectId: (user) => user.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

const usersSlice = createSlice({
  name: "users",
  initialState: usersAdapter.getInitialState({
    isLoading: false,
  }),
  reducers: {
    addUser:    usersAdapter.addOne,
    addUsers:   usersAdapter.addMany,
    updateUser: usersAdapter.updateOne,
    removeUser: usersAdapter.removeOne,
  },
});

// Селекторы из коробки
export const {
  selectAll: selectAllUsers,
  selectById: selectUserById,
  selectIds: selectUserIds,
} = usersAdapter.getSelectors((state: RootState) => state.users);

// Использование
const allUsers = useAppSelector(selectAllUsers);
const user42   = useAppSelector(s => selectUserById(s, 42));
```

Внутри: `{ ids: [42, 7, ...], entities: { 42: {...}, 7: {...} } }` — нормализованная структура.

---

### Reselect — мемоизированные селекторы

`createSelector` из `reselect` (включён в RTK):

```tsx
import { createSelector } from "@reduxjs/toolkit";

const selectActiveUsers = createSelector(
  [(state: RootState) => state.users.entities, (state: RootState) => state.filter],
  (users, filter) => Object.values(users).filter(u => u.role === filter)
);

// Если users или filter не изменились — возвращается мемоизированный результат
// Это критично, если сравниваешь по reference (например, для useSelector)
```

**Зачем:** `useSelector` сравнивает результат через `===`. Если ты делаешь `s.users.filter(...)` прямо в селекторе — каждый раз новый массив → лишний рендер.

---

### RTK Query — fetching + caching

RTK Query — отдельный модуль, заменяет thunks/sagas для серверных запросов:

```tsx
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["User", "Post"],
  endpoints: (builder) => ({
    getUser: builder.query<User, number>({
      query: (id) => `/users/${id}`,
      providesTags: (_r, _e, id) => [{ type: "User", id }],
    }),
    getUsers: builder.query<User[], void>({
      query: () => "/users",
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "User" as const, id })), { type: "User", id: "LIST" }]
          : [{ type: "User", id: "LIST" }],
    }),
    updateUser: builder.mutation<User, { id: number; patch: Partial<User> }>({
      query: ({ id, patch }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "User", id }],
    }),
  }),
});

export const {
  useGetUserQuery,
  useGetUsersQuery,
  useUpdateUserMutation,
} = apiSlice;

// Подключение в store
const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    counter: counterSlice.reducer,
  },
  middleware: (gDM) => gDM().concat(apiSlice.middleware),
});

// В компоненте
function User({ id }: { id: number }) {
  const { data, isLoading, error } = useGetUserQuery(id);
  const [update] = useUpdateUserMutation();

  if (isLoading) return <Spinner />;
  if (error)     return <Error />;
  return (
    <button onClick={() => update({ id, patch: { name: "Bob" } })}>
      {data?.name}
    </button>
  );
}
```

**Фичи RTK Query:**
- Автоматический refetch при mount (если данных нет).
- Дедупликация (5 компонентов с `useGetUserQuery(42)` → один HTTP).
- `invalidatesTags` → автоматический re-fetch связанных запросов.
- Polling, refetchOnFocus, refetchOnReconnect.
- Optimistic updates (через `updateQueryData`).

---

### Optimistic update в RTK Query

```tsx
const updateUser = builder.mutation<User, { id: number; patch: Partial<User> }>({
  query: ({ id, patch }) => ({ url: `/users/${id}`, method: "PATCH", body: patch }),
  async onQueryStarted({ id, patch }, { dispatch, queryFulfilled }) {
    // 1. Сразу применяем изменение в кеше
    const undo = dispatch(
      apiSlice.util.updateQueryData("getUser", id, (draft) => {
        Object.assign(draft, patch);
      })
    );
    try {
      await queryFulfilled;  // ждём реального ответа
    } catch {
      undo.undo();           // откатываем при ошибке
    }
  },
});
```

---

## ⚠️ Подводные камни

### 1. Мутация state ВНЕ slice

```tsx
// ❌ Только внутри createSlice работает Immer
const reducer = (state, action) => {
  state.value++;  // вне slice — мутация настоящего state, не draft
  return state;
};

// ✅ Внутри slice — можно
createSlice({
  reducers: {
    inc: (state) => { state.value++; },  // безопасно
  },
});
```

### 2. Несериализуемые значения в state

```tsx
// ❌ Date, Map, Set, функции в state — RTK выдаст warning
{ createdAt: new Date(), handler: () => {} }

// ✅ Сериализуемое
{ createdAt: Date.now(), handlerId: "handle1" }
```

Это нужно для DevTools time-travel и persist.

### 3. Несколько селекторов вместо одного

```tsx
// ❌ Создаём новый объект каждый рендер → лишние рендеры
const { user, theme, cart } = useAppSelector(s => ({
  user:  s.user,
  theme: s.theme,
  cart:  s.cart,
}));

// ✅ Несколько вызовов или мемоизированный селектор
const user  = useAppSelector(s => s.user);
const theme = useAppSelector(s => s.theme);
const cart  = useAppSelector(s => s.cart);

// ✅ Или createSelector
const selectComposed = createSelector(
  [s => s.user, s => s.theme, s => s.cart],
  (user, theme, cart) => ({ user, theme, cart })
);
```

### 4. Async thunk не отменяется при unmount автоматически

```tsx
// ❌ Если компонент unmount, thunk продолжит работу
useEffect(() => {
  dispatch(fetchUser(id));
}, [id]);

// ✅ Используй abort
useEffect(() => {
  const promise = dispatch(fetchUser(id));
  return () => promise.abort();
}, [id]);
```

### 5. RTK Query queryKey должен совпадать exactly

```tsx
// Это разные кеш-ключи (порядок важен)
useGetUsersQuery({ page: 1, limit: 10 });
useGetUsersQuery({ limit: 10, page: 1 });

// Передавай объекты стабильные
const args = useMemo(() => ({ page, limit }), [page, limit]);
useGetUsersQuery(args);
```

### 6. Connect store к нескольким приложениям

Если у тебя несколько React-приложений на странице — у каждого должен быть свой store, или общий через micro-frontend подход.

### 7. Boilerplate всё ещё есть

RTK сократил его, но Redux остаётся "тяжёлым" по сравнению с Zustand для простых случаев. Если приложение маленькое — переподумай.

---

## 🔬 Тонкие моменты

**`useSelector` оптимизация — `shallowEqual`**

```tsx
import { shallowEqual, useSelector } from "react-redux";

// По умолчанию useSelector сравнивает через ===, новый объект → ре-рендер
// shallowEqual сравнивает поля
const value = useSelector(s => ({ a: s.a, b: s.b }), shallowEqual);
```

**`isAnyOf` / `isFulfilled` — matcher-функции**

```tsx
import { isAnyOf } from "@reduxjs/toolkit";

extraReducers: (builder) => {
  builder.addMatcher(
    isAnyOf(fetchUser.fulfilled, fetchPost.fulfilled),
    (state) => { state.lastFetch = Date.now(); }
  );
}
```

**`createListenerMiddleware` — слушатели actions**

Современная замена redux-saga для side-effects:

```tsx
import { createListenerMiddleware } from "@reduxjs/toolkit";

const listener = createListenerMiddleware();
listener.startListening({
  actionCreator: userSlice.actions.login,
  effect: async (action, { dispatch, getState }) => {
    await analytics.identify(action.payload.id);
  },
});

// В store: middleware: gDM => gDM().prepend(listener.middleware)
```

**RTK Query vs React Query**

| | RTK Query | React Query |
|---|---|---|
| Интеграция | внутри Redux store | независим |
| API | declarative endpoints | hooks с queryKey |
| DevTools | Redux DevTools | свои + Redux DevTools |
| Лучше когда | уже есть Redux | нет Redux |

**`prepareAction` — кастомная обработка payload**

```tsx
const todoAdded = createAction("todos/added", (text: string) => ({
  payload: { id: nanoid(), text, createdAt: Date.now() },
}));
```

**Time-travel debugging**

В Redux DevTools можно "перемотать" history actions, посмотреть state на любом шаге, экспортировать sequence для воспроизведения багов. Бесценно для сложных багов.

**Persist**

```tsx
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

const persistedReducer = persistReducer({ key: "root", storage }, rootReducer);
const store = configureStore({ reducer: persistedReducer });
const persistor = persistStore(store);

// В корне: <PersistGate loading={null} persistor={persistor}>
```

---

## 🧩 Задачи для закрепления

**Задача 1 — Counter app**
Базовый счётчик: `increment`, `decrement`, `setStep(n)`, `reset`. Подключи Redux DevTools, поэкспериментируй с time-travel.

**Задача 2 — Todo с CRUD + thunks**
- Slice `todos` с использованием `createEntityAdapter` (нормализованное хранение).
- Thunks: `fetchTodos`, `addTodo`, `updateTodo`, `deleteTodo`.
- Селекторы: `selectAll`, `selectActive`, `selectById`.
- UI: список + форма + фильтр (all/active/done).

**Задача 3 — RTK Query CRUD**
То же самое, но через RTK Query (без slice/thunks):
- `getTodos`, `getTodo`, `addTodo`, `updateTodo`, `deleteTodo` через builder.
- Используй `tags` для авто-инвалидации.
- Optimistic update для toggle done.

**Задача 4 — Auth slice + RTK Query**
- Slice `auth` с `token`, `user`, actions `loggedIn`, `loggedOut`.
- RTK Query endpoint `login` (mutation) → onSuccess сохраняет token в slice.
- `prepareHeaders` берёт token из state и кладёт в Authorization.
- ProtectedRoute смотрит на auth.user.

**Задача 5 — Reselect + Profiler**
Создай селектор, который агрегирует данные из 3 кусков state (`createSelector` с 3 input). Вызывай его в 5 компонентах. Сравни: с reselect vs без.

**Задача 6 — Listener middleware**
Реализуй side-effect на action `auth/loggedIn`:
- Логировать в analytics.
- Сохранить токен в localStorage.
- Загрузить корзину пользователя через RTK Query.

**Задача 7 — Persist + selective**
Сохраняй в localStorage только `auth` и `theme`, не остальное. Используй redux-persist + transform.

**Задача 8 — Микропроект e-commerce**
Спроектируй store для маленького магазина:
- `cart` — slice с локальным state.
- `products` — RTK Query (server data).
- `auth` — slice + RTK Query mutation login.
- Listener — на изменение cart сохранять в localStorage.

Покажи в Profiler, что компоненты рендерятся гранулярно (cart-update не трогает products-список).
