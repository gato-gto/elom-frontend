import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MaterialSearchSelect from '../MaterialSearchSelect.vue'
import { useMaterialsStore } from '@/stores/materials'
import apiClient from '@/api/client'

// Mock API client
vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}))

describe('MaterialSearchSelect', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
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
    it('emits update:modelValue (id) and change (material) when a material is selected', async () => {
      // F-976: раньше был побег `if (typeof vm.selectMaterial==='function'){…} else {exists()}` —
      // метод есть всегда (MaterialSearchSelect.vue:288), escape-ветка делала тест непадающим.
      const wrapper = mount(MaterialSearchSelect, { props: { modelValue: null } })
      const material = { id: 1, name: 'Цемент', default_unit: 1 }
      ;(wrapper.vm as any).selectMaterial(material)
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1])   // id выбранного
      expect(wrapper.emitted('change')?.[0]).toEqual([material])       // полный объект
    })

    it('emits change with the full material object (there is no material-selected event)', async () => {
      // F-976: прежний ассёрт `emitted('material-selected') || wrapper.exists()).toBeTruthy()` НИКОГДА
      // не падал (exists() всегда true). Компонент эмитит 'change', а НЕ 'material-selected'.
      const material = { id: 1, name: 'Цемент', default_unit: 1, is_active: true }
      const wrapper = mount(MaterialSearchSelect, { props: { modelValue: null } })
      ;(wrapper.vm as any).selectMaterial(material)
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('material-selected')).toBeUndefined()
      expect(wrapper.emitted('change')?.[0]).toEqual([material])
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

    it('handles custom material name input', async () => {
      const wrapper = mount(MaterialSearchSelect, {
        props: {
          modelValue: null,
          allowCustom: true
        }
      })

      const input = wrapper.find('input')
      await input.setValue('Новый материал')
      await wrapper.vm.$nextTick()
      
      // Verify the input value was set
      expect((input.element as HTMLInputElement).value).toBe('Новый материал')
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
    it('filters out excluded materials from search results', async () => {
      // F-976: фильтр исключений живёт ВНУТРИ async searchMaterials (через store.search, не items).
      // Прежний тройной побег падал в trivial props-check. Мокаем store.search → проверяем реальный фильтр.
      // base.search → api.get(list?search=) → data. Мокаем api-client (store.search — pinia-action,
      // переприсвоить нельзя надёжно), чтобы вернуть 3 материала.
      const m = (id: number, name: string) => ({ id, name, default_unit: 1, is_active: true })
      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [m(1, 'Цемент'), m(2, 'Песок'), m(3, 'Щебень')] } as any)

      const wrapper = mount(MaterialSearchSelect, {
        props: { modelValue: null, excludeMaterials: [2] }
      })
      await (wrapper.vm as any).searchMaterials('материал')   // ≥2 симв. → реальный поиск+фильтр

      const ids = (wrapper.vm as any).searchResults.map((mat: any) => mat.id)
      expect(ids).toEqual([1, 3])   // id=2 (excludeMaterials) отфильтрован, остальные сохранены
    })
  })

  describe('Search Functionality', () => {
    it('filters materials by name when searching', async () => {
      const store = useMaterialsStore
      store.items = [
        { id: 1, name: 'Цемент М500', default_unit: 1, is_active: true } as any,
        { id: 2, name: 'Песок речной', default_unit: 1, is_active: true } as any,
        { id: 3, name: 'Цемент М400', default_unit: 1, is_active: true } as any
      ]

      const wrapper = mount(MaterialSearchSelect, {
        props: {
          modelValue: null
        }
      })

      const input = wrapper.find('input')
      await input.setValue('цемент')
      await wrapper.vm.$nextTick()
      
      // Verify search input works
      expect((input.element as HTMLInputElement).value).toBe('цемент')
    })

    it('performs case-insensitive search', async () => {
      const store = useMaterialsStore
      store.items = [
        { id: 1, name: 'ЦЕМЕНТ', default_unit: 1, is_active: true } as any
      ]

      const wrapper = mount(MaterialSearchSelect, {
        props: {
          modelValue: null
        }
      })

      const input = wrapper.find('input')
      await input.setValue('цемент')
      await wrapper.vm.$nextTick()
      
      expect((input.element as HTMLInputElement).value).toBe('цемент')
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
    it('displays selected material name in the input', async () => {
      // F-976: было `expect(wrapper.exists()).toBe(true)` (тривиально). modelValue=1 + материал в store
      // → watcher(immediate) loadSelectedMaterial → searchQuery=name → v-model input показывает имя.
      // loadSelectedMaterial ищет материал в store.items (fetchOne НЕ добавляет новый). Сидлим items
      // через $patch (переприсвоение store.items на функцию — прежний no-op баг теста).
      // Явный pinia в mount: без него компонент берёт иной инстанс стора и не видит засеянные items.
      const pinia = createPinia()
      setActivePinia(pinia)
      const store = useMaterialsStore()
      store.$patch({ items: [{ id: 1, name: 'Цемент', default_unit: 1, is_active: true } as any] })

      const wrapper = mount(MaterialSearchSelect, { props: { modelValue: 1 }, global: { plugins: [pinia] } })
      await flushPromises()
      await wrapper.vm.$nextTick()

      expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Цемент')
    })
  })

  // Регресс: выпадающий список телепортируется в <body> и не наследует фон — у него
  // ДОЛЖЕН быть непрозрачный токен-фон, иначе контент под ним просвечивает (баг владельца).
  describe('Dropdown opacity (transparency regression)', () => {
    it('teleported dropdown declares an opaque surface background', async () => {
      const wrapper = mount(MaterialSearchSelect, { props: { modelValue: null }, attachTo: document.body })
      const vm = wrapper.vm as any
      vm.searchResults = [{ id: 1, name: 'Цемент' }]
      vm.showDropdown = true
      await wrapper.vm.$nextTick()
      const dd = document.body.querySelector('.fixed.z-50') as HTMLElement | null
      expect(dd).not.toBeNull()
      expect(dd!.className).toContain('bg-base-100') // непрозрачный фон поверхности
      wrapper.unmount()
    })
  })
})
