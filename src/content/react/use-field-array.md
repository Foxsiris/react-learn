## 📝 Теория

### Что такое useFieldArray

`useFieldArray` — хук React Hook Form для работы с **массивами полей**. Поддерживает добавление, удаление, перестановку, замену элементов с сохранением валидации, dirty state и focus management.

**Применения:**

- Список адресов / телефонов.
- Конструктор резюме (опыт работы, образование).
- Корзина товаров.
- Builder форм / опросов.
- Список членов команды.
- Динамические таблицы.

```
type FormData = {
  users: { name: string; email: string }[];
};

const { fields, append, remove, move } = useFieldArray({
  control,
  name: "users",
});
```

---

### API useFieldArray

```tsx
const {
  fields,    // массив элементов с уникальным id
  append,    // добавить в конец
  prepend,   // добавить в начало
  insert,    // вставить по индексу
  remove,    // удалить по индексу (или несколько)
  move,      // переместить с одного индекса на другой
  swap,      // поменять местами два индекса
  update,    // заменить элемент по индексу
  replace,   // заменить весь массив
} = useFieldArray({
  control,
  name: "users",
  // keyName: "id"  — имя поля для key (default: "id")
  // shouldUnregister: false
});
```

---

### Базовый пример

```tsx
import { useForm, useFieldArray } from "react-hook-form";

type FormData = {
  users: { name: string; email: string; role: string }[];
};

function TeamForm() {
  const { register, control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { users: [{ name: "", email: "", role: "user" }] },
  });
  
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "users",
  });
  
  return (
    <form onSubmit={handleSubmit(console.log)}>
      {fields.map((field, index) => (
        <div key={field.id}>  {/* ВАЖНО: field.id, не index */}
          <input
            {...register(`users.${index}.name` as const, { required: "Имя обязательно" })}
            placeholder="Имя"
          />
          {errors.users?.[index]?.name && <span>{errors.users[index]!.name!.message}</span>}
          
          <input
            type="email"
            {...register(`users.${index}.email` as const, { required: true })}
            placeholder="Email"
          />
          
          <select {...register(`users.${index}.role` as const)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          
          <button type="button" onClick={() => remove(index)}>Удалить</button>
          {index > 0 && (
            <button type="button" onClick={() => move(index, index - 1)}>↑</button>
          )}
          {index < fields.length - 1 && (
            <button type="button" onClick={() => move(index, index + 1)}>↓</button>
          )}
        </div>
      ))}
      
      <button
        type="button"
        onClick={() => append({ name: "", email: "", role: "user" })}
      >
        + Добавить
      </button>
      
      <button type="submit">Сохранить</button>
    </form>
  );
}
```

---

### Field id — критически важно

```tsx
// ❌ key={index} — при перестановке/удалении React теряет связь с DOM
{fields.map((field, index) => (
  <div key={index}>...</div>
))}

// ✅ key={field.id} — уникальный stable id, генерируется RHF
{fields.map((field, index) => (
  <div key={field.id}>...</div>
))}
```

`field.id` — UUID, который RHF создаёт при добавлении. Он стабильный между ре-рендерами.

⚠️ Не путай с `id` поля в data — это именно meta-поле от RHF.

---

### Append / Prepend / Insert

```tsx
append({ name: "", email: "" });           // в конец
append({ name: "", email: "" }, { focusIndex: -1 });  // фокус на новом элементе
append([item1, item2]);                     // несколько

prepend({ name: "", email: "" });          // в начало
insert(2, { name: "", email: "" });        // вставить по индексу
insert(2, [item1, item2]);                 // несколько

// Без auto-focus
append(item, { shouldFocus: false });
```

---

### Remove

```tsx
remove(0);              // один по индексу
remove([0, 2, 5]);      // несколько
remove();               // все
```

---

### Move / Swap

```tsx
move(0, 3);             // элемент с индекса 0 переместить на индекс 3
swap(0, 1);             // поменять местами два элемента
```

---

### Update / Replace

```tsx
update(2, { name: "John", email: "j@j.com" });  // заменить по индексу
replace([item1, item2, item3]);                  // полностью заменить массив
```

---

### Drag & drop

С `react-beautiful-dnd` или `dnd-kit`:

```tsx
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

<DragDropContext onDragEnd={(result) => {
  if (!result.destination) return;
  move(result.source.index, result.destination.index);
}}>
  <Droppable droppableId="list">
    {(provided) => (
      <div ref={provided.innerRef} {...provided.droppableProps}>
        {fields.map((field, index) => (
          <Draggable key={field.id} draggableId={field.id} index={index}>
            {(prov) => (
              <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                <input {...register(`items.${index}.name`)} />
              </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
</DragDropContext>
```

---

### Вложенные массивы

```tsx
type FormData = {
  sections: {
    title: string;
    items: { name: string; price: number }[];
  }[];
};

function SectionsForm() {
  const { control, register } = useForm<FormData>({
    defaultValues: { sections: [{ title: "", items: [{ name: "", price: 0 }] }] },
  });
  
  const { fields: sections, append: appendSection } = useFieldArray({
    control, name: "sections",
  });
  
  return (
    <>
      {sections.map((section, sectionIndex) => (
        <Section key={section.id} sectionIndex={sectionIndex} control={control} register={register} />
      ))}
      <button onClick={() => appendSection({ title: "", items: [] })}>+ Section</button>
    </>
  );
}

function Section({ sectionIndex, control, register }) {
  const { fields: items, append } = useFieldArray({
    control,
    name: `sections.${sectionIndex}.items`,
  });
  
  return (
    <fieldset>
      <input {...register(`sections.${sectionIndex}.title`)} />
      {items.map((item, itemIndex) => (
        <div key={item.id}>
          <input {...register(`sections.${sectionIndex}.items.${itemIndex}.name`)} />
          <input type="number" {...register(`sections.${sectionIndex}.items.${itemIndex}.price`, { valueAsNumber: true })} />
        </div>
      ))}
      <button onClick={() => append({ name: "", price: 0 })}>+ Item</button>
    </fieldset>
  );
}
```

---

### Валидация массива через Zod

```tsx
const schema = z.object({
  users: z.array(
    z.object({
      name: z.string().min(2, "Минимум 2 символа"),
      email: z.string().email("Неверный email"),
    })
  ).min(1, "Минимум 1 пользователь").max(10, "Максимум 10"),
});

const form = useForm({ resolver: zodResolver(schema) });

// Ошибка массива:
errors.users?.message;            // "Минимум 1 пользователь"
errors.users?.[0]?.name?.message; // "Минимум 2 символа"
```

---

### Подсчёт суммы (real-time)

```tsx
function OrderForm() {
  const { register, control, watch } = useForm<{
    items: { name: string; quantity: number; price: number }[];
  }>({
    defaultValues: { items: [{ name: "", quantity: 1, price: 0 }] },
  });
  
  const { fields, append } = useFieldArray({ control, name: "items" });
  const items = watch("items");  // подписка на массив
  
  const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  
  return (
    <>
      {fields.map((field, i) => (
        <div key={field.id}>
          <input {...register(`items.${i}.name`)} />
          <input type="number" {...register(`items.${i}.quantity`, { valueAsNumber: true })} />
          <input type="number" {...register(`items.${i}.price`, { valueAsNumber: true })} />
        </div>
      ))}
      <div>Total: ${total.toFixed(2)}</div>
      <button onClick={() => append({ name: "", quantity: 1, price: 0 })}>+</button>
    </>
  );
}

// ⚠️ watch() ре-рендерит всю форму. Для больших списков — используй useWatch локально:
function Total({ control }) {
  const items = useWatch({ control, name: "items" });
  const total = items.reduce(...);
  return <div>Total: ${total}</div>;
}
```

---

### Условные поля внутри массива

```tsx
type FormData = {
  contacts: {
    type: "email" | "phone";
    value: string;
  }[];
};

function Form() {
  const { register, control, watch } = useForm<FormData>({
    defaultValues: { contacts: [{ type: "email", value: "" }] },
  });
  const { fields, append } = useFieldArray({ control, name: "contacts" });
  
  return (
    <>
      {fields.map((field, i) => {
        const type = watch(`contacts.${i}.type`);
        return (
          <div key={field.id}>
            <select {...register(`contacts.${i}.type`)}>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>
            <input
              type={type === "email" ? "email" : "tel"}
              placeholder={type === "email" ? "you@example.com" : "+1 234"}
              {...register(`contacts.${i}.value`)}
            />
          </div>
        );
      })}
    </>
  );
}
```

---

### Изоляция компонента строки (производительность)

```tsx
// ❌ Перерендер всей формы при изменении одной строки
{fields.map((field, i) => (
  <div key={field.id}>
    <input {...register(`items.${i}.name`)} />
  </div>
))}

// ✅ Каждая строка — отдельный компонент с memo
const Row = memo(({ field, index, control }) => (
  <div>
    <input {...control.register(`items.${index}.name`)} />
  </div>
));

{fields.map((field, i) => (
  <Row key={field.id} field={field} index={i} control={control} />
))}
```

⚠️ Тонкость: при move/insert индексы меняются, что нарушает мемоизацию. Стратегии:
1. Использовать field.id вместо index в логике строки.
2. Принять overhead — RHF и так оптимизирован.

---

## ⚠️ Подводные камни

### 1. key={index} вместо key={field.id}

```tsx
// ❌ После remove(0) или move индексы сдвигаются → React путается с DOM
{fields.map((field, index) => <div key={index}>...</div>)}

// ✅ Field.id стабилен
{fields.map((field, index) => <div key={field.id}>...</div>)}
```

Симптомы бага: после удаления элемента остаются "призраки" значений в input'ах.

### 2. defaultValues для массива пустые

```tsx
// ❌ Если массив пустой — fields пуст, ничего не рендерится
useForm({ defaultValues: { users: [] } });

// ✅ Стартовый элемент или append({ }) при mount
useForm({ defaultValues: { users: [{ name: "", email: "" }] } });
```

### 3. Имена полей через template literals

```tsx
// ❌ Тип не выводится корректно
<input {...register(`users.${i}.name`)} />

// ✅ as const помогает
<input {...register(`users.${i}.name` as const)} />

// или Path<FormData> в типе
```

### 4. Mutating fields

```tsx
// ❌ Не мутируй fields — это снимок
fields.push(newItem);

// ✅ Через append
append(newItem);
```

### 5. shouldUnregister разрушает данные

```tsx
useForm({ shouldUnregister: true });
// При удалении строки данные стираются → если потом восстанавливаешь, value undefined
```

### 6. Reset с массивом

```tsx
// При reset массив должен соответствовать новому defaultValues
reset({ users: [{ name: "John", email: "" }] });
// fields ОБНОВИТСЯ автоматически
```

### 7. setValue для конкретного поля

```tsx
// ❌ setValue("users", newArray) — может сломать field.id
setValue("users", newArray);

// ✅ Используй replace для замены массива
replace(newArray);

// Для одного элемента — update
update(2, newItem);
```

### 8. watch на весь массив дорого

```tsx
// ❌ Для большого массива — рендер на каждое изменение
const items = watch("items");

// ✅ useWatch в отдельном компоненте, который рендерит только сумму/и т.д.
function Total({ control }) {
  const items = useWatch({ control, name: "items" });
  return <span>{calc(items)}</span>;
}
```

### 9. Глубоко вложенные индексы становятся хрупкими

```tsx
register(`form.sections.${si}.items.${ii}.options.${oi}.value`)
// Слишком много вложенности → переименуй структуру или вынеси в отдельный компонент
```

### 10. Динамическая валидация массива

```tsx
// Например, "хотя бы один email" в массиве
// Через RHF rules сложно — лучше через resolver (Zod):
z.object({
  contacts: z.array(...).refine(
    (arr) => arr.some(c => c.type === "email"),
    { message: "Хотя бы один email обязателен" }
  ),
});
```

---

## 🔬 Тонкие моменты

**Field.id не сохраняется в data**

```tsx
fields[0].id; // "abc-123-uuid"
getValues("users.0").id; // undefined
```

`id` существует только в `fields` для целей React key. В submit data его нет.

**Initial fields генерируются из defaultValues**

```tsx
useForm({ defaultValues: { users: [{ name: "John" }, { name: "Jane" }] } });
const { fields } = useFieldArray({ control, name: "users" });
// fields = [{ id: "...", name: "John" }, { id: "...", name: "Jane" }]
```

**Замена field.id при reset**

После reset(data) все id регенерируются → React переименует все DOM элементы. Если есть animations/focus — они пропадут.

**focusIndex и shouldFocus**

```tsx
append(newItem);                              // авто-фокус на новый
append(newItem, { shouldFocus: false });      // без фокуса
append(newItem, { focusName: "users.5.name" }); // конкретное поле
```

**Performance — splitting**

```tsx
// Рекомендация: вынести row в отдельный компонент с control
const Row = ({ index, control, register }) => {
  return <input {...register(`items.${index}.name`)} />;
};
// Теперь изменения в одной строке не перерендерят соседние
```

**Использование с Zod arrays**

```tsx
const schema = z.object({
  items: z.array(z.object({ name: z.string() }))
    .min(1)
    .max(10),
});

useForm({ resolver: zodResolver(schema) });
// errors.items?.message — сообщение для всего массива
// errors.items?.[i]?.name — для конкретного поля
```

**Альтернативы useFieldArray**

Иногда проще обычный `register` с динамическими именами:

```tsx
// Если массив фиксированной длины
[0, 1, 2, 3].map(i => <input {...register(`items.${i}`)} />)
```

Но для add/remove — useFieldArray незаменим.

**SortableJS / dnd-kit интеграции**

dnd-kit чище для современных приложений:

```tsx
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove } from "@dnd-kit/sortable";

<DndContext
  collisionDetection={closestCenter}
  onDragEnd={(event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = fields.findIndex(f => f.id === active.id);
      const newIndex = fields.findIndex(f => f.id === over.id);
      move(oldIndex, newIndex);
    }
  }}
>
  <SortableContext items={fields.map(f => f.id)}>
    {fields.map((field, i) => <SortableRow key={field.id} ... />)}
  </SortableContext>
</DndContext>
```

**Доступ к dirty state массива**

```tsx
formState.dirtyFields.users;
// массив true/false по индексам
// можно отправлять только изменённые
```

---

## 🧩 Задачи для закрепления

**Задача 1 — Список телефонов**
Форма с `phones: { type: "mobile" | "work"; number: string }[]`. Добавление, удаление, валидация (формат номера).

**Задача 2 — Конструктор резюме**
Несколько разделов (опыт, образование, навыки). Каждый раздел — useFieldArray. Move для изменения порядка.

**Задача 3 — Корзина с пересчётом**
Список товаров: name, quantity, price. Real-time пересчёт total. Используй useWatch локально (не watch в родителе).

**Задача 4 — Drag & drop порядок**
Используй dnd-kit для drag & drop элементов в массиве. Move() при перетаскивании.

**Задача 5 — Вложенные массивы**
Конструктор опросов: вопросы → варианты ответов. Каждый вопрос имеет свой массив answers.

**Задача 6 — Валидация: уникальность**
В массиве contacts проверь, что все email уникальны. Через z.refine на массив.

**Задача 7 — Bulk действия**
Чекбоксы для каждой строки + кнопки "Удалить выбранные", "Дублировать". Используй remove([...indices]).

**Задача 8 — Изоляция строки в memo**
Сделай Row компонент с React.memo. С Profiler покажи, что изменение одной строки не перерендеривает соседние.

**Задача 9 — Лимиты массива**
min: 1, max: 10. Кнопка "Добавить" disabled если max. Кнопка "Удалить" скрыта если только 1 элемент.

**Задача 10 — Persistence в localStorage**
Сохраняй массив в localStorage на каждое изменение (через watch + debounce). При перезагрузке восстанавливай через reset({ items: saved }).
