import type { Block } from "./topics";

const r = (s: string) => s.replace(/^\n/, "");

export const typescriptBlock: Block = {
  id: "typescript",
  emoji: "🟦",
  title: "TypeScript",
  description:
    "От базовых типов до conditional/mapped/template literal — максимально подробный курс по системе типов.",
  topics: [
    {
      id: "ts-basics",
      title: "Базовые типы",
      description: "primitives, any/unknown/never/void, массивы и кортежи",
      theory: r(`
TypeScript — это надстройка над JS, добавляющая статическую типизацию. После компиляции типы стираются (\`tsc\` выдаёт обычный JS) — это значит, они существуют **только** на этапе разработки и сборки.

### Примитивные типы
\`\`\`ts
let id: number = 42;
let name: string = "Аня";
let active: boolean = true;
let big: bigint = 9_007_199_254_740_993n;
let sym: symbol = Symbol("id");
let nothing: null = null;
let undef: undefined = undefined;
\`\`\`
Обычно типы явно писать не нужно — TS их выводит сам (type inference). Тип пишут на параметрах функции, возвратах публичных API и когда вывод оказался шире, чем нужно.

### any vs unknown
\`\`\`ts
let a: any;     // отказ от проверок — можно делать что угодно
a.foo.bar();    // ОК для компилятора, упадёт в рантайме
a = 5; a = 'x'; // ОК

let u: unknown; // безопасный «что угодно»
u.foo;          // Ошибка: нельзя без сужения
if (typeof u === 'string') u.toUpperCase(); // OK после narrowing
\`\`\`
Правило: вместо \`any\` всегда стремись к \`unknown\` — TS заставит тебя проверить тип перед использованием. \`any\` — escape hatch для интеграции с нетипизированным кодом.

### never и void
- \`void\` — функция не возвращает значение: \`function log(): void {}\`. Для переменных используется редко.
- \`never\` — функция **никогда** не вернёт нормально (бросает, бесконечный цикл, exhaustive narrowing).
\`\`\`ts
function fail(msg: string): never { throw new Error(msg); }
\`\`\`
\`never\` — нижний тип системы: \`never\` присваиваем к любому, но любой к \`never\` — только сам \`never\`. Используется как «оставшийся случай» в exhaustive switch (см. урок про discriminated unions).

### Массивы и кортежи
\`\`\`ts
const nums: number[] = [1, 2, 3];
const nums2: Array<number> = [1, 2, 3];     // эквивалент

// Tuple — фиксированная длина и типы по позициям
const pair: [string, number] = ['age', 30];
const rgb: readonly [number, number, number] = [255, 0, 0];

// Variadic tuple types
type WithFirst<T extends unknown[]> = [string, ...T];
type Args = WithFirst<[number, boolean]>; // [string, number, boolean]
\`\`\`

### Объекты
\`\`\`ts
let user: { id: number; name: string; email?: string } = {
  id: 1, name: 'Аня'
};
\`\`\`
\`email?\` — опционально (тип становится \`string | undefined\`).

### Функции
\`\`\`ts
function add(a: number, b: number): number { return a + b; }
const sub: (a: number, b: number) => number = (a, b) => a - b;
const greet = (name: string, formal = false): string =>
  formal ? \`Добрый день, \${name}\` : \`Привет, \${name}\`;
\`\`\`

### Type assertion (as)
\`\`\`ts
const el = document.getElementById('x') as HTMLInputElement;
el.value;
\`\`\`
\`as\` — «доверь мне, это вот этот тип». Используй только когда **точно** знаешь больше компилятора. См. подробно урок про assertions.
      `),
      examples: [],
    },
    {
      id: "ts-interface-vs-type",
      title: "interface vs type",
      description: "Чем отличаются, когда что выбирать, declaration merging",
      theory: r(`
\`interface\` и \`type\` в TS почти эквивалентны для описания объектных форм. Различия:

### Сходства
\`\`\`ts
interface User { id: number; name: string }
type User = { id: number; name: string }; // эквивалент

interface User { admin?: boolean } // расширение
type User2 = User & { admin?: boolean };
\`\`\`

### Чем отличаются
1. **Declaration merging** — только \`interface\`:
\`\`\`ts
interface Window { myApp: { ready: boolean } }
interface Window { myApp2: { ready: boolean } } // мерджится в один Window
\`\`\`
Это нужно для аугментации типов из чужих библиотек (см. урок про declaration merging).

2. **Объединения / пересечения / тип-выражения** — только \`type\`:
\`\`\`ts
type Status = 'idle' | 'loading' | 'done';
type Pair = [string, number];
type Or<A, B> = A | B;
type Without<T, U> = T extends U ? never : T;
\`\`\`
\`interface\` описывает только **объектные/функциональные** формы.

3. **Наследование** — синтаксис разный:
\`\`\`ts
interface Admin extends User { role: string }       // interface
type Admin = User & { role: string };                // type
\`\`\`
Семантически почти одинаково, но при пересечении \`type\` (через \`&\`) если поля конфликтуют — получишь \`never\`. У \`interface extends\` будет ошибка компиляции — что обычно лучше.

4. **Производительность** — \`interface\` чуть лучше для частых проверок присваивания: TS специально оптимизирует кеширование сравнений. На больших проектах с длинными цепочками \`&\` это заметно.

### Когда что
- **Публичный API библиотеки, объект, есть шанс что кто-то захочет расширить** → \`interface\`.
- **Тип-выражение, union, mapped, conditional, tuple, alias примитива** → \`type\`.
- **Внутренние короткие алиасы** → \`type\` (короче и универсальнее).

Команды чаще держат конвенцию: «все объектные формы — \`interface\`», или «всё — \`type\`». Любая выбранная — лучше, чем хаотичная смесь.

### implements работает с обоими
\`\`\`ts
class Service implements User {} // и для interface, и для type
\`\`\`

### Гибридные типы (callable + properties)
\`\`\`ts
interface Counter {
  (): number;            // вызов
  reset(): void;         // метод
  count: number;         // поле
}
\`\`\`
Аналог через \`type\`:
\`\`\`ts
type Counter = {
  (): number;
  reset(): void;
  count: number;
};
\`\`\`
      `),
      examples: [],
    },
    {
      id: "ts-unions-intersections",
      title: "Объединения и пересечения",
      description: "union | , intersection &, дискриминируемые объединения",
      theory: r(`
### Union (\`|\`)
\`A | B\` — значение, которое **может быть** A или B.
\`\`\`ts
function pad(value: string | number, padding: string) {
  return value + padding;
}
pad('x', '-');  // OK
pad(5,   '-');  // OK
pad(true,'-');  // Error
\`\`\`
Внутри функции TS позволяет работать только с **общими** операциями обоих типов. Чтобы вызвать что-то специфичное — нужно **сузить** тип (narrowing) через typeof/in/instanceof:
\`\`\`ts
function len(x: string | number) {
  if (typeof x === 'string') return x.length;
  return x.toString().length;
}
\`\`\`

### Intersection (\`&\`)
\`A & B\` — значение, у которого есть свойства **И** A, **И** B.
\`\`\`ts
type WithId = { id: number };
type WithName = { name: string };
type Both = WithId & WithName;

const x: Both = { id: 1, name: 'a' };
\`\`\`
Конфликтующие поля приведут к \`never\`:
\`\`\`ts
type Bad = { x: string } & { x: number }; // x: never
\`\`\`

### Union of primitives — заменитель enum
\`\`\`ts
type Status = 'idle' | 'loading' | 'success' | 'error';

function show(s: Status) { /* ... */ }
show('done'); // Error: '"done"' is not assignable to '"idle" | ...'
\`\`\`
Это лучше \`enum\`: тип стирается в рантайме (нет рантайм-объекта), значения — обычные строки.

### Discriminated unions (теги)
Когда union — объекты, добавляй **тег** для надёжного сужения:
\`\`\`ts
type Shape =
  | { kind: 'circle';  r: number }
  | { kind: 'square';  side: number }
  | { kind: 'rect';    w: number; h: number };

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle': return Math.PI * s.r ** 2;
    case 'square': return s.side ** 2;
    case 'rect':   return s.w * s.h;
    default: {
      const _exhaustive: never = s;     // если добавишь новый кейс — ошибка
      return _exhaustive;
    }
  }
}
\`\`\`
Подробнее — в уроке «Discriminated unions».

### Distribution в union
Если \`T\` — union, то \`T extends U ? X : Y\` применяется **к каждому члену** union, и результат собирается обратно через \`|\`:
\`\`\`ts
type ExcludeString<T> = T extends string ? never : T;
type A = ExcludeString<string | number | boolean>; // number | boolean
\`\`\`
Это поведение даёт работать \`Exclude<T,U>\` и \`Extract<T,U>\` из коробки.

Чтобы **выключить** дистрибуцию — оберни в кортеж:
\`\`\`ts
type NoDistr<T> = [T] extends [string] ? 'str' : 'other';
type X = NoDistr<string | number>; // 'other' (не дистрибутирует)
\`\`\`
      `),
      examples: [],
    },
    {
      id: "ts-literal-const",
      title: "Литералы и const assertions",
      description: "string/number literal types, as const, readonly tuples",
      theory: r(`
### Literal types
Конкретное **значение** как тип:
\`\`\`ts
let dir: 'left' | 'right' | 'up' | 'down';
dir = 'left';   // OK
dir = 'forward'; // Error
\`\`\`

\`\`\`ts
type Bits = 0 | 1;
type Magic = 42 | 137;
\`\`\`

### Widening
По умолчанию TS **расширяет** литерал до общего типа:
\`\`\`ts
const a = 'left';       // тип: 'left' (литерал, потому что const)
let b = 'left';         // тип: string (let → widening)

const obj = { dir: 'left' };
obj.dir;                // тип: string, не 'left' — потому что свойство let-подобное
\`\`\`

### as const
\`as const\` запрещает widening и делает структуру **readonly**:
\`\`\`ts
const obj = { dir: 'left', steps: 3 } as const;
// тип: { readonly dir: 'left'; readonly steps: 3 }

const arr = [1, 2, 3] as const;
// тип: readonly [1, 2, 3]   — tuple, не number[]
\`\`\`
Это **самый частый трюк** для извлечения значений в union:
\`\`\`ts
const ROUTES = ['/', '/about', '/contact'] as const;
type Route = typeof ROUTES[number]; // '/' | '/about' | '/contact'
\`\`\`

### Literal narrowing функцией
\`\`\`ts
function move(dir: 'left' | 'right') {}

const obj = { dir: 'left' };
move(obj.dir);           // Error: тип obj.dir расширен до string

move(obj.dir as 'left'); // OK через assertion
// или фиксируй на месте создания:
const obj2 = { dir: 'left' as const };
move(obj2.dir);          // OK
\`\`\`

### Template literal types + literals
\`\`\`ts
type Lang = 'ru' | 'en';
type Greeting = \`hello-\${Lang}\`; // 'hello-ru' | 'hello-en'
\`\`\`
См. подробнее урок про template literal types.

### Числовые литералы
\`\`\`ts
type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;
function roll(): DiceRoll { /* ... */ }
\`\`\`
Удобно для значений с ограниченным набором, для которых enum избыточен.

### readonly
\`as const\` глубоко readonly. Локально можно делать так:
\`\`\`ts
const arr: readonly number[] = [1, 2, 3];
arr.push(4); // Error
\`\`\`
\`Readonly<T>\` (utility type) — поверхностно readonly для объекта. См. урок про utility types.
      `),
      examples: [],
    },
    {
      id: "ts-enums",
      title: "enum и альтернативы",
      description: "numeric, string, const enum; что лучше — union of literals",
      theory: r(`
\`enum\` в TS — едва ли не единственная конструкция, **которая существует в рантайме** (в отличие от type/interface). Это компилируется в объект с обратным маппингом значений.

### Numeric enum
\`\`\`ts
enum Direction { Up, Down, Left, Right }
Direction.Up;       // 0
Direction[0];       // 'Up' — reverse mapping
\`\`\`
Значения нумеруются с 0, можно задать стартовое: \`enum E { A = 1, B, C }\` → 1, 2, 3.

### String enum
\`\`\`ts
enum Color { Red = 'RED', Green = 'GREEN' }
\`\`\`
Без обратного маппинга. Удобно для отладки (значения читаемые).

### const enum
\`\`\`ts
const enum Status { Idle, Loading }
const s = Status.Idle; // в выводе компилятора: const s = 0; — enum исчезает
\`\`\`
Inline-подстановка → нулевой рантайм-cost. **Но** ломается с \`isolatedModules\` (Babel, esbuild, Vite), потому что они не делают cross-file substitution. На практике const enum избегают именно по этой причине.

### Проблемы enum
1. **Лишний код в бандле** (для не-const).
2. **Reverse mapping** для numeric — обычно не нужен.
3. **Strict-режимы** запрещают численное присваивание (\`function (d: Direction) {}; d(5);\` — пройдёт, но это плохо).
4. **isolatedModules** конфликт.
5. **Tree-shaking** хуже, чем у union+const.

### Альтернатива — union of literals
\`\`\`ts
const Direction = { Up: 'up', Down: 'down', Left: 'left', Right: 'right' } as const;
type Direction = typeof Direction[keyof typeof Direction];
// 'up' | 'down' | 'left' | 'right'
\`\`\`
- Тип стирается в рантайме (\`Direction\` — обычный объект).
- Bundler видит const-объект, отлично trеешейкит.
- Совместимо с любым тулчейном.

### Альтернатива — discriminated union
Если нужны действия — заведи объект с функциями:
\`\`\`ts
type Action =
  | { type: 'INC' }
  | { type: 'DEC' }
  | { type: 'SET', value: number };
\`\`\`
Это не enum, но решает много задач, где раньше брали enum.

### Когда enum нормально
- Совместимость с уже существующим кодом / API, где значения — числа (битовые маски).
- Очень короткий проект без жёстких требований к бандлу.
- Командная конвенция говорит брать enum.

В новом коде современные TS-команды чаще предпочитают \`as const\`-объект + union of literals.
      `),
      examples: [],
    },
    {
      id: "ts-generics",
      title: "Generics: основы",
      description: "Параметры типов, инференция, повторное использование",
      theory: r(`
**Generic** — параметр типа, который позволяет писать функции/классы/типы, работающие с разными типами **без потери информации**.

### Зачем
\`\`\`ts
// Без generics — теряем тип
function first(arr: any[]): any { return arr[0]; }
const x = first([1, 2, 3]); // x: any, мы потеряли что это number

// С generic — сохраняем
function first<T>(arr: T[]): T { return arr[0]; }
const x = first([1, 2, 3]); // x: number — TS вывел T=number
\`\`\`

### Инференция
В большинстве случаев TS сам определяет тип-параметр по аргументам — писать \`first<number>([1,2,3])\` не нужно. Явное указание помогает когда:
- Инференция выводит слишком широкий или не тот тип.
- У функции нет аргумента, который даёт инференцию: \`createState<{count: number}>()\`.

### Несколько параметров
\`\`\`ts
function pair<A, B>(a: A, b: B): [A, B] { return [a, b]; }
const p = pair('x', 42); // [string, number]
\`\`\`

### Generic-типы
\`\`\`ts
type Box<T> = { value: T };
type Pair<A, B> = [A, B];
type Dict<V> = Record<string, V>;
\`\`\`

### Generic-интерфейсы и классы
\`\`\`ts
interface ApiResponse<T> {
  data: T;
  error: string | null;
}

class Stack<T> {
  private items: T[] = [];
  push(x: T) { this.items.push(x); }
  pop(): T | undefined { return this.items.pop(); }
}

const s = new Stack<number>();
s.push(1); // OK
s.push('x'); // Error
\`\`\`

### Generic constraint extends
\`T extends X\` — «T должно быть совместимо с X». Подробнее в следующем уроке.
\`\`\`ts
function getId<T extends { id: number }>(x: T): number { return x.id; }
getId({ id: 1, name: 'x' }); // OK
getId({ name: 'x' });        // Error — нет id
\`\`\`

### Generic + дефолты
\`\`\`ts
function create<T = string>(): T[] { return []; }
const a = create();             // string[]
const b = create<number>();     // number[]
\`\`\`

### Антипаттерны
- \`function f<T>(x: T) {...}\` где T используется один раз — лишний параметр. Достаточно \`function f(x: unknown)\` или \`function f(x: any)\`.
- Превращать всё подряд в generic «на будущее». Generic — это абстракция, а абстракция — налог на читаемость. Делай его только когда есть **минимум два** реальных вызова с разными типами.
- \`<T extends any>(\` в стрелочной функции — двусмысленность с JSX в .tsx; пиши \`<T,>(\` (висячая запятая) или \`<T extends unknown>(\`.
      `),
      examples: [],
    },
    {
      id: "ts-generics-constraints",
      title: "Generics: extends, default, multiple",
      description: "Ограничения T extends, дефолты, несколько параметров",
      theory: r(`
### extends — ограничение
\`\`\`ts
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const u = { name: 'Аня', age: 30 };
pluck(u, 'name'); // string
pluck(u, 'age');  // number
pluck(u, 'x');    // Error: '"x"' is not assignable to 'name'|'age'
\`\`\`
Эта функция — типовой паттерн «возьми поле по имени». TS даёт точный тип результата через \`T[K]\` (indexed access).

### Несколько параметров и связь между ними
\`\`\`ts
function entries<K extends string, V>(obj: Record<K, V>): [K, V][] {
  return Object.entries(obj) as [K, V][];
}
\`\`\`
\`K\` ограничен \`string\`, \`V\` свободен — но они связаны через \`Record<K, V>\`.

### Defaults
\`\`\`ts
type ApiResponse<T = unknown, E = string> = {
  data: T;
  error: E | null;
};

type A = ApiResponse;             // ApiResponse<unknown, string>
type B = ApiResponse<User>;       // ApiResponse<User, string>
type C = ApiResponse<User, Error>;
\`\`\`
Дефолты позволяют не писать пустые \`<>\` и не загромождать API.

### Constraint + default вместе
\`\`\`ts
function getKey<T extends object, K extends keyof T = keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
\`\`\`

### Conditional через extends
\`extends\` внутри type-выражения — это условный тип:
\`\`\`ts
type IsString<T> = T extends string ? true : false;
type A = IsString<'x'>;   // true
type B = IsString<5>;     // false
\`\`\`
Подробнее в уроке про conditional types.

### keyof и indexed access — лучшие друзья generic
\`\`\`ts
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};
\`\`\`
Это уже mapped type, тоже свой урок есть. Но обрати внимание: generic T → keyof T → перебор → T[K] — это базовая комбинация для любых типовых трансформаций.

### Variance — кратко
- Параметры **функций** контравариантны: \`(a: Animal) => void\` присваиваем в \`(a: Dog) => void\`, не наоборот (с \`strictFunctionTypes\`).
- Возвраты ковариантны: возвращающая \`Dog\` функция совместима там, где ждут возвращающую \`Animal\`.

Это редко вспоминают, но когда TS ругается на странное несовпадение колбэков — корень обычно тут.

### Generic constraint: типичные ошибки
\`\`\`ts
function copy<T>(x: T): T {
  return { ...x }; // Error: spread of non-object
}
function copy<T extends object>(x: T): T {
  return { ...x }; // OK
}
\`\`\`
Без \`extends\` TS не знает, что T — объект, поэтому spread недопустим.
      `),
      examples: [],
    },
    {
      id: "ts-utility-types",
      title: "Utility-типы",
      description: "Partial, Required, Pick, Omit, Record, Readonly, ReturnType, Parameters",
      theory: r(`
TS поставляет десятки готовых **utility-типов** в \`lib.es5.d.ts\`. Знать наизусть стоит топ-10.

### Partial / Required
\`\`\`ts
type User = { id: number; name: string; email: string };

type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string }

type RequiredUser = Required<{ id?: number; name?: string }>;
// { id: number; name: string }
\`\`\`
\`Partial\` нужен для PATCH-апдейтов: \`function update(id: number, patch: Partial<User>)\`.

### Pick / Omit
\`\`\`ts
type UserPreview = Pick<User, 'id' | 'name'>;        // { id; name }
type UserNoEmail = Omit<User, 'email'>;              // { id; name }
\`\`\`
\`Omit\` чаще, чем \`Pick\` — удобно убрать ровно одно поле.

### Record
\`\`\`ts
type Roles = 'admin' | 'editor' | 'viewer';
type Permissions = Record<Roles, string[]>;
// { admin: string[]; editor: string[]; viewer: string[] }

const p: Permissions = {
  admin: ['*'],
  editor: ['read', 'write'],
  viewer: ['read']
};
\`\`\`
Эквивалентно \`{ [K in Roles]: string[] }\`.

### Readonly / readonly arrays
\`\`\`ts
type Frozen = Readonly<User>;     // { readonly id; readonly name; readonly email }
const arr: ReadonlyArray<number> = [1, 2]; // .push не существует
const t: readonly [string, number] = ['a', 1]; // readonly tuple
\`\`\`
\`Readonly\` — **поверхностно** (deep readonly писать самому через рекурсивный mapped).

### ReturnType / Parameters
\`\`\`ts
function fetchUser(id: number): Promise<User> { /*...*/ }

type Ret  = ReturnType<typeof fetchUser>;  // Promise<User>
type Args = Parameters<typeof fetchUser>;  // [id: number]
\`\`\`
Внутри ReturnType — \`infer\`. Подробнее — урок про conditional types.

### Awaited
\`\`\`ts
type U = Awaited<Promise<Promise<User>>>; // User — раскрывает любую глубину
\`\`\`

### Exclude / Extract
\`\`\`ts
type T1 = Exclude<'a' | 'b' | 'c', 'a'>;        // 'b' | 'c'
type T2 = Extract<'a' | 'b' | 'c', 'a' | 'z'>;  // 'a'
type T3 = NonNullable<string | null | undefined>; // string
\`\`\`

### Construct/Instance types
\`\`\`ts
class Foo {}
type CF = typeof Foo;          // конструктор
type IF = InstanceType<CF>;    // Foo
\`\`\`
Полезно для DI-контейнеров и фабрик.

### Самописные utility — каркас
\`\`\`ts
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
\`\`\`

### Где смотреть
\`Ctrl+Click\` на \`Partial\` в VSCode → перепрыгнешь в \`lib.es5.d.ts\` и увидишь определения всех utility — это идеальное обучение mapped/conditional типам.
      `),
      examples: [],
    },
    {
      id: "ts-mapped-types",
      title: "Mapped types",
      description: "{ [K in Keys]: ... }, key remapping через as",
      theory: r(`
**Mapped type** перебирает ключи и трансформирует каждый.

### Базовая форма
\`\`\`ts
type Stringify<T> = { [K in keyof T]: string };
type S = Stringify<{ a: number; b: boolean }>; // { a: string; b: string }
\`\`\`

### Сохраняем тип значения
\`\`\`ts
type Clone<T> = { [K in keyof T]: T[K] };
\`\`\`

### Добавление/удаление модификаторов
\`+\` или \`-\` перед \`?\` / \`readonly\`:
\`\`\`ts
type Required<T> = { [K in keyof T]-?: T[K] };
type Mutable<T>  = { -readonly [K in keyof T]: T[K] };

type Partial<T>  = { [K in keyof T]?: T[K] };
type Readonly<T> = { readonly [K in keyof T]: T[K] };
\`\`\`
Вот так пишутся встроенные utility-типы.

### Mapping по произвольному union ключей
\`\`\`ts
type Flags<K extends string> = { [P in K]: boolean };
type F = Flags<'dark' | 'compact'>; // { dark: boolean; compact: boolean }
\`\`\`

### Key remapping через as (TS 4.1+)
Можно **переименовывать** или **отфильтровать** ключи:
\`\`\`ts
type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K]
};
type G = Getters<{ name: string; age: number }>;
// { getName: () => string; getAge: () => number }
\`\`\`

Фильтрация — \`as never\` убирает ключ:
\`\`\`ts
type RemoveType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K]
};
type Without = RemoveType<{ a: string; b: number; c: string }, string>;
// { b: number }
\`\`\`

### Mapped + conditional + infer
\`\`\`ts
type UnwrapPromise<T> = {
  [K in keyof T]: T[K] extends Promise<infer R> ? R : T[K]
};

type X = UnwrapPromise<{ a: Promise<string>; b: number }>;
// { a: string; b: number }
\`\`\`

### Reverse Record
\`\`\`ts
type ReverseRecord<T extends Record<string, string>> = {
  [V in T[keyof T]]: { [K in keyof T]: T[K] extends V ? K : never }[keyof T]
};

const x = { a: 'x', b: 'y' } as const;
type R = ReverseRecord<typeof x>;
// { x: 'a'; y: 'b' }
\`\`\`

### Производительность
Mapped types — самые дорогие в типовой системе. Цепочки на больших union (\`keyof T\` где T огромный) могут уходить в тысячи мс компиляции. Если IDE «висит» — кандидат №1. Решения: упрощать, кешировать промежуточные типы через alias, ограничивать \`K extends string\`.
      `),
      examples: [],
    },
    {
      id: "ts-conditional-types",
      title: "Conditional types и infer",
      description: "T extends U ? X : Y, distribution, ключевое слово infer",
      theory: r(`
**Conditional type** — \`T extends U ? X : Y\`. Если \`T\` совместим с \`U\` — возвращается \`X\`, иначе \`Y\`.

### Базовый пример
\`\`\`ts
type IsArray<T> = T extends any[] ? true : false;
type A = IsArray<number[]>; // true
type B = IsArray<string>;   // false
\`\`\`

### Distribution (распределение)
Если \`T\` — **голый union-параметр**, conditional применяется к **каждому** члену:
\`\`\`ts
type ToArray<T> = T extends any ? T[] : never;
type X = ToArray<string | number>; // string[] | number[]
\`\`\`

Заметь: \`extends any\` — тривиально истинно, но включает дистрибуцию.

Отключение дистрибуции — обернуть оба бока в кортеж \`[T]\`:
\`\`\`ts
type ToArrayNoDistr<T> = [T] extends [any] ? T[] : never;
type Y = ToArrayNoDistr<string | number>; // (string | number)[]
\`\`\`

Так работают встроенные:
\`\`\`ts
type Exclude<T, U> = T extends U ? never : T;
type Extract<T, U> = T extends U ? T : never;
type NonNullable<T> = T extends null | undefined ? never : T;
\`\`\`

### infer — извлечение типа из паттерна
\`\`\`ts
type ReturnType<F> = F extends (...args: any[]) => infer R ? R : never;

type R1 = ReturnType<() => string>;       // string
type R2 = ReturnType<(a: number) => User>; // User
\`\`\`
\`infer R\` — «здесь введи новую типовую переменную R, мне всё равно как, лишь бы паттерн сошёлся». Внутри ветки \`true\` — \`R\` доступна.

### Несколько infer
\`\`\`ts
type Params<F> = F extends (...args: infer A) => any ? A : never;
type Awaited<T> = T extends Promise<infer V> ? Awaited<V> : T;

type FirstArg<F> = F extends (a: infer A, ...rest: any) => any ? A : never;
\`\`\`

### Распаковка кортежа
\`\`\`ts
type Head<T extends any[]> = T extends [infer H, ...any[]] ? H : never;
type Tail<T extends any[]> = T extends [any, ...infer R] ? R : never;
type Last<T extends any[]> = T extends [...any, infer L] ? L : never;

type H = Head<[1, 2, 3]>;  // 1
type T = Tail<[1, 2, 3]>;  // [2, 3]
type L = Last<[1, 2, 3]>;  // 3
\`\`\`

### Извлечение типа из массива
\`\`\`ts
type ItemOf<T> = T extends (infer I)[] ? I : never;
type I = ItemOf<{ id: number }[]>; // { id: number }
\`\`\`

### Реальный пример — типизация event-emitter
\`\`\`ts
type Events = { click: { x: number; y: number }; scroll: number };

function on<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void) {}

on('click',  e => console.log(e.x, e.y)); // OK
on('scroll', y => console.log(y));        // OK
\`\`\`

### Distribution-ловушка
\`\`\`ts
type NonEmpty<T> = T extends '' ? never : T;
type X = NonEmpty<'' | 'a' | 'b'>; // 'a' | 'b' — дистрибуция нам помогла
\`\`\`
А вот это уже сюрприз:
\`\`\`ts
type AllNumber<T> = T extends number ? 'yes' : 'no';
type Y = AllNumber<1 | 2 | 'a'>; // 'yes' | 'no' — для каждого члена по отдельности
// если нужно глобальное "все — числа?":
type AllNumber2<T> = [T] extends [number] ? 'yes' : 'no';
type Y2 = AllNumber2<1 | 2 | 'a'>; // 'no'
\`\`\`
      `),
      examples: [],
    },
    {
      id: "ts-template-literals",
      title: "Template literal types",
      description: "Строковые шаблоны на уровне типов, Uppercase/Lowercase/Capitalize",
      theory: r(`
**Template literal types** позволяют конструировать строковые типы из других строковых типов — как обычные template strings, только в type-системе.

### Простой пример
\`\`\`ts
type Lang = 'ru' | 'en';
type Greeting = \`hello-\${Lang}\`; // 'hello-ru' | 'hello-en'
\`\`\`

### Кросс-произведение union
Каждый union в шаблоне распределяется:
\`\`\`ts
type Size = 'sm' | 'md' | 'lg';
type Color = 'red' | 'blue';
type Class = \`btn-\${Size}-\${Color}\`;
// 'btn-sm-red' | 'btn-sm-blue' | 'btn-md-red' | ...
\`\`\`

### Intrinsic string utility types
\`\`\`ts
type A = Uppercase<'hello'>;   // 'HELLO'
type B = Lowercase<'HELLO'>;   // 'hello'
type C = Capitalize<'hello'>;  // 'Hello'
type D = Uncapitalize<'Hello'>;// 'hello'
\`\`\`

### Парсинг строк
\`\`\`ts
type ExtractRoute<S> = S extends \`/\${infer Path}\` ? Path : never;
type R = ExtractRoute<'/users'>; // 'users'

type Split<S extends string, D extends string> =
  S extends \`\${infer H}\${D}\${infer T}\`
    ? [H, ...Split<T, D>]
    : [S];

type P = Split<'a.b.c', '.'>; // ['a', 'b', 'c']
\`\`\`

### Реальное применение: type-safe API
\`\`\`ts
type Resource = 'users' | 'posts' | 'comments';
type Method = 'GET' | 'POST' | 'DELETE';
type Endpoint = \`\${Method} /api/\${Resource}\`;

function call(endpoint: Endpoint) {}
call('GET /api/users');     // OK
call('GET /api/banana');    // Error
call('PATCH /api/users');   // Error
\`\`\`

### Getter / setter названия
\`\`\`ts
type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K]
};

type G = Getters<{ name: string; age: number }>;
// { getName: () => string; getAge: () => number }
\`\`\`

### Парсинг path-параметров (как в React Router)
\`\`\`ts
type Params<S> =
  S extends \`\${infer _Pre}:\${infer P}/\${infer Rest}\`
    ? { [K in P | keyof Params<Rest>]: string }
    : S extends \`\${infer _Pre}:\${infer P}\`
      ? { [K in P]: string }
      : {};

type P = Params<'/users/:id/posts/:postId'>;
// { id: string; postId: string }
\`\`\`

### Производительность
Длинные шаблоны с большими union'ами очень быстро взрывают компилятор — кросс-произведение растёт мультипликативно. Если кажется, что нужно — может проще ограничиться \`string\` и валидировать в рантайме.
      `),
      examples: [],
    },
    {
      id: "ts-type-guards",
      title: "Type guards и narrowing",
      description: "typeof, instanceof, in, кастомные предикаты is",
      theory: r(`
**Narrowing** — это сужение типа переменной по результатам проверки. TS видит \`if\` и понимает, что внутри блока тип уже не \`A | B\`, а конкретный.

### typeof
\`\`\`ts
function len(x: string | number): number {
  if (typeof x === 'string') return x.length; // x: string
  return x.toString().length;                  // x: number
}
\`\`\`

### instanceof
\`\`\`ts
function area(s: Circle | Square): number {
  if (s instanceof Circle) return Math.PI * s.r ** 2; // s: Circle
  return s.side ** 2;                                  // s: Square
}
\`\`\`

### in (property check)
\`\`\`ts
function move(o: { type: 'car'; speed: number } | { type: 'bike'; gears: number }) {
  if ('speed' in o) console.log(o.speed); // o: { type: 'car', ... }
  else              console.log(o.gears); // o: { type: 'bike', ... }
}
\`\`\`

### Discriminant check (теговое поле)
\`\`\`ts
type Shape = { kind: 'circle'; r: number } | { kind: 'square'; side: number };
function area(s: Shape) {
  if (s.kind === 'circle') return Math.PI * s.r ** 2;
  return s.side ** 2;
}
\`\`\`
Самый чистый способ — см. урок про discriminated unions.

### User-defined type predicate (is)
Когда проверка нетривиальная, оборачиваем в функцию-предикат:
\`\`\`ts
function isString(x: unknown): x is string {
  return typeof x === 'string';
}

function process(x: unknown) {
  if (isString(x)) {
    x.toUpperCase(); // x: string
  }
}
\`\`\`
\`x is string\` — это **type predicate**: TS принимает на веру, что функция гарантирует возвращаемую истину = тип. Будь честен — это assertion без рантайм-проверки от компилятора.

### asserts (TS 3.7+)
\`\`\`ts
function assert(cond: unknown, msg?: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function f(x: string | null) {
  assert(x !== null);
  x.toUpperCase(); // x: string
}
\`\`\`
\`asserts cond\` говорит TS «после этого вызова можешь считать cond истинным». \`asserts x is string\` — то же, но с типом.

### Discriminant + never для exhaustiveness
\`\`\`ts
function check(s: Shape) {
  switch (s.kind) {
    case 'circle': return s.r;
    case 'square': return s.side;
    default: {
      const _: never = s;
      return _;
    }
  }
}
\`\`\`
Если позже в Shape добавится \`'triangle'\`, эта функция перестанет компилироваться → ты не забудешь добавить ветку.

### Сужение по truthy/falsy
\`\`\`ts
function f(x: string | null) {
  if (!x) return; // x — falsy: '' или null
  x.toUpperCase(); // x: string (но '' тоже подойдёт; учти если важно)
}
\`\`\`

### Сужение объектов по unique-полю
\`\`\`ts
function isError(x: unknown): x is { error: string } {
  return typeof x === 'object' && x !== null && 'error' in x;
}
\`\`\`
      `),
      examples: [],
    },
    {
      id: "ts-discriminated-unions",
      title: "Discriminated unions",
      description: "tag-поле, exhaustive switch с never",
      theory: r(`
**Discriminated union** (aka tagged union, sum type) — union объектов, у каждого есть **общее литеральное поле-тег**. TS использует его для надёжного narrowing.

### Анатомия
\`\`\`ts
type Result<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error';   message: string };

function render(r: Result<User>) {
  switch (r.status) {
    case 'loading': return 'Loading...';
    case 'success': return r.data.name;     // r: { status:'success'; data:User }
    case 'error':   return 'Ошибка: ' + r.message;
  }
}
\`\`\`
\`status\` — discriminant. По нему TS точно знает, какие ещё поля есть.

### Без тега — больно
\`\`\`ts
type Bad = { data?: User; message?: string };
function render(r: Bad) {
  if (r.data) {
    r.data.name;       // OK
  } else if (r.message) {
    r.message;          // OK
  }
  // нет уверенности, что эти ветки исчерпывают все варианты
}
\`\`\`
Все поля опциональные, легко забыть проверить, TS не помогает.

### Exhaustiveness check через never
\`\`\`ts
function area(s: Shape): number {
  switch (s.kind) {
    case 'circle': return Math.PI * s.r ** 2;
    case 'square': return s.side ** 2;
    default: {
      const _exhaustive: never = s;  // ошибка, если добавится новый kind
      return _exhaustive;
    }
  }
}
\`\`\`
Это **главная причина**, по которой стоит применять discriminated unions: компилятор бьёт по рукам, когда добавляешь новый вариант и забываешь обработать.

### Тег — обычно строка, но может быть число/булев
\`\`\`ts
type Msg =
  | { ok: true; data: User }
  | { ok: false; error: string };

if (msg.ok) msg.data;   // OK
else        msg.error;   // OK
\`\`\`
Часто видно \`ok: true | false\` или \`isError: true | false\` — это тоже discriminated union, проще switch на пару веток.

### Дискриминация по форме (без явного тега)
Если уникальное поле есть и без тега, \`in\` справится:
\`\`\`ts
type A = { name: string };
type B = { age: number };
function f(x: A | B) {
  if ('name' in x) x.name; else x.age;
}
\`\`\`
Но это менее устойчиво к рефакторингу — поля могут добавляться/уходить. Явный тег надёжнее.

### Где применять
- **Состояния** UI (loading/success/error).
- **Actions** в Redux/zustand: \`{ type: 'INC' } | { type: 'SET', value: number }\`.
- **AST-узлы** парсера.
- **События** event-emitter.
- **Команды** в очереди задач.

Каждый раз, когда есть конечный список «вариантов с разными полями» — кандидат на discriminated union.
      `),
      examples: [],
    },
    {
      id: "ts-assertions",
      title: "as, as const, satisfies, !",
      description: "Все формы утверждений типов, когда уместны",
      theory: r(`
TS даёт несколько способов «помочь» компилятору с типом. Каждый имеет свою нишу.

### as Type — type assertion
\`\`\`ts
const el = document.getElementById('x') as HTMLInputElement;
el.value;
\`\`\`
«Я знаю лучше TS, что это HTMLInputElement». **Без** рантайм-проверки. Используй когда:
- работаешь с DOM/JSON, где тип не выводится;
- интегрируешь нетипизированный код;
- временно гасишь шум типов — но **не злоупотребляй**: \`as\` обходит проверки, баги в рантайме никто не отменял.

### as unknown as T — двойной cast
\`\`\`ts
const x = ('5' as unknown as number);
\`\`\`
Когда TS не пускает прямой \`as\` (типы несовместимы), ставишь промежуточный \`unknown\`. Это **красный флаг** — почти всегда лучше переписать код, чтобы тип сошёлся честно.

### as const
Заморозить значение до literal type (см. урок про литералы).
\`\`\`ts
const ROUTES = ['/', '/about'] as const;
type Route = typeof ROUTES[number]; // '/' | '/about'
\`\`\`

### satisfies (TS 4.9+)
\`satisfies X\` проверяет, что выражение **совместимо** с X, **не** меняя его inferred тип.
\`\`\`ts
const config = {
  port: 3000,
  host: 'localhost',
} satisfies Record<string, string | number>;

config.port; // тип: number (не string | number!)
config.host; // тип: string
\`\`\`
Сравни с традиционным:
\`\`\`ts
const config: Record<string, string | number> = {
  port: 3000,
  host: 'localhost',
};
config.port; // тип: string | number — потеряли точность
\`\`\`
\`satisfies\` — лучший выбор когда нужно **и** валидировать форму, **и** сохранить узкие выводы.

### Non-null assertion (!)
\`\`\`ts
const el = document.getElementById('x')!; // type: HTMLElement (не null)
\`\`\`
«Я гарантирую, что не null/undefined». Так же без рантайм-проверки. Используй когда:
- доказательство существования сложно выразить (NaN-доказуемо);
- инициализация в \`constructor\` через метод, который TS не отслеживает.

Если можно — лучше \`if (!el) return;\` (TS сам сузит).

### definite assignment (!) на полях
\`\`\`ts
class Foo {
  name!: string; // «я инициализирую это позже, не ругайся»
  init() { this.name = 'x'; }
}
\`\`\`
Обходит проверку \`strictPropertyInitialization\`. Используй когда поле точно заполняется через какой-то жизненный цикл (DI, hook).

### Const type parameter (TS 5.0+)
\`\`\`ts
function pick<const T extends readonly string[]>(items: T): T[number] {
  return items[0];
}
const x = pick(['a', 'b', 'c']); // тип: 'a' | 'b' | 'c'
\`\`\`
\`const T\` — TS делает literal-вывод без явного \`as const\` на стороне вызова.

### Главное правило
Любая форма assertion — это **обещание разработчика**, что компилятор поверит без проверки. Если ты можешь добиться того же сужения через настоящую проверку (typeof, in, guard) — лучше так. Assertions оставляй для тех мест, где иначе никак.
      `),
      examples: [],
    },
    {
      id: "ts-classes-decorators",
      title: "Классы и декораторы",
      description: "Модификаторы доступа, abstract, ECMAScript-декораторы",
      theory: r(`
TypeScript добавляет к JS-классам **модификаторы доступа**, **abstract**, **параметровые свойства** и **декораторы**.

### Модификаторы
\`\`\`ts
class User {
  public  name: string;         // по умолчанию
  private password: string;     // только внутри User
  protected role: string;       // внутри User и наследников
  readonly id: number;          // нельзя переприсваивать

  constructor(name: string, password: string, id: number) {
    this.name = name;
    this.password = password;
    this.role = 'user';
    this.id = id;
  }
}
\`\`\`
\`private\` — **только TS-проверка**. После компиляции это обычное поле, доступное в рантайме. Если нужна реальная инкапсуляция — \`#field\` (ECMAScript private), TS их тоже поддерживает.

### Параметровые свойства (parameter properties)
\`\`\`ts
class User {
  constructor(
    public name: string,
    private password: string,
    readonly id: number,
  ) {}
}
// эквивалентно объявлению трёх полей + присваиванию в конструкторе.
\`\`\`

### abstract
\`\`\`ts
abstract class Shape {
  abstract area(): number;       // нет реализации
  describe(): string { return 'площадь ' + this.area(); }
}

class Circle extends Shape {
  constructor(public r: number) { super(); }
  area() { return Math.PI * this.r ** 2; }
}

new Shape(); // Error: cannot instantiate abstract class
\`\`\`

### implements vs extends
\`\`\`ts
interface Loggable { log(): void }
class Service implements Loggable {
  log() {}                       // должен реализовать
}

class Base { greet() {} }
class Sub extends Base {}        // наследует реализацию
\`\`\`
\`implements\` — контракт без наследования; \`extends\` — наследование + контракт.

### overrides (TS 4.3+)
\`\`\`ts
class Animal { speak() { return 'noise' } }
class Dog extends Animal {
  override speak() { return 'woof' } // явно говорим: переопределяем
}
\`\`\`
С опцией \`noImplicitOverride\` забыть \`override\` — ошибка. Защита от опечаток.

### Декораторы (Stage 3 / ECMAScript)
TS 5.0 включил поддержку нового ECMAScript-стандарта декораторов (с флагом \`experimentalDecorators: false\` по умолчанию).

\`\`\`ts
function log(_orig: any, ctx: ClassMethodDecoratorContext) {
  return function (this: unknown, ...args: any[]) {
    console.log(\`call \${String(ctx.name)}\`);
    return (_orig as Function).apply(this, args);
  };
}

class Service {
  @log
  fetch(id: number) { /* ... */ }
}
\`\`\`
Декораторы могут быть на классе, методе, поле, аксессоре, параметре. Применяются на этапе создания класса.

### Старые «эксперементальные» декораторы
До TS 5.0 был отдельный синтаксис под флагом \`experimentalDecorators\`. Многие фреймворки (NestJS, TypeORM, Angular) до сих пор на нём — там форма \`(target, key, descriptor)\` без \`context\`. Если работаешь с такими — нужен старый флаг + \`emitDecoratorMetadata\` для рефлекшна.

### Когда class, когда фабрика
В TS-коде class даёт:
- удобные \`public\`/\`private\`/\`readonly\`;
- проверки \`implements\`;
- \`instanceof\`/\`abstract\`/\`override\`;
- интеграцию с DI-фреймворками (NestJS).

Простая функция-фабрика часто читается проще. Если нет DI и нет наследования — class не обязателен.
      `),
      examples: [],
    },
    {
      id: "ts-modules-tsconfig",
      title: "Модули и tsconfig",
      description: "Опции strict, target, paths, lib, module-resolution",
      theory: r(`
\`tsconfig.json\` — место, где задаются все настройки компилятора. От правильной конфигурации зависит, насколько вообще TS поможет.

### Минимально-разумный конфиг
\`\`\`json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "paths": { "@/*": ["./src/*"] },
    "noEmit": true
  },
  "include": ["src"]
}
\`\`\`

### strict — флаг всех флагов
\`strict: true\` включает: \`noImplicitAny\`, \`strictNullChecks\`, \`strictFunctionTypes\`, \`strictBindCallApply\`, \`strictPropertyInitialization\`, \`noImplicitThis\`, \`alwaysStrict\`, \`useUnknownInCatchVariables\`. Без strict TS перестаёт быть собой — никогда не выключай.

### noUncheckedIndexedAccess
\`\`\`ts
const arr = [1, 2, 3];
const x = arr[10]; // без флага: number; с флагом: number | undefined
\`\`\`
Сильно повышает безопасность, заставляет проверять границы. Привыкаешь быстро.

### target и lib
- \`target\` — версия JS на выходе (ES5 — поддержка IE11; ES2022 — современные браузеры/Node 16+).
- \`lib\` — какие глобальные API доступны (Promise, Map, document…). Если \`target = ES2022\`, lib наследуется автоматически, но можно дополнить \`'DOM'\`, \`'WebWorker'\`.

### module и moduleResolution
- \`module\` — формат на выходе (\`ESNext\`, \`CommonJS\`, \`NodeNext\`).
- \`moduleResolution\` — как искать импорты.
  - \`Bundler\` — самый удобный (TS 5.0+) под Vite/webpack: разрешает импорты без расширений как Node, понимает package.json \`exports\`.
  - \`NodeNext\` — Node 16+ с явными расширениями.
  - \`Node\` — старый, чистый Node.

### paths и алиасы
\`\`\`json
"paths": { "@/*": ["./src/*"] }
\`\`\`
Импорты вида \`import x from '@/utils'\`. Помни: \`tsc\` не **переписывает** пути в output — нужен бандлер или \`tsc-alias\` для production-сборки.

### isolatedModules
Гарантирует, что каждый файл может быть скомпилирован независимо. Запрещает \`const enum\`, требует \`export type\` для re-export типов. Нужно для Babel/esbuild/SWC/Vite.

### verbatimModuleSyntax (TS 5.0+)
Заменил старые \`importsNotUsedAsValues\` / \`preserveValueImports\`. Заставляет писать \`import type\` явно, ничего не «оптимизируется» молча.
\`\`\`ts
import type { User } from './types';     // только тип, выпиливается
import { fn } from './utils';             // значение, остаётся
\`\`\`

### skipLibCheck
TS пропускает проверку \`.d.ts\` файлов node_modules. Включай — иначе CI стоит. Минус: ошибки в чужих типах ловятся только когда они «протекут» в твой код.

### include / exclude / files
- \`include\` — какие файлы компилировать (\`src/**/*\`).
- \`exclude\` — что игнорировать (по умолчанию \`node_modules\`).
- \`files\` — явный список (для маленьких проектов).

### Project references
Большие монорепы делят на под-проекты с \`references\` — позволяет инкрементальные сборки и кеш. Сложно настраивать, но даёт ускорение в разы.

### Главное
- \`strict: true\`, всегда.
- Узнай и включи \`noUncheckedIndexedAccess\`, \`noImplicitOverride\`, \`noFallthroughCasesInSwitch\` — найдёшь баги.
- \`verbatimModuleSyntax\` — стиль для современного TS, заставляет думать.
- \`skipLibCheck\` — да.
- \`isolatedModules\` — да, если бандлер не \`tsc\`.
      `),
      examples: [],
    },
    {
      id: "ts-declarations-merging",
      title: "Declaration merging",
      description: "Слияние интерфейсов, namespace + interface, аугментация модулей",
      theory: r(`
TS позволяет одному и тому же имени иметь **несколько объявлений**, которые **сливаются**. Это специальность, которую дают только \`interface\`, \`namespace\`, \`class\` (с namespace), \`enum\` (с namespace).

### Слияние интерфейсов
\`\`\`ts
interface User { id: number }
interface User { name: string }

// результат: { id: number; name: string }
const u: User = { id: 1, name: 'Аня' };
\`\`\`
\`type\` так **не умеет**:
\`\`\`ts
type User = { id: number };
type User = { name: string }; // Error: Duplicate identifier
\`\`\`

### Аугментация глобальных типов
Самое частое применение — расширить глобальные интерфейсы (\`Window\`, \`globalThis\`):
\`\`\`ts
// src/global.d.ts
declare global {
  interface Window {
    __APP_VERSION__: string;
    myApp: { ready: boolean };
  }
}
export {}; // нужен, чтобы файл считался модулем
\`\`\`
Теперь \`window.__APP_VERSION__\` типизирован.

### Аугментация чужих модулей
\`\`\`ts
// src/react-router.d.ts
import 'react-router-dom';

declare module 'react-router-dom' {
  export interface NavigateOptions {
    analytics?: { source: string };
  }
}
\`\`\`
После этого \`navigate(to, { analytics: ... })\` типизировано. Это легитимный способ добавить поля к API библиотеки, которое сам её автор не предусмотрел.

### namespace + interface
\`\`\`ts
interface Album {}
namespace Album {
  export function fromJson(json: unknown): Album { return {} as Album; }
}

Album.fromJson({}); // type Album с «статикой»
\`\`\`
До модулей это был способ делать «класс с inner-namespace». Сейчас редко.

### class + namespace
\`\`\`ts
class Button {}
namespace Button {
  export type Variant = 'primary' | 'ghost';
  export const VARIANTS: Variant[] = ['primary', 'ghost'];
}

const v: Button.Variant = 'primary';
\`\`\`
Полезно для группировки связанных типов рядом с классом.

### Что нельзя слить
- \`type\` с \`type\` — нет.
- \`type\` с \`interface\` — нет.
- Импортированный из другого модуля \`type\` нельзя «дополнить» снаружи.
- Конструкторы класса — нет.

### Подводные камни
- Если ты случайно объявил \`interface Foo\` в файле, где он уже объявлен где-то ещё в проекте, поля сольются молча. Это может удивить.
- В Vue/React-проектах часто нужно аугментировать \`JSX.IntrinsicElements\` или \`ComponentInstance\` — это всё declaration merging.
      `),
      examples: [],
    },
    {
      id: "ts-branded-types",
      title: "Branded / nominal types",
      description: "Эмуляция номинальной типизации, безопасные ID",
      theory: r(`
TS — **структурно** типизирован: два разных типа с одинаковыми полями взаимозаменяемы.
\`\`\`ts
type UserId = number;
type OrderId = number;
const u: UserId = 1;
const o: OrderId = u; // OK — оба number, TS не возражает
\`\`\`
Это часто опасно: ничто не мешает передать ID юзера в функцию, ждущую ID заказа.

### Branded type — эмуляция номинальной типизации
\`\`\`ts
type Brand<T, B> = T & { readonly __brand: B };

type UserId  = Brand<number, 'UserId'>;
type OrderId = Brand<number, 'OrderId'>;

function asUserId(n: number): UserId { return n as UserId; }
function asOrderId(n: number): OrderId { return n as OrderId; }

function getUser(id: UserId) {}
const oid = asOrderId(5);
getUser(oid); // Error: OrderId не присваивается к UserId
\`\`\`
В рантайме это всё ещё \`number\` — поле \`__brand\` никогда не существует. Зато компилятор начинает их различать.

### Безопаснее: с приватным символом
\`\`\`ts
declare const userIdBrand: unique symbol;
type UserId = number & { [userIdBrand]: never };
\`\`\`
\`unique symbol\` гарантирует, что никто извне не сможет подделать брэнд.

### Reusable helper
\`\`\`ts
declare const __brand: unique symbol;
type Brand<T, B> = T & { readonly [__brand]: B };

type Email = Brand<string, 'Email'>;
type ISODate = Brand<string, 'ISODate'>;
type PositiveInt = Brand<number, 'PositiveInt'>;

function parseEmail(s: string): Email | null {
  return s.includes('@') ? (s as Email) : null;
}
\`\`\`

### Валидаторы как точки входа
\`\`\`ts
function makePositiveInt(n: number): PositiveInt {
  if (!Number.isInteger(n) || n <= 0) throw new Error('not positive int');
  return n as PositiveInt;
}
\`\`\`
Дальше по коду типу PositiveInt уже можно доверять — единственный способ его получить прошёл проверку.

### Где это сильно помогает
- ID разных сущностей: UserId, OrderId, ProductId.
- Деньги: \`Cents\` vs \`Dollars\` (\`Brand<number, 'Cents'>\`) — спасает от багов с делением на 100.
- Координаты: \`Pixels\`, \`Rem\`, \`Percent\`.
- Безопасные строки: \`HtmlSafeString\` (после escape), \`Trimmed\`, \`NonEmpty\`.

### Минусы
- В рантайме это просто \`number\`/\`string\`, TS не защитит от ошибок чтения из БД/JSON.
- Везде нужны фабрики/parsers — иначе синтаксический шум \`as UserId\`.
- При JSON.stringify брэнд исчезает — что и хорошо (если бы поле \`__brand\` существовало, оно бы попало в выход).

### Где не нужно
Если в проекте 3 ID и ты их всё равно не путаешь — брэндинг будет ритуалом без пользы. Это инструмент для систем, где ID десятки и порядок легко перепутать.
      `),
      examples: [],
    },
  ],
};
