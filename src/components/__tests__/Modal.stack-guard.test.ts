/**
 * B21 (аудит 23.11) — защита введённого в модалке.
 *
 * 1) Вложенные модалки: Escape в окне «Подтверждение новых материалов» (оно открыто ВНУТРИ формы
 *    закупки) закрывал ОБЕ модалки — обе слушали keydown на document, и внешняя форма с 26 позициями
 *    пропадала. Escape и Tab должна обрабатывать только верхняя модалка.
 * 2) `guard-unsaved`: если в форме что-то вводили, закрытие крестиком/Escape/уходом со страницы
 *    сначала спрашивает подтверждение. Без ввода — закрывается сразу, как раньше.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, nextTick } from 'vue'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import Modal from '../Modal.vue'
import { DISCARD_MESSAGE } from '@/composables/useUnsavedGuard'

const tick = () => new Promise(r => setTimeout(r, 0))

async function pressKey(key: string) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  await tick()
}

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('Modal — вложенные окна', () => {
  function mountNested() {
    const outer = ref(true)
    const inner = ref(false)
    const Parent = defineComponent({
      setup() {
        return () => h(Modal, {
          modelValue: outer.value,
          'onUpdate:modelValue': (v: boolean) => { outer.value = v },
          title: 'Форма закупки',
        }, () => [
          h('input', { class: 'outer-input' }),
          h(Modal, {
            modelValue: inner.value,
            'onUpdate:modelValue': (v: boolean) => { inner.value = v },
            title: 'Подтверждение',
          }, () => [h('button', { class: 'inner-btn' }, 'Да')]),
        ])
      },
    })
    const w = mount(Parent, { attachTo: document.body })
    return { w, outer, inner }
  }

  it('test_escape_with_inner_dialog_open_closes_only_inner', async () => {
    const { w, outer, inner } = mountNested()
    await tick()
    inner.value = true
    await nextTick(); await tick()
    await pressKey('Escape')
    expect(inner.value).toBe(false)
    expect(outer.value, 'внешняя форма должна остаться открытой').toBe(true)
    w.unmount()
  })

  it('test_escape_after_inner_closed_closes_outer', async () => {
    const { w, outer, inner } = mountNested()
    await tick()
    inner.value = true
    await nextTick(); await tick()
    await pressKey('Escape')
    await nextTick(); await tick()
    await pressKey('Escape')
    expect(inner.value).toBe(false)
    expect(outer.value).toBe(false)
    w.unmount()
  })

  it('test_tab_with_inner_dialog_open_keeps_focus_in_inner', async () => {
    const { w, inner } = mountNested()
    await tick()
    inner.value = true
    await nextTick(); await tick()
    const innerBox = document.querySelectorAll('.modal-box')[1] as HTMLElement
    // jsdom не считает layout: offsetParent=null → focusables() пуст. Подменяем для этой проверки.
    vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(document.body)
    const innerBtns = Array.from(innerBox.querySelectorAll('button')) as HTMLElement[]
    innerBtns[innerBtns.length - 1].focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    await tick()
    expect(innerBox.contains(document.activeElement), 'фокус не должен уходить во внешнюю форму').toBe(true)
    w.unmount()
  })
})

describe('Modal — guard-unsaved', () => {
  function mountGuarded(props: Record<string, unknown> = {}) {
    const open = ref(true)
    const Parent = defineComponent({
      setup() {
        return () => h(Modal, {
          modelValue: open.value,
          'onUpdate:modelValue': (v: boolean) => { open.value = v },
          title: 'Закупка',
          guardUnsaved: true,
          ...props,
        }, () => [h('input', { class: 'qty' }), h('select', { class: 'sel' }, [h('option', { value: '1' }, '1')])])
      },
    })
    const w = mount(Parent, { attachTo: document.body })
    return { w, open }
  }

  it('test_escape_without_input_closes_without_confirm', async () => {
    const confirm = vi.spyOn(window, 'confirm')
    const { w, open } = mountGuarded()
    await tick()
    await pressKey('Escape')
    expect(confirm).not.toHaveBeenCalled()
    expect(open.value).toBe(false)
    w.unmount()
  })

  it('test_escape_after_input_and_cancelled_confirm_stays_open', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { w, open } = mountGuarded()
    await tick()
    await w.find('input.qty').setValue('26')
    await pressKey('Escape')
    expect(confirm).toHaveBeenCalledWith(DISCARD_MESSAGE)
    expect(open.value).toBe(true)
    w.unmount()
  })

  it('test_close_button_after_select_change_and_accepted_confirm_closes', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { w, open } = mountGuarded()
    await tick()
    await w.find('select.sel').trigger('change')
    await w.find('.modal-close-btn').trigger('click')
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(open.value).toBe(false)
    w.unmount()
  })

  it('test_reopen_after_discard_starts_clean', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { w, open } = mountGuarded()
    await tick()
    await w.find('input.qty').setValue('5')
    await pressKey('Escape')
    expect(open.value).toBe(false)
    open.value = true
    await nextTick(); await tick()
    await pressKey('Escape')
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(open.value).toBe(false)
    w.unmount()
  })

  it('test_without_guard_prop_input_then_escape_closes_without_confirm', async () => {
    const confirm = vi.spyOn(window, 'confirm')
    const { w, open } = mountGuarded({ guardUnsaved: false })
    await tick()
    await w.find('input.qty').setValue('5')
    await pressKey('Escape')
    expect(confirm).not.toHaveBeenCalled()
    expect(open.value).toBe(false)
    w.unmount()
  })

  it('test_beforeunload_is_cancelled_only_when_dirty', async () => {
    const { w } = mountGuarded()
    await tick()
    const clean = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(clean)
    expect(clean.defaultPrevented).toBe(false)
    await w.find('input.qty').setValue('5')
    const dirty = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(dirty)
    expect(dirty.defaultPrevented).toBe(true)
    w.unmount()
    const afterUnmount = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(afterUnmount)
    expect(afterUnmount.defaultPrevented, 'после размонтирования слушатель снят').toBe(false)
  })
})

describe('Modal — guard-unsaved при уходе со страницы', () => {
  async function setup() {
    const Page = defineComponent({
      setup() {
        const open = ref(true)
        return () => h('div', [h(Modal, {
          modelValue: open.value,
          'onUpdate:modelValue': (v: boolean) => { open.value = v },
          title: 'Закупка',
          guardUnsaved: true,
        }, () => [h('input', { class: 'qty' })])])
      },
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/purchases', component: Page }, { path: '/other', component: { render: () => h('p', 'other') } }],
    })
    router.push('/purchases')
    await router.isReady()
    const w = mount(defineComponent({ render: () => h(RouterView) }), { global: { plugins: [router] }, attachTo: document.body })
    await tick()
    return { w, router }
  }

  it('test_route_leave_with_input_and_cancelled_confirm_stays', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { w, router } = await setup()
    await w.find('input.qty').setValue('5')
    await router.push('/other')
    expect(confirm).toHaveBeenCalledWith(DISCARD_MESSAGE)
    expect(router.currentRoute.value.path).toBe('/purchases')
    w.unmount()
  })

  it('test_query_only_change_with_input_does_not_ask', async () => {
    const confirm = vi.spyOn(window, 'confirm')
    const { w, router } = await setup()
    await w.find('input.qty').setValue('5')
    await router.push('/purchases?page=2')
    expect(confirm).not.toHaveBeenCalled()
    expect(router.currentRoute.value.fullPath).toBe('/purchases?page=2')
    w.unmount()
  })

  it('test_route_leave_with_input_and_accepted_confirm_navigates', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { w, router } = await setup()
    await w.find('input.qty').setValue('5')
    await router.push('/other')
    expect(router.currentRoute.value.path).toBe('/other')
    w.unmount()
  })

  it('test_guard_of_left_page_does_not_ask_on_later_navigation', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { w, router } = await setup()
    await w.find('input.qty').setValue('5')
    await router.push('/other')       // спросили один раз, ушли — форма размонтирована
    await tick()
    await router.push('/purchases')   // новая чистая форма
    await tick()
    await router.push('/other')
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.path).toBe('/other')
    w.unmount()
  })

  it('test_route_leave_without_input_navigates_without_confirm', async () => {
    const confirm = vi.spyOn(window, 'confirm')
    const { w, router } = await setup()
    await router.push('/other')
    expect(confirm).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/other')
    w.unmount()
  })
})
