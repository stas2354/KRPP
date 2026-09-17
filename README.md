# Республика Йойград — Законодательный портал

Сайт с УК и КоАП Республики Йойград, ИИ-помощником и админ-панелью.

## 🚀 Запуск локально

```bash
npm install
cp .env.example .env   # вставь свои ключи
npm run seed           # загружает все статьи в БД
npm start
```

Открой http://localhost:3000

**Админ по умолчанию:** `admin` / `admin123`

## 📁 Структура

- `/` — главная
- `/uk.html` — Уголовный кодекс
- `/koap.html` — КоАП
- `/ai.html` — ИИ-помощник
- `/admin.html` — админка
- `/login.html` — вход

## 🔑 Получить ключ ИИ (бесплатно)

1. Зайди на https://openrouter.ai
2. Зарегистрируйся
3. Keys → Create Key
4. Вставь в `.env`: `OPENROUTER_API_KEY=sk-or-...`

## 🚢 Деплой

Frontend + Backend: [Render.com](https://render.com)
- Build: `npm install && npm run seed`
- Start: `npm start`

Или GitHub Pages (только фронт) + Render (backend).