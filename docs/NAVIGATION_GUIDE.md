# Навигация по документации ELOM

## 📚 Структура документации

```
docs/
├── summary/                         # Основная документация (17 файлов)
│   ├── README.md                    # Обзор проекта
│   ├── 01-architecture.md           # Архитектура
│   ├── 02-data-models.md            # Модели данных
│   ├── 03-api-documentation.md      # API документация
│   ├── 04-frontend-components.md    # Компоненты
│   ├── 05-business-logic.md         # Бизнес-логика
│   ├── 06-integrations.md           # Интеграции
│   ├── 07-deployment.md             # Развертывание
│   ├── 08-testing.md                # Тестирование
│   ├── 09-security.md               # Безопасность
│   ├── 10-performance.md            # Производительность
│   ├── 11-types-refactoring.md      # Рефакторинг типов
│   ├── 12-writeoff-system.md        # Система списаний
│   ├── 13-components-reference.md   # Справочник компонентов
│   ├── 14-api-endpoints-reference.md # Справочник API
│   ├── 15-current-state.md          # Текущее состояние
│   └── STORES_ARCHITECTURE.md       # Архитектура Stores 🆕
├── PROJECT_STATUS.md                # Статус проекта
├── API_QUICK_REFERENCE.md           # Быстрая справка API
├── NAVIGATION_GUIDE.md              # Этот файл
└── api_schema.yaml                  # OpenAPI схема
```

---

## 🎯 Для разных ролей

### Новые разработчики
1. `summary/README.md` — Обзор
2. `summary/01-architecture.md` — Архитектура
3. `summary/STORES_ARCHITECTURE.md` — Работа со stores

### Backend разработчики
1. `summary/02-data-models.md` — Модели
2. `summary/03-api-documentation.md` — API
3. `api_schema.yaml` — OpenAPI схема

### Frontend разработчики
1. `summary/04-frontend-components.md` — Компоненты
2. `summary/13-components-reference.md` — Справочник
3. `summary/STORES_ARCHITECTURE.md` — Stores

---

## 🔍 Поиск информации

| Тема | Где искать |
|------|------------|
| Компоненты | `13-components-reference.md` |
| API Endpoints | `14-api-endpoints-reference.md`, `API_QUICK_REFERENCE.md` |
| Модели данных | `02-data-models.md` |
| Бизнес-логика | `05-business-logic.md` |
| Stores | `STORES_ARCHITECTURE.md` |

---

## 🔧 Система учёта инструментов (ноябрь 2025)

### Страницы (только admin)
- `/tools_index` — Список инструментов
- `/tools_issues` — Журнал выдач и возвратов

### Компоненты
- `pages/Tools/List.vue` — Список инструментов
- `pages/Tools/ToolForm.vue` — Форма инструмента
- `pages/Tools/ToolIssueForm.vue` — Форма выдачи
- `pages/Tools/ToolReturnForm.vue` — Форма возврата
- `pages/Tools/ToolHistory.vue` — История инструмента
- `pages/Tools/Issues/List.vue` — Журнал выдач
- `components/cards/ToolCard.vue` — Мобильная карточка
- `components/cards/ToolIssueCard.vue` — Карточка выдачи

### Stores
- `stores/tools.ts` — Управление инструментами
- `stores/toolIssues.ts` — Управление выдачами

---

## 📝 Обновление документации

### Когда обновлять
- При добавлении компонентов → `13-components-reference.md`
- При изменении API → `14-api-endpoints-reference.md`
- При добавлении stores → `STORES_ARCHITECTURE.md`
- После крупных изменений → `PROJECT_STATUS.md`

---

**Статус документации:** ✅ 100% актуальна  
**Последнее обновление:** 27 Ноября 2025  
**Версия:** 3.5
