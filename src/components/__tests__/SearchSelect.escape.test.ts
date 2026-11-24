import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

// Ревью B21 (R3): Escape в поле поиска материала/работы закрывает список подсказок, но событие доходило
// до слушателя модалки на document → «Закрыть без сохранения?» для всей формы (Enter = OK → форма с
// позициями пропадала). Пока список открыт, Escape принадлежит полю поиска.
vi.mock('@/api/client', () => ({ default: { get: vi.fn().mockResolvedValue({ data: [] }), post: vi.fn() } }))
import MaterialSearchSelect from '../MaterialSearchSelect.vue'
import WorkItemSearchSelect from '../WorkItemSearchSelect.vue'

let reached = 0
const onDoc = () => { reached++ }
beforeEach(() => {
  setActivePinia(createPinia())
  reached = 0
  document.addEventListener('keydown', onDoc)
})
afterEach(() => { document.removeEventListener('keydown', onDoc) })

for (const [name, Comp] of [['MaterialSearchSelect', MaterialSearchSelect], ['WorkItemSearchSelect', WorkItemSearchSelect]] as const) {
  describe(name, () => {
    it('test_escape_with_open_suggestions_closes_them_and_does_not_reach_modal', async () => {
      const w = mount(Comp as never, { props: { modelValue: null }, attachTo: document.body })
      const vm = w.vm as unknown as { showDropdown: boolean }
      vm.showDropdown = true
      await nextTick()
      w.find('input').element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await nextTick()
      expect(vm.showDropdown).toBe(false)
      expect(reached, 'Escape не должен дойти до модалки').toBe(0)
      w.unmount()
    })

    it('test_escape_with_closed_suggestions_reaches_modal', async () => {
      const w = mount(Comp as never, { props: { modelValue: null }, attachTo: document.body })
      w.find('input').element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await nextTick()
      expect(reached).toBe(1)
      w.unmount()
    })
  })
}
