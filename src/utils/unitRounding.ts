// src/utils/unitRounding.ts
/**
 * Умная система округления единиц измерения
 * Основана на логике из бэкенда с категориями и умными правилами
 */
import { formatNumberClean } from '@/utils/formatters'

export interface UnitRoundingRule {
  fromUnit: string
  toUnit: string
  factor: number
  category: string
  description: string
}

export interface SmartConversionResult {
  value: number
  unit: string
  originalValue: number
  originalUnit: string
  converted: boolean
  reason?: string
}

/**
 * Категории единиц измерения
 */
export const UNIT_CATEGORIES = {
  MASS: 'масса',
  LENGTH: 'длина', 
  AREA: 'площадь',
  VOLUME: 'объем',
  PIECES: 'штуки'
} as const

/**
 * Умные правила округления с категориями
 */
export const SMART_ROUNDING_RULES: UnitRoundingRule[] = [
  // Масса
  { fromUnit: 'г', toUnit: 'кг', factor: 1000, category: UNIT_CATEGORIES.MASS, description: '1000 г = 1 кг' },
  { fromUnit: 'кг', toUnit: 'т', factor: 1000, category: UNIT_CATEGORIES.MASS, description: '1000 кг = 1 т' },
  { fromUnit: 'г', toUnit: 'т', factor: 1000000, category: UNIT_CATEGORIES.MASS, description: '1000000 г = 1 т' },
  
  // Длина
  { fromUnit: 'мм', toUnit: 'см', factor: 10, category: UNIT_CATEGORIES.LENGTH, description: '10 мм = 1 см' },
  { fromUnit: 'см', toUnit: 'м', factor: 100, category: UNIT_CATEGORIES.LENGTH, description: '100 см = 1 м' },
  { fromUnit: 'м', toUnit: 'км', factor: 1000, category: UNIT_CATEGORIES.LENGTH, description: '1000 м = 1 км' },
  { fromUnit: 'мм', toUnit: 'м', factor: 1000, category: UNIT_CATEGORIES.LENGTH, description: '1000 мм = 1 м' },
  { fromUnit: 'см', toUnit: 'км', factor: 100000, category: UNIT_CATEGORIES.LENGTH, description: '100000 см = 1 км' },
  { fromUnit: 'мм', toUnit: 'км', factor: 1000000, category: UNIT_CATEGORIES.LENGTH, description: '1000000 мм = 1 км' },
  
  // Площадь
  { fromUnit: 'см²', toUnit: 'м²', factor: 10000, category: UNIT_CATEGORIES.AREA, description: '10000 см² = 1 м²' },
  { fromUnit: 'м²', toUnit: 'га', factor: 10000, category: UNIT_CATEGORIES.AREA, description: '10000 м² = 1 га' },
  { fromUnit: 'см²', toUnit: 'га', factor: 100000000, category: UNIT_CATEGORIES.AREA, description: '100000000 см² = 1 га' },
  
  // Объем
  { fromUnit: 'см³', toUnit: 'м³', factor: 1000000, category: UNIT_CATEGORIES.VOLUME, description: '1000000 см³ = 1 м³' },
  { fromUnit: 'л', toUnit: 'м³', factor: 1000, category: UNIT_CATEGORIES.VOLUME, description: '1000 л = 1 м³' },
  { fromUnit: 'мл', toUnit: 'л', factor: 1000, category: UNIT_CATEGORIES.VOLUME, description: '1000 мл = 1 л' },
  { fromUnit: 'мл', toUnit: 'м³', factor: 1000000, category: UNIT_CATEGORIES.VOLUME, description: '1000000 мл = 1 м³' },
]

/**
 * Умная конвертация единиц измерения
 * Основана на логике из бэкенда с проверкой "красивых" чисел
 * @param value - исходное значение
 * @param fromUnit - исходная единица измерения
 * @param rules - правила округления (по умолчанию используются умные правила)
 * @returns объект с результатом конвертации
 */
export function smartConvert(
  value: number,
  fromUnit: string,
  rules: UnitRoundingRule[] = SMART_ROUNDING_RULES
): SmartConversionResult {
  // Ищем все возможные правила для данной единицы
  const possibleRules = rules.filter(r => r.fromUnit === fromUnit)
  
  if (possibleRules.length === 0) {
    return {
      value,
      unit: fromUnit,
      originalValue: value,
      originalUnit: fromUnit,
      converted: false,
      reason: 'Нет правил конвертации для данной единицы'
    }
  }
  
  // Пробуем найти лучшее правило для конвертации
  for (const rule of possibleRules) {
    const convertedValue = value / rule.factor
    
    // Проверяем условия для конвертации
    if (shouldConvert(value, convertedValue, rule)) {
      return {
        value: convertedValue,
        unit: rule.toUnit,
        originalValue: value,
        originalUnit: fromUnit,
        converted: true,
        reason: rule.description
      }
    }
  }
  
  // Если ни одно правило не подходит, возвращаем исходное значение
  return {
    value,
    unit: fromUnit,
    originalValue: value,
    originalUnit: fromUnit,
    converted: false,
    reason: 'Значение не подходит для конвертации'
  }
}

/**
 * Определяет, стоит ли конвертировать значение
 * Основано на логике из бэкенда
 */
function shouldConvert(originalValue: number, convertedValue: number, rule: UnitRoundingRule): boolean {
  // 1. Проверяем, что значение >= 1 в целевой единице
  if (convertedValue < 1) {
    return false
  }
  
  // 2. Проверяем, что это "красивое" число (целое или с простой дробной частью)
  if (!isBeautifulNumber(convertedValue)) {
    return false
  }
  
  // 3. Проверяем, что не создаем слишком большие числа
  if (convertedValue > 1000000) {
    return false
  }
  
  // 4. Проверяем, что исходное значение делится нацело на коэффициент
  if (originalValue % rule.factor !== 0) {
    return false
  }
  
  return true
}

/**
 * Проверяет, является ли число "красивым"
 * Красивые числа: целые, 0.5, 0.25, 0.75, 0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9
 */
function isBeautifulNumber(value: number): boolean {
  // Целое число
  if (Number.isInteger(value)) {
    return true
  }
  
  // Проверяем простые дроби
  const fractionalPart = value - Math.floor(value)
  const beautifulFractions = [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9]
  
  return beautifulFractions.some(frac => Math.abs(fractionalPart - frac) < 0.001)
}

/**
 * Округляет значение от меньшей единицы к большей (упрощенная версия)
 * @deprecated Используйте smartConvert для более умной логики
 */
export function roundToLargerUnit(
  value: number,
  fromUnit: string,
  rules: UnitRoundingRule[] = SMART_ROUNDING_RULES
): { value: number; unit: string; rounded: boolean; description?: string } {
  const result = smartConvert(value, fromUnit, rules)
  return {
    value: result.value,
    unit: result.unit,
    rounded: result.converted,
    description: result.reason
  }
}

/**
 * Форматирует значение с единицей измерения
 * @param value - значение
 * @param unit - единица измерения
 * @param precision - количество знаков после запятой
 * @returns отформатированная строка
 */
export function formatValueWithUnit(
  value: number,
  unit: string,
  precision: number = 2
): string {
  // Используем умное форматирование без лишних нулей
  const formattedValue = formatNumberClean(value)
  return `${formattedValue} ${unit}`
}

/**
 * Автоматически конвертирует и форматирует значение
 * @param value - исходное значение
 * @param fromUnit - исходная единица измерения
 * @param precision - количество знаков после запятой
 * @returns отформатированная строка с конвертированным значением
 */
export function autoSmartConvertAndFormat(
  value: number,
  fromUnit: string,
  precision: number = 2
): string {
  const result = smartConvert(value, fromUnit)
  return formatValueWithUnit(result.value, result.unit, precision)
}

/**
 * Автоматически округляет и форматирует значение (упрощенная версия)
 * @deprecated Используйте autoSmartConvertAndFormat для более умной логики
 */
export function autoRoundAndFormat(
  value: number,
  fromUnit: string,
  precision: number = 2
): string {
  return autoSmartConvertAndFormat(value, fromUnit, precision)
}

/**
 * Получает лучшее представление значения с единицей
 * @param value - значение
 * @param unit - единица измерения
 * @param precision - точность
 * @returns объект с лучшим представлением
 */
export function getBestUnitRepresentation(
  value: number,
  unit: string,
  _precision: number = 2 // Не используется
): SmartConversionResult {
  return smartConvert(value, unit)
}

/**
 * Примеры использования:
 * 
 * smartConvert(1000, 'г') // { value: 1, unit: 'кг', converted: true, reason: '1000 г = 1 кг' }
 * smartConvert(1123, 'г') // { value: 1123, unit: 'г', converted: false, reason: 'Значение не подходит для конвертации' }
 * smartConvert(100, 'мм') // { value: 10, unit: 'см', converted: true, reason: '10 мм = 1 см' }
 * smartConvert(213, 'мм') // { value: 213, unit: 'мм', converted: false, reason: 'Значение не подходит для конвертации' }
 * smartConvert(1500, 'г') // { value: 1.5, unit: 'кг', converted: true, reason: '1000 г = 1 кг' }
 * 
 * autoSmartConvertAndFormat(1000, 'г') // "1 кг"
 * autoSmartConvertAndFormat(1123, 'г') // "1123 г"
 * autoSmartConvertAndFormat(100, 'мм') // "10 см"
 * autoSmartConvertAndFormat(213, 'мм') // "213 мм"
 * autoSmartConvertAndFormat(1500, 'г') // "1.5 кг"
 */
