import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// F-1104 (ответ владельца 13): оборотная ведомость и отчёт по списаниям — одна страница, два вида.

const { get, exportFromBackend } = vi.hoisted(() => ({
  get: vi.fn(),
  exportFromBackend: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('vue-router', () => ({ useRoute: () => ({ params: {}, query: {} }), useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/api/client', () => ({ default: { get } }))
vi.mock('@/utils/export', () => ({ exportFromBackend }))

import StockReport from '../StockReport.vue'
import endpoints from '@/api/endpoints'

const TURNOVER = {
  count: 1, period: { date_from: '2026-03-01', date_to: '2026-03-31' }, grand_total: { rows_count: 1 },
  results: [{ object_id: 1, object_name: 'Гостиница', object_is_active: false, material_id: 2,
    material_name: 'Кабель', unit: 'м', opening: 70, income: 50, expense: 25.125, closing: 94.875 }],
}
const WRITEOFFS = {
  count: 1, period: { date_from: '2026-03-01', date_to: '2026-03-31' }, grand_total: { writeoffs: 3, rows_count: 1 },
  results: [{ object_id: 1, object_name: 'Гостиница', object_is_active: true, material_id: 2,
    material_name: 'Кабель', unit: 'м', qty_total: 25, qty_unaccounted: 4, writeoffs: 3, first_date: '2026-03-10',
    last_date: '2026-03-25' }],
}

function routeGet(report: unknown) {
  get.mockImplementation((url: string) => (String(url).includes('/reports/stock/')
    ? Promise.resolve({ data: report }) : Promise.resolve({ data: { results: [], count: 0 } })))
}
const reportCalls = () => get.mock.calls.map(c => String(c[0])).filter(u => u.includes('/reports/stock/'))
const mountReport = async (kind: 'turnover' | 'writeoffs') => {
  const w = mount(StockReport, { props: { kind }, global: { stubs: { ModernPagination: true } } })
  await flushPromises()
  return w
}

describe('Отчёты по складу (F-1104)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-03-31T10:00:00+05:00'))
    get.mockReset(); exportFromBackend.mockClear()
  })
  afterEach(() => { vi.useRealTimers() })

  it('оборотка: колонки начало/приход/расход/конец, неактивный объект помечен, точные числа', async () => {
    routeGet(TURNOVER)
    const w = await mountReport('turnover')
    expect(w.text()).toContain('Оборотная ведомость')
    const head = w.findAll('thead th').map(th => th.text().replace(/[↑↓]/g, '').trim())
    expect(head).toEqual(['Объект', 'Материал', 'Ед.', 'Остаток на начало', 'Приход', 'Расход', 'Остаток на конец'])
    const cells = w.findAll('tbody tr')[0].findAll('td').map(td => td.text())
    expect(cells[0]).toContain('Гостиница')
    expect(cells[0]).toContain('неактивен')
    expect(cells.slice(2).map(s => s.replace(/\s/g, ' '))).toEqual(['м', '70', '50', '25,125', '94,875'])
  })

  it('по умолчанию — текущий месяц по сегодня', async () => {
    routeGet(TURNOVER)
    await mountReport('turnover')
    expect(reportCalls()[0]).toContain('date_from=2026-03-01')
    expect(reportCalls()[0]).toContain('date_to=2026-03-31')
  })

  it('отчёт по списаниям: свои колонки и итог «Списаний»', async () => {
    routeGet(WRITEOFFS)
    const w = await mountReport('writeoffs')
    expect(w.text()).toContain('Отчёт по списаниям')
    const head = w.findAll('thead th').map(th => th.text().replace(/[↑↓]/g, '').trim())
    expect(head).toEqual(['Объект', 'Материал', 'Ед.', 'Количество', 'в т.ч. без учёта', 'Списаний', 'Первое', 'Последнее'])
    expect(w.text()).toContain('Списаний за период: 3')
    expect(reportCalls()[0]).toContain('/reports/stock/writeoffs/')
  })

  it('сортировка по колонке уходит на сервер', async () => {
    routeGet(TURNOVER)
    const w = await mountReport('turnover')
    await w.findAll('thead th')[6].trigger('click')
    await flushPromises()
    expect(reportCalls().at(-1)).toContain('ordering=closing')
    await w.findAll('thead th')[6].trigger('click')
    await flushPromises()
    expect(reportCalls().at(-1)).toContain('ordering=-closing')
  })

  // F-1108 (ревью): «Все объекты» после выбора объекта отдаёт undefined — раньше уходило object=NaN → 400
  it('сброс фильтров на «Все» (FilterField отдаёт undefined) не шлёт NaN', async () => {
    routeGet(TURNOVER)
    const w = await mountReport('turnover')
    const vm = w.vm as unknown as { filters: Record<string, unknown>; handleExport: (f: 'csv' | 'excel') => Promise<void> }
    vm.filters.object = undefined
    vm.filters.material = undefined
    await vm.handleExport('csv')
    expect(exportFromBackend.mock.calls.at(-1)?.[3]).toEqual({ date_from: '2026-03-01', date_to: '2026-03-31' })
  })

  // F-1108 (ревью): один компонент на два маршрута — смена вида обязана перезапросить отчёт
  it('переход оборотка → списания перезапрашивает данные', async () => {
    routeGet(TURNOVER)
    const w = await mountReport('turnover')
    routeGet(WRITEOFFS)
    await w.setProps({ kind: 'writeoffs' })
    await flushPromises()
    expect(reportCalls().at(-1)).toContain('/reports/stock/writeoffs/')
    expect(w.text()).toContain('Списаний за период: 3')
  })

  // F-1111 (ревью): поздний ответ прежнего вида не затирает новый (оборотка медленная → уже открыты списания)
  it('поздний ответ оборотки после перехода на списания игнорируется, загрузка не гаснет раньше времени', async () => {
    const release: Record<string, (v: unknown) => void> = {}
    get.mockImplementation((url: string) => {
      const u = String(url)
      const kind = u.includes('/reports/stock/turnover/') ? 'turnover' : u.includes('/reports/stock/writeoffs/') ? 'writeoffs' : ''
      if (kind) {return new Promise(r => { release[kind] = r })}
      return Promise.resolve({ data: { results: [], count: 0 } })
    })
    const w = mount(StockReport, { props: { kind: 'turnover' }, global: { stubs: { ModernPagination: true } } })
    await flushPromises()
    await w.setProps({ kind: 'writeoffs' })
    await flushPromises()
    release.turnover({ data: TURNOVER })          // старый ответ пришёл, новый ещё в пути
    await flushPromises()
    expect(w.find('.list-content').classes()).toContain('relative')   // загрузка ещё идёт
    expect(w.text()).not.toContain('Кабель')                           // строк оборотки нет (идёт заглушка загрузки)
    release.writeoffs({ data: WRITEOFFS })
    await flushPromises()
    expect(w.find('.list-content').classes()).not.toContain('relative')
    expect(w.findAll('tbody tr')[0].findAll('td').map(td => td.text().replace(/\s/g, ' ')).slice(3, 6))
      .toEqual(['25', '4', '3'])
  })

  it('выгрузка повторяет сортировку экрана', async () => {
    routeGet(TURNOVER)
    const w = await mountReport('turnover')
    await w.findAll('thead th')[6].trigger('click')
    await flushPromises()
    ;(w.vm as unknown as { handleExport: (f: 'csv' | 'excel') => Promise<void> }).handleExport('csv')
    await flushPromises()
    expect(exportFromBackend.mock.calls.at(-1)?.[3]).toMatchObject({ ordering: 'closing' })
  })

  it('выгрузка — с сервера с теми же фильтрами', async () => {
    routeGet(TURNOVER)
    const w = await mountReport('turnover')
    ;(w.vm as unknown as { handleExport: (f: 'csv' | 'excel') => Promise<void> }).handleExport('excel')
    await flushPromises()
    expect(exportFromBackend).toHaveBeenCalledWith(endpoints.reports.turnover, 'xlsx', 'oborotnaya_vedomost_2026-03-31',
      { date_from: '2026-03-01', date_to: '2026-03-31' })
  })
})
