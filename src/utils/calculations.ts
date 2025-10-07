// Utility functions for client-side calculations

/**
 * Вычисляет сумму позиции закупки
 */
export function calculateItemAmount(quantity: number | string, price: number | string): number {
  const qty = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
  const prc = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(qty) || isNaN(prc)) {
    return 0;
  }
  
  return qty * prc;
}

/**
 * Вычисляет общую сумму закупки
 */
export function calculatePurchaseTotal(items: Array<{ quantity: number | string; price: number | string }>): number {
  return items.reduce((total, item) => {
    return total + calculateItemAmount(item.quantity, item.price);
  }, 0);
}

/**
 * Форматирует число как валюту
 */
export function formatCurrency(amount: number, currency: string = 'RUB'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Форматирует число с заданным количеством знаков после запятой
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

