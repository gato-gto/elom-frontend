/**
 * Валидаторы для форм
 * 
 * Каждый валидатор - это чистая функция, которая принимает значение и конфигурацию поля,
 * и возвращает сообщение об ошибке или null если валидация прошла успешно.
 */

export interface FieldConfig {
  key: string
  label: string
  required?: boolean
  validation?: {
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: RegExp
    custom?: (value: any) => string | null
  }
}

export type Validator = (value: any, field: FieldConfig) => string | null

/**
 * Валидатор обязательного поля
 */
export const requiredValidator: Validator = (value, field) => {
  if (!field.required) {return null}
  
  if (value === null || value === undefined) {
    return `${field.label} обязательно для заполнения`
  }
  
  if (typeof value === 'string' && !value.trim()) {
    return `${field.label} обязательно для заполнения`
  }
  
  if (Array.isArray(value) && value.length === 0) {
    return `${field.label} обязательно для заполнения`
  }
  
  return null
}

/**
 * Валидатор минимальной длины строки
 */
export const minLengthValidator: Validator = (value, field) => {
  if (!field.validation?.minLength) {return null}
  if (typeof value !== 'string') {return null}
  
  if (value.length < field.validation.minLength) {
    return `${field.label} должно содержать минимум ${field.validation.minLength} символов`
  }
  
  return null
}

/**
 * Валидатор максимальной длины строки
 */
export const maxLengthValidator: Validator = (value, field) => {
  if (!field.validation?.maxLength) {return null}
  if (typeof value !== 'string') {return null}
  
  if (value.length > field.validation.maxLength) {
    return `${field.label} должно содержать максимум ${field.validation.maxLength} символов`
  }
  
  return null
}

/**
 * Валидатор минимального значения числа
 */
export const minValueValidator: Validator = (value, field) => {
  if (field.validation?.min === undefined) {return null}
  if (typeof value !== 'number') {return null}
  
  if (value < field.validation.min) {
    return `${field.label} должно быть не менее ${field.validation.min}`
  }
  
  return null
}

/**
 * Валидатор максимального значения числа
 */
export const maxValueValidator: Validator = (value, field) => {
  if (field.validation?.max === undefined) {return null}
  if (typeof value !== 'number') {return null}
  
  if (value > field.validation.max) {
    return `${field.label} должно быть не более ${field.validation.max}`
  }
  
  return null
}

/**
 * Валидатор регулярного выражения
 */
export const patternValidator: Validator = (value, field) => {
  if (!field.validation?.pattern) {return null}
  if (typeof value !== 'string') {return null}
  if (!value) {return null} // Пустые значения проверяются requiredValidator
  
  if (!field.validation.pattern.test(value)) {
    return `${field.label} имеет неверный формат`
  }
  
  return null
}

/**
 * Валидатор email
 */
export const emailValidator: Validator = (value, field) => {
  if (typeof value !== 'string') {return null}
  if (!value) {return null}
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    return `${field.label} должен быть корректным email адресом`
  }
  
  return null
}

/**
 * Валидатор URL
 */
export const urlValidator: Validator = (value, field) => {
  if (typeof value !== 'string') {return null}
  if (!value) {return null}
  
  try {
    new URL(value)
    return null
  } catch {
    return `${field.label} должен быть корректным URL`
  }
}

/**
 * Валидатор кастомной функции
 */
export const customValidator: Validator = (value, field) => {
  if (!field.validation?.custom) {return null}
  
  return field.validation.custom(value)
}

/**
 * Список всех стандартных валидаторов в порядке выполнения
 */
export const defaultValidators: Validator[] = [
  requiredValidator,
  minLengthValidator,
  maxLengthValidator,
  minValueValidator,
  maxValueValidator,
  patternValidator,
  emailValidator,
  urlValidator,
  customValidator
]

/**
 * Выполнить валидацию значения со всеми валидаторами
 * 
 * @param value - Значение для валидации
 * @param field - Конфигурация поля
 * @param validators - Список валидаторов (по умолчанию defaultValidators)
 * @returns Сообщение об ошибке или null
 */
export function validateValue(
  value: any,
  field: FieldConfig,
  validators: Validator[] = defaultValidators
): string | null {
  for (const validator of validators) {
    const error = validator(value, field)
    if (error) {
      return error
    }
  }
  
  return null
}

