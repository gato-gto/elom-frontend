import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// F-1047 (B14): закрыть будущий месяц нельзя (BE F-814) — поле месяца ограничено текущим месяцем,
// по местному времени (а не UTC).
vi.mock('@/stores/archivePeriods', () => ({ useArchivePeriodsStore: () => ({ items: [], loading: false, fetchList: vi.fn().mockResolvedValue(undefined), close: vi.fn(), reopen: vi.fn() }) }))
vi.mock('@/stores/objects', () => ({ useObjectsStore: () => ({ items: [], fetchList: vi.fn().mockResolvedValue(undefined) }) }))
vi.mock('@/composables/usePermissions', () => ({ usePermissions: () => ({ can: () => true, hasPermission: () => true }) }))

import ArchivePeriods from '../ArchivePeriods.vue'

describe('ArchivePeriods: месяц не позже текущего (F-1047)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    // локально 15.11.2026 12:00 — месяц одинаков в любом поясе
    vi.setSystemTime(new Date(2026, 10, 15, 12, 0, 0))
  })
  afterEach(() => vi.useRealTimers())

  it('max и значение по умолчанию — текущий месяц', () => {
    const w = mount(ArchivePeriods, { global: { stubs: { Modal: true, ListHeader: true } } })
    const input = w.find('input[type="month"]')
    expect(input.attributes('max')).toBe('2026-11')
    expect((input.element as HTMLInputElement).value).toBe('2026-11')
  })

  // F-1069 (ревью F-1047): атрибут max не мешает набрать будущий месяц с клавиатуры (Chrome), Safari на
  // macOS/Firefox показывают текстовое поле, пикер iOS max не соблюдает → нужен запрет в самой логике.
  it('будущий месяц: кнопка неактивна, подсказка видна, askClose не открывает подтверждение', async () => {
    const w = mount(ArchivePeriods, { global: { stubs: { Modal: true, ListHeader: true } } })
    const vm = w.vm as any
    vm.form.object = 5
    vm.form.month = '2026-12'
    await w.vm.$nextTick()
    const btn = w.findAll('button').find(b => b.text() === 'Закрыть период')!
    expect(btn.attributes('disabled')).toBeDefined()
    expect(w.text()).toContain('Будущий месяц закрыть нельзя')
    vm.askClose()
    expect(vm.confirm.open).toBe(false)
  })
})
