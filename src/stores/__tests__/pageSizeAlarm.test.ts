/**
 * F-510 — сигнализация «справочник вот-вот перестанет помещаться в один запрос».
 *
 * Зачем тест: молчаливое усечение — самый неприятный класс дефекта, он не даёт ни ошибки,
 * ни пустого состояния (F-501: вместо названия печатался ID). Сигнализация должна срабатывать
 * ДО того, как это случится, и не шуметь на обычных ответах — иначе её отключат.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { warnIfNearPageSize, PAGE_SIZE_ALARM_RATIO } from '../base'

function captureWarn(fn: () => void): string[] {
  const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  fn()
  const calls = spy.mock.calls.map(c => String(c[0]))
  spy.mockRestore()
  return calls
}

afterEach(() => vi.restoreAllMocks())

describe('F-510 · сигнализация приближения к page_size', () => {
  it('молчит на обычном ответе (далеко от предела)', () => {
    expect(captureWarn(() => warnIfNearPageSize('/api/v1/materials/', 120, 1000, false))).toEqual([])
  })

  it('предупреждает, когда count достиг порога от page_size', () => {
    const warns = captureWarn(() =>
      warnIfNearPageSize('/api/v1/materials/', 1000 * PAGE_SIZE_ALARM_RATIO, 1000, false),
    )
    expect(warns).toHaveLength(1)
    expect(warns[0]).toContain('F-510')
    expect(warns[0]).toContain('/api/v1/materials/')
  })

  it('на единицу ниже порога — ещё молчит (порог не «примерно»)', () => {
    const justBelow = 1000 * PAGE_SIZE_ALARM_RATIO - 1
    expect(captureWarn(() => warnIfNearPageSize('/api/v1/materials/', justBelow, 1000, false))).toEqual([])
  })

  it('кричит про УСЕЧЕНИЕ, когда есть next — это уже не прогноз, а факт', () => {
    const warns = captureWarn(() => warnIfNearPageSize('/api/v1/materials/', 4300, 1000, true))
    expect(warns).toHaveLength(1)
    expect(warns[0]).toContain('УСЕЧЁН')
  })

  it('пустой ответ и нулевой page_size не поднимают ложную тревогу', () => {
    expect(captureWarn(() => warnIfNearPageSize('/api/v1/materials/', 0, 1000, false))).toEqual([])
    expect(captureWarn(() => warnIfNearPageSize('/api/v1/materials/', 50, 0, false))).toEqual([])
  })
})
