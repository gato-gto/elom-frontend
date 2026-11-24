import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GenericForm from '../GenericForm.vue'
import type { GenericFormConfig } from '@/types/generic'

// F-1086: GenericForm передавал подсказку полю как `help`, а FormField ждёт `helpText` — подсказки обычных
// полей (дата закупки F-1085, этап объекта, ссылка на карту…) нигде не отображались. Настоящий композабл,
// без моков: проверяем то, что видит пользователь.
describe('GenericForm: подсказка обычного поля видна (F-1086)', () => {
  const mountWith = (help?: string) =>
    mount(GenericForm, {
      props: {
        config: {
          title: 'Форма',
          sections: [],
          fields: [{ key: 'name', type: 'input', label: 'Название', order: 1, help }],
          submitText: 'Сохранить',
        } as GenericFormConfig<{ name: string }>,
        onSubmit: async () => {},
      },
    })

  it('help поля выводится под ним', () => {
    const w = mountWith('Дату проведённой закупки не меняют')
    expect(w.text()).toContain('Дату проведённой закупки не меняют')
  })

  it('без help подсказки нет', () => {
    const w = mountWith(undefined)
    expect(w.find('.label-text-alt').exists()).toBe(false)
  })
})
