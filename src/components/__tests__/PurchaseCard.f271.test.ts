import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PurchaseCard from '@/components/cards/PurchaseCard.vue'
import type { Purchase } from '@/api/types/purchases'

// F-271 / D-019: завершённая закупка без фото-отчёта должна нести янтарный
// маркер «нет фото». Логика — status === 'completed' && has_report_photos === false.
// Ничего лишнего: для новых/отменённых закупок и при наличии отчёта маркера нет,
// а при неизвестном (undefined) значении аннотации мы не «пилим» пользователя.

// MobileCard заменяем проходным стабом, чтобы тест не зависел от его вёрстки.
const MobileCardStub = {
  name: 'MobileCard',
  template: '<div><slot name="content" /><slot name="extra" /></div>',
}

const base: Purchase = {
  id: 1,
  date: '2026-01-10',
  object: 1,
  object_name: 'Объект А',
  supplier: 1,
  currency: 'UZS',
  responsible: 1,
  is_archived: false,
  purchase_no: 'ЗАК-001',
  status: 'completed',
  items: [],
  photos: [],
  created_at: '2026-01-10T00:00:00Z',
  updated_at: '2026-01-10T00:00:00Z',
}

function mountCard(overrides: Partial<Purchase>) {
  return mount(PurchaseCard, {
    props: { purchase: { ...base, ...overrides } },
    global: { stubs: { MobileCard: MobileCardStub } },
  })
}

describe('PurchaseCard — F-271 маркер «нет фото-отчёта»', () => {
  it('показывает маркер: завершена и фото-отчёта нет', () => {
    const w = mountCard({ status: 'completed', has_report_photos: false })
    expect(w.text()).toContain('нет фото')
  })

  it('скрывает маркер: завершена и фото-отчёт есть', () => {
    const w = mountCard({ status: 'completed', has_report_photos: true })
    expect(w.text()).not.toContain('нет фото')
  })

  it('скрывает маркер: закупка ещё новая (не завершена)', () => {
    const w = mountCard({ status: 'new', has_report_photos: false })
    expect(w.text()).not.toContain('нет фото')
  })

  it('скрывает маркер: значение аннотации неизвестно (undefined)', () => {
    const w = mountCard({ status: 'completed', has_report_photos: undefined })
    expect(w.text()).not.toContain('нет фото')
  })
})
