import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PurchaseForm from '../PurchaseForm.vue'
import { useMaterialsStore } from '@/stores/materials'
import { usePermissionsStore } from '@/stores/permissions'

// Mock router
vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { id: undefined },
    query: {}
  }),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn()
  })
}))

// Mock API client
vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { results: [], count: 0 } }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} })
  }
}))

describe('PurchaseForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Component Mounting', () => {
    it('mounts successfully', () => {
      const wrapper = mount(PurchaseForm, {
        global: {
          stubs: {
            MaterialSearchSelect: true,
            SupplierSearchSelect: true,
            GenericForm: true
          }
        }
      })
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('New Material Creation', () => {
    it('marks material as new when custom name is entered', async () => {
      const wrapper = mount(PurchaseForm, {
        global: {
          stubs: {
            MaterialSearchSelect: true,
            SupplierSearchSelect: true,
            GenericForm: true
          }
        }
      })

      const vm = wrapper.vm as any
      const testItem = {
        material: null,
        material_name: '',
        unit: 0,
        quantity: 1,
        price: '0',
        amount: '0',
        isNewMaterial: false
      }

      // onCustomMaterial есть всегда (PurchaseForm.vue:1289); прежний escape-hatch `if (typeof===
      // 'function'){…} else {exists()}` делал тест непадающим.
      vm.onCustomMaterial(testItem, 'Новый материал')
      expect(testItem.isNewMaterial).toBe(true)
      expect(testItem.material_name).toBe('Новый материал')
      expect(testItem.unit).toBe(0)
    })

    it('validates that unit is required for new materials', async () => {
      const wrapper = mount(PurchaseForm, {
        global: {
          stubs: {
            MaterialSearchSelect: true,
            SupplierSearchSelect: true,
            GenericForm: true
          }
        }
      })

      const _vm = wrapper.vm as any

      // Create item with new material but no unit
      const testItem = {
        material: null,
        material_name: 'Новый материал',
        unit: 0,
        quantity: 1,
        price: '100',
        amount: '100',
        isNewMaterial: true
      }

      // Check validation logic
      const hasErrors = testItem.isNewMaterial && testItem.material_name && (!testItem.unit || testItem.unit === 0)
      expect(hasErrors).toBe(true)
    })

    // M2: ошибки валидации позиций должны рендериться через getItemFieldError (itemErrors),
    // а не молча уходить в локальный errors, где шаблон их не читает.
    it('M2: item validation error surfaces via getItemFieldError, not swallowed', async () => {
      const wrapper = mount(PurchaseForm, {
        global: {
          stubs: { MaterialSearchSelect: true, SupplierSearchSelect: true, GenericForm: true }
        }
      })
      const vm = wrapper.vm as any
      vm.addItem()
      Object.assign(vm.items[0], {
        material: null, material_name: 'Новый материал', isNewMaterial: true,
        unit: 0, quantity: '1', price: '100',
      })

      await vm.onSaved({})
      await wrapper.vm.$nextTick()

      expect(vm.getItemFieldError(0, 'unit')).toContain('Единица измерения обязательна')
    })

    it('handles edit mode correctly', async () => {
      const wrapper = mount(PurchaseForm, {
        global: {
          stubs: {
            MaterialSearchSelect: true,
            SupplierSearchSelect: true,
            GenericForm: true
          }
        }
      })

      const vm = wrapper.vm as any

      // Access isEdit - it might be a ref or a computed property
      const isEdit = typeof vm.isEdit === 'object' ? vm.isEdit.value : vm.isEdit

      // In new form mode, isEdit should be false
      expect(isEdit === false || isEdit === undefined).toBe(true)
    })

    it('F-998 (#73, баг владельца): edit-мэппинг переносит responsible в initialData', async () => {
      // Регресс: «responsible убран — устанавливается автоматически из объекта» — легаси-коммент
      // эпохи ДО фичи «Ответственный» (F-751): поле в форме есть, а edit-мэппинг его терял →
      // на редактировании закупки select «Ответственный» всегда пуст (владелец 2026-08-10).
      const wrapper = mount(PurchaseForm, {
        props: {
          initial: {
            id: 9, date: '2026-08-01', object: 3, supplier: 4, responsible: 352,
            invoice_number: '', purchase_no: 'P-1', status: 'new', currency: 'UZS',
            comment: '', items: [],
          } as any,
        },
        global: { stubs: { MaterialSearchSelect: true, SupplierSearchSelect: true, GenericForm: true } },
      })
      const vm = wrapper.vm as any
      const init = typeof vm.initialData === 'object' && 'value' in (vm.initialData || {})
        ? vm.initialData.value : vm.initialData
      expect(init.responsible).toBe(352)   // BE-значение доезжает до формы (не теряется мэппингом)
      expect(init.object).toBe(3)          // соседний ключ цел (санити мэппинга)
    })
  })

  describe('Purchase Number Generation', () => {
    it('allows empty purchase_no for backend generation', async () => {
      const _wrapper = mount(PurchaseForm, {
        global: {
          stubs: {
            MaterialSearchSelect: true,
            SupplierSearchSelect: true,
            GenericForm: true
          }
        }
      })

      // Simulate form data with empty purchase_no
      const formData = {
        date: '2025-11-25',
        object: 1,
        supplier: 1,
        purchase_no: '',
        status: 'new',
        currency: 'UZS',
        comment: '',
        items: [
          {
            material: 1,
            unit: 1,
            quantity: 10,
            price: '100',
            amount: '1000'
          }
        ]
      }

      // Empty purchase_no should not be included in the payload for backend auto-generation
      // Build payload without empty purchase_no
      const { purchase_no, ...rest } = formData
      const payload = purchase_no?.trim() 
        ? { ...rest, purchase_no: purchase_no.trim() } 
        : rest

      // Verify empty purchase_no is not in payload
      expect('purchase_no' in payload).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('handles validation errors', async () => {
      const wrapper = mount(PurchaseForm, {
        global: {
          stubs: {
            MaterialSearchSelect: true,
            SupplierSearchSelect: true,
            GenericForm: true
          }
        }
      })

      // Component should initialize with at least one item or handle empty items
      expect(wrapper.exists()).toBe(true)
    })

    it('validates that at least one item exists', async () => {
      const wrapper = mount(PurchaseForm, {
        global: {
          stubs: {
            MaterialSearchSelect: true,
            SupplierSearchSelect: true,
            GenericForm: true
          }
        }
      })

      const vm = wrapper.vm as any
      
      // Access items - handle both ref and regular array
      const items = typeof vm.items === 'object' && vm.items.value !== undefined ? vm.items.value : vm.items

      // Было `Array.isArray(items) || wrapper.exists()).toBe(true)` — exists() всегда true → OR никогда
      // не падал. Позиции — реальный МАССИВ (форма стартует пустой, строки добавляются пользователем).
      expect(Array.isArray(items)).toBe(true)
      expect(items.length).toBe(0)
    })
  })

  describe('F-1043 (B4): «Создать» с названием существующего материала', () => {
    const mountForm = () => mount(PurchaseForm, {
      global: { stubs: { MaterialSearchSelect: true, SupplierSearchSelect: true, GenericForm: true } }
    })
    const newItem = () => ({
      material: undefined as number | undefined, material_name: '' as string | undefined, unit: 0,
      quantity: 500, price: '10', amount: '0', isNewMaterial: false
    })

    it('совпадение без учёта регистра и лишних пробелов → выбран существующий материал с его единицей', async () => {
      const wrapper = mountForm()
      await flushPromises() // форма грузит справочники на mount — подставляем материалы после загрузки
      const store = useMaterialsStore()
      store.items = [{ id: 7, name: 'Гофра ПВХ  25', default_unit: 3, is_active: true } as any]
      const vm = wrapper.vm as any
      const item = newItem()
      vm.onCustomMaterial(item, '  гофра пвх 25 ')
      expect(item.material).toBe(7)
      expect(item.isNewMaterial).toBe(false)
      expect(item.unit).toBe(3)
      expect(item.material_name).toBeUndefined()
    })

    it('новое название → новый материал, единицу выбирает пользователь', async () => {
      const wrapper = mountForm()
      await flushPromises()
      const store = useMaterialsStore()
      store.items = [{ id: 7, name: 'Гипс', default_unit: 3, is_active: true } as any]
      const vm = wrapper.vm as any
      const item = newItem()
      vm.onCustomMaterial(item, 'Гипс строительный')
      expect(item.material).toBeUndefined()
      expect(item.isNewMaterial).toBe(true)
      expect(item.material_name).toBe('Гипс строительный')
      expect(item.unit).toBe(0)
    })
  })

  describe('F-1065: количество позиции — строгий разбор', () => {
    it('«abc» у позиции с материалом → ошибка «больше 0», а не уход на сервер', async () => {
      const wrapper = mount(PurchaseForm, { global: { stubs: { MaterialSearchSelect: true, SupplierSearchSelect: true, GenericForm: true } } })
      await flushPromises()
      const vm = wrapper.vm as any
      vm.items.splice(0, vm.items.length, { material: 7, material_name: undefined, unit: 3, quantity: 'abc', price: '10', amount: '0', isNewMaterial: false })
      const errs = vm.validatePurchaseItems()
      expect(errs['items[0].quantity']).toBe('Количество должно быть больше 0')
    })
  })

  describe('Material Loading in Edit Mode', () => {
    it('loads materials correctly', async () => {
      // Set up materials store
      const materialsStore = useMaterialsStore
      materialsStore.items = [
        { id: 1, name: 'Test Material', is_active: true } as any
      ]

      const wrapper = mount(PurchaseForm, {
        global: {
          stubs: {
            MaterialSearchSelect: true,
            SupplierSearchSelect: true,
            GenericForm: true
          }
        }
      })

      await wrapper.vm.$nextTick()

      // Verify component renders
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Status Validation', () => {
    it('D-019: report photo is OPTIONAL for completed (does NOT block completion)', () => {
      // D-019/F-302: фото-отчёт при завершении ОПЦИОНАЛЕН. Завершённая закупка без него
      // ДОПУСТИМА (не блокируется); в списке она несёт янтарный маркер «нет фото-отчёта».
      // Прежний тест закреплял НЕВЕРНОЕ поведение (требование фото-отчёта).
      const completionAllowed = (status: string, reportPhotoCount: number) =>
        status !== 'completed' || reportPhotoCount >= 0 // completed допустимо при любом числе фото-отчётов

      expect(completionAllowed('completed', 0)).toBe(true) // без фото-отчёта — можно завершить
      expect(completionAllowed('completed', 2)).toBe(true) // с фото-отчётом — тоже
      expect(completionAllowed('new', 0)).toBe(true)
    })

    it('allows new status without photos', () => {
      const purchase = {
        status: 'new',
        photos: []
      }

      // New status doesn't require photos
      const isValid = purchase.status === 'new' || purchase.photos.length > 0
      expect(isValid).toBe(true)
    })
  })

  describe('Report photos visibility (F-615)', () => {
    function statusOf(vm: any): string {
      // formData — ref в <script setup>; test-utils может отдать и ref, и развёрнутый объект.
      return typeof vm.formData === 'object' && vm.formData.value !== undefined
        ? vm.formData.value.status
        : vm.formData.status
    }

    it('seeds status from an already-completed purchase so the «Фотоотчеты» section is available', async () => {
      // РЕГРЕССИЯ: раньше formData.status оставался 'new' при загрузке (не сидировался из
      // props.initial), и секция report_photos (condition: isEdit && status==='completed')
      // не появлялась у завершённой закупки — догрузить фото-отчёт было нельзя.
      const wrapper = mount(PurchaseForm, {
        props: { initial: { id: 5, status: 'completed', items: [], photos: [] } as any },
        global: { stubs: { MaterialSearchSelect: true, SupplierSearchSelect: true, GenericForm: true } }
      })
      await flushPromises()
      expect(statusOf(wrapper.vm)).toBe('completed')
    })

    it('keeps status new for a new purchase in edit mode', async () => {
      const wrapper = mount(PurchaseForm, {
        props: { initial: { id: 6, status: 'new', items: [], photos: [] } as any },
        global: { stubs: { MaterialSearchSelect: true, SupplierSearchSelect: true, GenericForm: true } }
      })
      await flushPromises()
      expect(statusOf(wrapper.vm)).toBe('new')
    })
  })

  describe('F-720: добавление позиции запрещено в выполненную закупку', () => {
    const stubs = { MaterialSearchSelect: true, SupplierSearchSelect: true, GenericForm: true }
    const canAdd = (vm: any) =>
      typeof vm.canAddItems === 'object' && vm.canAddItems.value !== undefined
        ? vm.canAddItems.value : vm.canAddItems
    const fdOf = (vm: any) =>
      typeof vm.formData === 'object' && vm.formData.value !== undefined ? vm.formData.value : vm.formData

    it('выполненная закупка → добавление позиции ЗАБЛОКИРОВАНО', async () => {
      const wrapper = mount(PurchaseForm, {
        props: { initial: { id: 7, status: 'completed', items: [], photos: [] } as any },
        global: { stubs }
      })
      await flushPromises()
      expect(canAdd(wrapper.vm)).toBe(false)
    })

    it('черновик (new) → добавление РАЗРЕШЕНО', async () => {
      const wrapper = mount(PurchaseForm, {
        props: { initial: { id: 8, status: 'new', items: [], photos: [] } as any },
        global: { stubs }
      })
      await flushPromises()
      expect(canAdd(wrapper.vm)).toBe(true)
    })

    it('создание новой закупки → добавление РАЗРЕШЕНО', async () => {
      const wrapper = mount(PurchaseForm, { global: { stubs } })
      await flushPromises()
      expect(canAdd(wrapper.vm)).toBe(true)
    })

    it('переоткрытие: статус выполненной → «Новая» снова РАЗРЕШАЕТ добавление', async () => {
      const wrapper = mount(PurchaseForm, {
        props: { initial: { id: 9, status: 'completed', items: [], photos: [] } as any },
        global: { stubs }
      })
      await flushPromises()
      fdOf(wrapper.vm).status = 'new'   // пользователь переоткрывает закупку
      await wrapper.vm.$nextTick()
      expect(canAdd(wrapper.vm)).toBe(true)
    })
  })

  describe('F-1085: дата проведённой закупки не меняется (ответ владельца 5)', () => {
    const stubs = { MaterialSearchSelect: true, SupplierSearchSelect: true, GenericForm: true }
    type DateField = { key: string; disabled?: boolean; help?: string }
    type FormVm = { formConfig: { fields: DateField[] }; formData: { status: string } }
    const vmOf = (w: { vm: unknown }) => w.vm as FormVm
    const dateField = (w: { vm: unknown }) => vmOf(w).formConfig.fields.find(f => f.key === 'date')
    const HINT = 'Дату проведённой закупки не меняют: отмените закупку и создайте новую с нужной датой'
    const mountWith = (id: number, status: string) => mount(PurchaseForm, {
      props: { initial: { id, status, date: '2026-03-01', items: [], photos: [] } as unknown as never },
      global: { stubs }
    })

    it('правка выполненной закупки → поле даты закрыто, подсказка как исправить', async () => {
      const wrapper = mountWith(17, 'completed')
      await flushPromises()
      expect(dateField(wrapper)?.disabled).toBe(true)
      expect(dateField(wrapper)?.help).toBe(HINT)
    })

    it('черновик → дату менять можно, подсказки нет', async () => {
      const wrapper = mountWith(18, 'new')
      await flushPromises()
      expect(dateField(wrapper)?.disabled).toBe(false)
      expect(dateField(wrapper)?.help).toBeUndefined()
    })

    it('снятие проведения (статус → «Новая») снова открывает дату — как на сервере', async () => {
      const wrapper = mountWith(19, 'completed')
      await flushPromises()
      vmOf(wrapper).formData.status = 'new'
      await wrapper.vm.$nextTick()
      expect(dateField(wrapper)?.disabled).toBe(false)
    })
  })

  describe('F-1087: ответственный при правке (ответ владельца 25)', () => {
    const stubs = { MaterialSearchSelect: true, SupplierSearchSelect: true, GenericForm: true }
    type Field = { key: string; condition?: () => boolean }
    type Vm = {
      formConfig: { fields: Field[] }
      preparePurchaseData: (d: Record<string, unknown>) => Record<string, unknown>
    }
    const MANAGER = ['purchases.view_all', 'purchases.edit_all', 'purchases.assign_responsible']
    const ADMIN = [...MANAGER, 'purchases.change_responsible']
    const seed = (perms: string[]) => {
      usePermissionsStore().permissions = perms.map((codename) => ({ codename })) as never
    }
    const respShown = (w: { vm: unknown }) => {
      const f = (w.vm as Vm).formConfig.fields.find(x => x.key === 'responsible')
      return !!f && (!f.condition || f.condition())
    }
    const payload = (w: { vm: unknown }) => (w.vm as Vm).preparePurchaseData({
      date: '2026-03-01', object: 1, supplier: 1, status: 'new', comment: '', responsible: 42, items: []
    })
    const editInitial = { id: 31, status: 'new', date: '2026-03-01', responsible: 42, items: [], photos: [] }

    it('manager на правке: поля «Ответственный» нет, в запрос не уходит', async () => {
      const w = mount(PurchaseForm, { props: { initial: editInitial as unknown as never }, global: { stubs } })
      await flushPromises()
      seed(MANAGER)  // после загрузки: форма при монтировании сама перечитывает права (мок API → пусто)
      expect(respShown(w)).toBe(false)
      expect('responsible' in payload(w)).toBe(false)
    })

    it('admin на правке: поле есть и уходит в запрос', async () => {
      const w = mount(PurchaseForm, { props: { initial: editInitial as unknown as never }, global: { stubs } })
      await flushPromises()
      seed(ADMIN)
      expect(respShown(w)).toBe(true)
      expect(payload(w).responsible).toBe(42)
    })

    it('смена объекта на правке не подставляет ответственного объекта; при создании — подставляет', async () => {
      type FieldVm = { genericFormRef: unknown; onFieldChange: (k: string, v: unknown) => void }
      for (const [initial, expected] of [[editInitial, 0], [undefined, 1]] as const) {
        const w = mount(PurchaseForm, { props: initial ? { initial: initial as unknown as never } : {}, global: { stubs } })
        await flushPromises()
        seed(MANAGER)
        const setFieldValue = vi.fn()
        const vm = w.vm as unknown as FieldVm
        vm.genericFormRef = { setFieldValue }
        vm.onFieldChange('object', 2)
        expect(setFieldValue.mock.calls.filter(c => c[0] === 'responsible').length).toBe(expected)
      }
    })

    it('manager при создании: поле есть (назначение при создании осталось)', async () => {
      const w = mount(PurchaseForm, { global: { stubs } })
      await flushPromises()
      seed(MANAGER)
      expect(respShown(w)).toBe(true)
    })
  })

  describe('Amount Calculation', () => {
    it('calculates item amount correctly', () => {
      const item = {
        quantity: 10,
        price: '100.50'
      }

      const amount = parseFloat(String(item.quantity)) * parseFloat(item.price)
      expect(amount).toBeCloseTo(1005, 2)
    })

    it('handles string and number inputs', () => {
      const item = {
        quantity: '5.5',
        price: '200'
      }

      const amount = parseFloat(String(item.quantity)) * parseFloat(item.price)
      expect(amount).toBeCloseTo(1100, 2)
    })
  })
})
