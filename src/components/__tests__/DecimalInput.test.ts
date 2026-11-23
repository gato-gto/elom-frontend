import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref, nextTick } from 'vue'
import DecimalInput from '../DecimalInput.vue'

// F-1046 (B6): «1,5» в браузере с английским языком интерфейса превращалось в 15 у type="number".
describe('DecimalInput (F-1046)', () => {
  const Host = defineComponent({
    components: { DecimalInput },
    setup() { const v = ref<string | number>(''); return { v } },
    template: '<DecimalInput v-model="v" class="input" aria-label="Количество" />',
  })

  it('«1,5» → модель 1.5, в поле остаётся набранное «1,5»', async () => {
    const w = mount(Host)
    const input = w.find('input')
    await input.setValue('1,5')
    expect((w.vm as any).v).toBe('1.5')
    expect((input.element as HTMLInputElement).value).toBe('1,5')
  })

  it('пробелы-разряды убираются: «6 000,25» → 6000.25', async () => {
    const w = mount(Host)
    await w.find('input').setValue('6 000,25')
    expect((w.vm as any).v).toBe('6000.25')
  })

  it('текстовое поле с десятичной клавиатурой и пробросом атрибутов', () => {
    const el = mount(Host).find('input').element as HTMLInputElement
    expect(el.type).toBe('text')
    expect(el.getAttribute('inputmode')).toBe('decimal')
    expect(el.getAttribute('aria-label')).toBe('Количество')
    expect(el.classList.contains('input')).toBe(true)
  })

  it('внешнее изменение модели (префилл) попадает в поле', async () => {
    const w = mount(Host)
    ;(w.vm as any).v = '12.5'
    await nextTick()
    expect((w.find('input').element as HTMLInputElement).value).toBe('12.5')
  })
})
