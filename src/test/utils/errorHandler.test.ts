/**
 * Тесты для обработчика ошибок
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleApiErrorAsync, parseNestedErrors, handleFormError } from '@/utils/errorHandler'

// Мокаем useNotifications
const mockShowError = vi.fn()
const mockShowWarning = vi.fn()

vi.mock('@/composables/useNotifications', () => ({
  useNotifications: () => ({
    showError: mockShowError,
    showWarning: mockShowWarning
  })
}))

describe('Error Handler Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('parseNestedErrors', () => {
    it('should parse simple field errors', () => {
      const errors = {
        name: ['Это поле обязательно'],
        email: ['Введите корректный email']
      }
      
      const result = parseNestedErrors(errors)
      
      expect(result).toEqual({
        name: ['Это поле обязательно'],
        email: ['Введите корректный email']
      })
    })

    it('should parse nested array errors', () => {
      const errors = {
        items: [
          {
            material: ['Недопустимый первичный ключ "0" - объект не существует.'],
            unit: ['Недопустимый первичный ключ "0" - объект не существует.'],
            quantity: ['Убедитесь, что это значение больше либо равно 0.001.']
          }
        ]
      }
      
      const result = parseNestedErrors(errors)
      
      expect(result).toEqual({
        'items[0].material': ['Недопустимый первичный ключ "0" - объект не существует.'],
        'items[0].unit': ['Недопустимый первичный ключ "0" - объект не существует.'],
        'items[0].quantity': ['Убедитесь, что это значение больше либо равно 0.001.']
      })
    })

    it('should parse multiple items errors', () => {
      const errors = {
        items: [
          {
            material: ['Недопустимый первичный ключ "0" - объект не существует.']
          },
          {
            quantity: ['Убедитесь, что это значение больше либо равно 0.001.'],
            price: ['Цена должна быть положительной']
          }
        ]
      }
      
      const result = parseNestedErrors(errors)
      
      expect(result).toEqual({
        'items[0].material': ['Недопустимый первичный ключ "0" - объект не существует.'],
        'items[1].quantity': ['Убедитесь, что это значение больше либо равно 0.001.'],
        'items[1].price': ['Цена должна быть положительной']
      })
    })

    it('should parse nested object errors', () => {
      const errors = {
        object: {
          name: ['Название объекта обязательно'],
          location: ['Адрес не может быть пустым']
        }
      }
      
      const result = parseNestedErrors(errors)
      
      expect(result).toEqual({
        'object.name': ['Название объекта обязательно'],
        'object.location': ['Адрес не может быть пустым']
      })
    })

    it('should parse mixed errors', () => {
      const errors = {
        name: ['Это поле обязательно'],
        items: [
          {
            material: ['Недопустимый первичный ключ "0" - объект не существует.']
          }
        ],
        object: {
          name: ['Название объекта обязательно']
        }
      }
      
      const result = parseNestedErrors(errors)
      
      expect(result).toEqual({
        name: ['Это поле обязательно'],
        'items[0].material': ['Недопустимый первичный ключ "0" - объект не существует.'],
        'object.name': ['Название объекта обязательно']
      })
    })

    it('should handle empty errors', () => {
      const errors = {}
      const result = parseNestedErrors(errors)
      expect(result).toEqual({})
    })

    it('should handle null/undefined values', () => {
      const errors = {
        name: null,
        email: undefined,
        items: []
      }
      
      const result = parseNestedErrors(errors)
      expect(result).toEqual({})
    })

    it('should handle deeply nested objects', () => {
      const errors = {
        level1: {
          level2: {
            level3: ['Deep error']
          }
        }
      }
      
      const result = parseNestedErrors(errors)
      
      expect(result).toEqual({
        'level1.level2.level3': ['Deep error']
      })
    })

    it('should handle mixed arrays and objects', () => {
      const errors = {
        companies: [
          {
            employees: [
              {
                name: ['Employee name required'],
                contacts: {
                  email: ['Invalid email']
                }
              }
            ]
          }
        ]
      }
      
      const result = parseNestedErrors(errors)
      
      expect(result).toEqual({
        'companies[0].employees[0].name': ['Employee name required'],
        'companies[0].employees[0].contacts.email': ['Invalid email']
      })
    })
  })

  describe('handleApiErrorAsync', () => {
    it('should handle error with detail message', async () => {
      const error = {
        response: {
          status: 400,
          data: {
            detail: 'Specific error occurred'
          }
        }
      }
      
      const context = {
        operation: 'dataLoading' as const,
        entity: 'materials'
      }
      
      await handleApiErrorAsync(error, context)
      
      expect(mockShowError).toHaveBeenCalledWith('Specific error occurred')
    })

    it('should handle validation errors', async () => {
      const error = {
        response: {
          status: 400,
          data: {
            detail: 'Validation error',
            errors: {
              name: ['Это поле обязательно'],
              email: ['Неверный формат email']
            }
          }
        }
      }
      
      const context = {
        operation: 'formValidation' as const,
        entity: 'users'
      }
      
      await handleApiErrorAsync(error, context)
      
      expect(mockShowError).toHaveBeenCalledWith('Ошибка валидации данных')
    })

    it('should handle 401 unauthorized', async () => {
      const error = {
        response: {
          status: 401,
          data: {
            detail: 'Authentication credentials were not provided.'
          }
        }
      }
      
      const context = {
        operation: 'dataLoading' as const,
        entity: 'materials'
      }
      
      await handleApiErrorAsync(error, context)
      
      expect(mockShowError).toHaveBeenCalledWith('Требуется авторизация')
    })

    it('should handle 403 forbidden', async () => {
      const error = {
        response: {
          status: 403,
          data: {
            detail: 'You do not have permission to perform this action.'
          }
        }
      }
      
      const context = {
        operation: 'delete' as const,
        entity: 'tools'
      }
      
      await handleApiErrorAsync(error, context)
      
      expect(mockShowError).toHaveBeenCalledWith('Недостаточно прав для выполнения операции')
    })

    it('should handle 404 not found', async () => {
      const error = {
        response: {
          status: 404,
          data: {
            detail: 'Not found.'
          }
        }
      }
      
      const context = {
        operation: 'dataLoading' as const,
        entity: 'purchase'
      }
      
      await handleApiErrorAsync(error, context)
      
      expect(mockShowError).toHaveBeenCalledWith('Запрашиваемый ресурс не найден')
    })

    it('should handle 500 server error', async () => {
      const error = {
        response: {
          status: 500,
          data: {
            detail: 'Internal server error'
          }
        }
      }
      
      const context = {
        operation: 'create' as const,
        entity: 'materials'
      }
      
      await handleApiErrorAsync(error, context)
      
      expect(mockShowError).toHaveBeenCalledWith('Внутренняя ошибка сервера')
    })

    it('should handle network errors', async () => {
      const error = {
        message: 'Network Error',
        code: 'NETWORK_ERROR'
      }
      
      const context = {
        operation: 'dataLoading' as const,
        entity: 'materials'
      }
      
      await handleApiErrorAsync(error, context)
      
      expect(mockShowError).toHaveBeenCalledWith('Ошибка сети. Проверьте подключение к интернету.')
    })

    it('should handle timeout errors', async () => {
      const error = {
        message: 'timeout of 5000ms exceeded',
        code: 'ECONNABORTED'
      }
      
      const context = {
        operation: 'create' as const,
        entity: 'purchases'
      }
      
      await handleApiErrorAsync(error, context)
      
      expect(mockShowError).toHaveBeenCalledWith('Превышено время ожидания ответа сервера')
    })

    it('should handle unknown errors with fallback message', async () => {
      const error = {
        message: 'Something went wrong'
      }
      
      const context = {
        operation: 'update' as const,
        entity: 'objects'
      }
      
      await handleApiErrorAsync(error, context)
      
      expect(mockShowError).toHaveBeenCalledWith('Произошла неизвестная ошибка при обновлении objects')
    })

    it('should use entity-specific messages for different operations', async () => {
      const error = {
        response: {
          status: 400,
          data: {
            detail: 'Bad request'
          }
        }
      }
      
      // Test different operations
      const operations = [
        { operation: 'dataLoading' as const, expectedMessage: 'Bad request' },
        { operation: 'create' as const, expectedMessage: 'Bad request' },
        { operation: 'update' as const, expectedMessage: 'Bad request' },
        { operation: 'delete' as const, expectedMessage: 'Bad request' },
        { operation: 'formValidation' as const, expectedMessage: 'Bad request' }
      ]
      
      for (const { operation, expectedMessage } of operations) {
        mockShowError.mockClear()
        
        await handleApiErrorAsync(error, {
          operation,
          entity: 'test'
        })
        
        expect(mockShowError).toHaveBeenCalledWith(expectedMessage)
      }
    })
  })

  describe('handleFormError', () => {
    it('should handle form validation errors', async () => {
      const error = {
        response: {
          status: 400,
          data: {
            detail: 'Validation error',
            errors: {
              name: ['Это поле обязательно'],
              'items[0].quantity': ['Количество должно быть положительным']
            }
          }
        }
      }
      
      await handleFormError(error, 'material')
      
      expect(mockShowError).toHaveBeenCalledWith('Ошибка валидации формы')
    })

    it('should handle form errors without validation details', async () => {
      const error = {
        response: {
          status: 400,
          data: {
            detail: 'Form submission failed'
          }
        }
      }
      
      await handleFormError(error, 'purchase')
      
      expect(mockShowError).toHaveBeenCalledWith('Form submission failed')
    })

    it('should handle network errors in forms', async () => {
      const error = {
        message: 'Network Error'
      }
      
      await handleFormError(error, 'tool')
      
      expect(mockShowError).toHaveBeenCalledWith('Ошибка сети. Проверьте подключение к интернету.')
    })
  })

  describe('Edge Cases', () => {
    it('should handle error without response', async () => {
      const error = {
        message: 'Request failed'
      }
      
      const context = {
        operation: 'dataLoading' as const,
        entity: 'materials'
      }
      
      await handleApiErrorAsync(error, context)
      
      expect(mockShowError).toHaveBeenCalledWith('Произошла неизвестная ошибка при загрузке materials')
    })

    it('should handle error with empty response data', async () => {
      const error = {
        response: {
          status: 400,
          data: null
        }
      }
      
      const context = {
        operation: 'create' as const,
        entity: 'tools'
      }
      
      await handleApiErrorAsync(error, context)
      
      expect(mockShowError).toHaveBeenCalledWith('Произошла неизвестная ошибка при создании tools')
    })

    it('should handle parseNestedErrors with circular references', () => {
      const obj: any = { name: ['Error'] }
      obj.circular = obj
      
      // Should not throw error and should parse what it can
      const result = parseNestedErrors(obj)
      
      expect(result).toHaveProperty('name')
      expect(result.name).toEqual(['Error'])
    })
  })
})

