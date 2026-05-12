import { type ReactNode } from "react";
import styles from "./TheoryRenderer.module.css";

function renderInline(text: string): ReactNode[] {
  // Поддерживаем: **bold**, `code`, [text](url)
  const parts: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      parts.push(<code key={key++}>{token.slice(1, -1)}</code>);
    } else {
      const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (m) {
        parts.push(
          <a key={key++} href={m[2]} target="_blank" rel="noreferrer">
            {m[1]}
          </a>
        );
      }
    }
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts;
}

export default function TheoryRenderer({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1;
      out.push(
        <pre key={key++} data-lang={lang || undefined}>
          <code>{buf.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      out.push(<h3 key={key++}>{renderInline(line.slice(4))}</h3>);
      i += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      out.push(<h2 key={key++}>{renderInline(line.slice(3))}</h2>);
      i += 1;
      continue;
    }

    // Table (very simple: |a|b|\n|---|---|\n|x|y|)
    if (line.startsWith("|") && lines[i + 1]?.startsWith("|") && lines[i + 1]?.includes("---")) {
      const head = line.split("|").slice(1, -1).map((s) => s.trim());
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(lines[i].split("|").slice(1, -1).map((s) => s.trim()));
        i += 1;
      }
      out.push(
        <table key={key++} className={styles.table}>
          <thead>
            <tr>{head.map((h, j) => <th key={j}>{renderInline(h)}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>{row.map((c, j) => <td key={j}>{renderInline(c)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      );
      continue;
    }

    // Unordered list
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i += 1;
      }
      out.push(
        <ul key={key++}>
          {items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i += 1;
      }
      out.push(
        <ol key={key++}>
          {items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}
        </ol>
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i += 1;
      continue;
    }

    // Paragraph
    const buf: string[] = [line];
    i += 1;
    while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("- ") && !lines[i].startsWith("#") && !lines[i].startsWith("```") && !/^\d+\.\s/.test(lines[i])) {
      buf.push(lines[i]);
      i += 1;
    }
    out.push(<p key={key++}>{renderInline(buf.join(" "))}</p>);
  }

  return <div className={styles.theory}>{out}</div>;
}
