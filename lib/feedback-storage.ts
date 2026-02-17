/**
 * Хранилище для User Feedback: сегменты и записи фидбека.
 * Ключи: fb:segments, fb:entries. Использует тот же KV или in-memory, что и lib/storage.
 */

import type { Segment, FeedbackEntry } from "./feedback-types";

const SEGMENTS_KEY = "fb:segments";
const ENTRIES_KEY = "fb:entries";

let memoryStore: {
  segments: Segment[];
  entries: FeedbackEntry[];
} = {
  segments: [],
  entries: [],
};

async function getKv(): Promise<{
  get: (k: string) => Promise<unknown>;
  set: (k: string, v: unknown) => Promise<void>;
} | null> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  try {
    const { kv } = await import("@vercel/kv");
    return {
      get: (k: string) => kv.get(k),
      set: async (k: string, v: unknown) => {
        await kv.set(k, v);
      },
    };
  } catch {
    return null;
  }
}

export const DEFAULT_SEGMENTS: Segment[] = [
  {
    id: "seg-new",
    name: "Новый пользователь / впервые пробует",
    description: "Только знакомится с продуктом, ищет быстрый результат или откладывает решение.",
  },
  {
    id: "seg-regular",
    name: "Регулярный пользователь",
    description: "Использует продукт периодически, знает основные функции, хочет стабильности и предсказуемости.",
  },
  {
    id: "seg-power",
    name: "Пауэр-юзер / эксперт",
    description: "Активно использует продвинутые возможности, нужны гибкость, интеграции и скорость.",
  },
];

const SEED_ENTRIES: FeedbackEntry[] = [
  {
    id: "seed-1",
    segmentId: "seg-new",
    text: "Не понял с первого раза, куда нажимать, чтобы начать. Хотелось бы один явный «Старт».",
    source: "seed",
    createdAt: new Date().toISOString(),
    tags: ["onboarding"],
  },
  {
    id: "seed-2",
    segmentId: "seg-regular",
    text: "Иногда теряю последние изменения, если закрыл вкладку по ошибке. Нужен автосохранение.",
    source: "seed",
    createdAt: new Date().toISOString(),
    tags: ["reliability"],
  },
  {
    id: "seed-3",
    segmentId: "seg-power",
    text: "Нужен API или экспорт в наш стек. Сейчас всё копирую вручную — долго.",
    source: "seed",
    createdAt: new Date().toISOString(),
    tags: ["integrations"],
  },
];

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function getSegments(): Promise<Segment[]> {
  const kv = await getKv();
  if (kv) {
    const raw = await kv.get(SEGMENTS_KEY);
    const list = Array.isArray(raw) ? (raw as Segment[]) : [];
    if (list.length === 0) {
      await setSegments(DEFAULT_SEGMENTS);
      return DEFAULT_SEGMENTS;
    }
    return list;
  }
  if (memoryStore.segments.length === 0) {
    memoryStore.segments = [...DEFAULT_SEGMENTS];
  }
  return memoryStore.segments;
}

export async function setSegments(segments: Segment[]): Promise<void> {
  const kv = await getKv();
  if (kv) {
    await kv.set(SEGMENTS_KEY, segments);
    return;
  }
  memoryStore.segments = segments;
}

export async function getEntries(segmentId?: string): Promise<FeedbackEntry[]> {
  const kv = await getKv();
  if (kv) {
    const raw = await kv.get(ENTRIES_KEY);
    let list = Array.isArray(raw) ? (raw as FeedbackEntry[]) : [];
    if (list.length === 0) {
      list = [...SEED_ENTRIES];
      await setEntries(list);
    }
    if (segmentId) list = list.filter((e) => e.segmentId === segmentId);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  if (memoryStore.entries.length === 0) {
    memoryStore.entries = [...SEED_ENTRIES];
  }
  let list = [...memoryStore.entries];
  if (segmentId) list = list.filter((e) => e.segmentId === segmentId);
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function setEntries(entries: FeedbackEntry[]): Promise<void> {
  const kv = await getKv();
  if (kv) {
    await kv.set(ENTRIES_KEY, entries);
    return;
  }
  memoryStore.entries = entries;
}

export async function appendEntry(entry: Omit<FeedbackEntry, "id" | "createdAt">): Promise<FeedbackEntry> {
  const all = await getEntries();
  const newEntry: FeedbackEntry = {
    ...entry,
    id: generateId("fb"),
    createdAt: new Date().toISOString(),
  };
  const list = [...all, newEntry];
  await setEntries(list);
  return newEntry;
}

export async function ensureSegmentsAndSeed(): Promise<Segment[]> {
  const segs = await getSegments();
  await getEntries();
  return segs;
}
