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
    const mockAxiosInstance = {
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }
    
    vi.mocked(axios.default.create).mockReturnValue(mockAxiosInstance as any)
    
    await import('../client')
    
    expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled()
    expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled()
  })
})