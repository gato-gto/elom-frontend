import { describe, it, expect, beforeEach, vi } from 'vitest'
import api from '../client'

// Mock fetch
global.fetch = vi.fn()

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('makes GET request successfully', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ data: 'test' })
    }
    
    vi.mocked(fetch).mockResolvedValue(mockResponse as any)
    
    const result = await api.get('/test-endpoint')
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-endpoint'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    )
  })

  it('makes POST request with data', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ success: true })
    }
    
    vi.mocked(fetch).mockResolvedValue(mockResponse as any)
    
    const testData = { name: 'Test Material' }
    await api.post('/materials/', testData)
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/materials/'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(testData),
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    )
  })

  it('includes authorization header when token exists', async () => {
    localStorage.setItem('access_token', 'test-token')
    
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ data: 'test' })
    }
    
    vi.mocked(fetch).mockResolvedValue(mockResponse as any)
    
    await api.get('/protected-endpoint')
    
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        })
      })
    )
  })

  it('handles 401 error and refreshes token', async () => {
    localStorage.setItem('access_token', 'expired-token')
    localStorage.setItem('refresh_token', 'refresh-token')
    
    // First request returns 401
    const unauthorizedResponse = {
      ok: false,
      status: 401,
      json: () => Promise.resolve({ detail: 'Token expired' })
    }
    
    // Token refresh response
    const refreshResponse = {
      ok: true,
      json: () => Promise.resolve({ access: 'new-token' })
    }
    
    // Second request with new token succeeds
    const successResponse = {
      ok: true,
      json: () => Promise.resolve({ data: 'success' })
    }
    
    vi.mocked(fetch)
      .mockResolvedValueOnce(unauthorizedResponse as any)
      .mockResolvedValueOnce(refreshResponse as any)
      .mockResolvedValueOnce(successResponse as any)
    
    const result = await api.get('/protected-endpoint')
    
    expect(fetch).toHaveBeenCalledTimes(3)
    expect(localStorage.getItem('access_token')).toBe('new-token')
  })

  it('handles network errors', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))
    
    await expect(api.get('/test-endpoint')).rejects.toThrow('Network error')
  })

  it('handles JSON parsing errors', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.reject(new Error('Invalid JSON'))
    }
    
    vi.mocked(fetch).mockResolvedValue(mockResponse as any)
    
    await expect(api.get('/test-endpoint')).rejects.toThrow('Invalid JSON')
  })
})
