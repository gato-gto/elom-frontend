/**
 * A-02 (F-519) — блокировка прокрутки фона под модалкой (iOS scroll-bleed).
 * Проверяем ref-счётчик: вложенные модалки не разблокируют раньше времени, прокрутка
 * восстанавливается только после закрытия последней.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { lockBodyScroll, unlockBodyScroll, _resetScrollLock } from '../scrollLock'

beforeEach(() => {
  _resetScrollLock()
  document.body.style.cssText = ''
  Object.defineProperty(window, 'scrollY', { value: 120, configurable: true })
  window.scrollTo = vi.fn() as never
})

describe('A-02 · scrollLock', () => {
  it('lock фиксирует body со смещением на прокрутку', () => {
    lockBodyScroll()
    expect(document.body.style.position).toBe('fixed')
    expect(document.body.style.top).toBe('-120px')
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('unlock снимает фиксацию и возвращает прокрутку', () => {
    lockBodyScroll()
    unlockBodyScroll()
    expect(document.body.style.position).toBe('')
    expect(document.body.style.top).toBe('')
    expect(window.scrollTo).toHaveBeenCalledWith(0, 120)
  })

  it('вложенные модалки: разблокировка только после ПОСЛЕДНЕЙ', () => {
    lockBodyScroll() // модалка 1
    lockBodyScroll() // модалка 2 поверх
    unlockBodyScroll() // закрыли 2 — фон ещё заблокирован
    expect(document.body.style.position).toBe('fixed')
    unlockBodyScroll() // закрыли 1 — теперь разблокировано
    expect(document.body.style.position).toBe('')
  })

  it('лишний unlock без lock ничего не ломает', () => {
    expect(() => unlockBodyScroll()).not.toThrow()
    expect(document.body.style.position).toBe('')
  })
})
