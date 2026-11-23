import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// F-1045 (аудит 23.11, B7): в накладной (и печати) количество укрупнялось («1 км»), а цена оставалась за
// базовую единицу материала (13 230 за м) → строка «1 км × 13 230 = 13 230 000» не сходилась. В документе
// количество показывается в единице позиции — той, к которой относится цена; до 3 знаков (BE хранит 3).

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ query: {}, params: {} }) }))

import PurchaseInfo from '../PurchaseInfo.vue'

const purchase = {
  id: 21552, purchase_no: 'P0005', status: 'completed', date: '2026-11-21', object_name: 'Медцентр 01',
  supplier_name: 'INTER KABEL SERVIS', total_amount: '13230000.00', photos: [],
  items: [
    { id: 1, material_name: 'ВВГнг-LS 3х1,5', unit_code: 'м', quantity: '1000.000', price: '13230.00', amount: '13230000.00' },
    { id: 2, material_name: 'Гипс', unit_code: 'кг', quantity: '0.125', price: '8000.00', amount: '1000.00' },
  ],
}

function rows() {
  setActivePinia(createPinia())
  const w = mount(PurchaseInfo, { props: { purchase: purchase as any }, global: { stubs: { teleport: true } } })
  return w.findAll('tbody tr').map(tr => tr.findAll('td').map(td => td.text().replace(/\s+/g, ' ').trim()))
}

describe('Накладная: количество в единице цены (F-1045)', () => {
  it('1000 м остаётся «1 000 м», а не «1 км» — строка сходится с ценой за м', () => {
    const r = rows()[0]
    expect(r[2]).toBe('м')
    expect(r[3]).toBe('1 000') // rows() схлопывает \s (в т.ч. NBSP разрядов Intl) в обычный пробел
  })

  it('дробное количество — до 3 знаков (0,125, а не 0,13)', () => {
    const r = rows()[1]
    expect(r[2]).toBe('кг')
    expect(r[3]).toBe('0,125')
  })
})
