## 📝 Теория

### Виды state в React-приложении

Прежде чем выбирать инструмент, **классифицируй state**. Это самый важный шаг — у каждого типа state свой инструмент.

| Тип state | Что это | Инструмент |
|---|---|---|
| **Local UI state** | Открытость модалки, активный таб, hover | `useState` / `useReducer` |
| **Cross-cutting UI state** | Тема, локаль, авторизованный user, навигация | Context |
| **Global state** | Корзина, фильтры приложения, состояние формы wizard | Zustand / Jotai / Redux |
| **Server state** | Данные с API, кеш, sync | React Query / RTK Query / SWR |
| **URL state** | Фильтры из query, текущий route, search | React Router (searchParams) |
| **Form state** | Поля формы, ошибки, dirty/touched | React Hook Form |

❗ **Ключевая мысль:** не пихай всё в один Redux store. Server state в Redux — это анти-паттерн (используй React Query). Form state в Zustand — анти-паттерн (используй RHF).

---

### Сравнительная таблица инструментов

| | useState | useReducer | Context | Zustand | Jotai | Redux Toolkit | React Query |
|---|---|---|---|---|---|---|---|
| **Локальный** | ✅ | ✅ | ❌ | ➖ | ➖ | ❌ | ❌ |
| **Глобальный** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ (server) |
| **Гранулярные подписки** | — | — | ❌ | ✅ | ✅ | ✅ (с reselect) | ✅ |
| **DevTools** | ❌ | ❌ | ❌ | ✅ | ➖ | ✅✅ | ✅ |
| **Boilerplate** | 0 | low | low | low | low | medium | low |
| **Async state** | useEffect | useEffect | — | в actions | async atoms | thunks/RTKQ | первокласс |
| **Persist** | сам | сам | сам | middleware | atomWithStorage | redux-persist | — |
| **SSR** | ✅ | ✅ | ✅ | через middleware | через Provider | ✅ | ✅ |
| **Размер** | 0 | 0 | 0 | 1KB | 3KB | 15KB | 13KB |
| **Provider в корне** | — | — | да | нет | опц. | да | да |

---

### Дерево решений

```
Это локальный state одного компонента?
├─ Простой (boolean, string, number)?
│  └─ ✅ useState
└─ Сложный (объект, переходы, машина состояний)?
   └─ ✅ useReducer

Это нужно нескольким компонентам?
├─ Server state (данные с API)?
│  └─ ✅ React Query / RTK Query / SWR
│
├─ URL state (фильтры в query, текущий path)?
│  └─ ✅ React Router (searchParams) / useSearchParams
│
├─ Form state?
│  └─ ✅ React Hook Form
│
├─ Cross-cutting (тема, юзер, локаль, конфиг)?
│  ├─ Меняется редко?
│  │  └─ ✅ Context
│  └─ Меняется часто?
│     └─ ✅ Zustand с селектором
│
└─ Сложный глобальный state с derived зависимостями?
   ├─ Простой реактивный?
   │  └─ ✅ Zustand
   ├─ Граф производных значений?
   │  └─ ✅ Jotai
   └─ Большое приложение, нужны строгие процессы?
      └─ ✅ Redux Toolkit
```

---

### Конкретные сценарии

#### Сценарий 1: Toggle/dropdown/modal

```tsx
// ✅ useState
function Modal() {
  const [isOpen, setOpen] = useState(false);
  return (...);
}
```

#### Сценарий 2: Wizard форма (3 шага)

```tsx
// ✅ useReducer + локально
const [state, dispatch] = useReducer(wizardReducer, initialState);
// Обмен данных между шагами через dispatch
```

#### Сценарий 3: Тема приложения

```tsx
// ✅ Context (меняется редко, нужно везде)
<ThemeProvider>
  <App />
</ThemeProvider>
```

#### Сценарий 4: Корзина в магазине

```tsx
// ✅ Zustand — изменения часто, нужна гранулярность
const useCartStore = create((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })),
}));

// Хедер: useCartStore(s => s.items.length)  ← рендерится редко
// Корзина: useCartStore(s => s.items)        ← рендерится при добавлении
```

#### Сценарий 5: Страница с пользовательскими данными

```tsx
// ✅ React Query — серверный state, кеш, refetch
const { data: user } = useQuery({
  queryKey: ["user", id],
  queryFn: () => api.getUser(id),
});

// ❌ НЕ Redux/Zustand — серверный state там — анти-паттерн
```

#### Сценарий 6: Каталог с фильтрами

```tsx
// ✅ URL state для фильтров (shareable URL)
const [searchParams, setSearchParams] = useSearchParams();
const category = searchParams.get("category") ?? "all";
const price    = Number(searchParams.get("price")) || 0;

// ✅ React Query для данных
const { data: products } = useQuery({
  queryKey: ["products", { category, price }],
  queryFn: () => api.getProducts({ category, price }),
});
```

#### Сценарий 7: Регистрационная форма

```tsx
// ✅ React Hook Form
const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

#### Сценарий 8: Большое финансовое приложение

```tsx
// ✅ Redux Toolkit + RTK Query
// - Строгие actions, time-travel debug
// - Server state в RTK Query
// - Middleware для логирования транзакций
// - Несколько команд работают параллельно
```

---

### Анти-паттерны

#### ❌ Server state в Redux

```tsx
// ❌ Дублирование, ручная синхронизация
const slice = createSlice({
  name: "users",
  reducers: { setUsers: (state, action) => { state.users = action.payload; } },
});
useEffect(() => { fetch("/api/users").then(r => r.json()).then(d => dispatch(setUsers(d))); }, []);

// ✅ React Query
const { data } = useQuery({ queryKey: ["users"], queryFn: () => api.getUsers() });
```

#### ❌ Form state в глобальном store

```tsx
// ❌ Зачем поля формы на 5 минут жизни в глобальном Redux?
const slice = createSlice({ name: "form", reducers: { setEmail, setPassword, ... } });

// ✅ Локально через RHF
const { register } = useForm();
```

#### ❌ Один большой Context для всего

```tsx
// ❌ Изменение любого поля → перерисовка всех потребителей
<AppContext.Provider value={{ user, theme, cart, settings, posts }}>

// ✅ Несколько контекстов или Zustand с селекторами
```

#### ❌ Преждевременная глобализация

```tsx
// ❌ State, нужный только одному компоненту, в Redux
const [showHelp, setShowHelp] = useState(false);  // ← нужно только здесь
// Не делай dispatch({ type: "HELP_TOGGLED" })

// ✅ Локально useState
```

#### ❌ Изобретение своего store вместо готового

```tsx
// ❌ Код 200 строк, баги с гранулярностью, нет DevTools
const myStore = { listeners: [], state: {}, ... };

// ✅ 5 строк через Zustand
const useStore = create((set) => ({ ... }));
```

---

### Микс — реальная архитектура

В большинстве проектов используется **комбинация инструментов**:

```tsx
// 1. Локальный — useState/useReducer
// 2. Тема, локаль — Context
// 3. UI глобальный (open menu, filters) — Zustand
// 4. Серверный — React Query / RTK Query
// 5. URL — React Router
// 6. Формы — React Hook Form

// Пример: страница каталога
function CatalogPage() {
  // URL state
  const [params, setParams] = useSearchParams();
  
  // Server state
  const { data: products, isLoading } = useQuery({
    queryKey: ["products", params.toString()],
    queryFn: () => api.getProducts(Object.fromEntries(params)),
  });
  
  // UI state (раскрытость фильтров) — global Zustand для синхронизации между страницами
  const filtersOpen = useUIStore(s => s.filtersOpen);
  
  // Локальный — для модалки превью
  const [previewProduct, setPreviewProduct] = useState(null);
  
  return (...);
}
```

---

### Размер vs функциональность

```
Простой проект (< 5 страниц):
  useState + useReducer + Context + React Query
  → 0 KB дополнительно (всё в React + RQ)

Средний проект (5-30 страниц):
  + Zustand (1 KB) для глобального UI state
  + React Hook Form для форм
  → ~15 KB stack

Большой проект (30+ страниц, несколько команд):
  Redux Toolkit + RTK Query
  + React Hook Form
  → ~30 KB stack, но строгая структура
```

---

### Server state vs Client state — главное отличие

| | Client state | Server state |
|---|---|---|
| Кто владеет | Браузер | Сервер |
| Контроль | Полный | Частичный (другие пользователи могут менять) |
| Persistence | localStorage / cookie | БД на сервере |
| Кеш | Память приложения | HTTP-кеш + клиентский кеш |
| Stale | Не бывает | Всегда возможно |
| Типичные операции | mutate / set | fetch / mutate / refetch / invalidate |

Server state требует особых инструментов (React Query) потому что нужны:
- Кеш по ключу.
- Дедупликация запросов.
- Refetch при focus, mount, networkOnline.
- Stale-while-revalidate.
- Pagination, infinite scroll.
- Optimistic updates.

---

## 🔬 Тонкие моменты

**Не нужно ВСЁ заменять одним инструментом**

Это самая частая ошибка. Redux подходит для не всего. Zustand не нужен везде. Атомы Jotai не для localState.

**Эволюция: useState → Context → Store**

Стартуй с useState. Когда два компонента нуждаются в общем state — поднимай его выше (lifting state up). Если "выше" слишком далеко — Context. Если контекст становится тяжёлым — Zustand/Jotai.

**Server state НЕ кешируй в Redux/Zustand**

Это самая важная мысль книги "TkDodo's blog". Server state имеет свой жизненный цикл (stale, refetch, network errors) — это работа React Query / SWR.

**Если переписываешь legacy Redux — двигайся постепенно**

1. Server state → React Query (обычно даёт −50% кода).
2. Form state → React Hook Form.
3. Local UI → useState.
4. То что осталось — оставь в Redux или мигрируй в Zustand.

**Хорошая архитектура зависит от размера команды**

- 1-2 разработчика — меньше структуры, больше гибкости (Zustand).
- 5+ разработчиков — больше структуры, чёткие правила (Redux Toolkit + linter rules).

**Производительность редко становится боттлнеком**

Проблемы производительности с state-менеджерами обычно от:
- Передача целого state без селекторов.
- Объект в Provider value без useMemo.
- Селекторы создающие новые объекты.

Реши их — и любой инструмент работает быстро.

---

## 🧩 Задачи для закрепления

**Задача 1 — Архитектурное упражнение**
Проектируй state для интернет-магазина:
- Каталог товаров с фильтрами.
- Корзина (синхронизируется с localStorage и сервером после login).
- Auth: токен, профиль.
- Wishlist.
- Notifications (тосты).
- Текущий заказ (wizard 4 шага).

Для каждого — определи инструмент (useState / Context / Zustand / Redux / React Query / RHF / URL state). Обоснуй.

**Задача 2 — Эволюция приложения**
Возьми простое приложение todos. Разверни эволюцию:
1. Версия 1: useState в компоненте App.
2. Версия 2: useReducer в компоненте App.
3. Версия 3: useReducer + Context (несколько компонентов).
4. Версия 4: Zustand store.
5. Версия 5: + React Query для синхронизации с сервером.

Сравни каждую версию: код, гранулярность, читаемость.

**Задача 3 — Server state migration**
Возьми существующий проект (или придумай) с сервер-данными в Redux. Перепиши data fetching на React Query. Сколько строк кода удалено? Какие баги ушли?

**Задача 4 — Сравнение Zustand vs Redux**
Реализуй cart-store обоих способах. Сравни:
- Количество строк (включая slice/reducer/action).
- Время рендера (Profiler).
- DevTools опыт.
- Boilerplate для добавления нового действия.

**Задача 5 — Гибрид Context + Zustand**
Сделай приложение, где:
- Тема — Context.
- Auth — Zustand + persist.
- Cart — Zustand.
- Posts — React Query.

Покажи, что разные инструменты живут параллельно без конфликтов.

**Задача 6 — Wizard форма**
Реализуй 3-шаговую форму регистрации:
- Step 1: личные данные.
- Step 2: адрес.
- Step 3: подтверждение.

Состояние формы — Zustand (или useReducer + Context). Поля — RHF. Submit на последнем шаге — React Query mutation.

**Задача 7 — Profile нескольких подходов**
Создай компонент с тяжёлым рендером и подключи его поочерёдно к:
1. useState в родителе.
2. Context.
3. Zustand с селектором.
4. Jotai атом.

Запусти Profiler и сравни количество рендеров и время.

**Задача 8 — Анти-паттерн поиск**
Найди в реальном проекте (или придумай) случаи:
- Server state в Redux/Zustand.
- Form state в Context.
- Один God-Context.
- Бесполезный Provider.

Обоснуй, почему это анти-паттерн, и предложи замену.
