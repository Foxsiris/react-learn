## 📝 Теория

### Пирамида тестирования

```
        ╱╲
       ╱E2E╲       ← медленные, дорогие, мало
      ╱─────╲
     ╱ Integ ╲     ← важная середина (60-70%)
    ╱─────────╲
   ╱   Unit    ╲   ← быстрые, много (но не главное!)
  ╱─────────────╲
```

**Сегодня индустрия двигается к "тестовому трофею"** (Kent C. Dodds) — больше integration, меньше unit:

```
       ╱──╲
      ╱E2E ╲
     ╱──────╲
    ╱ Integ  ╲    ← ОСНОВА (60-70%)
   ╱──────────╲
  ╱   Unit     ╲
 ╱──────────────╲
╱     Static    ╲   ← TS, ESLint
```

Integration — лучший ROI: проверяет реальную работу нескольких компонентов вместе, ловит больше багов, не ломается от рефакторинга.

---

### Что такое интеграционный тест

**Integration тест** проверяет **взаимодействие нескольких компонентов** или модулей. Имитирует реальный пользовательский сценарий:

- Открытие страницы → ввод данных → submit → проверка результата.
- Список + добавление + редактирование.
- Auth flow → защищённая страница → данные.

**Не unit:** не одна функция/компонент.  
**Не E2E:** не вся система с настоящим backend и браузером.

---

### Setup для интеграционных тестов

```tsx
// test-utils.tsx
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

function AllProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function customRender(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from "@testing-library/react";
export { customRender as render };
```

---

### MSW — mock service worker

**MSW** — мок API на уровне сети. Перехватывает fetch/axios запросы, возвращает заданные ответы. Не требует менять код.

```tsx
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  http.get("/api/users", () => HttpResponse.json([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ])),
  
  http.post("/api/users", async ({ request }) => {
    const body = await request.json() as { name: string };
    return HttpResponse.json({ id: 3, ...body }, { status: 201 });
  }),
  
  http.delete("/api/users/:id", ({ params }) => {
    return HttpResponse.json({ id: params.id });
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

### Пример: список + добавление

```tsx
test("пользователь добавляет нового пользователя", async () => {
  const user = userEvent.setup();
  render(<UserManagement />);
  
  // 1. Загрузка начального списка
  expect(await screen.findByText("Alice")).toBeInTheDocument();
  expect(screen.getByText("Bob")).toBeInTheDocument();
  
  // 2. Открытие формы
  await user.click(screen.getByRole("button", { name: /добавить/i }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  
  // 3. Заполнение
  await user.type(screen.getByLabelText(/имя/i), "Charlie");
  await user.type(screen.getByLabelText(/email/i), "charlie@test.com");
  await user.click(screen.getByRole("button", { name: /сохранить/i }));
  
  // 4. Проверка появления в списке
  expect(await screen.findByText("Charlie")).toBeInTheDocument();
  expect(screen.getByText("charlie@test.com")).toBeInTheDocument();
  
  // 5. Модалка закрылась
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
```

---

### Тестирование ошибок

```tsx
test("показывает ошибку при неудачном запросе", async () => {
  // Override handler для этого теста
  server.use(
    http.get("/api/users", () => 
      new HttpResponse(null, { status: 500 })
    )
  );
  
  render(<UserList />);
  
  expect(await screen.findByRole("alert")).toHaveTextContent(/ошибка/i);
  expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
});

test("retry после ошибки", async () => {
  let attempts = 0;
  server.use(
    http.get("/api/users", () => {
      attempts++;
      if (attempts === 1) return new HttpResponse(null, { status: 500 });
      return HttpResponse.json([{ id: 1, name: "Alice" }]);
    })
  );
  
  const user = userEvent.setup();
  render(<UserList />);
  
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  
  await user.click(screen.getByRole("button", { name: /retry/i }));
  
  expect(await screen.findByText("Alice")).toBeInTheDocument();
});
```

---

### Auth flow

```tsx
test("логин → редирект на dashboard", async () => {
  const user = userEvent.setup();
  
  server.use(
    http.post("/api/login", async ({ request }) => {
      const { email, password } = await request.json() as any;
      if (email === "test@test.com" && password === "secret") {
        return HttpResponse.json({ token: "fake-jwt", user: { name: "Test" } });
      }
      return new HttpResponse(null, { status: 401 });
    })
  );
  
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
  
  await user.type(screen.getByLabelText(/email/i), "test@test.com");
  await user.type(screen.getByLabelText(/пароль/i), "secret");
  await user.click(screen.getByRole("button", { name: /войти/i }));
  
  // После логина должен быть редирект на /dashboard
  expect(await screen.findByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
});
```

---

### CRUD флоу

```tsx
test("полный CRUD сценарий", async () => {
  const user = userEvent.setup();
  render(<TodoApp />);
  
  // Create
  await user.type(screen.getByLabelText(/новая задача/i), "Buy milk");
  await user.click(screen.getByRole("button", { name: /добавить/i }));
  expect(await screen.findByText("Buy milk")).toBeInTheDocument();
  
  // Read (already in list)
  
  // Update — edit
  const item = screen.getByText("Buy milk").closest("li")!;
  await user.click(within(item).getByRole("button", { name: /edit/i }));
  await user.clear(screen.getByLabelText(/задача/i));
  await user.type(screen.getByLabelText(/задача/i), "Buy almond milk");
  await user.click(screen.getByRole("button", { name: /сохранить/i }));
  expect(await screen.findByText("Buy almond milk")).toBeInTheDocument();
  
  // Delete
  await user.click(within(screen.getByText("Buy almond milk").closest("li")!).getByRole("button", { name: /delete/i }));
  expect(screen.queryByText("Buy almond milk")).not.toBeInTheDocument();
});
```

---

### Корзина с пересчётом

```tsx
test("корзина — добавление, изменение, оформление", async () => {
  const user = userEvent.setup();
  render(<Shop />);
  
  // Добавить 2 разных товара
  const products = await screen.findAllByRole("article");
  await user.click(within(products[0]).getByRole("button", { name: /купить/i }));
  await user.click(within(products[1]).getByRole("button", { name: /купить/i }));
  
  // Открыть корзину
  await user.click(screen.getByRole("button", { name: /корзина \(2\)/i }));
  
  // Изменить количество
  const cartItems = screen.getAllByRole("listitem", { name: /товар/i });
  const incBtn = within(cartItems[0]).getByRole("button", { name: /\+/ });
  await user.click(incBtn);
  await user.click(incBtn);
  
  // Проверить total (1*200 + 3*100 = 500)
  expect(screen.getByText(/500/)).toBeInTheDocument();
  
  // Оформление
  await user.click(screen.getByRole("button", { name: /оформить/i }));
  await user.type(screen.getByLabelText(/имя/i), "Test User");
  await user.type(screen.getByLabelText(/адрес/i), "Test Street 1");
  await user.click(screen.getByRole("button", { name: /заказать/i }));
  
  expect(await screen.findByText(/заказ #\d+ оформлен/i)).toBeInTheDocument();
});
```

---

### Wizard форма

```tsx
test("wizard — 3 шага", async () => {
  const user = userEvent.setup();
  render(<RegistrationWizard />);
  
  // Шаг 1
  expect(screen.getByRole("heading", { name: /шаг 1/i })).toBeInTheDocument();
  await user.type(screen.getByLabelText(/имя/i), "John");
  await user.click(screen.getByRole("button", { name: /далее/i }));
  
  // Шаг 2
  expect(await screen.findByRole("heading", { name: /шаг 2/i })).toBeInTheDocument();
  await user.type(screen.getByLabelText(/город/i), "Moscow");
  await user.click(screen.getByRole("button", { name: /далее/i }));
  
  // Шаг 3 — submit
  expect(await screen.findByRole("heading", { name: /шаг 3/i })).toBeInTheDocument();
  await user.click(screen.getByRole("checkbox", { name: /accept/i }));
  await user.click(screen.getByRole("button", { name: /завершить/i }));
  
  expect(await screen.findByText(/спасибо/i)).toBeInTheDocument();
});
```

---

### Поиск с дебаунсом

```tsx
test("поиск с дебаунсом", async () => {
  jest.useFakeTimers();
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  
  render(<SearchPage />);
  
  await user.type(screen.getByRole("searchbox"), "alic");
  
  // До дебаунса — fetch не вызывался
  expect(fetchSpy).not.toHaveBeenCalled();
  
  act(() => { jest.advanceTimersByTime(500); });
  
  // После дебаунса
  expect(await screen.findByText("Alice")).toBeInTheDocument();
  
  jest.useRealTimers();
});
```

---

### Оптимистичные обновления

```tsx
test("optimistic update", async () => {
  const user = userEvent.setup();
  
  // Медленный API
  server.use(
    http.post("/api/like/:id", async () => {
      await new Promise(r => setTimeout(r, 1000));
      return HttpResponse.json({ liked: true });
    })
  );
  
  render(<Post />);
  
  const likeBtn = screen.getByRole("button", { name: /like/i });
  expect(likeBtn).toHaveTextContent("0");
  
  await user.click(likeBtn);
  
  // Сразу — оптимистично 1, не ждём API
  expect(likeBtn).toHaveTextContent("1");
});

test("rollback при ошибке", async () => {
  const user = userEvent.setup();
  server.use(http.post("/api/like/:id", () => new HttpResponse(null, { status: 500 })));
  
  render(<Post />);
  await user.click(screen.getByRole("button", { name: /like/i }));
  
  expect(screen.getByText("1")).toBeInTheDocument();
  
  // После ошибки — rollback
  await waitFor(() => expect(screen.getByText("0")).toBeInTheDocument());
});
```

---

### Тестирование с роутингом

```tsx
function renderWithRouter(ui: ReactElement, { route = "/" } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
}

test("навигация работает", async () => {
  const user = userEvent.setup();
  renderWithRouter(<App />);
  
  await user.click(screen.getByRole("link", { name: /about/i }));
  expect(await screen.findByRole("heading", { name: /about us/i })).toBeInTheDocument();
});
```

---

### MSW handlers — модульность

```ts
// handlers/users.ts
export const usersHandlers = [
  http.get("/api/users", () => ...),
  http.post("/api/users", () => ...),
];

// handlers/auth.ts
export const authHandlers = [
  http.post("/api/login", () => ...),
];

// test/server.ts
import { setupServer } from "msw/node";
import { usersHandlers } from "../handlers/users";
import { authHandlers } from "../handlers/auth";

export const server = setupServer(...usersHandlers, ...authHandlers);
```

---

### Полный setup интеграционных тестов

```ts
// vitest.config.ts (или jest.config.ts)
{
  test: {
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    environment: "jsdom",
  },
}

// src/test/setup.ts
import "@testing-library/jest-dom";
import { server } from "./msw-server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

### onUnhandledRequest

```ts
server.listen({ onUnhandledRequest: "error" });
// Если в тесте сделан запрос на неизвестный URL — тест упадёт
// Хорошая практика: ловит забытые моки
```

---

## ⚠️ Подводные камни

### 1. Слишком unit-style тесты

```tsx
// ❌ Тестируешь implementation
expect(component.state.count).toBe(1);
expect(spy).toHaveBeenCalledWith({ type: "INCREMENT" });

// ✅ Тестируешь поведение
expect(screen.getByText("1")).toBeInTheDocument();
```

### 2. Mock всего — теряешь смысл integration

```tsx
// ❌ Замокал все компоненты — это unit
jest.mock("./UserList", () => () => <div>UserList</div>);
jest.mock("./UserForm", () => () => <div>UserForm</div>);

render(<UserManagement />);
// Тест ничего не проверяет

// ✅ Mock только сторонние API (через MSW)
```

### 3. Reset MSW handlers

```tsx
// ❌ Между тестами handler-ы остаются
test("a", () => { server.use(http.get(...)); });
test("b", () => { /* handler из теста a влияет */ });

// ✅
afterEach(() => server.resetHandlers());
```

### 4. Не дожидаешься async

```tsx
// ❌
render(<Page />);
expect(screen.getByText("Loaded")).toBeInTheDocument();  // ещё не загрузилось

// ✅ findBy
expect(await screen.findByText("Loaded")).toBeInTheDocument();
```

### 5. Fake timers + userEvent

```tsx
// ❌ user.type не работает с fake timers по дефолту
jest.useFakeTimers();
const user = userEvent.setup();
await user.type(input, "abc");  // зависает

// ✅ advanceTimers опция
const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
```

### 6. Глобальный QueryClient между тестами

```tsx
// ❌ Кэш React Query сохраняется
const queryClient = new QueryClient();
function wrapper() { return <QueryClientProvider client={queryClient}>...</QueryClientProvider>; }

// ✅ Создавай новый клиент для каждого теста
beforeEach(() => { queryClient = new QueryClient(...); });
```

### 7. Слишком хрупкие тесты

```tsx
// ❌ Зависит от точного текста
expect(screen.getByText("Welcome to our amazing app, John!")).toBeInTheDocument();

// ✅ Гибче
expect(screen.getByText(/welcome.*john/i)).toBeInTheDocument();
```

### 8. Race conditions в тестах

```tsx
// ❌ Тест зависит от порядка событий
fireEvent.click(btn1);
fireEvent.click(btn2);
expect(...).toBe(...);

// ✅ userEvent последовательный
await user.click(btn1);
await user.click(btn2);
```

### 9. Не очищаешь localStorage / sessionStorage

```tsx
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
```

### 10. Слишком большие тесты

```tsx
// ❌ Один тест на 100 строк — сложно дебажить
test("everything", async () => { ... 100 строк ... });

// ✅ Разделяй на сценарии
test("логин", ...);
test("просмотр списка", ...);
test("добавление", ...);
```

---

## 🔬 Тонкие моменты

**MSW работает через service worker (browser) или http interceptor (node)**

В тестах — Node. В реальном браузере (для разработки) — service worker.

**Реальный fetch в integration тестах — антипаттерн**

Реальные запросы делают тесты:
- Медленными.
- Flaky (нестабильными).
- Зависимыми от состояния backend.

Используй MSW.

**E2E vs Integration**

| Integration | E2E (Playwright/Cypress) |
|---|---|
| Mock API через MSW | Real API |
| jsdom (нет реального браузера) | Real browser |
| Быстро (секунды) | Медленно (минуты) |
| Тестируешь компоненты + UI flow | Тестируешь систему end-to-end |

Integration — для большинства флоу. E2E — для критических user journeys.

**Storybook tests**

Storybook 7+ имеет `play()` функции — мини integration tests внутри stories. Можно даже запускать через test-runner.

**Snapshot serializer для better diff**

```ts
// snapshot-serializer
{
  serializer: ["@emotion/jest/serializer"],
}
```

Для CSS-in-JS — снапшот покажет понятный CSS.

**Performance — параллельные тесты**

```ts
// vitest.config.ts
{ test: { pool: "threads", poolOptions: { threads: { singleThread: false } } } }
// или: forks (более стабильно)
```

**Test data builders**

```ts
function buildUser(overrides?: Partial<User>): User {
  return {
    id: 1,
    name: "Default",
    email: "default@test.com",
    ...overrides,
  };
}

// В тесте
const user = buildUser({ name: "Alice" });
```

**Cypress component tests**

Альтернатива RTL: тесты в реальном браузере с DOM, но изолированные компоненты:

```ts
cy.mount(<Button />);
cy.get("button").click();
```

Больше похоже на E2E, но быстрее.

---

## 🧩 Задачи для закрепления

**Задача 1 — TODO list integration**
Тестируй полный CRUD: добавление, редактирование, удаление, toggle complete. Используй MSW.

**Задача 2 — Auth flow**
Логин → защищённая страница → logout. Тестируй редиректы, сохранение токена, отображение профиля.

**Задача 3 — Корзина с пересчётом**
Добавление товаров, изменение количества, удаление. Проверь правильный пересчёт total.

**Задача 4 — Search + filters**
Поисковая страница с дебаунсом + фильтрами (категория, цена). Тестируй комбинации.

**Задача 5 — Wizard 4 шага**
Регистрация в 4 шага. Тестируй: переход вперёд/назад, сохранение данных, валидацию каждого шага.

**Задача 6 — Pagination + sorting**
Таблица с pagination и sorting. Тестируй смену страниц, сортировку, комбинацию.

**Задача 7 — Optimistic update**
Like-кнопка с оптимистичным обновлением. Тестируй сразу UI + rollback при ошибке.

**Задача 8 — Drag and drop list**
Перестановка элементов в списке через drag&drop. Тестируй с fireEvent.dragStart/drop.

**Задача 9 — Form validation flow**
Большая форма с RHF + Zod. Тестируй: валидация на blur, submit с ошибками, успешный submit, server errors.

**Задача 10 — Multi-route navigation**
App с роутингом. Тестируй: клик по ссылке → URL меняется → правильный компонент рендерится.
