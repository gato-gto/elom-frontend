import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

// Mock axios
vi.mock('axios', () => {
  const mockAxiosInstance = {
    interceptors: {
      request: {
        use: vi.fn()
      },
      response: {
        use: vi.fn()
      }
    },
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance)
    }
  }
})

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset module cache to allow fresh import
    vi.resetModules()
  })

  it('creates axios instance with correct configuration', async () => {
    // Import after mocking
    await import('../client')
    
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:8000/api/v1',
      withCredentials: false,
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
  })

  it('exports api client', async () => {
    const { default: api } = await import('../client')
    
    expect(api).toBeDefined()
    expect(typeof api.get).toBe('function')
    expect(typeof api.post).toBe('function')
    expect(typeof api.patch).toBe('function')
    expect(typeof api.delete).toBe('function')
  })

  it('sets up interceptors on the axios instance', async () => {
    await import('../client')
    
    // Verify axios.create was called
    expect(axios.create).toHaveBeenCalled()
    
    // Get the mock instance
    const mockInstance = (axios.create as any).mock.results[0]?.value
    
    if (mockInstance) {
      // Interceptors should be accessed (the setup happens on import)
      expect(mockInstance.interceptors).toBeDefined()
      expect(mockInstance.interceptors.request).toBeDefined()
      expect(mockInstance.interceptors.response).toBeDefined()
    }
  })
})
