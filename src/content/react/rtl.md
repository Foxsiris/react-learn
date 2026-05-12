## 📝 Теория

### Философия RTL

**React Testing Library (RTL)** — библиотека для тестирования React-компонентов с **точки зрения пользователя**. Главный принцип:

> The more your tests resemble the way your software is used, the more confidence they can give you.
> 
> — Kent C. Dodds

**Что НЕ тестируем:**
- ❌ Implementation details (state, props, методы класса).
- ❌ Имена переменных, структуру кода.
- ❌ Что ре-рендерилось.

**Что тестируем:**
- ✅ Поведение в DOM (что видит и делает пользователь).
- ✅ Доступность (через ARIA roles).
- ✅ Side effects (API calls, navigation, callbacks).

---

### Сравнение с Enzyme (legacy)

| | Enzyme | RTL |
|---|---|---|
| Поход | Implementation-detail (state, props) | Behavior-driven (DOM) |
| Shallow rendering | Да (shallow()) | Нет (всегда mount) |
| Find by class/ID | По селекторам | По roles, text |
| Maintenance | Заброшен (нет React 18) | Активно поддерживается |

В 2024+ — RTL стандарт. Enzyme — legacy.

---

### render и screen

```tsx
import { render, screen } from "@testing-library/react";

test("renders heading", () => {
  render(<MyComponent />);
  
  // Через screen — глобальный доступ к queries
  const heading = screen.getByRole("heading");
  expect(heading).toBeInTheDocument();
});
```

**screen** — глобальная "точка зрения" на текущий рендер. Альтернатива — `const { getByRole } = render(...)`, но screen рекомендуется.

---

### Queries — приоритет

RTL рекомендует следующий порядок (от лучшего к худшему):

**1. Доступные для всех:**

```tsx
screen.getByRole("button", { name: /submit/i });
screen.getByLabelText(/email/i);
screen.getByPlaceholderText(/enter email/i);
screen.getByText(/welcome/i);
screen.getByDisplayValue("current value");  // для input/select/textarea
```

**2. Семантика для скринридеров:**

```tsx
screen.getByAltText(/logo/i);   // img
screen.getByTitle(/tooltip/i);   // title attribute
```

**3. Test IDs (последний резерв):**

```tsx
screen.getByTestId("custom-element");
// data-testid="custom-element"
```

---

### Варианты queries

| Тип | Возвращает 0 | 1 | >1 | Async |
|---|---|---|---|---|
| `getBy*` | throw | element | throw | нет |
| `queryBy*` | null | element | throw | нет |
| `findBy*` | throw (timeout) | Promise<element> | throw | да |
| `getAllBy*` | throw | array | array | нет |
| `queryAllBy*` | [] | array | array | нет |
| `findAllBy*` | throw | Promise<array> | Promise<array> | да |

Использование:

```tsx
// Что-то ДОЛЖНО быть
const btn = screen.getByRole("button");

// Что-то МОЖЕТ не быть
const error = screen.queryByText(/error/i);
expect(error).not.toBeInTheDocument();

// Появится async (после fetch, animation)
const result = await screen.findByText(/loaded/i);
```

---

### getByRole — детально

ARIA roles: button, textbox, checkbox, radio, link, heading, list, listitem, dialog, alert, status, navigation, banner, main, ...

```tsx
screen.getByRole("button");
screen.getByRole("button", { name: /submit/i });  // accessible name
screen.getByRole("textbox", { name: /email/i });   // input с label "email"
screen.getByRole("heading", { level: 2 });          // h2
screen.getByRole("listitem");
screen.getByRole("link", { name: /home/i });

// ВАЖНО: input type="text" → role="textbox"
//        input type="checkbox" → role="checkbox"
//        input type="submit" → role="button"
//        a с href → role="link"
//        button → role="button"
```

---

### within

Для поиска внутри элемента:

```tsx
import { render, screen, within } from "@testing-library/react";

const list = screen.getByRole("list");
const items = within(list).getAllByRole("listitem");
expect(items).toHaveLength(3);

// Полезно когда на странице несколько похожих элементов
```

---

### userEvent — взаимодействие

**Важно: userEvent**, не fireEvent. UserEvent симулирует реальное поведение пользователя.

```tsx
import userEvent from "@testing-library/user-event";

test("typing", async () => {
  const user = userEvent.setup();  // создаём instance
  
  render(<input />);
  const input = screen.getByRole("textbox");
  
  await user.type(input, "Hello");
  expect(input).toHaveValue("Hello");
});
```

**Все методы async** в v14+!

---

### userEvent методы

```tsx
const user = userEvent.setup();

// Клик
await user.click(element);
await user.dblClick(element);
await user.tripleClick(element);

// Ввод
await user.type(input, "Hello");
await user.type(input, "{Enter}");           // спецклавиши
await user.type(input, "{Backspace}");
await user.type(input, "{ArrowLeft}{ArrowLeft}X");
await user.clear(input);                      // очистить input

// Клавиатура (без фокуса на конкретный элемент)
await user.keyboard("{Tab}");
await user.keyboard("{Shift>}{Tab}{/Shift}"); // shift+tab

// Hover
await user.hover(element);
await user.unhover(element);

// Tab navigation
await user.tab();
await user.tab({ shift: true });

// Select
await user.selectOptions(select, "value1");
await user.selectOptions(select, ["value1", "value2"]);  // multiple

// Files
await user.upload(input, file);

// Copy/paste/cut
await user.copy();
await user.paste("text");
await user.cut();
```

---

### fireEvent — низкий уровень

```tsx
import { fireEvent } from "@testing-library/react";

fireEvent.click(button);
fireEvent.change(input, { target: { value: "text" } });
fireEvent.submit(form);
fireEvent.scroll(window, { target: { scrollY: 100 } });

// Использовать только когда userEvent не подходит
// (например, scroll на window, custom events)
```

---

### Пример теста кнопки

```tsx
test("кнопка вызывает onClick", async () => {
  const user = userEvent.setup();
  const handleClick = jest.fn();
  
  render(<Button onClick={handleClick}>Нажми меня</Button>);
  
  await user.click(screen.getByRole("button", { name: /нажми меня/i }));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

---

### Пример теста формы

```tsx
test("отправка формы с валидацией", async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();
  
  render(<LoginForm onSubmit={onSubmit} />);
  
  // Submit без заполнения — ошибка
  await user.click(screen.getByRole("button", { name: /войти/i }));
  expect(screen.getByText(/email обязателен/i)).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
  
  // Заполнение
  await user.type(screen.getByLabelText(/email/i), "test@test.com");
  await user.type(screen.getByLabelText(/пароль/i), "secret123");
  await user.click(screen.getByRole("button", { name: /войти/i }));
  
  expect(onSubmit).toHaveBeenCalledWith({
    email: "test@test.com",
    password: "secret123",
  });
});
```

---

### Async — waitFor, findBy

```tsx
test("загрузка данных", async () => {
  render(<UserList />);
  
  // Loader виден сразу
  expect(screen.getByRole("progressbar")).toBeInTheDocument();
  
  // Ждём появления данных
  const items = await screen.findAllByRole("listitem");
  expect(items).toHaveLength(3);
  
  // Loader пропал
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
});

// waitFor — для assertion, который должен пройти
await waitFor(() => {
  expect(screen.getByText(/done/i)).toBeInTheDocument();
});

// waitFor с timeout
await waitFor(
  () => expect(...).toBeInTheDocument(),
  { timeout: 3000 }
);

// waitForElementToBeRemoved
await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
```

`findBy` = `waitFor + getBy`. Удобный сахар.

---

### Render с Providers

```tsx
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

function renderWithProviders(ui: ReactElement, options = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>,
    options
  );
}

// Использование
renderWithProviders(<MyComponent />);
```

---

### Debug

```tsx
test("debug", () => {
  render(<MyComponent />);
  
  screen.debug();                   // выводит весь DOM
  screen.debug(screen.getByRole("button"));  // конкретный элемент
  
  // logRoles — какие roles доступны
  logRoles(container);
});
```

---

### testing-playground

Если не знаешь, какой query использовать — установи [Testing Playground extension](https://testing-playground.com) для Chrome. Кликаешь на элемент — оно подсказывает оптимальный query.

```tsx
screen.logTestingPlaygroundURL();
// генерирует ссылку на playground с твоим DOM
```

---

### Custom matchers (jest-dom)

```tsx
import "@testing-library/jest-dom";

expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toBeEmptyDOMElement();
expect(element).toBeDisabled();
expect(element).toBeEnabled();
expect(element).toBeChecked();
expect(element).toBeRequired();
expect(element).toBeInvalid();
expect(element).toBeValid();

expect(element).toHaveClass("active", "primary");
expect(element).toHaveAttribute("href", "/home");
expect(element).toHaveTextContent(/welcome/i);
expect(element).toHaveStyle({ color: "red" });
expect(element).toHaveValue("text");
expect(element).toHaveDisplayValue("text");
expect(element).toHaveFocus();
expect(form).toHaveFormValues({ email: "test@test.com" });
```

---

### Mocking modules для теста

```tsx
// Mock react-router useNavigate
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  json: async () => [{ id: 1, name: "Test" }],
});
```

---

### Тест с context provider

```tsx
const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider theme={lightTheme}>
    <AuthProvider value={{ user: { name: "Test" } }}>
      {children}
    </AuthProvider>
  </ThemeProvider>
);

render(<Component />, { wrapper });
```

---

### setup в одном месте

```ts
// test-utils.tsx
function customRender(ui, options) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from "@testing-library/react";
export { customRender as render };
```

```tsx
// в тестах
import { render, screen } from "../test-utils";
```

---

## ⚠️ Подводные камни

### 1. getBy vs queryBy

```tsx
// ❌ getBy throws — не для проверки отсутствия
expect(screen.getByText("Error")).not.toBeInTheDocument();
// throws перед expect — тест падает

// ✅ queryBy для отсутствия
expect(screen.queryByText("Error")).not.toBeInTheDocument();
```

### 2. fireEvent vs userEvent

```tsx
// ❌ fireEvent.change не имитирует все события клавиатуры
fireEvent.change(input, { target: { value: "Hello" } });
// Не вызывает focus, blur, key events

// ✅ userEvent.type — реальная имитация
await user.type(input, "Hello");
```

### 3. Забытый await

```tsx
// ❌ userEvent v14+ — все async
user.click(button);  // не awaited → может быть race condition

// ✅
await user.click(button);
```

### 4. getByRole без accessible name

```tsx
// На странице 3 кнопки — getByRole("button") выбросит "multiple elements"
screen.getByRole("button");  // throws

// ✅ Указывай name
screen.getByRole("button", { name: /submit/i });
```

### 5. Регистр в text queries

```tsx
screen.getByText("Hello");   // exact match
screen.getByText(/hello/i);  // case-insensitive regex (recommended)
```

### 6. text внутри nested elements

```tsx
<div>Hello <span>World</span></div>

// ❌
screen.getByText("Hello World");  // не находит — text разбит

// ✅
screen.getByText("Hello World", { exact: false });
// или
screen.getByText((content, element) => element?.textContent === "Hello World");
```

### 7. screen vs container

```tsx
// ❌ container — старый подход
const { container } = render(<MyComp />);
container.querySelector("button");  // не семантично

// ✅ screen — рекомендуется
screen.getByRole("button");
```

### 8. cleanup не запускается

```tsx
// RTL автоматически вызывает cleanup() после каждого теста
// Но если что-то идёт не так — состояние "протекает" между тестами
// Решение: import "@testing-library/react/cleanup-after-each";
// (обычно автоматически через jest setup)
```

### 9. act() warnings

```tsx
// "Warning: An update to X inside a test was not wrapped in act(...)"
// Обычно потому что async обновление не дождались

// ✅ findBy / waitFor — автоматически оборачивают в act
await screen.findByText(...);

// ❌ Нужно вручную
act(() => { result.current.update(); });  // только если используешь renderHook
```

### 10. JSDOM не поддерживает всё

JSDOM не имеет:
- IntersectionObserver (нужен mock).
- ResizeObserver (mock).
- matchMedia (mock).
- requestAnimationFrame (есть, но не как браузер).

Mock в setup:

```ts
global.IntersectionObserver = class { ... };

window.matchMedia = jest.fn().mockReturnValue({
  matches: false,
  addListener: jest.fn(),
  removeListener: jest.fn(),
});
```

---

## 🔬 Тонкие моменты

**rerender для проверки props change**

```tsx
const { rerender } = render(<Counter count={1} />);
expect(screen.getByText("1")).toBeInTheDocument();

rerender(<Counter count={2} />);
expect(screen.getByText("2")).toBeInTheDocument();
```

**unmount для cleanup**

```tsx
const { unmount } = render(<MyComp />);
unmount();
// useEffect cleanup запустится
```

**Контекстный menu, drag-drop**

userEvent.pointer для сложных взаимодействий:

```tsx
await user.pointer({ keys: "[MouseRight]", target: element });
```

**Skip waitFor для синхронных операций**

```tsx
// ❌
await waitFor(() => expect(synchronousAssertion()).toBeTruthy());

// ✅
expect(synchronousAssertion()).toBeTruthy();
// waitFor только для truly async
```

**setupListeners**

```tsx
const user = userEvent.setup({ delay: null });
// delay: null — без задержек между событиями (быстрее тесты)
// delay: 100  — реалистично, но медленно
```

**Тестирование роутинга**

```tsx
import { MemoryRouter, Routes, Route } from "react-router-dom";

render(
  <MemoryRouter initialEntries={["/users/1"]}>
    <Routes>
      <Route path="/users/:id" element={<User />} />
    </Routes>
  </MemoryRouter>
);
```

**a11y тестирование**

```tsx
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

test("no a11y violations", async () => {
  const { container } = render(<MyComp />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**Snapshot осторожно**

Snapshot тесты быстро становятся "rubber stamp" — их обновляют без чтения. Используй для:
- Стабильных дизайн-системных компонентов.
- Конфигов / выходов утилит.

Не используй для часто меняющихся компонентов.

**testIdAttribute**

```ts
// configure
import { configure } from "@testing-library/react";
configure({ testIdAttribute: "data-cy" });
// теперь screen.getByTestId использует data-cy вместо data-testid
```

---

## 🧩 Задачи для закрепления

**Задача 1 — Кнопка с onClick**
Тестируй Button: рендерится, на клик вызывает onClick, disabled не вызывает.

**Задача 2 — Форма логина**
Тестируй LoginForm: валидация (пустые поля → ошибки), успешный submit с правильными данными.

**Задача 3 — Search input**
Тестируй компонент поиска: ввод → debounce → показ результатов из API (mock fetch).

**Задача 4 — Modal**
Тестируй Modal: открытие/закрытие по кнопке, закрытие по Escape, закрытие по клику на backdrop.

**Задача 5 — Tabs**
Тестируй Tabs: переключение между табами, keyboard navigation (Arrow keys), активный таб.

**Задача 6 — Loading states**
Компонент UserList с состояниями loading/error/success. Тестируй каждое (с mock API).

**Задача 7 — Pagination**
Тестируй Pagination: клик на страницу меняет данные, prev/next работают, disabled на крайних страницах.

**Задача 8 — Accordion (with within)**
Тестируй Accordion с несколькими секциями. Используй within для поиска внутри секции.

**Задача 9 — Form с RHF + Zod**
Тестируй форму на React Hook Form + Zod. Проверь все случаи валидации.

**Задача 10 — a11y test**
Установи jest-axe. Тестируй компонент на a11y violations. Исправь найденные проблемы.
