import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// F-1036 (BE F-794): секция «Пресеты коэффициентов» в модуле каталога — справочник руководства (права work_items.*):
// список (имя · ×множитель · подсказка зоны · метка «выкл»), форма добавления/правки, удаление после confirm.
const { catFetch, itemFetch, presetFetch, presetCreate, presetUpdate, presetRemove } = vi.hoisted(() => ({
  catFetch: vi.fn().mockResolvedValue([]), itemFetch: vi.fn().mockResolvedValue([]),
  presetFetch: vi.fn().mockResolvedValue([]), presetCreate: vi.fn().mockResolvedValue({ id: 9 }),
  presetUpdate: vi.fn().mockResolvedValue({ id: 1 }), presetRemove: vi.fn().mockResolvedValue(undefined),
}))
const cats = [
  { id: 1, name: 'Раздел A', parent: null, parent_name: null, children_count: 1, items_count: 0, order: 1 },
  { id: 2, name: 'Подраздел B', parent: 1, parent_name: 'Раздел A', children_count: 0, items_count: 0, order: 1 },
]
// порядок в моке (7, 2, 5) НЕ совпадает ни с сортировкой по order (2, 5, 7), ни с её обратной — пин сортировки честный
const presets = [
  { id: 1, name: 'Ночные работы после 20:00', multiplier: '1.30', scope_hint: '', order: 7, is_active: true },
  { id: 2, name: 'Установка кронштейна на потолок коф.', multiplier: '1.50', scope_hint: 'Монтаж ТВ кронштейнов', order: 2, is_active: false },
  { id: 3, name: 'Пусконаладочные работы 10 процентов', multiplier: '1.10', scope_hint: '', order: 5, is_active: true },
]
vi.mock('@/stores/workCategories', () => ({
  useWorkCategoriesStore: () => ({ items: cats, loading: false, fetchList: catFetch, create: vi.fn(), update: vi.fn(), remove: vi.fn() }),
}))
vi.mock('@/stores/workItems', () => ({
  useWorkItemsStore: () => ({ items: [], loading: false, fetchList: itemFetch, create: vi.fn(), update: vi.fn(), remove: vi.fn() }),
}))
vi.mock('@/stores/coefficientPresets', () => ({
  useCoefficientPresetsStore: () => ({ items: presets, loading: false, fetchList: presetFetch, create: presetCreate, update: presetUpdate, remove: presetRemove }),
}))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))
vi.mock('@/composables/usePermissions', () => ({ usePermissions: () => ({ can: () => true }) }))
vi.mock('@/components/Modal.vue', () => ({ default: { name: 'Modal', template: '<div><slot/></div>' } }))
vi.mock('@/components/LoadingSpinner.vue', () => ({ default: { name: 'LoadingSpinner', template: '<div/>' } }))
vi.mock('@/components/ListHeader.vue', () => ({ default: { name: 'ListHeader', template: '<div/>' } }))

import Catalog from '@/pages/Estimates/Catalog.vue'

interface VM {
  presetForm: { name: string; multiplier: string; scope_hint: string; order: number; is_active: boolean }
  presetErr: Record<string, string>
  savePreset: () => Promise<void>
  openPresetForm: (p: Record<string, unknown> | null) => void
}

describe('Catalog — пресеты коэффициентов (F-1036)', () => {
  beforeEach(() => { presetFetch.mockClear(); presetCreate.mockClear(); presetUpdate.mockClear(); presetRemove.mockClear() })

  it('фетчит пресеты на mount и показывает секцию: порядок по order, ×множитель, подсказка зоны, «выкл»', async () => {
    const w = mount(Catalog); await nextTick()
    expect(presetFetch).toHaveBeenCalledWith({ page_size: 100 })
    const t = w.text()
    expect(t).toContain('Пресеты коэффициентов')
    expect(t).toContain('×1.3')
    expect(t).toContain('зона: Монтаж ТВ кронштейнов')
    expect(t).toContain('выкл')
    const names = w.findAll('[data-testid="preset-row"]').map(r => r.text())
    expect(names.map(n => n.slice(0, 12))).toEqual(['Установка кр', 'Пусконаладоч', 'Ночные работ'])   // order 2, 5, 7
  })

  it('«Пресет» → форма → сохранение зовёт create с полным payload', async () => {
    const w = mount(Catalog); await nextTick()
    const vm = w.vm as unknown as VM
    await w.findAll('button').find(b => b.attributes('aria-label') === 'Добавить пресет')!.trigger('click')
    await nextTick()
    vm.presetForm.name = ' Зимний '; vm.presetForm.multiplier = '1.15'; vm.presetForm.scope_hint = 'Подраздел B'; vm.presetForm.order = 3
    await vm.savePreset()
    expect(presetCreate).toHaveBeenCalledWith({ name: 'Зимний', multiplier: '1.15', scope_hint: 'Подраздел B', order: 3, is_active: true })
    expect(presetFetch).toHaveBeenCalledTimes(2)              // перезагрузка после сохранения
  })

  it('правка существующего пресета зовёт update с его id и предзаполняет форму', async () => {
    const w = mount(Catalog); await nextTick()
    const vm = w.vm as unknown as VM
    vm.openPresetForm(presets[1]); await nextTick()
    expect(vm.presetForm).toEqual({ name: 'Установка кронштейна на потолок коф.', multiplier: '1.50', scope_hint: 'Монтаж ТВ кронштейнов', order: 2, is_active: false })
    vm.presetForm.is_active = true
    await vm.savePreset()
    expect(presetUpdate).toHaveBeenCalledWith(2, { name: 'Установка кронштейна на потолок коф.', multiplier: '1.50', scope_hint: 'Монтаж ТВ кронштейнов', order: 2, is_active: true })
  })

  it('валидация: пустое имя и множитель ≤ 0 — create не зовётся, ошибки по полям', async () => {
    const w = mount(Catalog); await nextTick()
    const vm = w.vm as unknown as VM
    vm.openPresetForm(null); await nextTick()
    vm.presetForm.name = '  '; vm.presetForm.multiplier = '0'
    await vm.savePreset()
    expect(presetCreate).not.toHaveBeenCalled()
    expect(vm.presetErr).toMatchObject({ name: 'Укажите название', multiplier: 'Множитель должен быть больше 0' })
  })

  it('удаление после confirm зовёт remove; отказ в confirm — нет', async () => {
    const w = mount(Catalog); await nextTick()
    const del = () => w.findAll('button').find(b => b.attributes('aria-label') === 'Удалить пресет')!
    window.confirm = vi.fn(() => false)
    await del().trigger('click'); await nextTick()
    expect(presetRemove).not.toHaveBeenCalled()
    window.confirm = vi.fn(() => true)
    await del().trigger('click'); await nextTick()
    expect(presetRemove).toHaveBeenCalledWith(2)               // первый в списке по order — id 2
  })
})
