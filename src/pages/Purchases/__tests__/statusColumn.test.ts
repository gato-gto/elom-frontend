import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Аудит B20 (F-12): в списке закупок на компьютере не было статуса — отменённая выглядела как
// выполненная; подписи расходились («Отмена» в форме, «Отменена» в фильтре, «Завершена» в карточке).
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ query: {}, params: {} }) }))
import PurchaseCard from '@/components/cards/PurchaseCard.vue'
import { getStatusLabel } from '@/utils/statusHelpers'

const ROOT = resolve(__dirname, '../../../..')
const read = (f: string) => readFileSync(resolve(ROOT, f), 'utf8')

describe('Статус закупки — одинаково везде', () => {
  it('test_desktop_list_has_status_column_with_badge', () => {
    const src = read('src/pages/Purchases/List.vue')
    expect(src).toMatch(/\{ key: 'status', label: 'Статус', sortable: false \}/)
    expect(src).toContain('<template #column-status="{ item }">')
    expect(src).toMatch(/getStatusLabel\(item\.status\)/)
  })

  it('test_form_and_filter_use_same_cancelled_label', () => {
    expect(read('src/pages/Purchases/PurchaseForm.vue')).toContain("{ value: 'cancelled', label: 'Отменена' }")
    expect(read('src/pages/Purchases/PurchaseForm.vue')).not.toContain("label: 'Отмена' }")
    expect(read('src/pages/Purchases/List.vue')).toContain("{ value: 'cancelled', label: 'Отменена' }")
  })

  it('test_mobile_card_shows_same_completed_label_as_list', () => {
    const w = mount(PurchaseCard, {
      props: { purchase: { id: 1, purchase_no: 'P1', status: 'completed', date: '2026-11-01', items: [] } as never },
      global: { stubs: { MobileCard: { props: ['badge'], template: '<div class="badge-stub">{{ badge }}</div>' } } },
    })
    expect(w.find('.badge-stub').text()).toBe(getStatusLabel('completed'))
    expect(getStatusLabel('completed')).toBe('Выполнено')
    expect(getStatusLabel('cancelled')).toBe('Отменена')
  })
})
