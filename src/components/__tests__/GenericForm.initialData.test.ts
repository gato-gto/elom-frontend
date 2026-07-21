import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// F-071: initialData, приходящий асинхронно (edit-загрузка) или меняющийся, должен
// синхронизироваться в форму. Раньше он копировался лишь один раз → пустая форма.
vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: () => ({ handleFormError: vi.fn() }),
}))

import GenericForm from '@/components/GenericForm.vue'

const config = {
  title: 'T',
  fields: [{ key: 'name', type: 'input', label: 'Название' }],
  submitText: 'Сохранить',
  cancelText: 'Отмена',
}

describe('GenericForm — initialData sync (F-071)', () => {
  it('form reflects initialData that arrives after mount', async () => {
    const w = mount(GenericForm, { props: { config, initialData: {} } })
    await nextTick()
    // изначально пусто
    expect((w.find('input').element as HTMLInputElement).value).toBe('')

    // initialData приходит позже (как при загрузке записи для редактирования)
    await w.setProps({ initialData: { name: 'Кабель UTP' } })
    await nextTick()
    expect((w.find('input').element as HTMLInputElement).value).toBe('Кабель UTP')
  })
})
