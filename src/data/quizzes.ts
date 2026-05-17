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
};

export function getQuizForTopic(topicId: string): QuizQuestion[] | undefined {
  return QUIZZES[topicId];
}
