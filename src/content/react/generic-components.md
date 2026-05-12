## 📝 Теория

### Зачем generic компоненты

Generic-компоненты позволяют переиспользовать UI с разными типами данных, **сохраняя типобезопасность**. Без generic — приходится дублировать компоненты или жертвовать типами через `any`.

```tsx
// ❌ Не-типизированный
function List({ items, renderItem }) {
  return <ul>{items.map(renderItem)}</ul>;
}
// renderItem: (item: any) => any

// ✅ Generic
function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map(renderItem)}</ul>;
}
// renderItem: (item: T) => ReactNode — TypeScript знает T
```

---

### Базовый синтаксис

```tsx
// Function syntax — generic после имени функции
function List<T>(props: ListProps<T>) { ... }

// Arrow syntax — нужен trailing comma в TSX (избежать ambiguity с JSX)
const List = <T,>(props: ListProps<T>) => { ... };

// Или через extends (тоже разрешает amguity)
const List = <T extends unknown>(props: ListProps<T>) => { ... };

// Не работает в .tsx — конфликт с JSX:
// const List = <T>(props: ListProps<T>) => { ... };  // ❌
```

---

### Generic List

```tsx
type ListProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  className?: string;
};

function List<T>({
  items,
  renderItem,
  keyExtractor,
  emptyMessage = "Пусто",
  className,
}: ListProps<T>) {
  if (items.length === 0) return <p>{emptyMessage}</p>;
  
  return (
    <ul className={className}>
      {items.map((item, i) => (
        <li key={keyExtractor(item)}>{renderItem(item, i)}</li>
      ))}
    </ul>
  );
}

// Использование — TypeScript выводит T автоматически
type User = { id: number; name: string };
const users: User[] = [...];

<List
  items={users}                    // T = User
  keyExtractor={u => u.id}         // u: User
  renderItem={u => <div>{u.name}</div>}  // u: User
/>

// Можно явно указать
<List<User>
  items={users}
  keyExtractor={u => u.id}
  renderItem={u => <div>{u.name}</div>}
/>
```

---

### Generic Select

```tsx
type SelectOption<T> = { value: T; label: string; disabled?: boolean };

type SelectProps<T extends string | number> = {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
};

function Select<T extends string | number>({
  options,
  value,
  onChange,
  placeholder,
}: SelectProps<T>) {
  return (
    <select
      value={String(value)}
      onChange={(e) => {
        const opt = options.find(o => String(o.value) === e.target.value);
        if (opt) onChange(opt.value);
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={String(o.value)} value={String(o.value)} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// Numeric select
<Select
  options={[{ value: 1, label: "One" }, { value: 2, label: "Two" }]}
  value={selectedId}        // ← должен быть number
  onChange={setSelectedId}  // ← (value: number) => void
/>

// Union type select
<Select<"red" | "green" | "blue">
  options={[
    { value: "red", label: "Красный" },
    { value: "green", label: "Зелёный" },
    { value: "blue", label: "Синий" },
  ]}
  value={color}
  onChange={setColor}
/>
```

---

### Generic Table

```tsx
type Column<T> = {
  key: keyof T;
  title: string;
  width?: string;
  render?: (value: T[keyof T], row: T, index: number) => ReactNode;
};

type TableProps<T> = {
  data: T[];
  columns: Column<T>[];
  rowKey: keyof T;
  onRowClick?: (row: T) => void;
};

function Table<T>({ data, columns, rowKey, onRowClick }: TableProps<T>) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={String(col.key)} style={{ width: col.width }}>
              {col.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={String(row[rowKey])} onClick={() => onRowClick?.(row)}>
            {columns.map(col => (
              <td key={String(col.key)}>
                {col.render
                  ? col.render(row[col.key], row, i)
                  : String(row[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Использование
<Table
  data={users}
  rowKey="id"
  columns={[
    { key: "id", title: "ID" },
    { key: "name", title: "Имя" },
    { 
      key: "createdAt", 
      title: "Создан",
      render: (val) => new Date(val as string).toLocaleDateString()
    },
  ]}
/>
```

---

### Generic с constraints (extends)

```tsx
// T должен иметь id
type WithId = { id: string | number };

function Cards<T extends WithId>({ items }: { items: T[] }) {
  return items.map(item => <div key={item.id}>...</div>);
}

// T должен наследовать BaseProduct
type Product = { name: string; price: number };
function ProductList<T extends Product>({ products }: { products: T[] }) { ... }
```

---

### Conditional types в generic

```tsx
// Если T — массив, выводим item type
type ListProps<T> = T extends any[]
  ? { items: T; renderItem: (item: T[0]) => ReactNode }
  : never;

function List<T>(props: ListProps<T>) { ... }
```

---

### Generic с keyof

```tsx
// Сортировка по полю
type SortableProps<T> = {
  data: T[];
  sortBy: keyof T;
  sortDirection?: "asc" | "desc";
};

function SortableList<T>({ data, sortBy, sortDirection = "asc" }: SortableProps<T>) {
  const sorted = [...data].sort((a, b) => {
    const av = a[sortBy], bv = b[sortBy];
    return (av < bv ? -1 : 1) * (sortDirection === "asc" ? 1 : -1);
  });
  return <ul>...</ul>;
}

// TypeScript ругается, если sortBy не key of T
<SortableList data={users} sortBy="invalidField" />  // ❌
<SortableList data={users} sortBy="name" />          // ✅
```

---

### Generic infinite scroll

```tsx
type InfiniteListProps<T> = {
  items: T[];
  loadMore: () => Promise<T[]>;
  renderItem: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
  hasMore: boolean;
};

function InfiniteList<T>({ items, loadMore, renderItem, keyExtractor, hasMore }: InfiniteListProps<T>) {
  // ...
}
```

---

### Generic forwardRef

```tsx
import { forwardRef, ForwardedRef } from "react";

type SelectProps<T> = { value: T; onChange: (v: T) => void };

const Select = forwardRef(<T,>(
  props: SelectProps<T>,
  ref: ForwardedRef<HTMLSelectElement>
) => {
  return <select ref={ref}>...</select>;
});

// ⚠️ Тип здесь сложный: cast или declare:
// const Select = forwardRef(InnerSelect) as <T,>(
//   props: SelectProps<T> & { ref?: ForwardedRef<HTMLSelectElement> }
// ) => ReactElement;
```

В React 19 без forwardRef будет проще.

---

### Generic Provider/Context

```tsx
function createGenericContext<T>() {
  const Ctx = createContext<T | null>(null);
  
  function Provider({ value, children }: { value: T; children: ReactNode }) {
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
  }
  
  function useGenericContext() {
    const v = useContext(Ctx);
    if (!v) throw new Error("Provider missing");
    return v;
  }
  
  return [Provider, useGenericContext] as const;
}

const [UserProvider, useUser] = createGenericContext<User>();
```

---

### Generic AsyncSelect

```tsx
type AsyncSelectProps<T> = {
  loadOptions: (search: string) => Promise<T[]>;
  getLabel: (item: T) => string;
  getValue: (item: T) => string | number;
  onChange: (item: T | null) => void;
};

function AsyncSelect<T>({ loadOptions, getLabel, getValue, onChange }: AsyncSelectProps<T>) {
  const [options, setOptions] = useState<T[]>([]);
  
  useEffect(() => {
    loadOptions("").then(setOptions);
  }, []);
  
  return (
    <select onChange={(e) => {
      const item = options.find(o => String(getValue(o)) === e.target.value) ?? null;
      onChange(item);
    }}>
      {options.map(o => (
        <option key={getValue(o)} value={getValue(o)}>{getLabel(o)}</option>
      ))}
    </select>
  );
}
```

---

### Generic Pagination

```tsx
type PaginationProps<T> = {
  data: T[];
  pageSize: number;
  renderPage: (page: T[]) => ReactNode;
};

function Pagination<T>({ data, pageSize, renderPage }: PaginationProps<T>) {
  const [page, setPage] = useState(0);
  const start = page * pageSize;
  const slice = data.slice(start, start + pageSize);
  const totalPages = Math.ceil(data.length / pageSize);
  
  return (
    <>
      {renderPage(slice)}
      <div>
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} onClick={() => setPage(i)} disabled={i === page}>
            {i + 1}
          </button>
        ))}
      </div>
    </>
  );
}

// Использование
<Pagination
  data={users}
  pageSize={10}
  renderPage={(slice) => <List items={slice} ... />}
/>
```

---

### Generic Modal

```tsx
type ModalProps<T> = {
  isOpen: boolean;
  data: T | null;
  onClose: () => void;
  renderContent: (data: T) => ReactNode;
  onConfirm?: (data: T) => void;
};

function Modal<T>({ isOpen, data, onClose, renderContent, onConfirm }: ModalProps<T>) {
  if (!isOpen || !data) return null;
  
  return (
    <Portal>
      <div onClick={onClose}>
        <div onClick={e => e.stopPropagation()}>
          {renderContent(data)}
          {onConfirm && <button onClick={() => onConfirm(data)}>Confirm</button>}
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </Portal>
  );
}
```

---

### Generic Form / Wizard

```tsx
type Step<T> = {
  title: string;
  validate: (data: Partial<T>) => boolean;
  render: (data: Partial<T>, update: (data: Partial<T>) => void) => ReactNode;
};

type WizardProps<T> = {
  steps: Step<T>[];
  onComplete: (data: T) => void;
};

function Wizard<T>({ steps, onComplete }: WizardProps<T>) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<T>>({});
  
  const update = (patch: Partial<T>) => setData(d => ({ ...d, ...patch }));
  
  return (
    <div>
      <h2>{steps[step].title}</h2>
      {steps[step].render(data, update)}
      <button onClick={() => setStep(s => s - 1)} disabled={step === 0}>Back</button>
      {step < steps.length - 1 ? (
        <button onClick={() => steps[step].validate(data) && setStep(s => s + 1)}>Next</button>
      ) : (
        <button onClick={() => onComplete(data as T)}>Submit</button>
      )}
    </div>
  );
}
```

---

## ⚠️ Подводные камни

### 1. Arrow function generic в TSX

```tsx
// ❌ Конфликт с JSX
const List = <T>(props: Props<T>) => { ... };

// ✅ Trailing comma
const List = <T,>(props: Props<T>) => { ... };

// ✅ Через extends
const List = <T extends unknown>(props: Props<T>) => { ... };

// ✅ function declaration
function List<T>(props: Props<T>) { ... }
```

### 2. forwardRef + generic

`forwardRef` "съедает" generic. Решения:
- Cast `as` для типизации.
- Не использовать forwardRef для generic, делать ref пропом (или React 19).

### 3. memo + generic

Аналогично forwardRef:

```tsx
// ❌ Generic теряется
const ListMemo = memo(List);

// ✅ Cast
const ListMemo = memo(List) as typeof List;
```

### 4. Слишком много generic

```tsx
// ❌ Усложняет API без пользы
function Comp<T, U, V, W>(props: ...) { ... }

// ✅ 1-2 generic обычно достаточно
```

### 5. TypeScript не выводит T

Если T не появляется в props — TypeScript не сможет вывести:

```tsx
// ❌ T нельзя вывести
function Show<T>(props: { onSelect: (v: T) => void }) { ... }
<Show onSelect={(v) => ...} />  // T = unknown

// ✅ Передай T хоть как-то
function Show<T>(props: { items: T[]; onSelect: (v: T) => void }) { ... }
```

### 6. Default generic value

```tsx
function List<T = unknown>(props: ListProps<T>) { ... }
// Если T не указан и не выводится — будет unknown (вместо any)
```

### 7. Generic constraint сильно ограничивает

```tsx
// ❌ Узкий constraint
function List<T extends { id: number }>(props: ListProps<T>) { ... }
// Не примет тип без id

// ✅ Шире constraint + keyExtractor
function List<T>(props: ListProps<T> & { keyExtractor: (i: T) => string }) { ... }
```

### 8. Element type vs Component type

```tsx
function Wrapper<T extends ComponentType<any>>(props: { Comp: T; ... }) {
  // T = тип компонента
}
```

### 9. PropsWithChildren + generic

```tsx
type Props<T> = PropsWithChildren<{ data: T }>;
// или
type Props<T> = { data: T; children: ReactNode };
```

### 10. Generic компонент в Storybook

Сложно типизировать meta + Story. Обычно делают конкретные истории под конкретный T:

```tsx
const Meta: Meta<typeof List<User>> = { ... };
```

---

## 🔬 Тонкие моменты

**Generic и React.memo — потеря типов**

```tsx
const Memo = React.memo(List) as typeof List;
// Без cast Memo не примет generic
```

**Discrimination через T**

```tsx
type Props<T> = T extends "a" 
  ? { variant: "a"; aProp: string }
  : { variant: "b"; bProp: number };
```

**Generic как HOC**

```tsx
function withData<T>(Comp: ComponentType<{ data: T }>) {
  return function Wrapped(props: { id: string }) {
    const data = useData<T>(props.id);
    return <Comp data={data} />;
  };
}
```

**Generic + JSX**

JSX-элементы могут принимать generic explicitly:

```tsx
<List<User> items={users} ... />
```

Но обычно T выводится автоматически.

**Tuple types**

```tsx
function useToggle<T extends boolean = boolean>(initial: T) {
  const [value, setValue] = useState<T | boolean>(initial);
  return [value, () => setValue(v => !v)] as const;
}

// Возвращает кортеж [boolean, () => void]
```

`as const` — превращает массив в tuple, сохраняя позиционные типы.

**Generic ref forwarding paradox**

Reach UI / Radix решают через type assertion в конце. Это компромисс.

**Variance**

TypeScript позволяет ковариантные/контравариантные generic:

```tsx
type Producer<T> = () => T;     // covariant в T
type Consumer<T> = (val: T) => void;  // contravariant в T
```

В React props обычно covariant.

**Generic vs Discriminated union**

Иногда DU проще generic:

```tsx
// Generic
function List<T>(...) { ... }

// vs DU (если 2-3 варианта)
type Props = { type: "users"; data: User[] } | { type: "posts"; data: Post[] };
```

Для бесконечного количества типов — generic. Для известных вариантов — DU.

**Higher-Kinded Types**

В TypeScript нет HKT (как в Haskell). Для эмуляции — type-level хаки. Большинству React компонентов это не нужно.

**Performance: generic не влияет на рантайм**

Generic — только compile-time. В runtime просто функция.

---

## 🧩 Задачи для закрепления

**Задача 1 — Generic List**
Реализуй List<T> с props: items, renderItem, keyExtractor, emptyMessage. Используй для рендера разных типов данных (users, posts, products).

**Задача 2 — Generic Table**
Table<T> с columns: { key: keyof T; title; render? }. Поддержи sort by column. Используй keyof для type safety.

**Задача 3 — Generic Select**
Select<T extends string | number> с options, value, onChange. Покажи 3 use cases: numeric IDs, union strings, enum values.

**Задача 4 — Generic Form**
Form<T> с полем onSubmit: (data: T) => void и schema (Zod). Типы должны выводиться из schema.

**Задача 5 — Generic AsyncSelect**
AsyncSelect<T> загружает options через async loadOptions(search). Debounce поиск.

**Задача 6 — Generic Pagination + List**
Скомпонуй: PaginatedList<T> = Pagination<T> + List<T>. T выводится корректно.

**Задача 7 — Generic Modal с типизированным data**
Modal<T> с data: T | null и renderContent: (data: T) => ReactNode. Используй для разных типов модалок.

**Задача 8 — useFetch<T>**
Хук useFetch<T>(url) → { data: T | null; loading; error }. Generic выводится автоматически если указать в const data = useFetch<User>().

**Задача 9 — Generic Wizard**
Wizard<T> с массивом шагов. Каждый шаг — функция render и validate. Final result типизирован T.

**Задача 10 — forwardRef + generic**
Реализуй Generic Select с forwardRef. Преодолей type-сложность через cast или явную типизацию.
