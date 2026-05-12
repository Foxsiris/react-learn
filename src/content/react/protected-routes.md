## 📝 Теория

### Что такое protected route

**Protected route** — роут, доступный только при выполнении условий (авторизация, роль, подписка). При несоответствии — редирект на login или другую страницу.

```
Не залогинен:
  /dashboard → /login
  /profile   → /login

Залогинен:
  /dashboard → Dashboard
  /profile   → Profile
  /admin     → /forbidden (если нет роли admin)
```

### Уровни защиты

1. **Authentication** — пользователь залогинен.
2. **Authorization** — у пользователя есть роль/право.
3. **Subscription** — у пользователя есть оплата.
4. **Email/phone verified** — пройдена верификация.

---

### Подход 1. Component-обёртка (Guard)

```tsx
function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  
  if (!user) {
    // Сохраняем откуда пришли — вернёмся после логина
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}

// Использование — оборачивай каждый защищённый роут
<Route path="/dashboard" element={
  <RequireAuth>
    <Dashboard />
  </RequireAuth>
} />

<Route path="/profile" element={
  <RequireAuth>
    <Profile />
  </RequireAuth>
} />
```

Минус: повторяющийся код.

---

### Подход 2. Layout Route (рекомендуемый)

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
  <Route path="/settings"  element={<Settings />} />
</Route>

// Все эти роуты автоматически защищены
```

Чище, нет повторов.

---

### Возврат после login

После авторизации нужно вернуть пользователя на исходную страницу:

```tsx
// В RequireAuth/ProtectedLayout
return <Navigate to="/login" state={{ from: location }} replace />;

// В LoginPage
function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname ?? "/dashboard";
  
  async function handleLogin() {
    await auth.login(creds);
    navigate(from, { replace: true });
  }
}
```

---

### Role-based access (RBAC)

```tsx
function RequireRole({ role, children }: { role: string; children: ReactNode }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user.roles.includes(role)) {
    return <Navigate to="/forbidden" replace />;
  }
  
  return <>{children}</>;
}

<Route path="/admin" element={
  <RequireRole role="admin">
    <AdminPanel />
  </RequireRole>
} />

// Множественные роли (любая из)
function RequireAnyRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.some(r => user.roles.includes(r))) return <Navigate to="/forbidden" replace />;
  return <>{children}</>;
}

// Permission-based (более гранулярно)
function RequirePermission({ permission, children }) {
  const { user } = useAuth();
  if (!can(user, permission)) return <Navigate to="/forbidden" replace />;
  return <>{children}</>;
}
```

---

### Загрузка профиля при старте

При первом заходе нужно проверить токен и подгрузить пользователя. Пока идёт загрузка — нельзя сразу редиректить на login (даже если user пока null).

```tsx
function ProtectedLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return <FullPageLoader />;  // ← пока не понятно, есть user или нет
  }
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <Outlet />;
}

// AuthProvider:
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setIsLoading(false); return; }
    
    api.getMe(token)
      .then(setUser)
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setIsLoading(false));
  }, []);
  
  return <AuthContext.Provider value={{ user, setUser, isLoading }}>{children}</AuthContext.Provider>;
}
```

---

### Token-based auth с refresh

```tsx
// Интерцептор axios для автоматического refresh
axios.interceptors.response.use(
  res => res,
  async (error) => {
    const original = error.config;
    
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      
      try {
        const newToken = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${newToken}`;
        return axios(original);
      } catch {
        // Refresh не сработал — logout
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

### Route с разным UI для разных ролей

```tsx
<Route path="/dashboard" element={
  <ProtectedLayout>
    {user.role === "admin" ? <AdminDashboard /> : <UserDashboard />}
  </ProtectedLayout>
} />

// или внутри Dashboard:
function Dashboard() {
  const { user } = useAuth();
  return user.role === "admin" ? <AdminView /> : <UserView />;
}
```

---

### Условный рендер UI на основе прав

Защита роутов — не единственное. Часто нужно скрывать кнопки/секции:

```tsx
function Header() {
  const { user } = useAuth();
  return (
    <header>
      <Logo />
      <Nav>
        {user && <Link to="/profile">Profile</Link>}
        {user?.role === "admin" && <Link to="/admin">Admin</Link>}
        {user ? <LogoutButton /> : <LoginButton />}
      </Nav>
    </header>
  );
}

// Хелпер
function Can({ permission, children, fallback = null }) {
  const { user } = useAuth();
  return can(user, permission) ? children : fallback;
}

<Can permission="user.delete">
  <button onClick={deleteUser}>Delete</button>
</Can>
```

---

### Email/phone verification flow

```tsx
function RequireEmailVerified() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.emailVerified) return <Navigate to="/verify-email" replace />;
  return <Outlet />;
}

<Route element={<RequireAuth />}>
  <Route element={<RequireEmailVerified />}>
    <Route path="/dashboard" element={<Dashboard />} />
  </Route>
  
  {/* Доступно без верификации */}
  <Route path="/verify-email" element={<VerifyEmail />} />
</Route>
```

---

### Subscription gate

```tsx
function RequireSubscription({ tier = "pro" }: { tier?: string }) {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  if (!user.subscription || user.subscription.tier !== tier) {
    return <Navigate to="/pricing" state={{ wantedTier: tier }} replace />;
  }
  
  return <Outlet />;
}

<Route element={<RequireAuth />}>
  <Route element={<RequireSubscription tier="pro" />}>
    <Route path="/pro-features" element={<ProFeatures />} />
  </Route>
</Route>
```

---

### Data Router loaders (v6.4+)

В Data Router можно проверять авторизацию **до рендера** через loader:

```tsx
async function requireAuthLoader({ request }) {
  const user = await getUser();
  if (!user) {
    const url = new URL(request.url);
    throw redirect(`/login?from=${encodeURIComponent(url.pathname)}`);
  }
  return user;
}

const router = createBrowserRouter([
  {
    path: "/dashboard",
    loader: requireAuthLoader,
    element: <Dashboard />,
  },
]);
```

---

## ⚠️ Подводные камни

### 1. Flash of unauthenticated content (FOUC)

```tsx
// ❌ Без isLoading — на долю секунды показывается контент перед редиректом
function Layout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;  // user сначала null, потом загружается
  return <Outlet />;
}

// ✅ Учитывай состояние загрузки
function Layout() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" />;
  return <Outlet />;
}
```

### 2. Бесконечный редирект

```tsx
// ❌ /login защищён → редирект на /login → ...
<Route element={<RequireAuth />}>
  <Route path="/login" element={<LoginPage />} />  {/* защищено! */}
</Route>

// ✅ /login вне защиты
<Route path="/login" element={<LoginPage />} />
<Route element={<RequireAuth />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

### 3. Token в localStorage — XSS риск

```tsx
// ❌ Доступен JS → если есть XSS, токен украден
localStorage.setItem("token", jwt);

// ✅ HttpOnly cookie (если backend поддерживает) — JS не имеет доступа
// Или — короткие access tokens + refresh через secure cookie
```

### 4. Redirect замыкания на исходный location

```tsx
// ❌ Если location меняется — Navigate не перерендерится
function Layout() {
  const location = useLocation();  // меняется при навигации
  if (!user) return <Navigate to="/login" state={{ from: location }} />;
  // ...
}
// На самом деле работает — Navigate ремонтируется
```

### 5. Защита через JS — это не безопасность

Любой может открыть DevTools, поменять `user` в state, и увидеть UI. Реальная защита — на сервере (API проверяет токены и роли).

```tsx
// ✅ UI-защита + API-защита
// 1. UI — для UX (не показывать админ-кнопки обычным юзерам)
// 2. API — для безопасности (отклонять запросы без правильного токена/роли)
```

### 6. Состояние гонки при logout

```tsx
// ❌ Если logout произошёл во время запроса — запрос вернётся, setState на размонтированный компонент
async function load() {
  const data = await fetch(...);
  setData(data);  // компонент мог уже размонтироваться
}

// ✅ AbortController + проверка mounted
useEffect(() => {
  let cancelled = false;
  fetch(...).then(d => { if (!cancelled) setData(d); });
  return () => { cancelled = true; };
}, []);
```

### 7. Логика переадресации после sign-up vs sign-in

```tsx
// После регистрации — обычно onboarding/profile setup, не /dashboard
async function signup() {
  await api.signup(data);
  navigate("/onboarding");  // не /dashboard
}

async function login() {
  await api.login(creds);
  navigate(from);  // на исходную или дашборд
}
```

---

## 🔬 Тонкие моменты

**Защита через layout vs через Component**

Layout-подход чище и DRY. Component-подход даёт большую гибкость (разная логика для разных роутов).

**`replace` критичен для login redirect**

```tsx
<Navigate to="/login" replace />
// Без replace: history будет [/dashboard, /login] → back возвращает на dashboard
// С replace: history заменяет [/dashboard] на [/login] → back уходит дальше
```

**SSR + защищённые роуты**

В Next.js / Remix защита делается на сервере (middleware/loader). На клиенте — только UI-fallback.

**Cookie vs localStorage**

| | localStorage | HttpOnly Cookie |
|---|---|---|
| XSS уязвимость | Да | Нет |
| Доступ из JS | Да | Нет |
| Auto-send в запросах | Нет | Да |
| Размер | 5MB+ | 4KB |
| Setup | Простой | Нужна серверная сторона |

Для production: токены — в HttpOnly cookies.

**Permission table в state**

```tsx
const PERMISSIONS = {
  "user.create":  ["admin"],
  "user.delete":  ["admin"],
  "user.read":    ["admin", "user"],
  "post.publish": ["admin", "editor"],
};

function can(user: User, permission: keyof typeof PERMISSIONS) {
  return PERMISSIONS[permission].some(role => user.roles.includes(role));
}
```

**Условный navigate в useEffect**

```tsx
useEffect(() => {
  if (!user) navigate("/login");  // ❌ Не используй useEffect для редиректа
}, [user]);

// ✅ Декларативно через Navigate
if (!user) return <Navigate to="/login" />;
```

useEffect для редиректа создаёт лишний рендер.

**Тестирование защищённых роутов**

```tsx
import { MemoryRouter } from "react-router-dom";

test("redirects unauthorized to /login", () => {
  render(
    <AuthProvider initialUser={null}>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
  
  expect(screen.getByText("Login")).toBeInTheDocument();
});
```

---

## 🧩 Задачи для закрепления

**Задача 1 — Базовая защита**
Реализуй `<RequireAuth>` + `<LoginPage>`. Не залогиненный пользователь редиректится на /login. После login возвращается на исходную страницу через `state.from`.

**Задача 2 — Layout Route protection**
Сделай `<ProtectedLayout>` через Outlet. Защити все роуты под /app/*. Покажи, что login-страница (вне Layout) доступна.

**Задача 3 — RBAC с 3 ролями**
Роли: guest, user, admin. Роуты:
- `/` — все.
- `/dashboard` — user/admin.
- `/admin` — только admin.

Реализуй гранулярные guards.

**Задача 4 — Token + refresh**
Реализуй auth flow:
- Login → получаем access + refresh токены.
- Access в state, refresh в HttpOnly cookie (или localStorage).
- 401 → попытка refresh → ретрай.
- Если refresh упал → logout.

**Задача 5 — Email verification gate**
Добавь шаг "верификация email":
- Зарегистрировался → /verify-email.
- Проверяется код → user.emailVerified = true.
- Только после этого доступ к /dashboard.

**Задача 6 — Subscription tiers**
Бесплатный/PRO планы. Защита определённых страниц только для PRO. Редирект на /pricing с сообщением "Эта функция требует PRO".

**Задача 7 — Условные UI-элементы**
Реализуй `<Can permission>`. Скрывай кнопки на основе прав. Покажи использование в нескольких местах (header, карточки, формы).

**Задача 8 — Loading state для auth**
Симулируй медленный auth check (1 секунда). Покажи, что без `isLoading`-flag происходит FOUC. Исправь.

**Задача 9 — Logout flow**
Кнопка logout:
- Очищает state и токен.
- Редиректит на /login.
- Если были unsaved changes — show confirm modal.

**Задача 10 — Тесты для защищённых роутов**
Напиши Vitest тесты:
- Не залогиненный → редирект на /login.
- Залогиненный → видит Dashboard.
- Без нужной роли → редирект на /forbidden.

Используй MemoryRouter и mock auth provider.
