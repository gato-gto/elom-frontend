# 🏠 ELOM Frontend - Документация

**Система управления складом и закупками**  
**Версия:** 3.7 | **Дата:** Январь 2026

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
| [BACKEND_COMPLIANCE_REPORT.md](BACKEND_COMPLIANCE_REPORT.md) | Отчет о соответствии Backend API требованиям |

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

## 🆕 Последние обновления (Январь 2026)

### 🔐 Универсальная система управления UI на основе прав доступа (Январь 2026):
- ✅ **PermissionButton** - кнопки с автоматической проверкой прав
- ✅ **PermissionSection** - секции UI с проверкой доступа
- ✅ **PermissionFilter** - фильтры с условным отображением
- ✅ **PermissionGuard** (улучшен) - условный рендеринг с поддержкой сложных условий
- ✅ **permissionActions** утилиты - создание конфигураций действий для списков
- ✅ Полная документация: [PERMISSION_COMPONENTS.md](../src/docs/PERMISSION_COMPONENTS.md)

### 🛠️ Улучшенная обработка ошибок (Январь 2026):
- ✅ Детальные сообщения об ошибках вместо общих "Validation error"
- ✅ Автоматическое извлечение конкретных сообщений из структуры ошибок
- ✅ Поддержка вложенных ошибок валидации (items[0].material)
- ✅ Улучшенная обработка ошибок в stores и компонентах

### 🔐 RBAC система (декабрь 2025 - январь 2026):
- ✅ Полная интеграция RBAC в backend и frontend
- ✅ 5 ролей: admin, manager, brigadier, warehouse, requester
- ✅ 80+ разрешений, управление через permissions вместо ролей
- ✅ Роли manager и warehouse работают "без учета изменений"
- ✅ Новая роль requester для просмотра и подачи заявок
- ✅ Система заявок на материалы (MaterialRequest)
- ✅ Подробнее: [Backend RBAC_FINAL.md](../../elom-backend/RBAC_FINAL.md)

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

## 📋 Отчеты о соответствии

| Документ | Описание | Статус |
|----------|----------|--------|
| [BACKEND_COMPLIANCE_REPORT.md](BACKEND_COMPLIANCE_REPORT.md) | Проверка соответствия Backend API требованиям документации | ✅ 95% соответствие |

**Результаты проверки:**
- ✅ RBAC система: 100% соответствие
- ✅ Object-Scope ограничения: 100% соответствие
- ✅ Операции "без учета": 100% соответствие
- ✅ API Endpoints: 100% соответствие
- ✅ Обработка ошибок: 100% соответствие
- ⚠️ Legacy код: 90% (legacy поле `role` для обратной совместимости)

---

*Документация актуальна на: Январь 2026*
