/**
 * F-518 — расчёт позиции выпадающего меню (fixed, teleport в body) относительно поля.
 *
 * Вынесено из MaterialSearchSelect.vue, чтобы логику можно было проверить тестом: раньше меню
 * откидывалось ВВЕРХ, как только снизу было < полной высоты (240px) — даже при 233px свободных —
 * и «улетало» вверх, перекрывая форму. Меню скроллится (overflow-y-auto), поэтому по умолчанию
 * открываем ПОД полем и просто ограничиваем высоту; вверх откидываем только когда снизу реально
 * мало места И сверху его заметно больше.
 */
export interface DropdownAnchor {
  top: number
  bottom: number
  left: number
  width: number
}

export interface DropdownPosition {
  top: number
  left: number
  width: number
  maxHeight: number
  placement: 'below' | 'above'
}

export const DROPDOWN_MAX_HEIGHT = 240 // max-h-60
export const DROPDOWN_GAP = 4
/** Минимум места снизу, ниже которого разумнее открыть меню вверх. */
export const DROPDOWN_MIN_BELOW = 160

export function computeDropdownPosition(
  rect: DropdownAnchor,
  viewportHeight: number,
): DropdownPosition {
  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top

  if (spaceBelow >= DROPDOWN_MIN_BELOW || spaceBelow >= spaceAbove) {
    return {
      top: rect.bottom + DROPDOWN_GAP,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.min(DROPDOWN_MAX_HEIGHT, spaceBelow - DROPDOWN_GAP * 2),
      placement: 'below',
    }
  }

  // Места снизу мало — открываем вверх, прижимая НИЗ меню к полю.
  const maxHeight = Math.min(DROPDOWN_MAX_HEIGHT, spaceAbove - DROPDOWN_GAP * 2)
  return {
    top: rect.top - maxHeight - DROPDOWN_GAP,
    left: rect.left,
    width: rect.width,
    maxHeight,
    placement: 'above',
  }
}
