import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUiStore } from '../ui'

// F-558: ui.toast подавляет мгновенные дубли (стор + страница тостят один и тот же текст
// подряд — напр. сбой загрузки списка). Осознанные повторы во времени не подавляются.
describe('UI store — toast dedup (F-558)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
  })
  afterEach(() => { vi.useRealTimers() })

  it('suppresses an identical text+type toast fired back-to-back', () => {
    const ui = useUiStore()
    ui.toast({ type: 'error', text: 'Ошибка загрузки' })
    ui.toast({ type: 'error', text: 'Ошибка загрузки' })   // дубль (тот же тик)
    expect(ui.toasts.filter(t => t.text === 'Ошибка загрузки')).toHaveLength(1)
  })

  it('keeps toasts with different text', () => {
    const ui = useUiStore()
    ui.toast({ type: 'error', text: 'A' })
    ui.toast({ type: 'error', text: 'B' })
    expect(ui.toasts).toHaveLength(2)
  })

  it('keeps a same-text toast fired after the dedup window (800ms)', () => {
    const ui = useUiStore()
    ui.toast({ type: 'success', text: 'Готово' })
    vi.setSystemTime(1_000_000 + 900)   // за пределами окна
    ui.toast({ type: 'success', text: 'Готово' })
    expect(ui.toasts.filter(t => t.text === 'Готово')).toHaveLength(2)
  })

  it('does not dedup same text with different type', () => {
    const ui = useUiStore()
    ui.toast({ type: 'success', text: 'X' })
    ui.toast({ type: 'error', text: 'X' })
    expect(ui.toasts).toHaveLength(2)
  })
})
