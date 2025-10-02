import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ErrorHandlers, parseApiError } from '../errorHandler'

// Mock UI store
vi.mock('@/stores/ui', () => ({
  useUiStore: () => ({
    toast: vi.fn()
  })
}))

describe('ErrorHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('formValidation', () => {
    it('handles validation errors correctly', async () => {
      const error = {
        response: {
          status: 400,
          data: {
            errors: {
              name: 'This field is required',
              email: 'Enter a valid email address'
            }
          }
        }
      }

      const result = await ErrorHandlers.formValidation(error)

      expect(result.fieldErrors).toEqual({
        name: 'This field is required',
        email: 'Enter a valid email address'
      })
      expect(result.hasErrors).toBe(true)
      expect(result.statusCode).toBe(400)
    })

    it('handles general errors correctly', async () => {
      const error = {
        response: {
          status: 500,
          data: {
            detail: 'Something went wrong'
          }
        }
      }

      const result = await ErrorHandlers.formValidation(error)

      expect(result.fieldErrors).toEqual({})
      expect(result.detail).toBe('Something went wrong')
      expect(result.statusCode).toBe(500)
    })

    it('handles non-response errors correctly', async () => {
      const error = new Error('Network error')

      const result = await ErrorHandlers.formValidation(error)

      expect(result.fieldErrors).toEqual({})
      expect(result.detail).toBe('Network error')
      expect(result.statusCode).toBe(0)
    })

    it('handles empty response data correctly', async () => {
      const error = {
        response: {
          status: 400,
          data: {}
        }
      }

      const result = await ErrorHandlers.formValidation(error)

      expect(result.fieldErrors).toEqual({})
      expect(result.detail).toBe('Произошла неизвестная ошибка')
      expect(result.statusCode).toBe(400)
    })
  })

  describe('dataLoading', () => {
    it('handles loading errors correctly', async () => {
      const error = {
        response: {
          status: 500,
          data: {
            detail: 'Loading failed'
          }
        }
      }

      const result = await ErrorHandlers.dataLoading(error)

      expect(result.detail).toBe('Loading failed')
      expect(result.statusCode).toBe(500)
    })
  })

  describe('save', () => {
    it('handles save errors correctly', async () => {
      const error = {
        response: {
          status: 400,
          data: {
            detail: 'Save failed'
          }
        }
      }

      const result = await ErrorHandlers.save(error)

      expect(result.detail).toBe('Save failed')
      expect(result.statusCode).toBe(400)
    })
  })

  describe('delete', () => {
    it('handles delete errors correctly', async () => {
      const error = {
        response: {
          status: 500,
          data: {
            detail: 'Delete failed'
          }
        }
      }

      const result = await ErrorHandlers.delete(error)

      expect(result.detail).toBe('Delete failed')
      expect(result.statusCode).toBe(500)
    })

    it('handles non-response errors correctly', async () => {
      const error = new Error('Delete error')

      const result = await ErrorHandlers.delete(error)

      expect(result.detail).toBe('Delete error')
      expect(result.statusCode).toBe(0)
    })
  })

  describe('auth', () => {
    it('handles auth errors correctly', async () => {
      const error = {
        response: {
          status: 401,
          data: {
            detail: 'Unauthorized'
          }
        }
      }

      const result = await ErrorHandlers.auth(error)

      expect(result.detail).toBe('Unauthorized')
      expect(result.statusCode).toBe(401)
    })
  })

  describe('permission', () => {
    it('handles permission errors correctly', async () => {
      const error = {
        response: {
          status: 403,
          data: {
            detail: 'Forbidden'
          }
        }
      }

      const result = await ErrorHandlers.permission(error)

      expect(result.detail).toBe('Forbidden')
      expect(result.statusCode).toBe(403)
    })
  })

  describe('export', () => {
    it('handles export errors correctly', async () => {
      const error = {
        response: {
          status: 500,
          data: {
            detail: 'Export failed'
          }
        }
      }

      const result = await ErrorHandlers.export(error)

      expect(result.detail).toBe('Export failed')
      expect(result.statusCode).toBe(500)
    })
  })
})

describe('parseApiError', () => {
  it('parses validation errors correctly', () => {
    const error = {
      response: {
        status: 400,
        data: {
          errors: {
            name: 'This field is required'
          }
        }
      }
    }

    const result = parseApiError(error)

    expect(result.fieldErrors).toEqual({
      name: 'This field is required'
    })
    expect(result.hasErrors).toBe(true)
    expect(result.statusCode).toBe(400)
    expect(result.errorType).toBe('validation')
  })

  it('parses network errors correctly', () => {
    const error = new Error('Network error')

    const result = parseApiError(error)

    expect(result.detail).toBe('Network error')
    expect(result.statusCode).toBe(0)
    expect(result.errorType).toBe('network')
  })

  it('parses server errors correctly', () => {
    const error = {
      response: {
        status: 500,
        data: {
          detail: 'Internal server error'
        }
      }
    }

    const result = parseApiError(error)

    expect(result.detail).toBe('Internal server error')
    expect(result.statusCode).toBe(500)
    expect(result.errorType).toBe('server_error')
  })
})