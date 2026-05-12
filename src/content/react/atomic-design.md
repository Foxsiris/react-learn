## 📝 Теория

### Что такое Atomic Design

**Atomic Design** — методология организации UI компонентов, придуманная Brad Frost (2013). Основана на химической аналогии: атомы → молекулы → организмы → шаблоны → страницы.

Цель — построить **дизайн-систему как набор переиспользуемых блоков**, организованных по уровню сложности.

```
1. Atoms       — простейшие элементы
2. Molecules   — группы атомов
3. Organisms   — сложные блоки
4. Templates   — структура страницы
5. Pages       — конкретные экраны с данными
```

---

### Atoms (атомы)

**Самые простые UI элементы**, которые нельзя разбить дальше без потери функциональности.

```
Button, Input, Label, Icon, Avatar, Badge, Spinner, Divider, Link, Heading
```

```tsx
function Button({ variant, size, children, ...rest }: ButtonProps) {
  return <button className={`btn btn-${variant} btn-${size}`} {...rest}>{children}</button>;
}

function Input({ error, ...rest }: InputProps) {
  return <input className={error ? "input-error" : "input"} {...rest} />;
}
```

**Признаки:**
- Не имеет внутренней бизнес-логики.
- Не делает API-запросов.
- Принимает только UI-props.
- Полностью переиспользуем.

---

### Molecules (молекулы)

**Группы атомов**, работающие вместе.

```
SearchBar (Input + Button)
FormField (Label + Input + ErrorMessage)
UserAvatar (Avatar + Name)
PriceTag (Icon + Number + Currency)
NavItem (Icon + Link + Badge)
```

```tsx
function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="form-field">
      <Label>{label}</Label>
      {children}
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  );
}

function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  return (
    <div className="search-bar">
      <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск..." />
      <Button onClick={() => onSearch(query)}>
        <Icon name="search" />
      </Button>
    </div>
  );
}
```

**Признаки:**
- Минимальная логика (state, обработчики).
- Решает одну конкретную задачу.
- Используется в нескольких organisms.

---

### Organisms (организмы)

**Самостоятельные секции UI**, состоящие из molecules и atoms.

```
Header (Logo + Navigation + UserMenu)
ProductCard (Image + Title + Price + AddToCart)
LoginForm (несколько FormField + Button)
Footer
DataTable
```

```tsx
function Header() {
  return (
    <header className="header">
      <Logo />
      <Navigation />
      <SearchBar onSearch={...} />
      <UserMenu />
    </header>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="card">
      <Image src={product.image} alt={product.name} />
      <Heading level={3}>{product.name}</Heading>
      <PriceTag price={product.price} />
      <Button variant="primary" onClick={() => addToCart(product)}>
        В корзину
      </Button>
    </article>
  );
}
```

**Признаки:**
- Может содержать бизнес-логику.
- Самодостаточен на странице.
- Часто привязан к domain (User, Product).

---

### Templates (шаблоны)

**Структура страницы без реальных данных** — wireframe / layout.

```tsx
function PageTemplate({ header, sidebar, content, footer }: PageTemplateProps) {
  return (
    <div className="page">
      <header>{header}</header>
      <main>
        <aside>{sidebar}</aside>
        <section>{content}</section>
      </main>
      <footer>{footer}</footer>
    </div>
  );
}

function DashboardTemplate({ user, widgets, charts }: DashboardTemplateProps) {
  return (
    <PageTemplate
      header={<Header />}
      sidebar={<Sidebar />}
      content={
        <>
          <UserGreeting user={user} />
          <Grid>
            {widgets.map(w => <WidgetCard key={w.id} widget={w} />)}
          </Grid>
          <ChartsGrid charts={charts} />
        </>
      }
      footer={<Footer />}
    />
  );
}
```

**Признаки:**
- Определяет структуру.
- Использует organisms.
- Не привязан к конкретным данным (принимает props).

---

### Pages (страницы)

**Конкретные экраны** с реальными данными — финальный продукт.

```tsx
function DashboardPage() {
  const { user } = useAuth();
  const { data: widgets } = useWidgets();
  const { data: charts } = useCharts();
  
  if (!user) return <Loader />;
  
  return <DashboardTemplate user={user} widgets={widgets} charts={charts} />;
}
```

**Признаки:**
- Привязка к роуту.
- Загрузка данных, состояние.
- Использует templates с реальными данными.

---

### Структура папок

```
src/
└── components/
    ├── atoms/
    │   ├── Button/
    │   │   ├── Button.tsx
    │   │   ├── Button.stories.tsx
    │   │   ├── Button.test.tsx
    │   │   └── index.ts
    │   ├── Input/
    │   ├── Icon/
    │   └── Avatar/
    ├── molecules/
    │   ├── FormField/
    │   ├── SearchBar/
    │   └── UserAvatar/
    ├── organisms/
    │   ├── Header/
    │   ├── ProductCard/
    │   └── LoginForm/
    ├── templates/
    │   ├── PageTemplate/
    │   └── DashboardTemplate/
    └── pages/
        ├── HomePage/
        └── DashboardPage/
```

---

### Atomic Design + Storybook

```tsx
// Button.stories.tsx
export default {
  title: "Atoms/Button",
  component: Button,
} as Meta;

export const Primary: Story = { args: { variant: "primary", children: "Click" } };
export const Secondary: Story = { args: { variant: "secondary", children: "Click" } };
```

В Storybook — структура зеркалит Atomic Design:

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

Идеальная документация дизайн-системы.

---

### Atomic Design + FSD

Совместимы! Atomic Design — внутри `shared/ui` (для UIKit), FSD — для всего остального:

```
src/
├── pages/          ← FSD
├── widgets/        ← FSD
├── features/       ← FSD
├── entities/       ← FSD
└── shared/
    └── ui/         ← Atomic Design
        ├── atoms/
        ├── molecules/
        └── organisms/
```

---

### Упрощённые варианты

В реальных проектах часто используют **3 уровня** вместо 5:

```
1. atoms      — UIKit
2. components — molecules + organisms
3. pages
```

Templates обычно вырождаются в layout components, pages — в роуты.

---

### Когда Atomic Design подходит

✅ **Да:**
- Дизайн-системы.
- Большие приложения с переиспользуемым UI.
- Stogrybook + designers + developers.
- Крупные команды.

❌ **Может быть избыточно:**
- Маленькие проекты.
- Проекты, где UI компоненты используются только один раз.
- Прототипы.

---

### Чем отличается от других подходов

| Подход | Принцип |
|---|---|
| Atomic Design | По сложности UI |
| FSD | По бизнес-функциональности |
| Domain-Driven | По бизнес-моделям |
| Just folders | Без структуры |

Atomic Design — UI-centric. FSD — business-centric. **Они дополняют друг друга**.

---

### Variants и State в atoms

```tsx
type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

function Button({ variant = "primary", size = "md", isLoading, ...rest }: ButtonProps) {
  // ...
}
```

Определи все варианты в design system (Storybook controls помогает).

---

### Design tokens

```ts
// shared/ui/tokens.ts
export const tokens = {
  colors: {
    primary: { 50: "#...", 500: "#...", 900: "#..." },
    gray: { 50: "#...", 500: "#...", 900: "#..." },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 32 },
  fontSize: { sm: "14px", md: "16px", lg: "20px" },
  borderRadius: { sm: 4, md: 8, lg: 16 },
};
```

Все atoms используют tokens — единый язык дизайна.

С Tailwind tokens определены в `tailwind.config.ts`.

---

### Compound atoms

Часть atoms могут быть compound:

```tsx
<Card>
  <Card.Header>...</Card.Header>
  <Card.Body>...</Card.Body>
  <Card.Footer>...</Card.Footer>
</Card>
```

Card — molecule по сложности, но логически atom.

---

## ⚠️ Подводные камни

### 1. Жёсткая классификация

Не каждый компонент чётко атом или молекула. Не трать время на спор.

```
SearchBar — atom или molecule?
Footer    — organism или molecule?
```

Решай прагматично. Если сомневаешься — molecule.

### 2. Atoms с бизнес-логикой

```tsx
// ❌ Atom не должен делать fetch
function UserAvatar({ userId }: { userId: number }) {
  const user = useUser(userId);
  return <img src={user.avatar} />;
}

// ✅ Принимает данные через props
function UserAvatar({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} />;
}

// Логика — в organism, который использует atom
```

### 3. Слишком много вариантов в одном atom

```tsx
// ❌ Button с 50 props
<Button variant size leftIcon rightIcon iconOnly fullWidth borderless ...

// ✅ Раздели на несколько компонентов
<Button>...</Button>
<IconButton icon={...} />
<TextButton>...</TextButton>
```

### 4. Templates с данными

```tsx
// ❌ Template получает users из useState
function DashboardTemplate() {
  const [users, setUsers] = useState([]);
  ...
}

// ✅ Template — pure props
function DashboardTemplate({ users, onUserClick }: Props) { ... }
```

### 5. Pages без template

```tsx
// ❌ Page = весь UI
function DashboardPage() {
  return (
    <div>
      <Header />
      <Sidebar />
      ...500 строк JSX
    </div>
  );
}

// ✅ Page = data + composition
function DashboardPage() {
  const data = useData();
  return <DashboardTemplate {...data} />;
}
```

### 6. Молекулы наследуют атомы

```tsx
// ❌ Не нужно — composition вместо inheritance
class FormInput extends Input { ... }

// ✅
function FormField({ label }) {
  return <><Label>{label}</Label><Input /></>;
}
```

### 7. Все компоненты в shared/ui

При FSD не все компоненты — `shared/ui`. UserCard, ProductCard — это **entities**, не shared.

```
✅
shared/ui/Button       ← переиспользуемый
entities/user/UserCard ← привязан к domain
```

### 8. Atomic Design без Storybook = слабая выгода

Главная польза Atomic Design — **документация**. Без Storybook (или аналога) выигрыш минимальный.

### 9. Изменение atom ломает много мест

```tsx
// Изменил Button API → 100 мест нужно обновить
```

Decisions atoms — на forever. Думай.

### 10. Pages внутри components/

В FSD — `pages/` это отдельный слой, не подпапка `components/`.

```
❌ components/pages/HomePage
✅ pages/home/HomePage
```

Atomic Design предлагает первое, FSD — второе.

---

## 🔬 Тонкие моменты

**Tailwind + Atomic Design**

```tsx
function Button({ variant }) {
  return <button className={cn("rounded px-4 py-2", {
    "bg-primary text-white": variant === "primary",
    "bg-gray-200": variant === "secondary",
  })}>...</button>;
}
```

Tailwind упрощает создание atoms — не нужны CSS файлы.

**Headless UI + Atomic**

```
shared/ui/atoms/
├── Button.tsx     ← стилизация
├── Dialog.tsx     ← Radix Dialog + стилизация
└── Tooltip.tsx    ← Radix Tooltip + стилизация
```

Atoms = headless + styling.

**Variants library**

`class-variance-authority` (cva), `tailwind-variants` помогают организовать варианты:

```ts
import { cva } from "class-variance-authority";

const button = cva("rounded", {
  variants: {
    variant: { primary: "bg-blue-500", secondary: "bg-gray-200" },
    size: { sm: "px-2 py-1", md: "px-4 py-2", lg: "px-6 py-3" },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

function Button({ variant, size, ...rest }) {
  return <button className={button({ variant, size })} {...rest} />;
}
```

**Atomic Design = старая идея, всё ещё актуальна**

Появился в 2013, но принципы вечные. Modern frameworks (Material UI, Chakra UI) построены по похожим принципам.

**Page vs Container**

В Atomic Design `pages/` — finalUI с данными. Похоже на Container/Presentational: Page = Container, Template = Presentational.

**Shadow DOM / Web Components**

Atomic Design частично подходит для Web Components. Atoms = разные кастомные элементы.

**Сама структура important или принцип?**

Кричишь "у меня нет таких папок!" — но это не главное. Главное — концепция переиспользуемых блоков по уровню сложности.

**Кейс — уход от Atomic**

Многие команды переходят с Atomic на FSD/co-located. Atomic подходит если есть отдельная design system команда.

**Naming conventions**

```
atoms/Button.tsx           ← PascalCase
atoms/Button/index.tsx
molecules/SearchBar/       ← все в папке
```

Унифицируй внутри проекта.

---

## 🧩 Задачи для закрепления

**Задача 1 — Дизайн-система с нуля**
Создай дизайн-систему интернет-магазина. Минимум: 5 atoms, 3 molecules, 2 organisms, 1 template, 1 page.

**Задача 2 — Storybook setup**
Настрой Storybook. Создай stories для каждого atom/molecule. Используй controls для variants.

**Задача 3 — Refactor existing app**
Возьми существующее приложение. Реструктурируй компоненты по Atomic Design. Запиши, что было сложно.

**Задача 4 — Design tokens**
Создай tokens.ts с цветами, отступами, шрифтами. Все atoms используют только tokens, никаких hardcoded значений.

**Задача 5 — CVA variants**
Используй class-variance-authority для Button. Настрой variants (primary/secondary/ghost) и sizes (sm/md/lg).

**Задача 6 — Compound atom**
Реализуй Card как compound: `<Card><Card.Image/><Card.Title/><Card.Body/><Card.Actions/></Card>`.

**Задача 7 — Template + Page**
Сделай DashboardTemplate с slots (header, sidebar, content). DashboardPage — заполняет данными.

**Задача 8 — Atom с a11y**
Реализуй Tooltip atom с правильной a11y (ARIA, keyboard). Используй Radix Tooltip как базу.

**Задача 9 — Atomic + FSD**
В FSD проекте создай shared/ui/ по Atomic Design. Используй atoms в widgets/features.

**Задача 10 — Документация**
Для каждого atom напиши: API, examples, do's & don'ts. В Storybook MDX или в README.
