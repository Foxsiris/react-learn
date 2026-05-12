## 📝 Теория

### Что такое FSD

**Feature-Sliced Design** — методология организации фронтенда вокруг **бизнес-функциональности**, а не технических деталей. Изолирует фичи, делает код предсказуемым и масштабируемым.

**Главные принципы:**

1. **Разделение по бизнес-смыслу**, не по технологии (компоненты/хуки/redux).
2. **Однонаправленные импорты** — высокие слои импортируют низкие, не наоборот.
3. **Изоляция** — изменение в одной фиче не должно ломать другие.
4. **Public API** — каждый модуль экспортирует только то, что наружу нужно.

Сайт: [feature-sliced.design](https://feature-sliced.design)

---

### Структура: слои → слайсы → сегменты

```
src/
├── app/                ← Layer 1: Initialization
│   ├── providers/        ← Slice
│   ├── styles/           ← Slice
│   └── index.tsx
├── pages/              ← Layer 2: Routing
│   ├── home/             ← Slice
│   ├── profile/
│   └── product-details/
├── widgets/            ← Layer 3: Composition
│   ├── header/
│   ├── sidebar/
│   └── product-list/
├── features/           ← Layer 4: Business actions
│   ├── auth-by-email/
│   ├── add-to-cart/
│   └── filter-products/
├── entities/           ← Layer 5: Business entities
│   ├── user/
│   ├── product/
│   └── order/
└── shared/             ← Layer 6: Shared
    ├── ui/               ← Segment
    ├── api/
    ├── lib/
    └── config/
```

---

### Слои (Layers)

**Каждый слой может импортировать только из нижестоящих:**

| Слой | Что | Примеры |
|---|---|---|
| **app** | Инициализация приложения | providers, styles, store, router setup |
| **pages** | Целые страницы (роуты) | HomePage, ProfilePage, ProductPage |
| **widgets** | Самостоятельные блоки UI | Header, Sidebar, ProductList |
| **features** | Бизнес-действия пользователя | AuthByEmail, AddToCart, FilterProducts |
| **entities** | Бизнес-сущности (модели) | User, Product, Order |
| **shared** | Переиспользуемое (без бизнеса) | UIKit, API client, utils, config |

```
app → pages → widgets → features → entities → shared
←──────── направление импортов ────────→
```

---

### Слайсы (Slices)

**Слайс** — конкретная фича/сущность внутри слоя. Например, в `features/`:

```
features/
├── auth-by-email/      ← slice
├── auth-by-google/     ← slice
├── add-to-cart/        ← slice
└── search-products/    ← slice
```

**Слайсы одного слоя не должны импортировать друг друга** — иначе теряется изоляция.

```
features/auth-by-email/   ❌ → features/add-to-cart/
```

Если нужна общая логика — выноси в нижний слой (`entities` или `shared`).

---

### Сегменты (Segments)

**Сегменты** — стандартные папки внутри слайса:

| Сегмент | Что |
|---|---|
| `ui/` | React компоненты |
| `model/` | State, хуки, типы, бизнес-логика |
| `api/` | Запросы к серверу |
| `lib/` | Утилиты, helpers |
| `config/` | Константы, env |

```
features/auth-by-email/
├── ui/
│   ├── LoginForm.tsx
│   └── LoginForm.module.css
├── model/
│   ├── auth.slice.ts
│   ├── useAuth.ts
│   └── types.ts
├── api/
│   └── auth.api.ts
├── lib/
│   └── validation.ts
└── index.ts          ← Public API
```

---

### Public API через index.ts

```ts
// features/auth-by-email/index.ts
export { LoginForm } from "./ui/LoginForm";
export { useAuth } from "./model/useAuth";
export type { AuthState } from "./model/types";

// auth.api.ts — НЕ экспортируется, скрыт
// LoginForm.module.css — НЕ экспортируется
```

```ts
// pages/login/ui/LoginPage.tsx
import { LoginForm } from "features/auth-by-email";  // ✅ через public API
import { LoginForm } from "features/auth-by-email/ui/LoginForm";  // ❌ внутрь
```

---

### Полный пример структуры

```
src/
├── app/
│   ├── providers/
│   │   ├── ThemeProvider.tsx
│   │   ├── QueryProvider.tsx
│   │   └── RouterProvider.tsx
│   ├── styles/
│   │   └── global.css
│   └── index.tsx
│
├── pages/
│   ├── home/
│   │   ├── ui/HomePage.tsx
│   │   └── index.ts
│   ├── product-details/
│   │   ├── ui/ProductDetailsPage.tsx
│   │   └── index.ts
│   └── checkout/
│       ├── ui/CheckoutPage.tsx
│       ├── model/useCheckout.ts
│       └── index.ts
│
├── widgets/
│   ├── header/
│   │   ├── ui/Header.tsx
│   │   ├── ui/Logo.tsx
│   │   ├── ui/UserMenu.tsx
│   │   └── index.ts
│   ├── product-list/
│   │   ├── ui/ProductList.tsx
│   │   ├── model/useProductList.ts
│   │   └── index.ts
│
├── features/
│   ├── auth-by-email/
│   │   ├── ui/LoginForm.tsx
│   │   ├── model/auth.api.ts
│   │   ├── model/auth.store.ts
│   │   └── index.ts
│   ├── add-to-cart/
│   │   ├── ui/AddToCartButton.tsx
│   │   ├── model/useAddToCart.ts
│   │   └── index.ts
│   ├── filter-products/
│   │   ├── ui/FilterPanel.tsx
│   │   ├── model/useFilters.ts
│   │   └── index.ts
│
├── entities/
│   ├── user/
│   │   ├── ui/UserCard.tsx
│   │   ├── model/types.ts
│   │   ├── model/user.store.ts
│   │   ├── api/user.api.ts
│   │   └── index.ts
│   ├── product/
│   │   ├── ui/ProductCard.tsx
│   │   ├── model/types.ts
│   │   ├── api/product.api.ts
│   │   └── index.ts
│   ├── order/
│
└── shared/
    ├── ui/
    │   ├── Button/
    │   ├── Input/
    │   ├── Modal/
    │   └── index.ts
    ├── api/
    │   ├── http.ts        ← axios/fetch wrapper
    │   └── index.ts
    ├── lib/
    │   ├── format.ts
    │   ├── validation.ts
    │   └── hooks/
    │       └── useDebounce.ts
    ├── config/
    │   ├── env.ts
    │   └── routes.ts
    └── types/
        └── index.ts
```

---

### Правила импортов (Import Rules)

```
✅ Разрешено:
app → pages, widgets, features, entities, shared
pages → widgets, features, entities, shared
widgets → features, entities, shared
features → entities, shared
entities → shared
shared → shared (только нижние сегменты)

❌ Запрещено:
shared → entities  (низший импортирует выше — антипаттерн)
features → features (один слайс импортирует другой того же слоя)
entities → entities (то же)
```

---

### Слои внутри сегментов

Иногда `model/` может содержать вложенные сегменты:

```
features/auth/
├── ui/
├── model/
│   ├── slice.ts
│   ├── selectors.ts
│   ├── thunks.ts
│   └── types.ts
```

---

### Когда использовать FSD

✅ **Подходит для:**
- Средние и большие проекты (15+ страниц).
- Команды 3+ разработчиков.
- Долгосрочные проекты (изменения в течение месяцев/лет).
- Проекты с явными фичами и сущностями (e-commerce, SaaS).

❌ **Может быть избыточно для:**
- Маленькие проекты (1-3 страницы, MVP).
- Лендинги.
- Прототипы.
- Сильно реактивные UI без бизнес-логики (game).

---

### Слой Process (legacy)

Старая FSD имела слой `processes/` (между pages и widgets) для multistep процессов (wizard, onboarding). Сейчас он удалён — multistep делается через features или pages.

---

### Eslint-plugin для FSD

```bash
npm i -D @feature-sliced/eslint-config eslint-plugin-import
```

```js
// .eslintrc.js
{
  extends: ["@feature-sliced"],
  // или вручную:
  rules: {
    "import/no-restricted-paths": ["error", {
      zones: [
        {
          target: "src/shared",
          from: ["src/entities", "src/features", "src/widgets", "src/pages", "src/app"],
          message: "shared не должен импортировать из верхних слоёв",
        },
        // ... другие правила
      ],
    }],
  },
}
```

Альтернатива — `eslint-plugin-boundaries`, `steiger`.

---

### Steiger — линтер FSD

```bash
npm i -D steiger
npx steiger src
```

Автоматически проверяет:
- Структуру по FSD.
- Правила импортов.
- Public API.
- Cross-imports.

---

### Миграция на FSD

```
1. Начни с shared/ — выдели UI kit, утилиты, API client.
2. Потом entities/ — User, Product, Order.
3. Потом features/ — AuthByEmail, AddToCart.
4. Widgets/ — Header, Sidebar.
5. Pages/ — превратить routes в pages.
6. App/ — провайдеры.
```

Делай постепенно. Не переписывай всё за раз.

---

### TypeScript paths для красивых импортов

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@app/*": ["app/*"],
      "@pages/*": ["pages/*"],
      "@widgets/*": ["widgets/*"],
      "@features/*": ["features/*"],
      "@entities/*": ["entities/*"],
      "@shared/*": ["shared/*"]
    }
  }
}
```

```ts
import { Button } from "@shared/ui";
import { LoginForm } from "@features/auth-by-email";
```

---

## ⚠️ Подводные камни

### 1. Нарушение import direction

```ts
// ❌ entities импортирует из features
// entities/user/model/user.store.ts
import { useAuth } from "features/auth";  // ❌
```

Если features нужны в entity — выноси в shared (events) или меняй направление.

### 2. Cross-import между слайсами одного слоя

```ts
// ❌ features → features
// features/cart/ui/Cart.tsx
import { useAuth } from "features/auth";  // ❌
```

Решение:
- Объединить slices.
- Вынести общее в entities/shared.
- Использовать shared event bus.

### 3. Слишком мелкое дробление

Не каждая кнопка — отдельный feature. Начни с крупных модулей, дроби по необходимости.

```
❌
features/
├── show-modal/
├── close-modal/
└── open-modal/

✅
features/
└── modal-management/
```

### 4. Логика в pages

```
❌ pages/home/ui/HomePage.tsx
function HomePage() {
  // 200 строк логики, fetch, useState
}

✅ pages — только композиция, логика в widgets/features
function HomePage() {
  return (
    <Layout>
      <Header />
      <ProductList />
      <Footer />
    </Layout>
  );
}
```

### 5. Public API забыт

```
❌ Импорт из глубины модуля
import { LoginForm } from "features/auth/ui/LoginForm";

✅ Через index.ts
import { LoginForm } from "features/auth";
```

ESLint правило `no-restricted-imports` помогает.

### 6. Slice и feature путают

**Slice** — папка внутри слоя (например, `auth-by-email`).  
**Segments** — папки внутри slice (`ui`, `model`).

Это разные вещи.

### 7. Нет shared/ui

В первой итерации часто все UI компоненты делают inline в pages/features. Это ошибка — UI kit нужен изначально.

### 8. Дублирование types

Если `User` тип нужен в нескольких местах — он в `entities/user/model/types.ts`. Не дублируй.

### 9. Слишком много providers в app/

App становится свалкой. Группируй:

```
app/providers/
├── index.tsx          ← оборачивающий <Providers>
├── ThemeProvider.tsx
├── QueryProvider.tsx
└── RouterProvider.tsx
```

### 10. Backend зависит от FSD

```ts
// ❌ shared/api использует типы из features/entities
// shared/api/users.api.ts
import type { User } from "entities/user";
```

`shared/api` должен быть полностью отвязан или иметь generic типы.

Часто api помещают **в entities** (entities/user/api/), а в shared — только базовый http client.

---

## 🔬 Тонкие моменты

**Public API через barrel exports**

```ts
// shared/ui/index.ts
export { Button } from "./Button";
export { Input } from "./Input";
export { Modal } from "./Modal";
```

⚠️ Barrel exports могут ломать tree-shaking. Используй `sideEffects: false` в package.json или индивидуальные импорты.

**Internal structure внутри слайса**

Можно делать вложенные внутренние сегменты:

```
features/auth/
├── _internal/         ← скрыто
│   └── crypto.ts
├── ui/
└── model/
```

`_internal/` не экспортируется, используется только внутри slice.

**FSD + monorepo**

В monorepo каждый app может иметь свою FSD структуру, а `packages/ui` — общая UIKit.

**FSD + Atomic Design**

Совместимы. Atomic Design — для `shared/ui`. FSD — для всего остального.

```
shared/ui/
├── atoms/      ← Button, Input
├── molecules/  ← FormField
└── organisms/  ← DataTable
```

**Layer "processes" deprecated**

Старая FSD имела processes/. Сейчас удалён. Multi-step делается в pages или features.

**Storybook + FSD**

```
shared/ui/Button/
├── Button.tsx
├── Button.stories.tsx   ← stories
└── Button.test.tsx
```

Stories организуются по слоям: `Shared/Button`, `Entities/UserCard`, `Features/LoginForm`.

**Tests + FSD**

Unit тесты — рядом с кодом. Integration / e2e — в отдельной папке `__tests__/` или в `app/`.

**Feature flags через FSD**

```ts
// shared/lib/feature-flags.ts
export function isFeatureEnabled(key: string) { ... }

// features/new-checkout/ui/Checkout.tsx
if (!isFeatureEnabled("new-checkout")) return null;
```

**Refactoring patterns**

- Если widget вырос в фичу — переноси в `widgets/`.
- Если фича используется в нескольких местах — может быть entity.
- Если сущность не имеет UI — может быть shared.

**FSD vs Domain-Driven Design**

FSD ближе к presentation-layer DDD. Backend DDD имеет другие принципы (aggregates, value objects), но философия похожа.

---

## 🧩 Задачи для закрепления

**Задача 1 — Спланируй FSD для блога**
Список сущностей: Post, User, Comment, Category. Списка фич: Auth, CreatePost, CommentOnPost, FollowUser. Распиши слои/слайсы.

**Задача 2 — Реструктурируй существующий проект**
Возьми старый проект (без FSD). Переструктурируй: shared → entities → features → widgets → pages.

**Задача 3 — Public API**
Реализуй модуль с публичным API через index.ts. Настрой ESLint, чтобы запрещать deep import-ы.

**Задача 4 — Setup ESLint для FSD**
Установи steiger или @feature-sliced/eslint-config. Настрой правила. Проверь существующий проект.

**Задача 5 — Cross-import refactor**
В существующем коде найди cross-import между фичами. Реши: объединить, вынести в entities, или ивент-бас.

**Задача 6 — TypeScript paths**
Настрой алиасы @app, @pages, @widgets, и т.д. Используй в импортах. Vite/Webpack тоже должны работать.

**Задача 7 — Storybook + FSD**
Настрой Storybook с структурой stories по слоям FSD. Сделай 3-5 historie на разных слоях.

**Задача 8 — E-commerce архитектура**
Спроектируй FSD для интернет-магазина: Catalog, Cart, Checkout, User profile, Orders. Распиши все слои.

**Задача 9 — FSD + Redux Toolkit**
Каждая entity и feature имеет свой slice. Покажи, как организовать store с FSD.

**Задача 10 — Migration challenge**
Выбери реальный legacy проект (свой или открытый). Создай PR с миграцией одного модуля на FSD.
