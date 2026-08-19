/**
 * F-1031 · центральный детектор усечённых «грузим всё» ответов (см. src/api/truncationGuard.ts).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { detectTruncation, _resetTruncationGuard, LOAD_ALL_THRESHOLD } from '@/api/truncationGuard'

const page = (n: number, count: number, next: string | null) => ({ count, next, previous: null, results: Array.from({ length: n }, (_, i) => ({ id: i })) })

describe('detectTruncation (F-1031)', () => {
  let notify: ReturnType<typeof vi.fn>
  let log: ReturnType<typeof vi.fn>
  beforeEach(() => { _resetTruncationGuard(); notify = vi.fn(); log = vi.fn() })

  it('page_size=1000 + next → усечение: лог + ОДИН тост с «показано N из M»', () => {
    const cfg = { url: '/materials/', params: { page_size: 1000 }, method: 'get' }
    expect(detectTruncation(cfg, page(1000, 1234, 'http://x/?page=2'), notify, log)).toBe(true)
    expect(log).toHaveBeenCalledTimes(1)
    expect(log.mock.calls[0][0]).toContain('/materials/')
    expect(log.mock.calls[0][0]).toContain('1000 из 1234')
    expect(notify).toHaveBeenCalledTimes(1)
    expect(notify.mock.calls[0][0]).toBe(
      'Список «/materials/» показан не полностью (1000 из 1234). Сообщите администратору: справочник перерос лимит загрузки.',
    )
  })

  it('повтор того же эндпоинта → лог снова, тост НЕ повторяется; другой эндпоинт → свой тост', () => {
    const cfg = { url: '/materials/?ordering=name', params: { page_size: 1000 } }
    detectTruncation(cfg, page(1000, 1500, 'n'), notify, log)
    detectTruncation(cfg, page(1000, 1500, 'n'), notify, log)
    expect(log).toHaveBeenCalledTimes(2)
    expect(notify).toHaveBeenCalledTimes(1)
    detectTruncation({ url: '/objects/', params: { page_size: 1000 } }, page(1000, 1001, 'n'), notify, log)
    expect(notify).toHaveBeenCalledTimes(2)
    expect(notify.mock.calls[1][0]).toContain('«/objects/»')
  })

  it('обычная пагинация (page_size < порога) с next — НЕ усечение', () => {
    expect(detectTruncation({ url: '/purchases/', params: { page_size: 10 } }, page(10, 300, 'n'), notify, log)).toBe(false)
    expect(detectTruncation({ url: '/purchases/', params: { page_size: LOAD_ALL_THRESHOLD - 1 } }, page(499, 900, 'n'), notify, log)).toBe(false)
    expect(notify).not.toHaveBeenCalled(); expect(log).not.toHaveBeenCalled()
  })

  it('page_size=1000 без next (всё поместилось) — тишина', () => {
    expect(detectTruncation({ url: '/units/', params: { page_size: 1000 } }, page(14, 14, null), notify, log)).toBe(false)
    expect(notify).not.toHaveBeenCalled()
  })

  it('page_size строкой и в query-строке URL тоже распознаётся; порог включительно', () => {
    expect(detectTruncation({ url: '/a/', params: { page_size: '1000' } }, page(5, 9, 'n'), notify, log)).toBe(true)
    expect(detectTruncation({ url: '/b/?page_size=1000&ordering=x' }, page(5, 9, 'n'), notify, log)).toBe(true)
    expect(detectTruncation({ url: '/c/', params: { page_size: LOAD_ALL_THRESHOLD } }, page(5, 9, 'n'), notify, log)).toBe(true)
    expect(notify).toHaveBeenCalledTimes(3)
  })

  it('не-списки, массивы без обёртки, POST и пустые данные — игнор', () => {
    expect(detectTruncation({ url: '/x/', params: { page_size: 1000 } }, [1, 2], notify, log)).toBe(false)
    expect(detectTruncation({ url: '/x/', params: { page_size: 1000 } }, null, notify, log)).toBe(false)
    expect(detectTruncation({ url: '/x/', params: { page_size: 1000 } }, { next: 'n', results: 'oops' }, notify, log)).toBe(false)
    expect(detectTruncation({ url: '/x/', params: { page_size: 1000 }, method: 'post' }, page(5, 9, 'n'), notify, log)).toBe(false)
    expect(detectTruncation({ url: '/x/' }, page(5, 9, 'n'), notify, log)).toBe(false)
    expect(notify).not.toHaveBeenCalled(); expect(log).not.toHaveBeenCalled()
  })

  it('count отсутствует/не число → «?» вместо NaN', () => {
    detectTruncation({ url: '/y/', params: { page_size: 1000 } }, { next: 'n', results: [1] }, notify, log)
    expect(notify.mock.calls[0][0]).toContain('(1 из ?)')
  })
})

describe('api client подключает детектор (F-1031)', () => {
  it('client.ts вызывает detectTruncation в success-перехватчике', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const src = readFileSync(resolve(process.cwd(), 'src/api/client.ts'), 'utf8')
    expect(src).toMatch(/interceptors\.response\.use\([\s\S]*detectTruncation\(r\.config, r\.data/)
  })
})
