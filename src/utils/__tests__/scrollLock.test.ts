/**
 * A-02 (F-519) + APPLE-2 (F-996) — блокировка прокрутки фона под модалкой.
 * F-996: лок БЕЗ смещения координат. Прежний паттерн `body{position:fixed; top:-scrollY}` — известный
 * триггер iOS-бага: нативный поповер <select> якорится по документным координатам, смещение body
 * на -scrollY уводит меню к верху экрана ровно на глубину прокрутки (репорты MUI#3638, angular
 * material#11382, OutSystems). Новый контракт: html+body overflow:hidden (современный iOS 15+ лочит),
 * overscroll-behavior:none, БЕЗ position:fixed/top — координаты полей не смещаются, якорь цел.
 * Ref-счётчик прежний: вложенные модалки не разблокируют раньше времени.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { lockBodyScroll, unlockBodyScroll, _resetScrollLock } from '../scrollLock'

beforeEach(() => {
  _resetScrollLock()
  document.body.style.cssText = ''
  document.documentElement.style.cssText = ''
  Object.defineProperty(window, 'scrollY', { value: 120, configurable: true })
  window.scrollTo = vi.fn() as never
})

describe('A-02/APPLE-2 · scrollLock', () => {
  it('lock НЕ смещает body (position/top пусты — иначе iOS select-поповер прилипает к верху экрана)', () => {
    lockBodyScroll()
    expect(document.body.style.position).toBe('')   // НЕ 'fixed' — ядро F-996
    expect(document.body.style.top).toBe('')        // НЕ '-120px' — координаты не смещены
  })

  it('lock лочит overflow на html И body + overscroll-behavior', () => {
    lockBodyScroll()
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.overscrollBehavior).toBe('none')
  })

  it('unlock восстанавливает overflow и возвращает прокрутку (защита от сброса)', () => {
    lockBodyScroll()
    unlockBodyScroll()
    expect(document.documentElement.style.overflow).toBe('')
    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.overscrollBehavior).toBe('')
    expect(window.scrollTo).toHaveBeenCalledWith(0, 120)
  })

  it('вложенные модалки: разблокировка только после ПОСЛЕДНЕЙ', () => {
    lockBodyScroll() // модалка 1
    lockBodyScroll() // модалка 2 поверх
    unlockBodyScroll() // закрыли 2 — фон ещё заблокирован
    expect(document.body.style.overflow).toBe('hidden')
    unlockBodyScroll() // закрыли 1 — теперь разблокировано
    expect(document.body.style.overflow).toBe('')
  })

  it('лишний unlock без lock ничего не ломает', () => {
    expect(() => unlockBodyScroll()).not.toThrow()
    expect(document.body.style.overflow).toBe('')
  })
})
