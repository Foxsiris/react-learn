## 📝 Теория
**ESLint** — статический анализатор кода (находит проблемы).
**Prettier** — форматировщик (единый стиль).
Они дополняют друг друга и не конфликтуют при правильной настройке.

## 💻 Практика
```bash
npm install -D eslint @eslint/js typescript-eslint
npm install -D eslint-plugin-react eslint-plugin-react-hooks
npm install -D eslint-plugin-jsx-a11y
npm install -D prettier eslint-config-prettier
```

```js
// eslint.config.js (flat config, ESLint 9+)
import js from "@eslint/js";
import ts from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import a11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  reactHooks.configs.recommended,
  a11y.configs.recommended,
  prettier, // отключает правила конфликтующие с Prettier
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/exhaustive-deps": "error",
      "no-console": "warn",
    },
  },
];

// .prettierrc
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "es5"
}

// package.json scripts
"lint": "eslint src --ext .ts,.tsx",
"lint:fix": "eslint src --ext .ts,.tsx --fix",
"format": "prettier --write src"
```

## 🧩 Задачи
1. Настрой ESLint + Prettier + TypeScript для нового проекта
2. Добавь кастомное правило запрещающее использование `any`
