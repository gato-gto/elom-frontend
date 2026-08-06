import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEmployeesStore, getResponsibleEmployees, canBeResponsible } from '../employees'

// Аудит B1: FE предлагал админа в ответственные, а BE (common/serializers.py validate_responsible, F-184)
// принимает ТОЛЬКО бригадира → выбор админа = 400. Фикс: brigadierOnly-параметр. Дефолт (false) сохраняет
// прежнее (бригадир+админ) для WriteOff, где на проде есть админ-ответственный (id 367) — его не ломаем.
const emp = (o: Record<string, unknown>) => ({
  id: 1, profile_id: 1, username: 'u', first_name: 'F', last_name: 'L', is_active: true, roles: [], ...o,
})
const role = (name: string) => ({ id: 1, name })

describe('getResponsibleEmployees / canBeResponsible — brigadier-only (аудит B1)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const store = useEmployeesStore()
    store.items = [
      emp({ id: 10, profile_id: 10, username: 'brig', roles: [role('brigadier')] }),
      emp({ id: 11, profile_id: 11, username: 'adm', roles: [role('admin')] }),
      emp({ id: 12, profile_id: 12, username: 'brig_off', is_active: false, roles: [role('brigadier')] }),
      emp({ id: 13, profile_id: 13, username: 'req', roles: [role('requester')] }),
    ] as any
  })

  it('brigadierOnly=true → ТОЛЬКО активные бригадиры (админ исключён)', () => {
    const ids = getResponsibleEmployees(true).map(e => e.id)
    expect(ids).toEqual([10])   // только brig; adm(11) исключён, brig_off(12) неактивен, req(13) не роль
  })

  it('дефолт (WriteOff) → бригадир И админ (админа не ломаем)', () => {
    const ids = getResponsibleEmployees().map(e => e.id).sort((a, b) => a - b)
    expect(ids).toEqual([10, 11])   // brig + adm
  })

  it('canBeResponsible: brigadierOnly различает админа', () => {
    const admin = { id: 11, is_active: true, roles: [role('admin')] } as any
    const brig = { id: 10, is_active: true, roles: [role('brigadier')] } as any
    expect(canBeResponsible(admin)).toBe(true)          // дефолт — админ ок (WriteOff)
    expect(canBeResponsible(admin, true)).toBe(false)   // объект/закупка — админ НЕ ответственный
    expect(canBeResponsible(brig, true)).toBe(true)     // бригадир — всегда ок
  })
})
