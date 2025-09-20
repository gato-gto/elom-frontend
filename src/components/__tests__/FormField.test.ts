import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
// import { nextTick } from 'vue' // Не используется
import FormField from '../FormField.vue'

describe('FormField', () => {
  it('renders input field correctly', () => {
    const wrapper = mount(FormField, {
      props: {
        modelValue: 'test value',
        label: 'Test Label',
        type: 'input',
        name: 'test-field'
      }
    })

    expect(wrapper.find('label').text()).toBe('Test Label')
    expect(wrapper.find('input').element.value).toBe('test value')
    expect(wrapper.find('input').attributes('name')).toBe('test-field')
  })

  it('renders textarea for textarea type', () => {
    const wrapper = mount(FormField, {
      props: {
        modelValue: 'test textarea value',
        label: 'Textarea Label',
        type: 'textarea',
        name: 'textarea-field'
      }
    })

    expect(wrapper.find('textarea').element.value).toBe('test textarea value')
    expect(wrapper.find('textarea').attributes('name')).toBe('textarea-field')
  })

  it('renders select for select type', () => {
    const options = [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' }
    ]

    const wrapper = mount(FormField, {
      props: {
        modelValue: '1',
        label: 'Select Label',
        type: 'select',
        name: 'select-field',
        options
      }
    })

    expect(wrapper.find('select').element.value).toBe('1')
    expect(wrapper.findAll('option')).toHaveLength(2)
  })

  it('renders date input for date type', () => {
    const wrapper = mount(FormField, {
      props: {
        modelValue: '2024-01-15',
        label: 'Date Label',
        type: 'date',
        name: 'date-field'
      }
    })

    expect(wrapper.find('input[type="date"]').element.value).toBe('2024-01-15')
  })

  it('shows error message when error prop is provided', () => {
    const wrapper = mount(FormField, {
      props: {
        modelValue: '',
        label: 'Test Label',
        type: 'input',
        name: 'test-field',
        error: 'This field is required'
      }
    })

    expect(wrapper.find('.text-error').text()).toBe('This field is required')
  })

  it('emits update:modelValue when input value changes', async () => {
    const wrapper = mount(FormField, {
      props: {
        modelValue: '',
        label: 'Test Label',
        type: 'input',
        name: 'test-field'
      }
    })

    const input = wrapper.find('input')
    await input.setValue('new value')
    await input.trigger('input')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['new value'])
  })

  it('applies required attribute when required prop is true', () => {
    const wrapper = mount(FormField, {
      props: {
        modelValue: '',
        label: 'Test Label',
        type: 'input',
        name: 'test-field',
        required: true
      }
    })

    expect(wrapper.find('input').attributes('required')).toBeDefined()
  })

  it('applies disabled attribute when disabled prop is true', () => {
    const wrapper = mount(FormField, {
      props: {
        modelValue: '',
        label: 'Test Label',
        type: 'input',
        name: 'test-field',
        disabled: true
      }
    })

    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })

  it('shows placeholder when provided', () => {
    const wrapper = mount(FormField, {
      props: {
        modelValue: '',
        label: 'Test Label',
        type: 'input',
        name: 'test-field',
        placeholder: 'Enter value here'
      }
    })

    expect(wrapper.find('input').attributes('placeholder')).toBe('Enter value here')
  })
})
