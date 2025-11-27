# 📚 Документация ELOM Frontend

**Дата обновления:** 27 ноября 2025

---

## 🗂️ Структура документации

### 📖 Основные документы
| Файл | Описание |
|------|----------|
| [INDEX.md](INDEX.md) | Главная страница документации |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Текущий статус проекта |
| [API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md) | Быстрый справочник API |
| [api_schema.yaml](api_schema.yaml) | OpenAPI спецификация |
| [BRIGADIER_FUNCTIONALITY_IMPLEMENTATION.md](../BRIGADIER_FUNCTIONALITY_IMPLEMENTATION.md) | Функциональность бригадира |

### 🗺️ Навигация и структура
| Файл | Описание |
|------|----------|
| [APP_MAP_USER.md](APP_MAP_USER.md) | Карта приложения |
| [NAVIGATION_GUIDE.md](NAVIGATION_GUIDE.md) | Руководство по навигации |
| [FORM_STRUCTURE_GUIDE.md](FORM_STRUCTURE_GUIDE.md) | Структура форм |

### 🔌 Интеграции
| Файл | Описание |
|------|----------|
| [TELEGRAM_INTEGRATION_STATUS.md](TELEGRAM_INTEGRATION_STATUS.md) | Статус Telegram |
| [TELEGRAM_NOTIFICATIONS_REQUIREMENTS.md](TELEGRAM_NOTIFICATIONS_REQUIREMENTS.md) | Требования к уведомлениям |
| [WRITEOFF_SYSTEM_IMPLEMENTATION.md](WRITEOFF_SYSTEM_IMPLEMENTATION.md) | Система списаний |

---

## 📁 docs/manuals/ — Руководства пользователя

| Файл | Описание |
|------|----------|
| [USER_MANUAL.md](manuals/USER_MANUAL.md) | Полное руководство пользователя |
| [QUICK_START_USER.md](manuals/QUICK_START_USER.md) | Быстрый старт |
| [USER_GUIDE_FORMS.md](manuals/USER_GUIDE_FORMS.md) | Работа с формами |
| [USER_GUIDE_LISTS.md](manuals/USER_GUIDE_LISTS.md) | Работа со списками |

---

## 📁 docs/summary/ — Техническая документация

### Архитектура и данные
| Файл | Описание |
|------|----------|
| [01-architecture.md](summary/01-architecture.md) | Архитектура системы |
| [02-data-models.md](summary/02-data-models.md) | Модели данных |
| [03-api-documentation.md](summary/03-api-documentation.md) | API документация |
| [04-frontend-components.md](summary/04-frontend-components.md) | Компоненты |
| [05-business-logic.md](summary/05-business-logic.md) | Бизнес-логика |

### Интеграции и развертывание
| Файл | Описание |
|------|----------|
| [06-integrations.md](summary/06-integrations.md) | Интеграции |
| [07-deployment.md](summary/07-deployment.md) | Развертывание |
| [08-testing.md](summary/08-testing.md) | Тестирование |
| [09-security.md](summary/09-security.md) | Безопасность |
| [10-performance.md](summary/10-performance.md) | Производительность |

### Специализированные
| Файл | Описание |
|------|----------|
| [11-types-refactoring.md](summary/11-types-refactoring.md) | Рефакторинг типов |
| [12-writeoff-system.md](summary/12-writeoff-system.md) | Система списаний |
| [13-components-reference.md](summary/13-components-reference.md) | Справочник компонентов |
| [14-api-endpoints-reference.md](summary/14-api-endpoints-reference.md) | Справочник API |
| [15-current-state.md](summary/15-current-state.md) | Текущее состояние |

---

## 📁 Корень проекта — Отчеты о рефакторинге

| Файл | Описание |
|------|----------|
| [FRONTEND_AUDIT_REPORT.md](../FRONTEND_AUDIT_REPORT.md) | Аудит кода (ноябрь 2025) |
| [REFACTORING_FINAL_REPORT.md](../REFACTORING_FINAL_REPORT.md) | Финальный отчет о рефакторинге |
| [REFACTORING_RECOMMENDATIONS.md](../REFACTORING_RECOMMENDATIONS.md) | Рекомендации по рефакторингу |
| [BRIGADIER_FUNCTIONALITY_IMPLEMENTATION.md](../BRIGADIER_FUNCTIONALITY_IMPLEMENTATION.md) | Реализация функциональности бригадира |

---

## 📁 Backend документация

| Файл | Описание |
|------|----------|
| [PURCHASE_STATUS_BUSINESS_LOGIC.md](../../elom-backend/PURCHASE_STATUS_BUSINESS_LOGIC.md) | Бизнес-логика статусов закупок |

---

## 📊 Статистика

| Категория | Количество |
|-----------|------------|
| Всего документов | **36** |
| Основные (docs/) | 11 |
| Руководства (manuals/) | 4 |
| Техническая (summary/) | 16 |
| Рефакторинг (корень) | 5 |

---

## 🎯 Быстрая навигация

### Для новых разработчиков:
1. [INDEX.md](INDEX.md) → Обзор проекта
2. [summary/01-architecture.md](summary/01-architecture.md) → Архитектура
3. [summary/04-frontend-components.md](summary/04-frontend-components.md) → Компоненты

### Для пользователей:
1. [manuals/QUICK_START_USER.md](manuals/QUICK_START_USER.md) → Быстрый старт
2. [manuals/USER_MANUAL.md](manuals/USER_MANUAL.md) → Полное руководство

### Для code review:
1. [FRONTEND_AUDIT_REPORT.md](../FRONTEND_AUDIT_REPORT.md) → Аудит кода
2. [REFACTORING_FINAL_REPORT.md](../REFACTORING_FINAL_REPORT.md) → Рефакторинг

---

## 🆕 Последние изменения (27 ноября 2025)

### Новая функциональность:
- **Деактивация объектов** - безопасное удаление объектов со связями
- **Защита от деактивированных объектов** - нельзя создавать закупки/списания
- **Бизнес-логика статусов** - только `completed` закупки учитываются в остатках
- **Функциональность бригадира** - полная реализация для роли brigadier

### Обновленная документация:
- `PROJECT_STATUS.md` - актуальный статус проекта
- `05-business-logic.md` - бизнес-логика с новыми разделами
- `BRIGADIER_FUNCTIONALITY_IMPLEMENTATION.md` - документация бригадира
- `PURCHASE_STATUS_BUSINESS_LOGIC.md` (backend) - статусы закупок

---

*Документация актуальна на: 27 ноября 2025*
