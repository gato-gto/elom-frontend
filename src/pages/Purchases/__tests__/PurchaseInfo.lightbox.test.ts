import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h, ref, nextTick } from 'vue'

// Ревью B21 (R5): лайтбокс фото — не Modal.vue и не в стеке модалок → Escape закрывал и окно «Просмотр
// закупки». Попутно: стрелки обрабатывали ДВА слушателя (onPhotoKeydown и handleKeydown) — «следующее»
// перескакивало через фото.
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ query: {}, params: {} }) }))
import Modal from '@/components/Modal.vue'
import PurchaseInfo from '../PurchaseInfo.vue'

const photo = (id: number) => ({ id, type: 'instructions', url: `/p${id}.jpg`, is_cover: false })
const purchase = {
  id: 1, purchase_no: 'P1', status: 'completed', date: '2026-11-21', object_name: 'O', supplier_name: 'S',
  total_amount: '1.00', items: [], photos: [photo(1), photo(2), photo(3)],
}
const tick = () => new Promise(r => setTimeout(r, 0))
const press = async (key: string) => { document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); await tick() }

afterEach(() => { document.body.innerHTML = '' })

function mountView() {
  setActivePinia(createPinia())
  const open = ref(true)
  const w = mount(defineComponent({
    setup: () => () => h(Modal, { modelValue: open.value, 'onUpdate:modelValue': (v: boolean) => { open.value = v },
      title: 'Просмотр закупки' }, () => [h(PurchaseInfo, { purchase: purchase as never })]),
  }), { attachTo: document.body })
  return { w, open }
}

describe('PurchaseInfo — лайтбокс фото', () => {
  it('test_escape_in_lightbox_closes_only_photo_not_purchase_view', async () => {
    const { w, open } = mountView()
    await tick()
    await w.findAll('.photo-item')[0].trigger('click')
    await nextTick()
    await press('Escape')
    const info = w.findComponent(PurchaseInfo).vm as unknown as { photoModalOpen: boolean }
    expect(info.photoModalOpen).toBe(false)
    expect(open.value, 'окно просмотра закупки должно остаться').toBe(true)
    await press('Escape')
    expect(open.value).toBe(false)   // второй Escape — уже окну просмотра
    w.unmount()
  })

  it('test_arrow_right_moves_exactly_one_photo', async () => {
    const { w } = mountView()
    await tick()
    await w.findAll('.photo-item')[0].trigger('click')
    await nextTick()
    await press('ArrowRight')
    const info = w.findComponent(PurchaseInfo).vm as unknown as { currentPhotoIndex: number }
    expect(info.currentPhotoIndex).toBe(1)
    w.unmount()
  })
})
