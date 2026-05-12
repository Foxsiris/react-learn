## 📝 Теория

### Жизненный цикл компонента

Любой компонент проходит три стадии:
1. **Mount** — компонент появляется в DOM
2. **Update** — re-render из-за изменения state/props
3. **Unmount** — компонент удаляется из DOM

В классовых компонентах были методы `componentDidMount`, `componentDidUpdate`, `componentWillUnmount`. В функциональных всё это заменяет `useEffect`.

---

### useEffect — синтаксис и семантика

```jsx
useEffect(() => {
  // Код, выполняющийся после рендера
  
  return () => {
    // Cleanup — выполняется перед следующим эффектом или unmount
  };
}, [/* массив зависимостей */]);
```

`useEffect` выполняется **после** того, как React обновил DOM и браузер отрисовал изменения. Это неблокирующее выполнение.

---

### Три варианта массива зависимостей

```jsx
// 1. Без массива зависимостей — запускается после КАЖДОГО рендера
useEffect(() => {
  console.log("Каждый рендер");
});

// 2. Пустой массив [] — запускается только при MOUNT
useEffect(() => {
  console.log("Только при mount");
  return () => console.log("Только при unmount");
}, []);

// 3. Массив с зависимостями — при mount и при изменении любой зависимости
useEffect(() => {
  console.log("При mount и при изменении count или userId");
}, [count, userId]);
```

---

### Типичные сценарии использования

**Запрос данных:**
```jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false; // флаг отмены

    async function fetchUser() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (!res.ok) throw new Error("Ошибка загрузки");
        const data = await res.json();
        if (!cancelled) {       // проверяем до setState
          setUser(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchUser();

    return () => {
      cancelled = true; // отменяем при смене userId или unmount
    };
  }, [userId]);

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  return <div>{user?.name}</div>;
}
```

**Подписка на события:**
```jsx
useEffect(() => {
  function handleResize() {
    setSize({ width: window.innerWidth, height: window.innerHeight });
  }
  
  window.addEventListener("resize", handleResize);
  handleResize(); // сразу берём текущий размер
  
  return () => {
    window.removeEventListener("resize", handleResize); // очистка!
  };
}, []);
```

**Работа с таймерами:**
```jsx
useEffect(() => {
  const timer = setTimeout(() => {
    setShowHint(true);
  }, 3000);
  
  return () => clearTimeout(timer); // отменяем при unmount или повторном запуске
}, []);

// Интервал:
useEffect(() => {
  const id = setInterval(() => {
    setTick(t => t + 1);
  }, 1000);
  
  return () => clearInterval(id);
}, []);
```

**Синхронизация с внешними API (WebSocket, Store):**
```jsx
useEffect(() => {
  const socket = new WebSocket("wss://example.com/ws");
  
  socket.addEventListener("message", handleMessage);
  socket.addEventListener("error", handleError);
  
  return () => {
    socket.removeEventListener("message", handleMessage);
    socket.removeEventListener("error", handleError);
    socket.close();
  };
}, []);
```

**Работа с DOM напрямую:**
```jsx
const chartRef = useRef(null);

useEffect(() => {
  if (!chartRef.current) return;
  
  const chart = new Chart(chartRef.current, {
    type: "line",
    data: chartData,
  });
  
  return () => chart.destroy(); // обязательная очистка!
}, [chartData]);
```

---

### Cleanup функция — когда и зачем

Cleanup вызывается:
1. Перед следующим запуском эффекта (если зависимости изменились)
2. При unmount компонента

```jsx
useEffect(() => {
  console.log("Эффект запущен. userId:", userId);
  
  const sub = subscribe(userId, handleUpdate);
  
  return () => {
    console.log("Cleanup. userId:", userId);
    sub.unsubscribe();
  };
}, [userId]);

// Порядок при смене userId с 1 на 2:
// 1. Эффект запущен. userId: 1
// 2. Cleanup. userId: 1     ← cleanup старого эффекта
// 3. Эффект запущен. userId: 2 ← новый эффект
```

---

### Почему React 18 + StrictMode дважды запускает эффекты

В React 18 в StrictMode при разработке React специально монтирует, размонтирует и снова монтирует компонент. Это сделано для проверки корректности cleanup функции.

```jsx
// Если видишь двойной запуск эффекта в dev режиме — это нормально.
// Убедись, что cleanup правильно убирает за собой.

useEffect(() => {
  const conn = connectToDatabase();
  return () => conn.disconnect(); // должно полностью откатить эффект
}, []);
```

---

### Паттерны работы с зависимостями

**Eslint-плагин `exhaustive-deps`** помогает не пропустить зависимости:

```jsx
// ❌ Пропущена зависимость userId
useEffect(() => {
  fetch(`/api/users/${userId}`); // userId используется, но не в deps
}, []); // eslint предупредит об этом

// ✅ Все зависимости указаны
useEffect(() => {
  fetch(`/api/users/${userId}`);
}, [userId]);
```

**Объекты и функции как зависимости:**

```jsx
// ❌ Объект создаётся заново при каждом рендере → эффект запускается бесконечно
useEffect(() => {
  fetchData(options);
}, [options]); // options = { page: 1 } — новая ссылка каждый раз!

// ✅ Используй примитивы в зависимостях
useEffect(() => {
  fetchData({ page });
}, [page]); // page — число, стабильная зависимость

// ✅ Или мемоизируй объект
const options = useMemo(() => ({ page, limit }), [page, limit]);
useEffect(() => {
  fetchData(options);
}, [options]);
```

---

## ⚠️ Подводные камни

### 1. Бесконечный цикл

```jsx
// ❌ Эффект изменяет зависимость → бесконечный цикл
const [data, setData] = useState([]);

useEffect(() => {
  setData([...data, newItem]); // data в зависимостях и изменяется внутри
}, [data]); // каждый setData → новый рендер → новый data → эффект снова

// ✅ Используй функциональное обновление
useEffect(() => {
  setData(prev => [...prev, newItem]); // убираем data из зависимостей
}, [newItem]);
```

### 2. Stale closure в эффекте

```jsx
// ❌ Замкнулись на начальном значении count
useEffect(() => {
  const id = setInterval(() => {
    console.log(count); // всегда 0
  }, 1000);
  return () => clearInterval(id);
}, []); // count не в зависимостях!

// ✅ Добавь count в зависимости (эффект будет перезапускаться)
useEffect(() => {
  const id = setInterval(() => {
    console.log(count);
  }, 1000);
  return () => clearInterval(id);
}, [count]);

// ✅ Или используй ref для последнего значения
const countRef = useRef(count);
useEffect(() => { countRef.current = count; });
useEffect(() => {
  const id = setInterval(() => console.log(countRef.current), 1000);
  return () => clearInterval(id);
}, []);
```

### 3. Race condition при async запросах

```jsx
// ❌ Если userId меняется дважды быстро — второй запрос может прийти раньше первого
useEffect(() => {
  fetchUser(userId).then(data => setUser(data)); // нет отмены!
}, [userId]);

// ✅ Флаг отмены или AbortController
useEffect(() => {
  const controller = new AbortController();
  
  fetchUser(userId, { signal: controller.signal })
    .then(data => setUser(data))
    .catch(err => {
      if (err.name !== "AbortError") setError(err.message);
    });
  
  return () => controller.abort();
}, [userId]);
```

### 4. Эффект без cleanup при подписках

```jsx
// ❌ Память утечёт — подписка не отменяется
useEffect(() => {
  eventBus.on("update", handleUpdate);
}, []);

// ✅ Всегда возвращай cleanup для подписок
useEffect(() => {
  eventBus.on("update", handleUpdate);
  return () => eventBus.off("update", handleUpdate);
}, []);
```

### 5. Не используй useEffect для вычислений

```jsx
// ❌ Используем эффект для вычисления derived state
const [fullName, setFullName] = useState("");
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);
// Лишний рендер: сначала рендер с firstName/lastName, потом эффект обновляет fullName

// ✅ Просто вычисляй при рендере
const fullName = `${firstName} ${lastName}`; // никакого useEffect!
```

---

## 🔬 Тонкие моменты

**useEffect vs useLayoutEffect:**
- `useEffect` — после paint браузера (async, неблокирующий)
- `useLayoutEffect` — после DOM mutations, до paint (sync, блокирующий)
- Используй `useEffect` по умолчанию, `useLayoutEffect` — только если видишь мерцание UI

**Порядок выполнения при рендере:**
1. React рендерит компонент (вызывает функцию)
2. React обновляет DOM
3. Браузер рисует на экране
4. Вызывается cleanup предыдущего эффекта
5. Вызывается новый useEffect

**Эффект внутри условия — плохая идея:**
```jsx
// ❌ Нельзя! Хуки нельзя в условиях
if (isLoggedIn) {
  useEffect(() => { /* ... */ }, []);
}

// ✅ Условие внутри эффекта
useEffect(() => {
  if (!isLoggedIn) return;
  // логика для авторизованных
}, [isLoggedIn]);
```

**Зависимости — массив значений, не функций-вычислений:**
```jsx
// React сравнивает deps через Object.is (поверхностное)
// [count] → [count+1]: count изменился → эффект перезапустится
// [{a:1}] → [{a:1}]: разные ссылки → эффект перезапустится!
```

---

## 🧩 Задачи

**Задача 1.** Напиши хук `useWindowSize()`, возвращающий `{ width, height }`. Используй `useEffect` с подпиской на `resize`. Убедись, что `removeEventListener` вызывается при unmount.

**Задача 2.** Создай компонент `AutoSave`: принимает `value` и `onSave`. Через 1 секунду после последнего изменения `value` вызывай `onSave`. Это debounce — реализуй через `setTimeout`/`clearTimeout` в `useEffect`.

**Задача 3.** Реализуй компонент с загрузкой данных, который корректно обрабатывает смену `id`: отменяет предыдущий запрос через `AbortController` при новом значении `id`. Добавь loading/error состояния.

**Задача 4.** Реализуй хук `useLocalStorage(key, initialValue)`: синхронизирует state с localStorage, корректно инициализирует, сохраняет изменения через эффект.

**Задача 5.** Напиши компонент `PollingData`: каждые N секунд делает запрос к API и обновляет данные. N приходит как prop. Убедись, что при смене N старый интервал очищается и создаётся новый.
