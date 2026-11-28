import { describe, it, expect } from 'vitest'
import { DEFAULT_VAT_RATE, VAT_RATES, grossToNetPrice, isInvalidDecimal, lineVatIncluded, netToGrossPrice, totalVatIncluded } from '../vat'

// F-1142: ожидания посчитаны вручную (не формулой модуля). Договор №1163 (P0007, 27.11): цена без НДС 12 589,29,
// 1000 м, ставка 12 %; в договоре «с учётом НДС» 14 100 000,32 — расхождение в тийинах из-за округлённой цены без НДС.
describe('ставки', () => {
  it('по умолчанию 12 %, выбор 12 / 6 / 0', () => {
    expect(DEFAULT_VAT_RATE).toBe(12)
    expect([...VAT_RATES]).toEqual([12, 6, 0])
  })
})

describe('цена без НДС → цена с НДС', () => {
  it('договор №1163: 12 589,29 × 1,12 = 14 100,0048 → 14 100,00', () => {
    expect(netToGrossPrice('12589.29', 12)).toBe('14100.00')
  })
  it('круглые значения и ставка 6 %', () => {
    expect(netToGrossPrice('100', 12)).toBe('112.00')
    expect(netToGrossPrice('100', 6)).toBe('106.00')
    expect(netToGrossPrice('100', 0)).toBe('100.00')
  })
  it('ровно половина тийина — вверх (HALF_UP, не банковское): 0,25 × 1,06 = 0,265 → 0,27', () => {
    expect(netToGrossPrice('0.25', 6)).toBe('0.27')
  })
  it('меньше половины — вниз, больше — вверх: 0,05 × 1,12 = 0,056 → 0,06; 0,04 × 1,12 = 0,0448 → 0,04', () => {
    expect(netToGrossPrice('0.05', 12)).toBe('0.06')
    expect(netToGrossPrice('0.04', 12)).toBe('0.04')
  })
  it('ввод с запятой и разрядами: «1 000,50» × 1,12 = 1 120,56', () => {
    expect(netToGrossPrice('1 000,50', 12)).toBe('1120.56')
  })
  it('пусто и не число — пустая строка, не «0.00» и не NaN', () => {
    expect(netToGrossPrice('', 12)).toBe('')
    expect(netToGrossPrice('abc', 12)).toBe('')
    expect(netToGrossPrice(null, 12)).toBe('')
    expect(netToGrossPrice('1.000,50', 12)).toBe('')   // «1,000,50» после нормализации формы
    expect(netToGrossPrice('1e3', 12)).toBe('')
    expect(netToGrossPrice(Infinity, 12)).toBe('')
  })
  // ревью-32 MED-2: цена без НДС с 3+ знаками — одно точное HALF_UP, без промежуточного округления float
  it('3 знака: 1,005 × 1,12 = 1,1256 → 1,13; 10,125 × 1,12 = 11,34; 1 234,565 × 1,12 = 1 382,7128 → 1 382,71', () => {
    expect(netToGrossPrice('1.005', 12)).toBe('1.13')
    expect(netToGrossPrice('10.125', 12)).toBe('11.34')
    expect(netToGrossPrice('0.125', 12)).toBe('0.14')
    expect(netToGrossPrice('1234.565', 12)).toBe('1382.71')
  })
  it('ровно полтийина при ставке 0: 0,005 → 0,01 (HALF_UP); договор №1163: 12 589,286 × 1,12 = 14 100,00032 → 14 100,00', () => {
    expect(netToGrossPrice('0.005', 0)).toBe('0.01')
    expect(netToGrossPrice('12589.286', 12)).toBe('14100.00')
  })
  it('огромные цены — без потери точности (больше 2^53 тийинов): 99 999 999 999 999,99 × 1,12', () => {
    expect(netToGrossPrice('99999999999999.99', 12)).toBe('111999999999999.99')   // …9,9888 → …9,99
  })
  it('«.5» и «5.» — числа: 0,56 и 5,60', () => {
    expect(netToGrossPrice('.5', 12)).toBe('0.56')
    expect(netToGrossPrice('5.', 12)).toBe('5.60')
  })
})

describe('проверка «не число» для формы', () => {
  it('пусто — не ошибка (цены просто нет); мусор — ошибка; нормальный ввод — нет', () => {
    expect([null, undefined, '', '  '].map(isInvalidDecimal)).toEqual([false, false, false, false])
    expect(['abc', '1.000,50', '1e3', '12.5.0'].map(isInvalidDecimal)).toEqual([true, true, true, true])
    expect(['100', '1 000,50', '10.125', '.5'].map(isInvalidDecimal)).toEqual([false, false, false, false])
  })
})

describe('цена с НДС → цена без НДС', () => {
  it('14 100,00 / 1,12 = 12 589,2857 → 12 589,29; 112 / 1,12 = 100,00', () => {
    expect(grossToNetPrice('14100.00', 12)).toBe('12589.29')
    expect(grossToNetPrice('112', 12)).toBe('100.00')
  })
  it('ставка 0 — та же цена; не число — пусто', () => {
    expect(grossToNetPrice('55.55', 0)).toBe('55.55')
    expect(grossToNetPrice('x', 12)).toBe('')
  })
})

describe('НДС в сумме строки (выделенный)', () => {
  it('1000 × 14 100,00 = 14 100 000,00; НДС = × 12/112 = 1 510 714,2857 → 1 510 714,29', () => {
    expect(lineVatIncluded('1000', '14100.00', 12)).toBe(1510714.29)
  })
  it('дробное количество: 2,5 × 112 = 280; НДС 12 % = 30,00; 6 % = 280 × 6/106 = 15,849 → 15,85', () => {
    expect(lineVatIncluded('2.5', '112', 12)).toBe(30)
    expect(lineVatIncluded('2.5', '112', 6)).toBe(15.85)
  })
  it('ставка 0 и нечисловой ввод — 0', () => {
    expect(lineVatIncluded('3', '100', 0)).toBe(0)
    expect(lineVatIncluded('', '100', 12)).toBe(0)
    expect(lineVatIncluded('3', 'abc', 12)).toBe(0)
  })
  it('количество с 3 знаками — сумма точная: 0,333 × 3,00 = 0,999; НДС × 12/112 = 0,10703 → 0,11', () => {
    expect(lineVatIncluded('0.333', '3.00', 12)).toBe(0.11)
  })
  it('большие суммы без потери точности: 1 000 000 × 99 999 999,99 → НДС 10 714 285 713 214,29', () => {
    expect(lineVatIncluded('1000000', '99999999.99', 12)).toBe(10714285713214.29)
  })
})

describe('НДС по закупке — сумма построчно округлённых', () => {
  it('две строки по 0,05: построчно 0,01 + 0,01 = 0,02 (от общей суммы 0,10 было бы 0,01)', () => {
    expect(totalVatIncluded([{ quantity: '1', price: '0.05' }, { quantity: '1', price: '0.05' }], 12)).toBe(0.02)
  })
  it('пустые строки не считаются; ставка 0 — 0', () => {
    expect(totalVatIncluded([{ quantity: '', price: '' }, { quantity: '1', price: '112' }], 12)).toBe(12)
    expect(totalVatIncluded([{ quantity: '1', price: '112' }], 0)).toBe(0)
  })
})
