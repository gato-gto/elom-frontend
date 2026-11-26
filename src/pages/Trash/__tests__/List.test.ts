// D-2 (корзина, 26.11): страница «Корзина» — закупки и списания в корзине; «Восстановить» (руководство),
// «Удалить окончательно» (только мастер-аккаунт, can_purge от сервера); отказы сервера — его текстом.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const { get, post, del, toast } = vi.hoisted(() => ({
  get: vi.fn(), post: vi.fn(), del: vi.fn(), toast: vi.fn(),
}))
vi.mock('@/api/client', () => ({ default: { get, post, delete: del } }))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast }) }))

import TrashList from '@/pages/Trash/List.vue'
import { endpoints } from '@/api/endpoints'

const PURCHASE = {
  kind: 'purchases', id: 11, title: 'Закупка P0001 — ООО «Электро-Снаб»', object_name: 'Гостиница',
  date: '2026-01-10', amount: '15 000 UZS', deleted_at: '2026-11-26T10:00:00+05:00', deleted_by_name: 'Амаль Б',
  purge_after: '2026-12-03T10:00:00+05:00', can_restore: true, can_purge: false,
}
const WRITEOFF = {
  kind: 'writeoffs', id: 7, title: 'Списание — Кабель ВВГнг 3х2.5, 6 м', object_name: 'Медцентр 01',
  date: '2026-01-20', amount: null, deleted_at: '2026-11-26T09:00:00+05:00', deleted_by_name: null,
  purge_after: '2026-12-03T09:00:00+05:00', can_restore: true, can_purge: false,
}
const width = window.innerWidth
type El = NonNullable<ReturnType<typeof document.querySelector>>
const text = (el: El) => (el.textContent || '').replace(/\s+/g, ' ').trim()
// ячейка: строки-блоки внутри (название и сумма под ним) — через « / »; без вложенных элементов — её текст
const cell = (td: El) => (td.children.length
  ? [...td.querySelectorAll('*')].filter(e => e.children.length === 0).map(text).join(' / ') : text(td))

function serve(items: unknown[], retention = 7) {
  get.mockResolvedValue({ data: { retention_days: retention, items } })
}

async function mountAt(w: number) {
  Object.defineProperty(window, 'innerWidth', { value: w, configurable: true })
  const wrapper = mount(TrashList, { global: { stubs: { ListHeader: { props: ['subtitle'], template: '<p class="sub">{{ subtitle }}</p>' } } } })
  await flushPromises()
  return wrapper
}

describe('Корзина (D-2)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    get.mockReset(); post.mockReset(); del.mockReset(); toast.mockReset()
  })
  afterEach(() => { Object.defineProperty(window, 'innerWidth', { value: width, configurable: true }) })

  it('таблица: что, где, когда, кто отправил, когда удалится; срок хранения — от сервера', async () => {
    serve([PURCHASE, WRITEOFF], 5)
    const w = await mountAt(1366)
    expect(get).toHaveBeenCalledWith(endpoints.trash.list)
    expect(endpoints.trash.list).toMatch(/\/api\/v1\/trash\/$/)
    expect(w.find('.sub').text()).toContain('Через 5 дней они удаляются окончательно.')
    const rows = w.findAll('[data-test="trash-row"]')
    expect(rows.map(r => [...r.element.querySelectorAll('td')].map(cell))).toEqual([
      ['Закупка P0001 — ООО «Электро-Снаб» / 15 000 UZS', 'Гостиница', '10.01.2026', 'Амаль Б, 26.11.2026, 10:00',
        '03.12.2026', 'Восстановить'],
      ['Списание — Кабель ВВГнг 3х2.5, 6 м', 'Медцентр 01', '20.01.2026', '—, 26.11.2026, 09:00', '03.12.2026',
        'Восстановить'],
    ])
  })

  it('десктоп: даты не переносятся (font-mono, F-565), названия держат мин. ширину (не рвутся по буквам)', async () => {
    serve([PURCHASE])
    const w = await mountAt(1366)
    const tds = w.findAll('[data-test="trash-row"] td')
    expect([tds[2].classes('font-mono'), tds[4].classes('font-mono')]).toEqual([true, true])
    expect(tds[0].find('div').classes()).toEqual(['min-w-[14rem]', 'break-words'])
    expect(tds[1].find('div').classes()).toEqual(['min-w-[8rem]', 'break-words'])
  })

  it('«Удалить окончательно» — только где сервер разрешил (мастер-аккаунт)', async () => {
    serve([{ ...PURCHASE, can_purge: true }, WRITEOFF])
    const w = await mountAt(1366)
    expect(w.findAll('[data-test="purge"]').length).toBe(1)
    expect(w.findAll('[data-test="restore"]').length).toBe(2)
  })

  it('пустая корзина — объясняет, сколько хранится', async () => {
    serve([], 7)
    const w = await mountAt(1366)
    expect(w.find('[data-test="trash-empty"]').text())
      .toBe('Корзина пуста. Закупки и списания, отправленные в корзину, хранятся здесь 7 дней.')
  })

  it('«Восстановить» — POST на свой адрес, строка уходит, уведомление — текстом сервера', async () => {
    serve([PURCHASE, WRITEOFF])
    post.mockResolvedValue({ data: { detail: 'Закупка P0001 восстановлена.', id: 11 } })
    const w = await mountAt(1366)
    await w.findAll('[data-test="restore"]')[0].trigger('click')
    await flushPromises()
    expect(post).toHaveBeenCalledWith(endpoints.trash.restore('purchases', 11))
    expect(endpoints.trash.restore('purchases', 11)).toMatch(/\/api\/v1\/trash\/purchases\/11\/restore\/$/)
    expect(toast).toHaveBeenCalledWith({ type: 'success', text: 'Закупка P0001 восстановлена.' })
    expect(w.findAll('[data-test="trash-row"]').length).toBe(1)
  })

  it('отказ восстановления («не хватает остатка») — текст сервера, список перечитан, строка на месте', async () => {
    serve([WRITEOFF])
    const detail = 'Не хватает остатка «Кабель» на объекте «Медцентр 01», чтобы восстановить списание 6 м: этот материал уже списан или приход удалён.'
    post.mockRejectedValue({ response: { status: 400, data: { detail, errors: {} } } })
    const w = await mountAt(1366)
    get.mockClear()
    await w.find('[data-test="restore"]').trigger('click')
    await flushPromises()
    expect(toast).toHaveBeenCalledWith({ type: 'error', text: detail })
    expect(get).toHaveBeenCalledTimes(1)
    expect(w.findAll('[data-test="trash-row"]').length).toBe(1)
  })

  it('«Удалить окончательно» — с вопросом; отказ в вопросе ничего не делает', async () => {
    serve([{ ...PURCHASE, can_purge: true }])
    del.mockResolvedValue({ data: null })
    const w = await mountAt(1366)
    const spy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    await w.find('[data-test="purge"]').trigger('click')
    await flushPromises()
    expect(del).not.toHaveBeenCalled()
    await w.find('[data-test="purge"]').trigger('click')
    await flushPromises()
    expect(spy).toHaveBeenCalledWith('Удалить окончательно: Закупка P0001 — ООО «Электро-Снаб»? Вернуть будет нельзя.')
    expect(del).toHaveBeenCalledWith(endpoints.trash.purge('purchases', 11))
    expect(endpoints.trash.purge('purchases', 11)).toMatch(/\/api\/v1\/trash\/purchases\/11\/$/)
    expect(toast).toHaveBeenCalledWith({ type: 'success', text: 'Удалено окончательно' })
    expect(w.find('[data-test="trash-empty"]').exists()).toBe(true)
    spy.mockRestore()
  })

  it('390px — карточки с кнопками, без таблицы; длинное название переносится', async () => {
    serve([{ ...PURCHASE, can_purge: true }])
    const w = await mountAt(390)
    expect(w.find('table').exists()).toBe(false)
    const card = w.find('[data-test="trash-cards"] li')
    expect(card.find('.font-medium').classes()).toContain('break-words')
    const parts = [...card.element.querySelectorAll('div, button')].filter(e => e.children.length === 0).map(text)
    expect(parts).toEqual(['Закупка P0001 — ООО «Электро-Снаб»', 'Гостиница, 10.01.2026, 15 000 UZS',
      'Отправил Амаль Б 26.11.2026, 10:00. Удалится 03.12.2026.', 'Восстановить', 'Удалить окончательно'])
  })

  it('сбой загрузки — сообщение на странице', async () => {
    get.mockRejectedValue({ response: { status: 403, data: { detail: 'Корзину видит и восстанавливает только руководство.' } } })
    const w = await mountAt(1366)
    expect(w.text()).toContain('Корзину видит и восстанавливает только руководство.')
  })
})
