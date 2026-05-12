## 📝 Теория

### Хуки React Router

| Хук | Назначение |
|---|---|
| `useNavigate` | Программная навигация |
| `useParams` | Параметры из URL (`:id`) |
| `useSearchParams` | Query string (`?page=1`) |
| `useLocation` | Текущий location (pathname, hash, state) |
| `useMatch` | Проверка соответствия пути |
| `useRoutes` | Объектная конфигурация роутов |
| `useOutlet` | Текущий дочерний роут (для условного wrapping) |
| `useOutletContext` | Передача данных от родителя в Outlet |
| `useNavigationType` | "PUSH" / "REPLACE" / "POP" — как пришли |

---

## 🧭 useNavigate

### Базовое использование

```tsx
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();
  
  async function handleLogin() {
    await api.login(...);
    navigate("/dashboard");
  }
}
```

### Опции

```tsx
// Replace в истории (без новой записи)
navigate("/login", { replace: true });
// Например, после login → /dashboard. Если пользователь нажмёт "Назад", он не вернётся на /login.

// Передача state (не отображается в URL)
navigate("/order", { state: { from: "cart", productId: 42 } });

// Получить state на следующей странице:
const { state } = useLocation();
console.log(state?.from);  // "cart"

// Назад / вперёд
navigate(-1);  // назад
navigate(1);   // вперёд
navigate(-2);  // на 2 шага назад

// Прерывание
navigate("/", { unstable_viewTransition: true });  // с View Transition API
```

### Относительная навигация

```tsx
// Если ты на /users/42:
navigate("orders");           // → /users/42/orders
navigate("..");               // → /users
navigate("../settings");      // → /settings
navigate("/users/43");        // абсолютный
```

### useNavigate vs Navigate vs Link

| | Когда использовать |
|---|---|
| `<Link>` | Декларативная ссылка в JSX |
| `<Navigate>` | Декларативный редирект (как роут или условно) |
| `useNavigate` | Императивная навигация в обработчиках/эффектах |

```tsx
// JSX — Link
<Link to="/about">About</Link>

// Условный редирект — Navigate
{!isAuth && <Navigate to="/login" />}

// После события — useNavigate
function onSubmit() {
  await save();
  navigate("/success");
}
```

---

## 🆔 useParams

### Базовое использование

```tsx
<Route path="/users/:id" element={<UserDetail />} />

import { useParams } from "react-router-dom";

function UserDetail() {
  const { id } = useParams();
  // id: string | undefined
  return <h1>User #{id}</h1>;
}
```

### TypeScript

```tsx
// Старый подход — указать тип параметров
const { id } = useParams<{ id: string }>();
// id: string | undefined

// Жёсткое утверждение (если уверен, что путь существует)
const { id } = useParams() as { id: string };

// React Router v7+ — типы выводятся из path
```

### Множественные параметры

```tsx
<Route path="/posts/:postId/comments/:commentId" element={<Comment />} />

const { postId, commentId } = useParams();
```

### Optional & splat

```tsx
<Route path="/users/:id?" element={<Users />} />
const { id } = useParams();  // id может быть undefined

<Route path="/files/*" element={<Files />} />
const params = useParams();
const restPath = params["*"];  // "a/b/c.txt"
```

### Конвертация типов

```tsx
function UserDetail() {
  const { id } = useParams();
  const userId = Number(id);
  
  if (isNaN(userId)) {
    return <Navigate to="/404" />;
  }
  
  // ...
}
```

---

## 🔍 useSearchParams

Работа с query string (`?page=1&sort=name`).

### Базовое использование

```tsx
import { useSearchParams } from "react-router-dom";

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = Number(searchParams.get("page") ?? 1);
  const sort = searchParams.get("sort") ?? "name";
  
  function changeSort(newSort: string) {
    setSearchParams({ page: String(page), sort: newSort });
  }
  
  return (...);
}
```

`searchParams` — это `URLSearchParams` (стандартный JS API):

```tsx
searchParams.get("key");          // string | null
searchParams.getAll("key");       // string[] (для повторяющихся ключей)
searchParams.has("key");          // boolean
searchParams.toString();          // "page=1&sort=name"
[...searchParams];                // [["page", "1"], ["sort", "name"]]
Object.fromEntries(searchParams); // { page: "1", sort: "name" } (только последнее значение для дубл-ключа)
```

### Обновление

```tsx
// Объект — заменяет все params
setSearchParams({ page: "1", sort: "name" });

// Функция — есть доступ к prev (для частичного обновления)
setSearchParams(prev => {
  prev.set("page", "2");
  return prev;
});

// URLSearchParams — заменяет
const next = new URLSearchParams(searchParams);
next.set("page", "2");
setSearchParams(next);

// Удалить параметр
setSearchParams(prev => {
  prev.delete("filter");
  return prev;
});
```

### Опции

```tsx
setSearchParams({ page: "2" }, { replace: true });
setSearchParams({ page: "2" }, { state: { foo: "bar" } });
```

### Множественные значения для одного ключа

```tsx
// /search?tag=js&tag=react
const tags = searchParams.getAll("tag");  // ["js", "react"]

setSearchParams(prev => {
  prev.append("tag", "ts");  // append вместо set
  return prev;
});
// /search?tag=js&tag=react&tag=ts
```

### Кастомный хук для типизированных параметров

```tsx
function useTypedSearchParams<T extends Record<string, any>>(defaults: T) {
  const [params, setParams] = useSearchParams();
  
  const obj = useMemo(() => {
    const result = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const value = params.get(key);
      if (value !== null) {
        result[key] = (typeof defaults[key] === "number" ? Number(value) : value) as any;
      }
    }
    return result;
  }, [params]);
  
  const update = useCallback((updates: Partial<T>) => {
    setParams(prev => {
      for (const [k, v] of Object.entries(updates)) {
        if (v == null || v === "") prev.delete(k);
        else prev.set(k, String(v));
      }
      return prev;
    });
  }, [setParams]);
  
  return [obj, update] as const;
}

// Использование
const [{ page, sort }, update] = useTypedSearchParams({ page: 1, sort: "name" });
update({ page: 2 });
```

---

## 📍 useLocation

```tsx
import { useLocation } from "react-router-dom";

function Tracker() {
  const location = useLocation();
  
  console.log(location.pathname);  // "/users/42"
  console.log(location.search);    // "?tab=info"
  console.log(location.hash);      // "#contact"
  console.log(location.state);     // { from: "...", ... } (передано через navigate state)
  console.log(location.key);       // уникальный ключ для этой записи в history
  
  // Аналитика на смену страницы
  useEffect(() => {
    analytics.pageView(location.pathname);
  }, [location.pathname]);
}
```

### Полезные паттерны

```tsx
// Текущий путь как зависимость
useEffect(() => {
  // выполняется при смене URL
}, [location]);

// Парсинг search вручную (если не через useSearchParams)
const params = new URLSearchParams(location.search);
const page = params.get("page");
```

---

## ⚠️ Подводные камни

### useNavigate

#### 1. Вне React-дерева — не работает

```tsx
// ❌ navigate доступен только внутри Router
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();  // SyntaxError если не внутри компонента

// ✅ Передавай как колбэк
function logout(navigate: ReturnType<typeof useNavigate>) {
  api.logout();
  navigate("/login");
}
// или используй axios interceptor с window.location.href = "/login"
```

#### 2. navigate в useEffect без deps

```tsx
// ❌ Бесконечный редирект
useEffect(() => {
  navigate("/dashboard");
});

// ✅ Условие + deps
useEffect(() => {
  if (user) navigate("/dashboard");
}, [user, navigate]);
```

#### 3. State теряется при reload

```tsx
navigate("/order", { state: { from: "cart" } });

// На следующей странице:
const { state } = useLocation();
// При обычной навигации — { from: "cart" }
// Но если пользователь обновит страницу — state будет null
// → не клади критичные данные в state, только UX-helpers
```

### useParams

#### 1. Параметры всегда string

```tsx
const { id } = useParams();
// id — string | undefined
// Если route /users/:id, и URL /users/42 → id = "42" (не 42!)

// ✅ Конвертируй
const userId = Number(id);
if (isNaN(userId)) return <NotFound />;
```

#### 2. URL-кодирование

```tsx
// Если в URL "/users/john%20doe"
const { name } = useParams();  // "john doe" (декодировано автоматически)

// При navigate — кодирование тоже автомат
navigate(`/users/${encodeURIComponent("john doe")}`);
```

### useSearchParams

#### 1. Прямая мутация — не вызывает рендер

```tsx
// ❌ React не узнает об изменении
searchParams.set("page", "2");

// ✅ Через setSearchParams
setSearchParams(prev => {
  prev.set("page", "2");
  return prev;
});
```

#### 2. setSearchParams без prev — стирает другие

```tsx
// ❌ Удалит все params кроме page
setSearchParams({ page: "2" });

// ✅ Сохрани остальные через prev
setSearchParams(prev => {
  prev.set("page", "2");
  return prev;
});

// или вручную
setSearchParams({ ...Object.fromEntries(searchParams), page: "2" });
```

#### 3. Boolean в search params

```tsx
// ❌ "false" → truthy при чтении
searchParams.set("filter", String(false));
const filter = searchParams.get("filter");  // "false"
if (filter) { /* ← всегда true! */ }

// ✅ Проверяй явно
if (filter === "true") { ... }

// или преобразуй
const enabled = searchParams.get("filter") === "true";
```

#### 4. Неэкранированные значения

```tsx
// Если значение содержит &, =, # — нужно экранировать
setSearchParams({ search: "a&b" });
// URL: /?search=a%26b — кодирование автомат
```

---

## 🔬 Тонкие моменты

**`navigate` стабилен между рендерами** (как dispatch у useReducer)

```tsx
useEffect(() => {
  // ...
}, [navigate]);  // ✅ Можно класть в deps — не пересоздаётся
```

**`useSearchParams` vs `useState`**

URL state vs Local state:
- URL state — shareable (можно отправить ссылку), сохраняется при back/forward, видно в history.
- Local state — не отображается в URL, теряется при reload.

Для фильтров каталога/поиска — URL state предпочтительнее.

**Синхронизация state с URL**

```tsx
// Двусторонняя связь form ↔ URL
const [searchParams, setSearchParams] = useSearchParams();
const [filter, setFilter] = useState(searchParams.get("filter") ?? "");

// При вводе — обновить URL
useEffect(() => {
  setSearchParams(prev => {
    if (filter) prev.set("filter", filter);
    else prev.delete("filter");
    return prev;
  }, { replace: true });  // replace, чтобы не засорять history
}, [filter, setSearchParams]);
```

**Debounce для URL update**

```tsx
const [filter, setFilter] = useState(searchParams.get("filter") ?? "");
const debouncedFilter = useDebounce(filter, 300);

useEffect(() => {
  setSearchParams(prev => {
    if (debouncedFilter) prev.set("filter", debouncedFilter);
    else prev.delete("filter");
    return prev;
  }, { replace: true });
}, [debouncedFilter]);
```

**View Transitions API**

```tsx
navigate("/next", { unstable_viewTransition: true });
// Браузер применит View Transition API для плавных переходов
// Полезно с CSS animations
```

**`useNavigationType` — откуда пришли**

```tsx
const type = useNavigationType();  // "PUSH" | "REPLACE" | "POP"
// PUSH — обычный переход
// REPLACE — replace
// POP — back/forward
```

**Хук useBackOrFallback**

```tsx
function useBackOrFallback(fallback: string) {
  const navigate = useNavigate();
  return useCallback(() => {
    if (window.history.length > 2) navigate(-1);
    else navigate(fallback);
  }, [navigate, fallback]);
}
// "Назад" если есть история, иначе на fallback
```

---

## 🧩 Задачи для закрепления

**Задача 1 — Каталог с URL-фильтрами**
Список товаров. Фильтры (категория, цена, сортировка) — в URL через `useSearchParams`. При обновлении страницы — фильтры сохраняются. Можно поделиться ссылкой.

**Задача 2 — Wizard через URL**
Многошаговая форма. Каждый шаг — `?step=2`. Кнопки "Назад" / "Далее" обновляют step. При reload — пользователь остаётся на том же шаге.

**Задача 3 — Возврат после login**
LoginPage. Если редирект пришёл из protected route — после login возвращаться на исходную страницу через `state.from`.

**Задача 4 — Search input с debounce + URL**
Поле поиска. При вводе — debounce 300ms → обновление `?search=...` в URL. Список фильтруется по URL-параметру.

**Задача 5 — Навигация с историей**
Хедер с кнопкой "Назад":
- Если есть история — `navigate(-1)`.
- Если нет — `navigate("/")`.

**Задача 6 — Type-safe useParams через хук**
Напиши `useTypedParams<T>(parser)` который применяет валидацию (например, через zod) и возвращает типизированный объект.

**Задача 7 — Pagination через URL**
Список с пагинацией. `?page=N&pageSize=N`. Кнопки "Prev"/"Next" обновляют `page`. При смене pageSize — page сбрасывается на 1.

**Задача 8 — Мульти-фильтр (массив значений)**
Каталог с тегами. URL: `?tag=js&tag=react&tag=ts`. Чекбоксы тегов. При клике — добавление/удаление.

**Задача 9 — Анти-паттерн: дублирование state**
Покажи код, где searchParams дублируется в local state с useState (антипаттерн). Перепиши только через searchParams.

**Задача 10 — Tracking pageView**
Хук `usePageView` через `useLocation`. При смене pathname — отправлять событие в analytics.
