import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FormField from '../FormField.vue'

describe('FormField', () => {
  it('renders input field correctly', () => {
    const wrapper = mount(FormField, {
      props: {
        modelValue: 'test value',
        label: 'Test Label'
      }
    })

    expect(wrapper.find('label').text()).toContain('Test Label')
    expect(wrapper.find('input').element.value).toBe('test value')
  })

  it('renders textarea for textarea type', () => {
    const wrapper = mount(FormField, {
      props: {
        modelValue: 'test textarea value',
        type: 'textarea',
        label: 'Textarea Label'
      }
    })

    expect(wrapper.find('textarea').element.value).toBe('test textarea value')
  })

  it('renders select for select type', () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ]

    const wrapper = mount(FormField, {
      props: {
        modelValue: 'option1',
        type: 'select',
        label: 'Select Label',
        placeholder: '— выберите —',
        options
      }
    })

    expect(wrapper.find('select').element.value).toBe('option1')
    expect(wrapper.findAll('option')).toHaveLength(3) // 1 placeholder + 2 options
  })

  it('F-1035: пустое значение селекта показывает плейсхолдер, а не пустое поле (selectedIndex −1)', () => {
    // Плейсхолдер-опция была :value="undefined" → Vue снимает атрибут, значением опции становится её текст,
    // а селекту с пустым modelValue Vue ставит value='' → ни одна опция не совпадает → WebKit рисует пустой
    // селект (живой репро 2026-08-29: «Ответственный» и «Текущий этап работ» в форме объекта).
    const options = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]
    for (const empty of [undefined, '', null]) {
      const wrapper = mount(FormField, {
        props: { modelValue: empty, type: 'select', label: 'Этап', placeholder: '— выберите этап —', options }
      })
      const select = wrapper.find('select').element as HTMLSelectElement
      expect(select.selectedIndex, `modelValue=${String(empty)}`).toBe(0)
      expect(select.options[0].text).toBe('— выберите этап —')
      expect(select.options[0].disabled).toBe(true)
      expect(select.value).toBe('')
    }
  })

  it('renders date input for date type', () => {
    const wrapper = mount(FormField, {
      props: {
        modelValue: '2023-01-01',
        type: 'date',
        label: 'Date Label'
      }
    })

    expect(wrapper.find('input[type="date"]').element.value).toBe('2023-01-01')
  })

  it('shows error message when error prop is provided', () => {
    const wrapper = mount(FormField, {
      props: {
        modelValue: '',
        label: 'Test Label',
        error: 'This field is required'
      }
    })

    expect(wrapper.find('.text-error').text()).toBe('This field is required')
  })

  it('emits update:modelValue when input value changes', async () => {
    const wrapper = mount(FormField, {
      props: {
        modelValue: '',
        label: 'Test Label'
      }
    })

    await wrapper.find('input').setValue('new value')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['new value'])
  })

  it('applies required attribute when required prop is true', () => {
    const wrapper = mount(FormField, {
      props: {
        modelValue: '',
        label: 'Test Label',
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
        placeholder: 'Enter text here'
      }
    })

    expect(wrapper.find('input').attributes('placeholder')).toBe('Enter text here')
  })
})