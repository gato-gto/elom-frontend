import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Login from '../Login.vue'
import { useAuthStore } from '@/stores/auth'

// Mock auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn()
}))

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  }),
  useRoute: () => ({
    query: {}
  })
}))

describe('Login Page', () => {
  const mockAuthStore = {
    login: vi.fn(),
    loading: false,
    error: null
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore as any)
  })

  it('renders login form correctly', () => {
    const wrapper = mount(Login)

    expect(wrapper.find('h1').text()).toBe('Вход в систему')
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('handles form submission correctly', async () => {
    const wrapper = mount(Login)

    await wrapper.find('input[type="text"]').setValue('testuser')
    await wrapper.find('input[type="password"]').setValue('testpass')
    await wrapper.find('form').trigger('submit')

    expect(mockAuthStore.login).toHaveBeenCalledWith('testuser', 'testpass')
  })

  it('shows loading state during login', () => {
    const loadingAuthStore = {
      ...mockAuthStore,
      loading: true
    }
    vi.mocked(useAuthStore).mockReturnValue(loadingAuthStore as any)

    const wrapper = mount(Login)

    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeDefined()
    expect(submitButton.text()).toContain('Вход...')
  })

  it('shows error message when login fails', () => {
    const errorAuthStore = {
      ...mockAuthStore,
      error: 'Invalid credentials'
    }
    vi.mocked(useAuthStore).mockReturnValue(errorAuthStore as any)

    const wrapper = mount(Login)

    expect(wrapper.find('.alert-error').text()).toContain('Invalid credentials')
  })

  it('redirects to purchases on successful login', async () => {
    mockAuthStore.login.mockResolvedValue(true)

    const wrapper = mount(Login)

    await wrapper.find('input[type="text"]').setValue('testuser')
    await wrapper.find('input[type="password"]').setValue('testpass')
    await wrapper.find('form').trigger('submit')

    await nextTick()

    expect(mockPush).toHaveBeenCalledWith('/purchases')
  })

  it('redirects to specified route on successful login', async () => {
    mockAuthStore.login.mockResolvedValue(true)

    // Mock route with redirect query
    vi.mocked(require('vue-router').useRoute).mockReturnValue({
      query: { redirect: '/materials' }
    })

    const wrapper = mount(Login)

    await wrapper.find('input[type="text"]').setValue('testuser')
    await wrapper.find('input[type="password"]').setValue('testpass')
    await wrapper.find('form').trigger('submit')

    await nextTick()

    expect(mockPush).toHaveBeenCalledWith('/materials')
  })

  it('validates required fields', async () => {
    const wrapper = mount(Login)

    await wrapper.find('form').trigger('submit')

    expect(mockAuthStore.login).not.toHaveBeenCalled()
  })

  it('handles keyboard navigation', async () => {
    const wrapper = mount(Login)

    await wrapper.find('input[type="text"]').setValue('testuser')
    await wrapper.find('input[type="text"]').trigger('keydown.enter')

    // Should focus on password field
    expect(wrapper.find('input[type="password"]').element).toBe(document.activeElement)
  })

  it('shows password visibility toggle', async () => {
    const wrapper = mount(Login)

    const passwordInput = wrapper.find('input[type="password"]')
    const toggleButton = wrapper.find('button[aria-label="Показать пароль"]')

    expect(passwordInput.attributes('type')).toBe('password')

    await toggleButton.trigger('click')

    expect(passwordInput.attributes('type')).toBe('text')
  })

  it('handles form reset', async () => {
    const wrapper = mount(Login)

    await wrapper.find('input[type="text"]').setValue('testuser')
    await wrapper.find('input[type="password"]').setValue('testpass')

    await wrapper.find('button[type="reset"]').trigger('click')

    expect(wrapper.find('input[type="text"]').element.value).toBe('')
    expect(wrapper.find('input[type="password"]').element.value).toBe('')
  })
})

