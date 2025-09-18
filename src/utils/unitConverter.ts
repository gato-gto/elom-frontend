// src/utils/unitConverter.ts
import type { ID } from '@/api/types'

/**
 * Утилиты для конвертации единиц измерения
 */

export interface ConversionResult {
  value: number
  unit: ID
  unitName: string
  originalValue: number
  originalUnit: ID
  originalUnitName: string
  conversionFactor: number
}

export interface ConversionOptions {
  precision?: number // Количество знаков после запятой
  showOriginal?: boolean // Показывать ли оригинальное значение
}

/**
 * Конвертирует значение из одной единицы в другую
 */
export function convertValue(
  value: number,
  fromUnitId: ID,
  toUnitId: ID,
  conversionFactor: number,
  options: ConversionOptions = {}
): ConversionResult {
  const { precision = 2, showOriginal = false } = options
  
  // Если единицы одинаковые, возвращаем исходное значение
  if (fromUnitId === toUnitId) {
    return {
      value: Number(value.toFixed(precision)),
      unit: toUnitId,
      unitName: '', // Будет заполнено извне
      originalValue: value,
      originalUnit: fromUnitId,
      originalUnitName: '', // Будет заполнено извне
      conversionFactor: 1
    }
  }
  
  const convertedValue = value * conversionFactor
  
  return {
    value: Number(convertedValue.toFixed(precision)),
    unit: toUnitId,
    unitName: '', // Будет заполнено извне
    originalValue: showOriginal ? value : convertedValue,
    originalUnit: fromUnitId,
    originalUnitName: '', // Будет заполнено извне
    conversionFactor
  }
}

/**
 * Форматирует результат конвертации для отображения
 */
export function formatConversionResult(
  result: ConversionResult,
  showOriginal: boolean = false
): string {
  if (showOriginal && result.originalValue !== result.value) {
    return `${result.value} ${result.unitName} (было: ${result.originalValue} ${result.originalUnitName})`
  }
  
  return `${result.value} ${result.unitName}`
}

/**
 * Создает опции для селекта единиц с возможностью конвертации
 */
export function createUnitOptions(
  units: Array<{ id: ID; name: string; code: string }>,
  currentUnitId: ID,
  convertibleUnits: ID[] = []
) {
  return units.map(unit => ({
    value: unit.id,
    label: unit.name,
    code: unit.code,
    disabled: false,
    isConvertible: convertibleUnits.includes(unit.id),
    isCurrent: unit.id === currentUnitId
  }))
}

/**
 * Валидирует коэффициент конвертации
 */
export function validateConversionFactor(factor: number): { valid: boolean; error?: string } {
  if (isNaN(factor)) {
    return { valid: false, error: 'Коэффициент должен быть числом' }
  }
  
  if (factor <= 0) {
    return { valid: false, error: 'Коэффициент должен быть больше 0' }
  }
  
  if (factor > 1000000) {
    return { valid: false, error: 'Коэффициент слишком большой' }
  }
  
  return { valid: true }
}

/**
 * Создает описание конвертации
 */
export function createConversionDescription(
  fromUnitName: string,
  toUnitName: string,
  factor: number
): string {
  if (factor === 1) {
    return `${fromUnitName} = ${toUnitName}`
  }
  
  if (factor > 1) {
    return `1 ${fromUnitName} = ${factor} ${toUnitName}`
  } else {
    return `1 ${toUnitName} = ${(1 / factor).toFixed(2)} ${fromUnitName}`
  }
}

/**
 * Предустановленные конвертации для популярных единиц
 */
export const COMMON_CONVERSIONS = {
  // Вес
  'kg_to_g': { factor: 1000, description: '1 кг = 1000 г' },
  'g_to_kg': { factor: 0.001, description: '1 г = 0.001 кг' },
  'kg_to_ton': { factor: 0.001, description: '1 кг = 0.001 т' },
  'ton_to_kg': { factor: 1000, description: '1 т = 1000 кг' },
  
  // Длина
  'm_to_cm': { factor: 100, description: '1 м = 100 см' },
  'cm_to_m': { factor: 0.01, description: '1 см = 0.01 м' },
  'm_to_mm': { factor: 1000, description: '1 м = 1000 мм' },
  'mm_to_m': { factor: 0.001, description: '1 мм = 0.001 м' },
  
  // Площадь
  'm2_to_cm2': { factor: 10000, description: '1 м² = 10000 см²' },
  'cm2_to_m2': { factor: 0.0001, description: '1 см² = 0.0001 м²' },
  
  // Объем
  'm3_to_l': { factor: 1000, description: '1 м³ = 1000 л' },
  'l_to_m3': { factor: 0.001, description: '1 л = 0.001 м³' },
  
  // Специальные для строительства
  'bag_to_kg': { factor: 25, description: '1 мешок = 25 кг' }, // Пример для цемента
  'kg_to_bag': { factor: 0.04, description: '1 кг = 0.04 мешка' },
  'piece_to_m': { factor: 6, description: '1 шт = 6 м' }, // Пример для труб
  'm_to_piece': { factor: 0.167, description: '1 м = 0.167 шт' }
}

/**
 * Получает предустановленную конвертацию по ключу
 */
export function getCommonConversion(key: string): { factor: number; description: string } | null {
  return COMMON_CONVERSIONS[key as keyof typeof COMMON_CONVERSIONS] || null
}

/**
 * Создает список популярных конвертаций для быстрого выбора
 */
export function getPopularConversions(): Array<{
  key: string
  factor: number
  description: string
  category: string
}> {
  return [
    { key: 'kg_to_g', factor: 1000, description: '1 кг = 1000 г', category: 'Вес' },
    { key: 'g_to_kg', factor: 0.001, description: '1 г = 0.001 кг', category: 'Вес' },
    { key: 'm_to_cm', factor: 100, description: '1 м = 100 см', category: 'Длина' },
    { key: 'cm_to_m', factor: 0.01, description: '1 см = 0.01 м', category: 'Длина' },
    { key: 'm2_to_cm2', factor: 10000, description: '1 м² = 10000 см²', category: 'Площадь' },
    { key: 'cm2_to_m2', factor: 0.0001, description: '1 см² = 0.0001 м²', category: 'Площадь' },
    { key: 'bag_to_kg', factor: 25, description: '1 мешок = 25 кг', category: 'Строительство' },
    { key: 'kg_to_bag', factor: 0.04, description: '1 кг = 0.04 мешка', category: 'Строительство' }
  ]
}
