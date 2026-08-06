import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import GenericForm from '../GenericForm.vue'
import type { GenericFormConfig } from '@/types/generic'

// F-975 (тест-мутация-аудит): раньше композаблы мокались плоскими {value:…} — Vue-шаблон разворачивает
// ТОЛЬКО настоящие ref/computed (реальные useGenericForm.ts:303/313 отдают computed), поэтому `v-for in
// sections` итерировал объект, section.title=undefined → секции/поля ВООБЩЕ не рендерились, а 3 теста были
// зелёными лишь на html()).toBeTruthy(). Теперь мок отдаёт настоящие ref. ctrl.isSubmitting — управляемое
// состояние отправки (компонент НЕ имеет пропа loading; loading-UI гонится isSubmitting из композабла).
const mockSubmit = vi.fn()
const mockReset = vi.fn()
const mockSetFieldValue = vi.fn()
const mockGetFieldError = vi.fn(() => '')
const mockClearErrors = vi.fn()
const ctrl = vi.hoisted(() => ({ isSubmitting: false }))
const defaultSectionFields = (index: number) =>
  index === 0
    ? [
        { key: 'name', type: 'input', label: 'Name', required: true, order: 1 },
        { key: 'email', type: 'email', label: 'Email', required: true, order: 2 },
      ]
    : []
const mockGetSectionFields = vi.fn(defaultSectionFields)

vi.mock('@/composables/useGenericForm', async () => {
  const { ref, computed } = await import('vue')
  return {
    useGenericForm: () => ({
      form: ref({ name: '', email: '' }),
      errors: ref({}),
      isSubmitting: computed(() => ctrl.isSubmitting),
      isDirty: ref(false),
      isValid: ref(true),
      submit: mockSubmit,
      reset: mockReset,
      setFieldValue: mockSetFieldValue,
      getFieldError: mockGetFieldError,
      clearErrors: mockClearErrors,
    }),
    useFormSections: () => ({
      activeSection: ref(0),
      sections: ref([
        { title: 'Basic Info', description: 'Basic information section', fields: ['name', 'email'], order: 1 },
      ]),
      currentSection: ref({ title: 'Basic Info', description: 'Basic information section', fields: ['name', 'email'], order: 1 }),
      sectionErrors: ref({}),
      hasSectionErrors: ref(false),
      nextSection: vi.fn(),
      previousSection: vi.fn(),
      goToSection: vi.fn(),
      getSectionFields: mockGetSectionFields,
      validateSection: vi.fn(() => true),
    }),
  }
})

describe('GenericForm', () => {
  // Изоляция под shuffle: сбрасываем управляемое состояние и импл getSectionFields перед каждым тестом.
  beforeEach(() => {
    ctrl.isSubmitting = false
    mockSubmit.mockReset()
    mockGetSectionFields.mockImplementation(defaultSectionFields)
  })

  const mockConfig: GenericFormConfig<any> = {
    title: 'Test Form',
    subtitle: 'Test subtitle',
    sections: [
      {
        title: 'Basic Info',
        description: 'Basic information section',
        fields: ['name', 'email'],
        order: 1
      }
    ],
    fields: [
      {
        key: 'name',
        type: 'input',
        label: 'Name',
        placeholder: 'Enter name',
        required: true,
        order: 1
      },
      {
        key: 'email',
        type: 'email',
        label: 'Email',
        placeholder: 'Enter email',
        required: true,
        order: 2
      }
    ],
    submitText: 'Save',
    cancelText: 'Cancel',
    showCancel: true
  }

  const mountForm = (overrides = {}) => mount(GenericForm, {
    props: { config: mockConfig, initialData: {}, onSubmit: vi.fn(), onCancel: vi.fn(), ...overrides },
  })

  it('renders the form element and the section heading', () => {
    const wrapper = mountForm()
    // config.title/subtitle в секционном режиме НЕ рендерятся компонентом (их даёт обёртка-страница);
    // видимый заголовок формы = section.title в <h2 class="card-title">.
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('h2.card-title').text()).toBe('Basic Info')
  })

  it('renders section heading, description and its fields', () => {
    const wrapper = mountForm()
    expect(wrapper.find('h2.card-title').text()).toBe('Basic Info')
    expect(wrapper.text()).toContain('Basic information section')      // section.description
    // getSectionFields(0) → name(input)+email(email) → FormField рисует по одному <input> на поле.
    expect(wrapper.findAll('input').length).toBeGreaterThanOrEqual(2)
  })

  it('renders both submit and cancel buttons with their labels', () => {
    const wrapper = mountForm()
    const buttonTexts = wrapper.findAll('button').map(b => b.text())
    // раньше был слабый hasCancel || hasSubmit — обе кнопки ОБЯЗАНЫ присутствовать.
    expect(buttonTexts.some(t => t.includes('Cancel'))).toBe(true)
    expect(buttonTexts.some(t => t.includes('Save'))).toBe(true)
  })

  it('emits submit event when form is submitted', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    mockSubmit.mockResolvedValue(undefined)

    const wrapper = mountForm({ onSubmit })

    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(mockSubmit).toHaveBeenCalled()
  })

  it('emits cancel event when cancel button is clicked', async () => {
    const onCancel = vi.fn()
    const wrapper = mountForm({ onCancel })

    await wrapper.vm.$nextTick()
    const cancelButton = wrapper.find('button[type="button"]')
    expect(cancelButton.exists()).toBe(true)

    await cancelButton.trigger('click')
    await wrapper.vm.$nextTick()
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows loading state when isSubmitting is true (disabled submit + "Сохранение…")', () => {
    // Компонент НЕ имеет пропа loading — состояние отправки идёт через isSubmitting из композабла.
    ctrl.isSubmitting = true
    const wrapper = mountForm()

    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeDefined()
    expect(submitButton.text()).toContain('Сохранение...')
  })

  it('renders custom field slot when the field type is custom', () => {
    // Слот field-<key> рендерится ТОЛЬКО у поля type==='custom'. Дефолтный name='input' → слота нет
    // (прежний тест молча падал в else html()).toBeTruthy()). Делаем name custom-полем.
    mockGetSectionFields.mockImplementation((index: number) =>
      index === 0 ? [{ key: 'name', type: 'custom', label: 'Name', order: 1 }] : [])
    const wrapper = mount(GenericForm, {
      props: { config: mockConfig, initialData: {}, onSubmit: vi.fn(), onCancel: vi.fn() },
      slots: { 'field-name': '<div class="custom-section">Custom content</div>' },
    })

    const customSection = wrapper.find('.custom-section')
    expect(customSection.exists()).toBe(true)
    expect(customSection.text()).toBe('Custom content')
  })
})
