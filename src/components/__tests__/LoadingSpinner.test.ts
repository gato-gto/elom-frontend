import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingSpinner from '../LoadingSpinner.vue'

describe('LoadingSpinner', () => {
  it('renders spinner with default props', () => {
    const wrapper = mount(LoadingSpinner)
    
    expect(wrapper.find('.loading-spinner-container').exists()).toBe(true)
    expect(wrapper.find('.loading-spinner').exists()).toBe(true)
  })

  it('renders with custom size', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        size: 'lg'
      }
    })
    
    expect(wrapper.find('.spinner-lg').exists()).toBe(true)
  })

  it('renders with custom variant', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        variant: 'error'
      }
    })
    
    expect(wrapper.find('.spinner-error').exists()).toBe(true)
  })

  it('renders with custom text', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        text: 'Loading data...'
      }
    })
    
    expect(wrapper.text()).toContain('Loading data...')
  })

  it('renders with all custom props', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        size: 'sm',
        variant: 'success',
        text: 'Saving...'
      }
    })
    
    expect(wrapper.find('.spinner-sm').exists()).toBe(true)
    expect(wrapper.find('.spinner-success').exists()).toBe(true)
    expect(wrapper.text()).toContain('Saving...')
  })

  it('renders without text when text is empty', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        text: ''
      }
    })
    
    expect(wrapper.find('.loading-text').exists()).toBe(false)
  })
})
