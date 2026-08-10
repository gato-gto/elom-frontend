/**
 * F-518 — меню «с поиском» улетало вверх, перекрывая форму.
 *
 * Главный кейс («баг воспроизведён»): поле у низа экрана, снизу 233px (< 240, но достаточно) —
 * меню ДОЛЖНО открыться ПОД полем (просто ниже), а не откидываться вверх.
 */
import { describe, it, expect } from 'vitest'
import { computeDropdownPosition, DROPDOWN_GAP } from '../dropdownPosition'

const rect = (top: number, height = 32, left = 100, width = 220) => ({
  top, bottom: top + height, left, width,
})

describe('F-518 · computeDropdownPosition', () => {
  it('поле у низа экрана, снизу 233px — меню ПОД полем (не улетает вверх)', () => {
    // viewport 900, поле 635..667 → снизу 233. Раньше откидывалось вверх (233 < 240).
    const pos = computeDropdownPosition(rect(635), 900)
    expect(pos.placement).toBe('below')
    expect(pos.top).toBe(667 + DROPDOWN_GAP) // прилипло к нижней грани поля
    expect(pos.maxHeight).toBeGreaterThan(200) // помещается почти всё
  })

  it('много места снизу — меню под полем на полную высоту', () => {
    const pos = computeDropdownPosition(rect(100), 900)
    expect(pos.placement).toBe('below')
    expect(pos.maxHeight).toBe(240)
  })

  it('снизу реально мало (60px) и сверху много — откидывается вверх, НИЗ прижат к полю', () => {
    // поле внизу: top 808..840, viewport 900 → снизу 60 (< 160), сверху 808.
    const pos = computeDropdownPosition(rect(808), 900)
    expect(pos.placement).toBe('above')
    // низ меню = top + maxHeight; должен быть у верхней грани поля (808 - GAP)
    expect(pos.top + pos.maxHeight).toBe(808 - DROPDOWN_GAP)
  })

  it('меню всегда в пределах экрана (не уходит за низ)', () => {
    const vh = 900
    for (const t of [50, 300, 600, 700, 820]) {
      const pos = computeDropdownPosition(rect(t), vh)
      expect(pos.top).toBeGreaterThanOrEqual(0)
      expect(pos.top + pos.maxHeight).toBeLessThanOrEqual(vh)
    }
  })

  it('F-1000 iOS-клавиатура: bounds visualViewport → меню НАД полем, не под клавиатурой', () => {
    // iPhone: layout-высота 844, клавиатура съедает низ → visualViewport {top:0, bottom:390}.
    // Поле доскроллено iOS вплотную над клавиатурой: top 340..372. По старому innerHeight=844
    // spaceBelow=472 → 'below' → меню целиком В ЗОНЕ КЛАВИАТУРЫ (владелец видел «ничего не нашлось»).
    // По visual-bounds: spaceBelow=390-372=18 (<160), spaceAbove=340 → 'above', низ прижат к полю.
    const pos = computeDropdownPosition(rect(340), { top: 0, bottom: 390 })
    expect(pos.placement).toBe('above')
    expect(pos.top + pos.maxHeight).toBe(340 - DROPDOWN_GAP)   // низ меню у верхней грани поля
    expect(pos.top).toBeGreaterThanOrEqual(0)
  })

  it('F-1000: pinch-zoom (visualViewport.offsetTop>0) — spaceAbove от ВИДИМОГО верха', () => {
    // Зум: видимое окно {top:200, bottom:500}. Поле top=260 → spaceAbove=60 (не 260!),
    // spaceBelow=500-292=208 (>=160) → 'below' и меню влезает в видимую зону.
    const pos = computeDropdownPosition(rect(260), { top: 200, bottom: 500 })
    expect(pos.placement).toBe('below')
    expect(pos.top + pos.maxHeight).toBeLessThanOrEqual(500)
  })
})
