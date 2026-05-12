## 📝 Теория

### Что такое React Router

**React Router** — самая популярная библиотека для роутинга в React-приложениях (SPA). Управляет URL → выбирает, какие компоненты рендерить.

**Ключевые версии:**
- **v5** — старый API (Switch, render props, withRouter HOC).
- **v6** — текущий стабильный (Routes, hooks-first, упрощённый API).
- **v6.4+ (Data Router)** — добавлены loaders, actions, fetchers (как у Remix).
- **v7** — слияние с Remix, новый API.

В этой теме фокус на v6.

---

### Установка

```bash
npm install react-router-dom
```

```tsx
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  Outlet,
  Navigate,
} from "react-router-dom";
```

### BrowserRouter — корневой провайдер

```tsx
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

**Альтернативы BrowserRouter:**

| Router | Когда использовать |
|---|---|
| `BrowserRouter` | Классические SPA (HTML5 history API: `/about`) |
| `HashRouter` | Когда нет контроля над сервером (path: `#/about`) |
| `MemoryRouter` | Тесты, React Native, Storybook |
| `StaticRouter` | SSR на сервере |

---

### Базовая структура

```tsx
<Routes>
  <Route path="/"         element={<Home />} />
  <Route path="/about"    element={<About />} />
  <Route path="/users"    element={<Users />} />
  <Route path="/users/:id" element={<UserDetail />} />
  <Route path="*"          element={<NotFound />} />
</Routes>
```

`Routes` — обёртка для всех `Route`. Только один matching `<Route>` будет отрендерен (а не все подходящие — это отличие от v5 без Switch).

`path` — паттерн URL.
`element` — JSX, который рендерится.
`*` (catch-all) — для 404.

---

### Параметры в URL — `:param`

```tsx
<Route path="/users/:userId" element={<UserDetail />} />

// Внутри UserDetail:
import { useParams } from "react-router-dom";

function UserDetail() {
  const { userId } = useParams();
  // userId — string (всегда; нужен Number(userId) при необходимости)
  return <h1>User #{userId}</h1>;
}

// Множественные параметры
<Route path="/posts/:postId/comments/:commentId" element={<Comment />} />
const { postId, commentId } = useParams();
```

### Опциональные сегменты (v6.5+)

```tsx
<Route path="/users/:userId?" element={<Users />} />
// Совпадает с /users и /users/42
```

### Splat (catch-all) сегмент

```tsx
<Route path="/files/*" element={<FileViewer />} />
// Совпадает с /files/a/b/c
const { "*": rest } = useParams();  // "a/b/c"
```

---

### Nested routes — Outlet

Вложенность в URL отражает вложенность UI. `<Outlet />` — место, куда рендерится дочерний роут.

```tsx
<Routes>
  <Route path="/" element={<Layout />}>           {/* Layout — родитель */}
    <Route index element={<Home />} />            {/* / */}
    <Route path="about" element={<About />} />    {/* /about */}
    <Route path="users" element={<Users />} />    {/* /users */}
  </Route>
</Routes>

function Layout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />  {/* ← здесь рендерится Home/About/Users */}
      </main>
      <Footer />
    </>
  );
}
```

`<Route index>` — особый дочерний роут, активируется на родительском path без сегмента.

См. подробнее: Nested routes.

---

### Link — навигация

```tsx
import { Link } from "react-router-dom";

<Link to="/users">Users</Link>
<Link to="/users/42">User 42</Link>

// Относительный путь
<Link to="profile">Profile</Link>  // от текущего route

// Подняться вверх
<Link to="..">Back</Link>

// С state (передача данных без URL)
<Link to="/order" state={{ from: "cart" }}>Order</Link>
// Получить: const { state } = useLocation();

// Замена history (без новой записи)
<Link to="/login" replace>Login</Link>
```

### NavLink — активная ссылка

```tsx
import { NavLink } from "react-router-dom";

<NavLink
  to="/users"
  className={({ isActive }) => isActive ? "active" : ""}
  style={({ isActive }) => ({ color: isActive ? "red" : "inherit" })}
>
  Users
</NavLink>

// Активна точно для пути (а не префикс)
<NavLink to="/" end>Home</NavLink>
// Без end: NavLink "/" будет активна для /, /about, /users (всё совпадает с префиксом)
// С end: только для точного "/"
```

---

### Программная навигация — useNavigate

```tsx
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();
  
  async function login() {
    await api.login(...);
    navigate("/dashboard");
  }
  
  // Назад
  navigate(-1);
  
  // Replace в истории
  navigate("/home", { replace: true });
  
  // С state
  navigate("/order", { state: { from: "cart" } });
}
```

См. подробнее: useNavigate, useParams.

---

### Navigate — декларативный редирект

```tsx
import { Navigate } from "react-router-dom";

function Old() {
  return <Navigate to="/new" replace />;
}

// В качестве элемента роута
<Route path="/old-path" element={<Navigate to="/new-path" replace />} />
```

---

### Catch-all 404

```tsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/about" element={<About />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

### Редирект по дефолту

```tsx
<Routes>
  <Route path="/" element={<Navigate to="/dashboard" />} />
  <Route path="/dashboard" element={<Dashboard />} />
</Routes>
```

---

### Data Router (v6.4+) — loaders/actions

В Data Router можно загружать данные **до рендера** компонента (как в Remix):

```tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "users/:id",
        element: <UserDetail />,
        loader: async ({ params }) => {
          return fetch(`/api/users/${params.id}`).then(r => r.json());
        },
        action: async ({ request, params }) => {
          const formData = await request.formData();
          await fetch(`/api/users/${params.id}`, {
            method: "PATCH",
            body: formData,
          });
          return redirect("/users");
        },
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

// Внутри UserDetail
import { useLoaderData } from "react-router-dom";

function UserDetail() {
  const user = useLoaderData() as User;
  return <h1>{user.name}</h1>;
}
```

**Преимущества:**
- Данные загружаются параллельно с code-splitting (нет waterfalls).
- Защита от race conditions (старые загрузки отменяются).
- `useFetcher` для submit без навигации.
- ErrorBoundary на уровне route (`errorElement`).

---

### Объектная конфигурация роутов

```tsx
// Альтернатива JSX
import { useRoutes } from "react-router-dom";

const routes = [
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "about", element: <About /> },
      {
        path: "users",
        element: <UsersLayout />,
        children: [
          { index: true, element: <UsersList /> },
          { path: ":id", element: <UserDetail /> },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
];

function App() {
  const element = useRoutes(routes);
  return element;
}
```

Удобно для динамической конфигурации (например, на основе ролей пользователя).

---

## ⚠️ Подводные камни

### 1. Забыл BrowserRouter

```tsx
// ❌ Routes без Router-обёртки
<Routes>...</Routes>  // ошибка: useRoutes() may be used only in the context of a <Router>

// ✅
<BrowserRouter>
  <Routes>...</Routes>
</BrowserRouter>
```

### 2. Использует v5 синтаксис в v6

```tsx
// ❌ v5: Switch + component
<Switch>
  <Route path="/users" component={Users} />
</Switch>

// ✅ v6: Routes + element
<Routes>
  <Route path="/users" element={<Users />} />
</Routes>
```

### 3. Абсолютный путь в дочернем роуте

```tsx
// ❌ Дочерний путь не должен начинаться с /
<Route path="/dashboard" element={<DashboardLayout />}>
  <Route path="/dashboard/users" element={<Users />} />  {/* ← / в начале */}
</Route>

// ✅ Относительный
<Route path="/dashboard" element={<DashboardLayout />}>
  <Route path="users" element={<Users />} />  {/* /dashboard/users */}
</Route>
```

### 4. Забыл Outlet в Layout

```tsx
function Layout() {
  return (
    <div>
      <Header />
      {/* ❌ Где Outlet? Дочерние роуты не отрендерятся */}
    </div>
  );
}

// ✅
function Layout() {
  return (
    <div>
      <Header />
      <Outlet />
    </div>
  );
}
```

### 5. Несколько Routes — только первый сработает

```tsx
<Routes>
  <Route path="/users" element={<List />} />
  <Route path="/users" element={<Other />} />  {/* ← никогда не сработает */}
</Routes>
```

### 6. NavLink без end — активен для всех под-путей

```tsx
// ❌ "/" активна для любого path (всё начинается с /)
<NavLink to="/">Home</NavLink>

// ✅
<NavLink to="/" end>Home</NavLink>
```

### 7. SSR + BrowserRouter — ошибка

```tsx
// ❌ BrowserRouter не работает на сервере (нет window)
// ✅ Используй StaticRouter на сервере
import { StaticRouter } from "react-router-dom/server";

const html = renderToString(
  <StaticRouter location={req.url}>
    <App />
  </StaticRouter>
);
```

---

## 🔬 Тонкие моменты

**`useMatch` — проверка соответствия пути**

```tsx
import { useMatch } from "react-router-dom";

const match = useMatch("/users/:id");
// { params: { id: "42" }, pathname: "/users/42", ... } | null
```

**`useResolvedPath` — резолв относительного пути**

```tsx
const path = useResolvedPath("subroute");  // относительно текущего
```

**`useInRouterContext` — проверка наличия Router**

```tsx
const inRouter = useInRouterContext();  // true если внутри Router
```

**`createSearchParams` — конструктор query**

```tsx
const params = createSearchParams({ page: "1", sort: "name" });
navigate(`/users?${params}`);
```

**Scroll restoration**

```tsx
// React Router v6.4+
import { ScrollRestoration } from "react-router-dom";

<ScrollRestoration
  getKey={(location) => location.pathname}  // сохранять scroll на каждый pathname
/>
```

**Blockers (предупреждение при уходе с страницы)**

```tsx
// v6.4+
import { useBlocker } from "react-router-dom";

const blocker = useBlocker(({ currentLocation, nextLocation }) => {
  return isFormDirty && currentLocation.pathname !== nextLocation.pathname;
});

if (blocker.state === "blocked") {
  return (
    <div>
      <p>Сохранить изменения?</p>
      <button onClick={() => blocker.proceed?.()}>Уйти</button>
      <button onClick={() => blocker.reset?.()}>Остаться</button>
    </div>
  );
}
```

**Анимация переходов**

```tsx
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
```

**В тестах — MemoryRouter**

```tsx
import { MemoryRouter } from "react-router-dom";

test("renders home", () => {
  render(
    <MemoryRouter initialEntries={["/about"]}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText("About")).toBeInTheDocument();
});
```

**TypeScript для useParams**

```tsx
const { id } = useParams<{ id: string }>();
// id: string | undefined

// React Router v7+ имеет улучшенный TS — типы выводятся из path
```

---

## 🧩 Задачи для закрепления

**Задача 1 — Базовый SPA**
Создай приложение с:
- Layout (Header + Footer + Outlet).
- Страницы: Home, About, Contact.
- 404 страница.
- NavLink с активным состоянием.

**Задача 2 — Nested routes для блога**
- `/posts` — список.
- `/posts/:id` — деталь поста.
- `/posts/:id/comments` — комментарии (вложенный layout).
- `/posts/:id/comments/:commentId` — конкретный комментарий.

**Задача 3 — Breadcrumbs**
Хлебные крошки на основе текущего пути. Используй `useLocation` + парсинг pathname. Каждый сегмент — Link.

**Задача 4 — Динамические роуты на основе ролей**
Конфигурация роутов через массив объектов (`useRoutes`). На основе `user.role` определяется, какие роуты доступны.

**Задача 5 — Анимация переходов**
Используй `framer-motion` + `AnimatePresence` для плавного fade-in/fade-out при переходах между страницами.

**Задача 6 — Scroll restoration**
При навигации между страницами — scroll сохраняется. При нажатии "back" — возвращается к прежней позиции.

**Задача 7 — Blocker для unsaved changes**
Форма с dirty-флагом. При попытке навигации (Link/back) — показать modal "Сохранить изменения?".

**Задача 8 — Data Router**
Перепиши страницу профиля на Data Router:
- `loader` для загрузки user.
- `action` для submit формы.
- `errorElement` для обработки ошибок.

**Задача 9 — Multi-tab navigation**
В рамках страницы /settings — несколько вложенных табов (`/settings/profile`, `/settings/security`, `/settings/notifications`). Активный таб подсвечивается через NavLink.

**Задача 10 — useMatch для условного UI**
Хедер показывает кнопку "Назад" только на детальных страницах (`/users/:id`, `/posts/:id`). Используй `useMatch`.
