/**
 * F-511 — «Позже» для баннера обновления PWA должно переживать перезагрузку.
 *
 * Главный тест — «баг воспроизведён»: если пользователь отложил обновление, то при следующем
 * заходе (needRefresh снова true, потому что ждущий SW никуда не делся) баннер НЕ должен
 * появляться. Раньше он лез снова и снова — это и есть жалоба владельца «донимает постоянно».
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { usePwaUpdatePrompt } from '../usePwaUpdatePrompt'

const KEY = 'elom_pwa_update_postponed'

beforeEach(() => {
  vi.mocked(sessionStorage.getItem).mockReset().mockReturnValue(null)
  vi.mocked(sessionStorage.setItem).mockReset()
  vi.mocked(sessionStorage.removeItem).mockReset()
})

describe('F-511 · usePwaUpdatePrompt', () => {
  it('нет новой версии — баннера нет', () => {
    const { showUpdate } = usePwaUpdatePrompt(ref(false), () => {})
    expect(showUpdate.value).toBe(false)
  })

  it('есть новая версия и не отложено — баннер виден', () => {
    const { showUpdate } = usePwaUpdatePrompt(ref(true), () => {})
    expect(showUpdate.value).toBe(true)
  })

  it('«Позже» прячет баннер И пишет флаг в sessionStorage', () => {
    const { showUpdate, dismiss } = usePwaUpdatePrompt(ref(true), () => {})
    dismiss()
    expect(showUpdate.value).toBe(false)
    expect(sessionStorage.setItem).toHaveBeenCalledWith(KEY, '1')
  })

  it('БАГ ВОСПРОИЗВЕДЁН: после reload (флаг уже стоит) баннер не появляется, хотя needRefresh=true', () => {
    vi.mocked(sessionStorage.getItem).mockReturnValue('1') // как будто отложили в прошлой загрузке
    const { showUpdate } = usePwaUpdatePrompt(ref(true), () => {})
    expect(showUpdate.value).toBe(false)
  })

  it('«Обновить» снимает флаг откладывания и вызывает применение', () => {
    const onApply = vi.fn()
    const { applyUpdate } = usePwaUpdatePrompt(ref(true), onApply)
    applyUpdate()
    expect(sessionStorage.removeItem).toHaveBeenCalledWith(KEY)
    expect(onApply).toHaveBeenCalledTimes(1)
  })

  it('Safari private mode: setItem кидает — dismiss всё равно прячет баннер (in-memory), без падения', () => {
    vi.mocked(sessionStorage.setItem).mockImplementation(() => {
      throw new Error('QuotaExceededError') // Safari private mode кидает при записи в Storage
    })
    const { showUpdate, dismiss } = usePwaUpdatePrompt(ref(true), () => {})
    expect(() => dismiss()).not.toThrow()
    expect(showUpdate.value).toBe(false)
  })
})
