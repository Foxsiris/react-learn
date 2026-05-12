## 📝 Теория

### Что такое Jest

**Jest** — тест-раннер + assertion library + mocking framework + coverage tool в одном пакете. Создан Facebook, был стандартом для React тестов 2015–2022. Сейчас часто заменяется на **Vitest** (особенно в Vite-проектах).

**Что включает:**

- 🏃 **Test runner** — запускает тесты, параллелит файлы.
- ✅ **Assertions** — `expect`, matchers (toBe, toEqual, ...).
- 🎭 **Mocking** — mock функций, модулей, таймеров.
- 📊 **Coverage** — встроенный репорт покрытия.
- 📸 **Snapshot testing**.

---

### Базовая структура

```tsx
describe("formatPrice", () => {
  beforeEach(() => {
    // запускается перед каждым it
  });
  
  afterEach(() => {
    // после каждого it
  });
  
  it("форматирует целое число", () => {
    expect(formatPrice(1000)).toBe("1 000 ₽");
  });
  
  it("форматирует дробное число", () => {
    expect(formatPrice(99.99)).toBe("99.99 ₽");
  });
  
  describe("edge cases", () => {
    it("возвращает 0 ₽ для нуля", () => {
      expect(formatPrice(0)).toBe("0 ₽");
    });
  });
});
```

`it` и `test` — синонимы. `describe` группирует тесты.

---

### Matchers

```tsx
// Equality
expect(value).toBe(42);                 // строгое равенство (===)
expect(obj).toEqual({ a: 1 });          // глубокое равенство
expect(obj).toStrictEqual({ a: 1 });    // как toEqual + проверка undefined ключей
expect(obj).toMatchObject({ a: 1 });    // частичное совпадение

// Truthiness
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNaN();

// Numbers
expect(num).toBeGreaterThan(3);
expect(num).toBeGreaterThanOrEqual(3);
expect(num).toBeLessThan(10);
expect(num).toBeCloseTo(0.3);  // для float

// Strings
expect(str).toMatch(/pattern/);
expect(str).toMatch("substring");

// Arrays / Iterables
expect(arr).toContain("item");
expect(arr).toContainEqual({ id: 1 });   // глубокое равенство для items
expect(arr).toHaveLength(3);

// Objects
expect(obj).toHaveProperty("nested.path");
expect(obj).toHaveProperty("a", 1);

// Functions
expect(fn).toThrow();
expect(fn).toThrow("error message");
expect(fn).toThrow(/regex/);
expect(fn).toThrow(CustomError);

// Mock functions
expect(spy).toHaveBeenCalled();
expect(spy).toHaveBeenCalledTimes(3);
expect(spy).toHaveBeenCalledWith(arg1, arg2);
expect(spy).toHaveBeenLastCalledWith(...);
expect(spy).toHaveBeenNthCalledWith(2, ...);
expect(spy).toHaveReturnedWith(value);

// Negation
expect(value).not.toBe(42);

// Async
await expect(promise).resolves.toBe(42);
await expect(promise).rejects.toThrow("error");
```

---

### Mock функции

```tsx
const mockFn = jest.fn();

mockFn.mockReturnValue(42);
mockFn.mockReturnValueOnce(1).mockReturnValueOnce(2);
mockFn.mockImplementation((x) => x * 2);
mockFn.mockResolvedValue({ data: [] });   // для async
mockFn.mockRejectedValue(new Error("oops"));

mockFn(1);  // 42 (для return) / 2 (для implementation)

// Inspect
mockFn.mock.calls;       // [[arg1, arg2], [arg1]]
mockFn.mock.results;     // [{ value: 42 }, ...]
mockFn.mock.instances;   // для new Mock()
mockFn.mock.lastCall;    // последние arguments

mockFn.mockClear();      // очистить calls/results
mockFn.mockReset();      // + удалить implementation
mockFn.mockRestore();    // если spy — восстановить original
```

---

### Mock модулей

```tsx
// Полный mock модуля
jest.mock("../api/users", () => ({
  getUsers: jest.fn().mockResolvedValue([{ id: 1, name: "Test" }]),
  createUser: jest.fn(),
}));

// Частичный mock
jest.mock("../api/users", () => ({
  ...jest.requireActual("../api/users"),
  getUsers: jest.fn().mockResolvedValue([]),  // только эту функцию
}));

// Mock с factory
jest.mock("axios", () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// __mocks__ директория — автоматический mock
// /api/__mocks__/users.ts — будет использоваться при jest.mock("../api/users")
```

---

### Spy на метод

```tsx
const spy = jest.spyOn(console, "error").mockImplementation(() => {});

doSomething();
expect(spy).toHaveBeenCalled();

spy.mockRestore();  // вернуть оригинальный console.error
```

`spyOn` отличается от `jest.fn()` тем, что **сохраняет оригинальный метод** и может его восстановить.

---

### Async тесты

```tsx
// async/await
it("загружает данные", async () => {
  const data = await fetchData();
  expect(data).toEqual({ ... });
});

// resolves / rejects
it("резолвится", async () => {
  await expect(fetchData()).resolves.toEqual({ ... });
});

it("реджектится", async () => {
  await expect(fetchData()).rejects.toThrow("error");
});

// Done callback (legacy)
it("колбэки", (done) => {
  setTimeout(() => {
    expect(true).toBe(true);
    done();
  }, 100);
});
```

---

### Fake timers

```tsx
jest.useFakeTimers();

it("debounce", () => {
  const cb = jest.fn();
  const debounced = debounce(cb, 500);
  
  debounced();
  expect(cb).not.toHaveBeenCalled();
  
  jest.advanceTimersByTime(500);
  expect(cb).toHaveBeenCalled();
});

afterAll(() => jest.useRealTimers());

// Утилиты
jest.runAllTimers();
jest.runOnlyPendingTimers();
jest.advanceTimersByTime(ms);
jest.runAllTicks();  // microtasks (Promise.then)
```

---

### Setup/teardown

```tsx
beforeAll(() => { /* до всех тестов */ });
afterAll(() => { /* после всех */ });
beforeEach(() => { /* перед каждым */ });
afterEach(() => { /* после каждого */ });

// Очистка моков
beforeEach(() => {
  jest.clearAllMocks();   // сбросить calls/results
  // jest.resetAllMocks();   // + сбросить implementations
  // jest.restoreAllMocks(); // восстановить spy
});
```

---

### Snapshot testing

```tsx
it("Card snapshot", () => {
  const { container } = render(<Card title="Hello" />);
  expect(container).toMatchSnapshot();
});

// Inline snapshot
it("inline", () => {
  expect(formatDate(date)).toMatchInlineSnapshot(`"2024-01-15"`);
});

// Обновление: jest --updateSnapshot или jest -u
```

⚠️ Snapshot тесты часто становятся "проклятием" — обновляются без чтения. Используй точечно, для стабильных компонентов.

---

### Coverage

```bash
jest --coverage
# создаёт coverage/ директорию с HTML репортом
```

```js
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
  coveragePathIgnorePatterns: ["/node_modules/", "/__tests__/"],
};
```

---

### Конфиг

```js
// jest.config.js
module.exports = {
  preset: "ts-jest",                    // или babel-jest
  testEnvironment: "jsdom",             // для React (DOM api)
  setupFilesAfterEach: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",     // alias
    "\\.(css|scss)$": "identity-obj-proxy",  // моки CSS
  },
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  testMatch: ["**/*.test.ts?(x)"],
};
```

```ts
// jest.setup.ts
import "@testing-library/jest-dom";  // расширения matchers (toBeInTheDocument, ...)
```

---

### Параметризованные тесты

```tsx
describe.each([
  [1, 1, 2],
  [1, 2, 3],
  [2, 2, 4],
])("add(%i, %i)", (a, b, expected) => {
  it(`= ${expected}`, () => {
    expect(add(a, b)).toBe(expected);
  });
});

// it.each с table
it.each`
  a    | b    | expected
  ${1} | ${1} | ${2}
  ${2} | ${2} | ${4}
`("$a + $b = $expected", ({ a, b, expected }) => {
  expect(add(a, b)).toBe(expected);
});
```

---

### Custom matchers

```tsx
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be within ${floor}-${ceiling}`
        : `expected ${received} to be within ${floor}-${ceiling}`,
    };
  },
});

// declare
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}

expect(50).toBeWithinRange(10, 100);
```

---

### testing-library extensions

```tsx
// jest-dom
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toBeDisabled();
expect(element).toBeChecked();
expect(element).toHaveClass("active");
expect(element).toHaveAttribute("href", "/");
expect(element).toHaveTextContent("Hello");
expect(input).toHaveValue("text");
expect(form).toHaveFormValues({ email: "..." });
```

---

## ⚠️ Подводные камни

### 1. toBe для объектов

```tsx
// ❌ Сравнение ссылок
expect({ a: 1 }).toBe({ a: 1 });  // FAIL

// ✅ Глубокое равенство
expect({ a: 1 }).toEqual({ a: 1 });  // PASS
```

### 2. Забытый await в async тесте

```tsx
// ❌ Тест проходит, даже если promise reject
it("test", () => {
  expect(asyncFn()).resolves.toBe(42);
});

// ✅
it("test", async () => {
  await expect(asyncFn()).resolves.toBe(42);
});

// или
it("test", () => {
  return expect(asyncFn()).resolves.toBe(42);
  //  ^ возвращаем promise — Jest подождёт
});
```

### 3. Auto-mock surprise

```tsx
// jest.mock("./module") без factory — авто-mock
// Все exports становятся jest.fn() возвращающими undefined
// Может ломать тесты, которые ожидают реальное поведение
```

### 4. ESM в Jest — морока

Jest изначально для CommonJS. ESM поддержка экспериментальная. Если используешь ESM-зависимости (например, `nanoid`, `swr`) — можно столкнуться с ошибкой импорта.

Решения:
- Vitest (нативный ESM).
- `transformIgnorePatterns` для трансформации node_modules.
- Mock модулей.

```js
transformIgnorePatterns: [
  "/node_modules/(?!(nanoid|other-esm-module))/",
],
```

### 5. console.log в моках

```tsx
const spy = jest.spyOn(console, "error");
expect(spy).toHaveBeenCalled();
// ❌ Если не mockImplementation — реальный console.error выведет в test output
spy.mockImplementation(() => {});
```

### 6. Globals и leaking state

```tsx
// ❌ Тесты влияют друг на друга
let counter = 0;
it("a", () => { counter++; expect(counter).toBe(1); });
it("b", () => { counter++; expect(counter).toBe(1); });  // FAIL — counter уже 2

// ✅
let counter: number;
beforeEach(() => { counter = 0; });
```

### 7. Mock не работает для already-imported

```tsx
// При import jest.mock должен быть hoisted
import { foo } from "./module";
jest.mock("./module");  // ✅ Jest поднимает mock наверх

// ❌ Динамический mock после import не работает
import { foo } from "./module";
foo();
jest.mock("./module");  // слишком поздно
```

### 8. Snapshot конфликты

Snapshot файл — `__snapshots__/x.test.ts.snap`. При работе нескольких людей — мерж конфликты.

Решения:
- Использовать осторожно.
- Inline snapshots для маленьких.
- Rendering library (для UI).

### 9. testEnvironment "node" vs "jsdom"

```js
testEnvironment: "node"   // нет DOM api → window, document undefined
testEnvironment: "jsdom"  // есть DOM api (для React тестов)
```

Для React всегда jsdom. Для backend/utility — node.

### 10. Performance: --runInBand vs параллель

```bash
jest                  # параллельно (default)
jest --runInBand      # все в одном процессе (медленнее, но проще debug)
jest --maxWorkers=4   # лимит воркеров
```

CI часто работает медленнее с параллельностью из-за overhead.

---

## 🔬 Тонкие моменты

**Jest vs Vitest performance**

Vitest использует Vite (esbuild) → тесты компилируются в 10-100x быстрее. Для маленьких проектов разницы нет, для больших — драматическая.

**toEqual игнорирует undefined**

```tsx
expect({ a: 1, b: undefined }).toEqual({ a: 1 });  // PASS
expect({ a: 1, b: undefined }).toStrictEqual({ a: 1 });  // FAIL
```

**toMatchObject — partial**

```tsx
expect({ a: 1, b: 2, c: 3 }).toMatchObject({ a: 1 });  // PASS
// Можно проверять часть, остальные поля игнорируются
```

**asymmetric matchers**

```tsx
expect(obj).toEqual({
  id: expect.any(Number),
  name: expect.stringMatching(/^John/),
  createdAt: expect.any(Date),
  metadata: expect.objectContaining({ source: "api" }),
});
```

**Mock module hoisting**

Jest поднимает `jest.mock()` calls к началу файла. Поэтому переменные в factory должны быть либо константами, либо лениво-доступными:

```tsx
// ❌
const mockData = [...];
jest.mock("./api", () => ({ getData: () => mockData }));  // mockData ещё undefined

// ✅
jest.mock("./api", () => ({ getData: () => [...] }));

// ✅ или
jest.mock("./api");
import { getData } from "./api";
(getData as jest.Mock).mockReturnValue([...]);
```

**Global setup/teardown**

```js
// jest.config.js
globalSetup: "./global-setup.ts",
globalTeardown: "./global-teardown.ts",
// Запускается раз перед/после всех тестов (для DB seed, etc.)
```

**TypeScript типы для mocks**

```tsx
import { getData } from "./api";
jest.mock("./api");

const mockedGetData = getData as jest.MockedFunction<typeof getData>;
mockedGetData.mockResolvedValue([...]);
```

**describe.skip, it.only, it.todo**

```tsx
describe.skip("not yet", () => { ... });
it.only("only this", () => { ... });
it.todo("write test for X");
```

**Test utilities**

```tsx
expect.assertions(3);  // ровно 3 expect должны выполниться (для async)
expect.hasAssertions();  // хотя бы один
```

**Configuration через package.json**

```json
{
  "jest": {
    "testEnvironment": "jsdom"
  }
}
```

---

## 🧩 Задачи для закрепления

**Задача 1 — Утилиты**
Напиши тесты для: formatDate, validateEmail, sortBy, debounce. Используй it.each для параметризации.

**Задача 2 — Mock fetch**
Замокай global.fetch. Тестируй функцию, которая делает запрос: success, error 500, network error.

**Задача 3 — Mock модуля**
Создай api/users.ts с функциями. В тесте замокай весь модуль через jest.mock.

**Задача 4 — Async с fake timers**
Реализуй retry функцию (3 попытки с задержкой). Используй jest.useFakeTimers и advanceTimersByTime.

**Задача 5 — Spy на console**
Тестируй функцию, которая логирует ошибки. Spy на console.error, проверь что вызвано с правильным сообщением.

**Задача 6 — Custom matcher**
Реализуй toBeValidEmail() matcher. Используй expect.extend. Добавь TypeScript declaration.

**Задача 7 — Snapshot React компонента**
Сделай snapshot тест Button компонента. Затем измени компонент — увидишь diff. Update snapshot.

**Задача 8 — Coverage threshold**
Настрой coverageThreshold в config. Запусти coverage. Дойди до 80%+ для своего модуля.

**Задача 9 — Module __mocks__**
Создай папку __mocks__/axios с автомоком. Используй в нескольких тестах.

**Задача 10 — Migration to Vitest**
Возьми проект на Jest, мигрируй на Vitest. Запиши, что пришлось менять (конфиг, syntax).
