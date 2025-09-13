# ELOM Frontend (Vue 3 + Vite + TS)

## Быстрый старт
```bash
npm i
npm run dev
```
Открой `http://localhost:5173`

### Настройки
- API URL в `.env.development`: `VITE_API_URL=http://localhost:8000/api/v1`
- Требуется работающий backend (Django) с CORS и JWT.

### Фичи MVP
- Вход (JWT), авто-рефреш токена.
- Дашборд: `/health`, `/users/me`.
- Материалы: список, создание, редактирование, загрузка фото.
- Закупки: список.
- Импорт закупок из Excel: загрузка файла, dry-run.

### Структура
- Pinia store: `src/stores/auth.ts`
- Axios клиент с интерсепторами: `src/api/client.ts`
- Роутинг и guards: `src/router/index.ts`
- Tailwind: `src/assets/tailwind.css`

### Сборка
```bash
npm run build
npm run preview
```
