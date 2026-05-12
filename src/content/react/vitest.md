## 📝 Теория

### Что такое Vitest

**Vitest** — современный тест-раннер от создателей Vite. Использует Vite (esbuild) для трансформации, что даёт **в 10-100x более быстрый** запуск тестов.

**Ключевые особенности:**

- ⚡ Скорость через Vite + esbuild.
- 🔥 HMR для тестов — изменил тест → мгновенно перезапустился.
- 📦 Нативный ESM (без CommonJS-боли).
- 🔄 Совместимость с Jest API (миграция почти бесплатная).
- 🛠️ Один конфиг с Vite — DRY.
- 📊 Встроенный coverage (через c8 или istanbul).
- 🌐 Браузерный режим (Vitest Browser Mode).
- 🎯 Native TypeScript без trans pile.

---

### Vitest vs Jest

| Критерий | Jest | Vitest |
|---|---|---|
| Скорость | ⚠️ Медленный | 🔥 Очень быстрый |
| HMR | ❌ | ✅ |
| ESM | ⚠️ Экспериментально | ✅ Натив |
| TypeScript | через ts-jest/babel | натив |
| Конфиг | jest.config.js (отдельно) | vite.config.ts (общий с Vite) |
| API | `jest.*` | `vi.*` (совместимый) |
| Snapshot | ✅ | ✅ |
| Coverage | ✅ | ✅ |
| Watch mode | ✅ | ✅ (быстрее) |
| UI | ❌ | ✅ (Vitest UI) |
| Browser mode | ❌ | ✅ (экспериментально) |
| Worker pool | ✅ | ✅ |

В 2024+ для Vite проектов — Vitest по умолчанию.

---

### Установка и базовый setup

```bash
npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,           // describe, it, expect — без импорта
    css: true,               // обрабатывать CSS imports
    coverage: {
      provider: "v8",        // или "istanbul"
      reporter: ["text", "html", "lcov"],
    },
  },
});
```

```ts
// src/test/setup.ts
import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => cleanup());
```

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",          // одноразовый прогон
    "test:ui": "vitest --ui",          // браузерная UI
    "coverage": "vitest run --coverage"
  }
}
```

---

### Базовый тест

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("formatPrice", () => {
  it("форматирует целое число", () => {
    expect(formatPrice(1000)).toBe("1 000 ₽");
  });
  
  it.each([
    [0, "0 ₽"],
    [99.99, "99.99 ₽"],
    [1000000, "1 000 000 ₽"],
  ])("formatPrice(%i) === %s", (input, expected) => {
    expect(formatPrice(input)).toBe(expected);
  });
});
```

С `globals: true` — `describe`, `it`, `expect` доступны без импорта.

---

### vi — аналог jest

Vitest API совместимо с Jest, но использует `vi` namespace:

```ts
// Jest → Vitest
jest.fn()         → vi.fn()
jest.mock()       → vi.mock()
jest.spyOn()      → vi.spyOn()
jest.useFakeTimers() → vi.useFakeTimers()
jest.advanceTimersByTime() → vi.advanceTimersByTime()
jest.clearAllMocks() → vi.clearAllMocks()

// Все matchers — те же
expect(...).toBe(...)
expect(...).toEqual(...)
```

---

### Mock функции

```ts
const mockFn = vi.fn();
mockFn.mockReturnValue(42);
mockFn.mockResolvedValue({ data: [] });
mockFn.mockImplementation((x) => x * 2);

// inspection
mockFn.mock.calls;
mockFn.mock.results;
mockFn.mock.lastCall;
```

---

### Mock модулей

```ts
vi.mock("../api/users", () => ({
  getUsers: vi.fn().mockResolvedValue([{ id: 1, name: "Test" }]),
}));

// Частичный
vi.mock("../api/users", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/users")>();
  return {
    ...actual,
    getUsers: vi.fn(),
  };
});

// Hoisting — vi.mock поднимается, как jest.mock
import { getUsers } from "../api/users";  // mocked
```

---

### vi.hoisted — для variables в mock factory

```ts
// Vi.mock factory не имеет доступа к outer scope
// Решение — vi.hoisted

const { mockData } = vi.hoisted(() => ({
  mockData: [{ id: 1, name: "Test" }],
}));

vi.mock("./api", () => ({
  getData: vi.fn(() => mockData),
}));
```

---

### Spy

```ts
const spy = vi.spyOn(console, "error").mockImplementation(() => {});
// ... тест ...
spy.mockRestore();
```

---

### Async тесты

```ts
it("async", async () => {
  const data = await fetchData();
  expect(data).toEqual({ ... });
});

await expect(fetchData()).resolves.toEqual({ ... });
await expect(fetchData()).rejects.toThrow("error");
```

---

### Fake timers

```ts
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it("debounce", () => {
  const cb = vi.fn();
  const debounced = debounce(cb, 500);
  
  debounced();
  vi.advanceTimersByTime(500);
  expect(cb).toHaveBeenCalled();
});
```

---

### Snapshot testing

```ts
it("snapshot", () => {
  const { container } = render(<MyComp />);
  expect(container).toMatchSnapshot();
});

it("inline", () => {
  expect(formatDate(date)).toMatchInlineSnapshot('"2024-01-15"');
});

// Update: vitest --update
```

---

### Coverage

```bash
vitest run --coverage
```

```ts
// vite.config.ts
test: {
  coverage: {
    provider: "v8",
    reporter: ["text", "html", "lcov", "json"],
    exclude: ["node_modules", "dist", "test"],
    thresholds: {
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
}
```

После запуска — `coverage/index.html` с визуальным отчётом.

---

### Vitest UI

```bash
vitest --ui
```

Открывается локальный сервер (port 51204) с интерактивным дашбордом:
- Список тестов и статусы.
- Логи и stack traces.
- Граф зависимостей.
- Coverage визуализация.
- HMR — изменения в тестах сразу видны.

---

### Параллельность

```ts
test: {
  pool: "threads",        // или "forks", "vmThreads"
  poolOptions: {
    threads: {
      singleThread: false,
      maxThreads: 4,
      minThreads: 1,
    },
  },
  isolate: true,          // изоляция между файлами (default)
  fileParallelism: true,  // параллельно файлы
}
```

`pool: "forks"` — более изолировано, но медленнее. `vmThreads` — экспериментально, ещё быстрее.

---

### Test patterns

```bash
vitest user           # тесты с "user" в имени
vitest src/components # тесты в директории
vitest --reporter=verbose
vitest --reporter=html  # html отчёт
vitest --bail=1         # стоп после 1 неудачи
```

---

### in-source testing

Можно писать тесты прямо в исходных файлах:

```ts
// utils.ts
export function add(a: number, b: number) {
  return a + b;
}

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;
  it("add", () => {
    expect(add(1, 2)).toBe(3);
  });
}
```

```ts
// vite.config.ts
test: {
  includeSource: ["src/**/*.{ts,tsx}"],
},
define: {
  "import.meta.vitest": "undefined",  // tree-shake в production
}
```

---

### Browser mode (экспериментально)

```bash
npm i -D @vitest/browser playwright
```

```ts
test: {
  browser: {
    enabled: true,
    provider: "playwright",
    name: "chromium",
    headless: true,
  },
}
```

Тесты выполняются в реальном браузере (через Playwright). Альтернатива jsdom.

---

### Concurrent tests

```ts
describe.concurrent("API tests", () => {
  it("a", async () => { ... });  // параллельно с другими в группе
  it("b", async () => { ... });
});

it.concurrent("alone", async () => { ... });
```

⚠️ Если тесты делят state — concurrent сломает.

---

### Workspace (monorepo)

```ts
// vitest.workspace.ts
export default [
  "packages/*/vite.config.ts",
];
```

Один запуск тестирует все пакеты.

---

### Migration с Jest

Большинство Jest-кода работает в Vitest без изменений. Что менять:

```ts
// 1. jest.* → vi.*
jest.fn()  →  vi.fn()
jest.mock(...)  →  vi.mock(...)

// 2. jest.config.js → vitest.config.ts
// (или test: {} в vite.config.ts)

// 3. setupFilesAfterEach → setupFiles

// 4. transform / babel — не нужен (esbuild)

// 5. moduleNameMapper → resolve.alias в vite.config

// 6. testEnvironment → environment
```

`vi-codemod` — автоматический скрипт миграции:

```bash
npx jest-to-vitest
```

---

### Performance benchmarks

```ts
import { bench, describe } from "vitest";

describe("sort", () => {
  bench("native", () => {
    [...arr].sort();
  });
  
  bench("custom", () => {
    customSort([...arr]);
  });
});
```

Запуск: `vitest bench`. Vitest сравнит производительность.

---

## ⚠️ Подводные камни

### 1. Globals = false требует import

```ts
// ❌ globals: false
describe("test", () => { ... });  // ReferenceError

// ✅
import { describe, it, expect } from "vitest";
```

### 2. CSS imports

```ts
// vite обрабатывает CSS, но в тестах может ломаться без css: true
test: { css: true }  // или css: { modules: true }
```

### 3. ESM-зависимости с CJS exports

```ts
// vite сам решает, но иногда нужно явно
test: {
  deps: {
    inline: ["some-cjs-package"],
  },
}
```

### 4. setupFiles не запускаются

```ts
// ❌ Файл вне include
test: { setupFiles: ["./setup.ts"], include: ["src/**/*.test.ts"] }
// setup.ts не в src — но всё равно должен запускаться

// ✅ Setup files запускаются всегда (path абсолютный или относительно конфига)
```

### 5. Hoisting vi.mock

```ts
// ❌
const data = [...];
vi.mock("./api", () => ({ get: () => data }));  // data ещё undefined

// ✅
vi.mock("./api", () => ({ get: () => [...] }));

// или vi.hoisted
const { data } = vi.hoisted(() => ({ data: [...] }));
vi.mock("./api", () => ({ get: () => data }));
```

### 6. Fake timers и async

```ts
// ❌ legacy fake timers с async
vi.useFakeTimers({ legacy: true });
await waitFor(...);  // зависает

// ✅ Modern (default)
vi.useFakeTimers();
```

### 7. JSDOM ограничения

```ts
// jsdom не имеет:
// - IntersectionObserver
// - ResizeObserver
// - matchMedia
// - HTMLCanvasElement context

// Mock в setup
import { vi } from "vitest";
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

### 8. Concurrent tests с shared state

```ts
let counter = 0;
describe.concurrent("test", () => {
  it.concurrent("a", () => { counter++; expect(counter).toBe(1); });
  it.concurrent("b", () => { counter++; expect(counter).toBe(1); });
});
// Race condition — counter может быть 1 или 2
```

### 9. Watch mode и watchExclude

```ts
test: {
  watchExclude: ["**/node_modules/**", "**/dist/**"],
}
// По умолчанию включено, но проверь, если watch постоянно ребутится
```

### 10. Type errors в тестах

```ts
// ❌ Vitest globals — нужны types
declare global {
  const describe: typeof import("vitest").describe;
  // ...
}

// ✅ В tsconfig.json
{ "compilerOptions": { "types": ["vitest/globals"] } }
```

---

## 🔬 Тонкие моменты

**Vitest НЕ заменяет Jest 1:1 для всех случаев**

- Snapshot форматы могут отличаться (хотя обычно совместимы).
- Некоторые matchers требуют дополнительной настройки.
- jest-dom работает идентично.

**Migration не всегда выгодна**

Если Jest работает, не страдает скорость, и нет блокеров — миграция = риск без явной пользы. Для новых Vite-проектов — однозначно Vitest.

**Esbuild vs Babel в тестах**

Esbuild не делает type checking, он только трансформирует. Если хочешь type check в тестах — отдельный шаг `tsc --noEmit`.

**Coverage providers**

- `v8` — нативный, быстрый.
- `istanbul` — точнее branches, медленнее.

Большинству — v8.

**Vitest UI без Vite dev server**

UI работает независимо от Vite dev server. Можно запускать рядом.

**Hot reload — изменил тест → мгновенно перезапуск**

В Jest watch mode — отрабатывает все тесты файла. В Vitest — только релевантные.

**Single file/test mode для дебага**

```bash
vitest --reporter=verbose src/components/Button.test.tsx
vitest -t "specific test name"
```

**Параметризация через it.each**

```ts
it.each([
  [1, 1, 2],
  [1, 2, 3],
])("add(%i, %i) = %i", (a, b, expected) => {
  expect(add(a, b)).toBe(expected);
});

// или объекты
it.each([
  { a: 1, b: 1, expected: 2 },
])("add($a, $b) = $expected", ({ a, b, expected }) => { ... });
```

**vi.stubEnv — для process.env**

```ts
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("API_URL", "http://test");
});

afterEach(() => vi.unstubAllEnvs());
```

**vi.stubGlobal**

```ts
vi.stubGlobal("fetch", vi.fn().mockResolvedValue(...));
afterEach(() => vi.unstubAllGlobals());
```

**Type-checking тестов**

```ts
test: { typecheck: { enabled: true } }
// Запускает tsc на тестах
```

**Reporters**

```bash
vitest --reporter=default    # CLI
vitest --reporter=verbose    # подробный
vitest --reporter=html       # HTML отчёт
vitest --reporter=junit      # для CI
vitest --reporter=json       # JSON для парсинга
```

---

## 🧩 Задачи для закрепления

**Задача 1 — Setup Vitest с нуля**
В новом Vite проекте установи Vitest, настрой setup, напиши первый тест на компонент.

**Задача 2 — Migration Jest → Vitest**
Возьми существующий Jest-проект (твой или example). Мигрируй на Vitest. Запиши, что пришлось менять, какие проблемы.

**Задача 3 — Coverage с порогом**
Настрой coverage с thresholds 80%. Дойди до 80%+ для модуля.

**Задача 4 — UI mode**
Запусти Vitest UI. Изучи интерфейс, попробуй HMR (изменения в тесте должны быть мгновенными).

**Задача 5 — Parallel vs sequential**
Сравни время выполнения с разными pools (threads vs forks vs vmThreads). Выбери оптимальный для проекта.

**Задача 6 — In-source testing**
Напиши тест прямо в utils.ts через `import.meta.vitest`. Проверь, что в production бандле он tree-shaken.

**Задача 7 — Browser mode**
Установи Vitest Browser Mode. Запусти один из тестов в реальном Chromium через Playwright.

**Задача 8 — Benchmark**
Сравни через bench две реализации одного алгоритма. Покажи разницу в performance.

**Задача 9 — Workspace (monorepo)**
Сделай pnpm workspace с 2-3 пакетами. Настрой Vitest workspace, запусти все тесты одной командой.

**Задача 10 — Performance compare**
Возьми один и тот же тестовый набор. Запусти на Jest и Vitest. Сравни время "первый запуск" и "watch при изменении".
