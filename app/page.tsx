"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { AppHeader } from "./components/AppHeader";

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
      className={`flex min-h-screen flex-col font-sans text-sm transition-colors ${
        theme === "dark"
          ? "bg-zinc-950 text-zinc-50"
          : "bg-white text-zinc-900"
      }`}
    >
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-5">
        <AppHeader
          pathname={pathname ?? ""}
          theme={theme}
          setTheme={setTheme}
          title="PM Cursor MVP"
          description="Загрузите макеты и опишите задачу — мы подготовим структурированный дизайн‑запрос."
        />
        <div className="mt-6 flex gap-6">
        <aside
          className={`card hidden w-64 flex-shrink-0 flex-col rounded-xl border px-3 py-4 sm:flex ${
            theme === "dark" ? "border-zinc-800 bg-zinc-900/70" : "border-zinc-200 bg-white"
          }`}
        >
          <div className="mb-3 flex items-center justify-between gap-2 px-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Workspace
            </span>
            <button
              type="button"
              onClick={handleNewChat}
              className={`btn-secondary rounded-lg border px-2.5 py-1.5 text-[11px] font-medium ${
                theme === "dark"
                  ? "border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300"
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
                className={`nav-link flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] ${
                  chat.id === activeChatId
                    ? theme === "dark"
                      ? "bg-zinc-800 text-zinc-50 shadow-inner"
                      : "bg-zinc-100 text-zinc-900 shadow-sm"
                    : theme === "dark"
                      ? "text-zinc-300 hover:bg-zinc-800/70"
                      : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <span className="truncate">{chat.title}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main
          className={`card flex-1 min-w-0 rounded-xl border p-6 ${
            theme === "dark"
              ? "border-zinc-800 bg-zinc-900/60"
              : "border-zinc-200 bg-white"
          }`}
        >
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
                  className={`input-smooth w-full resize-none rounded-lg border px-3 py-2 text-xs ${
                    theme === "dark"
                      ? "border-zinc-700 bg-zinc-900/60 text-zinc-50"
                      : "border-zinc-200 text-zinc-900 bg-white"
                  }`}
                  placeholder="Опишите, что нужно спроектировать на основе макетов: контекст, целевая аудитория, ограничения, желаемый результат..."
                />
              </div>

              <div className="flex flex-wrap items-end justify-between gap-4 border-t border-zinc-200 pt-4">
                <span className="text-[11px] text-zinc-500">
                  Чат: {chats.find((c) => c.id === activeChatId)?.title}
                </span>
                <button
                  type="button"
                  onClick={handleDesign}
                  disabled={isDesigning}
                  className="btn-primary rounded-lg bg-zinc-900 px-5 py-2 text-[13px] font-medium text-zinc-50 shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
                >
                  {isDesigning ? "Проектируем..." : "Спроектировать"}
                </button>
              </div>
            </div>

            <div
              className={`card space-y-4 rounded-lg border p-4 ${
                theme === "dark"
                  ? "border-zinc-800 bg-zinc-900/60"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <div>
                <h2 className="mb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                  Результат
                </h2>
                <div
                  className={`card min-h-[120px] rounded-lg border border-dashed p-3 ${
                    theme === "dark"
                      ? "border-zinc-800 bg-zinc-900/70"
                      : "border-zinc-200 bg-white"
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
                <div className="min-h-[40px] rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-[11px] text-red-700 shadow-sm">
                  {error || "Ошибок нет."}
                </div>
              </div>
            </div>
          </section>
        </main>
        </div>
      </div>
    </div>
  );
}
