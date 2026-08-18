// src/utils/unitRounding.ts
/**
 * Умная система округления единиц измерения
 * Основана на логике из бэкенда с категориями и умными правилами
 */
import { formatNumberWithOptions } from '@/utils/formatters'

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
  // 1. Проверяем, что значение >= 1 в целевой единице (0,25 кг оставляем как 250 г — короче/понятнее)
  if (convertedValue < 1) {
    return false
  }

  // 2. Проверяем, что не создаём слишком большие числа
  if (convertedValue > 1000000) {
    return false
  }

  // 3. F-868 (решение владельца — «разрешить красивые дроби»): раньше здесь стояло integer-only
  //    условие `originalValue % factor !== 0`, из-за которого 1500 м показывалось «1 500 м», а не
  //    «1,5 км» (и это противоречило и превью, которое видел владелец, и док-контракту внизу файла).
  //    Теперь укрупняем и дробные, НО только когда значение в целевой единице ТОЧНОЕ — кратно 0,05
  //    (шаг «красивых» дробей). Иначе округление (formatNumber → 2 знака) исказило бы реальное число
  //    (1499,9 м не должно превращаться в «1,5 км»), а владелец требует «видно реально».
  const steps = (originalValue / rule.factor) * 20 // 20 = 1/0,05
  if (!Number.isFinite(steps) || Math.abs(steps - Math.round(steps)) > 1e-9) {
    return false
  }

  // 4. Итог — «красивое» число (целое / 0.5 / 0.25 / 0.75 / 0.1-сетка). Сетка 0,05 из (3) шире,
  //    поэтому «некрасивые» шаги (1,05 · 1,15 · 1,35 …) отсекаем — оставляем в исходной единице.
  if (!isBeautifulNumber(convertedValue)) {
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
  _precision: number = 2
): string {
  // F-867: разделители тысяч + без хвостовых нулей — «9 750 км», «1 234 м», «1,5 км».
  // F-876: до 6 знаков после запятой (BE quantity/current_balance хранит decimal_places 3..6), а не 2
  // как formatNumber — иначе реальный остаток «0,001 т» печатался как «0 т» (владелец: «видно реально»).
  // minimumFractionDigits:0 → целые без хвостовых нулей («9 750 км»), дробные сохраняют точность.
  const formattedValue = formatNumberWithOptions(value, { minimumFractionDigits: 0, maximumFractionDigits: 6 })
  return unit ? `${formattedValue} ${unit}` : formattedValue
}

/**
 * F-867 (выбор владельца «умная единица, одно число»): единый вывод количества — конвертирует в
 * удобную единицу ОДНИМ числом (250000 м → «250 км»), а если не делится красиво — исходное
 * значение с разделителями тысяч («1 234 м»). Без дубля «250 км (250000 м)», реальное видно.
 */
export function formatSmartQuantity(value: number | string | null | undefined, unit?: string): string {
  if (value === null || value === undefined || value === '') { return '—' }
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) { return '—' }
  const r = smartConvert(num, unit || '')
  return formatValueWithUnit(r.value, r.unit)
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
  unit: string
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
