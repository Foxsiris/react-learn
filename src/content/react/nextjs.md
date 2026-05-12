## 📝 Теория

### Что такое Next.js

**Next.js** — fullstack React фреймворк от Vercel. Стандарт де-факто для production React приложений.

**Что даёт:**

- 🔥 **Server-side Rendering (SSR)** + **Static Site Generation (SSG)** + **Incremental Static Regeneration (ISR)**.
- 🗂️ **File-based routing** (App Router / Pages Router).
- ⚡ **React Server Components** (App Router 13+).
- 🌍 **API Routes** (backend в том же проекте).
- 🖼️ **Image optimization** (Next/Image).
- 🌐 **Internationalization** (i18n).
- 📦 Автоматический code splitting, prefetching.
- 📊 Analytics, Web Vitals.

---

### Render режимы

| Режим | Когда рендерится | Когда использовать |
|---|---|---|
| **CSR** (Client-Side) | В браузере | Личные кабинеты, dashboards |
| **SSR** (Server-Side) | На каждый запрос на сервере | Дин. контент с SEO |
| **SSG** (Static) | На build | Блоги, документация, лендинги |
| **ISR** (Incremental Static) | SSG + revalidate в фоне | SSG с обновлениями |
| **PPR** (Partial Pre-Rendering) | Static shell + dynamic islands | Лучшее из обоих миров (Next 14+) |

---

### App Router vs Pages Router

| | Pages Router (legacy) | App Router (modern) |
|---|---|---|
| Версия | Все | 13+ |
| Папка | `pages/` | `app/` |
| Server Components | ❌ | ✅ |
| Streaming | Limited | ✅ |
| Layouts | _app.tsx (один) | layout.tsx (вложенные) |
| Data fetching | getServerSideProps | async components, fetch |
| Loading UI | manual | loading.tsx |
| Error handling | _error.tsx | error.tsx |

В новых проектах — **App Router**.

---

### App Router structure

```
app/
├── layout.tsx          ← root layout (обязательный)
├── page.tsx            ← главная страница "/"
├── loading.tsx         ← Suspense fallback
├── error.tsx           ← Error boundary
├── not-found.tsx       ← 404
├── global.css
│
├── (marketing)/        ← группа роутов (не в URL)
│   ├── about/
│   │   └── page.tsx    ← /about
│   └── pricing/
│       └── page.tsx    ← /pricing
│
├── dashboard/
│   ├── layout.tsx      ← layout для /dashboard и подроутов
│   ├── page.tsx        ← /dashboard
│   ├── settings/
│   │   └── page.tsx    ← /dashboard/settings
│   └── users/
│       ├── page.tsx    ← /dashboard/users
│       └── [id]/
│           └── page.tsx ← /dashboard/users/[id]
│
├── api/
│   └── users/
│       └── route.ts    ← API endpoint /api/users
│
└── @modal/             ← parallel route slot
    └── settings/
        └── page.tsx
```

---

### Server Component (default)

```tsx
// app/page.tsx — Server Component по умолчанию
async function HomePage() {
  // Можно использовать async/await прямо в компоненте
  const posts = await fetch("https://api.example.com/posts").then(r => r.json());
  
  return (
    <div>
      <h1>Posts</h1>
      <PostsList posts={posts} />
    </div>
  );
}

export default HomePage;
```

**Что МОЖНО в Server Components:**
- async/await.
- Прямой доступ к БД, файловой системе, env переменным.
- Импортировать секреты.
- fetch с автоматическим кэшированием.

**Что НЕЛЬЗЯ:**
- ❌ useState, useEffect, useRef.
- ❌ onClick, onChange (event handlers).
- ❌ Browser-only APIs (window, document).
- ❌ Custom hooks с state.

---

### Client Component

```tsx
"use client";  // ← директива в первой строке

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

**`"use client"` заражает всё поддерево:** все импортированные компоненты тоже становятся client.

---

### Композиция Server + Client

```tsx
// page.tsx — Server
async function Page() {
  const data = await getData();
  return (
    <div>
      <ServerHeader />        {/* Server */}
      <Counter />             {/* Client */}
      <ServerFooter data={data} /> {/* Server */}
    </div>
  );
}

// Counter.tsx
"use client";
export function Counter() { ... }
```

**Trick:** Можно передавать Server Components как children в Client Components:

```tsx
// Layout.tsx
"use client";
export function Layout({ children }: { children: ReactNode }) {
  const [sidebar, setSidebar] = useState(false);
  return (
    <div>
      <button onClick={() => setSidebar(!sidebar)}>Toggle</button>
      {children}  {/* ← может быть Server */}
    </div>
  );
}

// page.tsx — Server
export default function Page() {
  return (
    <Layout>
      <ServerComponent />  {/* остаётся Server */}
    </Layout>
  );
}
```

---

### Layouts

```tsx
// app/layout.tsx — root
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

// app/dashboard/layout.tsx — для всех /dashboard/* роутов
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

Layouts **persist** между переходами — сохраняется state.

---

### Data fetching

```tsx
async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetch(`https://api.example.com/products/${params.id}`).then(r => r.json());
  return <ProductCard product={product} />;
}
```

**Параллельная загрузка:**

```tsx
async function DashboardPage() {
  const [user, orders, stats] = await Promise.all([
    getUser(),
    getOrders(),
    getStats(),
  ]);
  return <Dashboard user={user} orders={orders} stats={stats} />;
}
```

---

### fetch caching

```tsx
// По умолчанию — кэш forever
fetch("/api/posts");

// Revalidate каждые 60 сек (ISR-like)
fetch("/api/posts", { next: { revalidate: 60 } });

// Без кэша — каждый запрос новый
fetch("/api/posts", { cache: "no-store" });

// Tags для invalidation
fetch("/api/posts", { next: { tags: ["posts"] } });
// Потом: revalidateTag("posts")
```

---

### Loading и Error UI

```tsx
// app/dashboard/loading.tsx — автоматический Suspense
export default function Loading() {
  return <Skeleton />;
}

// app/dashboard/error.tsx
"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <h2>Что-то пошло не так!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Повторить</button>
    </div>
  );
}
```

Это автоматические Suspense / Error Boundaries.

---

### Streaming + Suspense

```tsx
import { Suspense } from "react";

async function Page() {
  return (
    <div>
      <Header />  {/* быстрый */}
      
      <Suspense fallback={<PostsSkeleton />}>
        <Posts />  {/* медленный — стримится отдельно */}
      </Suspense>
      
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments />  {/* ещё медленнее — стримится */}
      </Suspense>
    </div>
  );
}
```

User видит Header → потом Posts → потом Comments. Не ждёт всё сразу.

---

### Server Actions (форм action на сервере)

```tsx
// Server Action (Server Component)
async function createPost(formData: FormData) {
  "use server";  // ← директива
  const title = formData.get("title");
  await db.post.create({ data: { title } });
  revalidatePath("/posts");
}

export default function NewPost() {
  return (
    <form action={createPost}>
      <input name="title" />
      <button type="submit">Create</button>
    </form>
  );
}
```

Без явного API endpoint — функция вызывается на сервере.

---

### API Routes

```tsx
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const users = await db.user.findMany();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const user = await db.user.create({ data: body });
  return NextResponse.json(user, { status: 201 });
}
```

```tsx
// Динамический роут — app/api/users/[id]/route.ts
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await db.user.findUnique({ where: { id: params.id } });
  return NextResponse.json(user);
}
```

---

### Middleware

```tsx
// middleware.ts (в корне)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token");
  
  if (!token && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

Middleware запускается перед каждым запросом — для auth, redirects, rewrites.

---

### Image optimization

```tsx
import Image from "next/image";

<Image
  src="/photo.jpg"
  alt="..."
  width={500}
  height={300}
  priority             // для LCP image
  placeholder="blur"
  blurDataURL="..."
/>

// Внешние изображения
// next.config.js: images.remotePatterns = [{ hostname: "cdn.example.com" }]
<Image src="https://cdn.example.com/img.jpg" ... />
```

Автоматически:
- Конвертирует в WebP/AVIF.
- Lazy loading.
- Responsive (srcset).
- Placeholder.

---

### Metadata (SEO)

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to my site",
  openGraph: { ... },
  twitter: { ... },
};

// Динамическая
export async function generateMetadata({ params }) {
  const post = await getPost(params.id);
  return { title: post.title, description: post.excerpt };
}
```

---

### Static params (SSG)

```tsx
// app/posts/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map(post => ({ slug: post.slug }));
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  return <Post post={post} />;
}
```

На build все страницы генерируются статически.

---

### Cache & Revalidation

```tsx
import { revalidatePath, revalidateTag } from "next/cache";

// Server Action
async function updatePost(id: string, data: any) {
  "use server";
  await db.post.update({ where: { id }, data });
  revalidatePath("/posts");          // обновить весь /posts
  revalidatePath(`/posts/${id}`);    // конкретно
  revalidateTag("posts");             // по тегу
}

// API route (например, webhook)
export async function POST(req: NextRequest) {
  // ...
  revalidateTag("posts");
  return NextResponse.json({ revalidated: true });
}
```

---

### Cookies & Headers (Server)

```tsx
import { cookies, headers } from "next/headers";

async function Page() {
  const cookieStore = cookies();
  const token = cookieStore.get("token");
  
  const headersList = headers();
  const userAgent = headersList.get("user-agent");
  
  // ...
}
```

---

### Parallel Routes

```
app/
├── @modal/
│   ├── default.tsx
│   └── settings/
│       └── page.tsx
└── layout.tsx
```

```tsx
// app/layout.tsx
export default function Layout({ children, modal }: { children: ReactNode; modal: ReactNode }) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
```

Используется для модалок над контентом.

---

### Intercepting Routes

```
app/
├── photos/
│   └── [id]/page.tsx       ← основной
└── @modal/
    └── (..)photos/
        └── [id]/page.tsx    ← перехватывает в модалке
```

Открыл фото с feed → показывается в модалке. Перешёл по URL — показывается page.

---

### Deployment

```bash
# Vercel (автоматически)
vercel

# Self-hosting
npm run build
npm start

# Docker — официальный example
# https://github.com/vercel/next.js/tree/canary/examples/with-docker
```

---

## ⚠️ Подводные камни

### 1. Server Component с client APIs

```tsx
// ❌
async function Page() {
  useState(0);  // ← Error: useState in Server Component
}

// ✅ Use client component
"use client";
function Counter() { useState(0); }
```

### 2. Передача функций в client → server

```tsx
// ❌
"use client";
function Client() { return <Server onClick={() => {}} />; }
//                                  ↑ функции нельзя передать в Server
```

### 3. Server Action возвращает функцию

```tsx
// ❌
async function action() { "use server"; return () => {}; }
// Server Action может вернуть только сериализуемое
```

### 4. Use of "use client" слишком высоко

```tsx
// ❌ "use client" в layout.tsx — все children становятся client
"use client";
export default function Layout({ children }) { ... }

// ✅ Делай "use client" leaves (на конкретных интерактивных компонентах)
```

### 5. fetch без кэша

```tsx
// По умолчанию fetch кэширует forever
const data = await fetch(url);
// Все запросы возвращают одно и то же

// Если нужно динамически:
fetch(url, { cache: "no-store" });
```

### 6. Динамический rendering force

```tsx
// Чтобы заставить page быть dynamic:
export const dynamic = "force-dynamic";

// Или используй cookies(), headers(), searchParams — Next.js определит автоматически
```

### 7. Hydration mismatch

```tsx
// ❌ Дата на сервере и клиенте может различаться
function Now() { return <p>{new Date().toString()}</p>; }
// Server: "Mon Jan 15 ..." Client: "Mon Jan 15 ... (другая мс)"
```

Решение — рендерь дату только на клиенте через `useEffect`.

### 8. Client component bundle size

Каждый `"use client"` компонент попадает в client bundle. Не делай "use client" массово.

### 9. Каскадные fetches

```tsx
// ❌ Sequential
const user = await getUser();
const posts = await getPosts(user.id);

// ✅ Parallel где можно
const [user, settings] = await Promise.all([getUser(), getSettings()]);
```

### 10. Server actions без оптимистичных обновлений

```tsx
// useTransition + useOptimistic для smooth UX
const [optimistic, addOptimistic] = useOptimistic(posts);
```

---

## 🔬 Тонкие моменты

**React Server Components vs SSR**

- **SSR** — компонент рендерится на сервере → HTML → hydration на клиенте.
- **RSC** — компонент только на сервере, в client bundle его нет.

RSC — следующий уровень оптимизации.

**generateStaticParams + dynamicParams**

```tsx
export const dynamicParams = false;  // 404 для не-pre-generated
```

**Route Handlers vs Server Actions**

| Route Handler | Server Action |
|---|---|
| Endpoint URL | Form/button action |
| Можно из любого клиента (mobile, etc) | Только из React |
| GET, POST, PUT, DELETE | POST (form) |
| Для API | Для form actions |

**unstable_cache**

```tsx
import { unstable_cache } from "next/cache";

const getCachedUsers = unstable_cache(
  async () => db.user.findMany(),
  ["users"],
  { revalidate: 60, tags: ["users"] }
);
```

Кэширует не-fetch функции.

**Suspense без Loading**

Если вместо `loading.tsx` хочешь explicit Suspense — оборачивай вручную.

**App + Pages вместе (migration)**

Можно использовать оба router'а одновременно. Постепенная миграция.

**Edge runtime**

```tsx
export const runtime = "edge";
// Запускается на edge (Cloudflare Workers / Vercel Edge)
// Быстрее cold start, ограниченные API
```

**CSR в App Router**

Просто компонент с `"use client"` — это уже CSR (после первого SSR HTML).

**Dynamic imports**

```tsx
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("./Chart"), { ssr: false });
// Не рендерится на сервере — только на клиенте
```

**Streaming SSR**

Suspense + RSC = streaming. HTML отправляется по частям. Браузер начинает рендерить раньше.

---

## 🧩 Задачи для закрепления

**Задача 1 — Блог на App Router**
Список постов (SSG) + страница поста (ISR с revalidate 60). Markdown content. SEO meta.

**Задача 2 — Server + Client mix**
Layout с Server Components (header, footer) + interactive Client Components (theme toggle, search). Покажи bundle size с/без оптимизации.

**Задача 3 — Server Actions form**
Форма создания поста через Server Action. После создания — revalidatePath, увидишь обновление.

**Задача 4 — API Routes + auth**
API /api/users с GET/POST. Middleware для проверки JWT.

**Задача 5 — Streaming Suspense**
Дашборд с 3 секциями (быстрая, средняя, медленная). Каждая в Suspense — стримится отдельно.

**Задача 6 — Image optimization**
Заменяй <img> на <Image>. Сравни Lighthouse скоры (LCP, CLS).

**Задача 7 — Parallel Routes для модалки**
Реализуй галерею с фотографиями. Клик на фото открывает модалку, URL меняется. F5 — открывается полная страница.

**Задача 8 — Internationalization**
Настрой next-intl или встроенный i18n. Поддержи 2 языка с переключением.

**Задача 9 — Auth с middleware**
Cookies-based JWT. Middleware redirect если не авторизован. Защита /dashboard/* роутов.

**Задача 10 — Deployment**
Деплой на Vercel + Docker. Сравни DX и performance.
