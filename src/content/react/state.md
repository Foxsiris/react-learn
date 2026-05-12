## 📝 Теория

### Что такое State

State — это данные, которые компонент хранит внутри себя и которые могут меняться со временем. В отличие от props (передаются снаружи), state управляется самим компонентом. При изменении state React перерисовывает компонент.

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0); // начальное значение — 0

  return (
    <div>
      <p>Счётчик: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>−</button>
    </div>
  );
}
```

`useState` возвращает массив из двух элементов: текущее значение и функцию-сеттер. React гарантирует, что ссылка на сеттер **стабильна** — она не меняется между рендерами.

---

### Как работает useState под капотом

React хранит state в специальной структуре, привязанной к конкретному месту в дереве компонентов (по порядку вызова хуков). Вот упрощённая модель:

```
// Внутри React (псевдокод):
let hooks = [];
let currentHook = 0;

function useState(initialValue) {
  const index = currentHook++;
  if (hooks[index] === undefined) {
    hooks[index] = initialValue; // первый рендер
  }
  
  const setState = (newValue) => {
    hooks[index] = newValue;
    rerender(); // запускает перерисовку
  };
  
  return [hooks[index], setState];
}
```

Именно поэтому хуки нельзя вызывать в условиях — порядок должен быть одинаковым при каждом рендере.

---

### Принцип иммутабельности

**Иммутабельность** означает: вместо изменения существующего объекта — создавай новый. React использует поверхностное сравнение (`Object.is`) для определения, изменился ли state. Если ссылка та же — перерисовки не будет.

```jsx
// ❌ МУТАЦИЯ — React не заметит изменение
const [user, setUser] = useState({ name: "Alice", age: 25 });

function changeName() {
  user.name = "Bob";    // мутируем объект напрямую
  setUser(user);        // та же ссылка → React думает, что ничего не изменилось
}

// ✅ ИММУТАБЕЛЬНО — создаём новый объект
function changeName() {
  setUser({ ...user, name: "Bob" }); // новая ссылка → React перерисует
}
```

---

### Иммутабельное обновление разных структур данных

**Объект:**
```jsx
const [profile, setProfile] = useState({ name: "Alice", age: 25, city: "Moscow" });

// Обновить одно поле:
setProfile(prev => ({ ...prev, age: 26 }));

// Вложенный объект:
const [settings, setSettings] = useState({
  theme: "dark",
  notifications: { email: true, push: false }
});

// ❌ Неправильно — мутируем вложенный объект
setSettings(prev => {
  prev.notifications.push = true; // мутация!
  return { ...prev };
});

// ✅ Правильно — копируем на каждом уровне
setSettings(prev => ({
  ...prev,
  notifications: { ...prev.notifications, push: true }
}));
```

**Массив:**
```jsx
const [items, setItems] = useState([1, 2, 3]);

// Добавить в конец:
setItems(prev => [...prev, 4]);

// Добавить в начало:
setItems(prev => [0, ...prev]);

// Удалить по индексу:
setItems(prev => prev.filter((_, i) => i !== 1));

// Обновить элемент по индексу:
setItems(prev => prev.map((item, i) => i === 1 ? item * 2 : item));

// Вставить по индексу:
setItems(prev => [...prev.slice(0, 2), 99, ...prev.slice(2)]);

// ❌ Методы, которые мутируют массив — НЕЛЬЗЯ использовать:
// push, pop, shift, unshift, splice, sort, reverse
// Используй их на КОПИИ:
setItems(prev => [...prev].sort((a, b) => a - b)); // spread → sort → OK
```

**Map и Set:**
```jsx
const [map, setMap] = useState(new Map());

// Добавить/обновить:
setMap(prev => new Map(prev).set("key", "value")); // создаём новый Map

// Удалить:
setMap(prev => {
  const next = new Map(prev);
  next.delete("key");
  return next;
});
```

---

### Функциональное обновление state

Когда новый state зависит от предыдущего — используй функцию в сеттере:

```jsx
const [count, setCount] = useState(0);

// ❌ Проблема: count захвачен в замыкании (stale closure)
function handleTripleClick() {
  setCount(count + 1); // count = 0, результат: 1
  setCount(count + 1); // count = 0 (тот же!), результат: 1
  setCount(count + 1); // count = 0, результат: 1
}
// Итог: count = 1, а не 3!

// ✅ Правильно: передаём функцию (updater function)
function handleTripleClick() {
  setCount(prev => prev + 1); // prev = 0, следующий = 1
  setCount(prev => prev + 1); // prev = 1, следующий = 2
  setCount(prev => prev + 1); // prev = 2, следующий = 3
}
// Итог: count = 3 ✓
```

---

### Ленивая инициализация state

Если начальное значение вычисляется дорого — передай функцию:

```jsx
// ❌ Дорогая операция выполняется при КАЖДОМ рендере
const [data, setData] = useState(heavyComputation());

// ✅ Функция вызывается только при ПЕРВОМ рендере
const [data, setData] = useState(() => heavyComputation());

// Реальный пример: чтение из localStorage
const [theme, setTheme] = useState(() => {
  try {
    return localStorage.getItem("theme") ?? "light";
  } catch {
    return "light";
  }
});
```

---

### Batching (группировка обновлений)

React 18 автоматически группирует несколько `setState` в одно обновление:

```jsx
function handleClick() {
  setCount(c => c + 1);
  setName("Bob");
  setFlag(true);
  // React перерисует компонент ОДИН раз, а не три
}

// В React 17 batching работал только в event handlers.
// В React 18 — везде, включая setTimeout, Promise, async функции.

// Если нужно отключить batching (редко):
import { flushSync } from "react-dom";

function handleClick() {
  flushSync(() => setCount(c => c + 1)); // перерисовка сразу
  flushSync(() => setName("Bob"));       // перерисовка сразу
}
```

---

### Сброс state при смене ключа

Нестандартный, но очень мощный трюк: передай `key` компоненту — при смене key React пересоздаёт компонент с нуля.

```jsx
function UserProfile({ userId }) {
  const [editMode, setEditMode] = useState(false);
  // ...
}

// ✅ При смене userId editMode автоматически сбросится в false
<UserProfile key={userId} userId={userId} />
```

---

## ⚠️ Подводные камни

### 1. State — асинхронный

```jsx
const [count, setCount] = useState(0);

function handleClick() {
  setCount(count + 1);
  console.log(count); // Выведет старое значение! State обновится после рендера.
}

// Если нужно значение после обновления — используй useEffect
useEffect(() => {
  console.log("count обновился:", count);
}, [count]);
```

### 2. Stale closure

```jsx
const [count, setCount] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    console.log(count); // ❌ count всегда 0 — замкнулось на начальном значении
    setCount(count + 1); // ❌ тоже всегда 0+1 = 1
  }, 1000);
  return () => clearInterval(interval);
}, []); // пустой массив зависимостей

// ✅ Решение: функциональное обновление
useEffect(() => {
  const interval = setInterval(() => {
    setCount(prev => prev + 1); // всегда берёт актуальное значение
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

### 3. Объект в state — неполный spread

```jsx
const [user, setUser] = useState({ name: "Alice", age: 25, role: "user" });

// ❌ Теряем поля, не упомянутые в обновлении
setUser({ name: "Bob" }); 
// state теперь: { name: "Bob" } — age и role исчезли!

// ✅ Спред сохраняет все поля
setUser(prev => ({ ...prev, name: "Bob" }));
```

### 4. Derived state — антипаттерн

```jsx
// ❌ Дублируем props в state
function UserCard({ user }) {
  const [name, setName] = useState(user.name);
  // Проблема: state инициализируется один раз.
  // Если user.name изменится снаружи — name в state не обновится!
}

// ✅ Вычисляй derived data прямо в рендере
function UserCard({ user }) {
  const displayName = user.name.toUpperCase(); // просто переменная
  return <p>{displayName}</p>;
}

// ✅ Если нужно хранить — синхронизируй через useEffect (или useKey)
function UserCard({ userId, user }) {
  const [editedName, setEditedName] = useState(user.name);
  
  // Сброс при смене пользователя:
  useEffect(() => {
    setEditedName(user.name);
  }, [userId]); // зависим от userId, а не от user.name чтобы избежать лишних обновлений
}
```

### 5. setState в render — бесконечный цикл

```jsx
// ❌ setState вызывает рендер, который вызывает setState...
function Component() {
  const [x, setX] = useState(0);
  setX(x + 1); // прямо в теле компонента — бесконечный цикл!
  return <p>{x}</p>;
}
```

---

## 🔬 Тонкие моменты

**Одинаковое значение не вызывает ре-рендер:**

```jsx
const [count, setCount] = useState(0);
setCount(0); // React сравнит 0 === 0 → рендера не будет
// Но: первый вызов setCount с тем же значением всё равно запускает рендер
// (т.н. "bail-out on same value" — React выполняет рендер один раз потом оптимизирует)
```

**Несколько useState vs один объект:**

```jsx
// ✅ Предпочтительно: отдельные состояния для несвязанных данных
const [name, setName] = useState("");
const [age, setAge] = useState(0);
const [email, setEmail] = useState("");

// ✅ Объект для связанных данных (форма, координаты, etc.)
const [position, setPosition] = useState({ x: 0, y: 0 });
// Обновляем вместе: setPosition({ x: 10, y: 20 })
```

**Инициализация из функции vs значения:**

```jsx
// Эта разница критична при дорогих операциях:
useState(heavyFn())  // heavyFn() вызывается при КАЖДОМ рендере (результат игнорируется)
useState(heavyFn)    // heavyFn вызывается ТОЛЬКО при первом рендере
```

---

## 🧩 Задачи

**Задача 1.** Реализуй компонент корзины покупок: список товаров, добавление/удаление, счётчик количества. Используй иммутабельное обновление массива. Добавь возможность изменять количество товара.

**Задача 2.** Создай форму с 5 полями. Реализуй two-way binding: один объект в state, один обработчик `handleChange`. Добавь кнопку Reset, сбрасывающую форму к начальным значениям.

**Задача 3.** Реализуй счётчик с кнопкой "×3" (умножить на 3). Используй функциональное обновление. Затем нажми кнопку 3 раза подряд за 10мс (через `flushSync` в тесте) — убедись, что результат корректен.

**Задача 4.** Реализуй компонент `SortableList`: массив строк в state, кнопки "вверх"/"вниз" для каждого элемента, кнопка "перемешать". Используй только иммутабельные операции.

**Задача 5.** Реализуй систему тем (theme switcher) с ленивой инициализацией из localStorage. При смене темы — сохраняй в localStorage. Обернись в try/catch на случай, если localStorage недоступен (приватный режим браузера).
