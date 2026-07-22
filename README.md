# ELOM — Frontend

Веб-клиент системы учёта материалов и закупок для строительных объектов (слаботочные
системы: СКС, видеонаблюдение, СКУД, ОПС). SPA на Vue 3, работает поверх Django/DRF
бэкенда (`/opt/elom-backend`) через JWT-авторизацию. Интерфейс на русском языке.
Приложение установимо как PWA.

## Стек

| Слой | Технология |
|------|-----------|
| Фреймворк | Vue 3 (Composition API, `<script setup>`) |
| Состояние | Pinia (`src/stores`) |
| Маршрутизация | vue-router 4 (`src/router`) |
| Сборка / dev | Vite 7 (`vite.config.ts`) |
| Стили | Tailwind CSS v4 (`@tailwindcss/vite`) + DaisyUI v5 |
| HTTP | axios (`src/api`) |
| Графики | Chart.js + vue-chartjs |
| Экспорт | jsPDF + jspdf-autotable |
| Шрифты | IBM Plex Sans / IBM Plex Mono (`@fontsource/*`) |
| Юнит-тесты | Vitest + @vue/test-utils + jsdom |
| E2E-тесты | Playwright |
| PWA | vite-plugin-pwa (Workbox) |
| Язык | TypeScript, ESLint, Prettier |

## Структура `src`

```
api/         axios-клиент и карта эндпоинтов (endpoints.ts)
components/  переиспользуемые компоненты (config-driven kit + PWA/RBAC)
composables/ переиспользуемая логика
layouts/     оболочки страниц
pages/       страницы, привязанные к маршрутам
router/      определение маршрутов
stores/      Pinia-хранилища
styles/      токены темы и глобальные стили
types/       общие типы
utils/       вспомогательные функции
```

## Config-driven UI

Списки и формы не пишутся вручную под каждую сущность — они собираются из объекта
конфигурации, что обеспечивает единообразие всех разделов.

- **`GenericList.vue`** — универсальный список. По `config` рендерит заголовок
  (`ListHeader`), панель фильтров (`FilterPanel` / `FilterField`), таблицу с
  пагинацией (`ModernPagination`), кнопку экспорта (`ExportButton`) и мобильные
  карточки. Данные и состояние берутся из привязанного Pinia-store
  (`store.items`, `store.filters`, `store.pagination`, `store.loading`).
- **`GenericForm.vue`** — универсальная форма. Из `config.sections[].fields[]`
  рендерит поля через `FormField`, поддерживает секции, условное отображение полей
  (`field.condition`), кастомные поля (`type: 'custom'` через именованный слот) и
  валидацию.
- **`Modal.vue`** — модальное окно (DaisyUI `modal`) со слотами `header` / контент /
  `footer`, управляется через `v-model`.

RBAC встроен в kit: видимость действий (создание, экспорт) и разделов управляется
компонентами `PermissionGuard`, `PermissionButton`, `PermissionSection` и данными
эндпоинта `rbac/my-permissions/`.

## Дизайн-язык

Интерфейс — «профессиональный инструмент», а не потребительское приложение:
инженерно-функциональный, высококонтрастный (читаемость на объекте при ярком солнце —
функциональное требование).

- **Сталь / графит** — холодная нейтральная база и hairline-границы (сетка как в
  кабельном журнале).
- **Медь (copper)** — единственный тёплый акцент: первичные действия, фокус, активная
  навигация.
- **Данные — моноширинным шрифтом IBM Plex Mono** (количества, балансы, цены, номера,
  даты) — как показания прибора; выравнивается по колонкам и мгновенно сканируется.
- **Статусы — кабельные маркеры**: мелкие моноширинные бордюрные бейджи с цветовой
  семантикой (green / steel-blue / amber / fault-red / graphite).

Полное описание токенов и семантики — в [`DESIGN_LANGUAGE.md`](./DESIGN_LANGUAGE.md).

## PWA

Настраивается в `vite.config.ts` (плагин `VitePWA`), UI-статус —
[`src/components/PwaStatus.vue`](./src/components/PwaStatus.vue).

- **Установимость** — manifest (`ELOM — Учёт материалов`, `display: standalone`,
  theme_color медный `#B0500F`).
- **App-shell precache** — сборка (js/css/html/svg/шрифты/иконки) кэшируется Workbox по
  хэшу (cache-first, файлы неизменяемы). Навигации офлайн отдают закэшированный
  `index.html` (`navigateFallback`).
- **Бизнес-данные — только сеть** (`NetworkOnly` для `/api/`, `navigateFallbackDenylist`
  для API): балансы, закупки и списания никогда не подменяются устаревшим кэшем.
- **Офлайн-баннер** — при потере соединения `PwaStatus` показывает предупреждение
  «Нет соединения. Данные могут быть неактуальны, изменения отключены.».
- **Запрос на обновление** — `registerType: 'prompt'`: тихого обновления нет, при
  новой версии показывается кнопка «Обновить».

## Скрипты (`package.json`)

| Команда | Действие |
|---------|----------|
| `npm run dev` | Vite dev-сервер (порт 5173, `host: true`) |
| `npm run build` | Проверка типов `vue-tsc -b` + продакшн-сборка `vite build` |
| `npm run preview` | Локальный предпросмотр собранного бандла |
| `npm test` | Vitest в watch-режиме |
| `npm run test:run` | Прогон юнит-тестов один раз |
| `npm run test:ui` | Vitest UI |
| `npm run test:coverage` | Покрытие (v8) |
| `npm run test:e2e` | Playwright E2E |
| `npm run test:e2e:ui` / `:headed` / `:debug` | Варианты запуска Playwright |
| `npm run lint` | ESLint с автофиксом (`--fix`) |
| `npm run lint:check` | ESLint без изменений |
| `npm run type-check` | `vue-tsc --noEmit` |
| `npm run format` / `format:check` | Prettier |

## Окружение

- **`VITE_API_URL`** — базовый префикс API. По умолчанию `/api/v1` (см.
  [`src/api/endpoints.ts`](./src/api/endpoints.ts) — `API_PREFIX`). Все эндпоинты
  строятся относительно этого префикса.
- Алиас **`@`** → `./src` (`vite.config.ts`).

## Быстрый старт

```bash
npm install
npm run dev        # http://localhost:5173
# сборка
npm run build
npm run preview
```
