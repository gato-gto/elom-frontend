/**
 * F-508 (+ F-300) — страж поведения закрытия модалки.
 *
 * История: в F-300 владелец просил закрывать форму ТОЛЬКО крестиком — клик мимо формы терял
 * введённые данные. В F-508 он вернул Escape (осознанное действие, стандартное ожидание от диалога),
 * НО клик по фону так и остаётся выключенным. Тест фиксирует обе половины, чтобы при следующей
 * правке случайно не вернулось закрытие по бэкдропу.
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Modal from '../Modal.vue'

function mountModal(props: Record<string, unknown> = {}) {
  return mount(Modal, {
    props: { modelValue: true, title: 'Тест', ...props },
    attachTo: document.body,
  })
}

async function pressKey(key: string) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  await new Promise(r => setTimeout(r, 0))
}

describe('Modal — как закрывается', () => {
  it('Escape закрывает (F-508)', async () => {
    const w = mountModal()
    await new Promise(r => setTimeout(r, 0))
    await pressKey('Escape')
    expect(w.emitted('close'), 'Escape должен закрывать модалку').toBeTruthy()
    w.unmount()
  })

  it('Escape НЕ закрывает, если closable=false', async () => {
    const w = mountModal({ closable: false })
    await new Promise(r => setTimeout(r, 0))
    await pressKey('Escape')
    expect(w.emitted('close')).toBeFalsy()
    w.unmount()
  })

  it('клик по фону (backdrop) НЕ закрывает — иначе теряются введённые данные (F-300)', async () => {
    const w = mountModal()
    await new Promise(r => setTimeout(r, 0))
    const backdrop = w.find('.modal-backdrop')
    if (backdrop.exists()) { await backdrop.trigger('click') }
    // клик по самому оверлею модалки тоже не должен закрывать
    const overlay = w.find('.modal')
    if (overlay.exists()) { await overlay.trigger('click') }
    expect(w.emitted('close'), 'бэкдроп не должен закрывать форму').toBeFalsy()
    w.unmount()
  })

  it('прочие клавиши не закрывают', async () => {
    const w = mountModal()
    await new Promise(r => setTimeout(r, 0))
    await pressKey('Enter')
    await pressKey('a')
    expect(w.emitted('close')).toBeFalsy()
    w.unmount()
  })
})
