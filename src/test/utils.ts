import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import type { Component } from 'vue'

// Test router
export const createTestRouter = () => {
  return createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        name: 'Home',
        component: { template: '<div>Home</div>' }
      },
      {
        path: '/login',
        name: 'Login',
        component: { template: '<div>Login</div>' }
      },
      {
        path: '/purchases',
        name: 'Purchases',
        component: { template: '<div>Purchases</div>' }
      }
    ]
  })
}

// Test Pinia instance
export const createTestPinia = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

// Enhanced mount function with common test utilities
export const mountWithPlugins = (
  component: Component,
  options: any = {}
): VueWrapper<any> => {
  const pinia = createTestPinia()
  const router = createTestRouter()

  return mount(component, {
    global: {
      plugins: [pinia, router],
      stubs: {
        'router-link': true,
        'router-view': true,
      },
      mocks: {
        $route: router.currentRoute.value,
        $router: router,
      },
    },
    ...options
  })
}

// Mock API responses
export const mockApiResponse = (data: any, status = 200) => {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {},
  }
}

// Mock API error
export const mockApiError = (message: string, status = 400) => {
  const error = new Error(message)
  ;(error as any).response = {
    data: { detail: message },
    status,
    statusText: 'Bad Request',
    headers: {},
    config: {},
  }
  return error
}

// Wait for next tick
export const nextTick = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock file for testing
export const createMockFile = (name: string, type: string, content: string) => {
  return new File([content], name, { type })
}

// Mock image file
export const createMockImageFile = (name = 'test.jpg') => {
  const canvas = document.createElement('canvas')
  canvas.width = 100
  canvas.height = 100
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = 'red'
    ctx.fillRect(0, 0, 100, 100)
  }
  
  return new Promise<File>(resolve => {
    canvas.toBlob(blob => {
      if (blob) {
        const file = new File([blob], name, { type: 'image/jpeg' })
        resolve(file)
      }
    }, 'image/jpeg')
  })
}

// Test data factories
export const createMockUser = (overrides: any = {}) => ({
  id: 1,
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  role: 'admin',
  is_active: true,
  ...overrides
})

export const createMockMaterial = (overrides: any = {}) => ({
  id: 1,
  name: 'Test Material',
  sku: 'TEST001',
  category: 1,
  default_unit: 1,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createMockPurchase = (overrides: any = {}) => ({
  id: 1,
  purchase_number: 'P0001',
  date: '2024-01-01',
  object: 1,
  supplier: 1,
  responsible: 1,
  status: 'new',
  total_amount: '1000.00',
  currency: 'UZS',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
})

export const createMockObject = (overrides: any = {}) => ({
  id: 1,
  name: 'Test Object',
  address: 'Test Address',
  responsible: 1,
  key_person: 'John Doe',
  key_person_phone: '+998901234567',
  start_date: '2024-01-01',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
})

// Test utilities for forms
export const fillForm = async (wrapper: VueWrapper<any>, formData: Record<string, any>) => {
  for (const [key, value] of Object.entries(formData)) {
    const input = wrapper.find(`[name="${key}"]`)
    if (input.exists()) {
      if (input.element.tagName === 'SELECT') {
        await input.setValue(value)
      } else {
        await input.setValue(value)
      }
    }
  }
}

// Test utilities for tables
export const getTableRows = (wrapper: VueWrapper<any>) => {
  return wrapper.findAll('tbody tr')
}

export const getTableHeaders = (wrapper: VueWrapper<any>) => {
  return wrapper.findAll('thead th')
}

// Test utilities for modals
export const openModal = async (wrapper: VueWrapper<any>, triggerSelector: string) => {
  await wrapper.find(triggerSelector).trigger('click')
  await nextTick()
}

export const closeModal = async (wrapper: VueWrapper<any>) => {
  const closeButton = wrapper.find('[aria-label="Закрыть"]')
  if (closeButton.exists()) {
    await closeButton.trigger('click')
    await nextTick()
  }
}

// Test utilities for navigation
export const navigateTo = async (wrapper: VueWrapper<any>, routeName: string) => {
  const router = wrapper.vm.$router
  await router.push({ name: routeName })
  await nextTick()
}

// Test utilities for API mocking
export const mockApiCall = (method: string, url: string, response: any) => {
  // eslint-disable-next-line no-undef
  const mockFn = vi.fn().mockResolvedValue(mockApiResponse(response))
  // This would be implemented based on your API mocking strategy
  return mockFn
}

// Test utilities for localStorage
export const mockLocalStorage = (data: Record<string, string>) => {
  Object.entries(data).forEach(([key, value]) => {
    localStorage.setItem(key, value)
  })
}

export const clearLocalStorage = () => {
  localStorage.clear()
}

// Test utilities for timers
export const advanceTimers = (ms: number) => {
  // eslint-disable-next-line no-undef
  vi.advanceTimersByTime(ms)
}

export const runAllTimers = () => {
  // eslint-disable-next-line no-undef
  vi.runAllTimers()
}

// Test utilities for async operations
export const waitFor = async (callback: () => boolean, timeout = 1000) => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (callback()) {
      return
    }
    await nextTick()
  }
  throw new Error(`Timeout waiting for condition after ${timeout}ms`)
}

// Test utilities for DOM
export const getByTestId = (wrapper: VueWrapper<any>, testId: string) => {
  return wrapper.find(`[data-testid="${testId}"]`)
}

export const getAllByTestId = (wrapper: VueWrapper<any>, testId: string) => {
  return wrapper.findAll(`[data-testid="${testId}"]`)
}