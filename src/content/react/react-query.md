## 📝 Теория

### Что такое серверный state

Серверный state — это данные, которые **живут на сервере**, а клиент только синхронизируется с ними. Он отличается от клиентского state:

- **Stale by nature** — пока ты смотришь данные, другие пользователи могут их менять.
- **Async** — fetch занимает время, нужны loading/error states.
- **Кешируется** — повторный запрос за теми же данными не должен идти в сеть.
- **Refetch** — нужно периодически обновлять, при возврате к окну, после mutation.

`useEffect + useState + fetch` решает эту задачу плохо: нет кеша, race conditions, дубли запросов, отсутствие refetch.

### React Query (TanStack Query)

[**TanStack Query**](https://tanstack.com/query) — библиотека для работы с серверным state. Изначально называлась React Query, теперь поддерживает React, Vue, Solid, Svelte.

**Основные фичи:**
- 🎯 Автоматический **кеш** по queryKey.
- 🎯 **Дедупликация** запросов (5 компонентов с одним key → один HTTP).
- 🎯 **Refetch** при focus, mount, networkOnline.
- 🎯 **Stale-while-revalidate** — показываем старые данные, пока грузим новые.
- 🎯 **Pagination, infinite scroll** из коробки.
- 🎯 **Optimistic updates** для мутаций.
- 🎯 **DevTools** с visualization кеша.
- 🎯 **Suspense / Error Boundary** интеграция.
- 🎯 SSR через hydration.

---

### Установка и базовая настройка

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 минут — данные считаются "свежими"
      gcTime:    10 * 60 * 1000,   // 10 минут — после удаляются из памяти
      retry:     2,                 // повторных попыток при ошибке
      refetchOnWindowFocus: true,  // refetch при возврате во вкладку
    },
    mutations: {
      retry: 0,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

### useQuery — чтение данных

```tsx
import { useQuery } from "@tanstack/react-query";

function UserProfile({ id }: { id: number }) {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["user", id],                    // уникальный ключ кеша
    queryFn: () => fetch(`/api/users/${id}`).then(r => r.json()),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,                              // не выполнять без id
    select: (data) => ({ ...data, fullName: `${data.first} ${data.last}` }),  // трансформация
  });

  if (isLoading) return <Spinner />;
  if (isError)   return <Error message={error.message} />;
  
  return (
    <div>
      <h1>{data!.fullName}</h1>
      <button onClick={() => refetch()}>{isFetching ? "Loading..." : "Refresh"}</button>
    </div>
  );
}
```

**Возвращаемые значения:**

| Поле | Тип | Описание |
|---|---|---|
| `data` | `T \| undefined` | Данные (undefined пока loading) |
| `isLoading` | `boolean` | Первая загрузка (нет данных) |
| `isFetching` | `boolean` | Любая загрузка (включая background refetch) |
| `isError` | `boolean` | Произошла ошибка |
| `error` | `Error \| null` | Объект ошибки |
| `isSuccess` | `boolean` | Запрос успешен |
| `status` | `"pending" \| "error" \| "success"` | |
| `refetch` | `() => Promise` | Ручной refetch |
| `dataUpdatedAt` | `number` | Timestamp последнего обновления |

---

### Query keys — ключи кеша

QueryKey — это **уникальный идентификатор** запроса. Он определяет:
- Какой кеш использовать.
- Когда инвалидировать.
- Как дедуплицировать.

```tsx
// ✅ Простой
queryKey: ["users"]

// ✅ С параметрами
queryKey: ["user", userId]

// ✅ Иерархический (для inv)
queryKey: ["users", "list"]
queryKey: ["users", "detail", userId]
queryKey: ["users", "detail", userId, "posts"]

// ✅ Со сложными фильтрами — объект
queryKey: ["products", { category, priceMin, priceMax, sort }]
```

**Все значения в queryKey должны быть сериализуемыми** (примитивы, массивы, объекты).

### Best practice: query key factory

```tsx
const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: Filters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
};

// Использование
useQuery({ queryKey: userKeys.detail(42), queryFn: () => api.getUser(42) });

// Инвалидация всех users
queryClient.invalidateQueries({ queryKey: userKeys.all });

// Инвалидация только details
queryClient.invalidateQueries({ queryKey: userKeys.details() });
```

---

### useMutation — изменение данных

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";

function EditUser({ user }: { user: User }) {
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, isError } = useMutation({
    mutationFn: (patch: Partial<User>) =>
      fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }).then(r => r.json()),

    // После успеха — инвалидируем кеш
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["user", user.id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      // или: setQueryData для прямого обновления без сетевого запроса
      // queryClient.setQueryData(["user", user.id], updatedUser);
    },

    onError: (error) => {
      toast.error(`Не удалось сохранить: ${error.message}`);
    },
  });

  return (
    <button onClick={() => mutate({ name: "New Name" })} disabled={isPending}>
      {isPending ? "Saving..." : "Save"}
    </button>
  );
}
```

`mutate(args)` — fire and forget.
`mutateAsync(args)` — возвращает Promise (для `await`).

---

### Optimistic updates

```tsx
const { mutate } = useMutation({
  mutationFn: (newTodo: Todo) => api.toggleTodo(newTodo.id),
  
  // 1. Перед запросом — обновляем кеш сразу
  onMutate: async (newTodo) => {
    // отменяем in-flight запросы (избегаем race conditions)
    await queryClient.cancelQueries({ queryKey: ["todos"] });
    
    // снимок текущего состояния
    const previous = queryClient.getQueryData<Todo[]>(["todos"]);
    
    // оптимистичное обновление
    queryClient.setQueryData<Todo[]>(["todos"], (old) =>
      old?.map(t => t.id === newTodo.id ? { ...t, done: !t.done } : t)
    );
    
    return { previous };  // в context
  },
  
  // 2. При ошибке — откат
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(["todos"], context?.previous);
    toast.error("Не удалось обновить");
  },
  
  // 3. После завершения (success или error) — синхронизация с сервером
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["todos"] });
  },
});
```

---

### Dependent queries

```tsx
// Сначала загружаем пользователя, потом его посты
function UserPosts({ userId }: { userId: number }) {
  const { data: user } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => api.getUser(userId),
  });

  const { data: posts } = useQuery({
    queryKey: ["posts", "byUser", user?.id],
    queryFn: () => api.getPostsByUser(user!.id),
    enabled: !!user?.id,  // ← ключ к dependent
  });
}
```

---

### Pagination

```tsx
function PaginatedUsers() {
  const [page, setPage] = useState(1);

  const { data, isPlaceholderData, isFetching } = useQuery({
    queryKey: ["users", { page }],
    queryFn: () => api.getUsers({ page, limit: 10 }),
    placeholderData: (prev) => prev,  // показываем старые данные при переходе
  });

  return (
    <>
      <Table data={data} dimmed={isPlaceholderData} />
      <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
      <span>Page {page}</span>
      <button onClick={() => setPage(p => p + 1)}>Next</button>
    </>
  );
}
```

---

### Infinite queries

```tsx
import { useInfiniteQuery } from "@tanstack/react-query";

function InfinitePosts() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: ({ pageParam }) => api.getPosts({ cursor: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  return (
    <>
      {data?.pages.map((page, i) => (
        <Fragment key={i}>
          {page.items.map(post => <PostCard key={post.id} post={post} />)}
        </Fragment>
      ))}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? "Loading..." : hasNextPage ? "Load more" : "No more"}
      </button>
    </>
  );
}
```

---

### Prefetching

```tsx
// На hover ссылки — предзагрузить данные следующей страницы
function UserLink({ id }: { id: number }) {
  const queryClient = useQueryClient();
  
  return (
    <Link
      to={`/users/${id}`}
      onMouseEnter={() => {
        queryClient.prefetchQuery({
          queryKey: ["user", id],
          queryFn: () => api.getUser(id),
          staleTime: 60_000,  // не трогать если меньше минуты
        });
      }}
    >
      User {id}
    </Link>
  );
}
```

---

### Suspense mode

```tsx
import { useSuspenseQuery } from "@tanstack/react-query";

function UserProfile({ id }: { id: number }) {
  // Если данные ещё не загружены — Suspense fallback
  const { data } = useSuspenseQuery({
    queryKey: ["user", id],
    queryFn: () => api.getUser(id),
  });
  // data всегда определён здесь — никаких isLoading/data?

  return <h1>{data.name}</h1>;
}

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <ErrorBoundary fallback={<Error />}>
        <UserProfile id={42} />
      </ErrorBoundary>
    </Suspense>
  );
}
```

---

### Refetch стратегии

```tsx
useQuery({
  queryKey: ["data"],
  queryFn: fetchData,
  
  staleTime: 0,                    // данные сразу stale → refetch при mount
  gcTime: 5 * 60 * 1000,           // в кеше 5 минут после unmount
  
  refetchOnMount: true,            // при mount если stale
  refetchOnWindowFocus: true,      // при возврате во вкладку
  refetchOnReconnect: true,        // при восстановлении сети
  
  refetchInterval: 30 * 1000,      // polling каждые 30 сек
  refetchIntervalInBackground: false,
  
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});
```

---

### SSR (Next.js, Remix)

```tsx
// На сервере: prefetch + dehydrate
const queryClient = new QueryClient();
await queryClient.prefetchQuery({ queryKey: ["user", id], queryFn: ... });
const dehydratedState = dehydrate(queryClient);

// На клиенте: hydrate
<QueryClientProvider client={new QueryClient()}>
  <HydrationBoundary state={dehydratedState}>
    <App />
  </HydrationBoundary>
</QueryClientProvider>

// В компоненте — useQuery как обычно, но он сразу получит данные из hydration
const { data } = useQuery({ queryKey: ["user", id], queryFn: ... });
```

---

## ⚠️ Подводные камни

### 1. Неполный queryKey

```tsx
// ❌ Не учитываем фильтр в ключе → разные параметры → один кеш
useQuery({
  queryKey: ["products"],
  queryFn: () => api.getProducts({ category }),  // category меняется, ключ нет
});

// ✅ Все параметры в queryKey
useQuery({
  queryKey: ["products", { category }],
  queryFn: () => api.getProducts({ category }),
});
```

### 2. staleTime = 0 (default) → каждый mount запрос

```tsx
// ❌ staleTime: 0 → при каждом монтировании компонента — запрос
useQuery({ queryKey: ["users"], queryFn: ... });

// ✅ Установи разумный staleTime
useQuery({ queryKey: ["users"], queryFn: ..., staleTime: 5 * 60 * 1000 });
```

### 3. Дублирование server state в Redux/Zustand

```tsx
// ❌ Грузим данные через React Query, дублируем в Zustand
const { data: user } = useQuery({...});
useEffect(() => {
  useUserStore.setState({ user: data });  // ← антипаттерн
}, [data]);

// ✅ Используй React Query как источник истины
const { data: user } = useQuery(...);
```

### 4. Mutation без инвалидации

```tsx
// ❌ Изменили данные, кеш не обновился → пользователь видит старые данные
useMutation({
  mutationFn: api.updateUser,
  // нет onSuccess
});

// ✅ Инвалидация после mutation
useMutation({
  mutationFn: api.updateUser,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
});
```

### 5. Fetch внутри queryFn без обработки ошибок

```tsx
// ❌ fetch не throws на 404/500 — React Query думает запрос успешен
useQuery({
  queryKey: ["user"],
  queryFn: () => fetch("/api/user").then(r => r.json()),  // 500 — не error!
});

// ✅ Проверь ok
useQuery({
  queryKey: ["user"],
  queryFn: async () => {
    const r = await fetch("/api/user");
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
});
```

### 6. Race condition при быстрой смене параметров

React Query сам это решает (cancelQueries при новом запросе с тем же key) — но если делаешь optimistic update без `await cancelQueries`, может сломаться.

### 7. Слишком много refetch

```tsx
// ❌ refetchOnWindowFocus + refetchOnReconnect + refetchInterval: 5000 → постоянная сеть
// ✅ Подбирай разумно для конкретного query
```

---

## 🔬 Тонкие моменты

**`staleTime` vs `gcTime`** (раньше cacheTime)

- `staleTime` — сколько данные считаются "свежими" (не нужен refetch).
- `gcTime` — сколько данные хранятся в памяти **после того, как компонент unmount**.

```
[fetch] → [fresh] → [stale] → [unmount + gcTime] → [removed from cache]
         ←staleTime→                                ←gcTime→
```

**`select` — трансформация данных**

```tsx
// Селектор работает после кеша, не загружает дважды
useQuery({
  queryKey: ["users"],
  queryFn: api.getUsers,
  select: (data) => data.filter(u => u.active),
  // Изменение в фильтре — компонент рендерится с новым select
});
```

**`useQueries` — массив запросов**

```tsx
const results = useQueries({
  queries: userIds.map(id => ({
    queryKey: ["user", id],
    queryFn: () => api.getUser(id),
  })),
});
// results[i].data, results[i].isLoading
```

**`placeholderData` для smooth UX**

```tsx
useQuery({
  queryKey: ["users", page],
  queryFn: ...,
  placeholderData: (prev) => prev,  // оставляем старые данные при смене page
});
// Никаких "loading..." при пагинации
```

**`network mode`**

```tsx
// always — выполняется даже offline
// online (default) — только если в сети
// offlineFirst — пробует кеш сначала
useQuery({ networkMode: "always" });
```

**Custom hooks**

```tsx
// Best practice — оборачивать useQuery в кастомные хуки
function useUser(id: number) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => api.getUser(id),
    enabled: !!id,
  });
}

function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}
```

**React Query DevTools**

Открой → видишь все запросы, их статусы, кеш, можешь вручную inv-ить, refetch. Незаменимый инструмент.

**Сравнение с RTK Query / SWR**

| | React Query | RTK Query | SWR |
|---|---|---|---|
| Кому подходит | независимый | если уже есть Redux | минималистичный |
| Размер | 13KB | внутри RTK 15KB | 5KB |
| API | hooks с queryKey | declarative endpoints | hooks |
| Optimistic | onMutate | updateQueryData | optimisticData |
| DevTools | свои | Redux DevTools | свои |

**Лучшие практики (TkDodo)**

Доминик "TkDodo" Дориан — мейнтейнер React Query, ведёт [блог с лучшими практиками](https://tkdodo.eu/blog/react-query-as-a-state-manager). Must-read для серьёзной работы с RQ.

---

## 🧩 Задачи для закрепления

**Задача 1 — Базовый CRUD**
Сделай страницу с пользователями:
- `useQuery` для получения списка.
- `useQuery` для одного пользователя по клику.
- `useMutation` для создания/редактирования/удаления.
- Инвалидация кеша после mutation.

**Задача 2 — Pagination + smooth transitions**
Список постов с пагинацией. Используй `placeholderData: (prev) => prev`. При переходе на следующую страницу — старые данные остаются (полупрозрачные), новые загружаются в фоне.

**Задача 3 — Infinite scroll**
Лента постов с подгрузкой при скролле через `useInfiniteQuery` + `IntersectionObserver`. Покажи дедупликацию: повторный скролл вниз-вверх не делает новых запросов.

**Задача 4 — Optimistic update для лайков**
Кнопка лайка под постом. При клике:
- Лайк сразу применяется в UI.
- Запрос идёт на сервер.
- При ошибке — лайк откатывается.
- При успехе — кеш синхронизируется с реальным значением.

**Задача 5 — Dependent queries**
Профиль пользователя:
- Загрузить user.
- На основе user.id — загрузить его posts.
- На основе posts — загрузить comments к каждому через `useQueries`.

**Задача 6 — Search с debounce**
Поле поиска. При вводе:
- `debounce` 300ms.
- `useQuery` с queryKey включающим search-term.
- Дедупликация автоматически (одинаковый key → один запрос).
- При очистке поля — disabled query.

**Задача 7 — Auth + token refresh**
Реализуй авторизацию:
- `useMutation` для login/logout.
- `useQuery` для текущего пользователя (`useUser()`).
- Глобальный обработчик 401 → попытка refresh токена → ретрай запроса.

**Задача 8 — Prefetching**
Список карточек пользователей. При hover на карточке — `prefetchQuery` для деталей. Покажи в DevTools, что данные уже в кеше при клике.

**Задача 9 — Suspense + Error Boundary**
Перепиши задачу 1 на `useSuspenseQuery`. Оберни в Suspense + ErrorBoundary. Сравни код с обычным `useQuery + isLoading + isError`.

**Задача 10 — Polling**
Чат с сообщениями. Используй `refetchInterval: 5000` для polling новых сообщений. Останови polling если пользователь не во вкладке (`refetchIntervalInBackground: false`).
