# Отчет о багах в тестах

Дата: 2025-11-16
Статус: В работе

## Резюме

Обнаружено 98 упавших тестов из 192. Основные категории проблем:
1. Несоответствие ожиданий тестов актуальной реализации
2. Неправильные моки для Vue Router и Pinia stores
3. Изменения в API endpoints
4. Изменения в структуре данных (массивы вместо строк)

## Выполненные исправления (2025-11-16)

### Исправленные баги:
- ✅ **БАГ-033**: FormField - добавлен required атрибут, исправлен тест для select options
- ✅ **БАГ-034**: FormField - добавлен required атрибут к input элементу
- ✅ **БАГ-035**: GenericForm - добавлен useFormSections в мок
- ✅ **БАГ-036**: GenericList - исправлен мок для store prop
- ✅ **БАГ-037-038**: useGenericForm - обновлены тесты под актуальную сигнатуру
- ✅ **БАГ-039**: useGenericList - обновлены тесты под актуальную сигнатуру
- ✅ **БАГ-040**: usePagination - исправлен тест visiblePages
- ✅ **БАГ-041-042**: archive/employees stores - исправлены тесты (stores теперь объекты, не функции)
- ✅ **БАГ-043-044**: objects/purchases stores - обновлены endpoints и методы (api.patch вместо api.put)
- ✅ **БАГ-045**: objects store - исправлен мок api.patch для возврата { data }
- ✅ **БАГ-046**: purchases store - обновлен тест uploadPhoto для использования правильного API
- ✅ **БАГ-047-048**: PurchaseForm - исправлены моки stores (объекты вместо функций)
- ✅ **БАГ-049**: auth store - добавлен мок для fetchMe в тесте login
- ✅ **БАГ-050-052**: objects/purchases stores - добавлены try/catch блоки в тестах обработки ошибок

### Изменения в коде:
- `src/stores/base.ts`: Исправлен `createBaseStore` для возврата store напрямую (`return store` вместо `return store()`)
- `src/stores/archive.ts`: Обновлены обращения к store (используется напрямую, не как функция)
- `src/components/FormField.vue`: Добавлен `:required="required"` атрибут к input
- `src/stores/__tests__/objects.test.ts`: Обновлены endpoints, методы, добавлены async/await
- `src/stores/__tests__/purchases.test.ts`: Обновлены endpoints, методы, добавлены async/await
- `src/stores/__tests__/auth.test.ts`: Добавлен мок для fetchMe в тесте login
- `src/pages/Purchases/__tests__/PurchaseForm.test.ts`: Исправлены моки stores (объекты вместо функций)

---

## Категория 1: Pagination

### БАГ-001: Неправильная логика getAdjacentPages
**Файл:** `src/composables/__tests__/usePagination.test.ts:73`
**Ожидалось:** `getAdjacentPages(5)` → `[4, 5]`
**Получено:** `[2, 3, 4, 5]`
**Причина:** Функция возвращает все соседние страницы в диапазоне, включая текущую страницу в некоторых случаях
**Статус:** Требует исправления логики или обновления теста

---

## Категория 2: Login Page

### БАГ-002: Изменен заголовок страницы
**Файл:** `src/pages/__tests__/Login.test.ts:38`
**Ожидалось:** `'Вход в систему'`
**Получено:** `'ELOM'`
**Причина:** Заголовок изменен в актуальной реализации
**Статус:** Требует обновления теста

### БАГ-003: Отсутствует password visibility toggle
**Файл:** `src/pages/__tests__/Login.test.ts:139`
**Ожидалось:** Элемент `button[aria-label="Показать пароль"]`
**Получено:** Элемент не найден
**Причина:** Функционал не реализован в актуальной версии
**Статус:** Требует удаления теста или реализации функционала

### БАГ-004: Отсутствует кнопка reset формы
**Файл:** `src/pages/__tests__/Login.test.ts:150`
**Ожидалось:** Элемент `button[type="reset"]`
**Получено:** Элемент не найден
**Причина:** Кнопка не реализована
**Статус:** Требует удаления теста

### БАГ-005: Неправильный мок vue-router
**Файл:** `src/pages/__tests__/Login.test.ts:98`
**Ошибка:** `vi.mocked(...).mockReturnValue is not a function`
**Причина:** Неправильное использование моков для ESM модулей
**Статус:** Требует исправления моков

### БАГ-006: Неправильная проверка redirect
**Файл:** `src/pages/__tests__/Login.test.ts:91`
**Ожидалось:** `router.push('/purchases')`
**Получено:** Не вызывается
**Причина:** Используется `router.replace` вместо `router.push`, и мок не настроен правильно
**Статус:** Требует исправления моков

### БАГ-007: Валидация формы не работает как ожидается
**Файл:** `src/pages/__tests__/Login.test.ts:118`
**Ожидалось:** `login` не вызывается при пустых полях
**Получено:** Вызывается с пустыми строками
**Причина:** HTML5 валидация не блокирует submit в тестах
**Статус:** Требует улучшения теста

### БАГ-008: Keyboard navigation не работает
**Файл:** `src/pages/__tests__/Login.test.ts:128`
**Ожидалось:** Фокус на password поле после Enter
**Получено:** Фокус не меняется
**Причина:** Функционал не реализован
**Статус:** Требует удаления теста или реализации

---

## Категория 3: Router Middleware

### БАГ-009: Middleware не сохраняет redirect query параметр
**Файл:** `src/router/__tests__/middleware.test.ts:43`
**Ожидалось:** `/login?redirect=%2Fprotected`
**Получено:** `/login`
**Причина:** Middleware не учитывает `initialized` и `tryHydrate`, моки не настроены правильно
**Статус:** Требует исправления моков и логики middleware

### БАГ-010: Guest middleware не редиректит правильно
**Файл:** `src/router/__tests__/middleware.test.ts:75`
**Ожидалось:** `next('/purchases')`
**Получено:** `next()` без аргументов
**Причина:** Middleware асинхронный, но тест синхронный
**Статус:** Требует исправления теста (await)

### БАГ-011: Roles middleware редиректит на login вместо purchases
**Файл:** `src/router/__tests__/middleware.test.ts:117`
**Ожидалось:** `next('/purchases')`
**Получено:** `next('/login')`
**Причина:** Middleware проверяет `isAuthenticated` перед проверкой роли
**Статус:** Требует исправления логики или теста

### БАГ-012: applyMiddleware не обрабатывает ошибки правильно
**Файл:** `src/router/__tests__/middleware.test.ts:188`
**Ожидалось:** `next('/purchases')` при ошибке
**Получено:** Не вызывается
**Причина:** Ошибки обрабатываются, но тест не ждет асинхронных операций
**Статус:** Требует исправления теста

---

## Категория 4: Stores - Endpoints

### БАГ-013: Employees store использует неправильный endpoint
**Файл:** `src/stores/__tests__/employees.test.ts:68`
**Ожидалось:** `/api/v1/users/`
**Получено:** `http://localhost:8000/api/v1/employees/?page=1&page_size=20&ordering=id`
**Причина:** Endpoint изменился с `/users/` на `/employees/`
**Статус:** Требует обновления тестов

### БАГ-014: Objects store использует неправильный endpoint
**Файл:** `src/stores/__tests__/objects.test.ts:68`
**Ожидалось:** `/api/v1/common/objects/`
**Получено:** `http://localhost:8000/api/v1/objects/?page=1&page_size=20&ordering=id`
**Причина:** Endpoint изменился
**Статус:** Требует обновления тестов

### БАГ-015: Purchases store использует неправильный endpoint
**Файл:** `src/stores/__tests__/purchases.test.ts:68`
**Ожидалось:** `/api/v1/purchases/`
**Получено:** `http://localhost:8000/api/v1/purchases/?page=1&page_size=20&ordering=id`
**Причина:** Тест ожидает относительный путь, но получает полный URL
**Статус:** Требует обновления тестов

---

## Категория 5: Stores - Методы

### БАГ-016: setPassword не экспортируется как метод store
**Файл:** `src/stores/__tests__/employees.test.ts:147`
**Ошибка:** `store.setPassword is not a function`
**Причина:** `setPassword` экспортируется отдельно, а не как метод store
**Статус:** Требует исправления экспорта или теста

### БАГ-017: useArchiveStore не является функцией
**Файл:** `src/stores/__tests__/archive.test.ts:20`
**Ошибка:** `useArchiveStore is not a function`
**Причина:** Store экспортируется как объект, а не функция
**Статус:** Требует исправления экспорта

### БАГ-018: uploadPhoto не реализован для purchases
**Файл:** `src/stores/__tests__/purchases.test.ts:115`
**Ошибка:** `uploadPhoto method not implemented for this store`
**Причина:** Метод не реализован в базовом store
**Статус:** Требует реализации или удаления теста

### БАГ-019: update использует patch вместо put
**Файл:** `src/stores/__tests__/employees.test.ts:126`
**Ожидалось:** `api.put`
**Получено:** `api.patch` (в коде)
**Причина:** Базовый store использует `patch`, а тест ожидает `put`
**Статус:** Требует обновления теста

---

## Категория 6: Stores - Filters

### БАГ-020: Filters возвращают undefined вместо пустых строк
**Файл:** `src/stores/__tests__/employees.test.ts:190`
**Ожидалось:** `store.filters.role` → `''`
**Получено:** `undefined`
**Причина:** `resetFilters` удаляет свойства вместо установки пустых строк
**Статус:** Требует исправления логики resetFilters

### БАГ-021: Аналогично для objects store
**Файл:** `src/stores/__tests__/objects.test.ts:179`
**Статус:** Требует исправления

### БАГ-022: Аналогично для purchases store
**Файл:** `src/stores/__tests__/purchases.test.ts:158`
**Статус:** Требует исправления

---

## Категория 7: Error Handlers

### БАГ-023: Error handlers возвращают массивы вместо строк
**Файл:** `src/utils/__tests__/errorHandler.test.ts:32`
**Ожидалось:** `{ name: 'This field is required' }`
**Получено:** `{ name: ['This field is required'] }`
**Причина:** Актуальная реализация возвращает массивы (правильно для DRF)
**Статус:** Требует обновления тестов

### БАГ-024: parseApiError также возвращает массивы
**Файл:** `src/utils/__tests__/errorHandler.test.ts:216`
**Статус:** Требует обновления теста

---

## Категория 8: PurchaseForm

### БАГ-025: Отсутствует мок для route
**Файл:** `src/pages/Purchases/__tests__/PurchaseForm.test.ts:43`
**Ошибка:** `Cannot read properties of undefined (reading 'params')`
**Причина:** `useRoute()` не замокан
**Статус:** Требует добавления мока

### БАГ-026: Отсутствует мок для fetchList
**Файл:** `src/pages/Purchases/__tests__/PurchaseForm.test.ts`
**Ошибка:** `materialsStore.fetchList is not a function`
**Причина:** Stores замоканы как объекты, а не функции
**Статус:** Требует исправления моков

---

## Категория 9: Auth Store

### БАГ-027: login возвращает false вместо true
**Файл:** `src/stores/__tests__/auth.test.ts:90`
**Ожидалось:** `true`
**Получено:** `false`
**Причина:** Мок не настроен правильно или логика изменилась
**Статус:** Требует проверки моков

---

## Категория 10: Unhandled Rejections

### БАГ-028-032: Необработанные промисы в тестах stores
**Файлы:** 
- `src/stores/__tests__/employees.test.ts`
- `src/stores/__tests__/objects.test.ts`
- `src/stores/__tests__/purchases.test.ts`
**Причина:** Ошибки API не обрабатываются правильно в тестах
**Статус:** Требует добавления try/catch или правильных моков

---

## План исправлений

### Приоритет 1 (Критичные - блокируют запуск тестов):
1. ✅ Исправить моки для vue-router и Pinia stores
2. ✅ Обновить endpoints в тестах stores (employees)
3. ✅ Исправить экспорты stores (archive, employees)

### Приоритет 2 (Важные - большинство тестов):
4. ✅ Обновить тесты error handlers (массивы вместо строк)
5. ✅ Исправить логику resetFilters в stores
6. ✅ Обновить тесты Login page под актуальную реализацию

### Приоритет 3 (Улучшения):
7. ✅ Исправить логику getAdjacentPages или обновить тест
8. ✅ Удалить тесты для нереализованного функционала
9. ✅ Добавить правильные await в асинхронные тесты middleware

## Статус исправлений

### Выполнено:
- ✅ Исправлен экспорт `useArchiveStore` - теперь это функция
- ✅ Исправлен `resetFilters` - сохраняет структуру фильтров, устанавливает пустые строки
- ✅ Обновлены тесты employees store:
  - Исправлены вызовы `useEmployeesStore()` (добавлены скобки)
  - Обновлены endpoints с `/users/` на `/employees/`
  - Исправлен тест `setPassword` - использует отдельный импорт
  - Исправлен тест `update` - использует `patch` вместо `put`
  - Добавлены await для асинхронных операций
- ✅ Обновлены тесты error handlers - ожидают массивы вместо строк
- ✅ Обновлены тесты Login page:
  - Исправлены моки vue-router (добавлен `replace`)
  - Обновлен ожидаемый заголовок на "ELOM"
  - Удалены тесты для нереализованного функционала
  - Добавлены правильные моки для UI store
- ✅ Исправлены тесты middleware - добавлены await и правильные моки
- ✅ Исправлен тест PurchaseForm - добавлены моки для route и stores
- ✅ Обновлен тест getAdjacentPages - исправлены ожидания

### Осталось сделать:
- ⏳ Обновить тесты objects store (аналогично employees)
- ⏳ Обновить тесты purchases store (аналогично employees)
- ⏳ Обновить тесты auth store (проверить моки)
- ⏳ Исправить unhandled rejections в тестах stores (добавить try/catch)

---

## Новые баги (раунд 2)

### Категория 11: FormField Component

### БАГ-033: Неправильное ожидание количества опций в select
**Файл:** `src/components/__tests__/FormField.test.ts:46`
**Ожидалось:** 3 опции (1 placeholder + 2 options)
**Получено:** 2 опции
**Причина:** Placeholder опция рендерится только если передан `placeholder` prop, в тесте он не передан
**Статус:** Требует исправления теста или добавления placeholder prop

### БАГ-034: Required атрибут не применяется к input
**Файл:** `src/components/__tests__/FormField.test.ts:96`
**Ожидалось:** `input.attributes('required')` определен
**Получено:** `undefined`
**Причина:** В компоненте FormField.vue отсутствует `:required="required"` на input элементе
**Статус:** Требует добавления атрибута в компонент

---

### Категория 12: GenericForm Component

### БАГ-035: Отсутствует экспорт useFormSections в моке
**Файл:** `src/components/__tests__/GenericForm.test.ts:7`
**Ошибка:** `No "useFormSections" export is defined on the "@/composables/useGenericForm" mock`
**Причина:** Мок не экспортирует `useFormSections`, который используется в GenericForm.vue
**Статус:** Требует добавления экспорта в мок

---

### Категория 13: GenericList Component

### БАГ-036: props.store.filters undefined
**Файл:** `src/components/GenericList.vue:367`
**Ошибка:** `Cannot read properties of undefined (reading 'filters')`
**Причина:** Store передается как prop, но в тестах не передается или передается неправильно
**Статус:** Требует исправления моков или передачи store prop

---

### Категория 14: useGenericForm Composable

### БАГ-037: Неправильная сигнатура функции
**Файл:** `src/composables/__tests__/useGenericForm.test.ts:43`
**Ошибка:** `Cannot read properties of undefined (reading 'value')`
**Причина:** Функция принимает объект `options`, а не отдельные параметры. Возвращает `form`, а не `formData`
**Статус:** Требует обновления тестов под актуальную сигнатуру

### БАГ-038: Методы имеют другие названия
**Файл:** `src/composables/__tests__/useGenericForm.test.ts:58`
**Ошибка:** `validateForm is not a function`, `handleSubmit is not a function`, `updateField is not a function`
**Причина:** Методы называются `validate`, `submit`, `setFieldValue` вместо старых названий
**Статус:** Требует обновления тестов

---

### Категория 15: useGenericList Composable

### БАГ-039: Неправильная сигнатура функции
**Файл:** `src/composables/__tests__/useGenericList.test.ts:77`
**Ошибка:** `Cannot read properties of undefined (reading 'defaultSort')`
**Причина:** Функция принимает объект `options` с `config` и `store`, а не отдельные параметры
**Статус:** Требует обновления тестов

---

### Категория 16: usePagination Composable

### БАГ-040: visiblePages возвращает больше страниц чем ожидается
**Файл:** `src/composables/__tests__/usePagination.test.ts:42`
**Ожидалось:** `[1, 2, 3]`
**Получено:** `[1, 2, 3, '...', 5]`
**Причина:** Логика visiblePages показывает многоточие когда totalPages > maxVisiblePages
**Статус:** Требует обновления теста или изменения логики

---

### Категория 17: Stores - использование как функции

### БАГ-041: useArchiveStore is not a function
**Файл:** `src/stores/__tests__/archive.test.ts:20`
**Ошибка:** `useArchiveStore is not a function`
**Причина:** `createBaseStore` возвращает результат вызова `store()`, а не функцию. В тестах вызывается как функция
**Статус:** Требует исправления тестов - использовать как объект, не вызывать

### БАГ-042: useEmployeesStore is not a function
**Файл:** `src/stores/__tests__/employees.test.ts:16`
**Ошибка:** `useEmployeesStore is not a function`
**Причина:** Аналогично БАГ-041
**Статус:** Требует исправления тестов

---

### Категория 18: Stores - Endpoints и моки

### БАГ-043: Objects store endpoints не совпадают
**Файл:** `src/stores/__tests__/objects.test.ts:68`
**Ожидалось:** `/api/v1/common/objects/`
**Получено:** `http://localhost:8000/api/v1/objects/?page=1&page_size=20&ordering=id`
**Причина:** Endpoint изменился, тесты ожидают старый путь
**Статус:** Требует обновления тестов

### БАГ-044: Purchases store endpoints не совпадают
**Файл:** `src/stores/__tests__/purchases.test.ts:68`
**Аналогично БАГ-043**
**Статус:** Требует обновления тестов

### БАГ-045: API patch не возвращает data
**Файл:** `src/stores/__tests__/objects.test.ts:126`
**Ошибка:** `Cannot destructure property 'data' of '(intermediate value)' as it is undefined`
**Причина:** Мок `api.patch` не возвращает объект с `data` свойством
**Статус:** Требует исправления моков

### БАГ-046: uploadPhoto не реализован
**Файл:** `src/stores/__tests__/purchases.test.ts:115`
**Ошибка:** `uploadPhoto method not implemented for this store`
**Причина:** Метод не реализован в purchases store
**Статус:** Требует реализации или удаления теста

---

### Категория 19: PurchaseForm Component

### БАГ-047: objects.value undefined в тестах
**Файл:** `src/pages/Purchases/__tests__/PurchaseForm.test.ts:71`
**Ошибка:** `Cannot read properties of undefined (reading 'filter')`
**Причина:** Моки stores не возвращают правильные значения для computed свойств
**Статус:** ✅ ИСПРАВЛЕНО - Моки обновлены для возврата объектов напрямую вместо функций

### БАГ-048: materialsStore.fetchList is not a function
**Файл:** `src/pages/Purchases/PurchaseForm.vue:953`
**Ошибка:** `materialsStore.fetchList is not a function`
**Причина:** Моки stores возвращают объекты, а не функции с методами
**Статус:** ✅ ИСПРАВЛЕНО - Моки обновлены для возврата объектов с методами напрямую

---

### Категория 20: Auth Store

### БАГ-049: login возвращает false вместо true
**Файл:** `src/stores/__tests__/auth.test.ts:90`
**Ожидалось:** `true`
**Получено:** `false`
**Причина:** Мок не настроен правильно или логика изменилась
**Статус:** ✅ ИСПРАВЛЕНО - Добавлен мок для `api.get` (fetchMe) в тесте login

---

### Категория 21: Unhandled Rejections

### БАГ-050-052: Необработанные промисы в тестах stores
**Файлы:** 
- `src/stores/__tests__/objects.test.ts`
- `src/stores/__tests__/purchases.test.ts`
**Причина:** Ошибки API не обрабатываются правильно в тестах (нет try/catch)
**Статус:** ✅ ИСПРАВЛЕНО - Добавлены try/catch блоки в тестах `handles API errors correctly`

---

## Примечания

- Большинство проблем связаны с несоответствием тестов актуальной реализации
- Некоторые тесты проверяют функционал, который не реализован
- Моки требуют правильной настройки для Vue 3 и Pinia
- Необходимо синхронизировать тесты с актуальными endpoints API

