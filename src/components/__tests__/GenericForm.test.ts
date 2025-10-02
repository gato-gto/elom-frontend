import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GenericForm from '../GenericForm.vue'
import type { GenericFormConfig } from '@/types/generic'

// Mock composables
vi.mock('@/composables/useGenericForm', () => ({
  useGenericForm: () => ({
    formData: { name: '', email: '' },
    errors: {},
    loading: false,
    handleSubmit: vi.fn(),
    handleCancel: vi.fn(),
    getFieldError: vi.fn(() => ''),
    updateField: vi.fn()
  })
}))

describe('GenericForm', () => {
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

  it('renders form with correct title and subtitle', () => {
    const wrapper = mount(GenericForm, {
      props: {
        config: mockConfig,
        initialData: {},
        onSubmit: vi.fn(),
        onCancel: vi.fn()
      }
    })

    expect(wrapper.find('h2').text()).toBe('Test Form')
    expect(wrapper.find('p').text()).toBe('Test subtitle')
  })

  it('renders sections correctly', () => {
    const wrapper = mount(GenericForm, {
      props: {
        config: mockConfig,
        initialData: {},
        onSubmit: vi.fn(),
        onCancel: vi.fn()
      }
    })

    expect(wrapper.find('.card-title').text()).toBe('Basic Info')
    expect(wrapper.find('.text-base-content\\/70').text()).toBe('Basic information section')
  })

  it('renders submit and cancel buttons', () => {
    const wrapper = mount(GenericForm, {
      props: {
        config: mockConfig,
        initialData: {},
        onSubmit: vi.fn(),
        onCancel: vi.fn()
      }
    })

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0].text()).toBe('Cancel')
    expect(buttons[1].text()).toBe('Save')
  })

  it('emits submit event when form is submitted', async () => {
    const onSubmit = vi.fn()
    const wrapper = mount(GenericForm, {
      props: {
        config: mockConfig,
        initialData: {},
        onSubmit,
        onCancel: vi.fn()
      }
    })

    await wrapper.find('form').trigger('submit')
    
    expect(onSubmit).toHaveBeenCalled()
  })

  it('emits cancel event when cancel button is clicked', async () => {
    const onCancel = vi.fn()
    const wrapper = mount(GenericForm, {
      props: {
        config: mockConfig,
        initialData: {},
        onSubmit: vi.fn(),
        onCancel
      }
    })

    await wrapper.find('button[type="button"]').trigger('click')
    
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows loading state correctly', () => {
    const wrapper = mount(GenericForm, {
      props: {
        config: mockConfig,
        initialData: {},
        onSubmit: vi.fn(),
        onCancel: vi.fn(),
        loading: true
      }
    })

    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeDefined()
    expect(submitButton.text()).toContain('Сохранение...')
  })

  it('renders custom slots correctly', () => {
    const wrapper = mount(GenericForm, {
      props: {
        config: mockConfig,
        initialData: {},
        onSubmit: vi.fn(),
        onCancel: vi.fn()
      },
      slots: {
        'section-basic-info': '<div class="custom-section">Custom content</div>'
      }
    })

    expect(wrapper.find('.custom-section').text()).toBe('Custom content')
  })
})

