import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PurchaseForm from '../PurchaseForm.vue'

// F-1142 · НДС в форме закупки (владелец 28.11): галочка «цены без НДС», пересчёт, колонка «НДС»; в БД — цена с НДС.
// Ревью-32: тесты ходят через DOM (галочка, select, поля ввода) — проводка шаблона тоже под проверкой.
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: undefined }, query: {} }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}))
vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { results: [], count: 0 } }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

// GenericForm-заглушка, которая рисует слот позиций — чтобы проверять колонки, а не только состояние.
const GenericFormWithItems = {
  template: '<div><slot name="field-items" :field="{ label: \'Позиции\' }" :error="null" :disabled="false" /></div>',
}

type Wrapper = ReturnType<typeof mountForm>
interface Row { quantity: string; price: string; price_net?: string; net_touched?: boolean; total?: number }
interface FormVm { items: Row[]; vatRate: number; vatNetMode: boolean; recalc: (r: Row) => void;
  validatePurchaseItems: () => Record<string, string>; preparePurchaseData: (d: object) => { items: object[] } }

function mountForm() {
  return mount(PurchaseForm, {
    global: { stubs: { MaterialSearchSelect: true, SupplierSearchSelect: true, GenericForm: GenericFormWithItems } },
  })
}

async function withItems(w: Wrapper, rows: Array<[string, string]>): Promise<FormVm> {
  const vm = w.vm as unknown as FormVm
  vm.items.splice(0, vm.items.length, ...rows.map(([quantity, price], i) => ({
    _k: `k${i}`, material: 7 + i, material_name: undefined, unit: 3, quantity, price, amount: '0', total: 0,
    isNewMaterial: false,
  })))
  vm.items.forEach((r) => vm.recalc(r))
  await flushPromises()
  return vm
}

const text = (w: Wrapper, sel: string, i = 0) => w.findAll(sel)[i].text().replace(/\s/g, '')
const netOn = (w: Wrapper) => w.find('[data-testid="vat-net-mode"]').setValue(true)
const netOff = (w: Wrapper) => w.find('[data-testid="vat-net-mode"]').setValue(false)
const rate = (w: Wrapper, r: number) => w.find('[data-testid="vat-rate"]').setValue(String(r))
const typeNet = (w: Wrapper, value: string, i = 0) => w.findAll('[data-testid="price-net"]')[i].setValue(value)

describe('PurchaseForm · НДС (F-1142)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('по умолчанию: ставка 12 %, цены с НДС, НДС выделяется из суммы строки и итога', async () => {
    const w = mountForm()
    const vm = await withItems(w, [['1000', '14100.00']])
    expect(vm.vatRate).toBe(12)
    expect(vm.vatNetMode).toBe(false)
    expect(w.find('[data-testid="price-net"]').exists()).toBe(false)
    expect(text(w, '[data-testid="line-vat"]')).toBe('1510714,29')        // 14 100 000 × 12/112
    expect(text(w, '[data-testid="line-vat-inline"]')).toBe('НДС1510714,29')
    expect(text(w, '[data-testid="total-vat"]')).toBe('1510714,29')
    expect(text(w, '[data-testid="total-vat-inline"]')).toBe('НДС1510714,29')
    // живой замер 28.11 (боковое меню 256 px): колонка НДС помещается только с 1536 px (2xl), уже — строкой под суммой
    for (const id of ['line-vat', 'total-vat']) {
      expect(w.find(`[data-testid="${id}"]`).classes()).toEqual(expect.arrayContaining(['hidden', '2xl:table-cell']))
    }
    for (const id of ['line-vat-inline', 'total-vat-inline']) {
      expect(w.find(`[data-testid="${id}"]`).classes()).toContain('2xl:hidden')
    }
  })

  it('галочка: цена без НДС подставлена из текущей, цена с НДС не меняется — даже 0,05 (→ 0,04 → 0,04)', async () => {
    const w = mountForm()
    const vm = await withItems(w, [['1000', '14100.00'], ['1', '0.05']])
    await netOn(w)
    // форма держит пустую строку-плейсхолдер в конце — сравниваем заполненные
    expect(vm.items.slice(0, 2).map((r) => r.price_net)).toEqual(['12589.29', '0.04'])
    expect(vm.items.slice(0, 2).map((r) => r.price)).toEqual(['14100.00', '0.05'])
    expect(text(w, '[data-testid="price-gross"]')).toBe('14100,00')
  })

  it('ввод цены без НДС (десктоп) → цена с НДС × 1,12, сумма и НДС пересчитаны, на сервер — цена с НДС', async () => {
    const w = mountForm()
    const vm = await withItems(w, [['10', '']])
    await netOn(w)
    await typeNet(w, '100')
    expect(vm.items[0].price).toBe('112.00')
    expect(vm.items[0].total).toBe(1120)
    expect(text(w, '[data-testid="line-vat"]')).toBe('120,00')
    const payload = vm.preparePurchaseData({ date: '2026-11-28', object: 1, supplier: 1, status: 'new', currency: 'UZS' })
    expect(payload.items).toEqual([{ unit: 3, quantity: '10', amount: '1120.00', price: '112.00', material: 7 }])
  })

  it('ввод цены без НДС на телефоне — то же поле в карточке', async () => {
    const w = mountForm()
    const vm = await withItems(w, [['1', '']])
    await netOn(w)
    await w.find('[data-testid="price-net-mobile"]').setValue('50')
    expect(vm.items[0].price).toBe('56.00')
  })

  it('цена без НДС с 3 знаками — точное HALF_UP: 10,125 × 1,12 = 11,34 (float дал бы 11,35)', async () => {
    const w = mountForm()
    const vm = await withItems(w, [['1000', '']])
    await netOn(w)
    await typeNet(w, '10.125')
    expect(vm.items[0].price).toBe('11.34')
  })

  it('мусор в цене без НДС — ошибка у поля, а не цена 0', async () => {
    const w = mountForm()
    const vm = await withItems(w, [['1', '']])
    await netOn(w)
    await typeNet(w, '1,000,50')
    expect(vm.validatePurchaseItems()).toEqual({ 'items[0].price': 'Цена без НДС — не число (дробь — запятой, без разделителей тысяч)' })
  })

  it('смена ставки: введённые без НДС строки пересчитываются, остальные цены с НДС не трогаются', async () => {
    const w = mountForm()
    const vm = await withItems(w, [['1', ''], ['1', '1000.02']])
    await netOn(w)
    await typeNet(w, '100', 0)                  // строку 1 ввели без НДС; строка 2 — проведённая, её не касались
    await rate(w, 6)
    expect(vm.items.slice(0, 2).map((r) => r.price)).toEqual(['106.00', '1000.02'])
    expect(vm.items[1].price_net).toBe('943.42')   // 1000,02 / 1,06 = 943,415 → 943,42 (показ)
    await rate(w, 12)
    expect(vm.items.slice(0, 2).map((r) => r.price)).toEqual(['112.00', '1000.02'])   // без дрейфа (1000,02 → 892,88 → 1000,03)
  })

  it('«без НДС» после ввода без НДС: цена = введённой, галочка и колонка «без НДС» скрыты, колонки НДС нет', async () => {
    const w = mountForm()
    const vm = await withItems(w, [['1', '']])
    await netOn(w)
    await typeNet(w, '100')
    await rate(w, 0)
    expect(vm.items[0].price).toBe('100.00')
    expect(w.find('[data-testid="vat-net-mode"]').exists()).toBe(false)
    expect(w.find('[data-testid="price-net"]').exists()).toBe(false)
    expect(w.find('[data-testid="price-net-mobile"]').exists()).toBe(false)
    expect(w.find('[data-testid="price-input"]').exists()).toBe(true)       // цену можно править как обычно
    expect(w.find('[data-testid="line-vat"]').exists()).toBe(false)
    expect(w.find('[data-testid="line-vat-inline"]').exists()).toBe(false)
    expect(w.find('[data-testid="total-vat"]').exists()).toBe(false)
  })

  it('ревью-32 р2 MED-A: 12 → «без НДС» → 12 возвращает цену × 1,12 и галочку (а не 100 как цену с НДС)', async () => {
    const w = mountForm()
    const vm = await withItems(w, [['1', ''], ['1', '1000.02']])
    await netOn(w)
    await typeNet(w, '100', 0)
    await rate(w, 0)
    expect(vm.items.slice(0, 2).map((r) => r.price)).toEqual(['100.00', '1000.02'])
    await rate(w, 12)
    expect(vm.items.slice(0, 2).map((r) => r.price)).toEqual(['112.00', '1000.02'])
    expect((w.find('[data-testid="vat-net-mode"]').element as HTMLInputElement).checked).toBe(true)
    expect(w.findAll('[data-testid="price-net"]').map((e) => (e.element as HTMLInputElement).value).slice(0, 2))
      .toEqual(['100', '892.88'])
    const payload = vm.preparePurchaseData({ date: '2026-11-28', object: 1, supplier: 1, status: 'new', currency: 'UZS' })
    expect(payload.items.map((i) => (i as { price: string }).price)).toEqual(['112.00', '1000.02'])
  })

  it.each([['price-input'], ['price-input-mobile']])(
    'на «без НДС» цену поправили руками (%s) — возврат на 12 % её не перетирает старой ценой без НДС',
    async (testid) => {
      const w = mountForm()
      const vm = await withItems(w, [['1', '']])
      await netOn(w)
      await typeNet(w, '100')
      await rate(w, 0)
      await w.find(`[data-testid="${testid}"]`).setValue('150')
      expect(vm.items[0].price).toBe('150')
      expect(vm.items[0].total).toBe(150)
      await rate(w, 12)
      expect(vm.items[0].price).toBe('150')
      expect(vm.items[0].price_net).toBe('133.93')     // 150 / 1,12 = 133,928… → 133,93 (показ)
    })

  it('смена ставки при ценах с НДС меняет только показанный НДС, цену — нет', async () => {
    const w = mountForm()
    const vm = await withItems(w, [['1', '106']])
    await rate(w, 6)
    expect(vm.items[0].price).toBe('106')
    expect(text(w, '[data-testid="line-vat"]')).toBe('6,00')
  })

  it('галочку сняли и поправили цену с НДС — смена ставки её не перетирает старой ценой без НДС', async () => {
    const w = mountForm()
    const vm = await withItems(w, [['2', '']])
    await netOn(w)
    await typeNet(w, '50')
    await netOff(w)
    expect(vm.items[0].price).toBe('56.00')
    vm.items[0].price = '70'
    await rate(w, 6)
    expect(vm.items[0].price).toBe('70')
    expect(w.find('[data-testid="price-net"]').exists()).toBe(false)
  })

  it('подвал: «Итого» — 4 колонки; с галочкой «Цена с НДС» уходит в строку под ценой без НДС до 1536 px, а в '
    + 'подвале её закрывает своя ячейка (тоже только с 1536 px)', async () => {
    const w = mountForm()
    await withItems(w, [['1', '100']])
    expect(w.find('[data-testid="total-label"]').attributes('colspan')).toBe('4')
    expect(w.find('[data-testid="total-pad"]').exists()).toBe(false)
    expect(w.find('[data-testid="th-gross"]').classes()).not.toContain('hidden')
    expect(w.find('[data-testid="td-gross"]').classes()).not.toContain('hidden')
    await netOn(w)
    expect(w.find('[data-testid="total-label"]').attributes('colspan')).toBe('4')
    expect(w.find('[data-testid="total-pad"]').classes()).toEqual(['hidden', '2xl:table-cell'])
    expect(w.find('[data-testid="th-gross"]').classes()).toEqual(['hidden', '2xl:table-cell'])
    expect(w.find('[data-testid="td-gross"]').classes()).toEqual(['hidden', '2xl:table-cell'])
    const inline = w.find('[data-testid="price-gross-inline"]')
    expect(inline.classes()).toContain('2xl:hidden')
    expect(inline.text().replace(/\s/g, '')).toBe('СНДС:100,00')
    // колонок в подвале столько же, сколько в шапке (на 2xl: пустая + 4 + сумма + НДС + действия = 8)
    const headCols = w.findAll('thead th').length
    const footCols = w.findAll('tfoot td').reduce((n, td) => n + Number(td.attributes('colspan') ?? 1), 0)
    expect(footCols).toBe(headCols)
  })

  it('пустая позиция: НДС 0,00, ничего не падает', async () => {
    const w = mountForm()
    await withItems(w, [['', '']])
    expect(text(w, '[data-testid="line-vat"]')).toBe('0,00')
    expect(text(w, '[data-testid="total-vat"]')).toBe('0,00')
  })
})
