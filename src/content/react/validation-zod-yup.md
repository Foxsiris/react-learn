## 📝 Теория

### Зачем схемы валидации

Схема валидации = единый источник правды о форме. Описываем **структуру данных и правила** один раз, получаем:

1. **Валидацию во время выполнения** (runtime).
2. **TypeScript типы** (автоматически выводятся из схемы).
3. **Сообщения об ошибках** для UI.
4. **Защиту от плохих данных** с API.

```
Без схемы:
  type FormData = { ... }      // тип
  function validate() { ... }  // ручная валидация (легко рассинхронизировать!)
  
Со схемой:
  const schema = z.object({ ... })   // одна вещь
  type FormData = z.infer<typeof schema>  // тип выводится
  schema.parse(data)                 // и валидация
```

---

### Zod vs Yup vs Joi vs Valibot

| | Zod | Yup | Joi | Valibot |
|---|---|---|---|---|
| TS-first | ✅ Да | ⚠️ Частично | ❌ Нет | ✅ Да |
| Inferred types | ✅ Идеально | ⚠️ Хуже | ❌ Нет | ✅ Да |
| Размер | ~12 KB | ~17 KB | ~145 KB (большой!) | ~1 KB (модульный) |
| Парсинг (transform) | ✅ Сильное | ✅ Есть | ✅ Есть | ✅ Есть |
| Async валидация | ✅ Да | ✅ Да | ✅ Да | ✅ Да |
| Tree-shakable | ⚠️ Слабо | ⚠️ Слабо | ❌ Нет | ✅ Идеально |
| Популярность 2024+ | 🔥 Лидер | Установлено в legacy | Backend (Node.js) | Растёт |

**Сегодня выбор по умолчанию — Zod.** Yup — если работаешь с Formik (там Yup из коробки). Valibot — если важен размер бандла.

---

### Zod basics

```ts
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().int().min(0).max(120),
  isAdmin: z.boolean(),
  role: z.enum(["admin", "user", "moderator"]),
  tags: z.array(z.string()),
  metadata: z.object({
    createdAt: z.date(),
    source: z.string().optional(),
  }),
});

type User = z.infer<typeof schema>;

const result = schema.safeParse(input);
if (result.success) {
  result.data;     // типизированный User
} else {
  result.error;    // ZodError
}

// Или throwing:
const user = schema.parse(input);  // ZodError при неудаче
```

---

### Сообщения об ошибках

```ts
z.string().min(2, "Минимум 2 символа").max(50, "Максимум 50");
z.string().email("Неверный email");
z.string().regex(/\d+/, "Должны быть цифры");

z.string({ 
  required_error: "Обязательное поле",
  invalid_type_error: "Должна быть строка",
});

z.number({ 
  required_error: "Возраст обязателен",
  invalid_type_error: "Должно быть число",
});
```

---

### Refine — кастомная валидация

```ts
const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: "Пароли не совпадают", path: ["confirmPassword"] }
);

// Async refine
z.string().refine(
  async (val) => {
    const exists = await api.checkUsername(val);
    return !exists;
  },
  { message: "Имя занято" }
);

// SuperRefine — несколько ошибок
const schema = z.object({
  password: z.string(),
  confirmPassword: z.string(),
}).superRefine((data, ctx) => {
  if (data.password.length < 8) {
    ctx.addIssue({
      path: ["password"],
      code: z.ZodIssueCode.custom,
      message: "Минимум 8 символов",
    });
  }
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      path: ["confirmPassword"],
      code: z.ZodIssueCode.custom,
      message: "Не совпадают",
    });
  }
});
```

---

### Transform — преобразование данных

```ts
const schema = z.object({
  age: z.string().transform((val) => parseInt(val, 10)),
  email: z.string().email().transform((val) => val.toLowerCase()),
  tags: z.string().transform((val) => val.split(",").map(s => s.trim())),
});

// На входе: { age: "25", email: "USER@EX.COM", tags: "a, b, c" }
// На выходе: { age: 25, email: "user@ex.com", tags: ["a", "b", "c"] }
```

---

### Coerce — мягкое приведение

```ts
z.coerce.number()  // приводит к Number(value)
z.coerce.string()  // приводит к String(value)
z.coerce.boolean() // приводит к Boolean(value)
z.coerce.date()    // приводит к new Date(value)

// Использование:
const schema = z.object({
  age: z.coerce.number().min(18),
  // На входе строка "25" → автоматически 25
});
```

Особенно полезно для форм, где input возвращает строки.

---

### Optional, Nullable, Default

```ts
z.string().optional();              // string | undefined
z.string().nullable();              // string | null
z.string().nullish();               // string | null | undefined
z.string().default("hello");        // если undefined → "hello"
z.string().catch("fallback");       // если ошибка → "fallback"

z.object({
  name: z.string(),
  bio: z.string().optional(),
}).strict();        // ругается на лишние поля
.passthrough();     // лишние поля сохраняются
.strip();           // лишние удаляются (default)
```

---

### Discriminated unions

```ts
const schema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("user"), name: z.string() }),
  z.object({ type: z.literal("admin"), permissions: z.array(z.string()) }),
]);

type T = z.infer<typeof schema>;
// { type: "user", name: string } | { type: "admin", permissions: string[] }

// type narrowing работает:
if (data.type === "admin") {
  data.permissions;  // ✅ TypeScript знает
}
```

---

### Pick, Omit, Partial, Extend

```ts
const baseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

baseSchema.pick({ name: true, email: true });
baseSchema.omit({ id: true });
baseSchema.partial();                 // все поля optional
baseSchema.required();                // все поля required
baseSchema.extend({ phone: z.string() });
baseSchema.merge(otherSchema);
```

---

### Переиспользование схем

```ts
// shared/validators.ts
export const passwordSchema = z.string()
  .min(8, "Минимум 8 символов")
  .regex(/[A-Z]/, "Минимум одна заглавная")
  .regex(/[0-9]/, "Минимум одна цифра");

export const emailSchema = z.string().email("Неверный email").toLowerCase();

// auth/signup.ts
const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: passwordSchema,
}).refine(d => d.password === d.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});
```

---

### Интеграция с React Hook Form

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  
  return (
    <form onSubmit={handleSubmit(console.log)}>
      <input {...register("email")} />
      {errors.email && <p>{errors.email.message}</p>}
      
      <input type="password" {...register("password")} />
      {errors.password && <p>{errors.password.message}</p>}
    </form>
  );
}
```

---

### Yup — основы

```ts
import * as yup from "yup";

const schema = yup.object({
  name: yup.string().required("Обязательно").min(2),
  email: yup.string().required().email("Неверный email"),
  age: yup.number().required().min(18),
  password: yup.string().min(8),
  confirmPassword: yup.string()
    .oneOf([yup.ref("password")], "Пароли не совпадают"),
});

type FormData = yup.InferType<typeof schema>;

// С RHF:
import { yupResolver } from "@hookform/resolvers/yup";
const form = useForm({ resolver: yupResolver(schema) });
```

---

### Валидация ответа API

Zod идеален не только для форм, но и для API. Получили данные с сервера — валидируем:

```ts
const UserResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime().transform(s => new Date(s)),
});

async function getUser(id: number) {
  const res = await fetch(`/api/users/${id}`);
  const json = await res.json();
  return UserResponseSchema.parse(json);  // throws при несоответствии
}

// Безопаснее:
const result = UserResponseSchema.safeParse(json);
if (!result.success) {
  Sentry.captureException(result.error);
  throw new Error("Invalid API response");
}
return result.data;
```

---

### Условная валидация

```ts
const schema = z.object({
  type: z.enum(["personal", "business"]),
  companyName: z.string().optional(),
}).refine(
  (data) => data.type !== "business" || !!data.companyName,
  { message: "Имя компании обязательно", path: ["companyName"] }
);

// Через discriminatedUnion (чище):
const schema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("personal"), name: z.string() }),
  z.object({ type: z.literal("business"), companyName: z.string().min(1) }),
]);
```

---

### Вложенные ошибки

```ts
const schema = z.object({
  user: z.object({
    address: z.object({
      city: z.string().min(1),
    }),
  }),
});

const result = schema.safeParse({ user: { address: { city: "" } } });
// result.error.issues[0].path === ["user", "address", "city"]
// result.error.issues[0].message === "String must contain at least 1 character(s)"

// Парсинг для UI:
function flattenErrors(error: z.ZodError) {
  return error.issues.reduce((acc, issue) => {
    acc[issue.path.join(".")] = issue.message;
    return acc;
  }, {} as Record<string, string>);
}
```

---

### z.union vs z.discriminatedUnion

```ts
// union — пробует каждую схему по очереди
z.union([z.string(), z.number()]);  // string | number

// discriminatedUnion — выбирает по полю-дискриминатору, быстрее и точнее
z.discriminatedUnion("type", [
  z.object({ type: z.literal("a"), ... }),
  z.object({ type: z.literal("b"), ... }),
]);
```

---

### Кастомные ZodIssue для UI

```ts
const schema = z.string().refine(val => val !== "admin", {
  message: "Имя 'admin' зарезервировано",
  params: { code: "RESERVED" },  // дополнительные данные
});

// В обработчике:
result.error.issues.forEach(issue => {
  if (issue.params?.code === "RESERVED") {
    showToast("Это имя занято");
  }
});
```

---

## ⚠️ Подводные камни

### 1. z.number() из формы

```tsx
// ❌ Без valueAsNumber или coerce
const schema = z.object({ age: z.number() });
<input type="number" {...register("age")} />
// data.age === "18" (string) → ошибка валидации

// ✅ Либо в register
{...register("age", { valueAsNumber: true })}

// ✅ Либо в схеме
const schema = z.object({ age: z.coerce.number() });
```

### 2. Пустое number поле = NaN

```tsx
// При очистке number input value === ""
// valueAsNumber превращает в NaN
// Zod (z.number()) проваливает валидацию

// ✅ z.coerce.number() с проверкой NaN
const schema = z.object({
  age: z.coerce.number().refine(v => !isNaN(v), "Введите число"),
});
```

### 3. Date из form

```tsx
// ❌ Date input возвращает string
const schema = z.object({ birthday: z.date() });

// ✅
const schema = z.object({
  birthday: z.coerce.date(),
  // или z.string().transform(s => new Date(s))
});
```

### 4. Refine не пересчитывается при изменении одного поля

```ts
const schema = z.object({
  password: z.string(),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { path: ["confirmPassword"] });

// При изменении password ошибка confirmPassword не пересчитается
// Решение в RHF: deps в register
{...register("confirmPassword", { deps: ["password"] })}
// или mode: "onChange"
```

### 5. .optional().min(2) — неочевидное поведение

```ts
z.string().min(2).optional()
// undefined ✅
// "" ❌ (не проходит min(2))
// "ab" ✅

// Если нужно: либо undefined, либо не пустая строка ≥ 2
z.string().min(2).optional().or(z.literal(""))
```

### 6. Strict vs strip

```ts
const schema = z.object({ name: z.string() });
schema.parse({ name: "John", extra: "data" });
// По умолчанию extra удаляется (strip)

schema.strict().parse({ name: "John", extra: "data" });
// ZodError — лишнее поле
```

### 7. parse vs safeParse

```ts
schema.parse(data);       // throws ZodError
schema.safeParse(data);   // { success: true, data } | { success: false, error }

// ❌ Парсинг в catch без safeParse — теряешь типизацию ошибки
try { schema.parse(data); } catch (e) { /* e: any */ }

// ✅ safeParse явный
const r = schema.safeParse(data);
if (!r.success) console.log(r.error.issues);
```

### 8. Yup transform изменяет тип

```ts
const schema = yup.object({
  age: yup.number().transform((v) => parseInt(v, 10)),
});
// type FormData = yup.InferType<typeof schema>
// age будет number — но handleSubmit получает уже преобразованное
```

### 9. Слишком сложные refine падают по производительности

```ts
// ❌ Тяжёлый refine на каждое keystroke (mode: onChange) — лагает
z.string().refine(async val => await heavyCheck(val), ...)

// ✅ Дебаунс или валидация только on blur
```

### 10. ZodIssueCode не такой же как HTML5 ошибки

При интеграции с RHF + zodResolver сообщения формируются Zod, не HTML5. Дефолтные сообщения Zod на английском. Для русского — указывай явно или используй кастомный errorMap:

```ts
import { z } from "zod";

z.setErrorMap((issue, ctx) => {
  if (issue.code === z.ZodIssueCode.too_small) {
    return { message: `Минимум ${issue.minimum} символов` };
  }
  return { message: ctx.defaultError };
});
```

---

## 🔬 Тонкие моменты

**z.infer для TypeScript типов**

```ts
const schema = z.object({ name: z.string() });
type T = z.infer<typeof schema>;  // { name: string }

// z.input — тип ВХОДНЫХ данных (до transform)
// z.output — тип ВЫХОДНЫХ (после transform), синоним z.infer
const s = z.string().transform(s => parseInt(s));
type In = z.input<typeof s>;   // string
type Out = z.output<typeof s>; // number
```

**Бандл-сайз Zod**

Zod ~12KB gzip. Не трешейкабельный (вся библиотека грузится). Для маленьких приложений — Valibot (~1KB).

**Composable schemas**

```ts
const Address = z.object({ city: z.string() });
const User = z.object({ address: Address });
// Переиспользуй базовые схемы
```

**Branded types в Zod**

```ts
const UserId = z.number().brand<"UserId">();
type UserId = z.infer<typeof UserId>;
// Nominal typing: number с brand
const id: UserId = UserId.parse(1);
```

**Schema-first или type-first**

```ts
// Schema-first (Zod way)
const schema = z.object({ name: z.string() });
type T = z.infer<typeof schema>;

// Type-first
type T = { name: string };
const schema = z.object({ name: z.string() }) satisfies z.ZodType<T>;
// Если type есть из других источников (например, generated из OpenAPI)
```

**Async в form valid**

```tsx
useForm({ 
  resolver: zodResolver(schema),
  mode: "onChange",
});
// Если в schema есть async refine — isValidating=true пока проверяет
```

**Composition refine vs superRefine**

`refine` — возвращает true/false с одной message. `superRefine` — может добавить несколько issues, удобно для нескольких связанных правил.

**Yup .lazy() для динамических схем**

```ts
yup.lazy((value) => {
  if (typeof value === "string") return yup.string();
  return yup.number();
});
```

**Валидация формы на бэкенде**

Та же Zod схема может использоваться в Node.js backend (express middleware):

```ts
// shared/schemas/user.ts
export const UserSchema = z.object({ ... });

// frontend
useForm({ resolver: zodResolver(UserSchema) });

// backend
app.post("/users", (req, res) => {
  const data = UserSchema.parse(req.body);
  // ...
});
```

**z.preprocess vs z.transform**

```ts
z.preprocess(s => Number(s), z.number());  // приведение ДО валидации
z.string().transform(s => Number(s));       // преобразование ПОСЛЕ валидации
// preprocess полезен для парсинга, transform — для преобразования валидных данных
```

---

## 🧩 Задачи для закрепления

**Задача 1 — Базовая Zod схема**
Создай схему для регистрации: name, email, password (≥8, заглавная, цифра), confirmPassword. Используй refine для проверки совпадения паролей. Интегрируй с RHF.

**Задача 2 — Переиспользуемые схемы**
Вынеси в shared/validators.ts: passwordSchema, emailSchema, phoneSchema. Используй их в формах: signup, login, profile.

**Задача 3 — Async валидация уникальности**
Добавь поле username с async refine: проверка уникальности через `api.checkUsername`. С debounce.

**Задача 4 — Discriminated union**
Форма с `accountType: "personal" | "business"`. Для business обязательно companyName + vatNumber. Для personal — firstName + lastName. Используй z.discriminatedUnion.

**Задача 5 — Coerce и transform**
Форма заказа с полями: quantity (number), price (number), total (вычисляется автоматически). Используй z.coerce для number из input'ов.

**Задача 6 — Кастомные сообщения на русском**
Подключи setErrorMap. Все стандартные сообщения Zod должны быть на русском (too_small, invalid_string и т.д.).

**Задача 7 — Yup сравнение**
Реализуй ту же форму на Yup. Сравни DX, размер бандла, удобство типизации.

**Задача 8 — Валидация API ответа**
Получи данные с https://jsonplaceholder.typicode.com/users. Опиши Zod схему. Используй safeParse и логируй несоответствия в Sentry (mock).

**Задача 9 — superRefine для сложной валидации**
Форма пароля: минимум 8 символов, заглавная, цифра, спецсимвол. Используй superRefine, чтобы показать ВСЕ нарушенные правила одновременно (а не только первое).

**Задача 10 — Schema sharing frontend/backend**
В монорепо опиши схему UserSchema в shared/. Используй её во frontend (RHF) и backend (express middleware). Покажи единое место правды.
