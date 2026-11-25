// F-1106 (ответ владельца 7): страница «Дата запрета» — по объекту одна дата; руководство меняет и снимает.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'

const { get, post, canEdit } = vi.hoisted(() => ({
  get: vi.fn(), post: vi.fn().mockResolvedValue({ data: {} }), canEdit: { value: true },
}))
vi.mock('@/api/client', () => ({ default: { get, post } }))
vi.mock('@/composables/usePermissions', () => ({ usePermissions: () => ({ can: () => canEdit.value }) }))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))

import ArchivePeriods from '@/pages/Stocks/ArchivePeriods.vue'
import { endpoints } from '@/api/endpoints'

const ModalStub = defineComponent({
  props: ['modelValue', 'title'],
  setup(props, { slots }) { return () => (props.modelValue ? h('div', { class: 'modal-stub' }, slots.default?.()) : null) },
})
const ROWS = [
  { object: 7, object_name: 'Гостиница', object_is_active: true, closed_until: '2026-03-31',
    closed_until_by_name: 'Анна Админ', closed_until_at: '2026-04-01T10:00:00+05:00' },
  { object: 8, object_name: 'Медцентр', object_is_active: false, closed_until: null,
    closed_until_by_name: null, closed_until_at: null },
]

async function mountPage() {
  const w = mount(ArchivePeriods, { global: { stubs: { Modal: ModalStub, ListHeader: true } } })
  await flushPromises()
  return w
}

describe('Страница «Дата запрета» (F-1106)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-05-01T10:00:00+05:00'))
    canEdit.value = true
    get.mockReset(); post.mockClear()
    get.mockImplementation((url: string) => Promise.resolve({
      data: url === endpoints.archivePeriods.lockDates ? ROWS : { results: [], count: 0 },
    }))
  })

  it('по объекту — дата запрета и кто менял; без даты — «не задана»', async () => {
    const w = await mountPage()
    const rows = w.findAll('tbody tr').map(r => r.text())
    expect(rows[0]).toContain('Гостиница')
    expect(rows[0]).toContain('31.03.2026')
    expect(rows[0]).toContain('Анна Админ')
    expect(rows[1]).toContain('не задана')
    expect(rows[1]).toContain('неактивен')
  })

  it('изменить дату: подтверждение называет, что станет только для чтения, и шлёт дату', async () => {
    const w = await mountPage()
    await w.findAll('tbody tr')[0].find('[data-test="edit-lock"]').trigger('click')
    const input = w.find('.modal-stub input[type="date"]')
    await input.setValue('2026-04-15')
    expect(w.find('.modal-stub').text()).toContain('по 15.04.2026 включительно')
    await w.find('[data-test="save-lock"]').trigger('click')
    await flushPromises()
    expect(post).toHaveBeenCalledWith(endpoints.archivePeriods.setLockDate, { object: 7, date: '2026-04-15' })
  })

  it('будущую дату не сохранить', async () => {
    const w = await mountPage()
    await w.findAll('tbody tr')[0].find('[data-test="edit-lock"]').trigger('click')
    await w.find('.modal-stub input[type="date"]').setValue('2026-05-02')
    expect(w.find('.modal-stub').text()).toContain('Дату запрета в будущем ставить нельзя')
    expect(w.find('[data-test="save-lock"]').attributes('disabled')).toBeDefined()
  })

  it('снять дату — null', async () => {
    const w = await mountPage()
    await w.findAll('tbody tr')[0].find('[data-test="edit-lock"]').trigger('click')
    await w.find('[data-test="clear-lock"]').trigger('click')
    await flushPromises()
    expect(post).toHaveBeenCalledWith(endpoints.archivePeriods.setLockDate, { object: 7, date: null })
  })

  it('без права stock.edit_all — только просмотр', async () => {
    canEdit.value = false
    const w = await mountPage()
    expect(w.findAll('[data-test="edit-lock"]').length).toBe(0)
  })
})
