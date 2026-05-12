## 📝 Теория

### Что такое React Hook Form

**React Hook Form (RHF)** — библиотека для управления формами в React. Использует **uncontrolled** подход через `ref`, минимизируя количество ре-рендеров. Лидер по производительности и DX.

**Главные плюсы:**

- ⚡ Минимум ре-рендеров (по умолчанию — только при submit / blur).
- 📦 Маленький размер (~9 KB gzip).
- 🛡️ Отличная TypeScript поддержка.
- 🔌 Интеграция с Zod, Yup, Joi.
- 🎯 Простой API: `register`, `handleSubmit`, `formState`.

---

### useForm — точка входа

```tsx
import { useForm, SubmitHandler } from "react-hook-form";

type FormData = {
  name: string;
  email: string;
  age: number;
};

function MyForm() {
  const {
    register,        // регистрация поля
    handleSubmit,    // обёртка submit
    formState,       // состояние формы (errors, isDirty, ...)
    reset,           // сброс формы
    watch,           // подписка на значения
    setValue,        // программная установка значения
    getValues,       // получить текущие значения (без подписки)
    trigger,         // программный запуск валидации
    control,         // для Controller (контролируемые компоненты)
  } = useForm<FormData>({
    defaultValues: { name: "", email: "", age: 18 },
    mode: "onSubmit",          // когда валидировать
    reValidateMode: "onChange",
  });
}
```

---

### register — основной механизм

```tsx
<input {...register("name", {
  required: "Имя обязательно",
  minLength: { value: 2, message: "Минимум 2 символа" },
  maxLength: { value: 50, message: "Максимум 50 символов" },
  pattern: { value: /^[A-Za-z]+$/, message: "Только латиница" },
  validate: (value) => value !== "admin" || "Имя 'admin' запрещено",
})} />
```

`register` возвращает объект `{ onChange, onBlur, ref, name }`, который spread'ится на input. RHF сам управляет ref-ом и читает значение через uncontrolled подход.

**Опции register:**

| Опция | Описание |
|---|---|
| `required` | string \| boolean — поле обязательно |
| `min`, `max` | number с message |
| `minLength`, `maxLength` | строка с message |
| `pattern` | regex с message |
| `validate` | функция или объект функций → возвращает true \| string |
| `valueAsNumber` | приводить к number (для type="number") |
| `valueAsDate` | приводить к Date |
| `setValueAs` | произвольное преобразование |
| `disabled` | если true → значение становится undefined и не валидируется |
| `deps` | re-trigger валидации этих полей при изменении |

---

### handleSubmit

```tsx
const onSubmit: SubmitHandler<FormData> = async (data) => {
  await api.register(data);
  reset();  // сброс к defaultValues
};

const onError: SubmitErrorHandler<FormData> = (errors) => {
  console.log("Validation errors:", errors);
};

<form onSubmit={handleSubmit(onSubmit, onError)}>
  ...
</form>
```

`handleSubmit`:
1. Запускает валидацию.
2. Если успех → вызывает `onSubmit(data)`.
3. Если ошибки → вызывает `onError(errors)` (если передан).
4. Автоматически вызывает `e.preventDefault()`.

---

### formState

```tsx
const { formState } = useForm();

formState.errors;           // объект ошибок
formState.isDirty;          // форма изменена
formState.dirtyFields;      // какие поля изменены
formState.touchedFields;    // какие поля побывали в фокусе
formState.isValid;          // форма валидна (требует mode: "onChange")
formState.isSubmitting;     // submit в процессе
formState.isSubmitted;      // submit был вызван хотя бы раз
formState.isSubmitSuccessful; // submit прошёл успешно
formState.submitCount;      // количество submit-ов
formState.defaultValues;    // дефолтные значения
```

⚠️ `formState` — proxy. Доступ к свойствам подписывает компонент на изменения. Если не используешь `isValid`, не подписываешься на него — нет лишних рендеров.

---

### watch — подписка на изменения

```tsx
const { watch } = useForm();

const allValues = watch();              // все значения, на каждое изменение
const name = watch("name");             // одно поле
const [name, email] = watch(["name", "email"]);  // несколько

// ⚠️ watch вызывает ре-рендер компонента
// useWatch — альтернатива, ре-рендерит только подписанный компонент
import { useWatch } from "react-hook-form";

function NameDisplay({ control }) {
  const name = useWatch({ control, name: "name" });
  return <p>Hello, {name}</p>;
}
// Изменение name перерендерит только NameDisplay, не родителя
```

---

### Controller — для кастомных/контролируемых компонентов

`register` работает с native input. Для UI-библиотек (MUI, Antd, react-select), которые не пробрасывают ref на input, используй `Controller`:

```tsx
import { Controller } from "react-hook-form";

<Controller
  name="select"
  control={control}
  rules={{ required: "Обязательно" }}
  defaultValue=""
  render={({ field, fieldState, formState }) => (
    <>
      <CustomSelect
        value={field.value}
        onChange={field.onChange}
        onBlur={field.onBlur}
        ref={field.ref}
      />
      {fieldState.error && <span>{fieldState.error.message}</span>}
    </>
  )}
/>
```

`field` — `{ value, onChange, onBlur, name, ref, disabled }`.

---

### Mode и ReValidateMode

```tsx
useForm({
  mode: "onSubmit",     // когда первая валидация: onSubmit | onBlur | onChange | onTouched | all
  reValidateMode: "onChange",  // когда после первого submit: onChange | onBlur | onSubmit
});
```

- `onSubmit` (по умолчанию) — валидация только при submit. Минимум рендеров, но плохой UX.
- `onChange` — валидация на каждое изменение. Хороший UX, больше рендеров.
- `onTouched` — валидация после первого blur, потом onChange. Компромисс.
- `all` — onChange + onBlur. Всё одновременно.

---

### Reset

```tsx
reset();                     // сброс к defaultValues
reset({ name: "John" });     // сброс с новыми значениями
reset({ name: "John" }, {
  keepErrors: true,          // не сбрасывать ошибки
  keepDirty: true,           // не сбрасывать isDirty
  keepValues: true,          // не сбрасывать значения
  keepDefaultValues: true,   // не менять defaultValues
  keepIsSubmitted: false,
  keepTouched: false,
  keepIsValid: false,
  keepSubmitCount: false,
});

// Сброс конкретного поля
resetField("name");
```

Типичный сценарий: после submit `reset()`, после загрузки данных с сервера `reset(data)`.

---

### setValue — программная установка

```tsx
setValue("name", "John");

setValue("name", "John", {
  shouldValidate: true,    // запустить валидацию
  shouldDirty: true,       // пометить как dirty
  shouldTouch: true,       // пометить как touched
});

// Обновление вложенного поля
setValue("user.address.city", "Moscow");
```

---

### Вложенные поля и массивы

```tsx
type FormData = {
  user: {
    name: string;
    address: { city: string; street: string };
  };
  hobbies: string[];
};

<input {...register("user.name")} />
<input {...register("user.address.city")} />
<input {...register("hobbies.0")} />
<input {...register("hobbies.1")} />
```

RHF автоматически парсит "dot notation" и собирает вложенный объект.

---

### Валидация через resolver (Zod / Yup)

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

type FormData = z.infer<typeof schema>;

const form = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

Подробнее — в файле [Validation Zod Yup](Validation%20Zod%20Yup.md).

---

### useFormContext — нести form через дерево

Большие формы можно разбить на компоненты, передавая `methods` через Context:

```tsx
import { FormProvider, useFormContext } from "react-hook-form";

function App() {
  const methods = useForm<FormData>();
  return (
    <FormProvider {...methods}>
      <PersonalInfo />
      <AddressInfo />
    </FormProvider>
  );
}

function PersonalInfo() {
  const { register } = useFormContext<FormData>();
  return <input {...register("name")} />;
}
```

---

### Async валидация

```tsx
<input {...register("username", {
  validate: async (value) => {
    const exists = await api.checkUsername(value);
    return !exists || "Имя занято";
  },
})} />
```

Можно дебаунсить:

```tsx
const debouncedCheck = useMemo(
  () => debounce(async (val: string, resolve: (v: any) => void) => {
    const exists = await api.checkUsername(val);
    resolve(!exists || "Имя занято");
  }, 500),
  []
);

<input {...register("username", {
  validate: (value) => new Promise(resolve => debouncedCheck(value, resolve)),
})} />
```

---

### Отправка только изменённых полей

```tsx
const onSubmit = (data: FormData) => {
  const dirtyFields = formState.dirtyFields;
  const changed = Object.keys(dirtyFields).reduce((acc, key) => {
    acc[key] = data[key];
    return acc;
  }, {} as Partial<FormData>);
  
  await api.update(changed);  // PATCH вместо PUT
};
```

---

### Custom server errors

После submit получили ошибку с сервера — пробрасываем в форму:

```tsx
const { setError } = useForm();

const onSubmit = async (data) => {
  try {
    await api.register(data);
  } catch (err) {
    if (err.field === "email") {
      setError("email", { type: "server", message: err.message });
    } else {
      setError("root.serverError", { type: "server", message: err.message });
    }
  }
};

{errors.root?.serverError && <Alert>{errors.root.serverError.message}</Alert>}
```

---

### Wizard формы (мульти-шаг)

```tsx
function Wizard() {
  const [step, setStep] = useState(0);
  const methods = useForm<FormData>({
    defaultValues: loadFromStorage(),
  });
  
  const next = async () => {
    const valid = await methods.trigger(stepFields[step]);
    if (valid) {
      saveToStorage(methods.getValues());
      setStep(s => s + 1);
    }
  };
  
  return (
    <FormProvider {...methods}>
      {step === 0 && <Step1 />}
      {step === 1 && <Step2 />}
      {step === 2 && <Step3 onSubmit={methods.handleSubmit(...)} />}
      <button onClick={next}>Next</button>
    </FormProvider>
  );
}
```

---

## ⚠️ Подводные камни

### 1. Спред register без unique input

```tsx
// ❌ register должен быть на одном input
<>
  <input {...register("name")} />
  <input {...register("name")} />  // ← конфликт!
</>
```

### 2. Контролируемый input с register

```tsx
// ❌ value + register = конфликт
<input value={state} {...register("field")} />

// ✅ либо register (uncontrolled)
<input {...register("field")} />

// ✅ либо useState (controlled), но без register
<input value={state} onChange={e => setState(e.target.value)} />
```

### 3. defaultValues = undefined → пустые поля

```tsx
// ❌ Без defaultValues — поля будут uncontrolled, могут быть undefined
useForm<FormData>();

// ✅ Всегда задавай явно
useForm<FormData>({ defaultValues: { name: "", email: "" } });
// React предупреждает о "switching from uncontrolled to controlled"
```

### 4. Загрузка данных асинхронно

```tsx
// ❌ Не сработает — defaultValues не реактивны
useForm({ defaultValues: data });  // data ещё undefined при первом рендере

// ✅ Используй reset() когда данные пришли
const { reset } = useForm();
useEffect(() => {
  if (data) reset(data);
}, [data, reset]);

// или Suspense + асинхронный resolver через RHF v8 (когда выйдет)
```

### 5. valueAsNumber для number input

```tsx
// ❌ Без valueAsNumber значение будет строкой даже для type="number"
<input type="number" {...register("age")} />
// data.age === "18" (string)

// ✅
<input type="number" {...register("age", { valueAsNumber: true })} />
// data.age === 18 (number)
```

### 6. NaN при пустом number поле

```tsx
<input type="number" {...register("age", { valueAsNumber: true })} />
// При пустом поле age === NaN, что ломает Zod валидацию
// Решение — z.coerce.number() или setValueAs:
{...register("age", { setValueAs: (v) => v === "" ? undefined : Number(v) })}
```

### 7. Ре-рендер при каждом keystroke с watch()

```tsx
// ❌ watch() вызывает ре-рендер всего компонента
function MyForm() {
  const { watch } = useForm();
  const name = watch("name");  // ← каждый ввод ре-рендер MyForm
  return <input {...register("name")} />;
}

// ✅ useWatch в дочернем компоненте — ре-рендер только его
function MyForm() {
  const methods = useForm();
  return (
    <FormProvider {...methods}>
      <input {...methods.register("name")} />
      <NameDisplay />
    </FormProvider>
  );
}
function NameDisplay() {
  const name = useWatch({ name: "name" });
  return <p>{name}</p>;
}
```

### 8. Поле disabled

```tsx
// ❌ Если disabled → значение становится undefined → может не пройти валидацию
<input {...register("name", { required: true, disabled: isLocked })} />
```

### 9. Глубоко вложенные поля и dot-notation

```tsx
// ❌ Если ключ содержит точку, RHF интерпретирует как вложенность
{...register("user.name")}
// Если есть поле "user.name" буквально — конфликт
```

### 10. Reset без указания значений после submit

```tsx
// После submit reset() сбросит к initial defaultValues
const onSubmit = (data) => { ...; reset(); }

// Но если defaultValues изменились (загрузили данные с сервера) — могут быть старые
// Решение: useForm({ defaultValues: data }) ИЛИ reset(data) после загрузки
```

---

## 🔬 Тонкие моменты

**Proxy formState — подписывайся только на нужное**

```tsx
const { formState: { errors, isDirty } } = useForm();
// Деструктурируем — RHF знает, на что мы подписаны
// Изменение isValid не вызовет ре-рендера

// vs
const { formState } = useForm();
formState.errors;  // подписка
// Тоже работает (Proxy), но менее явно
```

**useController — Controller через хук**

```tsx
function CustomInput({ name, control }) {
  const { field, fieldState } = useController({ name, control });
  return <input {...field} />;
}
// Альтернатива Controller с render-prop
```

**shouldUnregister**

```tsx
useForm({ shouldUnregister: true });
// При размонтировании input его значение удаляется из form state
// По умолчанию — false (значение сохраняется)
```

Полезно для условных полей.

**isLoading в submit**

`isSubmitting` true только пока `handleSubmit` обрабатывает (включая await onSubmit). Покажи loader на основе него:

```tsx
<button disabled={isSubmitting}>
  {isSubmitting ? "..." : "Submit"}
</button>
```

**isValidating**

Отдельное состояние для async валидации:

```tsx
const { formState: { isValidating } } = useForm();
{isValidating && <Spinner />}
```

**Transform значений**

```tsx
{...register("price", {
  setValueAs: (v) => parseFloat(v) || 0,
  // или
  valueAsNumber: true,
})}
```

**Performance: Controller в больших формах**

Controller — controlled, ре-рендерит на каждое изменение. Для очень больших форм лучше нативные input через register.

**Storybook тесты**

RHF можно тестировать через RTL:

```tsx
test("submits form", async () => {
  render(<MyForm onSubmit={mockSubmit} />);
  await userEvent.type(screen.getByLabelText(/email/i), "test@test.com");
  await userEvent.click(screen.getByRole("button"));
  expect(mockSubmit).toHaveBeenCalledWith({ email: "test@test.com" });
});
```

**DevTools для RHF**

```bash
npm i @hookform/devtools
```

```tsx
import { DevTool } from "@hookform/devtools";

<form>
  ...
</form>
<DevTool control={control} />
// Покажет состояние формы в правом нижнем углу
```

---

## 🧩 Задачи для закрепления

**Задача 1 — Базовая форма регистрации**
Создай форму с полями name, email, password, confirmPassword, age. Валидация через rules в register. Покажи ошибки. После submit — `reset()`.

**Задача 2 — Вложенные поля**
Форма с полем `address: { city, street, zip }`. Используй dot-notation в register. Сделай валидацию каждого подполя.

**Задача 3 — Controller для UI-библиотеки**
Используй react-select. Оберни через Controller. Сделай валидацию (required) и показ ошибок.

**Задача 4 — Условные поля**
Форма с `accountType: "personal" | "business"`. Если business — показывай дополнительно `companyName` и `vatNumber` (с required). Если personal — этих полей быть не должно в data.

**Задача 5 — Wizard форма (3 шага)**
Шаг 1 — личные данные, Шаг 2 — адрес, Шаг 3 — подтверждение. На каждом шаге `trigger()` валидирует только поля шага. Прогресс сохраняется в localStorage.

**Задача 6 — Async валидация**
Добавь поле username. При вводе с дебаунсом 500мс делай запрос `api.checkUsername`. Показывай "checking..." и результат.

**Задача 7 — Server errors**
Симулируй API, который возвращает `{ field: "email", message: "Email already exists" }`. Используй `setError` чтобы показать ошибку под полем.

**Задача 8 — useFormContext**
Раздели большую форму (15 полей) на 3 компонента. Используй FormProvider + useFormContext для доступа к методам формы.

**Задача 9 — Performance test**
Сравни два варианта: (1) `watch()` в родителе, (2) `useWatch` в дочернем компоненте. Используй React DevTools Profiler чтобы увидеть разницу в количестве рендеров.

**Задача 10 — Submit только изменённых полей**
Загрузи initial данные с сервера через reset. После изменения — отправь только `dirtyFields` через PATCH запрос (не все данные).
