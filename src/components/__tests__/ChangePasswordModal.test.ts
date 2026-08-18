// F-1021 · ChangePasswordModal: forced-режим не закрывается; локальная политика зеркалит BE F-727/F-777;
// ошибки BE по полям; успех → auth.changePassword + toast + закрытие.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const changePassword = vi.fn()
const toast = vi.fn()
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ me: { username: 'ivan' }, changePassword }) }))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast }) }))
vi.mock('@/components/Modal.vue', () => ({
  default: {
    name: 'Modal', props: ['modelValue', 'title', 'size', 'closable'], emits: ['update:modelValue'],
    template: '<div v-if="modelValue" data-modal :data-closable="String(closable)" :data-title="title"><slot /></div>',
  },
}))
import ChangePasswordModal from '@/components/ChangePasswordModal.vue'

const fill = async (w: any, o: string, n: string, c: string) => {
  await w.find('#cp-old').setValue(o); await w.find('#cp-new').setValue(n); await w.find('#cp-confirm').setValue(c)
}

describe('ChangePasswordModal (F-1021)', () => {
  beforeEach(() => { changePassword.mockReset(); toast.mockReset() })

  it('forced: title про временный пароль, closable=false, кнопка «Выйти» вместо «Отмена», update:modelValue(false) игнорируется', async () => {
    const w = mount(ChangePasswordModal, { props: { modelValue: true, forced: true } })
    expect(w.find('[data-modal]').attributes('data-closable')).toBe('false')
    expect(w.find('[data-modal]').attributes('data-title')).toContain('временный')
    expect(w.text()).toContain('Выйти'); expect(w.text()).not.toContain('Отмена')
    ;(w.vm as any).onClose(false); await flushPromises()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    await w.find('button.btn-ghost').trigger('click')
    expect(w.emitted('logout')).toHaveLength(1)
  })

  it('обычный: closable=true и Отмена эмитит update:modelValue(false)', async () => {
    const w = mount(ChangePasswordModal, { props: { modelValue: true } })
    expect(w.find('[data-modal]').attributes('data-closable')).toBe('true')
    await w.find('button.btn-ghost').trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('локальная политика: <6 / = текущему / = логину / несовпадение подтверждения — BE не зовётся', async () => {
    const w = mount(ChangePasswordModal, { props: { modelValue: true } })
    for (const [o, n, c, key] of [
      ['Old123', '12345', '12345', 'new_password'],
      ['Old123', 'Old123', 'Old123', 'new_password'],
      ['Old123', 'IVAN', 'IVAN', 'new_password'],
      ['Old123', 'NewStrong1', 'NewStrong2', 'confirm'],
    ] as const) {
      await fill(w, o, n, c); await w.find('form').trigger('submit.prevent'); await flushPromises()
      expect((w.vm as any).errors[key], `${n}/${c}`).toBeTruthy()
    }
    expect(changePassword).not.toHaveBeenCalled()
  })

  it('успех: зовёт auth.changePassword(old,new), toast success, эмитит changed + закрытие', async () => {
    changePassword.mockResolvedValue(undefined)
    const w = mount(ChangePasswordModal, { props: { modelValue: true } })
    await fill(w, 'TempPass123!', 'NewStrong1', 'NewStrong1')
    await w.find('form').trigger('submit.prevent'); await flushPromises()
    expect(changePassword).toHaveBeenCalledWith('TempPass123!', 'NewStrong1')
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
    expect(w.emitted('changed')).toHaveLength(1)
    expect(w.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('ошибка BE 400 {errors:{old_password:[…]}} → под полем, модалка остаётся', async () => {
    changePassword.mockRejectedValue({ response: { status: 400, data: { detail: 'Validation error', errors: { old_password: ['Текущий пароль неверен'] } } } })
    const w = mount(ChangePasswordModal, { props: { modelValue: true } })
    await fill(w, 'wrong', 'NewStrong1', 'NewStrong1')
    await w.find('form').trigger('submit.prevent'); await flushPromises()
    expect(w.text()).toContain('Текущий пароль неверен')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('429 → человеческий текст про попытки', async () => {
    changePassword.mockRejectedValue({ response: { status: 429, data: { detail: 'Request was throttled.' } } })
    const w = mount(ChangePasswordModal, { props: { modelValue: true } })
    await fill(w, 'TempPass123!', 'NewStrong1', 'NewStrong1')
    await w.find('form').trigger('submit.prevent'); await flushPromises()
    expect(w.text()).toContain('Слишком много попыток')
  })
})
