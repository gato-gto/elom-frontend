# 🏗️ ELOM Frontend - Полная документация

## 📋 Содержание
1. [Обзор проекта](#обзор-проекта)
2. [Быстрый старт](#быстрый-старт)
3. [Архитектура](#архитектура)
4. [Разработка](#разработка)
5. [Тестирование](#тестирование)
6. [API интеграция](#api-интеграция)
7. [Компоненты](#компоненты)
8. [Стилизация](#стилизация)
9. [Деплой](#деплой)

---

## 🎯 Обзор проекта

ELOM - современное веб-приложение для управления материалами, объектами, сотрудниками и закупками в строительных проектах.

### ✨ Особенности
- 🎨 **Современный UI/UX** с поддержкой темной темы
- ⚡ **Высокая производительность** с оптимизированной реактивностью
- 📱 **Адаптивный дизайн** для всех устройств
- 🔍 **Умные фильтры** с автоматическим поиском
- 📊 **Подробная отчетность** по всем аспектам проекта
- 🔐 **Безопасность** с ролевой системой доступа

### 📋 Основные функции

#### 📦 Управление материалами
- Каталог материалов с фотографиями
- Категоризация и единицы измерения
- Поиск и фильтрация
- Импорт/экспорт данных

#### 🏢 Управление объектами
- Создание и редактирование объектов
- Отслеживание статусов проектов
- Назначение ответственных лиц
- Планирование сроков

#### 👥 Управление сотрудниками
- Регистрация пользователей
- Ролевая система доступа
- Профили сотрудников
- Связь с объектами

#### 📊 Закупки и отчетность
- Ведение закупок
- Связь с материалами и объектами
- Детальная отчетность
- Экспорт в различные форматы

---

## 🚀 Быстрый старт

### Предварительные требования
- Node.js 18+ 
- npm или yarn
- Backend API (см. [elom-backend](https://github.com/your-org/elom-backend))

### Установка
```bash
# Клонирование репозитория
git clone https://github.com/your-org/elom-frontend.git
cd elom-frontend

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env файл с вашими настройками

# Запуск dev сервера
npm run dev
```

Приложение будет доступно по адресу: http://localhost:5173

### Доступные команды
```bash
# Разработка
npm run dev          # Запуск dev сервера
npm run build        # Сборка для продакшена
npm run preview      # Предварительный просмотр сборки

# Качество кода
npm run lint         # Проверка линтером
npm run lint:fix     # Автоисправление
npm run type-check   # Проверка типов TypeScript

# Тестирование
npm run test         # Запуск тестов
npm run test:ui      # UI для тестов
```

---

## 🏗️ Архитектура

### Технологический стек
- **Vue 3** + Composition API
- **TypeScript** для типизации
- **Pinia** для управления состоянием
- **Vue Router** для маршрутизации
- **Tailwind CSS** + **DaisyUI** для стилизации
- **Vite** для сборки
- **Axios** для HTTP запросов

### Структура проекта
```
src/
├── api/                    # API клиент и типы
│   ├── client.ts          # HTTP клиент с авторизацией
│   ├── endpoints.ts       # Endpoints API
│   └── types.ts           # TypeScript типы
├── assets/                # Статические ресурсы
│   ├── images/           # Изображения
│   ├── styles/           # Глобальные стили
│   └── navigation-styles.css # Стили навигации
├── components/            # Переиспользуемые компоненты
│   ├── common/           # Общие компоненты
│   ├── forms/            # Формы
│   └── ui/               # UI компоненты
├── composables/           # Vue composables
│   ├── useApi.ts         # API composable
│   └── useAuth.ts        # Аутентификация
├── layouts/              # Макеты страниц
│   └── AppLayout.vue     # Основной макет
├── pages/                # Страницы приложения
│   ├── Dashboard/        # Дашборд
│   ├── Materials/        # Материалы
│   ├── Objects/          # Объекты
│   ├── Purchases/        # Закупки
│   └── Reports/          # Отчеты
├── router/               # Конфигурация маршрутизации
│   └── index.ts          # Основные маршруты
├── stores/               # Pinia stores
│   ├── auth.ts           # Аутентификация
│   ├── materials.ts      # Материалы
│   └── ui.ts             # UI состояние
├── utils/                # Утилиты
│   ├── formatters.ts     # Форматирование данных
│   ├── validators.ts     # Валидация
│   └── helpers.ts        # Вспомогательные функции
└── main.ts              # Точка входа
```

### Паттерны архитектуры

#### 1. Composition API
Все компоненты используют Composition API для лучшей типизации и переиспользования логики.

#### 2. Pinia Stores
Централизованное управление состоянием через Pinia stores:
- `authStore` - аутентификация и пользователь
- `materialsStore` - материалы и категории
- `objectsStore` - объекты и статусы
- `uiStore` - UI состояние (модалы, уведомления)

#### 3. API Layer
Централизованный API клиент с:
- Автоматической авторизацией
- Обработкой ошибок
- Типизированными запросами

---

## 🔧 Разработка

### Настройка IDE
Рекомендуемые расширения для VS Code:
- Vue Language Features (Volar)
- TypeScript Vue Plugin (Volar)
- Tailwind CSS IntelliSense
- ESLint
- Prettier

### Конвенции кода
- **TypeScript** для всех новых файлов
- **Composition API** для компонентов
- **CamelCase** для переменных и функций
- **PascalCase** для компонентов
- **kebab-case** для CSS классов

### Переменные окружения
```env
# API
VITE_API_URL=https://your-api-domain.com/api/v1

# Приложение
VITE_APP_TITLE=ELOM
VITE_APP_VERSION=1.0.0

# Режим разработки
VITE_DEV_MODE=true
```

### Структура компонента
```vue
<template>
  <!-- HTML шаблон -->
</template>

<script setup lang="ts">
// Импорты
import { ref, computed, onMounted } from 'vue'
import type { ComponentProps } from '@/types'

// Props
interface Props {
  title: string
  data?: ComponentData[]
}

const props = withDefaults(defineProps<Props>(), {
  data: () => []
})

// Emits
const emit = defineEmits<{
  save: [data: ComponentData]
  cancel: []
}>()

// Реактивные данные
const loading = ref(false)
const formData = ref<ComponentData>({})

// Computed
const isValid = computed(() => {
  return formData.value.title?.length > 0
})

// Методы
const handleSave = async () => {
  loading.value = true
  try {
    await saveData(formData.value)
    emit('save', formData.value)
  } catch (error) {
    console.error('Ошибка сохранения:', error)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  // Инициализация
})
</script>

<style scoped>
/* Стили компонента */
</style>
```

---

## 🧪 Тестирование

### Обзор
Проект использует несколько уровней тестирования:

1. **Unit тесты** - тестирование отдельных компонентов и функций
2. **Integration тесты** - тестирование взаимодействия между модулями
3. **E2E тесты** - тестирование полных пользовательских сценариев

### Технологии
- **Vitest** - основной фреймворк для unit и integration тестов
- **Vue Test Utils** - утилиты для тестирования Vue компонентов
- **Playwright** - E2E тестирование

### Структура тестов
```
tests/
├── unit/                 # Unit тесты
│   ├── components/      # Тесты компонентов
│   ├── stores/          # Тесты stores
│   └── utils/           # Тесты утилит
├── integration/         # Integration тесты
│   ├── api/            # Тесты API
│   └── pages/          # Тесты страниц
└── e2e/                # E2E тесты
    ├── auth.spec.ts    # Тесты аутентификации
    └── materials.spec.ts # Тесты материалов
```

### Запуск тестов
```bash
# Все тесты
npm run test

# Unit тесты
npm run test:unit

# Integration тесты
npm run test:integration

# E2E тесты
npm run test:e2e

# Покрытие кода
npm run test:coverage
```

### Пример unit теста
```typescript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MaterialForm from '@/components/MaterialForm.vue'

describe('MaterialForm', () => {
  it('renders form fields correctly', () => {
    const wrapper = mount(MaterialForm, {
      props: {
        initialData: {
          name: 'Test Material',
          sku: 'TEST-001'
        }
      }
    })

    expect(wrapper.find('input[name="name"]').element.value).toBe('Test Material')
    expect(wrapper.find('input[name="sku"]').element.value).toBe('TEST-001')
  })

  it('emits save event on form submit', async () => {
    const wrapper = mount(MaterialForm)
    
    await wrapper.find('form').trigger('submit')
    
    expect(wrapper.emitted('save')).toBeTruthy()
  })
})
```

---

## 🔌 API интеграция

### API клиент
Централизованный HTTP клиент с автоматической авторизацией:

```typescript
// api/client.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000
})

// Interceptor для авторизации
apiClient.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
})

// Interceptor для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
    }
    return Promise.reject(error)
  }
)
```

### Типизированные endpoints
```typescript
// api/endpoints.ts
export const endpoints = {
  // Аутентификация
  auth: {
    login: '/auth/login/',
    logout: '/auth/logout/',
    me: '/auth/me/'
  },
  
  // Материалы
  materials: {
    list: '/materials/',
    create: '/materials/',
    detail: (id: number) => `/materials/${id}/`,
    update: (id: number) => `/materials/${id}/`,
    delete: (id: number) => `/materials/${id}/`
  },
  
  // Объекты
  objects: {
    list: '/objects/',
    create: '/objects/',
    detail: (id: number) => `/objects/${id}/`,
    update: (id: number) => `/objects/${id}/`,
    delete: (id: number) => `/objects/${id}/`
  }
}
```

### TypeScript типы
```typescript
// api/types.ts
export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  is_active: boolean
}

export interface Material {
  id: number
  name: string
  sku: string
  category: MaterialCategory
  unit: Unit
  description?: string
  photo?: string
  created_at: string
  updated_at: string
}

export type UserRole = 'admin' | 'director' | 'coordinator' | 'site_manager' | 'buyer' | 'brigadier'
```

---

## 🎨 Компоненты

### Общие компоненты

#### FormField
Универсальный компонент для полей форм:
```vue
<FormField
  v-model="formData.name"
  type="text"
  label="Название"
  placeholder="Введите название"
  :required="true"
  :error="errors.name"
/>
```

#### Modal
Модальное окно с различными размерами:
```vue
<Modal v-model="isOpen" title="Заголовок" size="lg">
  <p>Содержимое модального окна</p>
</Modal>
```

#### LoadingSpinner
Индикатор загрузки:
```vue
<LoadingSpinner 
  size="lg"
  variant="primary"
  text="Загрузка данных..."
  :overlay="true"
/>
```

### Специализированные компоненты

#### MaterialSearchSelect
Поиск и выбор материалов с автодополнением:
```vue
<MaterialSearchSelect
  v-model="selectedMaterial"
  :multiple="false"
  placeholder="Поиск материалов..."
  @select="handleMaterialSelect"
/>
```

#### SmartUnitValue
Отображение значений с единицами измерения:
```vue
<SmartUnitValue
  :value="material.quantity"
  :unit="material.unit"
  :precision="2"
/>
```

---

## 🎨 Стилизация

### Дизайн-система

#### Темы
- 🌞 **Светлая тема** - для дневной работы
- 🌙 **Темная тема** - для комфортной работы в темное время
- 🔄 **Автоматическое переключение** по системным настройкам

#### Цветовая палитра
```css
:root {
  /* Основные цвета */
  --primary: #3b82f6;
  --secondary: #8b5cf6;
  --accent: #06b6d4;
  
  /* Семантические цвета */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  
  /* Нейтральные цвета */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-900: #111827;
}
```

#### Компоненты
- **Современные карточки** с тенями и скругленными углами
- **Интуитивные формы** с валидацией
- **Адаптивные таблицы** с сортировкой
- **Умные фильтры** с автопоиском

### Tailwind CSS
Проект использует Tailwind CSS с кастомными утилитами:

```css
/* Кастомные утилиты */
@layer utilities {
  .text-gradient {
    @apply bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent;
  }
  
  .shadow-soft {
    box-shadow: 0 2px 15px -3px rgba(0, 0, 0, 0.07);
  }
}
```

### Анимации
```css
/* Анимации появления */
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

---

## 📱 Мобильная версия

Приложение полностью адаптировано для мобильных устройств:

### Responsive дизайн
- **Breakpoints**: 640px, 768px, 1024px, 1280px
- **Mobile-first** подход
- **Touch-friendly** интерфейс

### Мобильная навигация
- **Скрываемый sidebar** на маленьких экранах
- **Кнопка меню** для открытия навигации
- **Overlay** с размытием фона

### Адаптивные таблицы
- **Горизонтальный скролл** на мобильных
- **Компактные ячейки** для экономии места
- **Touch-оптимизация** для прокрутки

---

## 🚀 Деплой

### Продакшен сборка
```bash
npm run build
```

### Переменные окружения
```env
VITE_API_URL=https://your-api-domain.com/api/v1
VITE_APP_TITLE=ELOM
VITE_APP_VERSION=1.0.0
```

### Рекомендуемые настройки сервера
- **Nginx** с поддержкой SPA
- **HTTPS** для безопасности
- **Gzip** для сжатия
- **Кэширование** статических ресурсов

### Nginx конфигурация
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/elom-frontend/dist;
    index index.html;

    # SPA поддержка
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Кэширование статических ресурсов
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip сжатие
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

---

## 🔐 Безопасность

### Роли пользователей
- **admin** - полный доступ ко всем функциям
- **director** - управление данными и пользователями
- **coordinator** - координация проектов
- **site_manager** - управление объектами
- **buyer** - управление закупками
- **brigadier** - просмотр данных

### Защита маршрутов
Все маршруты защищены проверкой аутентификации и ролей:

```typescript
// router/guards.ts
export function requireAuth(to: RouteLocationNormalized) {
  const authStore = useAuthStore()
  
  if (!authStore.isAuthenticated) {
    return '/login'
  }
  
  if (to.meta.roles && !to.meta.roles.includes(authStore.role)) {
    return '/unauthorized'
  }
}
```

---

## 🤝 Участие в разработке

### Процесс разработки
1. Создайте **feature branch** от `main`
2. Внесите изменения с **тестами**
3. Убедитесь, что **линтер проходит**
4. Создайте **Pull Request**
5. Дождитесь **code review**

### Сообщение об ошибках
При обнаружении ошибок:
1. Проверьте **существующие issues**
2. Создайте **новый issue** с подробным описанием
3. Укажите **шаги воспроизведения**
4. Приложите **скриншоты** если необходимо

---

## 📚 Дополнительная документация

- [🔌 API документация](API_DOCUMENTATION.md)
- [📋 Схема API](api_schema.yaml)
- [📊 Отчеты о статусе](PROJECT_STATUS.md)
- [🐛 Отчеты об исправлениях](FIXES_REPORTS.md)

---

**ELOM Frontend** - Современное решение для управления строительными проектами 🏗️
