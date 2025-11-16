import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PurchaseForm from '../PurchaseForm.vue'

// Mock router
const mockRoute = { params: {}, query: {} }
vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() })
}))

// Mocks for stores
vi.mock('@/stores/purchases', () => ({
  usePurchasesStore: {
    create: vi.fn(async (data) => ({ id: 1, ...data })),
    update: vi.fn(async () => ({})),
    items: [],
    fetchList: vi.fn()
  }
}))

vi.mock('@/stores/materials', () => ({
  useMaterialsStore: {
    items: [{ id: 100, name: 'Цемент', default_unit: 5 }],
    fetchList: vi.fn().mockResolvedValue(undefined)
  }
}))
vi.mock('@/stores/units', () => ({
  useUnitsStore: {
    items: [{ id: 5, name: 'Килограмм', code: 'кг' }],
    fetchList: vi.fn().mockResolvedValue(undefined)
  }
}))
vi.mock('@/stores/objects', () => ({
  useObjectsStore: {
    items: [{ id: 1, name: 'Объект 1' }],
    fetchList: vi.fn().mockResolvedValue(undefined)
  }
}))
vi.mock('@/stores/employees', () => ({
  useEmployeesStore: {
    items: [{ id: 10, username: 'brigadier', role: 'brigadier', is_active: true }],
    fetchList: vi.fn().mockResolvedValue(undefined)
  }
}))
vi.mock('@/stores/suppliers', () => ({
  useSuppliersStore: {
    items: [{ id: 7, name: 'Поставщик' }],
    fetchList: vi.fn().mockResolvedValue(undefined)
  }
}))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast: vi.fn() }) }))
vi.mock('@/stores/notifications', () => ({ useNotificationsStore: () => ({ notifyPurchaseEdit: vi.fn(), notifyPurchaseError: vi.fn() }) }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ me: { id: 10, role: 'brigadier', username: 'brigadier' } }) }))

const GenericFormStub = {
  template: '<div><slot name="field-items" :field="{}" :value="[]" :error="null" :disabled="false" /></div>',
  props: ['config', 'initialData', 'onSubmit', 'onCancel', 'validateOnChange', 'resetOnSubmit']
}
const MaterialSearchSelectStub = {
  template: '<div class="material-select-stub"></div>'
}

describe('PurchaseForm.vue', () => {
  it('renders items table headers (Количество) per guide', async () => {
    const wrapper = mount(PurchaseForm, {
      props: { initial: null },
      global: {
        stubs: {
          GenericForm: GenericFormStub,
          MaterialSearchSelect: MaterialSearchSelectStub
        }
      }
    })
    expect(wrapper.html()).toContain('Количество')
  })
})


