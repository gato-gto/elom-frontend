// F-1038 · ToastCenter: warning-тост рендерится как alert-warning. До фикса client.ts (F-1031,
// усечение page_size) слал type:'warning', которого не было в Toast.type → тост падал в default
// alert-info и терял смысл предупреждения (скрывалось за any, вскрыто типизацией API-слоя).
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ToastCenter from '@/components/ToastCenter.vue'
import { useUiStore } from '@/stores/ui'

function mountWithToast(type: 'success' | 'error' | 'info' | 'warning', text: string) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useUiStore().toast({ type, text })
  return mount(ToastCenter, { global: { plugins: [pinia] } })
}

describe('ToastCenter (F-1038)', () => {
  it('type:warning → alert-warning (не default alert-info)', () => {
    const w = mountWithToast('warning', 'Список усечён')
    const el = w.find('.alert')
    expect(el.exists()).toBe(true)
    expect(el.classes()).toContain('alert-warning')
    expect(el.classes()).not.toContain('alert-info')
  })

  it('регресс: error остаётся alert-error с role=alert', () => {
    const w = mountWithToast('error', 'Ошибка')
    const el = w.find('.alert')
    expect(el.classes()).toContain('alert-error')
    expect(el.attributes('role')).toBe('alert')
  })
})
