/**
 * Тесты для проверки парсинга ошибок валидации
 */

import { parseNestedErrors } from '@/utils/errorHandler'
import { describe, test, expect } from 'vitest'

describe('Validation Error Parsing', () => {
  test('should parse simple field errors', () => {
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

  test('should parse nested array errors (items[0].material)', () => {
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

  test('should parse multiple items errors', () => {
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

  test('should parse nested object errors', () => {
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

  test('should parse mixed errors', () => {
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

  test('should handle empty errors', () => {
    const errors = {}
    const result = parseNestedErrors(errors)
    expect(result).toEqual({})
  })

  test('should handle null/undefined values', () => {
    const errors = {
      name: null,
      email: undefined,
      items: []
    }
    
    const result = parseNestedErrors(errors)
    expect(result).toEqual({})
  })
})

/**
 * Пример реальной ошибки API для тестирования
 */
export const EXAMPLE_API_ERROR = {
  "detail": "Validation error",
  "errors": {
    "items": [
      {
        "material": [
          "Недопустимый первичный ключ \"0\" - объект не существует."
        ],
        "unit": [
          "Недопустимый первичный ключ \"0\" - объект не существует."
        ],
        "quantity": [
          "Убедитесь, что это значение больше либо равно 0.001."
        ]
      }
    ]
  }
}

/**
 * Ожидаемый результат парсинга
 */
export const EXPECTED_PARSED_ERROR = {
  'items[0].material': ['Недопустимый первичный ключ "0" - объект не существует.'],
  'items[0].unit': ['Недопустимый первичный ключ "0" - объект не существует.'],
  'items[0].quantity': ['Убедитесь, что это значение больше либо равно 0.001.']
}
