// F-1134 (ответ владельца 4): в таблице «Остатки» объект в архиве с остатком — с пометкой «неактивен».
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const DATA = {
  date: '2026-11-26', total_objects: 2,
  objects: [
    { object_id: 1, object_name: 'Медцентр 01', object_address: 'ул. 1', object_is_active: true, total_materials: 1,
      materials: [{ material_id: 2, material_name: 'Кабель', unit_code: 'м', current_balance: '5', total_purchased: '5', total_written_off: '0' }] },
    { object_id: 2, object_name: 'Гостиница', object_address: 'ул. 2', object_is_active: false, total_materials: 1,
      materials: [{ material_id: 3, material_name: 'Болт', unit_code: 'шт', current_balance: '2', total_purchased: '2', total_written_off: '0' }] },
  ],
}
vi.mock('vue-router', () => ({ useRoute: () => ({ params: {}, query: {} }), useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }))
vi.mock('@/api/client', () => ({
  default: { get: vi.fn((url: string) => Promise.resolve({ data: String(url).includes('by-objects') ? DATA : { results: [], count: 0 } })) },
}))

import Balances from '../Balances.vue'

describe('Остатки: неактивный объект (F-1134)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    Object.defineProperty(window, 'innerWidth', { value: 1366, configurable: true })
  })

  it('пометка «неактивен» только у объекта в архиве', async () => {
    const w = mount(Balances, { global: { stubs: { ExportButton: true, RouterLink: true } } })
    await flushPromises()
    const rows = w.findAll('tbody tr').filter(r => r.text().includes('Медцентр 01') || r.text().includes('Гостиница'))
    const byName = Object.fromEntries(rows.map(r => [r.text().includes('Гостиница') ? 'Гостиница' : 'Медцентр 01',
      r.find('[data-test="inactive-badge"]').exists()]))
    expect(byName).toEqual({ 'Медцентр 01': false, 'Гостиница': true })
  })
})
