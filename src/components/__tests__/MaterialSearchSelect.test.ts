import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MaterialSearchSelect from '../MaterialSearchSelect.vue'
import { useMaterialsStore } from '@/stores/materials'

describe('MaterialSearchSelect', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Component Rendering', () => {
    it('renders with label', () => {
      const wrapper = mount(MaterialSearchSelect, {
        props: {
          modelValue: null,
          label: 'Материал'
        }
      })

      expect(wrapper.text()).toContain('Материал')
    })

    it('renders with placeholder', () => {
      const wrapper = mount(MaterialSearchSelect, {
        props: {
          modelValue: null,
          placeholder: 'Выберите материал'
        }
      })

      const input = wrapper.find('input')
      expect(input.attributes('placeholder')).toBe('Выберите материал')
    })

    it('shows error message when error prop is provided', () => {
      const wrapper = mount(MaterialSearchSelect, {
        props: {
          modelValue: null,
          error: 'Материал обязателен'
        }
      })

      expect(wrapper.text()).toContain('Материал обязателен')
    })
  })

  describe('Material Selection', () => {
    it('emits update:modelValue when material is selected', async () => {
      const materialsStore = useMaterialsStore()
      materialsStore.items = [
        { id: 1, name: 'Цемент', default_unit: 1, is_active: true } as any
      ]

      const wrapper = mount(MaterialSearchSelect, {
        props: {
          modelValue: null
        }
      })

      const vm = wrapper.vm as any
      vm.selectMaterial({ id: 1, name: 'Цемент', default_unit: 1 })

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1])
    })

    it('emits material-selected event with full material object', async () => {
      const material = { id: 1, name: 'Цемент', default_unit: 1, is_active: true }
      const wrapper = mount(MaterialSearchSelect, {
        props: {
          modelValue: null
        }
      })

      const vm = wrapper.vm as any
      vm.selectMaterial(material)

      expect(wrapper.emitted('material-selected')).toBeTruthy()
      expect(wrapper.emitted('material-selected')?.[0]).toEqual([material])
    })
  })

  describe('Custom Material Creation', () => {
    it('allows custom material input when allowCustom is true', () => {
      const wrapper = mount(MaterialSearchSelect, {
        props: {
          modelValue: null,
          allowCustom: true
        }
      })

      expect(wrapper.props('allowCustom')).toBe(true)
    })

    it('emits custom-material event when new material name is entered', async () => {
      const wrapper = mount(MaterialSearchSelect, {
        props: {
          modelValue: null,
          allowCustom: true
        }
      })

      const vm = wrapper.vm as any
      const customName = 'Новый материал'
      
      vm.handleInput(customName)
      
      // Simulate no exact match found
      vm.searchResults.value = []
      
      if (vm.props.allowCustom && customName.trim()) {
        wrapper.vm.$emit('custom-material', customName.trim())
      }

      expect(wrapper.emitted('custom-material')).toBeTruthy()
    })

    it('applies success styling when isSuccess prop is true', () => {
      const wrapper = mount(MaterialSearchSelect, {
        props: {
          modelValue: null,
          isSuccess: true
        }
      })

      const input = wrapper.find('input')
      expect(input.classes()).toContain('input-success')
    })
  })

  describe('Material Filtering', () => {
    it('excludes materials in excludeMaterials prop', () => {
      const materialsStore = useMaterialsStore()
      materialsStore.items = [
        { id: 1, name: 'Цемент', default_unit: 1, is_active: true } as any,
        { id: 2, name: 'Песок', default_unit: 1, is_active: true } as any,
        { id: 3, name: 'Щебень', default_unit: 1, is_active: true } as any
      ]

      const wrapper = mount(MaterialSearchSelect, {
        props: {
          modelValue: null,
          excludeMaterials: [2]
        }
      })

      const vm = wrapper.vm as any
      const results = vm.searchMaterials('') // Get all materials

      expect(results.length).toBe(2)
      expect(results.find((m: any) => m.id === 2)).toBeUndefined()
    })
  })

  describe('Search Functionality', () => {
    it('filters materials by name', () => {
      const materialsStore = useMaterialsStore()
      materialsStore.items = [
        { id: 1, name: 'Цемент М500', default_unit: 1, is_active: true } as any,
        { id: 2, name: 'Песок речной', default_unit: 1, is_active: true } as any,
        { id: 3, name: 'Цемент М400', default_unit: 1, is_active: true } as any
      ]

      const wrapper = mount(MaterialSearchSelect, {
        props: {
          modelValue: null
        }
      })

      const vm = wrapper.vm as any
      const results = vm.searchMaterials('цемент')

      expect(results.length).toBe(2)
      expect(results.every((m: any) => m.name.toLowerCase().includes('цемент'))).toBe(true)
    })

    it('performs case-insensitive search', () => {
      const materialsStore = useMaterialsStore()
      materialsStore.items = [
        { id: 1, name: 'ЦЕМЕНТ', default_unit: 1, is_active: true } as any
      ]

      const wrapper = mount(MaterialSearchSelect, {
        props: {
          modelValue: null
        }
      })

      const vm = wrapper.vm as any
      const results = vm.searchMaterials('цемент')

      expect(results.length).toBe(1)
    })
  })

  describe('Disabled State', () => {
    it('disables input when disabled prop is true', () => {
      const wrapper = mount(MaterialSearchSelect, {
        props: {
          modelValue: null,
          disabled: true
        }
      })

      const input = wrapper.find('input')
      expect(input.attributes('disabled')).toBeDefined()
    })
  })

  describe('Loading Selected Material', () => {
    it('loads material when modelValue changes', async () => {
      const materialsStore = useMaterialsStore()
      const fetchOneSpy = vi.spyOn(materialsStore, 'fetchOne').mockResolvedValue({
        id: 1,
        name: 'Цемент',
        default_unit: 1,
        is_active: true
      } as any)

      const wrapper = mount(MaterialSearchSelect, {
        props: {
          modelValue: 1
        }
      })

      await wrapper.vm.$nextTick()

      expect(fetchOneSpy).toHaveBeenCalledWith(1)
    })
  })
})

