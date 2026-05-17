-- Two new tracks: hard JavaScript (engine internals, advanced patterns)
-- and maximally detailed TypeScript. Topics are catalog-only here; full
-- theory/markdown lives in src/data/topics-*.ts (same pattern as `react`,
-- `algorithms`, `system-design`, `leetcode`).

insert into public.topic_groups (id, title, emoji, description, order_index, color, color_soft, short)
values
  ('js-advanced', 'JavaScript: продвинутый',
   '⚙️',
   'Замыкания, прототипы, event loop, async-внутренности, Proxy, генераторы — то, что отличает уверенного JS-разработчика.',
   4, '#c8973a', '#fbf0d2', 'JS Hard'),
  ('typescript', 'TypeScript',
   '🟦',
   'От базовых типов до conditional/mapped/template literal — максимально подробный курс по системе типов.',
   5, '#3d6dcc', '#dde6f7', 'TS')
on conflict (id) do update set
  title = excluded.title,
  emoji = excluded.emoji,
  description = excluded.description,
  order_index = excluded.order_index,
  color = excluded.color,
  color_soft = excluded.color_soft,
  short = excluded.short;

insert into public.topics (id, group_id, title, description, order_index, example_count)
values
  ('js-closures',           'js-advanced', 'Замыкания',                  'Лексическое окружение, [[Environment]], классические задачи',                   0, 0),
  ('js-scopes-hoisting',    'js-advanced', 'Области видимости и hoisting','var/let/const, TDZ, hoisting функций и переменных',                            1, 0),
  ('js-this',               'js-advanced', 'this и контекст',            'Правила выбора this, потеря контекста, bind/call/apply, стрелки',                2, 0),
  ('js-prototypes',          'js-advanced', 'Прототипы и наследование',   '__proto__, Object.create, prototype chain, hasOwnProperty',                     3, 0),
  ('js-classes',            'js-advanced', 'Классы и приватные поля',    'class, extends, super, # private, статика, getters/setters',                     4, 0),
  ('js-event-loop',         'js-advanced', 'Event Loop',                 'Стек, очередь, microtasks vs macrotasks, requestAnimationFrame',                 5, 0),
  ('js-promises-deep',      'js-advanced', 'Promise под капотом',         'Состояния, then-chain, обработка ошибок, Promise.all/allSettled/any/race',      6, 0),
  ('js-async-await',        'js-advanced', 'async/await глубоко',         'Что компилируется, последовательность vs параллель, обработка ошибок',           7, 0),
  ('js-iterators-generators','js-advanced', 'Итераторы и генераторы',     'Symbol.iterator, generator-функции, делегирование, ленивые последовательности', 8, 0),
  ('js-modules-esm',        'js-advanced', 'ES Modules vs CommonJS',     'import/export, динамический импорт, статический анализ, циклические зависимости', 9, 0),
  ('js-proxy-reflect',      'js-advanced', 'Proxy и Reflect',            'Перехват операций, traps, Reflect-зеркало, паттерны',                          10, 0),
  ('js-symbols',            'js-advanced', 'Symbol и well-known symbols','Уникальные ключи, Symbol.iterator, .toPrimitive, паттерны',                     11, 0),
  ('js-weak-collections',   'js-advanced', 'WeakMap, WeakSet, FinalizationRegistry','Слабые ссылки, GC, приватные данные, кэши',                          12, 0),
  ('js-functional',         'js-advanced', 'Функциональные паттерны',    'Каррирование, композиция, debounce/throttle, мемоизация',                       13, 0),
  ('js-memory-gc',          'js-advanced', 'Память и GC',                'Mark & sweep, утечки памяти, замыкания и DOM',                                  14, 0),
  ('ts-basics',             'typescript', 'Базовые типы',                  'primitives, any/unknown/never/void, массивы и кортежи',                          0, 0),
  ('ts-interface-vs-type',  'typescript', 'interface vs type',             'Чем отличаются, когда что выбирать, declaration merging',                        1, 0),
  ('ts-unions-intersections','typescript', 'Объединения и пересечения',    'union | , intersection &, дискриминируемые объединения',                         2, 0),
  ('ts-literal-const',      'typescript', 'Литералы и const assertions',   'string/number literal types, as const, readonly tuples',                         3, 0),
  ('ts-enums',              'typescript', 'enum и альтернативы',           'numeric, string, const enum; что лучше — union of literals',                     4, 0),
  ('ts-generics',           'typescript', 'Generics: основы',              'Параметры типов, инференция, повторное использование',                           5, 0),
  ('ts-generics-constraints','typescript', 'Generics: extends, default, multiple','Ограничения T extends, дефолты, несколько параметров',                  6, 0),
  ('ts-utility-types',      'typescript', 'Utility-типы',                  'Partial, Required, Pick, Omit, Record, Readonly, ReturnType, Parameters',        7, 0),
  ('ts-mapped-types',       'typescript', 'Mapped types',                  '{ [K in Keys]: ... }, key remapping через as',                                   8, 0),
  ('ts-conditional-types',  'typescript', 'Conditional types и infer',     'T extends U ? X : Y, distribution, ключевое слово infer',                        9, 0),
  ('ts-template-literals',  'typescript', 'Template literal types',        'Строковые шаблоны на уровне типов, Uppercase/Lowercase/Capitalize',             10, 0),
  ('ts-type-guards',        'typescript', 'Type guards и narrowing',       'typeof, instanceof, in, кастомные предикаты is',                                 11, 0),
  ('ts-discriminated-unions','typescript', 'Discriminated unions',         'tag-поле, exhaustive switch с never',                                            12, 0),
  ('ts-assertions',         'typescript', 'as, as const, satisfies, !',    'Все формы утверждений типов, когда уместны',                                    13, 0),
  ('ts-classes-decorators', 'typescript', 'Классы и декораторы',           'Модификаторы доступа, abstract, ECMAScript-декораторы',                          14, 0),
  ('ts-modules-tsconfig',   'typescript', 'Модули и tsconfig',             'Опции strict, target, paths, lib, module-resolution',                            15, 0),
  ('ts-declarations-merging','typescript', 'Declaration merging',          'Слияние интерфейсов, namespace + interface, аугментация модулей',                16, 0),
  ('ts-branded-types',      'typescript', 'Branded / nominal types',       'Эмуляция номинальной типизации, безопасные ID',                                  17, 0)
on conflict (id) do update set
  group_id = excluded.group_id,
  title = excluded.title,
  description = excluded.description,
  order_index = excluded.order_index,
  example_count = excluded.example_count;
