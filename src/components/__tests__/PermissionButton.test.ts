import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

// F-070 (безопасность): раньше неполная пара resource/action давала fail-open.
let canImpl: (r: string, a: string) => boolean = () => false
let hasPermImpl: (c: string) => boolean = () => false

vi.mock('@/composables/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: (c: string) => hasPermImpl(c),
    hasAnyPermission: () => false,
    hasAllPermissions: () => false,
    can: (r: string, a: string) => canImpl(r, a),
  }),
}))

import PermissionButton from '@/components/PermissionButton.vue'

const mountBtn = (props: Record<string, unknown>) =>
  mount(PermissionButton, { props: { label: 'X', ...props }, global: { stubs: { LoadingSpinner: true } } })

describe('PermissionButton access (F-070)', () => {
  beforeEach(() => { canImpl = () => false; hasPermImpl = () => false })

  it('public button (no permission props) is shown', () => {
    expect(mountBtn({}).find('button').exists()).toBe(true)
  })

  it('partial props (resource without action) → hidden (fail-closed)', () => {
    expect(mountBtn({ resource: 'objects' }).find('button').exists()).toBe(false)
  })

  it('partial props (action without resource) → hidden (fail-closed)', () => {
    expect(mountBtn({ action: 'edit' }).find('button').exists()).toBe(false)
  })

  it('full resource+action, user HAS the permission → shown', () => {
    canImpl = () => true
    expect(mountBtn({ resource: 'objects', action: 'edit' }).find('button').exists()).toBe(true)
  })

  it('full resource+action, user LACKS the permission → hidden', () => {
    canImpl = () => false
    expect(mountBtn({ resource: 'objects', action: 'edit' }).find('button').exists()).toBe(false)
  })

  it('permission prop honored', () => {
    hasPermImpl = (c) => c === 'materials.view'
    expect(mountBtn({ permission: 'materials.view' }).find('button').exists()).toBe(true)
    expect(mountBtn({ permission: 'materials.delete' }).find('button').exists()).toBe(false)
  })
})
