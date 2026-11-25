// F-1101 (ответ владельца 12): мобильная карточка показывает «Списан» с причиной, а не «На складе».
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ToolCard from '@/components/cards/ToolCard.vue'

const base = { id: 1, inventory_number: 'INV-1', name: 'Дрель', category: '', brand: '', current_holder: null,
  current_holder_name: null, current_object: null, current_object_name: null, condition: 'broken',
  condition_display: 'Сломан', created_at: '', updated_at: '' }

describe('ToolCard · «Списан» (F-1101)', () => {
  it('списанный: «Списан» и причина, без «На складе»', () => {
    const w = mount(ToolCard, { props: { tool: { ...base, is_written_off: true, written_off_reason: 'Сгорел' } as never } })
    expect(w.text()).toContain('Списан')
    expect(w.text()).toContain('Сгорел')
    expect(w.text()).not.toContain('На складе')
  })
  it('в работе на складе — «На складе»', () => {
    const w = mount(ToolCard, { props: { tool: { ...base, is_written_off: false } as never } })
    expect(w.text()).toContain('На складе')
    expect(w.text()).not.toContain('Списан')
  })
})
