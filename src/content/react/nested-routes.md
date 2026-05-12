## 📝 Теория

### Что такое nested routes

**Nested routes** — вложенные роуты, где иерархия URL соответствует иерархии UI. Дочерние роуты рендерятся внутри родительского через `<Outlet />`.

```
/dashboard         → DashboardLayout + Overview (index)
/dashboard/users   → DashboardLayout + UsersList
/dashboard/users/42 → DashboardLayout + UserDetail
```

```tsx
<Routes>
  <Route path="/dashboard" element={<DashboardLayout />}>
    <Route index element={<Overview />} />
    <Route path="users" element={<UsersList />} />
    <Route path="users/:id" element={<UserDetail />} />
  </Route>
</Routes>

function DashboardLayout() {
  return (
    <div className="dashboard">
      <Sidebar />
      <main>
        <Outlet />  {/* ← здесь рендерится дочерний */}
      </main>
    </div>
  );
}
```

При переходе на `/dashboard/users` рендерится `DashboardLayout` + внутри него `UsersList`. При переходе на `/dashboard/users/42` — тот же DashboardLayout + UserDetail. **Sidebar не пересоздаётся** — это плюс, сохраняется state и анимации.

---

### Layout routes — без path

**Layout route** — роут без `path`, только обёртка с `<Outlet />`. Группирует дочерние роуты под общим layout, не добавляя сегмент в URL.

```tsx
<Routes>
  {/* Public layout */}
  <Route element={<PublicLayout />}>
    <Route path="/"     element={<Landing />} />
    <Route path="/about" element={<About />} />
    <Route path="/blog"  element={<Blog />} />
  </Route>

  {/* App layout */}
  <Route element={<AppLayout />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/profile"   element={<Profile />} />
  </Route>
</Routes>
```

URL для пользователя: `/`, `/about`, `/dashboard`, `/profile`. Layout route не виден в URL.

---

### Index routes

**Index route** — дочерний роут, активирующийся на пути родителя:

```tsx
<Route path="/dashboard" element={<DashboardLayout />}>
  <Route index element={<Overview />} />        {/* /dashboard */}
  <Route path="users" element={<Users />} />    {/* /dashboard/users */}
</Route>
```

Без `<Route index>` при переходе на `/dashboard` Outlet будет пустой — только layout. Index — это "главная" страница раздела.

---

### Глубокая вложенность

```tsx
<Route path="/app" element={<AppLayout />}>
  <Route index element={<Dashboard />} />
  
  <Route path="users" element={<UsersLayout />}>           {/* /app/users */}
    <Route index element={<UsersList />} />
    <Route path=":id" element={<UserDetail />}>           {/* /app/users/42 */}
      <Route index element={<UserInfo />} />
      <Route path="orders" element={<UserOrders />} />    {/* /app/users/42/orders */}
      <Route path="settings" element={<UserSettings />} />
    </Route>
  </Route>
  
  <Route path="settings" element={<Settings />} />
</Route>
```

Каждый уровень — свой Layout/Outlet:

```tsx
function UserDetail() {
  return (
    <div>
      <UserHeader />
      <Tabs>
        <NavLink to="">Info</NavLink>
        <NavLink to="orders">Orders</NavLink>
        <NavLink to="settings">Settings</NavLink>
      </Tabs>
      <Outlet />  {/* UserInfo / UserOrders / UserSettings */}
    </div>
  );
}
```

---

### useOutletContext — передача данных в Outlet

Родительский Layout может передавать данные в дочерние через `<Outlet context={...}>`:

```tsx
function DashboardLayout() {
  const { data: user } = useUser();
  
  return (
    <div>
      <Sidebar />
      <main>
        <Outlet context={{ user, refetch: () => ... }} />
      </main>
    </div>
  );
}

// В дочернем компоненте:
import { useOutletContext } from "react-router-dom";

function Dashboard() {
  const { user } = useOutletContext<{ user: User; refetch: () => void }>();
  return <h1>Hi, {user.name}</h1>;
}
```

Альтернатива — Context API (если нужно передавать глубже).

---

### useOutlet — программный доступ

```tsx
import { useOutlet } from "react-router-dom";

function Layout() {
  const outlet = useOutlet();
  
  return (
    <div>
      {outlet ? (
        // Есть активный дочерний роут
        <main>{outlet}</main>
      ) : (
        // Index route не задан, показать дефолт
        <div>Выберите раздел</div>
      )}
    </div>
  );
}
```

Полезно для условного wrapping или показа дефолтного контента.

---

### Nested routes для wizard

Многошаговая форма:

```tsx
<Route path="/checkout" element={<CheckoutLayout />}>
  <Route path="cart"     element={<CartStep />} />
  <Route path="address"  element={<AddressStep />} />
  <Route path="payment"  element={<PaymentStep />} />
  <Route path="confirm"  element={<ConfirmStep />} />
</Route>

function CheckoutLayout() {
  return (
    <div>
      <ProgressBar />  {/* Показывает текущий шаг */}
      <Outlet />        {/* Текущий шаг */}
    </div>
  );
}
```

URL отражает шаг → можно делиться ссылкой, обновлять страницу, использовать back/forward.

---

### Nested routes для dashboard (со sidebar)

```tsx
<Route path="/admin" element={<AdminLayout />}>
  <Route index element={<Dashboard />} />
  
  <Route path="users" element={<UsersLayout />}>
    <Route index element={<UsersList />} />
    <Route path="new" element={<UserForm />} />
    <Route path=":id/edit" element={<UserForm />} />
  </Route>
  
  <Route path="products" element={<ProductsLayout />}>
    <Route index element={<ProductsList />} />
    <Route path=":id" element={<ProductDetail />} />
  </Route>
</Route>
```

`AdminLayout` всегда виден (sidebar, header) — не пересоздаётся при переходе между разделами. Внутри Outlet рендерится конкретный раздел.

---

### Конфигурация через объект (useRoutes)

```tsx
const routes = [
  {
    path: "/app",
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
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
  return useRoutes(routes);
}
```

Удобнее для динамической конфигурации.

---

### Route guards в Layout

```tsx
function ProtectedLayout() {
  const { user } = useAuth();
  const location = useLocation();
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <Outlet />;
}

<Route element={<ProtectedLayout />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/profile"   element={<Profile />} />
</Route>
```

Все роуты под `<ProtectedLayout>` требуют авторизации. См. подробнее: Protected routes.

---

### Lazy nested routes

```tsx
const Dashboard = lazy(() => import("./Dashboard"));
const Users = lazy(() => import("./Users"));

<Route path="/app" element={<AppLayout />}>
  <Route index element={
    <Suspense fallback={<Spinner />}>
      <Dashboard />
    </Suspense>
  } />
  <Route path="users" element={
    <Suspense fallback={<Spinner />}>
      <Users />
    </Suspense>
  } />
</Route>

// Или Suspense сразу в layout:
function AppLayout() {
  return (
    <>
      <Sidebar />
      <Suspense fallback={<Spinner />}>
        <Outlet />
      </Suspense>
    </>
  );
}
```

---

### Анимация переходов между nested routes

```tsx
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useOutlet } from "react-router-dom";

function AnimatedLayout() {
  const location = useLocation();
  const outlet = useOutlet();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## ⚠️ Подводные камни

### 1. Забыл Outlet — дочерние не рендерятся

```tsx
function Layout() {
  return <div><Header /></div>;  // ❌ нет Outlet
}

// ✅
function Layout() {
  return <div><Header /><Outlet /></div>;
}
```

### 2. Абсолютный путь в дочернем

```tsx
// ❌ Дочерний / повторно
<Route path="/dashboard" element={<DashLayout />}>
  <Route path="/dashboard/users" element={<Users />} />  {/* ❌ */}
</Route>

// ✅ Относительный
<Route path="/dashboard" element={<DashLayout />}>
  <Route path="users" element={<Users />} />
</Route>
```

### 3. Index без element

```tsx
// ❌ index без element ничего не рендерит
<Route path="/users" element={<UsersLayout />}>
  <Route index />
</Route>

// ✅
<Route index element={<UsersList />} />
```

### 4. Мутация useOutletContext

```tsx
function Layout() {
  const data = useDataFetch();
  return <Outlet context={data} />;  // ❌ data — новый объект каждый рендер
}

// ✅ useMemo
function Layout() {
  const data = useDataFetch();
  const ctx = useMemo(() => data, [data]);
  return <Outlet context={ctx} />;
}
```

### 5. Layout перерисовывается при смене дочернего роута

Layout рендерится снова при каждом переходе. Это **штатное поведение**. Если он тяжёлый — мемоизируй компоненты внутри (Sidebar, Header).

### 6. Глубокая вложенность — сложно поддерживать

5+ уровней вложенности — путаница. Лучше декомпозировать или использовать flat-структуру с composing.

### 7. relative="path" vs relative="route"

```tsx
// React Router v6.4+
<Link to="../" relative="path">  // от текущего pathname
<Link to="../" relative="route"> // от текущего route (по умолчанию)
```

В nested routes это даёт разный результат — будь внимателен.

---

## 🔬 Тонкие моменты

**Layout не размонтируется при смене дочернего роута**

Это означает, что state в Layout сохраняется. Полезно: scroll position в Sidebar, открытость секций.

**Outlet принимает только один context-объект**

Если нужно передать несколько вещей — используй объект с полями, или вложенные Context-ы.

**Layout с loader (Data Router)**

```tsx
const router = createBrowserRouter([
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    loader: () => fetch("/api/me"),  // данные доступны во всех дочерних
    children: [
      {
        index: true,
        element: <Overview />,
        loader: () => fetch("/api/stats"),
      },
    ],
  },
]);

// В DashboardLayout
const me = useLoaderData();

// В Overview
const stats = useLoaderData();
const me = useRouteLoaderData("dashboard");  // данные родителя
```

**Условный nested route**

```tsx
<Route path="/app" element={isAdmin ? <AdminLayout /> : <UserLayout />}>
  <Route index element={<Dashboard />} />
</Route>

// При смене isAdmin — layout пересоздаётся, всё ремаунтится
```

**Глубокая вложенность через `*`**

```tsx
<Route path="/app/*" element={<App />} />

// Внутри App:
function App() {
  return (
    <Routes>
      <Route path="users" element={<Users />} />
      <Route path="settings" element={<Settings />} />
    </Routes>
  );
}
// Полезно для микрофронтендов и плагинов
```

**Layout без Routes**

В v6 nested routes требуют `Routes`. Но layouts можно делать обычной композицией:

```tsx
// Альтернатива: Layout как HOC
function Layout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}

<Routes>
  <Route path="/" element={<Layout><Home /></Layout>} />
</Routes>
// Без Outlet, но Layout пересоздаётся при каждом переходе
```

`Outlet`-подход лучше для производительности и удобства.

---

## 🧩 Задачи для закрепления

**Задача 1 — Личный кабинет**
Создай ЛК с разделами: профиль, заказы, настройки. Каждый — свой sub-route. Sidebar с навигацией остаётся видимым. Активный пункт подсвечивается.

**Задача 2 — Многоуровневая вложенность**
`/admin/users` → список. `/admin/users/:id` → детали (вкладки внутри: info, posts, settings). Каждая вкладка — свой роут.

**Задача 3 — Public + Private layout**
Два разных layouts:
- Public — для landing/about/contact (с огромной шапкой и hero).
- Private — для dashboard (с sidebar).

Реализуй через layout routes (без path).

**Задача 4 — Wizard через nested routes**
Чекаут: `/checkout/cart` → `/checkout/address` → `/checkout/payment` → `/checkout/confirm`. ProgressBar показывает текущий шаг. State между шагами — через context или global store.

**Задача 5 — useOutletContext**
Layout грузит current user через React Query → передаёт в дочерние через Outlet context. Дочерние используют `useOutletContext`.

**Задача 6 — Анимация переходов между табами**
В UserDetail вкладки info/orders/settings. При переходе — slide-in анимация через framer-motion + AnimatePresence.

**Задача 7 — Tabs через NavLink + nested routes**
Реализуй универсальный Tabs-компонент, где каждая вкладка — это nested route. NavLink с активным состоянием. Активная вкладка = текущий роут.

**Задача 8 — Lazy nested routes**
Большое приложение: главный лeaut + 5 разделов. Каждый раздел lazy. Suspense — на уровне Layout (общий fallback). Покажи в Network, что чанки грузятся при первом переходе.

**Задача 9 — Условный nested через role**
Пользователи разных ролей видят разные nested routes. Реализуй фильтрацию routes на основе `user.role` (через `useRoutes` с динамической конфигурацией).

**Задача 10 — Breadcrumbs из nested**
Хлебные крошки на основе вложенности роутов. Используй `useMatches()` (Data Router) или парсинг pathname.
