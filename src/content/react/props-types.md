## 📝 Теория

### Базовые типы для пропсов

| Тип | Что включает | Когда использовать |
|---|---|---|
| `ReactNode` | JSX, string, number, null, undefined, boolean, array — **самый широкий** | children, slot props |
| `ReactElement` | JSX-элемент с типом, props, key | строго JSX (не string/null) |
| `JSX.Element` | синоним ReactElement\<any> | строго JSX |
| `ReactChild` | ReactElement \| string \| number (deprecated в 18) | редко |
| `FC<Props>` | `(props: Props) => ReactElement \| null` | function components |

```tsx
import { ReactNode, ReactElement, FC } from "react";

// ReactNode — почти всегда правильный выбор для children
type Props = { children: ReactNode };

// ReactElement — когда нужен именно JSX (например, для cloneElement)
type Props = { icon: ReactElement };

// FC — устаревший, в 18 не включает children автоматически
const Comp: FC<{ title: string }> = ({ title }) => <h1>{title}</h1>;
```

---

### Описание пропсов: type vs interface

```tsx
// type — рекомендуется для props (литералы, union, intersect)
type Props = {
  label: string;
  variant?: "primary" | "secondary";
};

// interface — нужен для расширения (extends), declaration merging
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

// type + intersection — равносильно
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};
```

В команде — выбери одно и придерживайся (например, type).

---

### Расширение HTML атрибутов

Чтобы компонент принимал все нативные атрибуты HTML-элемента:

```tsx
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

function Button({ variant = "primary", className, ...rest }: ButtonProps) {
  return <button className={`btn btn-${variant} ${className}`} {...rest} />;
}

// Использование:
<Button onClick={...} disabled type="submit" variant="primary" />
//      ↑ нативные атрибуты      ↑ кастомные
```

Часто используемые типы атрибутов:

```tsx
React.HTMLAttributes<T>              // базовые: className, id, style, on*
React.ButtonHTMLAttributes<HTMLButtonElement>
React.InputHTMLAttributes<HTMLInputElement>
React.TextareaHTMLAttributes<HTMLTextAreaElement>
React.SelectHTMLAttributes<HTMLSelectElement>
React.AnchorHTMLAttributes<HTMLAnchorElement>
React.FormHTMLAttributes<HTMLFormElement>
React.LabelHTMLAttributes<HTMLLabelElement>
React.ImgHTMLAttributes<HTMLImageElement>
```

---

### Children — несколько подходов

```tsx
// 1. ReactNode — универсально
type Props = { children: ReactNode };
<Card>{anything}</Card>

// 2. Строго один элемент
type Props = { children: ReactElement };
<Card><Icon /></Card>

// 3. Конкретный компонент (не в TS просто)
// (используй Slot pattern или discriminated union)

// 4. Функция как children (render props)
type Props = { children: (data: Data) => ReactNode };
<Fetcher>{data => <List items={data} />}</Fetcher>

// 5. Несколько именованных слотов
type Props = {
  header: ReactNode;
  body: ReactNode;
  footer?: ReactNode;
};
<Layout header={<Header />} body={<Main />} footer={<Footer />} />
```

---

### FC — почему его стали избегать

```tsx
// React 17 и раньше — FC автоматически добавлял children
const Comp: FC<{ title: string }> = ({ title, children }) => (
  <div>{title}{children}</div>
);

// React 18 — children убрали из FC!
const Comp: FC<{ title: string }> = ({ title, children }) => (
//                                              ^^^^^^^^ Property 'children' does not exist
);

// Решения:
// 1. Явно добавляй children
const Comp: FC<{ title: string; children?: ReactNode }> = ({ title, children }) => ...

// 2. PropsWithChildren утилита
import { PropsWithChildren } from "react";
const Comp: FC<PropsWithChildren<{ title: string }>> = ({ title, children }) => ...

// 3. Без FC (рекомендуется)
function Comp({ title, children }: { title: string; children: ReactNode }) {
  return <div>{title}{children}</div>;
}
```

**Почему лучше без FC:**
- TypeScript лучше выводит generic-ы для function declaration.
- Нет неявных returnType (FC всегда `ReactElement | null`).
- `defaultProps` deprecated в FC.
- Меньше шума.

---

### Возвращаемый тип компонента

```tsx
// JSX.Element — самый строгий
function Comp(): JSX.Element { return <div />; }
function Comp(): JSX.Element { return null; }  // ❌ ошибка!

// ReactNode — самый широкий
function Comp(): ReactNode { return null; }    // ✅
function Comp(): ReactNode { return "string"; } // ✅

// ReactElement | null — компромисс
function Comp(): ReactElement | null { return null; }

// Обычно — не указывай return type, TypeScript выведет
function Comp() {
  if (!data) return null;
  return <div>{data}</div>;
}
// returnType: JSX.Element | null
```

---

### Полиморфные компоненты (as prop)

Компонент может рендериться как разный HTML-элемент через `as`:

```tsx
import { ElementType, ComponentPropsWithoutRef, ComponentPropsWithRef } from "react";

type TextProps<T extends ElementType = "span"> = {
  as?: T;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children">;

function Text<T extends ElementType = "span">({ as, children, ...rest }: TextProps<T>) {
  const Tag = as ?? "span";
  return <Tag {...rest}>{children}</Tag>;
}

<Text as="h1" className="title">Title</Text>
<Text as="a" href="/about">Link</Text>
<Text>Default span</Text>
```

С поддержкой ref (forwardRef):

```tsx
import { forwardRef, ElementType, ComponentPropsWithRef, ComponentPropsWithoutRef } from "react";

type PolymorphicRef<T extends ElementType> = ComponentPropsWithRef<T>["ref"];
type PolymorphicProps<T extends ElementType, P> = P & { as?: T } & Omit<ComponentPropsWithoutRef<T>, keyof P | "as">;
type PolymorphicComponent<P> = <T extends ElementType = "div">(props: PolymorphicProps<T, P> & { ref?: PolymorphicRef<T> }) => ReactElement | null;

const Box: PolymorphicComponent<{ p?: number }> = forwardRef(
  <T extends ElementType = "div">({ as, p, ...rest }: PolymorphicProps<T, { p?: number }>, ref: PolymorphicRef<T>) => {
    const Tag = as ?? "div";
    return <Tag ref={ref} style={{ padding: p }} {...rest} />;
  }
) as any;
```

(Сложно — Radix UI и Chakra UI имеют готовые утилиты `Slot`/`PolymorphicComponentProps`.)

---

### Discriminated unions для пропсов

Когда состав пропсов зависит от какого-то поля:

```tsx
type ButtonProps =
  | { variant: "icon"; icon: ReactNode; label?: never }
  | { variant: "text"; label: string; icon?: never }
  | { variant: "icon-text"; icon: ReactNode; label: string };

function Button(props: ButtonProps) {
  if (props.variant === "icon") return <button>{props.icon}</button>;
  if (props.variant === "text") return <button>{props.label}</button>;
  return <button>{props.icon} {props.label}</button>;
}

<Button variant="icon" icon={<X />} />
<Button variant="text" label="Save" />
<Button variant="icon" label="Save" />  // ❌ TypeScript: label not allowed
```

---

### Default props и optional

```tsx
// ❌ Использование с TypeScript устарело
Button.defaultProps = { variant: "primary" };

// ✅ Default values в деструктуризации
function Button({ variant = "primary", ...rest }: ButtonProps) { ... }
```

---

### ComponentProps — извлечение пропсов

```tsx
import { ComponentProps } from "react";

type ButtonProps = ComponentProps<"button">;       // нативный button
type LinkProps = ComponentProps<typeof Link>;      // от React Router Link
type MyCompProps = ComponentProps<typeof MyComp>;  // от собственного компонента

// Расширение чужого компонента:
function FancyLink(props: ComponentProps<typeof Link> & { isExternal?: boolean }) { ... }
```

---

### ref в пропсах

```tsx
import { Ref, ForwardedRef, MutableRefObject, forwardRef } from "react";

// 1. forwardRef — стандартный подход
const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <input ref={ref} {...props} />
));

// 2. Передача ref как пропа (без forwardRef)
type Props = { inputRef?: Ref<HTMLInputElement> };
function Input({ inputRef, ...rest }: Props) {
  return <input ref={inputRef} {...rest} />;
}

// React 19+ — можно ref как обычный prop, без forwardRef
```

---

### Slot pattern (compound components)

```tsx
type CardProps = { children: ReactNode };
type CardHeaderProps = { children: ReactNode };
type CardBodyProps = { children: ReactNode };

function Card({ children }: CardProps) { return <div className="card">{children}</div>; }
function CardHeader({ children }: CardHeaderProps) { return <div className="card-header">{children}</div>; }
function CardBody({ children }: CardBodyProps) { return <div className="card-body">{children}</div>; }

Card.Header = CardHeader;
Card.Body = CardBody;

<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>
```

Типизация compound:

```tsx
function Card({ children }: { children: ReactNode }) { ... }
Card.Header = function CardHeader({ children }: { children: ReactNode }) { ... };
Card.Body = function CardBody({ children }: { children: ReactNode }) { ... };

// Или
const Card = Object.assign(CardRoot, { Header: CardHeader, Body: CardBody });
```

---

### Strict / never для исключающих пропсов

```tsx
type Props =
  | { type: "image"; src: string; alt: string }
  | { type: "video"; src: string; poster: string };

// При type="image" нельзя передать poster, при type="video" нельзя alt
```

---

### `keyof JSX.IntrinsicElements`

```tsx
type HtmlTags = keyof JSX.IntrinsicElements;
// "a" | "abbr" | ... | "div" | ... | "span" | ...

function Tag({ as, ...rest }: { as: HtmlTags } & React.HTMLAttributes<HTMLElement>) {
  const Element = as as ElementType;
  return <Element {...rest} />;
}
```

---

## ⚠️ Подводные камни

### 1. FC и children в React 18

```tsx
// ❌ В React 18 children больше не включён в FC
const Comp: FC<{}> = ({ children }) => ...  // Error

// ✅ Явно
const Comp: FC<{ children: ReactNode }> = ...
const Comp: FC<PropsWithChildren> = ...
function Comp({ children }: { children: ReactNode }) { ... }
```

### 2. JSX.Element vs ReactNode

```tsx
// ❌ Возвращает null — не подходит для JSX.Element
function Comp(): JSX.Element {
  if (!data) return null;  // Error
  return <div />;
}

// ✅ Не указывай тип, TypeScript выведет
function Comp() {
  if (!data) return null;
  return <div />;
}
```

### 3. ReactElement vs ReactNode для children

```tsx
// ❌ Слишком строго — не примет string, array, fragment
type Props = { children: ReactElement };
<Wrapper>Hello</Wrapper>;  // Error

// ✅ ReactNode для children
type Props = { children: ReactNode };
```

### 4. Расширение интерфейса с конфликтом типов

```tsx
type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  size: "sm" | "md" | "lg";  // ❌ конфликт с native size: number
};

// ✅ Omit native field
type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size: "sm" | "md" | "lg";
};
```

### 5. Ref не пробрасывается без forwardRef

```tsx
function Input(props: InputProps) {
  return <input {...props} />;
}

const ref = useRef<HTMLInputElement>(null);
<Input ref={ref} />  // ❌ ref не работает
```

Решение — forwardRef (или React 19 без него).

### 6. Polymorphic + ref + generic — сложно

Реализация `as` пропа с поддержкой ref требует много типов. Для production используй радix-style утилиты или Chakra.

### 7. defaultProps deprecated для function components

```tsx
// ❌ Deprecated
Button.defaultProps = { variant: "primary" };

// ✅ Default values в параметрах
function Button({ variant = "primary" }: Props) { ... }
```

В React 19 defaultProps удалят полностью для FC.

### 8. React.ComponentProps vs ComponentPropsWithRef

```tsx
ComponentProps<"button">         // = ComponentPropsWithRef
ComponentPropsWithRef<"button">  // включает ref
ComponentPropsWithoutRef<"button">  // без ref
```

Для polymorphic используй `WithoutRef`, чтобы избежать конфликта с собственным ref.

### 9. `JSX.Element | null` не равно `ReactNode`

```tsx
type A = JSX.Element | null;        // только JSX или null
type B = ReactNode;                 // JSX, string, number, null, undefined, array, ...

// При наследовании — A ⊂ B, но не наоборот
```

### 10. Спред пропсов на дочерний компонент скрывает невалидные

```tsx
function Wrapper(props: ButtonProps) {
  return <button {...props} variant="..." />;  // ❌ variant попадёт на DOM!
}

// ✅ Извлекай свои props и спред остального
function Wrapper({ variant, ...rest }: ButtonProps) {
  return <button {...rest} />;
}
```

DOM получит невалидный атрибут `variant=primary` → React warning.

---

## 🔬 Тонкие моменты

**ComponentType — обобщённый тип компонента**

```tsx
import { ComponentType } from "react";
type AnyComp = ComponentType<MyProps>;
// Function или Class component с такими props
```

Используется в HOC:

```tsx
function withLoader<P>(Comp: ComponentType<P & { isLoading: boolean }>) { ... }
```

**ElementRef — извлечение типа ref**

```tsx
import { ElementRef } from "react";
const ref = useRef<ElementRef<typeof MyComp>>(null);
// Тип ref-а такой же, как у MyComp
```

**Children как функция (render props)**

```tsx
type Props<T> = { children: (item: T) => ReactNode };

function Renderer<T>({ items, children }: { items: T[]; children: Props<T>["children"] }) {
  return <>{items.map(children)}</>;
}
```

**typeof Component для извлечения пропсов**

```tsx
import { Button } from "./Button";

type ButtonPropsType = ComponentProps<typeof Button>;
// Используй когда нужны те же props, но без impл. деталей
```

**Дискриминатор как key prop**

```tsx
type Props = { variant: "primary" | "secondary"; label: string };

function Button({ variant, label }: Props) {
  // Полезно: <Button key={variant}> — пересоздаётся при смене варианта
}
```

**SVG props**

```tsx
type IconProps = React.SVGProps<SVGSVGElement>;

function MyIcon(props: IconProps) {
  return <svg {...props}>...</svg>;
}

<MyIcon className="w-4 h-4" fill="currentColor" />
```

**JSX.LibraryManagedAttributes**

Внутренний механизм TypeScript для применения defaultProps. Знать необязательно, но иногда всплывает в ошибках.

**InferProps для PropTypes (legacy)**

```tsx
import PropTypes, { InferProps } from "prop-types";
const propTypes = { name: PropTypes.string.isRequired };
type Props = InferProps<typeof propTypes>;
```

В TypeScript-проектах PropTypes не нужен.

**StrictPropsWithChildren**

```tsx
type StrictPropsWithChildren<P, C = ReactNode> = P & { children: C };
// children обязателен, можно ограничить тип
```

**Цепочка интерфейсов**

```tsx
interface BaseProps { id?: string; }
interface SizedProps extends BaseProps { size?: "sm" | "md"; }
interface ButtonProps extends SizedProps { onClick?: () => void; }
// Для дизайн-систем — раздели общие props
```

---

## 🧩 Задачи для закрепления

**Задача 1 — Дизайн-система Button**
Типизированный Button с props: variant, size, isLoading, leftIcon, rightIcon. Расширяет HTMLButtonElement. Default values через деструктуризацию.

**Задача 2 — Полиморфный Box**
Реализуй Box (как в Chakra). Принимает as, поддерживает margin/padding shortcuts (m, p, mx, py). Типы должны зависеть от as.

**Задача 3 — Compound Component Tabs**
`<Tabs><Tabs.List><Tabs.Tab /></Tabs.List><Tabs.Panel /></Tabs>`. Используй Tabs.X = ... паттерн. Контекст для активного tab.

**Задача 4 — Discriminated Modal**
Modal с типами `confirm` (с onConfirm), `alert` (только onClose), `form` (с children). Discriminated union пропсов.

**Задача 5 — Slot pattern**
Реализуй Card с slots: header, content, actions. Каждый — optional ReactNode. Если slot нет — секция не рендерится.

**Задача 6 — Children as function**
Реализуй `<Mouse>{(pos) => <div>{pos.x}</div>}</Mouse>`. Children — функция с типом `(pos: { x: number; y: number }) => ReactNode`.

**Задача 7 — Recursive props (TreeView)**
Тип `TreeNode { id: string; label: string; children?: TreeNode[] }`. Компонент TreeView рендерит рекурсивно.

**Задача 8 — Strict children: only Tab inside Tabs**
TypeScript-ограничение, что внутри Tabs могут быть только Tab компоненты. Используй `ReactElement<TabProps>`.

**Задача 9 — Ref forwarding**
Реализуй Input с forwardRef. Покажи разницу с/без forwardRef для useRef из родителя.

**Задача 10 — Extending без конфликтов**
Реализуй компонент NumericInput, который принимает все props HTMLInputElement, но переопределяет type на "number" литерально и size на "sm" | "md" (без конфликта).
