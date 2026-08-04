import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// manual→catalog (F-739): quick-add позиции. Цена — только work_items.create; propose → драфт без цены.
const { create } = vi.hoisted(() => ({ create: vi.fn() }))
const canRef = vi.hoisted(() => ({ create: true }))

vi.mock('@/stores/workCategories', () => ({
  useWorkCategoriesStore: () => ({
    items: [
      { id: 1, name: 'Монтаж', parent: null, parent_name: null },
      { id: 2, name: 'Прокладка', parent: 1, parent_name: 'Монтаж' },
    ],
    fetchList: vi.fn().mockResolvedValue(undefined),
  }),
}))
vi.mock('@/stores/workItems', () => ({ useWorkItemsStore: () => ({ create }) }))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))
vi.mock('@/composables/usePermissions', () => ({
  usePermissions: () => ({ can: (_r: string, a: string) => (a === 'create' ? canRef.create : true) }),
}))
vi.mock('@/components/Modal.vue', () => ({ default: { name: 'Modal', template: '<div><slot /></div>' } }))

import QuickAddWorkItem from '@/components/QuickAddWorkItem.vue'

function mountQA() {
  const wrapper = mount(QuickAddWorkItem, { props: { modelValue: true, initialName: 'Розетка' } })
  return wrapper
}

describe('QuickAddWorkItem — manual→catalog', () => {
  beforeEach(() => { create.mockReset(); create.mockResolvedValue({ id: 99, name: 'Розетка', kind: 'work', kind_display: 'Работа', unit: 'шт.', default_price: '5000', category: 2, is_draft: false }); canRef.create = true })

  it('префилл имени из поиска; подраздел из категорий', async () => {
    const wrapper = mountQA(); await nextTick()
    const vm = wrapper.vm as unknown as { form: { name: string }, subcategoryOptions: Array<{ id: number; label: string }> }
    expect(vm.form.name).toBe('Розетка')
    expect(vm.subcategoryOptions).toEqual([{ id: 2, label: 'Монтаж → Прокладка' }])
  })

  it('руководство (create): шлёт цену; save → store.create + emit created', async () => {
    canRef.create = true
    const wrapper = mountQA(); await nextTick()
    const vm = wrapper.vm as unknown as { form: Record<string, unknown>, save: () => Promise<void> }
    vm.form.category = 2; vm.form.name = 'Розетка'; vm.form.unit = 'шт.'; vm.form.default_price = '5000'
    await vm.save()
    expect(create).toHaveBeenCalledWith({ category: 2, name: 'Розетка', kind: 'work', unit: 'шт.', default_price: '5000' })
    expect(wrapper.emitted('created')?.[0]?.[0]).toMatchObject({ id: 99 })
    expect(wrapper.emitted('update:modelValue')?.some(e => e[0] === false)).toBe(true)
  })

  it('вводящий (propose, без create): цена НЕ шлётся → BE сделает драфт', async () => {
    canRef.create = false
    create.mockResolvedValue({ id: 100, name: 'Розетка', kind: 'work', kind_display: 'Работа', unit: '', default_price: null, category: 2, is_draft: true })
    const wrapper = mountQA(); await nextTick()
    const vm = wrapper.vm as unknown as { form: Record<string, unknown>, save: () => Promise<void> }
    vm.form.category = 2; vm.form.name = 'Розетка'
    await vm.save()
    const payload = create.mock.calls[0][0]
    expect(payload).not.toHaveProperty('default_price')   // цена не отправлена → драфт по праву BE
    expect(payload).toMatchObject({ category: 2, name: 'Розетка' })
  })

  it('валидация: без подраздела/имени — 400 не шлётся', async () => {
    const wrapper = mountQA(); await nextTick()
    const vm = wrapper.vm as unknown as { form: Record<string, unknown>, save: () => Promise<void> }
    vm.form.category = null; vm.form.name = ''
    await vm.save()
    expect(create).not.toHaveBeenCalled()
  })
})
