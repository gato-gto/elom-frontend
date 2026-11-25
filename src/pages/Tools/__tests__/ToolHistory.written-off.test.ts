// F-1105 (ревью F-1101, пропущенный сосед): окно истории показывало «На складе» у списанного инструмента.
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

vi.mock('@/api/client', () => ({ default: { get: vi.fn().mockResolvedValue({ data: { results: [], count: 0 } }) } }))

import ToolHistory from '@/pages/Tools/ToolHistory.vue'

const tool = (over: Record<string, unknown>) => ({ id: 1, inventory_number: 'INV-1', name: 'Дрель', category: '', brand: '',
  current_holder: null, current_holder_name: null, current_object: null, current_object_name: null, condition: 'broken',
  condition_display: 'Сломан', created_at: '', updated_at: '', ...over })

describe('ToolHistory · «Списан» (F-1105)', () => {
  it('списанный — «Списан», не «На складе»', async () => {
    const w = mount(ToolHistory, { props: { tool: tool({ is_written_off: true }) as never } })
    await flushPromises()
    expect(w.text()).toContain('Списан')
    expect(w.text()).not.toContain('На складе')
  })
  it('в работе на складе — «На складе»', async () => {
    const w = mount(ToolHistory, { props: { tool: tool({ is_written_off: false }) as never } })
    await flushPromises()
    expect(w.text()).toContain('На складе')
  })
})
