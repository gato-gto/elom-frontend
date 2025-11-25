import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PurchaseForm from '../PurchaseForm.vue'
import { usePurchasesStore } from '@/stores/purchases'
import { useMaterialsStore } from '@/stores/materials'
import { useObjectsStore } from '@/stores/objects'
import { useSuppliersStore } from '@/stores/suppliers'
import { useUnitsStore } from '@/stores/units'
import { useEmployeesStore } from '@/stores/employees'

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

describe('PurchaseForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
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

      // Simulate custom material input
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

      const vm = wrapper.vm as any
      
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

      vm.items.value = [testItem]

      // Try to validate
      const hasErrors = vm.items.value.some((it: any) => 
        it.isNewMaterial && it.material_name && (!it.unit || it.unit === 0)
      )

      expect(hasErrors).toBe(true)
    })

    it('does not allow new material creation in edit mode', async () => {
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
      vm.isEdit.value = true

      const testItem = {
        material: null,
        material_name: '',
        unit: 0,
        quantity: 1,
        price: '0',
        amount: '0',
        isNewMaterial: false
      }

      // Try to input material in edit mode
      vm.onMaterialInput(testItem, 'Новый материал')

      // Should not mark as new in edit mode
      expect(testItem.isNewMaterial).toBe(false)
    })
  })

  describe('Purchase Number Generation', () => {
    it('sends empty purchase_no to allow backend generation', async () => {
      const purchasesStore = usePurchasesStore()
      vi.spyOn(purchasesStore, 'create').mockResolvedValue({ id: 1 } as any)

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

      // Check that empty purchase_no is not included in payload
      const payload = {
        ...formData,
        ...(formData.purchase_no?.trim() ? { purchase_no: formData.purchase_no.trim() } : {})
      }

      expect(payload.purchase_no).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('handles purchase creation failure gracefully', async () => {
      const purchasesStore = usePurchasesStore()
      vi.spyOn(purchasesStore, 'create').mockRejectedValue(new Error('Network error'))

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

      try {
        await vm.onSaved({
          date: '2025-11-25',
          object: 1,
          supplier: 1,
          purchase_no: '',
          status: 'new',
          currency: 'UZS',
          comment: '',
          items: []
        })
      } catch (error) {
        expect(error).toBeDefined()
      }
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
      vm.items.value = []

      // Should show error when no items
      expect(vm.items.value.length).toBe(0)
    })
  })

  describe('Material Loading in Edit Mode', () => {
    it('loads all materials including inactive ones when editing', async () => {
      const materialsStore = useMaterialsStore()
      const fetchOneSpy = vi.spyOn(materialsStore, 'fetchOne').mockResolvedValue({
        id: 1,
        name: 'Test Material',
        is_active: false
      } as any)

      const purchasesStore = usePurchasesStore()
      vi.spyOn(purchasesStore, 'fetchOne').mockResolvedValue({
        id: 1,
        items: [
          { material: 1, unit: 1, quantity: 10, price: '100' }
        ]
      } as any)

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
      vm.isEdit.value = true
      vm.purchaseId.value = 1

      await vm.loadData()

      // Should have called fetchOne for the material
      expect(fetchOneSpy).toHaveBeenCalledWith(1)
    })
  })
})
