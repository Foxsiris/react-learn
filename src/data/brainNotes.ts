// Maps topic.id → full markdown content sourced from the Obsidian "Brain" vault.
// Files live in src/content/react/<slug>.md and are bundled at build time via Vite raw imports.

const modules = import.meta.glob("../content/react/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export const brainNotes: Record<string, string> = {};

for (const [path, content] of Object.entries(modules)) {
  const filename = path.split("/").pop();
  if (!filename) continue;
  const slug = filename.replace(/\.md$/, "");
  brainNotes[slug] = content;
}

export function hasBrainNote(topicId: string): boolean {
  return topicId in brainNotes;
}

export function getBrainNote(topicId: string): string | undefined {
  return brainNotes[topicId];
}
