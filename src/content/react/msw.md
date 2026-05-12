## 📝 Теория

### Что такое MSW

**Mock Service Worker (MSW)** — библиотека для перехвата HTTP запросов **на уровне сети**. Не модифицирует fetch/axios, а перехватывает реальные запросы через **Service Worker** (в браузере) или **HTTP interceptor** (в Node.js).

**Ключевые преимущества:**

- 🌐 Работает с любым HTTP клиентом (fetch, axios, Apollo, etc).
- 🔥 Один и тот же mock для **dev**, **тестов** и **Storybook**.
- 🛠️ Не меняет код приложения — настоящие HTTP запросы.
- 📊 Видишь mock запросы в DevTools Network tab.
- 🚀 Разработка фронтенда без работающего бэкенда.

---

### Установка

```bash
npm i -D msw
```

---

### Handlers — описание моков

```ts
// src/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  // GET
  http.get("/api/users", () => {
    return HttpResponse.json([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);
  }),
  
  // GET с params
  http.get("/api/users/:id", ({ params }) => {
    const id = Number(params.id);
    if (id === 999) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ id, name: "Test User" });
  }),
  
  // POST
  http.post("/api/users", async ({ request }) => {
    const body = await request.json() as { name: string };
    return HttpResponse.json({ id: Date.now(), ...body }, { status: 201 });
  }),
  
  // PUT / PATCH / DELETE
  http.put("/api/users/:id", async ({ params, request }) => { ... }),
  http.patch("/api/users/:id", async ({ params, request }) => { ... }),
  http.delete("/api/users/:id", ({ params }) => {
    return HttpResponse.json({ id: params.id });
  }),
  
  // Query params
  http.get("/api/search", ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    return HttpResponse.json({ results: [], query: q });
  }),
  
  // Headers
  http.get("/api/me", ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (!auth) return new HttpResponse(null, { status: 401 });
    return HttpResponse.json({ user: { name: "Me" } });
  }),
];
```

---

### Setup для browser (dev)

```ts
// src/mocks/browser.ts
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
```

```ts
// src/main.tsx
async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import("./mocks/browser");
    return worker.start({ onUnhandledRequest: "bypass" });
  }
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
});
```

```bash
# Один раз — генерация service worker
npx msw init public/ --save
```

Создаст `public/mockServiceWorker.js`. Этот файл должен попасть на static хост.

---

### Setup для Node.js (тесты)

```ts
// src/mocks/server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

```ts
// vitest.config.ts (или jest setup)
import { server } from "./src/mocks/server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

### onUnhandledRequest

```ts
worker.start({ onUnhandledRequest: "bypass" });
// "bypass" — пропускать (запрос идёт реально)
// "warn"   — warning в консоль
// "error"  — ошибка

// Или функция
worker.start({
  onUnhandledRequest: (req, print) => {
    if (req.url.includes("hot-update")) return;  // skip
    print.error();
  },
});
```

В тестах — `error` (чтобы не пропустить забытый mock). В dev — `bypass` или `warn`.

---

### Динамические ответы

```ts
http.get("/api/random", () => {
  const value = Math.random();
  return HttpResponse.json({ value });
});

// С задержкой (симуляция медленной сети)
http.get("/api/slow", async () => {
  await new Promise(r => setTimeout(r, 2000));
  return HttpResponse.json({ data: "slow" });
});

// Случайные ошибки
http.get("/api/flaky", () => {
  if (Math.random() > 0.5) {
    return new HttpResponse(null, { status: 500 });
  }
  return HttpResponse.json({ data: "ok" });
});
```

---

### Stateful моки (in-memory database)

```ts
// src/mocks/db.ts
let users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

export const db = {
  findAll: () => users,
  findById: (id: number) => users.find(u => u.id === id),
  create: (user: any) => {
    const newUser = { id: Date.now(), ...user };
    users.push(newUser);
    return newUser;
  },
  delete: (id: number) => {
    users = users.filter(u => u.id !== id);
  },
  reset: () => {
    users = [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }];
  },
};
```

```ts
// handlers
http.get("/api/users", () => HttpResponse.json(db.findAll())),
http.post("/api/users", async ({ request }) => {
  const body = await request.json();
  return HttpResponse.json(db.create(body), { status: 201 });
}),
http.delete("/api/users/:id", ({ params }) => {
  db.delete(Number(params.id));
  return new HttpResponse(null, { status: 204 });
}),
```

```ts
// Тесты — reset state
afterEach(() => db.reset());
```

Альтернатива — `@mswjs/data` (полноценный mock DB):

```ts
import { factory, primaryKey } from "@mswjs/data";

const db = factory({
  user: {
    id: primaryKey(String),
    name: String,
    email: String,
  },
});

db.user.create({ id: "1", name: "Alice", email: "alice@test.com" });
db.user.findFirst({ where: { id: { equals: "1" } } });

// Auto-generated REST handlers!
const handlers = [...db.user.toHandlers("rest")];
```

---

### Override в конкретном тесте

```tsx
test("показывает ошибку при 500", async () => {
  // Override handler для этого теста
  server.use(
    http.get("/api/users", () => new HttpResponse(null, { status: 500 }))
  );
  
  render(<UserList />);
  expect(await screen.findByRole("alert")).toHaveTextContent(/error/i);
});

// После теста afterEach сбрасывает обратно к default handlers
```

---

### Имитация сетевых ошибок

```ts
import { HttpResponse, delay } from "msw";

http.get("/api/timeout", async () => {
  await delay(10000);  // 10 sec — клиент зачастую timeout-ит раньше
  return HttpResponse.json({});
}),

http.get("/api/network-error", () => {
  return HttpResponse.error();  // network error (не HTTP error)
}),

http.get("/api/conditional", ({ request }) => {
  const slow = new URL(request.url).searchParams.get("slow");
  if (slow) await delay(3000);
  return HttpResponse.json({ data: "ok" });
}),
```

---

### Auth flow с моками

```ts
let users = [{ id: 1, email: "user@test.com", password: "secret" }];
let sessions = new Map<string, number>();  // token → userId

const handlers = [
  http.post("/api/login", async ({ request }) => {
    const { email, password } = await request.json() as any;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return new HttpResponse(null, { status: 401 });
    
    const token = `token-${Date.now()}`;
    sessions.set(token, user.id);
    return HttpResponse.json({ token, user: { id: user.id, email: user.email } });
  }),
  
  http.get("/api/me", ({ request }) => {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token || !sessions.has(token)) {
      return new HttpResponse(null, { status: 401 });
    }
    const userId = sessions.get(token)!;
    const user = users.find(u => u.id === userId)!;
    return HttpResponse.json({ id: user.id, email: user.email });
  }),
  
  http.post("/api/logout", ({ request }) => {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (token) sessions.delete(token);
    return HttpResponse.json({ ok: true });
  }),
];
```

---

### MSW + GraphQL

```ts
import { graphql, HttpResponse } from "msw";

const handlers = [
  graphql.query("GetUsers", () => {
    return HttpResponse.json({
      data: { users: [{ id: 1, name: "Alice" }] },
    });
  }),
  
  graphql.mutation("CreateUser", ({ variables }) => {
    return HttpResponse.json({
      data: { createUser: { id: 99, ...variables.input } },
    });
  }),
];
```

---

### MSW + Storybook

```bash
npm i -D msw-storybook-addon
```

```ts
// .storybook/preview.ts
import { initialize, mswLoader } from "msw-storybook-addon";

initialize();

export const loaders = [mswLoader];
```

```tsx
// Story.stories.tsx
export const Story: StoryObj = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/users", () => HttpResponse.json([...])),
      ],
    },
  },
};
```

Каждая story может иметь свои моки.

---

### MSW + REST + WebSocket

WebSocket моки в beta:

```ts
import { ws } from "msw";

const handlers = [
  ws.link("ws://example.com").addEventListener("connection", ({ client }) => {
    client.send("hello");
    client.addEventListener("message", (event) => {
      client.send(`echo: ${event.data}`);
    });
  }),
];
```

---

### MSW + Cookies

```ts
http.get("/api/me", ({ cookies }) => {
  if (!cookies.token) return new HttpResponse(null, { status: 401 });
  return HttpResponse.json({ user: { name: "Me" } });
}),

// Установка cookie
http.post("/api/login", async () => {
  return HttpResponse.json(
    { user: { id: 1 } },
    {
      headers: {
        "Set-Cookie": "token=fake; HttpOnly; Path=/",
      },
    }
  );
}),
```

---

### Migration от mock-fetch / nock

Вместо моков fetch/axios:

```ts
// ❌ Старый подход
jest.mock("axios");
axios.get.mockResolvedValue({ data: [...] });

// ✅ MSW
server.use(http.get("/api/users", () => HttpResponse.json([...])));
```

Преимущества:
- Тестируется реальная network логика.
- Не зависит от HTTP клиента.
- Работает в dev.

---

## ⚠️ Подводные камни

### 1. mockServiceWorker.js не в public/

```bash
# Без этого — service worker не зарегистрируется
npx msw init public/ --save
```

### 2. handlers не находят запрос (path mismatch)

```ts
// Запрос: GET /api/users?page=1
http.get("/api/users", ...)            // ✅ matches (query ignored)
http.get("/api/users?page=1", ...)     // ❌ не работает (use ({ request }))

// Если query важен:
http.get("/api/users", ({ request }) => {
  const page = new URL(request.url).searchParams.get("page");
  // ...
}),
```

### 3. Trailing slash

```ts
// Запрос: GET /api/users/
http.get("/api/users", ...)   // не matches!
http.get("/api/users/", ...)  // matches
```

### 4. Service Worker кэш

После изменения mockServiceWorker.js — нужно hard refresh (Ctrl+Shift+R).

### 5. Production bundle

```ts
// ❌ MSW попадает в production bundle
import { worker } from "./mocks/browser";
worker.start();

// ✅ Динамический импорт + check env
if (import.meta.env.DEV) {
  const { worker } = await import("./mocks/browser");
  worker.start();
}
```

### 6. CORS в моках

MSW не имеет CORS — все запросы проходят. В реальности с другим origin может не работать.

### 7. handlers перепутаны

Порядок имеет значение — первый matching handler выигрывает:

```ts
http.get("/api/users/:id", ...)     // matches /api/users/anything
http.get("/api/users/me", ...)      // никогда не сработает (выше matches first)

// ✅ Более специфичные — выше
http.get("/api/users/me", ...)
http.get("/api/users/:id", ...)
```

### 8. Service Worker scope

mockServiceWorker.js должен быть в корне (public/). Если в подпапке — scope ограничен.

### 9. unstable HMR при изменении handlers

Иногда после изменения handlers — нужен restart dev сервера или unregister SW.

### 10. headers case-sensitivity

```ts
request.headers.get("authorization");  // ✅ lowercase
request.headers.get("Authorization");  // тоже работает (case-insensitive)
```

Но в node-fetch иногда проблемы с case.

---

## 🔬 Тонкие моменты

**MSW v2 vs v1**

API изменился в v2:

```ts
// v1 (legacy)
rest.get("/api", (req, res, ctx) => res(ctx.json([...])));

// v2 (modern)
http.get("/api", () => HttpResponse.json([...]));
```

Используй v2 для новых проектов.

**HttpResponse — class или constructor**

```ts
HttpResponse.json(data, options);           // shortcut
new HttpResponse(JSON.stringify(data), { 
  headers: { "Content-Type": "application/json" } 
});                                          // explicit
```

**bypass для конкретных запросов**

```ts
http.get("/api/external", async ({ request }) => {
  // Mock одни запросы, пропускаем другие
  if (request.url.includes("priority")) {
    return; // undefined → пропуск к реальной сети
  }
  return HttpResponse.json({ mocked: true });
}),
```

**MSW + async data**

```ts
http.get("/api/data", async () => {
  const data = await loadFromFile();
  return HttpResponse.json(data);
}),
```

**Custom contexts (v1) → объекты (v2)**

В v2 простой return — нет утилит ctx.

**MSW + open API generation**

```bash
# msw-auto-mock — генерирует handlers из OpenAPI/Swagger
npm i -D @mswjs/source
```

**Streams**

```ts
http.get("/api/stream", () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue("data: chunk1\n\n");
      // ...
    },
  });
  return new HttpResponse(stream);
}),
```

**Лучшая практика — handlers в shared**

```
mocks/
├── handlers/
│   ├── users.ts
│   ├── auth.ts
│   └── posts.ts
├── browser.ts
├── server.ts
└── index.ts
```

Модульно — легче поддерживать.

**onUnhandledRequest в production**

В production — MSW не должен работать. Если случайно включён — `onUnhandledRequest: "bypass"` пропускает запросы.

**Performance**

MSW лёгкий (~10ms overhead на запрос). Не используй для load testing.

---

## 🧩 Задачи для закрепления

**Задача 1 — Setup MSW для dev**
Настрой MSW в Vite проекте. Создай 5 endpoints. Убедись, что в DevTools Network видны mock запросы.

**Задача 2 — Stateful CRUD**
Сделай in-memory DB для users. Endpoints: GET list, GET one, POST create, PUT update, DELETE. State сохраняется между запросами.

**Задача 3 — Auth flow**
Login → получаешь token → используешь в Authorization header → /api/me возвращает user. Logout — token invalid.

**Задача 4 — Симуляция ошибок**
Endpoints: успех, 401, 404, 500, network error, timeout. Разработай UI обработку каждого.

**Задача 5 — Variable response времена**
Endpoint с симуляцией медленной сети (delay 2-5 сек). Покажи loader, optimistic UI.

**Задача 6 — Pagination**
Mock /api/items?page=1&limit=20. Total = 100. Реализуй pagination в UI.

**Задача 7 — Override в тестах**
Default handler возвращает success. В одном тесте override на error 500. Проверь UI обработку.

**Задача 8 — MSW + Storybook**
Подключи msw-storybook-addon. Story для UserList с разными scenarios (empty, loading, error, full).

**Задача 9 — @mswjs/data**
Используй mswjs/data для генерации realistic mock data (faker.js). Auto-generated REST endpoints.

**Задача 10 — Разработка без backend**
Сделай feature без работающего бэкенда. После завершения — "переключи" на real API (просто отключи MSW). Должно работать без изменения кода.
