import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// F-067: раньше режим определялся только по route.params.id, из-за чего
// редактирование из модалки (через :initial) шло как создание → дубликаты.

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {} }),          // без route id
  useRouter: () => ({ push: vi.fn() }),
}))

const update = vi.fn().mockResolvedValue({})
const create = vi.fn().mockResolvedValue({})
vi.mock('@/stores/materialCategories', () => ({
  useMaterialCategoriesStore: () => ({
    items: [], selectOptions: [],
    fetchList: vi.fn().mockResolvedValue(undefined),
    fetchOne: vi.fn().mockResolvedValue(undefined),
    update, create,
  }),
}))
vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: () => ({ handleFormError: vi.fn() }),
}))

import CategoryForm from '@/pages/Materials/Categories/CategoryForm.vue'

// F-244: GenericForm consumes submission via the `onSubmit` PROP (not a `submit` emit). The old
// stub lied (emitted 'submit'), hiding that CategoryForm wired @submit — which never fires. This
// stub uses the real contract, so it fails if CategoryForm goes back to @submit.
const GenericFormStub = {
  props: ['config', 'initialData', 'onSubmit', 'onCancel'],
  template: '<div class="gf" :data-submit="config.submitText" :data-name="initialData.name" @click="onSubmit && onSubmit({ name: initialData.name, parent: initialData.parent })"></div>',
}

const mountForm = (props: Record<string, unknown>) =>
  mount(CategoryForm, { props, global: { stubs: { GenericForm: GenericFormStub } } })

describe('CategoryForm — edit vs create (F-067)', () => {
  beforeEach(() => { setActivePinia(createPinia()); update.mockClear(); create.mockClear() })

  it('EDIT mode when :initial has an id (modal), even without a route id', () => {
    const gf = mountForm({ initial: { id: 5, name: 'Кабель', parent: null } }).find('.gf')
    expect(gf.attributes('data-submit')).toBe('Сохранить изменения')
    expect(gf.attributes('data-name')).toBe('Кабель')
  })

  it('submitting an :initial edit calls update (not create) and emits saved', async () => {
    const w = mountForm({ initial: { id: 5, name: 'Кабель', parent: null } })
    await w.find('.gf').trigger('click')      // stub emits submit
    expect(update).toHaveBeenCalledWith(5, expect.objectContaining({ name: 'Кабель' }))
    expect(create).not.toHaveBeenCalled()
    expect(w.emitted('saved')).toBeTruthy()
  })

  it('CREATE mode with no :initial and no route id', () => {
    const gf = mountForm({}).find('.gf')
    expect(gf.attributes('data-submit')).toBe('Создать категорию')
  })
})
