# Changelog

## [2026-02-17] v0.7
- **User Feedback** (`/feedback`): сбор сырого фидбека по сегментам, автоматическая группировка, генерация «симулированного» JTBD-отзыва от выбранного сегмента.
- Сегменты: список с названием, описанием, счётчиком отзывов; по умолчанию 3 шаблона (новый пользователь, регулярный, пауэр-юзер); при первом открытии — seed entries (2–3 демо-записи с source=seed).
- User pains: 3–7 буллетов по сырым отзывам сегмента (LLM); при &lt; 3 записях — сообщение «добавьте ещё фидбек».
- Generate JTBD feedback: один отзыв в формате Job, Situation, Motivation, Desired outcome, Frictions, Quote (+ confidence, basedOn); кнопка «Save as raw feedback».
- Raw data: таблица записей по сегменту (дата, источник, цитата, теги, view), форма добавления (textarea + источник + save), Export JSON.
- Хранение: `fb:segments`, `fb:entries` в том же KV/in-memory; промпты в `FEEDBACK_PROMPTS.md` (секции Pains и JTBD).
- API: GET/POST `/api/feedback/segments`, GET/POST `/api/feedback/entries`, GET `/api/feedback/pains?segmentId=`, POST `/api/feedback/generate` (body: segmentId).
- Файлы: `lib/feedback-types.ts`, `lib/feedback-storage.ts`, `lib/feedback-prompts.ts`, `app/feedback/page.tsx`, `app/api/feedback/*`, `FEEDBACK_PROMPTS.md`. Ссылка User Feedback в навигации на всех страницах.

## [2026-02-17] v0.6
- Документация обновлена: DOCS.md (Backlog в TL;DR, урлы, раздел 2.4 Backlog Generate, версия v0.6), RUNBOOK (проверка /backlog при деплое).
- Страница **Backlog** (`/backlog`): карточки в стиле JIRA с колонками Backlog / To Do / In Progress / Done.
- Добавление карточек (название + описание), перемещение между статусами кнопками «→ …», удаление карточки (подтверждение).
- Хранение карточек в `localStorage` (ключ `pm-backlog-cards`).
- Кнопка **Generate**: анализ загруженного документа о продукте (из Базы знаний) и создание предложенных топ-фич как карточек в Backlog. Промпт вынесен в `BACKLOG_GENERATE_PROMPT.md` для редактирования админом.
- API `POST /api/backlog/generate`: чтение документа из storage, вызов LLM с промптом из файла, парсинг JSON с массивом `features` (title, description).
- Ссылка Backlog добавлена в навигацию на всех страницах.

## [2026-02-17] v0.5.1
- Документация приведена к актуальному состоянию: `DOCS.md` (TL;DR, урлы, RAG, env, архитектура 2.3, версия v0.5, известные проблемы), `RUNBOOK.md` (env для RAG, раздел 2.4 про ошибки RAG, проверка деплоя), `README.md` (уточнение про порт и список страниц/API).

## [2026-02-17] v0.5
- One-doc RAG MVP: страницы `/kb` (загрузка/удаление документа) и `/ask` (вопрос по документу, ответ + контекст).
- API: POST /api/kb/set, GET /api/kb/get, POST /api/kb/clear, POST /api/ask.
- Утилиты: lib/chunk.ts, lib/cosine.ts, lib/llm.ts (embeddings + chat), lib/storage.ts (Vercel KV или in-memory fallback).
- Чанки ~800–1200 символов, overlap 150; topK=6 для retrieval; ответы строго по документу.
- Добавлены .env.example (LLM_*, EMBEDDING_MODEL, KV_*), обновлены README и навигация (ссылки на База знаний и Спросить).
- Зависимость: @vercel/kv для продакшена; без KV — in-memory только для локальной разработки.

## [2026-02-17] v0.4
- На странице User Segments вывод сегментов перенесён вниз страницы (полная ширина).
- Ответ LLM парсится на фронте: из markdown‑таблицы извлекаются сегменты (название, описание, JTBD, %).
- Сегменты отображаются в виде таблицы в стиле Notion (колонки, заголовки, бейджи для %, поддержка светлой/тёмной темы).
- При неудачном парсинге показывается сырой текст ответа.
- Документация обновлена: DOCS, README, TODO.

## [2026-02-17] v0.3
- Добавлена страница `/user-segments` с панелью чатов, текстовым полем и выводом сегментов пользователей
- Создан эндпоинт `POST /api/user-segments` для генерации 4–5 пользовательских сегментов через LLM
- В хедере добавлена навигация между страницами `Design Brief` (`/`) и `User Segments` (`/user-segments`)
- Добавлен отдельный админский промпт `USER_SEGMENTS_PROMPT.md` для настройки логики сегментации

## [2026-02-17] v0.2
- Переработан главный экран в стиле Notion‑подобного workspace
- Добавлена левая панель чатов и создание новых чатов (без истории)
- Добавлен переключатель светлой/тёмной темы (white/dark) на главной странице
- Обновлена документация: `DOCS.md`, `README.md`, `RUNBOOK.md`, `TODO.md`, `CURSOR_CONTEXT.md`
- Known issue: большой base64‑payload с изображениями всё ещё может не влезать в лимиты Vercel/LLM API

## [2026-02-17] v0.1
- Added `/api/design` route (OpenAI‑compatible)
- Added UI to upload mockups + prompt
- Fixed Vercel deploy by connecting Git repo
- Known issue: large base64 payload can fail on Vercel
