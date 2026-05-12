## 📝 Теория

### Базовая разница

В React есть два способа работы с form-полями:

| Аспект | **Controlled** | **Uncontrolled** |
|---|---|---|
| Хранилище значения | React state | Сам DOM |
| Чтение значения | `value` из state | `ref.current.value` |
| Изменение | через `onChange` → `setState` | браузер обрабатывает сам |
| Источник истины | React | DOM |
| Начальное значение | `value={initial}` | `defaultValue={initial}` |
| Re-render на каждый ввод | Да | Нет |
| Real-time валидация | Просто | Нужны хитрости |
| Производительность | Хуже на больших формах | Лучше |
| Подходит для | Сложные формы с зависимостями | Простые формы, файлы, библиотеки (RHF) |

---

### Controlled компонент — детально

```tsx
function ControlledInput() {
  const [name, setName] = useState("");

  return (
    <input
      value={name}                                  // ← значение из state
      onChange={(e) => setName(e.target.value)}    // ← state обновляется при вводе
    />
  );
}
```

**Цикл данных:**
1. Пользователь вводит символ → браузер сообщает React (через нативный input event).
2. Срабатывает `onChange` → вызывается `setName`.
3. React вызывает компонент заново (re-render).
4. У `<input value={name}>` устанавливается новое значение.
5. Отрисовка.

Без `onChange` поле станет **read-only** — React будет затирать каждый ввод значением из state.

```tsx
// ⚠️ Будет warning от React и поле залочено
<input value="hardcoded" />

// ✅ Либо добавь onChange
<input value="hardcoded" onChange={() => {}} />

// ✅ Либо явно readOnly
<input value="hardcoded" readOnly />
```

---

### Uncontrolled компонент — детально

```tsx
function UncontrolledInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    console.log(inputRef.current?.value);  // читаем напрямую из DOM
  };

  return (
    <>
      <input ref={inputRef} defaultValue="Daniil" />
      <button onClick={handleSubmit}>Submit</button>
    </>
  );
}
```

**Особенности:**
- React **не управляет** значением — пишет туда браузер.
- `defaultValue` ставится только при mount, дальнейшие изменения извне игнорируются.
- React не перерисовывается при вводе — отлично для производительности.
- Подходит, когда **значение нужно только при submit** (классический паттерн форм).

---

### Сравнение на одной форме

```tsx
// ─── Controlled ─────────────────────────────
function FormControlled() {
  const [data, setData] = useState({ name: "", email: "" });

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); console.log(data); }}>
      <input value={data.name}  onChange={update("name")}  />
      <input value={data.email} onChange={update("email")} />
      <button type="submit">Send</button>
    </form>
  );
}
// 📊 ~10 рендеров на ввод "hello@me.com"

// ─── Uncontrolled через ref ─────────────────
function FormUncontrolledRef() {
  const nameRef  = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      console.log({ name: nameRef.current?.value, email: emailRef.current?.value });
    }}>
      <input ref={nameRef}  defaultValue="" />
      <input ref={emailRef} defaultValue="" />
      <button type="submit">Send</button>
    </form>
  );
}
// 📊 0 рендеров на ввод

// ─── Uncontrolled через FormData ────────────
function FormUncontrolledFormData() {
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.currentTarget));
      console.log(data);  // { name: "...", email: "..." }
    }}>
      <input name="name"  defaultValue="" />
      <input name="email" defaultValue="" />
      <button type="submit">Send</button>
    </form>
  );
}
// 📊 0 рендеров. Самый "ванильный" способ.
```

---

### `value` vs `defaultValue`, `checked` vs `defaultChecked`

```tsx
// ─── value / defaultValue ───
<input value={x}        onChange={...} />  // controlled
<input defaultValue={x} />                  // uncontrolled, начальное значение

// ─── checked / defaultChecked ───
<input type="checkbox" checked={x}        onChange={...} />  // controlled
<input type="checkbox" defaultChecked={x} />                  // uncontrolled

// Если задать оба — defaultValue/defaultChecked будут проигнорированы
<input value={x} defaultValue="ignored" onChange={...} />
```

---

### Особые "всегда uncontrolled" случаи

**1. `<input type="file">` — невозможно сделать controlled.**

```tsx
// ❌ React не может программно установить значение file input (security)
<input type="file" value={someFile} />  // warning + не работает

// ✅ Только uncontrolled
const fileRef = useRef<HTMLInputElement>(null);
<input type="file" ref={fileRef} onChange={() => {
  const file = fileRef.current?.files?.[0];
  console.log(file);
}} />
```

**2. `contentEditable` — только uncontrolled.**

**3. Сторонние UI-библиотеки** (Datepicker, RichText editor) — часто работают в uncontrolled режиме.

---

### Контролируемая форма с одним обработчиком

```tsx
function Form() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    age: 0,
    subscribe: false,
    role: "user",
  });

  // Универсальный onChange для всех полей формы
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const newValue = type === "checkbox"
      ? (e.target as HTMLInputElement).checked
      : type === "number"
      ? Number(value)
      : value;

    setForm(prev => ({ ...prev, [name]: newValue }));
  }

  return (
    <form>
      <input  name="name"      value={form.name}      onChange={handleChange} />
      <input  name="email"     value={form.email}     onChange={handleChange} />
      <input  name="age"       value={form.age}       onChange={handleChange} type="number" />
      <input  name="subscribe" checked={form.subscribe} onChange={handleChange} type="checkbox" />
      <select name="role"      value={form.role}      onChange={handleChange}>
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
    </form>
  );
}
```

---

### Hybrid pattern (controlled + uncontrolled)

Иногда нужно: **uncontrolled внутри**, но с возможностью **переопределить снаружи** (например, для кастомного `<Input>`).

```tsx
function Input({
  value: controlledValue,
  defaultValue,
  onChange,
}: {
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
}) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internal;

  return (
    <input
      value={value}
      onChange={(e) => {
        if (!isControlled) setInternal(e.target.value);
        onChange?.(e.target.value);
      }}
    />
  );
}

// Использование как controlled
<Input value={state} onChange={setState} />

// Использование как uncontrolled
<Input defaultValue="initial" onChange={(v) => console.log(v)} />
```

Этот паттерн используется в Radix UI, MUI, RHF и почти всех серьёзных UI-библиотеках.

---

## ⚠️ Подводные камни

### 1. Switch controlled ↔ uncontrolled во время жизни компонента

```tsx
// ❌ value меняется с undefined → string → React выдаст warning
const [val, setVal] = useState<string | undefined>(undefined);
<input value={val} onChange={e => setVal(e.target.value)} />

// Warning: A component is changing an uncontrolled input to be controlled.

// ✅ Всегда инициализируй пустой строкой
const [val, setVal] = useState("");
<input value={val} onChange={e => setVal(e.target.value)} />

// ✅ Или используй ?? ""
<input value={val ?? ""} onChange={e => setVal(e.target.value)} />
```

### 2. Controlled без `onChange` = read-only

```tsx
// ❌ Warning + поле залочено
<input value={name} />

// ✅ Любой из вариантов:
<input value={name} onChange={e => setName(e.target.value)} />
<input value={name} readOnly />
<input defaultValue={name} />  // uncontrolled
```

### 3. Cursor jumping при асинхронной обработке

```tsx
// ❌ Если onChange делает что-то долгое, курсор может прыгнуть в конец строки
function Input() {
  const [text, setText] = useState("");
  return (
    <input value={text} onChange={(e) => {
      const cleaned = e.target.value.replace(/[^a-z]/gi, "");  // фильтр
      setText(cleaned);
    }} />
  );
}
// Если ввести в середину строки символ "5" — он пропадёт, курсор уйдёт в конец

// ✅ Сохраняй позицию курсора через ref
function Input() {
  const ref = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");

  return (
    <input ref={ref} value={text} onChange={(e) => {
      const pos = e.target.selectionStart;
      const cleaned = e.target.value.replace(/[^a-z]/gi, "");
      setText(cleaned);
      requestAnimationFrame(() => {
        ref.current?.setSelectionRange(pos, pos);
      });
    }} />
  );
}
```

### 4. Controlled `<select multiple>`

```tsx
// ❌ value должен быть массивом, не строкой
<select multiple value="opt1" onChange={...}>  // неправильно

// ✅ Массив значений + map для onChange
const [selected, setSelected] = useState<string[]>([]);

<select
  multiple
  value={selected}
  onChange={(e) => {
    const values = Array.from(e.target.selectedOptions, o => o.value);
    setSelected(values);
  }}
>
  <option value="a">A</option>
  <option value="b">B</option>
</select>
```

### 5. Controlled checkbox со значением `null`/`undefined`

```tsx
// ❌ checked={undefined} → React переведёт в uncontrolled
<input type="checkbox" checked={someBool} onChange={...} />
// если someBool = undefined → warning

// ✅ Явное Boolean
<input type="checkbox" checked={Boolean(someBool)} onChange={...} />
```

### 6. RHF и controlled inputs

```tsx
// ❌ Если использовать RHF (uncontrolled), но обернуть в controlled <Input> — двойное управление
const { register } = useForm();
<input value={x} onChange={...} {...register("name")} />  // конфликт

// ✅ Либо register (uncontrolled), либо Controller (для controlled-only компонентов)
<input {...register("name")} />

<Controller
  name="custom"
  control={control}
  render={({ field }) => <CustomControlledComponent {...field} />}
/>
```

### 7. Производительность: ре-рендер всей формы при каждом символе

```tsx
// ❌ 50 полей в одном state → каждый ввод = ре-рендер всей формы
function HugeForm() {
  const [form, setForm] = useState({/* 50 полей */});
  return (
    <>
      {fields.map(f => (
        <input value={form[f.name]} onChange={update(f.name)} />
      ))}
    </>
  );
}

// ✅ Решения:
// 1. Разделить state по компонентам (каждое поле — свой useState)
// 2. Использовать React Hook Form (uncontrolled под капотом)
// 3. Или useReducer + memo на полях
```

---

## 🔬 Тонкие моменты

**Когда controlled — обязательно:**
- Real-time валидация ("показывать ошибку как только пользователь печатает")
- Зависимости между полями (страна → город)
- Форматирование ввода (маски, capitalization, ограничение длины)
- Кнопка submit зависит от значений (`disabled={!form.email}`)

**Когда uncontrolled — лучше:**
- Простая форма submit-and-forget
- File inputs (всегда uncontrolled)
- Очень большие формы (100+ полей)
- Интеграция с не-React кодом

**RHF использует uncontrolled под капотом** — поэтому формы на 1000 полей работают плавно. Каждое поле через `register()` → внутри он использует `ref` + `addEventListener`, минуя React state.

**`name` атрибут — используется FormData**

```tsx
// FormData собирает все name'd inputs в форме
<form onSubmit={(e) => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  fd.get("email");                       // первое значение
  fd.getAll("tags");                     // массив (для checkbox/multiple)
  Object.fromEntries(fd);                // объект (но тeряет повторяющиеся ключи)
}}>
  <input name="email" />
  <input type="checkbox" name="tags" value="js" />
  <input type="checkbox" name="tags" value="ts" />
</form>
```

**Server Components и форма (React 19+)**

```tsx
// В RSC можно использовать action + useFormState — это новый паттерн
async function submitAction(formData: FormData) {
  "use server";
  const email = formData.get("email");
  // ...
}

<form action={submitAction}>
  <input name="email" />
  <button>Send</button>
</form>
// Без onSubmit, без useState — всё через FormData
```

---

## 🧩 Задачи для закрепления

**Задача 1 — Сравнение производительности**
Создай две идентичные формы регистрации (10 полей): одну controlled, другую uncontrolled. Открой React DevTools Profiler, поввод одинакового текста и сравни количество ре-рендеров.

**Задача 2 — Маска для телефона**
Controlled-input для телефона: при вводе автоматически форматирует в `+7 (123) 456-78-90`. Цифры можно вводить только в позиции под цифры — остальное (пробелы, скобки, дефис) добавляется автоматически. Сохрани позицию курсора при вставке маски.

**Задача 3 — Гибридный `<TextField>`**
Реализуй компонент-обёртку, который работает и как controlled, и как uncontrolled (паттерн выше). Добавь поддержку `error`, `helperText`, `label`. Покажи в Storybook оба режима.

**Задача 4 — Мульти-стейдж форма**
3-шаговый wizard (Личные данные → Адрес → Подтверждение). На каждом шаге — controlled-форма с валидацией. Между шагами state сохраняется в родителе. Кнопка "Назад" возвращает с заполненными полями.

**Задача 5 — Файловый загрузчик**
Uncontrolled `<input type="file" multiple />` с превью изображений. Покажи список выбранных файлов с возможностью удалить отдельный файл (нужно будет хранить файлы в state и пересоздавать `DataTransfer` для синхронизации с input).

**Задача 6 — Bridge native widget**
Возьми сторонний JS-виджет (например, [Pikaday](https://pikaday.com/) или [Tagify](https://yaireo.github.io/tagify/)) и оберни его в React-компонент. Реализуй и controlled, и uncontrolled API.
