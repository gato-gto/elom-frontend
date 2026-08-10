/**
 * F-998 (#73, вторая половина «обдумай» владельца): select с УЖЕ выставленным значением, чьи options
 * приходят ПОЗЖЕ (async-стор) — выбранный элемент обязан отобразиться после подгрузки опций.
 * Vue-нюанс: modelValue не меняется → патчер может не переприменить el.value после вставки <option>
 * (браузер сбрасывает value без соответствующей опции). Тест ловит весь класс на уровне FormField.
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FormField from '@/components/FormField.vue'

describe('FormField · select со значением до подгрузки options (F-998)', () => {
  it('options пришли ПОСЛЕ установки значения → выбранный элемент отображается', async () => {
    const w = mount(FormField, {
      props: { label: 'Ответственный', type: 'select', modelValue: 352, options: [] },
    })
    const sel = w.find('select').element as HTMLSelectElement
    expect(sel.value).toBe('')   // опций нет — выбрать нечего (честное состояние)
    // стор догрузился
    await w.setProps({ options: [
      { value: 88, label: 'admin' },
      { value: 352, label: 'daler' },
    ] })
    await nextTick()
    expect(sel.value).toBe('352')                              // значение ПОДХВАЧЕНО
    expect(sel.selectedOptions[0]?.textContent?.trim()).toBe('daler')
  })

  it('options уже есть при маунте → значение выбрано сразу (санити)', () => {
    const w = mount(FormField, {
      props: { label: 'X', type: 'select', modelValue: 7,
               options: [{ value: 7, label: 'семь' }, { value: 8, label: 'восемь' }] },
    })
    expect((w.find('select').element as HTMLSelectElement).value).toBe('7')
  })
})
