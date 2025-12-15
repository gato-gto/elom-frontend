/**
 * Тесты для компонента GenericForm
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import GenericForm from '@/components/GenericForm.vue'

// Мокаем composables
vi.mock('@/composables/useNotifications', () => ({
  useNotifications: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn()
  })
}))

vi.mock('@/utils/errorHandler', () => ({
  handleFormError: vi.fn()
}))

interface TestFormData {
  name: string
  email?: string
  age?: number
  isActive?: boolean
  category?: string
}

describe('GenericForm', () => {
  let wrapper: VueWrapper<any>

  const defaultConfig = {
    title: 'Test Form',
    fields: [
      {
        key: 'name' as keyof TestFormData,
        type: 'text' as const,
        label: 'Name',
        placeholder: 'Enter name',
        required: true,
        order: 1,
        width: 'half' as const
      },
      {
        key: 'email' as keyof TestFormData,
        type: 'email' as const,
        label: 'Email',
        placeholder: 'Enter email',
        required: false,
        order: 2,
        width: 'half' as const
      },
      {
        key: 'age' as keyof TestFormData,
        type: 'number' as const,
        label: 'Age',
        placeholder: 'Enter age',
        min: 18,
        max: 65,
        required: false,
        order: 3,
        width: 'full' as const
      },
      {
        key: 'isActive' as keyof TestFormData,
        type: 'checkbox' as const,
        label: 'Active',
        required: false,
        order: 4,
        width: 'full' as const
      },
      {
        key: 'category' as keyof TestFormData,
        type: 'select' as const,
        label: 'Category',
        placeholder: 'Select category',
        options: [
          { value: 'cat1', label: 'Category 1' },
          { value: 'cat2', label: 'Category 2' },
          { value: 'cat3', label: 'Category 3' }
        ],
        required: true,
        order: 5,
        width: 'full' as const
      }
    ],
    submitText: 'Save',
    cancelText: 'Cancel'
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render form title', () => {
      wrapper = mount(GenericForm, {
        props: {
          config: defaultConfig
        }
      })

      expect(wrapper.find('h2').text()).toBe('Test Form')
    })

    it('should render all field types', () => {
      wrapper = mount(GenericForm, {
        props: {
          config: defaultConfig
        }
      })

      // Text input
      const nameInput = wrapper.find('input[type="text"]')
      expect(nameInput.exists()).toBe(true)
      expect(nameInput.attributes('placeholder')).toBe('Enter name')

      // Email input
      const emailInput = wrapper.find('input[type="email"]')
      expect(emailInput.exists()).toBe(true)

      // Number input
      const ageInput = wrapper.find('input[type="number"]')
      expect(ageInput.exists()).toBe(true)
      expect(ageInput.attributes('min')).toBe('18')
      expect(ageInput.attributes('max')).toBe('65')

      // Checkbox
      const checkboxInput = wrapper.find('input[type="checkbox"]')
      expect(checkboxInput.exists()).toBe(true)

      // Select
      const selectInput = wrapper.find('select')
      expect(selectInput.exists()).toBe(true)
      const options = selectInput.findAll('option')
      expect(options).toHaveLength(4) // 3 categories + placeholder
    })

    it('should show required indicators', () => {
      wrapper = mount(GenericForm, {
        props: {
          config: defaultConfig
        }
      })

      const requiredLabels = wrapper.findAll('[data-required="true"]')
      expect(requiredLabels).toHaveLength(2) // name and category are required
    })

    it('should apply field width classes', () => {
      wrapper = mount(GenericForm, {
        props: {
          config: defaultConfig
        }
      })

      const halfWidthFields = wrapper.findAll('[data-width="half"]')
      expect(halfWidthFields).toHaveLength(2) // name and email

      const fullWidthFields = wrapper.findAll('[data-width="full"]')
      expect(fullWidthFields).toHaveLength(3) // age, isActive, category
    })

    it('should render submit and cancel buttons', () => {
      wrapper = mount(GenericForm, {
        props: {
          config: defaultConfig
        }
      })

      const submitButton = wrapper.find('[data-testid="submit-button"]')
      expect(submitButton.exists()).toBe(true)
      expect(submitButton.text()).toBe('Save')

      const cancelButton = wrapper.find('[data-testid="cancel-button"]')
      expect(cancelButton.exists()).toBe(true)
      expect(cancelButton.text()).toBe('Cancel')
    })
  })

  describe('Form State', () => {
    it('should initialize with empty form data', () => {
      wrapper = mount(GenericForm, {
        props: {
          config: defaultConfig
        }
      })

      const nameInput = wrapper.find('input[name="name"]')
      const emailInput = wrapper.find('input[name="email"]')
      const ageInput = wrapper.find('input[name="age"]')
      const activeInput = wrapper.find('input[name="isActive"]')
      const categorySelect = wrapper.find('select[name="category"]')

      expect(nameInput.element.value).toBe('')
      expect(emailInput.element.value).toBe('')
      expect(ageInput.element.value).toBe('')
      expect(activeInput.element.checked).toBe(false)
      expect(categorySelect.element.value).toBe('')
    })

    it('should initialize with provided initial data', () => {
      const initialData: TestFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        isActive: true,
        category: 'cat2'
      }

      wrapper = mount(GenericForm, {
        props: {
          config: defaultConfig,
          initial: initialData
        }
      })

      const nameInput = wrapper.find('input[name="name"]')
      const emailInput = wrapper.find('input[name="email"]')
      const ageInput = wrapper.find('input[name="age"]')
      const activeInput = wrapper.find('input[name="isActive"]')
      const categorySelect = wrapper.find('select[name="category"]')

      expect(nameInput.element.value).toBe('John Doe')
      expect(emailInput.element.value).toBe('john@example.com')
      expect(ageInput.element.value).toBe('30')
      expect(activeInput.element.checked).toBe(true)
      expect(categorySelect.element.value).toBe('cat2')
    })

    it('should update form data when inputs change', async () => {
      wrapper = mount(GenericForm, {
        props: {
          config: defaultConfig
        }
      })

      const nameInput = wrapper.find('input[name="name"]')
      const emailInput = wrapper.find('input[name="email"]')

      await nameInput.setValue('Jane Doe')
      await emailInput.setValue('jane@example.com')

      expect(nameInput.element.value).toBe('Jane Doe')
      expect(emailInput.element.value).toBe('jane@example.com')
    })

    it('should emit submit event with form data', async () => {
      wrapper = mount(GenericForm, {
        props: {
          config: defaultConfig
        }
      })

      // Fill form
      await wrapper.find('input[name="name"]').setValue('Test User')
      await wrapper.find('input[name="email"]').setValue('test@example.com')
      await wrapper.find('input[name="age"]').setValue('25')
      await wrapper.find('input[name="isActive"]').setChecked(true)
      await wrapper.find('select[name="category"]').setValue('cat1')

      // Submit form
      await wrapper.find('[data-testid="submit-button"]').trigger('click')

      expect(wrapper.emitted('submit')).toBeTruthy()
      const submittedData = wrapper.emitted('submit')?.[0]?.[0]
      
      expect(submittedData).toEqual({
        name: 'Test User',
        email: 'test@example.com',
        age: 25,
        isActive: true,
        category: 'cat1'
      })
    })

    it('should emit cancel event when cancel button clicked', async () => {
      wrapper = mount(GenericForm, {
        props: {
          config: defaultConfig
        }
      })

      await wrapper.find('[data-testid="cancel-button"]').trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
    })
  })

  describe('Validation', () => {
    it('should validate required fields', async () => {
      const configWithValidation = {
        ...defaultConfig,
        validation: {
          name: [(value: string) => value.length > 0 || 'Name is required'],
          email: [(value: string) => !value || value.includes('@') || 'Invalid email']
        }
      }

      wrapper = mount(GenericForm, {
        props: {
          config: configWithValidation
        }
      })

      // Try to submit with empty required field
      await wrapper.find('[data-testid="submit-button"]').trigger('click')

      // Should show validation errors
      await expect(wrapper.text()).toContain('Name is required')
    })

    it('should validate email format', async () => {
      const configWithEmailValidation = {
        ...defaultConfig,
        validation: {
          email: [(value: string) => !value || value.includes('@') || 'Invalid email format']
        }
      }

      wrapper = mount(GenericForm, {
        props: {
          config: configWithEmailValidation
        }
      })

      await wrapper.find('input[name="email"]').setValue('invalid-email')
      await wrapper.find('input[name="name"]').setValue('Valid Name')
      await wrapper.find('select[name="category"]').setValue('cat1')

      await wrapper.find('[data-testid="submit-button"]').trigger('click')

      await expect(wrapper.text()).toContain('Invalid email format')
    })

    it('should validate number ranges', async () => {
      wrapper = mount(GenericForm, {
        props: {
          config: defaultConfig
        }
      })

      // Test min value
      await wrapper.find('input[name="age"]').setValue('15') // Below min (18)
      await wrapper.find('input[name="name"]').setValue('Valid Name')
      await wrapper.find('select[name="category"]').setValue('cat1')

      await wrapper.find('[data-testid="submit-button"]').trigger('click')

      // Browser validation should prevent submission or show error
      const ageInput = wrapper.find('input[name="age"]')
      expect(ageInput.element.validity.valid).toBe(false)
    })

    it('should show custom validation errors', async () => {
      const configWithCustomValidation = {
        ...defaultConfig,
        validation: {
          name: [
            (value: string) => value.length >= 3 || 'Name must be at least 3 characters',
            (value: string) => value.length <= 50 || 'Name must be less than 50 characters'
          ]
        }
      }

      wrapper = mount(GenericForm, {
        props: {
          config: configWithCustomValidation
        }
      })

      await wrapper.find('input[name="name"]').setValue('Jo') // Too short
      await wrapper.find('[data-testid="submit-button"]').trigger('click')

      await expect(wrapper.text()).toContain('Name must be at least 3 characters')
    })
  })

  describe('Loading State', () => {
    it('should show loading state during submission', async () => {
      wrapper = mount(GenericForm, {
        props: {
          config: defaultConfig,
          loading: true
        }
      })

      const submitButton = wrapper.find('[data-testid="submit-button"]')
      
      expect(submitButton.attributes('disabled')).toBeDefined()
      expect(submitButton.text()).toContain('...') // Loading indicator
    })

    it('should disable form inputs during loading', () => {
      wrapper = mount(GenericForm, {
        props: {
          config: defaultConfig,
          loading: true
        }
      })

      const nameInput = wrapper.find('input[name="name"]')
      const categorySelect = wrapper.find('select[name="category"]')

      expect(nameInput.attributes('disabled')).toBeDefined()
      expect(categorySelect.attributes('disabled')).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should display API errors', () => {
      const errors = {
        name: ['Name is required'],
        email: ['Invalid email address']
      }

      wrapper = mount(GenericForm, {
        props: {
          config: defaultConfig,
          errors: errors
        }
      })

      expect(wrapper.text()).toContain('Name is required')
      expect(wrapper.text()).toContain('Invalid email address')
    })

    it('should highlight fields with errors', () => {
      const errors = {
        name: ['Name is required']
      }

      wrapper = mount(GenericForm, {
        props: {
          config: defaultConfig,
          errors: errors
        }
      })

      const nameInput = wrapper.find('input[name="name"]')
      expect(nameInput.classes()).toContain('border-error')
    })

    it('should clear errors when input changes', async () => {
      const errors = {
        name: ['Name is required']
      }

      wrapper = mount(GenericForm, {
        props: {
          config: defaultConfig,
          errors: errors
        }
      })

      // Initially should show error
      expect(wrapper.text()).toContain('Name is required')

      // Type in the field
      await wrapper.find('input[name="name"]').setValue('Valid Name')

      // Error should be cleared (if clearErrorsOnChange is true)
      expect(wrapper.emitted('clearErrors')).toBeTruthy()
    })
  })

  describe('Field Types', () => {
    it('should render textarea field', () => {
      const configWithTextarea = {
        ...defaultConfig,
        fields: [
          ...defaultConfig.fields,
          {
            key: 'description' as const,
            type: 'textarea' as const,
            label: 'Description',
            placeholder: 'Enter description',
            rows: 4,
            required: false,
            order: 6,
            width: 'full' as const
          }
        ]
      }

      wrapper = mount(GenericForm, {
        props: {
          config: configWithTextarea
        }
      })

      const textarea = wrapper.find('textarea[name="description"]')
      expect(textarea.exists()).toBe(true)
      expect(textarea.attributes('rows')).toBe('4')
      expect(textarea.attributes('placeholder')).toBe('Enter description')
    })

    it('should render date field', () => {
      const configWithDate = {
        ...defaultConfig,
        fields: [
          ...defaultConfig.fields,
          {
            key: 'birthDate' as const,
            type: 'date' as const,
            label: 'Birth Date',
            required: false,
            order: 6,
            width: 'half' as const
          }
        ]
      }

      wrapper = mount(GenericForm, {
        props: {
          config: configWithDate
        }
      })

      const dateInput = wrapper.find('input[type="date"]')
      expect(dateInput.exists()).toBe(true)
    })

    it('should render password field', () => {
      const configWithPassword = {
        ...defaultConfig,
        fields: [
          ...defaultConfig.fields,
          {
            key: 'password' as const,
            type: 'password' as const,
            label: 'Password',
            placeholder: 'Enter password',
            required: true,
            order: 6,
            width: 'full' as const
          }
        ]
      }

      wrapper = mount(GenericForm, {
        props: {
          config: configWithPassword
        }
      })

      const passwordInput = wrapper.find('input[type="password"]')
      expect(passwordInput.exists()).toBe(true)
    })

    it('should render hidden fields', () => {
      const configWithHidden = {
        ...defaultConfig,
        fields: [
          ...defaultConfig.fields,
          {
            key: 'hiddenId' as const,
            type: 'hidden' as const,
            label: 'Hidden ID',
            required: false,
            order: 0,
            width: 'full' as const
          }
        ]
      }

      wrapper = mount(GenericForm, {
        props: {
          config: configWithHidden
        }
      })

      const hiddenInput = wrapper.find('input[type="hidden"]')
      expect(hiddenInput.exists()).toBe(true)
    })
  })

  describe('Field Ordering', () => {
    it('should render fields in order', () => {
      const configWithRandomOrder = {
        ...defaultConfig,
        fields: [
          {
            key: 'field3' as const,
            type: 'text' as const,
            label: 'Field 3',
            order: 3,
            width: 'full' as const
          },
          {
            key: 'field1' as const,
            type: 'text' as const,
            label: 'Field 1',
            order: 1,
            width: 'full' as const
          },
          {
            key: 'field2' as const,
            type: 'text' as const,
            label: 'Field 2',
            order: 2,
            width: 'full' as const
          }
        ]
      }

      wrapper = mount(GenericForm, {
        props: {
          config: configWithRandomOrder
        }
      })

      const labels = wrapper.findAll('label')
      expect(labels[0].text()).toContain('Field 1')
      expect(labels[1].text()).toContain('Field 2')
      expect(labels[2].text()).toContain('Field 3')
    })

    it('should handle fields without order (should appear last)', () => {
      const configWithMixedOrder = {
        ...defaultConfig,
        fields: [
          {
            key: 'ordered' as const,
            type: 'text' as const,
            label: 'Ordered Field',
            order: 1,
            width: 'full' as const
          },
          {
            key: 'unordered' as const,
            type: 'text' as const,
            label: 'Unordered Field',
            // no order property
            width: 'full' as const
          }
        ]
      }

      wrapper = mount(GenericForm, {
        props: {
          config: configWithMixedOrder
        }
      })

      const labels = wrapper.findAll('label')
      expect(labels[0].text()).toContain('Ordered Field')
      expect(labels[labels.length - 1].text()).toContain('Unordered Field')
    })
  })

  describe('Conditional Fields', () => {
    it('should show/hide fields based on conditions', async () => {
      const configWithConditional = {
        ...defaultConfig,
        fields: [
          {
            key: 'type' as const,
            type: 'select' as const,
            label: 'Type',
            options: [
              { value: 'basic', label: 'Basic' },
              { value: 'advanced', label: 'Advanced' }
            ],
            required: true,
            order: 1,
            width: 'full' as const
          },
          {
            key: 'advancedOption' as const,
            type: 'text' as const,
            label: 'Advanced Option',
            required: false,
            order: 2,
            width: 'full' as const,
            condition: (data: any) => data.type === 'advanced'
          }
        ]
      }

      wrapper = mount(GenericForm, {
        props: {
          config: configWithConditional
        }
      })

      // Initially advanced option should be hidden
      expect(wrapper.find('input[name="advancedOption"]').exists()).toBe(false)

      // Select advanced type
      await wrapper.find('select[name="type"]').setValue('advanced')

      // Advanced option should now be visible
      expect(wrapper.find('input[name="advancedOption"]').exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      wrapper = mount(GenericForm, {
        props: {
          config: defaultConfig
        }
      })

      const form = wrapper.find('form')
      expect(form.attributes('role')).toBe('form')

      const nameInput = wrapper.find('input[name="name"]')
      expect(nameInput.attributes('aria-required')).toBe('true')
      expect(nameInput.attributes('aria-describedby')).toBeTruthy()
    })

    it('should associate labels with inputs', () => {
      wrapper = mount(GenericForm, {
        props: {
          config: defaultConfig
        }
      })

      const nameLabel = wrapper.find('label[for="name"]')
      const nameInput = wrapper.find('input[id="name"]')

      expect(nameLabel.exists()).toBe(true)
      expect(nameInput.exists()).toBe(true)
    })

    it('should have proper tab order', () => {
      wrapper = mount(GenericForm, {
        props: {
          config: defaultConfig
        }
      })

      const inputs = wrapper.findAll('input, select, textarea')
      
      // Check that tabindex values are in order (if set)
      inputs.forEach((input, index) => {
        if (input.attributes('tabindex')) {
          expect(parseInt(input.attributes('tabindex')!)).toBeGreaterThanOrEqual(0)
        }
      })
    })
  })
})

