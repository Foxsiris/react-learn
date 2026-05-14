import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useReducer,
  useCallback,
  useContext,
  useLayoutEffect,
  useId,
  useTransition,
  useDeferredValue,
  createContext,
  memo,
  forwardRef,
  Fragment,
  lazy,
  Suspense,
} from "react";
import { LiveProvider, LiveEditor, LiveError, LivePreview } from "react-live";
import { themes } from "prism-react-renderer";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./LiveExample.module.css";

const SCOPE = {
  useState,
  useEffect,
  useMemo,
  useRef,
  useReducer,
  useCallback,
  useContext,
  useLayoutEffect,
  useId,
  useTransition,
  useDeferredValue,
  createContext,
  memo,
  forwardRef,
  Fragment,
  lazy,
  Suspense,
  // framer-motion — для анимированных визуализаций алгоритмов
  motion,
  AnimatePresence,
};

// Адаптер: код в стиле Sandpack (с import/export default) → формат react-live noInline.
// react-live не понимает import — хуки и API прилетают через scope.
// Принцип: вырезаем все import-строки, превращаем "export default function X" в "function X",
// в конец дописываем render(<X />), где X — то, что было default-экспортом.
function adaptCode(raw: string): string {
  let src = raw;

  // 1. Удалить все import-строки (включая многострочные { a, b } from "...")
  src = src.replace(/^[ \t]*import[\s\S]*?from[ \t]*["'][^"']+["'][ \t]*;?[ \t]*\r?\n/gm, "");
  src = src.replace(/^[ \t]*import[ \t]+["'][^"']+["'][ \t]*;?[ \t]*\r?\n/gm, "");

  // 2. Найти имя default-компонента и убрать "export default"
  let rootName = "App";

  // export default function Name(...) { ... }
  const namedFn = src.match(/export\s+default\s+function\s+([A-Z][A-Za-z0-9_]*)/);
  if (namedFn) {
    rootName = namedFn[1];
    src = src.replace(/export\s+default\s+function/, "function");
  } else {
    // export default function() {...}  → анонимная функция
    const anonFn = src.match(/export\s+default\s+function\s*\(/);
    if (anonFn) {
      rootName = "App";
      src = src.replace(/export\s+default\s+function\s*\(/, `function ${rootName}(`);
    } else {
      // export default Name;  или  export default <JSX>
      const namedExpr = src.match(/export\s+default\s+([A-Z][A-Za-z0-9_]*)\s*;?/);
      if (namedExpr) {
        rootName = namedExpr[1];
        src = src.replace(/export\s+default\s+[A-Z][A-Za-z0-9_]*\s*;?/, "");
      } else {
        // export default ( ... )  — оборачиваем сразу в render
        src = src.replace(/export\s+default\s+/, "const __default = ");
        return src + `\nrender(__default);`;
      }
    }
  }

  // 3. Убрать остальные именованные export (export function / export const)
  src = src.replace(/^[ \t]*export[ \t]+(function|const|let|var|class)[ \t]/gm, "$1 ");

  return `${src}\nrender(<${rootName} />);`;
}

type Props = {
  code: string;
};

export default function LiveExample({ code }: Props) {
  const transformed = useMemo(() => adaptCode(code), [code]);

  return (
    <LiveProvider code={transformed} scope={SCOPE} noInline theme={themes.vsDark}>
      <div className={styles.wrap}>
        <div className={styles.editor}>
          <LiveEditor className={styles.editorInner} />
        </div>
        <div className={styles.preview}>
          <LivePreview />
          <LiveError className={styles.error} />
        </div>
      </div>
    </LiveProvider>
  );
}
