## 📝 Теория
**Husky** — git hooks на JavaScript. Запускает скрипты перед commit/push.
**lint-staged** — запускает линтер только на staged (изменённых) файлах, не на всём проекте.

## 💻 Практика
```bash
npm install -D husky lint-staged
npx husky init
```

```bash
# .husky/pre-commit
npx lint-staged

# .husky/commit-msg
npx commitlint --edit $1  # валидация формата коммита
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}

// commitlint.config.js — Conventional Commits
module.exports = {
  extends: ["@commitlint/config-conventional"],
};
// Формат: feat(auth): add google login
// Типы: feat, fix, docs, style, refactor, test, chore
```

```bash
# Полный pre-commit pipeline
npx lint-staged     # lint + format
npm run type-check  # tsc --noEmit
npm run test:staged # тесты затронутых файлов
```

## ⚠️ Подводные камни
- Husky не работает если `npm install` не запустили после клонирования → `prepare` script
- `lint-staged` с большими файлами — установи `--max-warnings 0` чтобы не пропустить warnings

```json
"scripts": {
  "prepare": "husky" // автоматически после npm install
}
```

## 🧩 Задачи
1. Настрой полный CI/CD pipeline: pre-commit (lint + format) + pre-push (tests + type-check)
2. Добавь автоматическую генерацию CHANGELOG через conventional commits
