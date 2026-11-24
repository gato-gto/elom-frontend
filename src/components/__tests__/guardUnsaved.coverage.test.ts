import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// B21 + ревью (R6): у окон с многострочным вводом обязана стоять защита guard-unsaved — иначе ×/Escape/
// уход со страницы молча стирают все введённые строки. Список — окна, где строк может быть десятки.
const ROOT = resolve(__dirname, '../../..')
const CASES: Array<[string, RegExp]> = [
  ['src/pages/Purchases/List.vue', /<Modal v-model="modalOpen"[^>]*>/],                                // закупка
  ['src/pages/WriteOffs/WriteOffForm.vue', /<Modal[^>]*>/],                                           // списание
  ['src/pages/WriteOffs/WriteOffByBalanceForm.vue', /<Modal[^>]*>/],                                  // инвентаризация
  ['src/pages/Materials/MaterialBulkForm.vue', /<Modal[^>]*>/],                                       // массово материалы
  ['src/pages/Tools/List.vue', /<Modal v-model="bulkAddModalOpen"[^>]*>/],                            // массово инструменты
]

describe('guard-unsaved на окнах с многострочным вводом', () => {
  for (const [file, re] of CASES) {
    it(file, () => {
      const tag = readFileSync(resolve(ROOT, file), 'utf8').match(re)?.[0] ?? ''
      expect(tag, `не найден тег Modal в ${file}`).not.toBe('')
      expect(tag).toContain('guard-unsaved')
    })
  }
})
