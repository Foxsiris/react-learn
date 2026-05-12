import { useSyncExternalStore } from "react";
import { supabase } from "../lib/supabase";

export type CatalogTopic = {
  id: string;
  group_id: string;
  title: string;
  description: string;
  order_index: number;
  example_count: number;
};

export type CatalogGroup = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  order_index: number;
  topics: CatalogTopic[];
};

export type Catalog = {
  loading: boolean;
  groups: CatalogGroup[];
  topics: CatalogTopic[];
};

let cache: Catalog = { loading: true, groups: [], topics: [] };
const listeners = new Set<() => void>();
let hydrated = false;

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot() {
  return cache;
}

async function hydrate() {
  if (hydrated) return;
  hydrated = true;
  const [{ data: groups, error: gErr }, { data: topics, error: tErr }] = await Promise.all([
    supabase.from("topic_groups").select("id,title,emoji,description,order_index").order("order_index"),
    supabase.from("topics").select("id,group_id,title,description,order_index,example_count").order("order_index"),
  ]);
  if (gErr || tErr || !groups || !topics) {
    console.error("[catalog] hydrate failed:", gErr ?? tErr);
    cache = { loading: false, groups: [], topics: [] };
    emit();
    return;
  }

  const tRows = topics as CatalogTopic[];
  const gRows = (groups as Array<Omit<CatalogGroup, "topics">>).map((g) => ({
    ...g,
    topics: tRows.filter((t) => t.group_id === g.id).sort((a, b) => a.order_index - b.order_index),
  }));

  cache = { loading: false, groups: gRows, topics: tRows };
  emit();
}

hydrate();

export function useCatalog(): Catalog {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function findCatalogTopic(catalog: Catalog, id: string): CatalogTopic | undefined {
  return catalog.topics.find((t) => t.id === id);
}

export function findCatalogGroupOf(catalog: Catalog, topicId: string): CatalogGroup | undefined {
  const t = findCatalogTopic(catalog, topicId);
  if (!t) return undefined;
  return catalog.groups.find((g) => g.id === t.group_id);
}
