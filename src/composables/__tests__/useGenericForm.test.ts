import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGenericForm } from '../useGenericForm'
import type { GenericFormConfig } from '@/types/generic'

describe('useGenericForm', () => {
  const mockConfig: GenericFormConfig<any> = {
    title: 'Test Form',
    sections: [
      {
        title: 'Basic Info',
        fields: ['name', 'email'],
        order: 1
      }
    ],
    fields: [
      {
        key: 'name',
        type: 'input',
        label: 'Name',
        required: true,
        order: 1
      },
      {
        key: 'email',
        type: 'email',
        label: 'Email',
        required: true,
        order: 2
      }
    ],
    submitText: 'Save',
    cancelText: 'Cancel'
  }

  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with empty form data', () => {
    const { formData } = useGenericForm(mockConfig, {}, mockOnSubmit, mockOnCancel)
    
    expect(formData.value).toEqual({ name: '', email: '' })
  })

  it('initializes with provided initial data', () => {
    const initialData = { name: 'John', email: 'john@example.com' }
    const { formData } = useGenericForm(mockConfig, initialData, mockOnSubmit, mockOnCancel)
    
    expect(formData.value).toEqual(initialData)
  })

  it('validates required fields correctly', () => {
    const { errors, validateForm } = useGenericForm(mockConfig, {}, mockOnSubmit, mockOnCancel)
    
    const isValid = validateForm()
    
    expect(isValid).toBe(false)
    expect(errors.value.name).toBe('Поле обязательно для заполнения')
    expect(errors.value.email).toBe('Поле обязательно для заполнения')
  })

  it('validates email format correctly', () => {
    const { formData, errors, validateForm } = useGenericForm(mockConfig, {}, mockOnSubmit, mockOnCancel)
    
    formData.value.email = 'invalid-email'
    const isValid = validateForm()
    
    expect(isValid).toBe(false)
    expect(errors.value.email).toBe('Некорректный формат email')
  })

  it('passes validation with correct data', () => {
    const { formData, errors, validateForm } = useGenericForm(mockConfig, {}, mockOnSubmit, mockOnCancel)
    
    formData.value.name = 'John'
    formData.value.email = 'john@example.com'
    const isValid = validateForm()
    
    expect(isValid).toBe(true)
    expect(errors.value.name).toBeUndefined()
    expect(errors.value.email).toBeUndefined()
  })

  it('handles form submission successfully', async () => {
    const { formData, handleSubmit } = useGenericForm(mockConfig, {}, mockOnSubmit, mockOnCancel)
    
    formData.value.name = 'John'
    formData.value.email = 'john@example.com'
    
    await handleSubmit()
    
    expect(mockOnSubmit).toHaveBeenCalledWith({ name: 'John', email: 'john@example.com' })
  })

  it('handles form submission with validation errors', async () => {
    const { handleSubmit } = useGenericForm(mockConfig, {}, mockOnSubmit, mockOnCancel)
    
    await handleSubmit()
    
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('handles form cancellation', () => {
    const { handleCancel } = useGenericForm(mockConfig, {}, mockOnSubmit, mockOnCancel)
    
    handleCancel()
    
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('updates field value correctly', () => {
    const { formData, updateField } = useGenericForm(mockConfig, {}, mockOnSubmit, mockOnCancel)
    
    updateField('name', 'John')
    
    expect(formData.value.name).toBe('John')
  })

  it('gets field error correctly', () => {
    const { errors, getFieldError } = useGenericForm(mockConfig, {}, mockOnSubmit, mockOnCancel)
    
    errors.value.name = 'Name is required'
    
    expect(getFieldError('name')).toBe('Name is required')
  })

  it('clears field error correctly', () => {
    const { errors, clearFieldError } = useGenericForm(mockConfig, {}, mockOnSubmit, mockOnCancel)
    
    errors.value.name = 'Name is required'
    clearFieldError('name')
    
    expect(errors.value.name).toBeUndefined()
  })

  it('resets form to initial data', () => {
    const initialData = { name: 'John', email: 'john@example.com' }
    const { formData, resetForm } = useGenericForm(mockConfig, initialData, mockOnSubmit, mockOnCancel)
    
    formData.value.name = 'Jane'
    formData.value.email = 'jane@example.com'
    
    resetForm()
    
    expect(formData.value).toEqual(initialData)
  })

  it('handles auto-save functionality', async () => {
    const { formData, autoSave } = useGenericForm(mockConfig, {}, mockOnSubmit, mockOnCancel, { autoSave: true })
    
    formData.value.name = 'John'
    
    // Wait for debounced auto-save
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    expect(mockOnSubmit).toHaveBeenCalled()
  })
})

