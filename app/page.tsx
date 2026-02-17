"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";

type DesignResponse = {
  ok: boolean;
  result?: string;
  error?: string;
};

export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [featureRequest, setFeatureRequest] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [isDesigning, setIsDesigning] = useState(false);
  const [chats, setChats] = useState<{ id: number; title: string }[]>([
    { id: 1, title: "Новый чат" },
  ]);
  const [activeChatId, setActiveChatId] = useState(1);
  const [chatCounter, setChatCounter] = useState(1);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const pathname = usePathname();

  const handleFilesChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setError("");
      const fileList = event.target.files;
      if (!fileList) {
        setFiles(null);
        return;
      }

      if (fileList.length === 0) {
        setFiles(null);
        setError("Добавьте хотя бы одно изображение.");
        return;
      }

      if (fileList.length > 10) {
        setFiles(null);
        setError("Можно загрузить от 1 до 10 изображений.");
        return;
      }

      setFiles(fileList);
    },
    [],
  );

  const filesToDataUrls = useCallback(async (fileList: FileList) => {
    const readers: Promise<string>[] = [];

    Array.from(fileList).forEach((file) => {
      readers.push(
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            if (typeof result === "string") {
              resolve(result);
            } else {
              reject(new Error("Не удалось прочитать файл как dataURL."));
            }
          };
          reader.onerror = () => {
            reject(new Error("Ошибка чтения файла."));
          };
          reader.readAsDataURL(file);
        }),
      );
    });

    return Promise.all(readers);
  }, []);

  const handleDesign = useCallback(async () => {
    setError("");
    setResult("");

    if (!featureRequest.trim()) {
      setError("Заполните описание запроса (featureRequest).");
      return;
    }

    if (!files || files.length === 0) {
      setError("Добавьте хотя бы одно изображение.");
      return;
    }

    setIsDesigning(true);
    try {
      const images = await filesToDataUrls(files);

      const response = await fetch("/api/design", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          featureRequest,
          images,
        }),
      });

      const data: DesignResponse = await response.json();

      if (!response.ok || !data.ok) {
        setError(
          data.error ??
            "Не удалось получить ответ от дизайнера. Попробуйте еще раз.",
        );
        return;
      }

      setResult(data.result ?? "");
    } catch (err) {
      console.error(err);
      setError("Произошла непредвиденная ошибка. Попробуйте еще раз.");
    } finally {
      setIsDesigning(false);
    }
  }, [featureRequest, files, filesToDataUrls]);

  const handleNewChat = useCallback(() => {
    const nextId = chatCounter + 1;
    setChatCounter(nextId);
    setChats((prev) => [...prev, { id: nextId, title: `Чат ${nextId}` }]);
    setActiveChatId(nextId);

    setFiles(null);
    setFeatureRequest("");
    setResult("");
    setError("");
  }, [chatCounter]);

  const handleSelectChat = useCallback((id: number) => {
    setActiveChatId(id);
  }, []);

  return (
    <div
      className={`flex min-h-screen px-4 py-4 font-sans text-sm transition-colors ${
        theme === "dark"
          ? "bg-zinc-950 text-zinc-50"
          : "bg-white text-zinc-900"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl gap-3">
        <aside
          className={`hidden w-64 flex-shrink-0 flex-col rounded-lg px-2 py-3 sm:flex ${
            theme === "dark" ? "bg-zinc-900/60" : "bg-zinc-100/80"
          }`}
        >
          <div className="mb-3 flex items-center justify-between gap-2 px-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
              Workspace
            </span>
            <button
              type="button"
              onClick={handleNewChat}
              className={`inline-flex items-center justify-center rounded-md border px-2 py-1 text-[11px] font-medium shadow-sm ${
                theme === "dark"
                  ? "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              + New chat
            </button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {chats.map((chat) => (
              <button
                key={chat.id}
                type="button"
                onClick={() => handleSelectChat(chat.id)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-[13px] transition ${
                  chat.id === activeChatId
                    ? theme === "dark"
                      ? "bg-zinc-800 text-zinc-50 shadow-sm"
                      : "bg-white text-zinc-900 shadow-sm"
                    : theme === "dark"
                      ? "text-zinc-300 hover:bg-zinc-800/70"
                      : "text-zinc-700 hover:bg-zinc-200/80"
                }`}
              >
                <span className="truncate">{chat.title}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main
          className={`flex-1 rounded-xl border p-5 shadow-sm backdrop-blur ${
            theme === "dark"
              ? "border-zinc-800 bg-zinc-900/60"
              : "border-zinc-200 bg-white/70"
          }`}
        >
          <header
            className={`mb-6 flex items-center justify-between gap-3 border-b pb-3 ${
              theme === "dark" ? "border-zinc-800" : "border-zinc-200"
            }`}
          >
            <div>
              <h1 className="text-[26px] font-semibold tracking-tight">
                PM Cursor MVP
              </h1>
              <p
                className={`mt-1 text-xs ${
                  theme === "dark" ? "text-zinc-400" : "text-zinc-500"
                }`}
              >
                Загрузите макеты и опишите задачу — мы подготовим структурированный
                дизайн‑запрос.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <nav className="flex items-center gap-1 text-[11px] font-medium">
                <Link
                  href="/"
                  className={`rounded-md px-2 py-1 transition ${
                    pathname === "/"
                      ? theme === "dark"
                        ? "bg-zinc-800 text-zinc-50"
                        : "bg-zinc-900 text-zinc-50"
                      : theme === "dark"
                        ? "text-zinc-300 hover:bg-zinc-800/80"
                        : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  Design Brief
                </Link>
                <Link
                  href="/user-segments"
                  className={`rounded-md px-2 py-1 transition ${
                    pathname?.startsWith("/user-segments")
                      ? theme === "dark"
                        ? "bg-zinc-800 text-zinc-50"
                        : "bg-zinc-900 text-zinc-50"
                      : theme === "dark"
                        ? "text-zinc-300 hover:bg-zinc-800/80"
                        : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  User Segments
                </Link>
                <Link
                  href="/kb"
                  className={`rounded-md px-2 py-1 transition ${
                    pathname?.startsWith("/kb")
                      ? theme === "dark"
                        ? "bg-zinc-800 text-zinc-50"
                        : "bg-zinc-900 text-zinc-50"
                      : theme === "dark"
                        ? "text-zinc-300 hover:bg-zinc-800/80"
                        : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  База знаний
                </Link>
                <Link
                  href="/ask"
                  className={`rounded-md px-2 py-1 transition ${
                    pathname?.startsWith("/ask")
                      ? theme === "dark"
                        ? "bg-zinc-800 text-zinc-50"
                        : "bg-zinc-900 text-zinc-50"
                      : theme === "dark"
                        ? "text-zinc-300 hover:bg-zinc-800/80"
                        : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  Спросить
                </Link>
                <Link
                  href="/backlog"
                  className={`rounded-md px-2 py-1 transition ${
                    pathname?.startsWith("/backlog")
                      ? theme === "dark"
                        ? "bg-zinc-800 text-zinc-50"
                        : "bg-zinc-900 text-zinc-50"
                      : theme === "dark"
                        ? "text-zinc-300 hover:bg-zinc-800/80"
                        : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  Backlog
                </Link>
                <Link
                  href="/feedback"
                  className={`rounded-md px-2 py-1 transition ${
                    pathname?.startsWith("/feedback")
                      ? theme === "dark"
                        ? "bg-zinc-800 text-zinc-50"
                        : "bg-zinc-900 text-zinc-50"
                      : theme === "dark"
                        ? "text-zinc-300 hover:bg-zinc-800/80"
                        : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  User Feedback
                </Link>
              </nav>
              <button
                type="button"
                onClick={() =>
                  setTheme((prev) => (prev === "light" ? "dark" : "light"))
                }
                className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-[11px] font-medium transition ${
                  theme === "dark"
                    ? "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {theme === "dark" ? "Dark theme" : "Light theme"}
              </button>
            </div>
          </header>

          <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-600">
                  Макеты (1–10 изображений)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFilesChange}
                    className="block w-full cursor-pointer text-xs text-zinc-700 file:mr-3 file:rounded-md file:border file:border-zinc-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-800 hover:file:bg-zinc-50"
                  />
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  Изображения не уходят на сервер как файлы — они превращаются в
                  dataURL прямо в браузере.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="featureRequest"
                  className="block text-xs font-medium text-zinc-600"
                >
                  Запрос (featureRequest)
                </label>
                <textarea
                  id="featureRequest"
                  value={featureRequest}
                  onChange={(e) => setFeatureRequest(e.target.value)}
                  rows={8}
                  className={`w-full resize-none rounded-md border bg-zinc-50/60 px-3 py-2 text-xs outline-none transition focus:ring-0 ${
                    theme === "dark"
                      ? "border-zinc-700 bg-zinc-900/60 text-zinc-50 focus:border-zinc-300"
                      : "border-zinc-200 text-zinc-900 focus:border-zinc-900 focus:bg-white"
                  }`}
                  placeholder="Опишите, что нужно спроектировать на основе макетов: контекст, целевая аудитория, ограничения, желаемый результат..."
                />
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-zinc-200 pt-3">
                <span className="text-[11px] text-zinc-500">
                  Чат: {chats.find((c) => c.id === activeChatId)?.title}
                </span>
                <button
                  type="button"
                  onClick={handleDesign}
                  disabled={isDesigning}
                  className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-1.5 text-[13px] font-medium text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
                >
                  {isDesigning ? "Проектируем..." : "Спроектировать"}
                </button>
              </div>
            </div>

            <div
              className={`space-y-4 rounded-md border p-3 ${
                theme === "dark"
                  ? "border-zinc-800 bg-zinc-900/60"
                  : "border-zinc-200 bg-zinc-50/80"
              }`}
            >
              <div>
                <h2 className="mb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                  Результат
                </h2>
                <div
                  className={`min-h-[120px] rounded-md border border-dashed p-2 ${
                    theme === "dark"
                      ? "border-zinc-800 bg-zinc-900/70"
                      : "border-zinc-200 bg-white/70"
                  }`}
                >
                  <pre
                    className={`whitespace-pre-wrap break-words text-[12px] leading-relaxed ${
                      theme === "dark" ? "text-zinc-100" : "text-zinc-800"
                    }`}
                  >
                    {result ||
                      "Здесь появится структурированный ответ дизайнера — в стиле документа Notion."}
                  </pre>
                </div>
              </div>

              <div>
                <h2 className="mb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                  Ошибки
                </h2>
                <div className="min-h-[40px] rounded-md border border-red-200 bg-red-50/80 px-3 py-2 text-[11px] text-red-700">
                  {error || "Ошибок нет."}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
