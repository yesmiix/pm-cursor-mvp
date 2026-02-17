"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type SegmentWithCount = {
  id: string;
  name: string;
  description: string;
  count: number;
};

type FeedbackEntry = {
  id: string;
  segmentId: string;
  text: string;
  source: string;
  createdAt: string;
  tags?: string[];
};

type JTBDSimulation = {
  job: string;
  situation: string;
  motivation: string;
  desiredOutcome: string;
  frictions: string;
  quote: string;
  confidence?: string;
  basedOn?: string[];
};

export default function FeedbackPage() {
  const [segments, setSegments] = useState<SegmentWithCount[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [pains, setPains] = useState<string[]>([]);
  const [painsMessage, setPainsMessage] = useState("");
  const [painsLoading, setPainsLoading] = useState(false);
  const [simulation, setSimulation] = useState<JTBDSimulation | null>(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [pathname, setPathname] = useState("");
  const [addText, setAddText] = useState("");
  const [addSource, setAddSource] = useState("survey");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [viewId, setViewId] = useState<string | null>(null);

  const path = usePathname();
  useEffect(() => {
    setPathname(path ?? "");
  }, [path]);

  const fetchSegments = useCallback(async () => {
    try {
      const res = await fetch("/api/feedback/segments");
      const data = await res.json();
      if (data.ok && Array.isArray(data.segments)) {
        setSegments(data.segments);
        if (!selectedId && data.segments.length > 0) {
          setSelectedId(data.segments[0].id);
        }
      }
    } catch {
      setSegments([]);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchSegments();
  }, []);

  const selectedSegment = segments.find((s) => s.id === selectedId);

  const fetchEntries = useCallback(async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/feedback/entries?segmentId=${encodeURIComponent(selectedId)}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.entries)) setEntries(data.entries);
      else setEntries([]);
    } catch {
      setEntries([]);
    }
  }, [selectedId]);

  const fetchPains = useCallback(async () => {
    if (!selectedId) return;
    setPainsMessage("");
    setPainsLoading(true);
    setPains([]);
    try {
      const res = await fetch(`/api/feedback/pains?segmentId=${encodeURIComponent(selectedId)}`);
      const data = await res.json();
      if (data.ok) {
        setPains(Array.isArray(data.pains) ? data.pains : []);
        if (data.message) setPainsMessage(data.message);
      }
    } catch {
      setPains([]);
    } finally {
      setPainsLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchEntries();
    setSimulation(null);
    setPains([]);
    setPainsMessage("");
    if (selectedId) fetchPains();
  }, [selectedId, fetchEntries, fetchPains]);

  const handleGenerate = useCallback(async () => {
    if (!selectedId) return;
    setGenerateError("");
    setGenerateLoading(true);
    setSimulation(null);
    try {
      const res = await fetch("/api/feedback/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segmentId: selectedId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setGenerateError(data.error ?? "Ошибка генерации.");
        return;
      }
      setSimulation(data.simulation ?? null);
    } catch {
      setGenerateError("Не удалось сгенерировать отзыв.");
    } finally {
      setGenerateLoading(false);
    }
  }, [selectedId]);

  const handleSaveAsRaw = useCallback(async () => {
    if (!selectedId || !simulation?.quote) return;
    setAddLoading(true);
    setAddError("");
    try {
      const res = await fetch("/api/feedback/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmentId: selectedId,
          text: simulation.quote,
          source: "jtbd_simulation",
          tags: ["jtbd"],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAddError(data.error ?? "Ошибка сохранения.");
        return;
      }
      await fetchEntries();
    } catch {
      setAddError("Ошибка сохранения.");
    } finally {
      setAddLoading(false);
    }
  }, [selectedId, simulation, fetchEntries]);

  const handleAddEntry = useCallback(async () => {
    if (!selectedId || !addText.trim()) return;
    setAddError("");
    setAddLoading(true);
    try {
      const res = await fetch("/api/feedback/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmentId: selectedId,
          text: addText.trim(),
          source: addSource,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAddError(data.error ?? "Ошибка добавления.");
        return;
      }
      setAddText("");
      await fetchEntries();
      await fetchPains();
    } catch {
      setAddError("Ошибка добавления.");
    } finally {
      setAddLoading(false);
    }
  }, [selectedId, addText, addSource, fetchEntries, fetchPains]);

  const handleExportJson = useCallback(() => {
    const json = JSON.stringify(entries, null, 2);
    navigator.clipboard.writeText(json).catch(() => {});
  }, [entries]);

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
      className={`flex min-h-screen font-sans text-sm transition-colors ${
        theme === "dark" ? "bg-zinc-950 text-zinc-50" : "bg-white text-zinc-900"
      }`}
    >
      <div className="flex w-full max-w-6xl flex-1 gap-4 px-4 py-4">
        <aside
          className={`w-56 flex-shrink-0 rounded-lg border p-3 ${
            theme === "dark" ? "border-zinc-700 bg-zinc-900/60" : "border-zinc-200 bg-zinc-50/80"
          }`}
        >
          <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Сегменты
          </h2>
          <p className="mb-2 text-[11px] text-zinc-500">
            Сегменты можно редактировать позже. По умолчанию — три шаблона.
          </p>
          <ul className="space-y-1">
            {segments.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full rounded-md px-2 py-2 text-left text-xs transition ${
                    selectedId === s.id
                      ? theme === "dark"
                        ? "bg-zinc-700 text-zinc-50"
                        : "bg-zinc-200 text-zinc-900"
                      : theme === "dark"
                        ? "hover:bg-zinc-800 text-zinc-300"
                        : "hover:bg-zinc-100 text-zinc-700"
                  }`}
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-1 text-zinc-500">({s.count})</span>
                  <p className="mt-0.5 truncate text-[11px] text-zinc-500">{s.description}</p>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="min-w-0 flex-1 space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-zinc-200 dark:border-zinc-800">
            <div>
              <h1 className="text-[26px] font-semibold tracking-tight">User Feedback</h1>
              <p className={`mt-1 text-xs ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                Сырой фидбек по сегментам, боли и симулированный JTBD-отзыв. Промпты: <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">FEEDBACK_PROMPTS.md</code>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <nav className="flex flex-wrap gap-1 text-[11px] font-medium">
                <Link href="/" className={`rounded-md px-2 py-1 transition ${linkClass("/")}`}>Design Brief</Link>
                <Link href="/user-segments" className={`rounded-md px-2 py-1 transition ${linkClass("/user-segments")}`}>User Segments</Link>
                <Link href="/kb" className={`rounded-md px-2 py-1 transition ${linkClass("/kb")}`}>База знаний</Link>
                <Link href="/ask" className={`rounded-md px-2 py-1 transition ${linkClass("/ask")}`}>Спросить</Link>
                <Link href="/backlog" className={`rounded-md px-2 py-1 transition ${linkClass("/backlog")}`}>Backlog</Link>
                <Link href="/feedback" className={`rounded-md px-2 py-1 transition ${linkClass("/feedback")}`}>User Feedback</Link>
              </nav>
              <button
                type="button"
                onClick={() => setTheme((p) => (p === "light" ? "dark" : "light"))}
                className={`rounded-md border px-3 py-1.5 text-[11px] font-medium ${
                  theme === "dark" ? "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {theme === "dark" ? "Dark" : "Light"}
              </button>
            </div>
          </header>

          {!selectedSegment ? (
            <p className="text-zinc-500">Выберите сегмент слева.</p>
          ) : (
            <>
              <section className={`rounded-lg border p-4 ${theme === "dark" ? "border-zinc-700 bg-zinc-900/40" : "border-zinc-200 bg-zinc-50/80"}`}>
                <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">User pains</h2>
                {painsLoading ? (
                  <p className="text-zinc-500">Загрузка…</p>
                ) : painsMessage ? (
                  <p className="text-zinc-500">{painsMessage}</p>
                ) : pains.length > 0 ? (
                  <ul className="list-inside list-disc space-y-1 text-xs">
                    {pains.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-zinc-500">Нет данных или недостаточно записей для генерации болей.</p>
                )}
              </section>

              <section className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generateLoading}
                  className={`rounded-md px-4 py-1.5 text-[13px] font-medium text-white ${generateLoading ? "cursor-not-allowed bg-zinc-500" : "bg-zinc-900 hover:bg-zinc-800"}`}
                >
                  {generateLoading ? "Генерация…" : "Generate JTBD feedback"}
                </button>
              </section>

              {generateError && (
                <div className="rounded-md border border-red-200 bg-red-50/80 px-3 py-2 text-[11px] text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
                  {generateError}
                </div>
              )}

              {simulation && (
                <section className={`rounded-lg border p-4 ${theme === "dark" ? "border-zinc-700 bg-zinc-900/40" : "border-zinc-200 bg-zinc-50/80"}`}>
                  <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">JTBD-симуляция</h2>
                  <div className="space-y-2 text-xs">
                    <p><strong>Job:</strong> {simulation.job}</p>
                    <p><strong>Situation:</strong> {simulation.situation}</p>
                    <p><strong>Motivation:</strong> {simulation.motivation}</p>
                    <p><strong>Desired outcome:</strong> {simulation.desiredOutcome}</p>
                    <p><strong>Frictions:</strong> {simulation.frictions}</p>
                    <p><strong>Quote:</strong> {simulation.quote}</p>
                    {simulation.confidence && <p><strong>Confidence:</strong> {simulation.confidence}</p>}
                    {simulation.basedOn && simulation.basedOn.length > 0 && (
                      <p><strong>Based on:</strong> {simulation.basedOn.join(", ")}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveAsRaw}
                    disabled={addLoading}
                    className="mt-3 rounded-md border border-zinc-300 px-3 py-1 text-[11px] font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800 disabled:opacity-50"
                  >
                    Save as raw feedback
                  </button>
                </section>
              )}

              <section className={`rounded-lg border p-4 ${theme === "dark" ? "border-zinc-700 bg-zinc-900/40" : "border-zinc-200 bg-zinc-50/80"}`}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Raw data (по сегменту)</h2>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="rounded border border-zinc-300 px-2 py-1 text-[11px] hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
                  >
                    Export JSON
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className={`border-b ${theme === "dark" ? "border-zinc-600" : "border-zinc-200"}`}>
                        <th className="py-1 pr-2 text-left">Дата</th>
                        <th className="py-1 pr-2 text-left">Источник</th>
                        <th className="py-1 pr-2 text-left">Цитата / текст</th>
                        <th className="py-1 pr-2 text-left">Теги</th>
                        <th className="py-1 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.length === 0 ? (
                        <tr><td colSpan={5} className="py-4 text-center text-zinc-500">Нет записей.</td></tr>
                      ) : (
                        entries.map((e) => (
                          <tr key={e.id} className={`border-b ${theme === "dark" ? "border-zinc-700" : "border-zinc-100"}`}>
                            <td className="py-1.5 pr-2 whitespace-nowrap">{new Date(e.createdAt).toLocaleDateString()}</td>
                            <td className="py-1.5 pr-2">{e.source}</td>
                            <td className="max-w-[280px] truncate py-1.5 pr-2">{e.text}</td>
                            <td className="py-1.5 pr-2">{(e.tags ?? []).join(", ")}</td>
                            <td className="py-1.5">
                              <button
                                type="button"
                                onClick={() => setViewId(viewId === e.id ? null : e.id)}
                                className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                              >
                                {viewId === e.id ? "−" : "view"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {viewId && entries.find((e) => e.id === viewId) && (
                  <div className={`mt-2 rounded border p-2 text-xs ${theme === "dark" ? "border-zinc-600 bg-zinc-800/50" : "border-zinc-200 bg-white"}`}>
                    <pre className="whitespace-pre-wrap break-words">{entries.find((e) => e.id === viewId)?.text}</pre>
                  </div>
                )}

                <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
                  <h3 className="mb-2 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Добавить raw feedback</h3>
                  <textarea
                    value={addText}
                    onChange={(e) => setAddText(e.target.value)}
                    placeholder="Цитата или текст отзыва..."
                    rows={2}
                    className={`mb-2 w-full resize-none rounded border px-2 py-1.5 text-xs outline-none ${
                      theme === "dark" ? "border-zinc-600 bg-zinc-800 text-zinc-100" : "border-zinc-300 bg-white text-zinc-900"
                    }`}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={addSource}
                      onChange={(e) => setAddSource(e.target.value)}
                      className={`rounded border px-2 py-1 text-xs ${
                        theme === "dark" ? "border-zinc-600 bg-zinc-800 text-zinc-100" : "border-zinc-300 bg-white text-zinc-900"
                      }`}
                    >
                      <option value="survey">survey</option>
                      <option value="interview">interview</option>
                      <option value="support">support</option>
                      <option value="manual">manual</option>
                    </select>
                    <span className="text-[11px] text-zinc-500">Сегмент: {selectedSegment?.name}</span>
                    <button
                      type="button"
                      onClick={handleAddEntry}
                      disabled={addLoading || !addText.trim()}
                      className="rounded bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                    >
                      {addLoading ? "Сохранение…" : "Save"}
                    </button>
                  </div>
                  {addError && <p className="mt-1 text-[11px] text-red-600">{addError}</p>}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
