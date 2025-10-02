# ELOM Frontend API Integration Guide

## Обзор

Руководство по интеграции frontend приложения с ELOM API.

**Base URL**: `http://localhost:8000/api/v1/`

## Аутентификация

### JWT Token Authentication

```typescript
// Получение токена
POST /api/v1/auth/token/
{
  "username": "string",
  "password": "string"
}

// Ответ
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}

// Обновление токена
POST /api/v1/auth/token/refresh/
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}

// Проверка токена
POST /api/v1/auth/token/verify/
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Headers для авторизованных запросов

```typescript
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "application/json"
}
```

## Роли пользователей

### Доступные роли
- **admin** - полный доступ ко всем функциям
- **director** - управление данными и пользователями
- **coordinator** - координация проектов
- **site_manager** - управление объектами
- **buyer** - управление закупками
- **brigadier** - просмотр данных

### Проверка ролей в frontend

```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  
  const isAuthenticated = computed(() => !!token.value)
  const role = computed(() => user.value?.role)
  
  const canEdit = computed(() => {
    return ['admin', 'director', 'buyer'].includes(role.value)
  })
  
  const canManageUsers = computed(() => {
    return ['admin', 'director'].includes(role.value)
  })
  
  return {
    user,
    token,
    isAuthenticated,
    role,
    canEdit,
    canManageUsers
  }
})
```

## API Client Setup

### Axios Configuration

```typescript
// api/client.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000
})

// Request interceptor для авторизации
apiClient.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
})

// Response interceptor для обработки ошибок
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

## TypeScript Types

### Основные типы

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
  created_at: string
  updated_at: string
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

export interface Object {
  id: number
  name: string
  address: string
  lat?: number
  lng?: number
  responsible: User
  date_start?: string
  date_end?: string
  status: ObjectStatus
  created_at: string
  updated_at: string
}

export interface Purchase {
  id: number
  purchase_no: string
  object: Object
  material: Material
  quantity: number
  unit_price: number
  total_price: number
  responsible: User
  status: PurchaseStatus
  created_at: string
  updated_at: string
}

export type UserRole = 'admin' | 'director' | 'coordinator' | 'site_manager' | 'buyer' | 'brigadier'
export type ObjectStatus = 'planning' | 'active' | 'completed' | 'cancelled'
export type PurchaseStatus = 'new' | 'completed' | 'cancelled'
```

## API Endpoints

### Аутентификация

```typescript
// api/endpoints.ts
export const authEndpoints = {
  login: '/auth/token/',
  refresh: '/auth/token/refresh/',
  verify: '/auth/token/verify/',
  me: '/auth/me/'
}
```

### Материалы

```typescript
export const materialEndpoints = {
  list: '/materials/',
  create: '/materials/',
  detail: (id: number) => `/materials/${id}/`,
  update: (id: number) => `/materials/${id}/`,
  delete: (id: number) => `/materials/${id}/`
}
```

### Объекты

```typescript
export const objectEndpoints = {
  list: '/objects/',
  create: '/objects/',
  detail: (id: number) => `/objects/${id}/`,
  update: (id: number) => `/objects/${id}/`,
  delete: (id: number) => `/objects/${id}/`
}
```

### Закупки

```typescript
export const purchaseEndpoints = {
  list: '/purchases/',
  create: '/purchases/',
  detail: (id: number) => `/purchases/${id}/`,
  update: (id: number) => `/purchases/${id}/`,
  delete: (id: number) => `/purchases/${id}/`,
  photos: (id: number) => `/purchases/${id}/photos/`
}
```

## Stores Integration

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
  
  const fetchMaterials = async (params?: any) => {
    loading.value = true
    try {
      const response = await apiClient.get(materialEndpoints.list, { params })
      items.value = response.data.results
      pagination.value = {
        page: response.data.page,
        pageSize: response.data.page_size,
        count: response.data.count
      }
    } catch (err) {
      error.value = 'Ошибка загрузки материалов'
    } finally {
      loading.value = false
    }
  }
  
  const createMaterial = async (data: Partial<Material>) => {
    try {
      const response = await apiClient.post(materialEndpoints.create, data)
      items.value.unshift(response.data)
      return response.data
    } catch (err) {
      error.value = 'Ошибка создания материала'
      throw err
    }
  }
  
  return {
    items,
    loading,
    error,
    pagination,
    fetchMaterials,
    createMaterial
  }
})
```

## Error Handling

### Global Error Handler

```typescript
// utils/errorHandler.ts
export const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status
    const message = error.response.data?.message || error.response.data?.detail
    
    switch (status) {
      case 400:
        return 'Некорректные данные'
      case 401:
        return 'Необходима авторизация'
      case 403:
        return 'Недостаточно прав'
      case 404:
        return 'Ресурс не найден'
      case 500:
        return 'Внутренняя ошибка сервера'
      default:
        return message || 'Произошла ошибка'
    }
  } else if (error.request) {
    // Network error
    return 'Ошибка сети'
  } else {
    // Other error
    return 'Неизвестная ошибка'
  }
}
```

## File Upload

### Photo Upload

```typescript
// utils/fileUpload.ts
export const uploadPhoto = async (file: File, purchaseId: number) => {
  const formData = new FormData()
  formData.append('photo', file)
  formData.append('purchase', purchaseId.toString())
  
  try {
    const response = await apiClient.post(
      `/purchases/${purchaseId}/photos/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return response.data
  } catch (error) {
    throw new Error('Ошибка загрузки фото')
  }
}
```

## Pagination

### Pagination Component

```typescript
// components/Pagination.vue
export interface PaginationData {
  page: number
  pageSize: number
  count: number
  totalPages: number
}

export const usePagination = (store: any) => {
  const pagination = computed(() => store.pagination)
  
  const handlePageChange = (page: number) => {
    store.fetchData({ page })
  }
  
  const handlePageSizeChange = (pageSize: number) => {
    store.fetchData({ page: 1, page_size: pageSize })
  }
  
  return {
    pagination,
    handlePageChange,
    handlePageSizeChange
  }
}
```

## Filters

### Filter Implementation

```typescript
// composables/useFilters.ts
export const useFilters = (store: any) => {
  const filters = ref({})
  
  const applyFilters = (newFilters: any) => {
    filters.value = { ...filters.value, ...newFilters }
    store.fetchData(filters.value)
  }
  
  const resetFilters = () => {
    filters.value = {}
    store.fetchData()
  }
  
  return {
    filters,
    applyFilters,
    resetFilters
  }
}
```

## Real-time Updates

### WebSocket Integration

```typescript
// composables/useWebSocket.ts
export const useWebSocket = () => {
  const socket = ref<WebSocket | null>(null)
  const connected = ref(false)
  
  const connect = () => {
    const wsUrl = import.meta.env.VITE_WS_URL
    socket.value = new WebSocket(wsUrl)
    
    socket.value.onopen = () => {
      connected.value = true
    }
    
    socket.value.onmessage = (event) => {
      const data = JSON.parse(event.data)
      // Handle real-time updates
    }
    
    socket.value.onclose = () => {
      connected.value = false
    }
  }
  
  return {
    socket,
    connected,
    connect
  }
}
```

## Testing

### API Mocking

```typescript
// tests/mocks/api.ts
export const mockApiResponse = (data: any, status = 200) => {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {}
  }
}

export const mockMaterials = [
  {
    id: 1,
    name: 'Test Material',
    sku: 'TEST-001',
    category: { id: 1, name: 'Test Category' },
    unit: { id: 1, name: 'шт' },
    created_at: '2025-01-20T10:00:00Z'
  }
]
```

## Environment Configuration

### Environment Variables

```env
# .env
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws
VITE_APP_TITLE=ELOM
VITE_APP_VERSION=1.0.0
```

### Environment Types

```typescript
// types/env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

---

Это руководство покрывает основные аспекты интеграции frontend с ELOM API. Для получения полной информации об API endpoints см. [API Documentation](../elom-backend/docs/API_DOCUMENTATION.md).
