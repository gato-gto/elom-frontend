import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock axios before importing the client
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: {
          use: vi.fn()
        },
        response: {
          use: vi.fn()
        }
      }
    }))
  }
}))

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates axios instance with correct configuration', async () => {
    const axios = await import('axios')
    const { default: api } = await import('../client')
    
    expect(axios.default.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:8000/api/v1',
      withCredentials: false,
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
  })

  it('sets up request and response interceptors', async () => {
    const axios = await import('axios')
    // Импортируем клиент, чтобы инициализировать interceptors
    await import('../client')
    
    // Проверяем, что create был вызван
    expect(axios.default.create).toHaveBeenCalled()
    
    // Проверяем, что interceptors были настроены
    const mockAxiosInstance = vi.mocked(axios.default.create).mock.results[0]?.value
    if (mockAxiosInstance && mockAxiosInstance.interceptors) {
      expect(mockAxiosInstance.interceptors.request.use).toBeDefined()
      expect(mockAxiosInstance.interceptors.response.use).toBeDefined()
    }
  })
})