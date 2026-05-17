import type { Block } from "./topics";

const r = (s: string) => s.replace(/^\n/, "");

export const jsAdvancedBlock: Block = {
  id: "js-advanced",
  emoji: "⚙️",
  title: "JavaScript: продвинутый",
  description:
    "Замыкания, прототипы, event loop, async-внутренности, Proxy, генераторы — то, что отличает уверенного JS-разработчика.",
  topics: [
    {
      id: "js-closures",
      title: "Замыкания",
      description: "Лексическое окружение, [[Environment]], классические задачи",
      theory: r(`
**Замыкание** — это функция вместе с её лексическим окружением (Lexical Environment). В JS каждая функция при создании запоминает ссылку на окружение, в котором её объявили, через внутреннее свойство \`[[Environment]]\`. Когда функция вызывается — создаётся новое окружение, чей внешний родитель = \`[[Environment]]\`. Поиск переменных идёт по этой цепочке наверх, пока не найдёт.

\`\`\`js
function makeCounter() {
  let count = 0;            // переменная живёт в окружении makeCounter
  return function () {       // эта функция запомнила [[Environment]] = окружение makeCounter
    return ++count;
  };
}

const counter = makeCounter();
counter(); // 1
counter(); // 2 — переменная count жива, пока на неё ссылается замыкание
\`\`\`

### Почему это работает
Когда \`makeCounter()\` отрабатывает, его собственное окружение в теории должно быть собрано GC. Но возвращённая функция держит ссылку на это окружение → GC не может его собрать. Так \`count\` переживает завершение породившей её функции.

### Классическая ловушка с var в цикле
\`\`\`js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0); // 3, 3, 3
}
\`\`\`
\`var\` имеет функциональную область видимости — все три колбэка ссылаются на одну переменную \`i\`. К моменту вызова цикл уже закончился, \`i === 3\`.

С \`let\` — блочная область, в каждой итерации создаётся новая \`i\`:
\`\`\`js
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0); // 0, 1, 2
}
\`\`\`

### Применения
- **Приватные данные**: \`makeCounter\` выше — \`count\` недоступен снаружи.
- **Каррирование и частичное применение**: \`const add = a => b => a + b\`.
- **Мемоизация**: кеш хранится в замыкании.
- **Модульный паттерн (IIFE)** до появления ES modules.

### Опасности
Замыкание держит **всё** окружение, не только используемые переменные (теоретически — на практике движки умеют оптимизировать). Если в окружении лежит большой объект, замыкание не даст его собрать GC → утечка памяти.
      `),
      examples: [],
    },
    {
      id: "js-scopes-hoisting",
      title: "Области видимости и hoisting",
      description: "var/let/const, TDZ, hoisting функций и переменных",
      theory: r(`
JS имеет три типа областей видимости: **глобальная**, **функциональная** (\`var\`, объявления функций) и **блочная** (\`let\`, \`const\`, \`class\`).

### var vs let vs const
| Объявление | Область | Hoisting | Можно переобъявить | Можно переприсвоить |
|---|---|---|---|---|
| \`var\`   | function | да, инициализируется \`undefined\` | да | да |
| \`let\`   | block    | да, но в TDZ до строки объявления | нет | да |
| \`const\` | block    | да, в TDZ                          | нет | нет (ссылка) |

### Hoisting функций
\`function name() {}\` поднимается целиком — её можно вызвать **до** объявления:
\`\`\`js
hello(); // работает
function hello() { console.log("hi"); }
\`\`\`

Функциональные выражения и стрелки — нет:
\`\`\`js
hello(); // ReferenceError или TypeError в зависимости от объявления
const hello = () => console.log("hi");
\`\`\`

### Temporal Dead Zone
\`\`\`js
console.log(x); // ReferenceError: Cannot access 'x' before initialization
let x = 5;
\`\`\`
\`x\` существует в окружении блока с момента его создания, но обращение до строки \`let x = 5\` бросает ошибку. Это и есть **TDZ**. Спецификация делает это намеренно, чтобы баги типа «использовал переменную раньше, чем объявил» падали явно, а не молча возвращали \`undefined\`.

### Block scope гарантирует независимость
\`\`\`js
{
  const PI = 3.14;
}
console.log(PI); // ReferenceError
\`\`\`
Это удобно для изоляции — например, в \`switch case\` каждый case должен быть в \`{ }\`, иначе \`let\` из одного case конфликтует с другим.

### Глобальные неявные переменные
В нестрогом режиме присваивание необъявленной переменной создаёт глобальную: \`x = 5\`. В \`'use strict'\` (и в модулях по умолчанию) — это \`ReferenceError\`. Всегда работай в strict mode.
      `),
      examples: [],
    },
    {
      id: "js-this",
      title: "this и контекст",
      description: "Правила выбора this, потеря контекста, bind/call/apply, стрелки",
      theory: r(`
\`this\` в JS — самая болезненная тема для новичков, потому что зависит не от **места объявления**, а от **способа вызова**.

### Четыре правила вызова (по убыванию приоритета)
1. **\`new\`** — \`this\` = свежесозданный объект.
2. **Явная привязка** — \`.call(ctx, ...)\`, \`.apply(ctx, [...])\`, \`.bind(ctx)\`.
3. **Метод объекта** — \`obj.fn()\` → \`this = obj\`.
4. **Простой вызов** — \`fn()\` → \`this = undefined\` в strict mode (или \`window\`/\`globalThis\` без strict).

\`\`\`js
function show() { console.log(this); }
const obj = { show };
obj.show();         // → obj
const f = obj.show;
f();                // → undefined (strict) — потеря контекста
new show();         // → новый объект
show.call({ id: 1 }); // → { id: 1 }
\`\`\`

### Стрелочные функции — другие
Стрелки **не имеют собственного this** — берут из окружающего лексического контекста и **никогда** его не меняют. \`.call\`, \`.bind\` на стрелку игнорируются.

\`\`\`js
const obj = {
  id: 1,
  arrow: () => this,           // this взят из объявления (глобальный)
  method() { return this; },
};
obj.arrow();   // undefined (или window)
obj.method();  // obj
\`\`\`

### Типичная ошибка — колбэк в setTimeout
\`\`\`js
class Timer {
  constructor() { this.id = 1; }
  tick() {
    setTimeout(function () {
      console.log(this.id); // undefined — потеря this
    }, 100);
  }
}
\`\`\`
Решения: стрелка (\`() => this.id\`), \`.bind(this)\`, или сохранить \`const self = this;\`.

### bind/call/apply
- \`fn.call(ctx, a, b, c)\` — вызвать с этим \`this\` и аргументами поштучно.
- \`fn.apply(ctx, [a, b, c])\` — то же, но аргументы массивом.
- \`fn.bind(ctx, a)\` — вернуть **новую** функцию с зафиксированным \`this\` и опционально частично применёнными аргументами.

### globalThis
\`window\` в браузере, \`global\` в Node, \`self\` в воркерах. \`globalThis\` — единый кроссплатформенный доступ.
      `),
      examples: [],
    },
    {
      id: "js-prototypes",
      title: "Прототипы и наследование",
      description: "__proto__, Object.create, prototype chain, hasOwnProperty",
      theory: r(`
Наследование в JS — **прототипное**. У каждого объекта есть скрытая ссылка \`[[Prototype]]\` (доступная через \`Object.getPrototypeOf(obj)\` или legacy \`__proto__\`). При обращении к свойству, которого нет на объекте, движок поднимается по этой цепочке до \`null\`.

### Создание объектов
\`\`\`js
const animal = { eats: true };
const rabbit = Object.create(animal); // [[Prototype]] = animal
rabbit.jumps = true;

console.log(rabbit.eats); // true — найдено в прототипе
console.log(rabbit.jumps); // true — собственное
console.log(rabbit.hasOwnProperty('eats'));  // false
console.log(rabbit.hasOwnProperty('jumps')); // true
\`\`\`

### Функции-конструкторы и prototype
У каждой функции есть свойство \`prototype\` — объект, который станет \`[[Prototype]]\` инстансов, созданных через \`new\`.

\`\`\`js
function User(name) { this.name = name; }
User.prototype.greet = function () { return 'Hi, ' + this.name; };

const u = new User('Аня');
u.greet();                          // 'Hi, Аня'
Object.getPrototypeOf(u) === User.prototype; // true
u instanceof User;                  // true (проверка через цепочку прототипов)
\`\`\`

### class — это сахар
\`\`\`js
class Animal { eat() {} }
class Rabbit extends Animal { jump() {} }
\`\`\`
Под капотом всё то же самое: \`Rabbit.prototype.__proto__ === Animal.prototype\`. Методы лежат на \`prototype\`, не копируются в каждый инстанс.

### Поиск свойств
- \`obj.x = 5\` — **создаёт** собственное свойство (даже если x есть в прототипе).
- Чтение — идёт по цепочке.
- \`for...in\` — обходит всю цепочку (с enumerable). \`Object.keys()\` — только собственные.

### Object.setPrototypeOf и его цена
\`Object.setPrototypeOf(obj, proto)\` работает, но медленно — движок инвалидирует оптимизации формы объекта. Не используй в горячем коде. Лучше: создавай объект с нужным прототипом сразу через \`Object.create\` или class.

### Подводный камень: prototype-загрязнение
Не присваивай свойства \`Object.prototype\` — они появятся у **всех** объектов. Атакующий может проэксплуатировать парсер JSON, чтобы туда что-то добавить (CVE-class «prototype pollution»).
      `),
      examples: [],
    },
    {
      id: "js-classes",
      title: "Классы и приватные поля",
      description: "class, extends, super, # private, статика, getters/setters",
      theory: r(`
Классы в JS — синтаксический сахар над прототипным наследованием, но с реальными отличиями: они работают только с \`new\`, имеют строгий режим внутри, и поддерживают приватные поля.

### Базовый синтаксис
\`\`\`js
class User {
  // публичное поле (ES2022)
  active = true;
  // приватное поле — # часть имени
  #password;

  constructor(name, password) {
    this.name = name;
    this.#password = password;
  }

  greet() { return 'Hi, ' + this.name; }

  // getter / setter
  get info()   { return this.name + (this.active ? ' (online)' : ''); }
  set status(v){ this.active = !!v; }

  // статика — на самом классе, не на инстансе
  static fromJson(json) { return new User(json.name, json.password); }
  static #instances = 0;
  static get count() { return User.#instances; }
}
\`\`\`

### Наследование
\`\`\`js
class Admin extends User {
  constructor(name, password) {
    super(name, password); // обязательно ДО обращения к this
    this.role = 'admin';
  }
  greet() { return super.greet() + ' (admin)'; }
}
\`\`\`
- \`super(...)\` — вызов родительского конструктора, обязателен в \`extends\` до использования \`this\`.
- \`super.method()\` — вызвать метод родителя.
- \`Admin.__proto__ === User\` (статика наследуется), \`Admin.prototype.__proto__ === User.prototype\` (методы наследуются).

### Приватные поля
\`#field\` — настоящая инкапсуляция на уровне языка, не просто конвенция (\`_name\`). Доступ снаружи бросает SyntaxError ещё на этапе парсинга.

### Статика и фабрики
\`static fromJson(...)\` — типичный паттерн фабричных методов. Удобнее, чем заставлять вызывающий код знать порядок аргументов конструктора.

### Что нельзя
- \`class Foo {}; Foo()\` — TypeError, классы только с \`new\`.
- Стрелка как метод класса (\`fn = () => {}\`) — это **field**, не метод prototype. Создаётся в каждом инстансе → лишняя память, зато \`this\` зафиксирован.

### Когда class, когда фабрика
Класс хорош когда:
- есть наследование;
- нужен \`instanceof\`;
- много инстансов с общими методами.

Простую функцию-фабрику с замыканиями для приватных данных тоже никто не отменял — и она часто читается проще.
      `),
      examples: [],
    },
    {
      id: "js-event-loop",
      title: "Event Loop",
      description: "Стек, очередь, microtasks vs macrotasks, requestAnimationFrame",
      theory: r(`
JS — однопоточный. Чтобы при этом обрабатывать таймеры, IO и пользовательский ввод, ранtime крутит **event loop** — цикл, который выбирает следующую задачу из очередей и кидает её на исполнение в **call stack**.

### Что есть
- **Call stack** — стек вызовов синхронного кода.
- **Macrotask queue** (task queue) — \`setTimeout\`, \`setInterval\`, DOM-события, IO, \`setImmediate\` (Node).
- **Microtask queue** — \`Promise.then\`, \`queueMicrotask\`, \`MutationObserver\`.
- **Render pipeline** (браузер) — \`requestAnimationFrame\`, layout, paint.

### Алгоритм одной итерации
1. Если стек не пуст — выполняем синхронный код до конца.
2. Когда стек пуст — **полностью** разгребаем microtask queue (в т.ч. микротаски, добавленные другими микротасками).
3. Берём одну (!) макротаску из очереди → goto 1.
4. Перед перерисовкой (между шагами) браузер может выполнить rAF и render.

Ключевое: **между двумя макротасками микротасков высыпается сколько угодно**. Поэтому Promise-чейн в принципе может «застолбить» рендер, если бесконечно добавляет себе \`.then\`.

### Порядок на примере
\`\`\`js
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
// 1, 4, 3, 2
\`\`\`
1, 4 — синхронно. Стек пуст → промис-микротаска (3). Только потом макротаска (2).

### Почему setTimeout(fn, 0) не «сейчас»
Минимальная задержка по спеке — 0 ms, но реально браузер кладёт в макроочередь и ждёт хотя бы конца текущей синхронной работы и всех микротасков. Plus throttling до 4 ms для вложенных таймеров.

### Heavy task → блокировка
Долгий синхронный цикл (\`while (true)\`) держит стек → ничего не отрисовывается, кнопки не нажимаются. Решения:
- Разбить работу через \`setTimeout\` чанками.
- \`requestIdleCallback\` — когда есть свободное время.
- \`Web Worker\` — другой поток.

### requestAnimationFrame
Колбэк, который вызывается **перед следующей перерисовкой**. Используй для всего анимационного — не \`setTimeout(fn, 16)\`. Браузер сам подстраивается под частоту экрана.

### Node-специфика
Очередей в Node больше: \`process.nextTick\` (выше микротасков по приоритету), \`setImmediate\` (отдельная фаза). Для веба знать не критично, но не путай.
      `),
      examples: [],
    },
    {
      id: "js-promises-deep",
      title: "Promise под капотом",
      description: "Состояния, then-chain, обработка ошибок, Promise.all/allSettled/any/race",
      theory: r(`
\`Promise\` — объект, представляющий результат асинхронной операции. У него три состояния:
- **pending** — начальное;
- **fulfilled** — успешно завершён, с \`value\`;
- **rejected** — упал, с \`reason\`.

Состояние меняется один раз и навсегда — это называется *settled*.

### Then-chain
\`\`\`js
fetch('/api')
  .then(r => r.json())                    // обещание разворачивается
  .then(data => transform(data))           // вернёшь промис — он тоже развернётся
  .catch(e => console.error(e))             // ловит ошибку с любого шага выше
  .finally(() => stopSpinner());            // выполнится в обоих случаях
\`\`\`

Что нужно знать:
- Каждый \`.then\` возвращает **новый промис**, не модифицирует исходный.
- Если в \`.then\` бросить исключение или вернуть rejected-промис — следующий \`.catch\` его поймает.
- Если из \`.catch\` вернуть нормальное значение — промис снова в fulfilled, и следующий \`.then\` сработает.
- Колбэки \`.then\` всегда асинхронны (микротаска), даже если промис уже резолвлен.

### Создание Promise
\`\`\`js
const p = new Promise((resolve, reject) => {
  // executor запускается СИНХРОННО при new Promise
  setTimeout(() => resolve(42), 100);
});
\`\`\`
Антипаттерн: \`new Promise(res => doStuff().then(res))\` — оборачивание промиса в промис. Достаточно вернуть \`doStuff()\`.

### Группировка
- \`Promise.all([a, b, c])\` — fulfilled когда **все** успешны (массив значений). Падает на **первой** ошибке.
- \`Promise.allSettled([a, b, c])\` — всегда дожидается всех, отдаёт \`[{status:'fulfilled',value}, {status:'rejected',reason}, ...]\`.
- \`Promise.any([a, b, c])\` — первый успешный (игнорирует rejected). Если все упали → \`AggregateError\`.
- \`Promise.race([a, b, c])\` — первое **завершившееся** (хоть успехом, хоть ошибкой).

### Unhandled rejection
\`\`\`js
Promise.reject('oops'); // в браузере → window.onunhandledrejection, в Node — UnhandledPromiseRejection
\`\`\`
В современных Node 15+ это убивает процесс. Всегда либо \`.catch\`, либо \`await\` в \`try\`.

### Микро-этикет
- Не теряй ошибки: \`somePromise()\` без \`.catch\` — это бомба замедленного действия.
- Не делай цепочки в обработчике \`then\` (\`.then(() => fetch(...).then(...))\`) — возвращай из then, промис развернётся сам.
- Помни, что \`Promise.all\` падает на первой ошибке — если хочешь все результаты, бери \`allSettled\`.
      `),
      examples: [],
    },
    {
      id: "js-async-await",
      title: "async/await глубоко",
      description: "Что компилируется, последовательность vs параллель, обработка ошибок",
      theory: r(`
\`async/await\` — синтаксический сахар над промисами и генераторами. \`async function\` всегда возвращает промис; \`await\` приостанавливает её до резолва ожидаемого значения и возвращает развернутое.

### Что компилируется
Грубо, \`async function f() { const x = await g(); return x + 1; }\` примерно эквивалентно:
\`\`\`js
function f() {
  return g().then(x => x + 1);
}
\`\`\`
А под капотом более старые движки разворачивают это в state machine на генераторах.

### Последовательно vs параллельно
\`\`\`js
// последовательно — total ~600мс
const a = await fetch('/a'); // 200мс
const b = await fetch('/b'); // 200мс
const c = await fetch('/c'); // 200мс

// параллельно — total ~200мс
const [a, b, c] = await Promise.all([fetch('/a'), fetch('/b'), fetch('/c')]);
\`\`\`
Если запросы не зависят друг от друга — всегда \`Promise.all\`. Это **самая частая ошибка производительности** в async/await-коде.

### Обработка ошибок
\`\`\`js
try {
  const data = await load();
} catch (e) {
  // ловит и сетевые, и брошенные внутри load исключения
}
\`\`\`
\`await\` на rejected-промисе бросает обычное исключение. Если хочешь не падать — \`.catch(() => fallback)\` прямо на промисе, либо try внутри.

### Параллельный запуск, потом разный ожидаемый порядок
\`\`\`js
const aP = fetch('/a'); // ушёл
const bP = fetch('/b'); // ушёл
const a = await aP;     // ждём a
const b = await bP;     // b уже резолвлен, не блокирует
\`\`\`
Это пригождается когда нужны оба результата, но дальше код использует их в разном порядке.

### Что делает await c обычным значением
\`await 5\` → 5, но через микротаску. Часто полезно для разрыва длинной синхронной работы.

### Топ-уровневый await
В **ES-модулях** можно \`await\` прямо на уровне модуля без обёртки в async-функцию. В обычных скриптах — нельзя.

### Перехват ошибок в for-of с await
\`\`\`js
for (const url of urls) {
  try {
    await fetch(url);
  } catch (e) {
    // ошибка одного запроса не валит весь цикл
  }
}
\`\`\`
Без try одна ошибка прервёт обход.

### Не блокируй цикл бесполезным await
\`\`\`js
// плохо — все запросы делаются последовательно
for (const url of urls) {
  await fetch(url);
}
// хорошо — параллельно
await Promise.all(urls.map(fetch));
\`\`\`
      `),
      examples: [],
    },
    {
      id: "js-iterators-generators",
      title: "Итераторы и генераторы",
      description: "Symbol.iterator, generator-функции, делегирование, ленивые последовательности",
      theory: r(`
Объект **итерабельный**, если у него есть метод \`[Symbol.iterator]()\`, возвращающий **итератор** — объект с методом \`next()\`, отдающим \`{ value, done }\`.

### Кто итерабелен
Из коробки: \`Array\`, \`String\`, \`Map\`, \`Set\`, \`arguments\`, NodeList. Поэтому \`for...of\` работает.

\`\`\`js
const it = ['a', 'b'][Symbol.iterator]();
it.next(); // { value: 'a', done: false }
it.next(); // { value: 'b', done: false }
it.next(); // { value: undefined, done: true }
\`\`\`

### Сделать свой итерабельный объект
\`\`\`js
const range = {
  from: 1, to: 3,
  [Symbol.iterator]() {
    let cur = this.from;
    const last = this.to;
    return {
      next() {
        return cur <= last
          ? { value: cur++, done: false }
          : { value: undefined, done: true };
      }
    };
  }
};

for (const v of range) console.log(v); // 1, 2, 3
[...range]; // [1, 2, 3]
\`\`\`

### Генераторы — короткий способ
\`function*\` возвращает генератор — он сразу итерабельный и итератор одновременно.

\`\`\`js
function* range(from, to) {
  for (let i = from; i <= to; i++) yield i;
}

[...range(1, 3)]; // [1, 2, 3]
\`\`\`
\`yield x\` — приостановить и отдать \`x\`. \`gen.next()\` — продолжить до следующего yield.

### Передача данных В генератор
\`\`\`js
function* dialog() {
  const name = yield 'Как тебя зовут?';
  yield 'Привет, ' + name;
}
const g = dialog();
g.next();          // { value: 'Как тебя зовут?', done: false }
g.next('Аня');     // { value: 'Привет, Аня', done: false }
\`\`\`
Аргумент \`.next(x)\` становится значением последнего \`yield\`.

### Делегирование yield*
\`\`\`js
function* inner() { yield 1; yield 2; }
function* outer() { yield 0; yield* inner(); yield 3; }
[...outer()]; // [0, 1, 2, 3]
\`\`\`

### Ленивые последовательности
Генераторы — идеальный инструмент для бесконечных или дорогих последовательностей:
\`\`\`js
function* naturals() {
  let i = 1;
  while (true) yield i++;
}
function* take(n, iter) {
  for (const x of iter) {
    if (n-- <= 0) return;
    yield x;
  }
}
[...take(5, naturals())]; // [1, 2, 3, 4, 5]
\`\`\`

### Async-итераторы
\`for await (const chunk of stream)\` — обход асинхронных источников (стримы, пагинация). У объекта должен быть \`[Symbol.asyncIterator]()\`.
      `),
      examples: [],
    },
    {
      id: "js-modules-esm",
      title: "ES Modules vs CommonJS",
      description: "import/export, динамический импорт, статический анализ, циклические зависимости",
      theory: r(`
В JS два конкурирующих формата модулей: **CommonJS** (CJS, исторически Node) и **ES Modules** (ESM, стандарт ES2015).

### Сравнение
| | CommonJS | ES Modules |
|---|---|---|
| Синтаксис | \`require\` / \`module.exports\` | \`import\` / \`export\` |
| Загрузка | синхронная | асинхронная |
| Когда выполняется | при require (lazy) | при первом импорте, парсится заранее |
| Циклические зависимости | возвращает текущий exports | live bindings (см. ниже) |
| Static analysis (tree shaking) | плохо | отлично |
| top-level await | нет | да |

### ESM-синтаксис
\`\`\`js
// named exports
export const PI = 3.14;
export function area(r) { return PI * r * r; }

// default export
export default function main() {}

// импорт
import main, { PI, area } from './math.js';
import * as Math from './math.js';
import { PI as P } from './math.js';
\`\`\`

### Live bindings
\`import { count } from './state.js'\` — это **ссылка** на актуальное значение в модуле, не копия. Если внутри модуля \`count\` меняется — у импортирующего тоже обновится.

\`\`\`js
// state.js
export let count = 0;
export function inc() { count++; }

// main.js
import { count, inc } from './state.js';
console.log(count); // 0
inc();
console.log(count); // 1 — live binding, а не копия
\`\`\`
В CJS вы бы получили снапшот значения на момент require.

### Динамический импорт
\`\`\`js
const mod = await import('./heavy.js'); // возвращает промис с модулем
\`\`\`
Это единственный способ грузить ESM-модуль динамически. Бандлеры (vite/webpack) используют это для code-splitting.

### Циклические зависимости
В ESM работают за счёт hoisted-биндингов: если \`a.js\` импортирует \`b.js\`, который импортирует \`a.js\`, биндинги уже созданы (но могут быть в TDZ если читать слишком рано).
В CJS — частично проинициализированный \`module.exports\` возвращается, баги почти гарантированы.

### Когда что
- Бэкенд на Node — современный код в \`.mjs\` или \`"type": "module"\`. Старые пакеты — CJS.
- Браузер — только ESM (\`<script type="module">\`).
- Бандлеры умеют оба, но output чаще ESM для tree-shaking.
      `),
      examples: [],
    },
    {
      id: "js-proxy-reflect",
      title: "Proxy и Reflect",
      description: "Перехват операций, traps, Reflect-зеркало, паттерны",
      theory: r(`
**\`Proxy\`** — обёртка вокруг объекта, перехватывающая операции (чтение, запись, удаление, перечисление…). Это самый мощный мета-инструмент в JS.

\`\`\`js
const target = { a: 1 };
const proxy = new Proxy(target, {
  get(obj, prop, receiver) {
    console.log('читают', prop);
    return Reflect.get(obj, prop, receiver);
  },
  set(obj, prop, value) {
    if (typeof value !== 'number') throw new TypeError('только числа');
    return Reflect.set(obj, prop, value);
  }
});
proxy.a;       // лог: читают a → 1
proxy.b = 'x'; // TypeError
\`\`\`

### Главные ловушки (traps)
- \`get\` / \`set\` — чтение и запись.
- \`has\` — оператор \`in\`.
- \`deleteProperty\` — \`delete\`.
- \`ownKeys\` — \`Object.keys\`, \`for...in\`.
- \`apply\` — вызов как функции.
- \`construct\` — \`new\`.
- \`getPrototypeOf\` / \`setPrototypeOf\`.
- \`defineProperty\`, \`getOwnPropertyDescriptor\`.

### Reflect — родное API мета-операций
\`Reflect\` — статический объект с методами, **зеркальными** прокси-ловушкам. \`Reflect.get(obj, prop)\` делает то же, что \`obj[prop]\`, но в форме вызова — это удобно внутри прокси: операция возвращается к стандартному поведению с правильным \`receiver\`.

### Зачем нужен receiver
Если у объекта есть getter, и его читают через прокси, \`receiver\` указывает, **на ком** должен запуститься getter. Без передачи \`receiver\` геттер увидит \`this\` = target, а не proxy. Поэтому \`Reflect.get(obj, prop, receiver)\` — правильный паттерн.

### Применения
- **Валидация / нормализация записей** (пример выше).
- **Реактивность** — Vue 3 на этом построен: трекинг чтения через get-ловушку, оповещение слушателей через set.
- **Виртуальные свойства** — \`get\` отдаёт «вычисленные» поля, которых нет в target.
- **Логирование / трейс**.
- **Read-only обёртка** — set бросает TypeError.

### Цена
Прокси значительно медленнее прямого доступа. В горячем коде (миллионы итераций) — заметно. В обычном UI-коде — не критично.

### Что нельзя
- Нельзя сделать прокси «прозрачным» 1-в-1 — \`obj === proxy\` всегда false; instanceof работает только если \`getPrototypeOf\` пробрасывает.
- Прокси не работает на \`Map/Set\` через простой объектный API — у них свои internal slots; нужно проксировать методы через \`apply\`.
      `),
      examples: [],
    },
    {
      id: "js-symbols",
      title: "Symbol и well-known symbols",
      description: "Уникальные ключи, Symbol.iterator, .toPrimitive, паттерны",
      theory: r(`
**\`Symbol\`** — примитивный тип, создающий **гарантированно уникальное** значение. Даже два символа с одинаковым описанием не равны.

\`\`\`js
const a = Symbol('id');
const b = Symbol('id');
a === b; // false
\`\`\`

### Зачем нужны
1. **Скрытые / служебные ключи объекта** — символьные ключи не попадают в \`Object.keys\`, \`JSON.stringify\`, \`for...in\`. Их видно только через \`Object.getOwnPropertySymbols\`.
\`\`\`js
const SECRET = Symbol('secret');
const user = { name: 'Аня', [SECRET]: 42 };
JSON.stringify(user); // '{"name":"Аня"}' — symbol не сериализуется
\`\`\`
Это даёт «вежливую приватность»: чтобы случайно не пересечься с чужими ключами в плагине, библиотеке, расширении.

2. **Well-known symbols** — встроенные хуки, которые движок ищет на объектах для интеграции с языком:
   - \`Symbol.iterator\` — делает объект итерабельным (см. урок «Итераторы»).
   - \`Symbol.asyncIterator\` — для \`for await of\`.
   - \`Symbol.toPrimitive\` — кастомное приведение к примитиву.
   - \`Symbol.hasInstance\` — кастомный \`instanceof\`.
   - \`Symbol.toStringTag\` — что показывает \`Object.prototype.toString.call\`.

### Пример: toPrimitive
\`\`\`js
const money = {
  amount: 100, currency: 'EUR',
  [Symbol.toPrimitive](hint) {
    if (hint === 'string') return this.amount + ' ' + this.currency;
    if (hint === 'number') return this.amount;
    return this.amount + this.currency;
  }
};

\`Цена: \${money}\`;     // 'Цена: 100 EUR'  (hint='string')
money + 5;             // 105               (hint='default')
money * 2;             // 200               (hint='number')
\`\`\`

### Symbol.for и реестр
\`\`\`js
const a = Symbol.for('app:id');
const b = Symbol.for('app:id');
a === b; // true — берётся из глобального реестра
\`\`\`
Полезно когда нужно одну и ту же «магическую» строку расшарить между модулями/окнами/iframes.

### Что не работает
- \`new Symbol()\` — TypeError, нельзя.
- Символы нельзя неявно привести к строке: \`'id: ' + Symbol('x')\` — TypeError. Нужно \`String(s)\` или \`s.description\`.
- Не итерабельны.

### Когда уместно
- Любые служебные мета-поля на чужих объектах.
- Создание плагин-API, где не хочешь конфликтов имён.
- Реализация языковых протоколов (iterable, hasInstance и т.п.).
      `),
      examples: [],
    },
    {
      id: "js-weak-collections",
      title: "WeakMap, WeakSet, FinalizationRegistry",
      description: "Слабые ссылки, GC, приватные данные, кэши",
      theory: r(`
Обычные \`Map\`, \`Set\` держат **сильные** ссылки на ключи и значения — GC не соберёт объект, пока он там лежит. **\`WeakMap\` / \`WeakSet\`** держат **слабые** ссылки на ключи: если на ключ больше никто (кроме самой коллекции) не ссылается — пара удаляется и объект освобождается.

### Правила
- \`WeakMap\` — ключи **только объекты**. Не итерабелен (нет \`.size\`, \`.keys\`, \`.entries\`). API: \`.get\`, \`.set\`, \`.delete\`, \`.has\`.
- \`WeakSet\` — то же, но множество. API: \`.add\`, \`.delete\`, \`.has\`.

Почему не итерабелен: момент GC недетерминирован, перечисление дало бы непредсказуемый результат.

### Применение 1: приватные данные
\`\`\`js
const userPasswords = new WeakMap();

class User {
  constructor(name, pwd) {
    this.name = name;
    userPasswords.set(this, pwd);
  }
  checkPassword(p) { return userPasswords.get(this) === p; }
}
\`\`\`
Когда инстанс User собирается GC, его пароль автоматом исчезает из WeakMap. До приватных полей (\`#\`) это был основной способ инкапсуляции.

### Применение 2: кеш «по объекту»
\`\`\`js
const cache = new WeakMap();
function expensive(obj) {
  if (cache.has(obj)) return cache.get(obj);
  const result = compute(obj);
  cache.set(obj, result);
  return result;
}
\`\`\`
Когда вызывающий код выкинул \`obj\` — запись из кеша автоматом уйдёт. С обычным Map ты бы держал утечку.

### Применение 3: связать метаданные с DOM-элементами
\`\`\`js
const initialized = new WeakSet();
function init(el) {
  if (initialized.has(el)) return;
  initialized.add(el);
  // ...
}
\`\`\`
Удалил элемент из DOM — он уйдёт из WeakSet.

### FinalizationRegistry
\`\`\`js
const reg = new FinalizationRegistry(token => console.log('собрано:', token));
reg.register(someObj, 'someObj-id');
\`\`\`
Колбэк **может** быть вызван, когда объект собрался GC. Это «хоть какой-то» крючок на финализацию, но:
- Время вызова не гарантировано (может никогда).
- Внутри колбэка нельзя полагаться, что что-то живо.
- Только для последнего средства (логирование утечек, освобождение нативных ресурсов через WASM).

В обычном коде вам это не нужно. Если кажется что нужно — подумай ещё раз.

### Чего нельзя
- WeakRef / WeakMap по ключу-примитиву — нельзя (только объекты, и теперь Symbol с registered-флагом).
- Полагаться на то, что объект соберётся «сейчас» — нет, GC сам решает.
      `),
      examples: [],
    },
    {
      id: "js-functional",
      title: "Функциональные паттерны",
      description: "Каррирование, композиция, debounce/throttle, мемоизация",
      theory: r(`
### Каррирование (currying)
Преобразование функции от N аргументов в цепочку из N функций по одному аргументу.
\`\`\`js
const add = (a, b, c) => a + b + c;
const curry = fn => function curried(...args) {
  if (args.length >= fn.length) return fn(...args);
  return (...more) => curried(...args, ...more);
};

const addC = curry(add);
addC(1)(2)(3);  // 6
addC(1, 2)(3);  // 6
addC(1)(2, 3);  // 6
\`\`\`
Где полезно: создавать «частично применённые» функции (\`const addTen = addC(10)\`), удобно для конвейеров.

### Композиция и pipe
\`\`\`js
const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);
const pipe    = (...fns) => x => fns.reduce    ((v, f) => f(v), x);

const slugify = pipe(
  s => s.toLowerCase(),
  s => s.trim(),
  s => s.replace(/\\s+/g, '-')
);
slugify('  Hello World  '); // 'hello-world'
\`\`\`
\`compose\` — справа налево (\`f(g(x))\`), \`pipe\` — слева направо. \`pipe\` обычно читаемее.

### debounce
«Подожди, пока вызовы прекратятся, потом сработай один раз». Идеально для поиска по мере ввода.
\`\`\`js
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

input.oninput = debounce(e => search(e.target.value), 300);
\`\`\`

### throttle
«Срабатывай не чаще раза в N мс». Полезно для scroll/resize/mousemove.
\`\`\`js
function throttle(fn, ms) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}
\`\`\`

### Мемоизация
\`\`\`js
function memo(fn, key = JSON.stringify) {
  const cache = new Map();
  return (...args) => {
    const k = key(args);
    if (cache.has(k)) return cache.get(k);
    const v = fn(...args);
    cache.set(k, v);
    return v;
  };
}

const fib = memo(function f(n) {
  return n < 2 ? n : f(n - 1) + f(n - 2);
});
\`\`\`
Подводные камни: ключ должен корректно отражать аргументы (JSON.stringify плох для объектов с порядком ключей и циклами), кеш растёт неограниченно (для long-running приложений нужен LRU или WeakMap-кеш).

### Иммутабельность
\`\`\`js
// плохо — мутируем
arr.push(x);
obj.field = 1;

// хорошо — новый объект
const next = [...arr, x];
const next = { ...obj, field: 1 };
\`\`\`
Это база React/Redux/Vue 3 reactivity: новая ссылка = известно что изменилось.
      `),
      examples: [],
    },
    {
      id: "js-memory-gc",
      title: "Память и GC",
      description: "Mark & sweep, утечки памяти, замыкания и DOM",
      theory: r(`
JS-движки используют **сборщик мусора** (GC) на основе достижимости. Объект собирается, если до него **нет цепочки ссылок** от корня (globalThis, текущий стек, активные функции).

### Mark & Sweep + поколения
1. Mark — пройти все ссылки от корней, пометить достижимые.
2. Sweep — освободить непомеченные.
3. На практике V8 делит heap на «young» / «old» поколения: молодые объекты живут недолго, их чистят чаще и быстро (Scavenge). Дожившие переезжают в old, там mark-and-compact реже но крупнее.

GC недетерминирован — нельзя надеяться «вот сейчас всё освободится».

### Утечки памяти — топ-причины
1. **Глобальные переменные**, забытые без \`let\`/\`const\` в нестрогом режиме (\`name = 'x'\` создаёт \`window.name\`).
2. **Таймеры с замыканиями**:
   \`\`\`js
   const big = new Array(1_000_000);
   setInterval(() => use(big), 1000);
   \`\`\`
   Если интервал не \`clearInterval\` — \`big\` живёт вечно.
3. **Подписки на события без отписки** — \`window.addEventListener\` в SPA: ушёл со страницы, забыл \`removeEventListener\` → обработчик с замыканием держит весь компонент.
4. **Detached DOM**:
   \`\`\`js
   const node = document.getElementById('x');
   document.body.removeChild(node);
   // node всё ещё в переменной → не собирается; если в node висит handler с замыканием — держит ещё больше
   \`\`\`
5. **Большие данные в кэше Map** — обычный Map не отпустит. См. WeakMap.
6. **Циклические ссылки** в objects-with-listeners — современный GC справляется, но если в обе стороны есть «корневые» якоря — нет.

### Как диагностировать
- Chrome DevTools → Memory → Heap snapshot. Сними два снимка с интервалом активности и сравни «Retained Size» по классам.
- Performance.memory.usedJSHeapSize — груб, но виден тренд.
- В React/Vue особенно следи за подписками внутри useEffect/onMounted — всегда возвращай cleanup.

### Замыкания и память
Замыкание держит окружение, **где была объявлена функция**. Большая ошибка — оставить ссылку на огромный объект в окружении, хотя замыкание им не пользуется:
\`\`\`js
function init() {
  const huge = loadHuge();
  const handler = () => console.log('click'); // не использует huge, но окружение всё равно держит
  button.addEventListener('click', handler);
}
\`\`\`
Современные движки умеют это оптимизировать (escape-анализ), но не всегда. Самый надёжный способ — не объявлять huge в одном scope с handler.

### typeof, weakRef, finalizationRegistry
Можно явно дать GC знать «эту ссылку держи слабо» через \`WeakRef\` / \`WeakMap\` / \`FinalizationRegistry\`. Но это нишевое; в 99% кода достаточно дисциплины: отписался, очистил таймер, не держи лишнее в замыкании.
      `),
      examples: [],
    },
  ],
};
