import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

// Setup Pinia for tests
const pinia = createPinia()
setActivePinia(pinia)

// Mock global objects
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock canvas for PDF generation
// eslint-disable-next-line no-undef
Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  value: vi.fn(() => 'data:image/png;base64,test')
})

// Mock window.open for export functions
Object.defineProperty(window, 'open', {
  value: vi.fn(() => ({
    document: {
      write: vi.fn(),
      close: vi.fn()
    },
    close: vi.fn()
  }))
})

// NOTE: File and FormData are provided natively by the jsdom environment and must NOT be
// mocked here — the previous vi.fn() File mock used an arrow implementation that throws when
// invoked with `new File(...)` (arrow functions are not constructors), breaking every
// multipart upload test. jsdom's real File/FormData are correct and constructable.

// Mock fetch
global.fetch = vi.fn()

// Mock window.__piniaStores
Object.defineProperty(window, '__piniaStores', {
  value: {},
  writable: true
})

// Global test configuration
config.global.mocks = {
  $t: (key: string) => key,
  $tc: (key: string) => key,
  $te: (key: string) => true,
  $d: (value: any) => value,
  $n: (value: any) => value,
}

// Global plugins
config.global.plugins = [pinia]

// Mock console methods in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock process.env
process.env.VITE_API_URL = 'http://localhost:8000/api/v1'
process.env.VITE_APP_TITLE = 'ELOM'
process.env.VITE_APP_VERSION = '1.0.0'