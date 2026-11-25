// F-1111 (ревью F-1106): «Открыть» старый закрытый месяц внутри даты запрета — не предлагаем (сервер — 400);
// опечатка в годе даты запрета — не отправить.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'

const { get } = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/api/client', () => ({ default: { get, post: vi.fn().mockResolvedValue({ data: {} }) } }))
vi.mock('@/composables/usePermissions', () => ({ usePermissions: () => ({ can: () => true }) }))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))

import ArchivePeriods from '@/pages/Stocks/ArchivePeriods.vue'
import { endpoints } from '@/api/endpoints'

const ModalStub = defineComponent({
  props: ['modelValue', 'title'],
  setup(props, { slots }) { return () => (props.modelValue ? h('div', { class: 'modal-stub' }, slots.default?.()) : null) },
})

describe('Дата запрета: ревью (F-1111)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-05-01T10:00:00+05:00'))
    get.mockImplementation((url: string) => Promise.resolve({ data: url === endpoints.archivePeriods.lockDates
      ? [{ object: 7, object_name: 'Гостиница', object_is_active: true, closed_until: '2026-03-31',
           closed_until_by_name: null, closed_until_at: null }]
      : { results: [
          { id: 1, month: '2026-02-01', object: 7, object_name: 'Гостиница', closed_at: '', closed_by: null, closed_by_name: null, is_closed: true },
          { id: 2, month: '2026-04-01', object: 7, object_name: 'Гостиница', closed_at: '', closed_by: null, closed_by_name: null, is_closed: true },
        ], count: 2 } }))
  })

  it('старый месяц внутри даты запрета — без «Открыть», после неё — с кнопкой', async () => {
    const w = mount(ArchivePeriods, { global: { stubs: { Modal: ModalStub, ListHeader: true } } })
    await flushPromises()
    expect(w.findAll('[data-test="reopen-legacy"]').length).toBe(1)
    expect(w.text()).toContain('внутри даты запрета')
  })

  it('опечатка в годе — «Сохранить» закрыта', async () => {
    const w = mount(ArchivePeriods, { global: { stubs: { Modal: ModalStub, ListHeader: true } } })
    await flushPromises()
    await w.find('[data-test="edit-lock"]').trigger('click')
    await w.find('.modal-stub input[type="date"]').setValue('0026-03-31')
    expect(w.find('.modal-stub').text()).toContain('Слишком ранняя дата запрета')
    expect(w.find('[data-test="save-lock"]').attributes('disabled')).toBeDefined()
  })
})
