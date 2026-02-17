/**
 * Хранилище для One-doc RAG: документ, чанки, эмбеддинги.
 * Использует Vercel KV при наличии KV_REST_API_URL и KV_REST_API_TOKEN,
 * иначе in-memory (только для локальной разработки; на проде нужен KV или Supabase).
 */

const DOC_KEY = "kb:doc";
const CHUNKS_KEY = "kb:chunks";
const EMBEDDINGS_KEY = "kb:embeddings";

export type DocMeta = {
  title: string;
  content: string;
  updatedAt: string;
};

let memoryStore: {
  doc: DocMeta | null;
  chunks: string[];
  embeddings: number[][];
} = {
  doc: null,
  chunks: [],
  embeddings: [],
};

async function getKv(): Promise<{
  get: (k: string) => Promise<unknown>;
  set: (k: string, v: unknown) => Promise<void>;
  del: (...keys: string[]) => Promise<void>;
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
      del: async (...keys: string[]) => {
        await kv.del(...keys);
      },
    };
  } catch {
    return null;
  }
}

export async function getDoc(): Promise<DocMeta | null> {
  const kv = await getKv();
  if (kv) {
    const raw = await kv.get(DOC_KEY);
    return (raw as DocMeta | null) ?? null;
  }
  return memoryStore.doc;
}

export async function setDoc(doc: DocMeta): Promise<void> {
  const kv = await getKv();
  if (kv) {
    await kv.set(DOC_KEY, doc);
    return;
  }
  memoryStore.doc = doc;
}

export async function getChunks(): Promise<string[]> {
  const kv = await getKv();
  if (kv) {
    const raw = await kv.get(CHUNKS_KEY);
    return (Array.isArray(raw) ? raw : []) as string[];
  }
  return memoryStore.chunks;
}

export async function setChunks(chunks: string[]): Promise<void> {
  const kv = await getKv();
  if (kv) {
    await kv.set(CHUNKS_KEY, chunks);
    return;
  }
  memoryStore.chunks = chunks;
}

export async function getEmbeddings(): Promise<number[][]> {
  const kv = await getKv();
  if (kv) {
    const raw = await kv.get(EMBEDDINGS_KEY);
    return (Array.isArray(raw) ? raw : []) as number[][];
  }
  return memoryStore.embeddings;
}

export async function setEmbeddings(embeddings: number[][]): Promise<void> {
  const kv = await getKv();
  if (kv) {
    await kv.set(EMBEDDINGS_KEY, embeddings);
    return;
  }
  memoryStore.embeddings = embeddings;
}

export async function clearKb(): Promise<void> {
  const kv = await getKv();
  if (kv) {
    await kv.del(DOC_KEY, CHUNKS_KEY, EMBEDDINGS_KEY);
    return;
  }
  memoryStore = { doc: null, chunks: [], embeddings: [] };
}
