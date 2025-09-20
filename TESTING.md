# Руководство по тестированию ELOM Frontend

## Обзор

Проект использует несколько уровней тестирования:

1. **Unit тесты** - тестирование отдельных компонентов и функций
2. **Integration тесты** - тестирование взаимодействия между модулями
3. **E2E тесты** - тестирование полных пользовательских сценариев

## Технологии

- **Vitest** - основной фреймворк для unit и integration тестов
- **Vue Test Utils** - утилиты для тестирования Vue компонентов
- **Playwright** - E2E тестирование
- **Testing Library** - дополнительные утилиты для тестирования

## Структура тестов

```
src/
├── test/
│   ├── setup.ts              # Настройка тестовой среды
│   ├── utils.ts              # Утилиты для тестирования
│   └── basic.test.ts         # Базовые тесты
├── components/
│   └── __tests__/            # Тесты компонентов
├── stores/
│   └── __tests__/            # Тесты stores
├── composables/
│   └── __tests__/            # Тесты composables
└── api/
    └── __tests__/            # Тесты API
e2e/                          # E2E тесты
├── auth.spec.ts
└── materials.spec.ts
```

## Команды для запуска тестов

### Unit и Integration тесты

```bash
# Запуск всех тестов
npm run test

# Запуск тестов в watch режиме
npm run test:watch

# Запуск тестов один раз
npm run test:run

# Запуск тестов с покрытием
npm run test:coverage

# Запуск тестов с UI
npm run test:ui
```

### E2E тесты

```bash
# Запуск E2E тестов
npm run test:e2e

# Запуск E2E тестов с UI
npm run test:e2e:ui

# Запуск E2E тестов в headed режиме
npm run test:e2e:headed
```

### Все тесты

```bash
# Запуск всех тестов (unit + E2E)
npm run test:all
```

## Написание тестов

### Unit тесты для компонентов

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '../MyComponent.vue'

describe('MyComponent', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyComponent, {
      props: { title: 'Test Title' }
    })
    
    expect(wrapper.text()).toContain('Test Title')
  })
})
```

### Unit тесты для stores

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMyStore } from '../myStore'

describe('MyStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with correct state', () => {
    const store = useMyStore()
    expect(store.items).toEqual([])
  })
})
```

### E2E тесты

```typescript
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[data-testid="username"]', 'testuser')
  await page.fill('[data-testid="password"]', 'password')
  await page.click('[data-testid="login-button"]')
  
  await expect(page).toHaveURL('/dashboard')
})
```

## Моки и утилиты

### Моки API

```typescript
// В setup.ts уже настроены базовые моки
vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}))
```

### Утилиты для тестирования

```typescript
import { mountWithSetup, mockApiResponses } from '@/test/utils'

// Использование утилит
const wrapper = mountWithSetup(MyComponent)
const mockData = mockApiResponses.materials.list
```

## Покрытие кода

Для просмотра покрытия кода:

```bash
npm run test:coverage
```

Отчет будет доступен в папке `coverage/`.

## Лучшие практики

### 1. Именование тестов
- Используйте описательные имена
- Группируйте связанные тесты в `describe` блоки
- Используйте паттерн "should ... when ..."

### 2. Структура тестов
```typescript
describe('ComponentName', () => {
  describe('when prop is provided', () => {
    it('should render correctly', () => {
      // тест
    })
  })
  
  describe('when prop is not provided', () => {
    it('should show default value', () => {
      // тест
    })
  })
})
```

### 3. Моки
- Мокайте внешние зависимости
- Используйте реалистичные данные
- Очищайте моки между тестами

### 4. Асинхронные тесты
```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction()
  expect(result).toBeDefined()
})
```

### 5. E2E тесты
- Тестируйте критичные пользовательские сценарии
- Используйте data-testid для селекторов
- Мокайте API ответы для стабильности

## Отладка тестов

### Unit тесты
```bash
# Запуск конкретного теста
npm run test:run -- --reporter=verbose src/components/__tests__/MyComponent.test.ts

# Запуск тестов с отладкой
npm run test:run -- --inspect-brk
```

### E2E тесты
```bash
# Запуск в debug режиме
npm run test:e2e -- --debug

# Запуск конкретного теста
npm run test:e2e -- auth.spec.ts
```

## CI/CD

Тесты автоматически запускаются в CI/CD pipeline:

```yaml
# Пример GitHub Actions
- name: Run tests
  run: |
    npm run test:run
    npm run test:e2e
```

## Полезные ресурсы

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)

## Troubleshooting

### Частые проблемы

1. **Тесты не находят модули**
   - Проверьте алиасы в `vitest.config.ts`
   - Убедитесь, что моки настроены правильно

2. **E2E тесты падают**
   - Проверьте, что dev сервер запущен
   - Убедитесь, что API моки работают

3. **Медленные тесты**
   - Используйте `vi.hoisted()` для тяжелых операций
   - Оптимизируйте моки

### Получение помощи

Если у вас возникли проблемы с тестами:

1. Проверьте логи тестов
2. Запустите тесты в verbose режиме
3. Используйте отладку
4. Обратитесь к документации
