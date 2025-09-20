# 🧪 Автоматические тесты - Краткая сводка

## ✅ Статус: ГОТОВО

Полная система автоматического тестирования настроена и работает.

## 🚀 Быстрый старт

```bash
# Unit тесты
npm run test:run

# E2E тесты  
npm run test:e2e

# Все тесты
npm run test:all
```

## 📁 Основные файлы

- `vitest.config.ts` - конфигурация unit тестов
- `playwright.config.ts` - конфигурация E2E тестов
- `src/test/setup.ts` - настройка тестовой среды
- `TESTING.md` - подробное руководство
- `docs/TESTING_SETUP_COMPLETE.md` - полная документация

## 🎯 Что покрыто

- ✅ Компоненты (LoadingSpinner, FormField)
- ✅ Stores (auth, materials)  
- ✅ API client
- ✅ Composables (usePagination)
- ✅ E2E сценарии (аутентификация, материалы)

## 📊 Команды

| Команда | Описание |
|---------|----------|
| `npm run test` | Unit тесты (watch) |
| `npm run test:run` | Unit тесты (один раз) |
| `npm run test:coverage` | С покрытием кода |
| `npm run test:e2e` | E2E тесты |
| `npm run test:all` | Все тесты |

## 📚 Документация

- [TESTING.md](./TESTING.md) - руководство по тестированию
- [docs/TESTING_SETUP_COMPLETE.md](./docs/TESTING_SETUP_COMPLETE.md) - полная документация

---
*Обновлено: 20 января 2025*
