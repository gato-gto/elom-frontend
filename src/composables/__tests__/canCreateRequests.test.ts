/**
 * F-517 — «Заявитель» не мог создать ни одной заявки: canCreateRequests проверял
 * `purchases.create`, а у роли право `purchases.create_request`. Бэкенд POST-заявку по
 * create_request уже принимает (PurchasesPermission), доступ был — прятал фронт.
 *
 * Тест на РЕАЛЬНЫХ кодах прав из бэкенд-сида. До фикса первый кейс возвращал false.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePermissions } from '../usePermissions'
import { usePermissionsStore } from '@/stores/permissions'

function seed(perms: string[]) {
  usePermissionsStore().permissions = perms.map((codename) => ({ codename })) as never
}

describe('F-517 · canCreateRequests', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('заявитель (create_request, без approve) → true, получает кнопку создания заявки', () => {
    seed(['purchases.create_request'])
    expect(usePermissions().canCreateRequests.value).toBe(true)
  })

  it('менеджер (create + approve) → false — он не «ограниченный заявитель»', () => {
    seed(['purchases.create', 'purchases.approve'])
    expect(usePermissions().canCreateRequests.value).toBe(false)
  })

  it('полноценный создатель без approve (create) → true (прежнее поведение сохранено)', () => {
    seed(['purchases.create'])
    expect(usePermissions().canCreateRequests.value).toBe(true)
  })

  it('без прав → false', () => {
    seed([])
    expect(usePermissions().canCreateRequests.value).toBe(false)
  })
})
