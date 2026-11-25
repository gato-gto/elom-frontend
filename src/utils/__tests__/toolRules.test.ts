// F-1101 (ответ владельца 12): «Списан»; утерянный не выдавать; сломанный выдавать с предупреждением.
// Правила — одни для списка, мобильной карточки и формы выдачи; тексты сервера те же.
import { describe, it, expect } from 'vitest'
import { toolIssueBlock, toolIssueWarning, toolWriteOffBlock } from '@/utils/toolRules'
import type { Tool } from '@/api/types/tools'

const tool = (over: Partial<Tool> = {}): Tool => ({
  id: 1, inventory_number: 'INV-1', name: 'Перфоратор', category: '', brand: '',
  current_holder: null, current_object: null, condition: 'good', condition_display: 'Хорошее',
  is_written_off: false, written_off_at: null, written_off_reason: '', written_off_by_name: null,
  created_at: '', updated_at: '', ...over,
} as Tool)

describe('toolIssueBlock — почему нельзя выдать', () => {
  it('списанный', () => { expect(toolIssueBlock(tool({ is_written_off: true }))).toBe('Инструмент списан — выдать нельзя') })
  it('утерянный', () => { expect(toolIssueBlock(tool({ condition: 'lost' }))).toBe('Инструмент утерян — выдать нельзя') })
  it('уже выдан', () => { expect(toolIssueBlock(tool({ current_holder: 5 }))).toBe('Инструмент уже выдан') })
  it('сломанный — выдать можно', () => { expect(toolIssueBlock(tool({ condition: 'broken' }))).toBeNull() })
  it('обычный — можно', () => { expect(toolIssueBlock(tool())).toBeNull() })
})

describe('toolIssueWarning — предупреждение при выдаче', () => {
  it('сломанный', () => {
    expect(toolIssueWarning(tool({ condition: 'broken' })))
      .toBe('Инструмент сломан. Выдать можно, но проверьте его и предупредите получателя.')
  })
  it('требует ремонта', () => {
    expect(toolIssueWarning(tool({ condition: 'needs_repair' })))
      .toBe('Инструмент требует ремонта. Выдать можно, но проверьте его и предупредите получателя.')
  })
  it('исправный — без предупреждения', () => {
    expect(toolIssueWarning(tool({ condition: 'after_repair' }))).toBeNull()
  })
})

describe('toolWriteOffBlock — почему нельзя списать', () => {
  it('выдан — сначала возврат', () => {
    expect(toolWriteOffBlock(tool({ current_holder: 5 }))).toBe('Инструмент выдан — сначала оформите возврат')
  })
  it('уже списан', () => { expect(toolWriteOffBlock(tool({ is_written_off: true }))).toBe('Инструмент уже списан') })
  it('на складе — можно (и сломанный, и утерянный)', () => {
    expect(toolWriteOffBlock(tool())).toBeNull()
    expect(toolWriteOffBlock(tool({ condition: 'lost' }))).toBeNull()
  })
})
