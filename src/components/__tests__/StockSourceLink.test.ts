import { describe, it, expect, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'

// F-827 (аудит F-14): «Источник» в «Движениях» — № закупки со ссылкой на неё (раньше «Закупка #110429» —
// id позиции, которого нигде нет). Ссылка — только тем, кто может открыть закупку.
const perms = vi.hoisted(() => ({ allowed: new Set<string>() }))
vi.mock('@/composables/usePermissions', () => ({
  usePermissions: () => ({ can: (r: string, a: string) => perms.allowed.has(`${r}.${a}`) }),
}))
import StockSourceLink from '../StockSourceLink.vue'

const purchaseRow = { source_type: 'purchase_item', source_id: 110429, source_document_id: 21552, source_description: 'Закупка P0005' }
const mountLink = (item: Record<string, unknown>) =>
  mount(StockSourceLink, { props: { item: item as never }, global: { stubs: { RouterLink: RouterLinkStub } } })

describe('StockSourceLink', () => {
  it('test_purchase_row_with_view_right_links_to_purchase_document', () => {
    perms.allowed = new Set(['purchases.view'])
    const w = mountLink(purchaseRow)
    const link = w.findComponent(RouterLinkStub)
    expect(link.exists()).toBe(true)
    expect(link.props('to')).toEqual({ name: 'PurchasePrint', params: { id: 21552 } })
    expect(w.text()).toBe('Закупка P0005')
  })

  it('test_purchase_row_with_view_own_right_also_links', () => {
    perms.allowed = new Set(['purchases.view_own'])
    expect(mountLink(purchaseRow).findComponent(RouterLinkStub).exists()).toBe(true)
  })

  it('test_purchase_row_without_rights_is_plain_text', () => {
    perms.allowed = new Set()
    const w = mountLink(purchaseRow)
    expect(w.findComponent(RouterLinkStub).exists()).toBe(false)
    expect(w.text()).toBe('Закупка P0005')
  })

  it('test_writeoff_row_is_plain_text', () => {
    perms.allowed = new Set(['purchases.view'])
    const w = mountLink({ source_type: 'writeoff', source_id: 12, source_document_id: 12, source_description: 'Списание № 12' })
    expect(w.findComponent(RouterLinkStub).exists()).toBe(false)
    expect(w.text()).toBe('Списание № 12')
  })

  it('test_deleted_purchase_without_document_id_is_plain_text', () => {
    perms.allowed = new Set(['purchases.view'])
    const w = mountLink({ ...purchaseRow, source_document_id: null, source_description: 'Закупка (удалена)' })
    expect(w.findComponent(RouterLinkStub).exists()).toBe(false)
  })

  it('test_old_api_without_description_falls_back_to_type_and_id', () => {
    perms.allowed = new Set()
    const w = mountLink({ source_type: 'writeoff', source_id: 7 })
    expect(w.text()).toBe('Списание № 7')
  })

  it('test_click_on_link_does_not_bubble_to_card', async () => {
    perms.allowed = new Set(['purchases.view'])
    const onParent = vi.fn()
    const w = mount({ components: { StockSourceLink }, template: '<div @click="onParent"><StockSourceLink :item="item" /></div>',
      setup: () => ({ item: purchaseRow, onParent }) }, { global: { stubs: { RouterLink: RouterLinkStub } } })
    await w.findComponent(RouterLinkStub).trigger('click')
    expect(onParent).not.toHaveBeenCalled()
  })
})
