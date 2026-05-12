## 📝 Теория

### Зачем utility types

TypeScript предоставляет встроенные **utility types** — функции над типами, которые трансформируют их без переписывания. Это DRY на уровне типов.

```tsx
// Без utility — дублирование
type User = { id: number; name: string; email: string };
type UserCreate = { name: string; email: string };
type UserUpdate = { name?: string; email?: string };

// С utility — производные типы
type UserCreate = Omit<User, "id">;
type UserUpdate = Partial<UserCreate>;
```

---

### Категории utility types

1. **Object transformations:** Partial, Required, Readonly, Pick, Omit, Record.
2. **Union manipulation:** Exclude, Extract, NonNullable.
3. **Function types:** ReturnType, Parameters, ConstructorParameters, ThisType.
4. **String manipulation:** Uppercase, Lowercase, Capitalize, Uncapitalize.
5. **Promise/awaited:** Awaited.
6. **Custom utility:** DeepPartial, DeepReadonly, и т.д. (ваши).

---

### Partial<T> — все поля optional

```tsx
type User = { id: number; name: string; email: string };
type UserUpdate = Partial<User>;
// = { id?: number; name?: string; email?: string }

function update(id: number, data: Partial<User>) { ... }
update(1, { name: "John" });  // ✅
```

---

### Required<T> — все поля required

```tsx
type Config = { 
  host?: string; 
  port?: number; 
  ssl?: boolean;
};

type StrictConfig = Required<Config>;
// = { host: string; port: number; ssl: boolean }
```

Useful после `setDefaults`, когда optional поля гарантированно заданы.

---

### Readonly<T>

```tsx
type ImmutableUser = Readonly<User>;
// = { readonly id: number; readonly name: string; readonly email: string }

const u: ImmutableUser = { ... };
u.name = "Jane";  // ❌ Cannot assign to 'name' because it is a read-only property
```

---

### Pick<T, K>

```tsx
type User = { id: number; name: string; email: string; password: string };

type UserCard = Pick<User, "id" | "name">;
// = { id: number; name: string }

type LoginData = Pick<User, "email" | "password">;
```

---

### Omit<T, K>

```tsx
type PublicUser = Omit<User, "password">;
// = { id: number; name: string; email: string }

type UserCreate = Omit<User, "id" | "createdAt">;
```

⚠️ Omit "слабый" в плане constraint — не проверяет, что K есть в T:

```tsx
type X = Omit<User, "nonExistent">;  // не ругается
```

См. StrictOmit ниже.

---

### Record<K, V>

```tsx
type RoleLabels = Record<"admin" | "user" | "guest", string>;
// = { admin: string; user: string; guest: string }

const labels: RoleLabels = {
  admin: "Администратор",
  user: "Пользователь",
  guest: "Гость",
};

// Часто:
type Cache = Record<string, User>;  // = { [key: string]: User }
```

---

### Exclude<T, U>

```tsx
type T = "a" | "b" | "c" | "d";
type Without_ab = Exclude<T, "a" | "b">;  // "c" | "d"

// Реальный пример:
type Status = "idle" | "loading" | "success" | "error";
type ActiveStatus = Exclude<Status, "idle">;  // "loading" | "success" | "error"
```

---

### Extract<T, U>

```tsx
type T = "a" | "b" | "c" | "d";
type AB = Extract<T, "a" | "b">;  // "a" | "b"

// Извлекаем числа из union:
type Mixed = string | number | boolean;
type Nums = Extract<Mixed, number>;  // number
```

---

### NonNullable<T>

```tsx
type T = string | number | null | undefined;
type Defined = NonNullable<T>;  // string | number

function process(val: NonNullable<T>) {
  // val уверенно не null/undefined
}
```

---

### ReturnType<T>

```tsx
function getUser() { return { id: 1, name: "John" }; }
type User = ReturnType<typeof getUser>;
// = { id: number; name: string }

// Полезно для async:
async function fetchUser() { return { ... }; }
type FetchUserResult = ReturnType<typeof fetchUser>;  // Promise<...>
type User = Awaited<FetchUserResult>;  // распакованный
```

---

### Parameters<T>

```tsx
function fetch(url: string, init?: RequestInit) { ... }
type FetchParams = Parameters<typeof fetch>;
// = [url: string, init?: RequestInit]

// Извлечь конкретный параметр
type Url = Parameters<typeof fetch>[0];  // string
```

---

### Awaited<T> — распаковка Promise

```tsx
type T = Promise<User>;
type U = Awaited<T>;  // User

type DeepPromise = Promise<Promise<Promise<User>>>;
type V = Awaited<DeepPromise>;  // User (рекурсивно)

// Реальный кейс:
async function api() { return { id: 1 }; }
type ApiResult = Awaited<ReturnType<typeof api>>;  // { id: number }
```

---

### Uppercase, Lowercase, Capitalize, Uncapitalize

```tsx
type Greeting = "hello world";
type Caps = Uppercase<Greeting>;       // "HELLO WORLD"
type Lower = Lowercase<"HELLO">;       // "hello"
type Cap = Capitalize<"hello">;        // "Hello"
type UnCap = Uncapitalize<"Hello">;   // "hello"

// Template literal types + utility
type EventName<T extends string> = `on${Capitalize<T>}`;
type Click = EventName<"click">;       // "onClick"
```

---

### React-specific utility types

```tsx
import type { ComponentProps, ComponentPropsWithoutRef, ComponentPropsWithRef, ReactElement, ComponentType, PropsWithChildren } from "react";

type ButtonProps = ComponentProps<"button">;
type LinkProps = ComponentProps<typeof Link>;

type WithoutRef = ComponentPropsWithoutRef<"input">;  // без ref
type WithRef = ComponentPropsWithRef<"input">;        // с ref

type AnyComp<P> = ComponentType<P>;  // FC<P> | ClassComp<P>
type WithChildren<P> = PropsWithChildren<P>;  // P & { children?: ReactNode }
```

---

### Mapped types — основа utility

```tsx
type Partial<T> = { [K in keyof T]?: T[K] };
type Required<T> = { [K in keyof T]-?: T[K] };
type Readonly<T> = { readonly [K in keyof T]: T[K] };
type Pick<T, K extends keyof T> = { [P in K]: T[P] };
type Record<K extends keyof any, V> = { [P in K]: V };
```

Можно создавать свои:

```tsx
type Nullable<T> = { [K in keyof T]: T[K] | null };
type Stringify<T> = { [K in keyof T]: string };
```

---

### DeepPartial

Не встроен, но часто нужен:

```tsx
type DeepPartial<T> = T extends object 
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

type User = { 
  name: string;
  address: { city: string; zip: string; geo: { lat: number; lng: number } };
};

type UserPatch = DeepPartial<User>;
// Все поля любой глубины — optional
const patch: UserPatch = { address: { city: "NY" } };  // ✅
```

---

### DeepReadonly

```tsx
type DeepReadonly<T> = T extends object 
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;
```

---

### StrictOmit (с проверкой существования)

```tsx
type StrictOmit<T, K extends keyof T> = Omit<T, K>;
// Теперь K должен быть keyof T

type X = StrictOmit<User, "nonExistent">;  // ❌ Ошибка
type Y = StrictOmit<User, "password">;     // ✅
```

---

### Mutable

```tsx
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

type ImmutableUser = Readonly<User>;
type MutableUser = Mutable<ImmutableUser>;
```

---

### XOR (взаимоисключающие поля)

```tsx
type XOR<T, U> = (T & { [K in Exclude<keyof U, keyof T>]?: never })
              | (U & { [K in Exclude<keyof T, keyof U>]?: never });

type Props = XOR<{ icon: ReactNode }, { label: string }>;
// Либо icon, либо label, но не оба
```

---

### Conditional types

```tsx
type If<Cond extends boolean, A, B> = Cond extends true ? A : B;

type T = If<true, string, number>;  // string

// Реальный кейс — типы для API
type ApiResult<T> = T extends { error: infer E } ? E : T;
```

---

### Infer

```tsx
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// Извлечь тип элемента массива
type ItemType<T> = T extends (infer U)[] ? U : never;
type T = ItemType<string[]>;  // string

// Извлечь Promise тип
type Unpromise<T> = T extends Promise<infer U> ? U : T;

// Извлечь параметры функции
type FirstParam<T> = T extends (first: infer F, ...args: any[]) => any ? F : never;
```

---

### ApiResponse<T>, PaginatedResponse<T>

```tsx
type ApiResponse<T> = {
  data: T;
  status: number;
  message?: string;
};

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

type ApiError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ApiError };
```

---

### Form-related utility

```tsx
// Все поля — string (для контролируемой формы)
type FormState<T> = { [K in keyof T]: string };

// Поля + ошибки
type FormWithErrors<T> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
};
```

---

### Branded types (nominal typing)

```tsx
type Brand<T, B> = T & { __brand: B };

type UserId = Brand<number, "UserId">;
type PostId = Brand<number, "PostId">;

const uid: UserId = 123 as UserId;
const pid: PostId = 456 as PostId;

function getUser(id: UserId) { ... }
getUser(uid);   // ✅
getUser(pid);   // ❌ нельзя передать PostId
getUser(123);   // ❌ нельзя передать number
```

Полезно для разделения числовых ID разных сущностей.

---

### Type guards и predicates

```tsx
function isUser(x: unknown): x is User {
  return typeof x === "object" && x !== null && "id" in x && "name" in x;
}

if (isUser(data)) {
  data.name;  // typed as User
}

// Generic guard
function isArray<T>(x: unknown, guard: (item: unknown) => item is T): x is T[] {
  return Array.isArray(x) && x.every(guard);
}
```

---

## ⚠️ Подводные камни

### 1. Omit не проверяет ключи

```tsx
type X = Omit<User, "wrongKey">;  // ❌ не ругается, X = User

// Решение — StrictOmit
type StrictOmit<T, K extends keyof T> = Omit<T, K>;
type Y = StrictOmit<User, "wrongKey">;  // ❌ TypeScript ошибка
```

### 2. Partial deep — нужно вручную

```tsx
// ❌ Partial — только верхний уровень
type T = Partial<{ a: { b: { c: string } } }>;
// = { a?: { b: { c: string } } }  // вложенные не optional

// ✅ DeepPartial для глубины
```

### 3. Pick / Omit с union types

```tsx
type T = { a: string } | { b: number };
type X = Pick<T, "a">;  // {} (общих ключей нет)

// Используй Extract для discriminated unions:
type Action = { type: "A"; payload: string } | { type: "B"; payload: number };
type ActionA = Extract<Action, { type: "A" }>;  // { type: "A"; payload: string }
```

### 4. ReturnType с overloads

```tsx
function f(): string;
function f(x: number): number;
function f(x?: number): string | number { ... }

type R = ReturnType<typeof f>;  // string (только последнюю overload)
```

### 5. Awaited и nested promise

```tsx
// До Awaited — приходилось руками
type Unpacked<T> = T extends Promise<infer U> ? Unpacked<U> : T;

// Сейчас:
type T = Awaited<Promise<Promise<string>>>;  // string
```

### 6. Record с интервалом ключей

```tsx
type T = Record<number, string>;  // { [k: number]: string }
type U = Record<keyof User, string>;  // все поля User → string
```

### 7. Conditional types с union — distributivity

```tsx
type T = "a" | "b" | "c";
type X = T extends "a" ? true : false;
// X = boolean (не false!)
// потому что: ("a" extends "a" ? true : false) | ("b" extends "a" ? true : false) | ...
// = true | false | false = boolean

// Чтобы избежать:
type Y = [T] extends ["a"] ? true : false;  // false
```

### 8. NonNullable с union

```tsx
type T = string | null | undefined | 0 | "";
type N = NonNullable<T>;  // string | 0 | ""
// Убирает только null и undefined, не falsy!
```

### 9. Readonly не глубокий

```tsx
type T = Readonly<{ items: string[] }>;
const x: T = { items: ["a"] };
x.items = [];      // ❌
x.items.push("b"); // ✅ — массив внутри не readonly
```

### 10. infer вне conditional

```tsx
type R = infer T;  // ❌ infer только внутри extends
type R = T extends ... ? infer U : never;  // ✅
```

---

## 🔬 Тонкие моменты

**Distributive conditional types**

```tsx
type IsString<T> = T extends string ? true : false;
type T = IsString<string | number>;  // boolean (true | false)

// Wrap в tuple для non-distributive
type IsStringStrict<T> = [T] extends [string] ? true : false;
type U = IsStringStrict<string | number>;  // false
```

**Template literal types**

```tsx
type Event = "click" | "hover" | "focus";
type Handler = `on${Capitalize<Event>}`;  // "onClick" | "onHover" | "onFocus"

// Path types
type Path = `/${string}`;
const p: Path = "/users";       // ✅
const q: Path = "users";        // ❌
```

**KeyOf для filtered keys**

```tsx
type StringKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never
}[keyof T];

type User = { id: number; name: string; email: string };
type T = StringKeys<User>;  // "name" | "email"
```

**As clauses в mapped types (4.1+)**

```tsx
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type User = { name: string; age: number };
type Methods = Getters<User>;
// = { getName: () => string; getAge: () => number }
```

**satisfies operator (4.9+)**

```tsx
const config = {
  host: "localhost",
  port: 3000,
} satisfies Config;
// config — это конкретный объект (с literal types)
// + проверяется соответствие типу Config
```

В отличие от `as Config`, который "ослабляет" тип.

**Variance**

```tsx
type Producer<out T> = () => T;       // covariant
type Consumer<in T> = (val: T) => void; // contravariant
type Both<in out T> = (val: T) => T;     // invariant
```

**Recursive types**

```tsx
type JSON = 
  | string 
  | number 
  | boolean 
  | null 
  | JSON[] 
  | { [key: string]: JSON };
```

**typeof + keyof для констант**

```tsx
const ROLES = ["admin", "user", "guest"] as const;
type Role = typeof ROLES[number];  // "admin" | "user" | "guest"

const STATUS = { idle: 0, loading: 1, error: 2 } as const;
type Status = keyof typeof STATUS;  // "idle" | "loading" | "error"
type StatusCode = typeof STATUS[Status];  // 0 | 1 | 2
```

**OmitByType / PickByType**

```tsx
type OmitByType<T, V> = {
  [K in keyof T as T[K] extends V ? never : K]: T[K]
};

type T = { a: string; b: number; c: string };
type WithoutString = OmitByType<T, string>;  // { b: number }
```

---

## 🧩 Задачи для закрепления

**Задача 1 — DeepPartial<T>**
Реализуй DeepPartial для рекурсивного Partial. Тесты: вложенные объекты, массивы, Date.

**Задача 2 — DeepReadonly<T>**
То же, для Readonly. Не должен быть глубже массивов (но они тоже Readonly).

**Задача 3 — StrictOmit<T, K>**
Omit с проверкой существования K в T. Покажи разницу с обычным Omit.

**Задача 4 — ApiResponse и PaginatedResponse**
Создай generic типы для API. Используй Discriminated union для success/error. Реализуй safeParse подобный паттерн.

**Задача 5 — XOR<T, U>**
Тип взаимоисключения. Используй для Button (либо icon, либо label, не оба).

**Задача 6 — UnionToIntersection<U>**
Конвертация union в intersection (хитрый infer). Например, `"a" | "b"` → `"a" & "b"`.

**Задача 7 — ValueOf<T>**
Аналог `T[keyof T]`. `ValueOf<{ a: 1; b: 2 }>` = `1 | 2`.

**Задача 8 — Methods<T> и Properties<T>**
Разделить тип на методы (свойства типа function) и не-методы. Используй mapped types + conditional.

**Задача 9 — Generic API client типы**
Опиши Endpoint<Method, Path, Params, Body, Response>. Сделай типизированный API client с автодополнением URL.

**Задача 10 — Form библиотека типы**
Реализуй типы для формы: FormValues<T>, FormErrors<T>, FormTouched<T>, FormHandlers<T>. Используй Partial, Record, Mapped types.
