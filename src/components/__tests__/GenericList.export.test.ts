// F-869 regression: одиночное скачивание при экспорте.
// Баг: GenericList.handleExport САМ качал файл (backend/fallback) И повторно эмитил 'export'
// наверх, где страница качала ВТОРОЙ файл (клиентский exportToCSV) → на один клик два файла.
// Здесь пиним: экспорт идёт РОВНО один раз и GenericList НЕ эмитит 'export' наружу.
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import GenericList from '../GenericList.vue'
import ExportButton from '../ExportButton.vue'
import type { GenericListConfig } from '@/types/generic'

const exportFromBackend = vi.fn().mockResolvedValue(true)
const exportToCSV = vi.fn()
const exportToExcel = vi.fn()
vi.mock('@/utils/export', () => ({
  exportFromBackend: (...a: any[]) => exportFromBackend(...a),
  exportToCSV: (...a: any[]) => exportToCSV(...a),
  exportToExcel: (...a: any[]) => exportToExcel(...a),
}))
vi.mock('@/composables/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    canExportReports: { value: true },
    can: () => true,
  }),
}))

const config: GenericListConfig<any> = {
  title: 'Things',
  columns: [{ key: 'name', label: 'Name' }],
  filters: [],
  exportable: true,
  exportUrl: '/api/v1/things/',
  exportFilename: 'things',
} as any

function makeStore() {
  return {
    items: [{ id: 1, name: 'A' }],
    loading: false,
    error: null,
    pagination: { page: 1, pageSize: 20, count: 1, next: null, previous: null },
    filters: {},
    fetchList: vi.fn(), setFilters: vi.fn(), resetFilters: vi.fn(), setPage: vi.fn(), setPageSize: vi.fn(),
  }
}

describe('F-869 GenericList export — один клик = один файл', () => {
  it('качает РОВНО один раз через backend и НЕ повторяет клиентски', async () => {
    exportFromBackend.mockClear(); exportToCSV.mockClear(); exportToExcel.mockClear()
    const wrapper = mount(GenericList, { props: { config, store: makeStore() as any } })
    const btn = wrapper.findComponent(ExportButton)
    expect(btn.exists()).toBe(true)

    btn.vm.$emit('export', 'csv')
    await flushPromises()

    expect(exportFromBackend).toHaveBeenCalledTimes(1)
    expect(exportToCSV).not.toHaveBeenCalled()   // второго (клиентского) файла нет
  })

  it('НЕ эмитит "export" наружу (иначе страница качала бы второй файл)', async () => {
    const wrapper = mount(GenericList, { props: { config, store: makeStore() as any } })
    wrapper.findComponent(ExportButton).vm.$emit('export', 'excel')
    await flushPromises()
    expect(wrapper.emitted('export')).toBeUndefined()
  })
})
