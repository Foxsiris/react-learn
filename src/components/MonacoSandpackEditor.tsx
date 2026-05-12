import { useEffect, useRef } from "react";
import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import { useActiveCode, useSandpack } from "@codesandbox/sandpack-react";

function pathToLanguage(path: string): string {
  if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".html")) return "html";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".md")) return "markdown";
  return "javascript";
}

// Минимальные декларации для React, чтобы IntelliSense знал useState / FC / props
const REACT_TYPES = `
declare module "react" {
  export type ReactNode = any;
  export type FC<P = {}> = (props: P) => any;
  export function useState<T>(initial: T | (() => T)): [T, (v: T | ((p: T) => T)) => void];
  export function useEffect(fn: () => void | (() => void), deps?: any[]): void;
  export function useMemo<T>(fn: () => T, deps: any[]): T;
  export function useCallback<T>(fn: T, deps: any[]): T;
  export function useRef<T>(initial: T | null): { current: T };
  export function useReducer<S, A>(reducer: (s: S, a: A) => S, initial: S): [S, (a: A) => void];
  export function useContext<T>(ctx: any): T;
  export function useLayoutEffect(fn: () => void | (() => void), deps?: any[]): void;
  export function useTransition(): [boolean, (cb: () => void) => void];
  export function useDeferredValue<T>(value: T): T;
  export function useId(): string;
  export function createContext<T>(defaultValue: T): any;
  export function memo<T>(c: T): T;
  export function forwardRef<T, P>(fn: (p: P, ref: any) => any): any;
  export function Fragment(props: { children?: any }): any;
  export function lazy<T>(loader: () => Promise<T>): T;
  export function Suspense(props: { fallback?: any; children?: any }): any;
  const React: any;
  export default React;
}
declare module "react-dom" {
  export function createPortal(node: any, container: any): any;
  const ReactDOM: any;
  export default ReactDOM;
}
`;

export default function MonacoSandpackEditor() {
  const { code, updateCode } = useActiveCode();
  const { sandpack } = useSandpack();
  const monacoRef = useRef<Monaco | null>(null);

  const path = sandpack.activeFile;
  const language = pathToLanguage(path);

  const handleMount: OnMount = (_editor, monaco) => {
    monacoRef.current = monaco;

    // Включаем JSX
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowNonTsExtensions: true,
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      esModuleInterop: true,
      allowJs: true,
    });
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowNonTsExtensions: true,
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      esModuleInterop: true,
      allowJs: true,
    });

    // Глушим "Cannot find module 'react'"
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      REACT_TYPES,
      "file:///node_modules/@types/react/index.d.ts"
    );
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      REACT_TYPES,
      "file:///node_modules/@types/react/index.d.ts"
    );
  };

  // Когда меняется активный файл — Monaco должен сам перерисовать через path prop
  useEffect(() => {
    if (!monacoRef.current) return;
    // ничего не делаем — Editor сам реагирует на смену path
  }, [path]);

  return (
    <div style={{ flex: "2 1 480px", minWidth: 0, height: "100%" }}>
      <Editor
        height="100%"
        theme="vs-dark"
        language={language}
        path={path}
        value={code}
        onChange={(v) => updateCode(v ?? "")}
        onMount={handleMount}
        options={{
          fontFamily: '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
          fontSize: 14,
          fontLigatures: true,
          minimap: { enabled: false },
          lineNumbers: "on",
          renderLineHighlight: "all",
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          scrollBeyondLastLine: false,
          tabSize: 2,
          formatOnPaste: true,
          formatOnType: true,
          automaticLayout: true,
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true, indentation: true },
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
}
