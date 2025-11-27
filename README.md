# 🏢 ELOM Frontend

**Система управления складом и закупками для строительных объектов**

[![Vue.js](https://img.shields.io/badge/Vue.js-3.4-green)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple)](https://vitejs.dev/)

---

## 📋 О проекте

ELOM Frontend - современное веб-приложение для управления:
- 📦 **Складскими запасами** - учет материалов и остатков
- 🛒 **Закупками** - создание закупок с фотоинструкциями
- 🏗️ **Объектами** - управление строительными объектами
- 📊 **Списаниями** - контроль расхода материалов
- 👥 **Сотрудниками** - управление персоналом и ролями

### Роли пользователей:
- **Admin** - Администратор (только Django Admin)
- **Director** - Директор (полный доступ)
- **Coordinator** - Координатор (координация объектов)
- **Brigadier** - Бригадир (работа с назначенными объектами)

---

## 🚀 Быстрый старт

```bash
# Установка зависимостей
npm install

# Запуск development сервера
npm run dev

# Production build
npm run build

# Тесты
npm run test
```

Приложение будет доступно: `http://localhost:5173`

---

## 📚 Документация

| Документ | Описание |
|----------|----------|
| [docs/INDEX.md](docs/INDEX.md) | Главная документация |
| [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md) | Текущий статус проекта |
| [docs/summary/](docs/summary/) | Техническая документация |
| [docs/manuals/](docs/manuals/) | Руководства пользователя |

---

## 🛠️ Технологии

- **Vue 3** + Composition API
- **TypeScript** - типобезопасность
- **Pinia** - управление состоянием
- **Tailwind CSS** + DaisyUI - стилизация
- **Vite** - сборка
- **Vitest** - тестирование

---

## 📦 Структура проекта

```
src/
├── api/           # API клиент и типы (19)
├── components/    # Переиспользуемые компоненты (48)
├── composables/   # Vue composables (13)
├── pages/         # Страницы приложения (32)
├── stores/        # Pinia stores (16)
└── utils/         # Утилиты (10)
```

---

## 📊 Статус проекта

- **Готовность:** 99%
- **ESLint errors:** 0 ✅
- **TypeScript errors:** 0 ✅
- **Покрытие тестами:** ~55%
- **Тестовые файлы:** 30

---

## 🔗 Связанные проекты

- **Backend:** [elom-backend](../elom-backend) - Django REST API

---

*Последнее обновление: 27 ноября 2025*
