// F-1101 (ответ владельца 12, 24.11): инструмент «Списан»; утерянный не выдавать; сломанный — выдавать
// с предупреждением. Одни правила для списка, мобильной карточки и формы выдачи (сервер проверяет то же:
// tools.models.tool_issue_refusal и действие write-off).
import type { Tool } from '@/api/types/tools'

type ToolState = Pick<Tool, 'condition' | 'current_holder'> & { is_written_off?: boolean }

/** Почему инструмент нельзя выдать (null — можно). */
export function toolIssueBlock(tool: ToolState): string | null {
  if (tool.is_written_off) { return 'Инструмент списан — выдать нельзя' }
  if (tool.condition === 'lost') { return 'Инструмент утерян — выдать нельзя' }
  if (tool.current_holder) { return 'Инструмент уже выдан' }
  return null
}

/** Предупреждение в форме выдачи (null — без предупреждения). */
export function toolIssueWarning(tool: Pick<Tool, 'condition'>): string | null {
  if (tool.condition === 'broken') {
    return 'Инструмент сломан. Выдать можно, но проверьте его и предупредите получателя.'
  }
  if (tool.condition === 'needs_repair') {
    return 'Инструмент требует ремонта. Выдать можно, но проверьте его и предупредите получателя.'
  }
  return null
}

/** Почему инструмент нельзя списать (null — можно). */
export function toolWriteOffBlock(tool: ToolState): string | null {
  if (tool.is_written_off) { return 'Инструмент уже списан' }
  if (tool.current_holder) { return 'Инструмент выдан — сначала оформите возврат' }
  return null
}
