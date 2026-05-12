## 📝 Теория

### Что такое Storybook

**Storybook** — изолированная среда разработки и документирования UI компонентов. Каждый компонент (или вариант компонента) — отдельная **Story**.

**Зачем:**

- 📚 **Документация** — каталог всех компонентов с примерами.
- 🎨 **Дизайн-система** — единый источник истины для UI.
- 🛠️ **Изолированная разработка** — компонент без приложения.
- 🧪 **Тестирование** — visual regression, accessibility, interaction.
- 👥 **Коммуникация** — designers + developers + PM смотрят одно.

---

### Установка

```bash
npx storybook@latest init
# Автоматически определяет фреймворк (React, Vue, Angular)
# Создаёт .storybook/ + примеры stories
```

```bash
npm run storybook    # запуск dev сервера (port 6006)
npm run build-storybook  # static build (для деплоя)
```

---

### Структура

```
.storybook/
├── main.ts          ← конфиг
├── preview.ts       ← глобальные decorators, parameters
└── manager.ts       ← UI Storybook (тема, sidebar)

src/
└── components/
    └── Button/
        ├── Button.tsx
        ├── Button.stories.tsx   ← stories
        └── Button.test.tsx
```

---

### Главная конфигурация

```ts
// .storybook/main.ts
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(ts|tsx|js|jsx)",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: { autodocs: "tag" },
};

export default config;
```

---

### Базовая Story

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  component: Button,
  title: "UI/Button",
  tags: ["autodocs"],          // авто-генерация Docs page
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger"],
    },
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
    },
    isLoading: { control: "boolean" },
    children: { control: "text" },
    onClick: { action: "clicked" },  // в Actions tab
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary Button",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary",
  },
};

export const Loading: Story = {
  args: {
    variant: "primary",
    isLoading: true,
    children: "Loading...",
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
```

---

### CSF (Component Story Format)

CSF v3 — текущий стандарт:

```tsx
// 1. default export = meta
// 2. named exports = stories
// 3. story = объект с args, render, play, parameters

export default meta;
export const Story: StoryObj = { args: { ... } };
```

CSF v2 (старый, deprecated):

```tsx
export const Primary = (args) => <Button {...args} />;
Primary.args = { ... };
```

---

### args — динамические props

```tsx
export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Click",
  },
};
```

В Storybook UI — Controls panel позволяет менять args в реальном времени.

---

### argTypes — конфигурация controls

```tsx
const meta: Meta<typeof Button> = {
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary"],
      description: "Visual style of the button",
      table: { defaultValue: { summary: "primary" } },
    },
    size: { control: "radio", options: ["sm", "md", "lg"] },
    onClick: { action: "clicked" },
    children: { control: "text" },
    color: { control: "color" },
    date: { control: "date" },
    disabled: { control: "boolean" },
    
    // Скрыть из controls
    internalProp: { table: { disable: true } },
  },
};
```

---

### Decorators — обёртки

```tsx
const meta: Meta<typeof Button> = {
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: "#f5f5f5" }}>
        <Story />
      </div>
    ),
  ],
};

// Для конкретной story
export const InDarkBg: Story = {
  decorators: [
    (Story) => <div style={{ background: "#000", padding: 16 }}><Story /></div>,
  ],
};

// Глобальные — в .storybook/preview.ts
export const decorators = [
  (Story) => (
    <ThemeProvider theme={lightTheme}>
      <Story />
    </ThemeProvider>
  ),
];
```

---

### Parameters

```tsx
const meta: Meta = {
  parameters: {
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#000000" },
      ],
    },
    layout: "centered",        // или "fullscreen", "padded"
    docs: {
      description: { component: "Button — основа дизайн-системы" },
    },
    actions: { argTypesRegex: "^on[A-Z].*" },  // авто-action для on* пропов
  },
};
```

---

### Play function — interaction tests

```tsx
import { within, userEvent, expect } from "@storybook/test";

export const FilledForm: Story = {
  args: { onSubmit: fn() },  // mock function
  
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    
    await userEvent.type(canvas.getByLabelText("Email"), "test@test.com");
    await userEvent.type(canvas.getByLabelText("Password"), "secret");
    await userEvent.click(canvas.getByRole("button", { name: /login/i }));
    
    await expect(args.onSubmit).toHaveBeenCalledWith({
      email: "test@test.com",
      password: "secret",
    });
    
    await expect(canvas.getByText(/success/i)).toBeInTheDocument();
  },
};
```

Play — сценарий пользовательского поведения. Можно тестировать UI flow прямо в Storybook.

---

### Storybook Test Runner

```bash
npm i -D @storybook/test-runner
npx test-storybook
```

Запускает все play-функции как tests (Jest + Playwright). Идеально для CI.

---

### Visual Regression (Chromatic)

```bash
npm i -D chromatic
npx chromatic --project-token=xxx
```

Chromatic — сервис от создателей Storybook. Делает скриншоты всех stories, сравнивает с baseline → видит визуальные изменения.

---

### Auto-docs (autodocs)

```tsx
const meta: Meta = {
  tags: ["autodocs"],  // включить
};
```

Storybook автоматически генерирует страницу документации:
- Описание компонента (из JSDoc).
- Таблица props (из TS типов / argTypes).
- Все stories с примерами.

---

### MDX docs

```mdx
{/* Button.mdx */}
import { Meta, Canvas } from "@storybook/blocks";
import * as ButtonStories from "./Button.stories";

<Meta of={ButtonStories} />

# Button

Кнопка — основа дизайн-системы.

## Variants

<Canvas of={ButtonStories.Primary} />
<Canvas of={ButtonStories.Secondary} />

## Когда использовать

- Используй Primary для CTA.
- Secondary — для дополнительных действий.

## Anti-patterns

❌ Не используй для навигации (используй Link).
```

---

### Themes addon

```bash
npm i -D @storybook/addon-themes
```

```tsx
// .storybook/preview.ts
import { withThemeByClassName } from "@storybook/addon-themes";

export const decorators = [
  withThemeByClassName({
    themes: { light: "light-theme", dark: "dark-theme" },
    defaultTheme: "light",
  }),
];
```

В UI — кнопка переключения light/dark theme.

---

### Accessibility addon (a11y)

```bash
# В составе addon-essentials
```

Автоматически проверяет каждую story на accessibility violations (axe-core под капотом).

---

### Action addon

```tsx
{ argTypes: { onClick: { action: "clicked" } } }

// Или авто
{ parameters: { actions: { argTypesRegex: "^on.*" } } }
```

В Actions tab видны все вызовы handler'ов.

---

### Mock data

```tsx
const meta: Meta = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/users", () => HttpResponse.json([{ id: 1, name: "Alice" }])),
      ],
    },
  },
};
```

С `msw-storybook-addon` — мокай API для stories.

---

### Storybook + FSD / Atomic Design

```
Atoms/
├── Button
├── Input
└── Icon
Molecules/
├── FormField
└── SearchBar
Organisms/
├── Header
└── ProductCard
```

Структура `title` — зеркалит архитектуру:

```tsx
const meta: Meta = { title: "Atoms/Button" };
```

---

### Storybook + Vite

```bash
npx storybook@latest init --type=react-vite
```

Используется `@storybook/react-vite` — нативная интеграция с Vite. Быстрее, чем webpack-based.

---

### Storybook + Next.js

```bash
npm i -D @storybook/nextjs
```

Поддерживает Next.js Image, Link, Router из коробки.

---

### Composition

```tsx
// .storybook/main.ts
refs: {
  "design-system": {
    title: "Design System",
    url: "https://design-system.example.com",
  },
}
```

Включает stories из удалённого Storybook в свой.

---

### Deploy Storybook

```bash
npm run build-storybook
# Создаёт storybook-static/ — статический сайт
# Деплой: GitHub Pages, Vercel, Netlify, S3
```

```yaml
# .github/workflows/storybook.yml
- run: npm run build-storybook
- uses: peaceiris/actions-gh-pages@v3
  with: { publish_dir: storybook-static }
```

---

## ⚠️ Подводные камни

### 1. Stories pulling on entire app

```tsx
// ❌ Импорт большого root компонента
import App from "./App";
// Tянет в Storybook всё приложение
```

Изолируй stories — только нужные dependencies.

### 2. CSS imports в stories

```tsx
// ❌ Глобальный CSS не подгружен
import "./Button.css";
// или используй CSS Modules / styled-components
```

В preview.ts — общий CSS:

```ts
import "../src/global.css";
```

### 3. Decorators hell

```tsx
decorators: [withRouter, withTheme, withAuth, withQuery, ...]
```

Слишком много decorators → сложно дебажить.

### 4. autodocs не показывает props

Если используешь TypeScript — типы автоматически. Иначе — указывай argTypes явно.

### 5. Play functions медленные

Каждая play function = browser interaction. На больших Storybook — долго. Запускай в CI matrix.

### 6. Chromatic стоимость

Chromatic — платный для команд. Альтернативы:
- Backstop.js (open source).
- Percy.io.
- Self-hosted через Playwright.

### 7. Stories копируются в bundle

Если случайно импортируешь `*.stories.tsx` в production — увеличит bundle. Проверь, что `stories/` исключён из production build.

### 8. Mock state глобально

```tsx
// ❌ Story меняет global state → влияет на другие
export const Primary = { play: () => globalStore.setState(...) };

// ✅ Локально, через decorator с Provider
```

### 9. Hot reload flaky

Иногда HMR ломает stories. `npm run storybook -- --no-cache` — фикс.

### 10. Performance: много stories

500+ stories — Storybook становится медленным. Решения:
- Lazy loading stories.
- Отдельные Storybook для разных команд.

---

## 🔬 Тонкие моменты

**fn() для mock callbacks**

```tsx
import { fn } from "@storybook/test";

export const Story: Story = {
  args: { onClick: fn() },
  play: async ({ args }) => {
    await userEvent.click(...);
    expect(args.onClick).toHaveBeenCalled();
  },
};
```

`fn()` — лучше чем jest.fn() (работает в браузере).

**Storybook 8 features**

- React Server Components support.
- Vitest integration (replace test-runner).
- Better TypeScript performance.
- Visual tests (Chromatic-like локально).

**Story params per-component**

```tsx
const meta: Meta = {
  parameters: { layout: "centered" },  // для всех stories компонента
};

export const Story: Story = {
  parameters: { layout: "padded" },     // override для одной
};
```

**Subcomponents в одной story**

```tsx
const meta: Meta<typeof Card> = {
  component: Card,
  subcomponents: { CardHeader, CardBody, CardFooter },
};
```

Args для compound components.

**Stories для hooks**

```tsx
function HookDemo() {
  const [isOpen, toggle] = useToggle();
  return <button onClick={toggle}>{isOpen ? "Open" : "Closed"}</button>;
}

export const ToggleHookStory: Story = {
  render: () => <HookDemo />,
};
```

**Storybook + tests overlap**

Play functions могут заменить часть RTL тестов. Но не всё:
- Unit тесты — лучше Vitest/Jest.
- Integration — частично stories, частично RTL.
- E2E — Playwright/Cypress.

**Per-story controls disable**

```tsx
export const Disabled: Story = {
  args: { disabled: true },
  argTypes: { onClick: { control: false } },  // скрыть для этой
};
```

**Custom Storybook UI theme**

```ts
// .storybook/manager.ts
import { addons } from "@storybook/manager-api";
import { create } from "@storybook/theming";

addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: "My Design System",
    brandUrl: "https://example.com",
    brandImage: "/logo.png",
  }),
});
```

**Documentation workflow**

1. Designer создаёт UI в Figma.
2. Developer создаёт компонент + Story.
3. Storybook deploy → stakeholders видят.
4. Visual regression на каждый PR.

Идеально для дизайн-систем.

---

## 🧩 Задачи для закрепления

**Задача 1 — Setup Storybook**
Создай Storybook в новом Vite проекте. Создай 5 stories для разных компонентов.

**Задача 2 — Button дизайн-система**
Сделай Button с variants (primary/secondary/ghost/danger), sizes (sm/md/lg), states (loading/disabled). Stories для всех.

**Задача 3 — Form components**
Stories для Input, Select, Checkbox, FormField. Документация usage.

**Задача 4 — Compound component story**
Story для Card.Root + Card.Header + Card.Body. Показ всех вариантов composition.

**Задача 5 — Play function**
Login form со всеми полями. Play function: заполнение → submit → проверка alert "success".

**Задача 6 — MDX docs**
Создай Component.mdx с богатой документацией: примеры, do/don't, дизайн-гайды.

**Задача 7 — Themes**
Подключи addon-themes. Поддержи light/dark mode для всех компонентов.

**Задача 8 — Visual regression**
Настрой Chromatic (free tier). Сделай PR с изменением Button — увидишь diff.

**Задача 9 — A11y validation**
Включи addon-a11y. Найди компонент с нарушениями (например, низкий контраст). Исправь.

**Задача 10 — Deploy Storybook**
Build + deploy на GitHub Pages / Vercel. Раздай ссылку команде.
