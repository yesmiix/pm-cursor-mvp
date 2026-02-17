# Changelog

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
