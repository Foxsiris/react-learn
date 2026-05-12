## 📝 Теория

### Что такое monorepo

**Monorepo** (monolithic repository) — несколько связанных проектов в **одном Git-репозитории** с **общими зависимостями и инструментами**.

Противоположность — **multi-repo** (polyrepo): каждый проект в своём репо.

```
monorepo/
├── apps/
│   ├── web/          ← Next.js
│   ├── admin/        ← Vite SPA
│   ├── mobile/       ← React Native
│   └── docs/         ← Documentation
├── packages/
│   ├── ui/           ← Shared components
│   ├── utils/        ← Shared utils
│   ├── api-client/   ← Generated API client
│   └── tsconfig/     ← Shared TS configs
├── package.json      ← root
└── turbo.json        ← Turborepo config
```

---

### Зачем monorepo

✅ **Преимущества:**

1. **Переиспользование кода** — общий UI Kit между web/mobile/admin.
2. **Атомарные коммиты** — изменение API + frontend в одном PR.
3. **Согласованные версии** — одна версия React/TypeScript.
4. **Единые инструменты** — ESLint, Prettier, TS config один раз.
5. **Простая навигация** — всё в одном репо, IDE search работает.
6. **Refactoring across packages** — изменение типа сразу видит везде.

❌ **Недостатки:**

1. Больше disk space (один git clone = всё).
2. CI длиннее (если не оптимизирован).
3. Нужен build orchestrator (Turborepo, Nx).
4. Кривая обучения для команды.

---

### Inструменты для monorepo

| Tool | Что | Когда |
|---|---|---|
| **pnpm workspaces** | Менеджер зависимостей с workspaces | Базовая настройка |
| **npm workspaces** | То же, но npm | если нет pnpm |
| **Yarn workspaces** | То же, но yarn | если используете yarn |
| **Turborepo** | Build orchestrator + кэш | Современный default |
| **Nx** | Build orchestrator + scaffolding | Большие монорепо |
| **Lerna** | Старый инструмент | Legacy |
| **Rush** | Microsoft's monorepo tool | Большие enterprise |

---

### pnpm workspaces — base setup

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```json
// package.json (root)
{
  "name": "monorepo",
  "private": true,
  "scripts": {
    "build": "pnpm -r run build",
    "dev": "pnpm -r --parallel run dev",
    "test": "pnpm -r run test"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "turbo": "^1.10.0"
  }
}
```

```json
// packages/ui/package.json
{
  "name": "@my-org/ui",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc"
  }
}
```

```json
// apps/web/package.json
{
  "name": "@my-org/web",
  "dependencies": {
    "@my-org/ui": "workspace:*",   ← workspace protocol
    "react": "^18.2.0"
  }
}
```

`workspace:*` — pnpm берёт пакет из локального workspace, не из npm.

---

### Turborepo

**Turborepo** = task orchestrator + кэширование. Запускает задачи параллельно, кэширует результаты, понимает граф зависимостей.

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],          ← сначала зависимости
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "dev": {
      "cache": false,                    ← не кэшировать dev
      "persistent": true                 ← long-running
    },
    "lint": {
      "outputs": []
    }
  }
}
```

```bash
# Запуск
turbo run build           # все пакеты
turbo run build --filter=@my-org/web   # только web
turbo run dev --parallel  # параллельно
```

**Ключевая фича Turborepo — кэш.** Если код не менялся, повторный build = мгновенный (берём из кэша).

---

### Remote cache (Turborepo)

```bash
turbo login           # авторизация Vercel
turbo link            # связь репо с remote cache
```

Теперь кэш делится между всеми членами команды и CI. Локальный билд → кэш → CI берёт результат.

---

### Граф зависимостей

```
apps/web
  └── depends on packages/ui, packages/api-client
apps/admin
  └── depends on packages/ui, packages/utils

packages/ui
  └── depends on packages/tsconfig

packages/api-client
  └── depends on packages/utils
```

Turborepo строит топологический граф и запускает задачи в правильном порядке.

---

### Nx

**Nx** — более тяжёлая альтернатива Turborepo с большим функционалом:

- Генераторы (scaffolding `nx generate`).
- Computation cache (как Turbo).
- Distributed task execution.
- Strict project boundaries (модулей).
- Visualization (`nx graph`).

```bash
npx create-nx-workspace@latest
# Выбираешь preset (React, Next, Angular, ...)

nx generate @nx/react:application web
nx generate @nx/react:library ui
nx run web:build
nx affected --target=test  ← только затронутые
```

`nx affected` — мощная фича: запускает задачи только для изменившихся пакетов (не для всего monorepo).

---

### Turborepo vs Nx

| | Turborepo | Nx |
|---|---|---|
| Setup | Минимальный | Больше |
| Конфиг | turbo.json | project.json + nx.json |
| Generators | Нет | Да |
| Plugins | Минимум | Большая экосистема |
| Performance | Быстрый | Очень быстрый |
| Размер | Маленький | Большой |
| Кривая обучения | Низкая | Средняя |

**Турборепо** — для небольших и средних monorepo, нужен только task orchestration. **Nx** — для больших enterprise с генераторами и стратегией.

---

### Структура реального monorepo

```
monorepo/
├── apps/
│   ├── web/                  (Next.js — основной сайт)
│   ├── admin/                (Vite SPA — admin panel)
│   ├── mobile/               (React Native — приложение)
│   ├── docs/                 (Storybook + Markdown)
│   └── e2e/                  (Playwright тесты)
│
├── packages/
│   ├── ui/                   (UI Kit — Button, Modal, ...)
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api-client/           (Generated from OpenAPI)
│   ├── utils/                (Shared utils)
│   ├── types/                (Shared TypeScript types)
│   ├── icons/                (SVG icons)
│   ├── analytics/            (Analytics SDK wrapper)
│   ├── i18n/                 (Translations)
│   │
│   ├── eslint-config/        (Shared ESLint)
│   ├── tsconfig/             (Shared TS configs)
│   └── prettier-config/
│
├── tooling/
│   └── scripts/              (Custom scripts)
│
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── tsconfig.base.json
└── README.md
```

---

### TypeScript настройка

```json
// tsconfig.base.json (root)
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": {
      "@my-org/ui": ["./packages/ui/src"],
      "@my-org/utils": ["./packages/utils/src"]
    }
  }
}
```

```json
// packages/ui/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "declaration": true
  },
  "include": ["src"]
}
```

---

### TypeScript Project References

```json
// packages/ui/tsconfig.json
{
  "compilerOptions": { "composite": true },
  "references": [
    { "path": "../utils" }     ← зависимость
  ]
}
```

```bash
tsc --build  ← билдит все references по графу
```

Project References быстрее обычного компилятора для больших monorepo.

---

### Shared ESLint config

```js
// packages/eslint-config/index.js
module.exports = {
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  rules: { ... },
};
```

```json
// packages/ui/package.json
{ "devDependencies": { "@my-org/eslint-config": "workspace:*" } }
```

```js
// packages/ui/.eslintrc.js
module.exports = { extends: ["@my-org/eslint-config"] };
```

---

### CI с Turborepo

```yaml
# .github/workflows/ci.yml
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with: { version: 8 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      
      - run: pnpm install --frozen-lockfile
      
      - name: Build (with Turbo cache)
        run: pnpm turbo run build
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ vars.TURBO_TEAM }}
      
      - name: Test
        run: pnpm turbo run test
      
      - name: Lint
        run: pnpm turbo run lint
```

С remote cache — CI становится в разы быстрее.

---

### Changesets (versioning + publishing)

```bash
npm i -D @changesets/cli
npx changeset init
```

Workflow:

```bash
# 1. Сделал изменения
git add . && git commit -m "feat: add Button"

# 2. Создал changeset
pnpm changeset
# → выбираешь, какие пакеты изменились
# → patch / minor / major
# → описание
# → создаётся .changeset/xyz.md

# 3. PR + merge

# 4. В main — release workflow:
pnpm changeset version  # обновляет версии
pnpm changeset publish  # публикует на npm
```

Альтернатива semver / автоматическим версиям.

---

### Внутренние пакеты vs published

```json
// Внутренний (только для monorepo)
"private": true

// Публикуется на npm
"private": false,
"publishConfig": { "access": "public" }
```

---

### Hot module replacement через workspace

```ts
// apps/web/src/app.tsx
import { Button } from "@my-org/ui";

// Изменяешь Button.tsx → web app мгновенно обновляется (HMR работает через workspace)
```

Это работает потому, что workspace:* — символическая ссылка на локальный пакет.

---

### Tools для monorepo

```bash
# Анализ зависимостей
nx graph
turbo run build --graph

# Проверка дубликатов
syncpack list-mismatches    # одна версия зависимости везде

# Очистка
turbo run build --force     # игнор кэша
rm -rf node_modules **/node_modules
```

---

## ⚠️ Подводные камни

### 1. Hoisting проблемы

```bash
# pnpm не делает hoisting (по умолчанию) — каждый пакет имеет свои node_modules
# Это безопаснее, но иногда ломает плагины, ожидающие hoisting
```

Решение — `.npmrc`:

```
public-hoist-pattern[]=*types*
public-hoist-pattern[]=*eslint*
shamefully-hoist=true   # nuclear option
```

### 2. Versions mismatch

```json
// app/web: react 18.2.0
// app/admin: react 18.3.0
// → разные версии React в bundle!
```

Решение:
- Resolutions в root package.json.
- Один version через workspace.
- `syncpack` для автоматического sync.

### 3. Build dependencies не правильные

```ts
// app/web использует ui, но в turbo.json не настроено
{
  "build": { "dependsOn": ["^build"] }  // ← ^ означает зависимости
}
// Без ^ — UI не будет билдиться перед web → ошибка
```

### 4. TypeScript paths без bundler

```ts
// Если используешь tsc напрямую (без bundler)
// paths из tsconfig игнорируются runtime
// Нужен tsc-alias или другой post-process
```

С bundler-ами (Vite, Webpack) — paths работают через resolve.alias.

### 5. ESM/CJS interop

В monorepo легко смешать ESM и CJS пакеты — может сломаться:

```json
// packages/ui — ESM
"type": "module"

// apps/web (CJS) импортирует ui — ошибка
```

Решение — единый формат или dual package (ESM + CJS exports).

### 6. Кэш слишком агрессивный

```bash
turbo run build  # use cached output
# Но output может быть устаревший если ввод (env vars) изменился

# Решение — env в turbo.json
{ "build": { "env": ["NODE_ENV", "API_URL"] } }
```

### 7. Disk space

Каждый пакет — свои node_modules:

```
monorepo/
  node_modules/        500 MB
  apps/web/node_modules/  300 MB
  apps/admin/node_modules/ 200 MB
```

С pnpm — symlinks на content-addressable store, экономит место.

### 8. Turborepo не лучший для simple monorepo

Если у тебя 2 пакета и одна команда build — turborepo overhead. Можно простым `pnpm -r build`.

### 9. CI matrix — лишние запуски

```yaml
# Bad
matrix:
  package: [web, admin, ui, utils]
runs: pnpm --filter ${{ matrix.package }} build
# 4 параллельных run, но без shared cache

# Good
runs: turbo run build  # одна команда, граф + кэш
```

### 10. Strict boundaries

```ts
// ❌ apps/web импортирует apps/admin/internal/...
// Это нарушение boundaries
```

Решение:
- В Nx — `enforce-module-boundaries` правило.
- В Turborepo — конвенция и code review.
- Использовать только public API через index.ts.

---

## 🔬 Тонкие моменты

**workspace:* vs ^1.0.0**

```json
"@my-org/ui": "workspace:*"   ← всегда локально
"@my-org/ui": "^1.0.0"         ← из npm registry
"@my-org/ui": "workspace:^"     ← локально, при publish становится ^1.0.0
```

**Distributed builds (Nx Cloud)**

Билды распределяются по нескольким машинам в CI. Существенно ускоряет.

**Remote cache в self-hosted setup**

Turborepo поддерживает self-hosted remote cache (без Vercel). Можно поставить S3 / Cloudflare R2.

**Generators в Nx**

```bash
nx g @nx/react:lib my-lib
# создаёт пакет с готовой структурой, package.json, eslint, tests
```

Огромный time saver для больших команд.

**Turborepo Beta features**

- `--continue` — продолжать при ошибках.
- `--dry-run` — что бы запустилось.
- `prune` — извлечение subset для Docker.

**Docker builds для monorepo**

```dockerfile
FROM node:20 AS builder
COPY . .
RUN turbo prune @my-org/web --docker  ← только web и его зависимости
```

`prune` создаёт минимальный subset — ускоряет Docker builds.

**Single repo with multiple frameworks**

```
apps/
├── web (Next.js)
├── admin (Vite + React)
├── mobile (React Native)
└── docs (Astro)
```

Каждый своим bundler-ом. Shared packages — universal (работают везде).

**Code splitting через packages**

```ts
// packages/heavy-lib — отдельный пакет
const HeavyLib = lazy(() => import("@my-org/heavy-lib"));
```

Bundler видит границу пакета — может оптимизировать chunks.

**Lockfile**

```
monorepo/pnpm-lock.yaml  ← один на весь monorepo
```

Не разделяй lockfile-ы — это нарушает суть workspace.

**npm publish vs Changesets**

- `npm publish` — ручное.
- Changesets — автоматизированное, сохраняет changelog.
- `semantic-release` — полностью автоматическое.

Changesets — sweet spot для большинства команд.

---

## 🧩 Задачи для закрепления

**Задача 1 — Setup pnpm monorepo**
Создай monorepo: 2 apps (web, admin), 2 packages (ui, utils). Настрой workspaces.

**Задача 2 — Turborepo**
Установи Turborepo. Настрой turbo.json для build/test/lint. Замерь скорость с/без кэша.

**Задача 3 — Shared UI library**
Создай `@my-org/ui` пакет. Используй в web и admin. Изменения мгновенно видны (HMR).

**Задача 4 — Shared TS config**
Сделай `@my-org/tsconfig` с base/react/library configs. Используй везде через extends.

**Задача 5 — Changesets workflow**
Настрой Changesets. Создай PR с changeset, проверь release workflow.

**Задача 6 — Remote cache**
Настрой Turborepo remote cache (Vercel free). Проверь, что CI использует кэш с локальной машины.

**Задача 7 — Nx vs Turbo**
Сделай тот же setup на Nx. Сравни DX, скорость, простоту настройки.

**Задача 8 — `nx affected` (Nx)**
Используй `nx affected --target=test` чтобы запустить тесты только для изменившихся пакетов.

**Задача 9 — Docker build**
Сделай multi-stage Docker для apps/web. Используй `turbo prune` для минимизации image.

**Задача 10 — Strict boundaries**
Настрой ESLint правила, запрещающие cross-imports между apps. Используй eslint-plugin-boundaries или Nx rules.
