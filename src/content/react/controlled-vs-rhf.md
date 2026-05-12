## 📝 Теория

### Два подхода к формам

В React есть два фундаментально разных подхода к управлению формами:

**1. Controlled (контролируемые)**

State хранится в React. Каждое изменение → ре-рендер компонента.

```tsx
const [value, setValue] = useState("");
<input value={value} onChange={(e) => setValue(e.target.value)} />
```

**2. Uncontrolled (неконтролируемые) — RHF**

State хранится в DOM. React читает значение через ref только когда нужно (submit). Минимум ре-рендеров.

```tsx
const { register, handleSubmit } = useForm();
<input {...register("name")} />
```

---

### Сравнительная таблица

| Критерий | Controlled (useState) | React Hook Form |
|---|---|---|
| **Хранение state** | React state | DOM (через ref) |
| **Ре-рендеры** | На каждое изменение | Только при submit/blur |
| **Производительность** | Хуже на больших формах | Отличная |
| **Сложность кода** | Простая | Больше API |
| **Real-time UI** | Легко (value сразу в state) | Через `watch` / `useWatch` |
| **Валидация** | Своя реализация | Встроена + интеграция Zod/Yup |
| **TypeScript** | Хорошо, нужно описать всё | Отлично с zodResolver |
| **Размер кода** | Маленький для 1 поля | ~9KB библиотека |
| **Подходит для** | 1-3 поля, real-time | Большие формы, валидация |
| **Зависимые поля** | Естественно | Через `watch`/`useWatch` |
| **DevTools** | React DevTools | @hookform/devtools |

---

### Когда что использовать

**Controlled (useState/useReducer):**

✅ **Используй когда:**
- 1-3 простых поля.
- Нужен real-time feedback (счётчик символов, динамический preview).
- Поля сильно зависят друг от друга.
- Search input (с debounce).
- Toggle / checkbox / radio.
- Форма — не главное (поиск, фильтр).

❌ **Не используй для:**
- Больших форм (10+ полей) — ре-рендеры тормозят.
- Сложной валидации.
- Динамических массивов полей.

**React Hook Form:**

✅ **Используй когда:**
- Большие формы (5+ полей).
- Сложная валидация (Zod/Yup).
- Динамические поля (useFieldArray).
- Wizard формы.
- Производительность критична.
- TypeScript типы из схемы.

❌ **Можно не использовать для:**
- Очень простых одиночных input'ов (search, toggle).
- Когда нужен максимально простой код.

---

### Controlled — детальный пример

```tsx
function ControlledForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  function validate() {
    const e: Record<string, string> = {};
    if (name.length < 2) e.name = "Минимум 2 символа";
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Неверный email";
    return e;
  }
  
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      console.log({ name, email });
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      {errors.name && <span>{errors.name}</span>}
      
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      {errors.email && <span>{errors.email}</span>}
      
      <button type="submit">Submit</button>
    </form>
  );
}

// При вводе в name → ре-рендер всей формы
// 50 keystrokes = 50 ре-рендеров
```

---

### RHF — тот же пример

```tsx
import { useForm } from "react-hook-form";

function RHFForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { name: "", email: "" },
  });
  
  const onSubmit = (data: any) => console.log(data);
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name", { 
        minLength: { value: 2, message: "Минимум 2 символа" }
      })} />
      {errors.name && <span>{errors.name.message}</span>}
      
      <input {...register("email", {
        pattern: { value: /^\S+@\S+\.\S+$/, message: "Неверный email" }
      })} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <button type="submit">Submit</button>
    </form>
  );
}

// При вводе в name → НЕ ре-рендер формы
// 50 keystrokes = 0 ре-рендеров (до submit)
```

---

### Гибридный подход

Иногда оптимально использовать оба:

```tsx
// RHF — для всей формы
// useState — для real-time зависимых вычислений

function CheckoutForm() {
  const { register, watch, handleSubmit } = useForm<FormData>();
  const [tipPercent, setTipPercent] = useState(15);  // отдельно
  
  const subtotal = watch("subtotal") ?? 0;
  const tip = (subtotal * tipPercent) / 100;
  const total = subtotal + tip;
  
  return (
    <form onSubmit={handleSubmit(...)}>
      <input type="number" {...register("subtotal", { valueAsNumber: true })} />
      
      <input
        type="range"
        value={tipPercent}
        onChange={(e) => setTipPercent(Number(e.target.value))}
      />
      
      <div>Tip: ${tip.toFixed(2)}</div>
      <div>Total: ${total.toFixed(2)}</div>
    </form>
  );
}
```

---

### Условные поля — оба подхода

**Controlled:**

```tsx
function Form() {
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  
  return (
    <>
      <select value={country} onChange={e => setCountry(e.target.value)}>...</select>
      {country === "US" && (
        <select value={state} onChange={e => setState(e.target.value)}>...</select>
      )}
    </>
  );
}
```

**RHF:**

```tsx
function Form() {
  const { register, watch } = useForm();
  const country = watch("country");
  
  return (
    <>
      <select {...register("country")}>...</select>
      {country === "US" && <select {...register("state")}>...</select>}
    </>
  );
}
```

⚠️ В RHF `watch` ре-рендерит весь компонент. Для больших форм используй `useWatch` в дочернем:

```tsx
function ConditionalState({ control }) {
  const country = useWatch({ control, name: "country" });
  if (country !== "US") return null;
  return <input {...control.register("state")} />;
}
```

---

### Сравнение производительности

```tsx
// Тест: форма из 50 полей, ввод в одно поле
// React DevTools Profiler

// Controlled:
//   Render 1: 50ms (полный ре-рендер всех 50 input'ов)
//   Render 2: 50ms
//   ... × 100 keystrokes
// Итого: 5000ms работы CPU

// RHF:
//   0 рендеров на keystroke
//   1 рендер на submit
// Итого: 50ms
```

---

### Formik vs RHF (краткое упоминание)

**Formik** — старый игрок. До RHF был стандартом.

| | Formik | RHF |
|---|---|---|
| Подход | Controlled (под капотом state) | Uncontrolled (ref) |
| Производительность | Хуже | Лучше |
| Размер | ~13KB | ~9KB |
| TypeScript | Хороший | Лучший |
| Обновления | Медленные | Активные |

В 2024+ — RHF выигрывает почти везде. Formik встречается в legacy проектах.

---

### Server-driven forms (отдельная категория)

Если форма генерируется с сервера (json schema), используй **формы-движки**:

- **react-jsonschema-form** — JSON Schema → форма.
- **uniforms** — для нескольких бэкендов (GraphQL, JSON Schema, Zod).

```tsx
const schema = {
  type: "object",
  properties: {
    name: { type: "string", title: "Имя" },
    age: { type: "number", title: "Возраст" },
  },
};

<Form schema={schema} onSubmit={...} />
```

---

## ⚠️ Подводные камни

### 1. Controlled — переключение controlled/uncontrolled

```tsx
// ❌ Если value становится undefined — React предупреждает
<input value={state ?? undefined} />

// ✅ Всегда строка
<input value={state ?? ""} />
```

### 2. RHF defaultValue vs value

```tsx
// ❌ Не используй value с register (конфликт)
<input value={...} {...register("field")} />

// ✅ defaultValues в useForm
useForm({ defaultValues: { field: "initial" } })
```

### 3. useForm без defaultValues = uncontrolled первый рендер

```tsx
// ❌ Без defaultValues input может быть uncontrolled при первом рендере
useForm<FormData>();
<input {...register("name")} />
// React: "switching from uncontrolled to controlled"

// ✅ Всегда defaultValues
useForm<FormData>({ defaultValues: { name: "" } });
```

### 4. В controlled — каждое поле = отдельный useState

```tsx
// ❌ 10 полей = 10 useState = 10 setState = много рендеров
const [name, setName] = useState("");
const [email, setEmail] = useState("");
// ... 10 раз

// ✅ Один useState с объектом
const [form, setForm] = useState({ name: "", email: "" });
const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
<input value={form.name} onChange={e => update("name", e.target.value)} />

// или useReducer для сложной логики
```

### 5. Controlled + дебаунс

```tsx
// ❌ value контролируется, дебаунс не работает напрямую
<input value={query} onChange={debouncedSetQuery} />
// debouncedSetQuery вызывается с задержкой → input "лагает"

// ✅ Раздели value и debounced value
const [input, setInput] = useState("");
const [query, setQuery] = useState("");
useDebounce(input, 300, setQuery);
// или useDeferredValue
const deferredQuery = useDeferredValue(input);

<input value={input} onChange={e => setInput(e.target.value)} />
// search использует deferredQuery
```

### 6. Performance trap в RHF — watch() в родителе

```tsx
// ❌ Каждое изменение перерендерит всю форму
function Form() {
  const { watch } = useForm();
  const allValues = watch();  // ← подписка на ВСЁ
  return <Heavy />;
}

// ✅ useWatch в дочернем
function ConditionalSection() {
  const value = useWatch({ name: "x" });
  // ...
}
```

### 7. Уход с controlled на RHF — не всегда выигрыш

Маленькая форма (2-3 поля) на RHF:
- Импорт библиотеки.
- Boilerplate (useForm, register, handleSubmit, formState).

Если performance не проблема — useState проще.

### 8. RHF + Controller — снова controlled

```tsx
// Когда оборачиваешь в Controller — поведение становится controlled
<Controller
  name="x"
  control={control}
  render={({ field }) => <CustomInput {...field} />}
/>
// CustomInput получает value, ре-рендеры на каждое изменение
// Но ре-рендеры локальны, форма не трогается
```

---

## 🔬 Тонкие моменты

**Реальность: 95% форм можно делать на RHF**

В большинстве проектов RHF — best practice. Even для маленьких — единый подход проще поддерживать.

**Controlled нужен для streaming UI**

Если показываешь preview WHILE typing (Markdown editor, JSON pretty-print, regex tester), нужен мгновенный value → controlled.

**RHF + zustand — антипаттерн в 90% случаев**

Если хранишь form state в zustand, теряешь оптимизации RHF. Используй RHF только локально, передавай результат в zustand при submit.

**useReducer для сложных контролируемых форм**

```tsx
type Action =
  | { type: "SET_FIELD"; field: string; value: any }
  | { type: "RESET" }
  | { type: "SUBMIT" };

const [state, dispatch] = useReducer(reducer, initialState);
// Контролируемая форма с предсказуемым state
```

**Submit с useTransition**

Для тяжёлых submit-ов:

```tsx
const [isPending, startTransition] = useTransition();

<form onSubmit={handleSubmit(data => {
  startTransition(() => {
    submit(data);
  });
})}>
  <button disabled={isPending}>Submit</button>
</form>
```

**Optimistic updates**

```tsx
const onSubmit = async (data) => {
  setOptimisticUI(data);  // показываем сразу
  try {
    await api.save(data);
  } catch {
    revertOptimisticUI();  // откатываем при ошибке
  }
};
```

**Контролируемый c сохранением в localStorage**

```tsx
const [draft, setDraft] = useState(() => {
  return JSON.parse(localStorage.getItem("draft") ?? "{}");
});

useEffect(() => {
  localStorage.setItem("draft", JSON.stringify(draft));
}, [draft]);
```

С RHF: подпишись через `watch` и сохраняй в storage:

```tsx
const { watch } = useForm({ defaultValues: load() });
useEffect(() => {
  const sub = watch((v) => save(v));
  return () => sub.unsubscribe();
}, [watch]);
```

**Доступность (a11y)**

И controlled, и RHF одинаково легко делают a11y:
- `<label htmlFor="...">`
- `aria-invalid` при ошибке
- `aria-describedby` ссылка на error message

---

## 🧩 Задачи для закрепления

**Задача 1 — Сравнение производительности**
Сделай форму из 30 полей двумя способами: controlled (useState) и RHF. С помощью React DevTools Profiler сравни количество рендеров при вводе в одно поле.

**Задача 2 — Search input — controlled выигрывает**
Реализуй search input с фильтрацией списка из 1000 элементов. Используй `useDeferredValue` или дебаунс. Покажи, что controlled здесь нативный путь.

**Задача 3 — Зависимые поля в RHF**
Форма Country → State. Используй `useWatch` в отдельном компоненте, чтобы не перерендеривать всю форму. Покажи в Profiler разницу с `watch` в родителе.

**Задача 4 — Markdown editor (controlled необходим)**
Реализуй split-screen Markdown editor. Слева textarea (controlled), справа preview. На каждое изменение preview обновляется. Здесь RHF был бы лишним.

**Задача 5 — Гибридная форма**
Checkout: основная форма на RHF (имя, email, адрес), но slider количества — useState (для real-time пересчёта суммы). Покажи, как комбинировать.

**Задача 6 — useReducer для сложной формы**
Реализуй конструктор: 3 типа полей (text, number, select). Каждый можно добавлять/удалять. Используй useReducer для state. Сравни с RHF + useFieldArray.

**Задача 7 — Optimistic UI**
Форма редактирования профиля. При submit показывай новые данные сразу (optimistic), при ошибке откатывай. Реализуй для controlled и RHF.

**Задача 8 — localStorage draft**
Форма-черновик. Каждое изменение сохраняется в localStorage. На перезагрузке восстанавливается. Сделай для controlled и RHF.

**Задача 9 — Migration controlled → RHF**
Возьми существующую controlled форму (5 полей с валидацией). Перепиши на RHF. Запиши, что было сложнее, что проще, что выиграл.

**Задача 10 — Performance benchmark**
Замерь время initialization, первого ввода, submit для одинаковой формы из 50 полей: useState, useReducer, RHF. Сделай таблицу результатов.
