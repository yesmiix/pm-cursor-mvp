"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "pm-backlog-cards";

export type BacklogStatus = "backlog" | "todo" | "in_progress" | "done";

export type BacklogCard = {
  id: string;
  title: string;
  description: string;
  status: BacklogStatus;
  createdAt: string;
};

const STATUSES: { value: BacklogStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

function loadCards(): BacklogCard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BacklogCard[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCards(cards: BacklogCard[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function BacklogPage() {
  const [cards, setCards] = useState<BacklogCard[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [pathname, setPathname] = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState("");

  const path = usePathname();
  useEffect(() => {
    setPathname(path ?? "");
  }, [path]);

  useEffect(() => {
    setCards(loadCards());
  }, []);

  const persist = useCallback((next: BacklogCard[]) => {
    setCards(next);
    saveCards(next);
  }, []);

  const addCard = useCallback(
    (title: string, description: string, status: BacklogStatus = "backlog") => {
      if (!title.trim()) return;
      const newCard: BacklogCard = {
        id: generateId(),
        title: title.trim(),
        description: description.trim(),
        status,
        createdAt: new Date().toISOString(),
      };
      persist([...cards, newCard]);
      setAddTitle("");
      setAddDescription("");
    },
    [cards, persist],
  );

  const moveCard = useCallback(
    (id: string, newStatus: BacklogStatus) => {
      persist(
        cards.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
      );
    },
    [cards, persist],
  );

  const removeCard = useCallback(
    (id: string) => {
      if (typeof window !== "undefined" && window.confirm("Удалить карточку?")) {
        persist(cards.filter((c) => c.id !== id));
      }
    },
    [cards, persist],
  );

  const handleGenerate = useCallback(async () => {
    setGenerateError("");
    setGenerateLoading(true);
    try {
      const res = await fetch("/api/backlog/generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setGenerateError(data.error ?? "Ошибка генерации.");
        return;
      }
      const features = data.features ?? [];
      const newCards: BacklogCard[] = features.map(
        (f: { title?: string; description?: string }) => ({
          id: generateId(),
          title: typeof f.title === "string" ? f.title : "Фича",
          description: typeof f.description === "string" ? f.description : "",
          status: "backlog" as BacklogStatus,
          createdAt: new Date().toISOString(),
        }),
      );
      persist([...cards, ...newCards]);
    } catch {
      setGenerateError("Не удалось сгенерировать фичи. Проверьте, что документ загружен на /kb.");
    } finally {
      setGenerateLoading(false);
    }
  }, [cards, persist]);

  const cardsByStatus = (status: BacklogStatus) =>
    cards.filter((c) => c.status === status);

  const linkClass = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href))
      ? theme === "dark"
        ? "bg-zinc-800 text-zinc-50"
        : "bg-zinc-900 text-zinc-50"
      : theme === "dark"
        ? "text-zinc-300 hover:bg-zinc-800/80"
        : "text-zinc-600 hover:bg-zinc-100";

  return (
    <div
      className={`flex min-h-screen flex-col px-4 py-4 font-sans text-sm transition-colors ${
        theme === "dark" ? "bg-zinc-950 text-zinc-50" : "bg-white text-zinc-900"
      }`}
    >
      <div className="mx-auto w-full max-w-6xl flex-1">
        <header
          className={`mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-3 ${
            theme === "dark" ? "border-zinc-800" : "border-zinc-200"
          }`}
        >
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight">
              Backlog
            </h1>
            <p
              className={`mt-1 text-xs ${
                theme === "dark" ? "text-zinc-400" : "text-zinc-500"
              }`}
            >
              Карточки фич со статусами. Generate — анализ документа из Базы знаний и предложение топ-фич. Промпт настройки: <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">BACKLOG_GENERATE_PROMPT.md</code>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex flex-wrap items-center gap-1 text-[11px] font-medium">
              <Link href="/" className={`rounded-md px-2 py-1 transition ${linkClass("/")}`}>
                Design Brief
              </Link>
              <Link href="/user-segments" className={`rounded-md px-2 py-1 transition ${linkClass("/user-segments")}`}>
                User Segments
              </Link>
              <Link href="/kb" className={`rounded-md px-2 py-1 transition ${linkClass("/kb")}`}>
                База знаний
              </Link>
              <Link href="/ask" className={`rounded-md px-2 py-1 transition ${linkClass("/ask")}`}>
                Спросить
              </Link>
              <Link href="/backlog" className={`rounded-md px-2 py-1 transition ${linkClass("/backlog")}`}>
                Backlog
              </Link>
            </nav>
            <button
              type="button"
              onClick={() => setTheme((p) => (p === "light" ? "dark" : "light"))}
              className={`rounded-md border px-3 py-1.5 text-[11px] font-medium transition ${
                theme === "dark"
                  ? "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {theme === "dark" ? "Dark theme" : "Light theme"}
            </button>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-1 flex-wrap items-end gap-2">
            <input
              type="text"
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              placeholder="Название карточки"
              className={`rounded-md border px-2 py-1.5 text-xs outline-none focus:ring-0 ${
                theme === "dark"
                  ? "border-zinc-600 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                  : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400"
              }`}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCard(addTitle, addDescription);
              }}
            />
            <input
              type="text"
              value={addDescription}
              onChange={(e) => setAddDescription(e.target.value)}
              placeholder="Описание (необязательно)"
              className={`min-w-[200px] rounded-md border px-2 py-1.5 text-xs outline-none focus:ring-0 ${
                theme === "dark"
                  ? "border-zinc-600 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                  : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400"
              }`}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCard(addTitle, addDescription);
              }}
            />
            <button
              type="button"
              onClick={() => addCard(addTitle, addDescription)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                theme === "dark"
                  ? "border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                  : "border-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
              }`}
            >
              Добавить карточку
            </button>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generateLoading}
            className={`rounded-md px-4 py-1.5 text-[13px] font-medium text-white transition ${
              generateLoading
                ? "cursor-not-allowed bg-zinc-500"
                : "bg-zinc-900 hover:bg-zinc-800"
            }`}
          >
            {generateLoading ? "Генерация…" : "Generate"}
          </button>
        </div>

        {generateError && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50/80 px-3 py-2 text-[11px] text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
            {generateError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATUSES.map(({ value, label }) => (
            <div
              key={value}
              className={`flex flex-col rounded-lg border ${
                theme === "dark"
                  ? "border-zinc-700 bg-zinc-900/50"
                  : "border-zinc-200 bg-zinc-50/80"
              }`}
            >
              <div
                className={`border-b px-3 py-2 text-xs font-medium uppercase tracking-wider ${
                  theme === "dark"
                    ? "border-zinc-700 text-zinc-400"
                    : "border-zinc-200 text-zinc-500"
                }`}
              >
                {label}
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-2 min-h-[120px]">
                {cardsByStatus(value).map((card) => (
                  <div
                    key={card.id}
                    className={`rounded-md border p-2 shadow-sm ${
                      theme === "dark"
                        ? "border-zinc-600 bg-zinc-800/80"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-medium text-[13px] leading-tight">
                        {card.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCard(card.id)}
                        className="shrink-0 rounded p-0.5 text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        title="Удалить"
                        aria-label="Удалить"
                      >
                        ×
                      </button>
                    </div>
                    {card.description && (
                      <p
                        className={`mt-1 text-[11px] leading-snug ${
                          theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                        }`}
                      >
                        {card.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {STATUSES.filter((s) => s.value !== card.status).map(
                        (s) => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => moveCard(card.id, s.value)}
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition ${
                              theme === "dark"
                                ? "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                                : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
                            }`}
                          >
                            → {s.label}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
