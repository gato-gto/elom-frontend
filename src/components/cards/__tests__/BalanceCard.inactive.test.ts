// F-1134 (ответ владельца 4): объект в архиве с остатком показывается в «Остатках» с пометкой «неактивен».
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BalanceCard from '@/components/cards/BalanceCard.vue'

const base = { object_id: 1, object_name: 'Гостиница', object_address: 'ул. 1', total_materials: 1,
  materials: [{ material_id: 2, material_name: 'Кабель', unit_code: 'м', current_balance: '5', total_purchased: '5', total_written_off: '0' }] }
const mountIt = (balance: Record<string, unknown>) => mount(BalanceCard, {
  props: { balance: balance as never },
  global: { stubs: { MobileCard: { template: '<div><slot name="content" /></div>' } } },
})

describe('BalanceCard: неактивный объект (F-1134)', () => {
  it('объект в архиве — пометка «неактивен»', () => {
    expect(mountIt({ ...base, object_is_active: false }).find('[data-test="inactive-badge"]').text()).toBe('неактивен')
  })
  it('активный объект — без пометки', () => {
    expect(mountIt({ ...base, object_is_active: true }).find('[data-test="inactive-badge"]').exists()).toBe(false)
  })
  it('старый ответ без признака — без пометки', () => {
    expect(mountIt(base).find('[data-test="inactive-badge"]').exists()).toBe(false)
  })
})
