import type { QuizQuestion } from "./topics";

// Per-topic recall quizzes. Each topic id maps to a small set of questions
// (2–3 is the sweet spot — enough to test recall, not so many they get
// skipped). Topics without an entry simply don't show a quiz block.
export const QUIZZES: Record<string, QuizQuestion[]> = {
  jsx: [
    {
      question: "Какой атрибут используется в JSX вместо `class`?",
      options: ["class", "className", "classes", "for"],
      correct: 1,
      explanation: "`class` — зарезервированное слово в JS, поэтому в JSX он называется `className`.",
    },
    {
      question: "Сколько корневых элементов может вернуть JSX-компонент?",
      options: ["Сколько угодно", "Только один (или Fragment)", "Минимум два", "Зависит от React-версии"],
      correct: 1,
      explanation: "Один корневой узел. Если нужно несколько — оборачивай в Fragment `<>...</>`.",
    },
    {
      question: "Как вставить JS-выражение внутрь JSX?",
      options: ["{{ выражение }}", "<%= выражение %>", "{ выражение }", "${выражение}"],
      correct: 2,
    },
  ],
  props: [
    {
      question: "Можно ли изменять полученные props внутри компонента?",
      options: ["Да, это нормально", "Только через setState", "Нет, props — read-only", "Только в классовых компонентах"],
      correct: 2,
      explanation: "Props — read-only. Изменения должны идти из родителя, либо через локальный state.",
    },
    {
      question: "Что произойдёт, если не передать обязательный prop без TypeScript?",
      options: ["Ошибка компиляции", "Будет `undefined`", "React выкинет исключение", "Пустая строка"],
      correct: 1,
    },
  ],
  state: [
    {
      question: "Что делает `useState(0)`?",
      options: [
        "Объявляет переменную = 0",
        "Создаёт реактивное состояние с начальным значением 0",
        "Очищает state",
        "Подписывается на изменения",
      ],
      correct: 1,
      explanation: "Возвращает кортеж `[value, setValue]`. setValue вызовет ререндер.",
    },
    {
      question: "Что произойдёт при двух подряд `setCount(count + 1)`?",
      options: [
        "count увеличится на 2",
        "count увеличится только на 1 (батчинг + замыкание)",
        "React выкинет ошибку",
        "Цикл бесконечного ререндера",
      ],
      correct: 1,
      explanation: "Используй функциональную форму `setCount(c => c + 1)`, чтобы получить актуальное значение.",
    },
  ],
  lifecycle: [
    {
      question: "Когда `useEffect(() => {...}, [])` запустится?",
      options: ["На каждом ререндере", "Один раз после монтирования", "Перед каждым ререндером", "Никогда"],
      correct: 1,
    },
    {
      question: "Что нужно вернуть из useEffect для очистки?",
      options: ["null", "true", "функцию-cleanup", "Promise"],
      correct: 2,
      explanation: "Cleanup-функция вызывается перед следующим запуском эффекта и при размонтировании.",
    },
  ],
  "lists-keys": [
    {
      question: "Почему важен prop `key` в списках?",
      options: [
        "Это для стилизации",
        "Чтобы React сопоставлял элементы между рендерами",
        "Для accessibility",
        "Это необязательно",
      ],
      correct: 1,
      explanation: "Без стабильного key React не может эффективно обновлять список — будут лишние ререндеры и баги со state.",
    },
    {
      question: "Можно ли использовать индекс массива как key?",
      options: [
        "Всегда",
        "Никогда",
        "Только если список не изменяется (порядок, удаление, вставка)",
        "Только в production",
      ],
      correct: 2,
    },
  ],
  events: [
    {
      question: "Как написать обработчик клика на button?",
      options: ["onclick={handler}", "onClick={handler()}", "onClick={handler}", "on:click={handler}"],
      correct: 2,
      explanation: "В JSX события в camelCase, передавай функцию (без вызова).",
    },
  ],
  useref: [
    {
      question: "Что хранит `useRef`?",
      options: [
        "Реактивное состояние",
        "Изменяемое значение, доступное между рендерами; .current не вызывает ререндер",
        "Кэш мемоизации",
        "Объект props",
      ],
      correct: 1,
    },
  ],
  usememo: [
    {
      question: "Когда стоит использовать useMemo?",
      options: [
        "Всегда, для всех значений",
        "Только когда профайлинг показывает дорогое вычисление",
        "Никогда — это анти-паттерн",
        "Только для строк",
      ],
      correct: 1,
      explanation: "Преждевременный useMemo чаще вредит, чем помогает. Сначала измерь.",
    },
  ],

  // ── JS advanced ────────────────────────────────────────────────
  "js-closures": [
    {
      question: "Что выведет: `for (var i=0;i<3;i++) setTimeout(() => console.log(i), 0)` ?",
      options: ["0, 1, 2", "3, 3, 3", "undefined, undefined, undefined", "ошибка"],
      correct: 1,
      explanation:
        "`var` — функциональная область, все колбэки видят одну `i`. К моменту таймаута цикл завершён, i=3.",
    },
    {
      question: "Что нужно изменить, чтобы вывело 0, 1, 2?",
      options: ["заменить var на let", "обернуть в IIFE", "оба варианта работают", "никак"],
      correct: 2,
    },
  ],
  "js-this": [
    {
      question: "Что такое this в стрелочной функции?",
      options: [
        "this объекта, в котором она вызвана",
        "this из окружающего лексического контекста",
        "globalThis всегда",
        "undefined всегда",
      ],
      correct: 1,
      explanation: "Стрелки не имеют собственного this — берут из места объявления.",
    },
  ],
  "js-event-loop": [
    {
      question: "Что выведет: `console.log(1); setTimeout(()=>console.log(2),0); Promise.resolve().then(()=>console.log(3)); console.log(4);` ?",
      options: ["1 2 3 4", "1 4 3 2", "1 4 2 3", "1 3 4 2"],
      correct: 1,
      explanation: "Сначала синхронный код (1, 4). Потом все микротаски (3). Потом макротаска setTimeout (2).",
    },
  ],
  "js-promises-deep": [
    {
      question: "Чем Promise.all отличается от Promise.allSettled?",
      options: [
        "Они одинаковые",
        "all падает на первой ошибке; allSettled всегда ждёт всех",
        "all быстрее всегда",
        "allSettled не существует",
      ],
      correct: 1,
    },
  ],
  "js-async-await": [
    {
      question: "Что вернёт `await 5`?",
      options: ["Promise<5>", "5", "ошибка — нельзя await на не-промисе", "undefined"],
      correct: 1,
      explanation: "await любого значения возвращает само значение (через одну микротаску).",
    },
  ],

  // ── TypeScript ─────────────────────────────────────────────────
  "ts-basics": [
    {
      question: "В чём ключевое отличие any от unknown?",
      options: [
        "Они одинаковы",
        "any выключает проверки; unknown — безопасный any, требует narrowing",
        "unknown быстрее",
        "any — для примитивов, unknown — для объектов",
      ],
      correct: 1,
    },
    {
      question: "Что такое never?",
      options: [
        "значение которое не используется",
        "тип функций, которые никогда не возвращают нормально",
        "то же что void",
        "тип null",
      ],
      correct: 1,
    },
  ],
  "ts-interface-vs-type": [
    {
      question: "Что умеет interface, чего не умеет type?",
      options: [
        "Принимать generic-параметры",
        "Declaration merging — несколько объявлений сливаются",
        "Описывать union",
        "Использовать infer",
      ],
      correct: 1,
    },
  ],
  "ts-utility-types": [
    {
      question: "Что делает `Partial<User>`?",
      options: [
        "Делает все поля required",
        "Делает все поля optional",
        "Удаляет поля",
        "Делает поля readonly",
      ],
      correct: 1,
    },
    {
      question: "`Omit<User, 'password'>` — это…",
      options: [
        "тип с одним полем password",
        "User без поля password",
        "ошибка",
        "Pick<User, 'password'>",
      ],
      correct: 1,
    },
  ],
  "ts-conditional-types": [
    {
      question: "Что выведет: `type X = (string | number) extends string ? 'y' : 'n'`?",
      options: ["'y'", "'n'", "'y' | 'n'", "ошибка"],
      correct: 1,
      explanation:
        "Это НЕ голый параметр, а вычисленный тип. Дистрибуция работает только на голых generic-параметрах. (string|number) целиком не присваивается к string.",
    },
  ],
  "ts-discriminated-unions": [
    {
      question: "Зачем поле-тег (`kind`/`type`) в union?",
      options: [
        "Это требование TS",
        "Чтобы TS мог надёжно сузить тип в switch/if",
        "Для сериализации",
        "Не нужно никогда",
      ],
      correct: 1,
    },
  ],
  "ts-assertions": [
    {
      question: "Чем satisfies отличается от as?",
      options: [
        "Одно и то же",
        "satisfies проверяет совместимость, НЕ меняя выведенного типа",
        "as безопаснее",
        "satisfies — только для классов",
      ],
      correct: 1,
    },
  ],
};

export function getQuizForTopic(topicId: string): QuizQuestion[] | undefined {
  return QUIZZES[topicId];
}
