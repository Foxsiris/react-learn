import { type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Highlight, themes } from "prism-react-renderer";
import styles from "./TheoryRenderer.module.css";

function CodeBlock({ language, value }: { language: string; value: string }) {
  return (
    <Highlight code={value.replace(/\n$/, "")} language={language || "tsx"} theme={themes.vsDark}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre className={styles.code} data-lang={language || undefined}>
          <code>
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line });
              return (
                <div key={i} {...lineProps}>
                  {line.map((token, j) => {
                    const tokenProps = getTokenProps({ token });
                    return <span key={j} {...tokenProps} />;
                  })}
                </div>
              );
            })}
          </code>
        </pre>
      )}
    </Highlight>
  );
}

const components: Components = {
  code({ className, children, ...rest }) {
    const text = String(children ?? "");
    const langMatch = /language-(\w+)/.exec(className || "");
    const isBlock = !!langMatch || text.includes("\n");
    if (isBlock) {
      return <CodeBlock language={langMatch?.[1] ?? ""} value={text} />;
    }
    return (
      <code className={styles.inlineCode} {...rest}>
        {children}
      </code>
    );
  },
  pre({ children }) {
    return <>{children as ReactNode}</>;
  },
  table({ children }) {
    return <table className={styles.table}>{children}</table>;
  },
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  },
};

export default function TheoryRenderer({ markdown }: { markdown: string }) {
  return (
    <div className={styles.theory}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
