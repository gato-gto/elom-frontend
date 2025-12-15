# ELOM Frontend

**Система управления закупками, остатками и инструментами**

---

## 🚀 Быстрый старт

```bash
npm install
npm run dev     # http://localhost:5173
```

---

## 📋 Возможности

- **Закупки** — создание, редактирование, фото
- **Материалы** — номенклатура с категориями
- **Объекты** — управление строительными объектами
- **Остатки** — автоматический расчет движений
- **Списания** — учет расхода материалов
- **Отчёты** — по периодам, объектам, материалам
- **Инструменты** — учёт и выдача (только admin) 🆕

---

## 🏗️ Архитектура

```
src/
├── api/           # API клиент и типы
├── components/    # Vue компоненты (55 файлов)
├── composables/   # Composables (13 файлов)
├── pages/         # Страницы (38 файлов)
├── stores/        # Pinia stores (18 файлов)
├── router/        # Vue Router
└── utils/         # Утилиты
```

### Технологический стек

- **Vue 3** (Composition API)
- **TypeScript**
- **Pinia** (state management)
- **Vue Router**
- **Tailwind CSS** + **DaisyUI**
- **Vite**

---

## 🔐 Роли

| Роль | Описание |
|------|----------|
| `admin` | Полный доступ + инструменты |
| `manager` | Полный доступ без учета изменений |
| `brigadier` | Создание объекта, списание, закупка |
| `warehouse` | Полный доступ без учета изменений |
| `requester` | Просмотр и подача заявки на материал |

---

## 📁 Ключевые компоненты

### Универсальные
- `GenericForm` — универсальная форма
- `GenericList` — универсальный список
- `GenericSearchSelect` — поиск с автодополнением

### Stores
Все entity stores используют `createBaseStore`:
```typescript
const store = useMyStore()  // Вызываем как функцию!
await store.fetchList()
await store.create(data)
await store.update(id, data)
await store.remove(id)
```

---

## 🧪 Тестирование

```bash
npm run test           # Unit тесты
npm run test:e2e       # E2E тесты
npm run test:coverage  # С покрытием
```

---

## 📚 Документация

- [Архитектура](docs/summary/01-architecture.md)
- [Компоненты](docs/summary/04-frontend-components.md)
- [API](docs/summary/03-api-documentation.md)
- [Stores](docs/summary/STORES_ARCHITECTURE.md)
- [Статус проекта](docs/PROJECT_STATUS.md)

---

## 🆕 Последние изменения (27 ноября 2025)

### Система инструментов
- ✅ Список инструментов (`/tools_index`)
- ✅ Журнал выдач (`/tools_issues`)
- ✅ Массовое добавление
- ✅ Выдача/возврат
- ✅ История инструмента

### Рефакторинг Stores
- ✅ Все stores используют `createBaseStore`
- ✅ Вызов как функции: `useMyStore()`
- ✅ Метод `remove` вместо `delete`

### Оптимизация ролей (декабрь 2025)
- ✅ 5 ролей: admin, manager, brigadier, warehouse, requester
- ✅ Роли manager и warehouse работают "без учета изменений"
- ✅ Новая роль requester для просмотра и подачи заявок
- ✅ Система заявок на материалы

---

**Версия:** 3.5  
**Статус:** ✅ Production Ready
