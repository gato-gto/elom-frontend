# Техническое задание системы ELOM (Frontend)
## Electronic Logistics and Operations Management

**Дата**: 2 октября 2025  
**Версия**: 2.1  
**Статус**: 95% готово (обновлено после обновления Tailwind CSS v4)

---

## 📋 **СТАТУС РЕАЛИЗАЦИИ FRONTEND**

### ✅ **Реализовано (95%):**
- **Vue 3 + TypeScript**: полная типизация и современная архитектура
- **Pinia stores**: централизованное управление состоянием
- **API интеграция**: полная интеграция с backend API
- **Компоненты**: переиспользуемые UI компоненты
- **Роутинг**: защищенные маршруты с проверкой ролей
- **Аутентификация**: JWT токены с автоматическим обновлением
- **Формы**: валидация и обработка ошибок
- **Фильтрация**: умные фильтры с автопоиском
- **Пагинация**: навигация по большим спискам
- **Экспорт**: экспорт данных в Excel
- **Темы**: светлая и темная темы
- **Мобильная версия**: адаптивный дизайн
- **Мобильная навигация**: sidebar с touch-оптимизацией

### ❌ **Требует реализации (5%):**
1. **PDF экспорт** - для всех отчетов
2. **Улучшения UX** - прогресс загрузки фото, предпросмотр
3. **Real-time уведомления** - WebSocket интеграция
4. **Офлайн режим** - кеширование данных
5. **PWA поддержка** - установка как приложение

**Срок реализации**: 2-3 недели

---

## 🏗️ **АРХИТЕКТУРА FRONTEND**

### Технологический стек

#### Frontend
- **Framework**: Vue.js 3 с Composition API
- **UI Framework**: Tailwind CSS v4 + DaisyUI v5
- **State Management**: Pinia
- **HTTP Client**: Axios
- **TypeScript**: Полная типизация
- **Build Tool**: Vite
- **Router**: Vue Router 4
- **Testing**: Vitest + Vue Test Utils

### Структура проекта

#### Frontend (Vue.js)
```
elom-frontend/
├── src/
│   ├── api/          # API клиент и типы
│   ├── assets/       # Статические ресурсы
│   ├── components/   # Переиспользуемые компоненты
│   ├── composables/  # Vue composables
│   ├── layouts/      # Макеты страниц
│   ├── pages/        # Страницы приложения
│   ├── router/       # Конфигурация маршрутизации
│   ├── stores/       # Pinia stores
│   ├── utils/        # Утилиты
│   └── main.ts       # Точка входа
├── tests/            # Тесты
├── docs/             # Документация
└── public/           # Публичные файлы
```

---

## 🎨 **КОМПОНЕНТЫ**

### Общие компоненты

#### FormField
Универсальный компонент для полей форм:
```vue
<template>
  <div class="form-control">
    <label class="label" v-if="label">
      <span class="label-text">{{ label }}</span>
      <span class="label-text-alt text-error" v-if="required">*</span>
    </label>
    <input
      v-model="modelValue"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      class="input input-bordered"
      :class="{ 'input-error': error }"
    />
    <label class="label" v-if="error">
      <span class="label-text-alt text-error">{{ error }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: any
  type?: string
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()
</script>
```

#### Modal
Модальное окно с различными размерами:
```vue
<template>
  <div v-if="modelValue" class="modal modal-open">
    <div class="modal-box" :class="sizeClass">
      <h3 class="font-bold text-lg">{{ title }}</h3>
      <div class="py-4">
        <slot />
      </div>
      <div class="modal-action">
        <slot name="actions" />
      </div>
    </div>
    <div class="modal-backdrop" @click="close"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const sizeClass = computed(() => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl'
  }
  return sizes[props.size]
})

const close = () => emit('update:modelValue', false)
</script>
```

#### LoadingSpinner
Индикатор загрузки:
```vue
<template>
  <div class="flex flex-col items-center justify-center p-8" :class="containerClass">
    <div class="loading loading-spinner" :class="sizeClass"></div>
    <p v-if="text" class="mt-4 text-sm opacity-70">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'accent'
  text?: string
  overlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'primary',
  overlay: false
})

const sizeClass = computed(() => {
  const sizes = {
    xs: 'loading-xs',
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg'
  }
  return sizes[props.size]
})

const containerClass = computed(() => {
  return props.overlay ? 'fixed inset-0 bg-base-100 bg-opacity-80 z-50' : ''
})
</script>
```

### Специализированные компоненты

#### MaterialSearchSelect
Поиск и выбор материалов с автодополнением:
```vue
<template>
  <div class="relative">
    <input
      v-model="searchQuery"
      type="text"
      :placeholder="placeholder"
      class="input input-bordered w-full"
      @focus="showDropdown = true"
      @blur="handleBlur"
    />
    
    <div
      v-if="showDropdown && filteredMaterials.length > 0"
      class="absolute top-full left-0 right-0 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
    >
      <div
        v-for="material in filteredMaterials"
        :key="material.id"
        class="p-3 hover:bg-base-200 cursor-pointer"
        @click="selectMaterial(material)"
      >
        <div class="font-medium">{{ material.name }}</div>
        <div class="text-sm opacity-70">{{ material.sku }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMaterialsStore } from '@/stores/materials'
import type { Material } from '@/api/types'

interface Props {
  modelValue: Material | null
  placeholder?: string
  multiple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Поиск материалов...',
  multiple: false
})

const emit = defineEmits<{
  'update:modelValue': [value: Material | null]
  select: [material: Material]
}>()

const materialsStore = useMaterialsStore()
const searchQuery = ref('')
const showDropdown = ref(false)

const filteredMaterials = computed(() => {
  if (!searchQuery.value) return materialsStore.items.slice(0, 10)
  
  return materialsStore.items.filter(material =>
    material.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    material.sku.toLowerCase().includes(searchQuery.value.toLowerCase())
  ).slice(0, 10)
})

const selectMaterial = (material: Material) => {
  emit('update:modelValue', material)
  emit('select', material)
  showDropdown.value = false
  searchQuery.value = material.name
}

const handleBlur = () => {
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    searchQuery.value = newValue.name
  } else {
    searchQuery.value = ''
  }
})
</script>
```

#### SmartUnitValue
Отображение значений с единицами измерения:
```vue
<template>
  <span class="smart-unit-value">
    {{ formattedValue }}
    <span class="unit-symbol">{{ unit.symbol }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Unit } from '@/api/types'

interface Props {
  value: number
  unit: Unit
  precision?: number
}

const props = withDefaults(defineProps<Props>(), {
  precision: 2
})

const formattedValue = computed(() => {
  return props.value.toFixed(props.precision)
})
</script>

<style scoped>
.smart-unit-value {
  @apply font-mono;
}

.unit-symbol {
  @apply text-sm opacity-70 ml-1;
}
</style>
```

---

## 🗃️ **PINIA STORES**

### Auth Store
```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  
  const isAuthenticated = computed(() => !!token.value)
  const role = computed(() => user.value?.role)
  
  const canEdit = computed(() => {
    return ['admin', 'director', 'buyer'].includes(role.value)
  })
  
  const canManageUsers = computed(() => {
    return ['admin', 'director'].includes(role.value)
  })
  
  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await apiClient.post('/auth/token/', credentials)
      const { access, refresh } = response.data
      
      token.value = access
      refreshToken.value = refresh
      
      localStorage.setItem('token', access)
      localStorage.setItem('refreshToken', refresh)
      
      await fetchUser()
      
      return { success: true }
    } catch (error) {
      return { success: false, error: handleApiError(error) }
    }
  }
  
  const logout = () => {
    user.value = null
    token.value = null
    refreshToken.value = null
    
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }
  
  const fetchUser = async () => {
    try {
      const response = await apiClient.get('/auth/me/')
      user.value = response.data
    } catch (error) {
      logout()
    }
  }
  
  const refreshAccessToken = async () => {
    if (!refreshToken.value) return false
    
    try {
      const response = await apiClient.post('/auth/token/refresh/', {
        refresh: refreshToken.value
      })
      
      token.value = response.data.access
      localStorage.setItem('token', token.value)
      
      return true
    } catch (error) {
      logout()
      return false
    }
  }
  
  return {
    user,
    token,
    isAuthenticated,
    role,
    canEdit,
    canManageUsers,
    login,
    logout,
    fetchUser,
    refreshAccessToken
  }
})
```

### Materials Store
```typescript
// stores/materials.ts
export const useMaterialsStore = defineStore('materials', () => {
  const items = ref<Material[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    pageSize: 20,
    count: 0
  })
  const filters = ref({
    name: '',
    sku: '',
    category: '',
    search: ''
  })
  
  const fetchMaterials = async (params?: any) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await apiClient.get('/materials/', { params })
      items.value = response.data.results
      pagination.value = {
        page: response.data.page,
        pageSize: response.data.page_size,
        count: response.data.count
      }
    } catch (err) {
      error.value = handleApiError(err)
    } finally {
      loading.value = false
    }
  }
  
  const createMaterial = async (data: Partial<Material>) => {
    try {
      const response = await apiClient.post('/materials/', data)
      items.value.unshift(response.data)
      return { success: true, data: response.data }
    } catch (err) {
      return { success: false, error: handleApiError(err) }
    }
  }
  
  const updateMaterial = async (id: number, data: Partial<Material>) => {
    try {
      const response = await apiClient.put(`/materials/${id}/`, data)
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = response.data
      }
      return { success: true, data: response.data }
    } catch (err) {
      return { success: false, error: handleApiError(err) }
    }
  }
  
  const deleteMaterial = async (id: number) => {
    try {
      await apiClient.delete(`/materials/${id}/`)
      items.value = items.value.filter(item => item.id !== id)
      return { success: true }
    } catch (err) {
      return { success: false, error: handleApiError(err) }
    }
  }
  
  const clearError = () => {
    error.value = null
  }
  
  return {
    items,
    loading,
    error,
    pagination,
    filters,
    fetchMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    clearError
  }
})
```

---

## 🛣️ **РОУТИНГ**

### Конфигурация маршрутов
```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/pages/Dashboard/Index.vue'),
    meta: { requiresAuth: true, title: 'Дашборд' }
  },
  {
    path: '/materials',
    name: 'Materials',
    component: () => import('@/pages/Materials/List.vue'),
    meta: { requiresAuth: true, title: 'Материалы' }
  },
  {
    path: '/materials/create',
    name: 'MaterialCreate',
    component: () => import('@/pages/Materials/Form.vue'),
    meta: { requiresAuth: true, title: 'Новый материал', roles: ['admin', 'director', 'buyer'] }
  },
  {
    path: '/materials/:id/edit',
    name: 'MaterialEdit',
    component: () => import('@/pages/Materials/Form.vue'),
    meta: { requiresAuth: true, title: 'Редактировать материал', roles: ['admin', 'director', 'buyer'] }
  },
  {
    path: '/objects',
    name: 'Objects',
    component: () => import('@/pages/Objects/List.vue'),
    meta: { requiresAuth: true, title: 'Объекты' }
  },
  {
    path: '/purchases',
    name: 'Purchases',
    component: () => import('@/pages/Purchases/List.vue'),
    meta: { requiresAuth: true, title: 'Закупки' }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/pages/Reports/Index.vue'),
    meta: { requiresAuth: true, title: 'Отчеты' }
  },
  {
    path: '/reports/by-period',
    name: 'ReportsByPeriod',
    component: () => import('@/pages/Reports/ByPeriod.vue'),
    meta: { requiresAuth: true, title: 'Отчет по периодам' }
  },
  {
    path: '/reports/by-object',
    name: 'ReportsByObject',
    component: () => import('@/pages/Reports/ByObject.vue'),
    meta: { requiresAuth: true, title: 'Отчет по объектам' }
  },
  {
    path: '/reports/by-material',
    name: 'ReportsByMaterial',
    component: () => import('@/pages/Reports/ByMaterial.vue'),
    meta: { requiresAuth: true, title: 'Отчет по материалам' }
  },
  {
    path: '/reports/by-responsible',
    name: 'ReportsByResponsible',
    component: () => import('@/pages/Reports/ByResponsible.vue'),
    meta: { requiresAuth: true, title: 'Отчет по ответственным' }
  },
  {
    path: '/employees',
    name: 'Employees',
    component: () => import('@/pages/Employees/List.vue'),
    meta: { requiresAuth: true, title: 'Сотрудники', roles: ['admin', 'director'] }
  },
  {
    path: '/units',
    name: 'Units',
    component: () => import('@/pages/Units/List.vue'),
    meta: { requiresAuth: true, title: 'Единицы измерения', roles: ['admin', 'director'] }
  },
  {
    path: '/stocks',
    name: 'Stocks',
    component: () => import('@/pages/Stocks/List.vue'),
    meta: { requiresAuth: true, title: 'Остатки' }
  },
  {
    path: '/writeoffs',
    name: 'WriteOffs',
    component: () => import('@/pages/WriteOffs/List.vue'),
    meta: { requiresAuth: true, title: 'Списания' }
  },
  {
    path: '/archive',
    name: 'Archive',
    component: () => import('@/pages/Archive/List.vue'),
    meta: { requiresAuth: true, title: 'Архив' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Проверка аутентификации
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }
  
  // Проверка ролей
  if (to.meta.roles && !to.meta.roles.includes(authStore.role)) {
    next('/unauthorized')
    return
  }
  
  // Если пользователь аутентифицирован и пытается зайти на login
  if (to.name === 'Login' && authStore.isAuthenticated) {
    next('/')
    return
  }
  
  next()
})

export default router
```

---

## 🎨 **СТИЛИЗАЦИЯ**

### Дизайн-система

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

/* Темная тема */
:root.dark {
  --primary: #60a5fa;
  --secondary: #a78bfa;
  --accent: #22d3ee;
  
  --success: #34d399;
  --warning: #fbbf24;
  --error: #f87171;
  --info: #60a5fa;
}
```

#### Компоненты
```css
/* Современные карточки */
.card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-soft border border-gray-200 dark:border-gray-700;
}

.card-header {
  @apply p-6 border-b border-gray-200 dark:border-gray-700;
}

.card-body {
  @apply p-6;
}

.card-footer {
  @apply p-6 border-t border-gray-200 dark:border-gray-700;
}

/* Интуитивные формы */
.form-control {
  @apply space-y-2;
}

.form-label {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-input {
  @apply input input-bordered w-full focus:input-primary;
}

.form-error {
  @apply text-sm text-error;
}

/* Адаптивные таблицы */
.modern-table {
  @apply w-full border-collapse bg-white dark:bg-gray-800 rounded-lg overflow-hidden;
}

.modern-table th {
  @apply bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm px-4 py-3 text-left border-b border-gray-200 dark:border-gray-600;
}

.modern-table td {
  @apply px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600;
}

.modern-table tbody tr:hover {
  @apply bg-gray-50 dark:bg-gray-700;
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

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Применение анимаций */
.animate-slide-in-left {
  animation: slideInLeft 0.3s ease-out;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

.animate-slide-in-up {
  animation: slideInUp 0.3s ease-out;
}
```

---

## 📱 **МОБИЛЬНАЯ ВЕРСИЯ**

### Responsive дизайн
```css
/* Breakpoints */
@media (max-width: 640px) {
  .container {
    @apply px-4;
  }
  
  .card {
    @apply mx-2;
  }
  
  .table-container {
    @apply -mx-4;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .container {
    @apply px-6;
  }
}

@media (min-width: 1025px) {
  .container {
    @apply px-8;
  }
}
```

### Мобильная навигация
```vue
<!-- layouts/AppLayout.vue -->
<template>
  <div class="drawer lg:drawer-open">
    <input id="drawer-toggle" type="checkbox" class="drawer-toggle" />
    
    <!-- Main content -->
    <div class="drawer-content flex flex-col">
      <!-- Mobile menu button -->
      <div class="lg:hidden fixed top-4 left-4 z-40">
        <label for="drawer-toggle" class="btn btn-primary btn-circle shadow-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </label>
      </div>
      
      <!-- Page content -->
      <main class="flex-1 p-1 sm:p-4 bg-gray-50">
        <router-view />
      </main>
    </div>
    
    <!-- Sidebar -->
    <div class="drawer-side">
      <label for="drawer-toggle" aria-label="close sidebar" class="drawer-overlay"></label>
      <aside class="sidebar min-h-full w-64">
        <!-- Navigation content -->
      </aside>
    </div>
  </div>
</template>
```

### Touch-оптимизация
```css
/* Увеличенные области нажатия для мобильных */
@media (hover: none) and (pointer: coarse) {
  .btn {
    min-height: 44px;
    padding: 0.75rem 1rem;
  }
  
  .nav-link {
    min-height: 44px;
    padding: 0.75rem 1rem;
  }
  
  .table-row {
    min-height: 60px;
  }
}
```

---

## 🧪 **ТЕСТИРОВАНИЕ**

### Unit тесты
```typescript
// tests/unit/components/FormField.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FormField from '@/components/FormField.vue'

describe('FormField', () => {
  it('renders label correctly', () => {
    const wrapper = mount(FormField, {
      props: {
        modelValue: '',
        label: 'Test Label'
      }
    })
    
    expect(wrapper.find('.label-text').text()).toBe('Test Label')
  })
  
  it('shows error message', () => {
    const wrapper = mount(FormField, {
      props: {
        modelValue: '',
        error: 'Test Error'
      }
    })
    
    expect(wrapper.find('.text-error').text()).toBe('Test Error')
  })
  
  it('emits update:modelValue on input', async () => {
    const wrapper = mount(FormField, {
      props: {
        modelValue: ''
      }
    })
    
    await wrapper.find('input').setValue('test value')
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['test value'])
  })
})
```

### Store тесты
```typescript
// tests/unit/stores/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('initializes with empty state', () => {
    const store = useAuthStore()
    
    expect(store.user).toBeNull()
    expect(store.token).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })
  
  it('computes canEdit correctly', () => {
    const store = useAuthStore()
    
    store.user = { role: 'admin' } as any
    expect(store.canEdit).toBe(true)
    
    store.user = { role: 'brigadier' } as any
    expect(store.canEdit).toBe(false)
  })
})
```

### E2E тесты
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[name="username"]', 'testuser')
    await page.fill('input[name="password"]', 'testpass')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/')
    await expect(page.locator('h1')).toContainText('Дашборд')
  })
  
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/materials')
    
    await expect(page).toHaveURL('/login')
  })
})
```

---

## 🚀 **ДЕПЛОЙ**

### Build конфигурация
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['@headlessui/vue', '@heroicons/vue']
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
```

### Environment переменные
```env
# .env.development
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws
VITE_APP_TITLE=ELOM
VITE_APP_VERSION=1.0.0
VITE_DEV_MODE=true

# .env.production
VITE_API_URL=https://api.elom.com/api/v1
VITE_WS_URL=wss://api.elom.com/ws
VITE_APP_TITLE=ELOM
VITE_APP_VERSION=1.0.0
VITE_DEV_MODE=false
```

### Docker конфигурация
```dockerfile
# Dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # SPA support
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API proxy
        location /api/ {
            proxy_pass http://backend:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Static files caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    }
}
```

---

## 🔧 **ОПТИМИЗАЦИЯ**

### Code Splitting
```typescript
// router/index.ts
const routes = [
  {
    path: '/materials',
    name: 'Materials',
    component: () => import(/* webpackChunkName: "materials" */ '@/pages/Materials/List.vue')
  },
  {
    path: '/objects',
    name: 'Objects',
    component: () => import(/* webpackChunkName: "objects" */ '@/pages/Objects/List.vue')
  }
]
```

### Lazy Loading компонентов
```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const HeavyComponent = defineAsyncComponent(() => import('@/components/HeavyComponent.vue'))
</script>
```

### Кеширование API запросов
```typescript
// composables/useApiCache.ts
export const useApiCache = () => {
  const cache = new Map()
  
  const getCached = (key: string) => {
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 минут
      return cached.data
    }
    return null
  }
  
  const setCached = (key: string, data: any) => {
    cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }
  
  return { getCached, setCached }
}
```

---

## 📊 **МОНИТОРИНГ**

### Error Tracking
```typescript
// utils/errorTracker.ts
export const trackError = (error: Error, context?: any) => {
  console.error('Error:', error, context)
  
  // Отправка в сервис мониторинга
  if (import.meta.env.PROD) {
    // Sentry, LogRocket, etc.
  }
}

// Global error handler
window.addEventListener('error', (event) => {
  trackError(event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  })
})

window.addEventListener('unhandledrejection', (event) => {
  trackError(new Error(event.reason), {
    type: 'unhandledrejection'
  })
})
```

### Performance мониторинг
```typescript
// utils/performance.ts
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now()
  fn()
  const end = performance.now()
  
  console.log(`${name} took ${end - start} milliseconds`)
  
  // Отправка метрик
  if (import.meta.env.PROD) {
    // Analytics, etc.
  }
}
```

---

Это техническое задание покрывает все аспекты frontend разработки системы ELOM. Для получения информации о backend части см. [Backend Technical Specification](../elom-backend/docs/TECHNICAL_SPECIFICATION.md).
