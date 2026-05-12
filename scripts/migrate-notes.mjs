import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = "/Users/daniilcyplakov/Documents/Brain/⚛️ React Middle/Темы";
const OUT = join(__dirname, "..", "src", "content", "react");

mkdirSync(OUT, { recursive: true });

// Brain filename (without .md) → app topic slug.
// 26 first entries match existing topic ids in topics.ts.
// 33 remaining are new slugs that will become new topics in the React block.
const MAP = {
  "JSX": "jsx",
  "Props": "props",
  "State": "state",
  "Lifecycle": "lifecycle",
  "Списки и ключи": "lists-keys",
  "События": "events",
  "Controlled vs Uncontrolled": "controlled-uncontrolled",
  "Fragments Portals Error Boundaries": "fragments-portals-errors",
  "useRef": "useref",
  "useMemo": "usememo",
  "useCallback": "usecallback",
  "useContext": "usecontext",
  "useReducer": "usereducer",
  "useLayoutEffect": "uselayouteffect",
  "useId useDeferredValue useTransition": "useid-deferred-transition",
  "Кастомные хуки": "custom-hooks",
  "Context API": "context-api",
  "Zustand": "zustand",
  "React Query": "react-query",
  "React.memo": "react-memo",
  "Code splitting": "code-splitting",
  "Virtual DOM": "virtual-dom",
  "React Router v6": "react-router",
  "React Hook Form": "rhf",
  "Props типы": "props-types",
  "Типизация событий": "event-types",

  // new topics (33)
  "Atomic Design": "atomic-design",
  "Batching React 18": "batching",
  "Concurrent Mode": "concurrent-mode",
  "Controlled forms vs RHF": "controlled-vs-rhf",
  "Eslint Prettier": "eslint-prettier",
  "Feature-Sliced Design": "fsd",
  "Generic компоненты": "generic-components",
  "Husky lint-staged": "husky-lint-staged",
  "Jest": "jest",
  "Jotai Recoil": "jotai-recoil",
  "Lazy loading роутов": "lazy-routes",
  "MSW": "msw",
  "Monorepo": "monorepo",
  "Nested routes": "nested-routes",
  "Next.js": "nextjs",
  "Protected routes": "protected-routes",
  "React Testing Library": "rtl",
  "Redux Toolkit": "redux-toolkit",
  "Render Props HOC": "render-props-hoc",
  "Storybook": "storybook",
  "Utility types": "utility-types",
  "Validation Zod Yup": "validation-zod-yup",
  "Vite": "vite",
  "Vitest": "vitest",
  "Windowing": "windowing",
  "renderHook": "render-hook",
  "useFieldArray": "use-field-array",
  "useNavigate useParams": "use-navigate-params",
  "Интеграционные тесты": "integration-tests",
  "Паттерны компонентов": "component-patterns",
  "Профилирование": "profiling",
  "Сравнение state management": "state-management-comparison",
  "Типизация хуков": "hook-types",
};

function sanitize(md) {
  let s = md;

  // strip leading YAML frontmatter (including trailing blank lines)
  s = s.replace(/^---\n[\s\S]*?\n---\n+/, "");
  s = s.replace(/^\s+/, "");

  // strip Obsidian back-nav wikilink lines like `[[⚛️ React Middle/React Middle|◀ Назад к плану]]`
  s = s.replace(/^\s*\[\[[^\]]*Назад[^\]]*\]\]\s*$/gm, "");

  // collapse `[[target|label]]` → label, `[[target]]` → target (Obsidian wikilinks → plain text)
  s = s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2");
  s = s.replace(/\[\[([^\]]+)\]\]/g, "$1");

  // drop image embeds `![[file.png]]` — we don't have these assets
  s = s.replace(/!\[\[[^\]]+\]\]/g, "");

  // strip Obsidian inline comments `%%...%%`
  s = s.replace(/%%[\s\S]*?%%/g, "");

  // Obsidian callouts `> [!info] Title` → `> **ℹ️ Title**` so react-markdown renders a clear blockquote
  const calloutIcons = {
    info: "ℹ️", tip: "💡", note: "📝", warning: "⚠️", danger: "🚨",
    important: "❗", caution: "⚠️", success: "✅", failure: "❌", abstract: "📄",
    todo: "✅", question: "❓", example: "📌", quote: "💬", bug: "🐛",
  };
  s = s.replace(/^>\s*\[!(\w+)\]\s*(.*)$/gm, (_, kind, rest) => {
    const k = String(kind).toLowerCase();
    const ico = calloutIcons[k] || "💡";
    const label = rest.trim() || k.charAt(0).toUpperCase() + k.slice(1);
    return `> **${ico} ${label}**`;
  });

  // strip the leading H1 (topic title is rendered separately by Topic page)
  s = s.replace(/^#\s+[^\n]+\n+/, "");
  s = s.replace(/^\s+/, "");

  // strip leading horizontal rule (Obsidian commonly puts `---` right after the H1)
  s = s.replace(/^---+\s*\n+/, "");
  s = s.replace(/^\s+/, "");

  // collapse 3+ blank lines → 2
  s = s.replace(/\n{3,}/g, "\n\n");

  return s.trim() + "\n";
}

const files = readdirSync(SRC).filter((f) => f.endsWith(".md"));
let written = 0;
const missingMap = [];

for (const file of files) {
  const stem = file.replace(/\.md$/, "");
  const slug = MAP[stem];
  if (!slug) {
    missingMap.push(stem);
    continue;
  }
  const raw = readFileSync(join(SRC, file), "utf8");
  const out = sanitize(raw);
  writeFileSync(join(OUT, `${slug}.md`), out, "utf8");
  written += 1;
}

console.log(`Wrote ${written} files to ${OUT}`);
if (missingMap.length) {
  console.log("Brain files with no slug mapping (skipped):", missingMap);
}
