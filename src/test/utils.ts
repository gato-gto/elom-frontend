import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { vi } from 'vitest'

// Mock router
export function createMockRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
      { path: '/dashboard', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
      { path: '/materials', name: 'materials', component: { template: '<div>Materials</div>' } },
      { path: '/purchases', name: 'purchases', component: { template: '<div>Purchases</div>' } },
    ]
  })
}

// Mock stores
export function createMockStores() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

// Helper to mount component with common setup
export function mountWithSetup<T>(
  component: any,
  options: any = {}
): VueWrapper<T> {
  const pinia = createMockStores()
  const router = createMockRouter()
  
  return mount(component, {
    global: {
      plugins: [pinia, router],
      stubs: {
        'router-link': true,
        'router-view': true,
      },
      mocks: {
        $router: router,
        $route: router.currentRoute.value,
      },
    },
    ...options
  })
}

// Mock API responses
export const mockApiResponses = {
  materials: {
    list: {
      count: 2,
      results: [
        {
          id: 1,
          name: 'Test Material 1',
          sku: 'MAT001',
          category_name: 'Category 1',
          default_unit_code: 'kg',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Test Material 2',
          sku: 'MAT002',
          category_name: 'Category 2',
          default_unit_code: 'm',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]
    },
    one: {
      id: 1,
      name: 'Test Material',
      sku: 'TEST001',
      category_name: 'Category 1',
      default_unit_code: 'kg',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  },
  purchases: {
    list: {
      count: 1,
      results: [
        {
          id: 1,
          date: '2024-01-15',
          object: 1,
          object_name: 'Test Object',
          supplier: 'Test Supplier',
          vat_included: true,
          currency: 'UZS',
          responsible: 1,
          total_amount: '1000000',
          is_archived: false,
          purchase_no: 'PUR-001',
          items: [],
          photos: [],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]
    }
  },
  auth: {
    login: {
      access: 'mock-access-token',
      refresh: 'mock-refresh-token'
    },
    user: {
      id: 1,
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      role: 'admin'
    }
  }
}

// Mock file for testing file uploads
export function createMockFile(name: string = 'test.jpg', type: string = 'image/jpeg'): File {
  const file = new File(['test content'], name, { type })
  return file
}

// Wait for next tick
export async function waitForNextTick() {
  await new Promise(resolve => setTimeout(resolve, 0))
}

// Mock localStorage
export function mockLocalStorage() {
  const store: Record<string, string> = {}
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    })
  }
}

// Mock fetch
export function mockFetch(response: any, status: number = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response))
  })
}
