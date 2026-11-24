import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import { useUnsavedGuard, hasUnsavedChanges, confirmLeaveIfUnsaved, resetLeaveBypass, DISCARD_MESSAGE } from '../useUnsavedGuard'

// Ревью B21 (R2): «Выйти» со страницы с несохранённой сметой — сначала auth.logout() (токены стёрты), потом
// router.push('/login') → «Закрыть без сохранения?» → «Отмена» оставляла человека на форме уже
// разлогиненным: сохранить нельзя. Явные действия ухода спрашивают ДО выхода и один раз.
const tick = () => new Promise(r => setTimeout(r, 0))
afterEach(() => { vi.restoreAllMocks() })

async function setup(dirty: { v: boolean }) {
  const Page = defineComponent({ setup() { useUnsavedGuard(() => dirty.v); return () => h('p', 'смета') } })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/estimates/new', component: Page }, { path: '/login', component: { render: () => h('p', 'login') } },
      { path: '/other', component: { render: () => h('p', 'other') } }],
  })
  router.push('/estimates/new')
  await router.isReady()
  const w = mount(defineComponent({ render: () => h(RouterView) }), { global: { plugins: [router] } })
  await tick()
  return { w, router }
}

describe('useUnsavedGuard — явный уход (выход из системы)', () => {
  it('test_has_unsaved_reflects_mounted_dirty_form_and_clears_on_unmount', async () => {
    const dirty = { v: true }
    const { w, router } = await setup(dirty)
    expect(hasUnsavedChanges()).toBe(true)
    dirty.v = false
    expect(hasUnsavedChanges()).toBe(false)
    dirty.v = true
    w.unmount()
    expect(hasUnsavedChanges(), 'после размонтирования формы её нет в реестре').toBe(false)
    void router
  })

  it('test_confirm_leave_without_unsaved_does_not_ask', async () => {
    const confirm = vi.spyOn(window, 'confirm')
    const { w } = await setup({ v: false })
    expect(confirmLeaveIfUnsaved()).toBe(true)
    expect(confirm).not.toHaveBeenCalled()
    w.unmount()
  })

  it('test_confirm_leave_cancelled_returns_false_so_logout_is_not_started', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { w, router } = await setup({ v: true })
    expect(confirmLeaveIfUnsaved()).toBe(false)
    expect(confirm).toHaveBeenCalledWith(DISCARD_MESSAGE)
    expect(router.currentRoute.value.path).toBe('/estimates/new')
    w.unmount()
  })

  it('test_confirm_leave_accepted_then_push_login_asks_only_once', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { w, router } = await setup({ v: true })
    expect(confirmLeaveIfUnsaved()).toBe(true)
    await router.push('/login')
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.path).toBe('/login')
    w.unmount()
  })

  it('test_bypass_is_one_shot_next_navigation_asks_again', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { w, router } = await setup({ v: true })
    expect(confirmLeaveIfUnsaved()).toBe(true)
    await router.push('/estimates/new?x=1')   // тот же путь — guard не срабатывает, обход не должен «висеть»
    await router.push('/other')
    expect(confirm).toHaveBeenCalledTimes(2)
    w.unmount()
  })
})

describe('useUnsavedGuard — обход не «зависает» (ревью N2)', () => {
  it('test_reset_leave_bypass_after_failed_logout_next_leave_asks', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { w, router } = await setup({ v: true })
    expect(confirmLeaveIfUnsaved()).toBe(true)
    resetLeaveBypass()                 // выход упал до перехода (catch в logout)
    await router.push('/other')
    expect(confirm).toHaveBeenCalledTimes(2)
    w.unmount()
  })
})

describe('«Выйти» спрашивает про несохранённое ДО auth.logout()', () => {
  // монтировать весь лейаут ради одного порядка вызовов избыточно — проверяем тело обработчиков
  const root = resolve(__dirname, '../../..')
  for (const [file, fn] of [['src/layouts/AppLayout.vue', 'const logout = async () => {'],
    ['src/components/AutoMobileNavigation.vue', 'const handleLogout = async () => {']] as const) {
    it(file, () => {
      const src = readFileSync(resolve(root, file), 'utf8')
      const body = src.slice(src.indexOf(fn), src.indexOf(fn) + 600)
      const guard = body.indexOf('if (!confirmLeaveIfUnsaved()) { return }')
      const out = body.search(/^\s+auth\.logout\(\)\s*$/m)   // сам вызов, не упоминание в комментарии
      expect(guard, 'нет проверки несохранённого').toBeGreaterThan(-1)
      expect(out).toBeGreaterThan(guard)
      expect(body.slice(body.indexOf('catch'), body.indexOf('catch') + 120), 'сбой выхода гасит обход').toContain('resetLeaveBypass()')
    })
  }
})
