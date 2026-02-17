"use client";

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 font-sans dark:bg-black">
      <main className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          PM Cursor MVP
        </h1>

        <section className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Макеты (1–10 изображений)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesChange}
              className="block w-full text-sm text-zinc-900 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-50 hover:file:bg-zinc-700 dark:text-zinc-100 dark:file:bg-zinc-100 dark:file:text-zinc-900 dark:hover:file:bg-zinc-300"
            />
            <p className="text-xs text-zinc-500">
              Изображения не уходят на сервер как файлы — они конвертируются в
              dataURL в браузере.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="featureRequest"
              className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Запрос (featureRequest)
            </label>
            <textarea
              id="featureRequest"
              value={featureRequest}
              onChange={(e) => setFeatureRequest(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-300 dark:focus:ring-zinc-300"
              placeholder="Опишите, что нужно спроектировать на основе макетов..."
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleDesign}
              disabled={isDesigning}
              className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-600 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-400"
            >
              {isDesigning ? "Проектируем..." : "Спроектировать"}
            </button>
          </div>
        </section>

        <section className="mt-8 space-y-4">
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              Результат
            </h2>
            <div className="min-h-[120px] rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
              <pre className="whitespace-pre-wrap break-words text-xs sm:text-sm">
                {result || "Здесь появится структурированный ответ дизайнера."}
              </pre>
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              Ошибки
            </h2>
            <div className="min-h-[48px] rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
              {error || "Ошибок нет."}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
