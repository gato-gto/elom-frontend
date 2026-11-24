import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GenericList from '../GenericList.vue'

// F-1071 (ревью D-030): правило 1 — моноширинный только для кодов (SKU, инвентарный №); правило 6 —
// «Сбросить фильтры» только когда фильтр задан.
const baseStore = (filters: Record<string, string>) => ({
  items: [{ id: 1, name: 'Кабель', sku: 'AUTO-7F98A5FB', date: '2026-11-19', quantity: '5' }],
  loading: false, error: null,
  pagination: { page: 1, pageSize: 20, count: 1, next: null, previous: null },
  filters, fetchList: vi.fn(), setFilters: vi.fn(), resetFilters: vi.fn(), setPage: vi.fn(), setPageSize: vi.fn(),
})
const config = {
  title: 'Материалы',
  columns: [
    { key: 'name', label: 'Название' },
    { key: 'sku', label: 'SKU' },
    { key: 'date', label: 'Дата' },
    { key: 'quantity', label: 'Кол-во' },
  ],
  filters: [{ key: 'search', type: 'text', label: 'Поиск' }],
}
const mountList = (filters: Record<string, string>) => mount(GenericList, {
  props: { config: config as never, store: baseStore(filters) as never },
})

describe('F-1071 GenericList: D-030 правила 1 и 6', () => {
  it('колонка SKU — font-code (моноширинный), даты и количества — font-mono (табличные цифры), не font-code', () => {
    const w = mountList({ search: '' })
    const cells = w.findAll('tbody tr')[0].findAll('td')
    const byText = (t: string) => cells.find(c => c.text().trim() === t)!
    expect(byText('AUTO-7F98A5FB').classes()).toContain('font-code')
    expect(byText('AUTO-7F98A5FB').classes()).not.toContain('font-mono')
    expect(byText('5').classes()).not.toContain('font-code')
  })

  it('«Сбросить фильтры» скрыта, пока фильтр не задан', () => {
    expect(mountList({ search: '' }).text()).not.toContain('Сбросить фильтры')
  })

  it('«Сбросить фильтры» видна, когда фильтр задан', () => {
    expect(mountList({ search: 'кабель' }).text()).toContain('Сбросить фильтры')
  })
})

// Хвост ревью F-1071: у «Остатков» дата по умолчанию = сегодня, и кнопка «Сбросить» висела всегда.
// Значение, равное заявленному defaultValue фильтра, — не «заданный фильтр».
describe('GenericList: «Сбросить фильтры» и значение по умолчанию', () => {
  const cfg = {
    title: 'Остатки',
    columns: [{ key: 'name', label: 'Название' }],
    filters: [
      { key: 'object', type: 'select', label: 'Объект', options: [] },
      { key: 'date', type: 'date', label: 'Дата', defaultValue: '2026-11-24' },
    ],
  }
  const mountBal = (filters: Record<string, string>) => mount(GenericList, {
    props: { config: cfg as never, store: baseStore(filters) as never },
  })

  it('test_reset_hidden_when_date_equals_default', () => {
    expect(mountBal({ object: '', date: '2026-11-24' }).text()).not.toContain('Сбросить фильтры')
  })

  it('test_reset_shown_when_date_differs_from_default', () => {
    expect(mountBal({ object: '', date: '2026-11-01' }).text()).toContain('Сбросить фильтры')
  })

  it('test_reset_shown_when_other_filter_set_and_date_default', () => {
    expect(mountBal({ object: '484', date: '2026-11-24' }).text()).toContain('Сбросить фильтры')
  })

  it('test_inventory_number_of_tool_issue_is_code_column', () => {
    const w = mount(GenericList, {
      props: {
        config: { title: 'Выдачи', columns: [{ key: 'tool_inventory_number', label: 'Инструмент' }] } as never,
        store: { ...baseStore({}), items: [{ id: 1, tool_inventory_number: 'INV-0042' }] } as never,
      },
    })
    const cell = w.findAll('tbody tr')[0].findAll('td').find(c => c.text().trim() === 'INV-0042')!
    expect(cell.classes()).toContain('font-code')
  })
})
