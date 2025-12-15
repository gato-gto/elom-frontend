# 🏠 ELOM Frontend - Документация

**Система управления складом и закупками**  
**Версия:** 3.2 | **Дата:** 27 ноября 2025

---

## 📋 О проекте

ELOM Frontend - веб-приложение для управления:
- 📦 Складскими запасами
- 🛒 Закупками материалов
- 🏗️ Строительными объектами
- 📊 Списаниями и отчетностью
- 👥 Сотрудниками и поставщиками

---

## 🚀 Быстрый старт

```bash
npm install    # Установка
npm run dev    # Запуск
npm run build  # Сборка
npm run test   # Тесты
```

---

## 🏗️ Архитектура

### Технологии:
- **Vue 3** (Composition API)
- **TypeScript** 
- **Pinia** (State Management)
- **Tailwind CSS** + DaisyUI
- **Vite** (Build Tool)
- **Vitest** (Testing)

### Структура:
```
src/
├── api/           # API клиент и типы (19)
├── components/    # Компоненты (48)
├── composables/   # Composables (13)
├── pages/         # Страницы (32)
├── stores/        # Pinia stores (16)
└── utils/         # Утилиты (10)
```

---

## 📚 Документация

### Техническая:
| Документ | Описание |
|----------|----------|
| [01-architecture.md](summary/01-architecture.md) | Архитектура системы |
| [02-data-models.md](summary/02-data-models.md) | Модели данных |
| [03-api-documentation.md](summary/03-api-documentation.md) | API документация |
| [04-frontend-components.md](summary/04-frontend-components.md) | Компоненты |
| [05-business-logic.md](summary/05-business-logic.md) | Бизнес-логика |

### Руководства:
| Документ | Описание |
|----------|----------|
| [USER_MANUAL.md](manuals/USER_MANUAL.md) | Полное руководство |
| [QUICK_START_USER.md](manuals/QUICK_START_USER.md) | Быстрый старт |

### Специализированная:
| Документ | Описание |
|----------|----------|
| [BRIGADIER_FUNCTIONALITY_IMPLEMENTATION.md](../BRIGADIER_FUNCTIONALITY_IMPLEMENTATION.md) | Функциональность бригадира |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Статус проекта |

---

## 📊 Статус проекта

| Метрика | Значение |
|---------|----------|
| Готовность | **99%** |
| ESLint errors | **0** ✅ |
| TypeScript errors | **0** ✅ |
| Покрытие тестами | **~55%** |
| Тестовые файлы | **30** |

### Ключевые компоненты:
- ✅ Компоненты - стабильно
- ✅ Stores - стабильно
- ✅ API Client - стабильно
- ✅ Формы - рефакторинг завершен
- ✅ Роутинг - стабильно

---

## 🆕 Последние обновления (декабрь 2025)

### Новая система ролей (декабрь 2025):
- ✅ 5 ролей: admin, manager, brigadier, warehouse, requester
- ✅ Роли manager и warehouse работают "без учета изменений"
- ✅ Новая роль requester для просмотра и подачи заявок
- ✅ Система заявок на материалы (MaterialRequest)
- ✅ Операции без учета: не создают записи в StockSnapshot

### Оптимизация ролей (ноябрь 2025):
- ✅ Упрощение до 4 ролей: admin, director, coordinator, brigadier
- ✅ Удалены buyer и site_manager (конвертированы в brigadier)
- ✅ Суперпользователи скрыты из списка сотрудников

### Бизнес-логика (27 ноября):
- ✅ Защита от деактивированных объектов
- ✅ Безопасное удаление объектов (деактивация)
- ✅ Статусы закупок (только completed учитывается)

### Функциональность бригадира (26-27 ноября):
- ✅ Управление объектами для бригадиров
- ✅ Автоназначение ответственного
- ✅ Форма списания с улучшениями

### Рефакторинг:
- ✅ PurchaseForm.onSaved() - разбит на 5 функций
- ✅ useItemsForm composable - устранено дублирование
- ✅ GenericSearchSelect - универсальный компонент
- ✅ Система валидаторов - 9 валидаторов

### Качество кода:
- ESLint errors: 39 → 0
- Дублирование: -92%
- Покрытие тестами: 30% → ~55%

---

## 🔗 Связанные ресурсы

- [Backend](../../elom-backend) - Django REST API
- [API Schema](api_schema.yaml) - OpenAPI спецификация
- [Backend Documentation](../../elom-backend/PURCHASE_STATUS_BUSINESS_LOGIC.md) - Бизнес-логика закупок

---

*Документация актуальна на: 27 ноября 2025*
