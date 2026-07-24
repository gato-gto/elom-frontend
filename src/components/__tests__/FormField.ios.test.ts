/**
 * F-522 — iOS-корректные атрибуты ввода (inputmode / autocapitalize / autocorrect / spellcheck).
 * A-05: числовые/tel/email дают правильную клавиатуру. A-08: коды не капитализируются/исправляются.
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FormField from '../FormField.vue'

const inputAttrs = (props: Record<string, unknown>) => {
  const w = mount(FormField, { props: { modelValue: '', ...props } })
  return w.find('input').attributes()
}

describe('F-522 · FormField iOS-атрибуты', () => {
  it('number → inputmode=decimal, автокоррекция off', () => {
    const a = inputAttrs({ type: 'number' })
    expect(a.inputmode).toBe('decimal')
    expect(a.autocorrect).toBe('off')
    expect(a.autocapitalize).toBe('off')
  })

  it('tel → type/inputmode=tel', () => {
    const a = inputAttrs({ type: 'tel' })
    expect(a.type).toBe('tel')
    expect(a.inputmode).toBe('tel')
  })

  it('email → inputmode=email, автокоррекция off', () => {
    const a = inputAttrs({ type: 'email' })
    expect(a.inputmode).toBe('email')
    expect(a.autocorrect).toBe('off')
  })

  it('code:true (артикул/№) → капитализация и коррекция off, spellcheck false', () => {
    const a = inputAttrs({ type: 'input', code: true })
    expect(a.autocapitalize).toBe('off')
    expect(a.autocorrect).toBe('off')
    expect(a.spellcheck).toBe('false')
  })

  it('обычное текстовое поле — атрибуты не навязываются (iOS ведёт себя штатно)', () => {
    const a = inputAttrs({ type: 'text' })
    expect(a.inputmode).toBeUndefined()
    expect(a.autocorrect).toBeUndefined()
  })

  it('явный inputmode перекрывает авто-вывод', () => {
    const a = inputAttrs({ type: 'number', inputmode: 'numeric' })
    expect(a.inputmode).toBe('numeric')
  })
})
