// F-1110 (ответ владельца 17): файлы проекта в карточке объекта — PDF и изображения до 50 МБ; загружают и удаляют
// руководство и ответственный, видят участники объекта.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils'

const { get, post, del, toast } = vi.hoisted(() => ({
  get: vi.fn(), post: vi.fn().mockResolvedValue({ data: {} }), del: vi.fn().mockResolvedValue({}), toast: vi.fn(),
}))
vi.mock('@/api/client', () => ({ default: { get, post, delete: del } }))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast }) }))

import ObjectFiles from '@/components/ObjectFiles.vue'
import { endpoints } from '@/api/endpoints'

const FILES = [
  { id: 1, name: 'План этажа.pdf', size: 1258291, content_type: 'application/pdf', uploaded_by_name: 'Анна',
    created_at: '2026-11-20T10:00:00+05:00', url: 'https://api.elom.uz/protected-media/objects/plan.pdf?token=t' },
  { id: 2, name: 'фото.png', size: 2048, content_type: 'image/png', uploaded_by_name: null,
    created_at: '2026-11-21T10:00:00+05:00', url: 'https://api.elom.uz/protected-media/objects/p.png?token=t' },
]
const mountIt = async (canManage: boolean) => {
  const w = mount(ObjectFiles, { props: { objectId: 7, canManage } })
  await flushPromises()
  return w
}
const pick = async (w: Awaited<ReturnType<typeof mountIt>>, file: File) => {
  const input = w.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await flushPromises()
}

// F-1116: компонент держит таймер и слушатель видимости — каждый тест размонтирует свой экземпляр
enableAutoUnmount(afterEach)

describe('ObjectFiles (F-1110)', () => {
  beforeEach(() => {
    get.mockReset(); post.mockClear(); del.mockClear(); toast.mockClear()
    get.mockResolvedValue({ data: FILES })
    vi.restoreAllMocks()
  })

  it('список: имя ссылкой на файл, размер и кто загрузил', async () => {
    const w = await mountIt(false)
    expect(get).toHaveBeenCalledWith(endpoints.objects.files(7))
    const rows = w.findAll('[data-test="file-row"]')
    expect(rows.length).toBe(2)
    expect(rows[0].find('a').attributes('href')).toBe(FILES[0].url)
    expect(rows[0].text()).toContain('1,2 МБ')
    expect(rows[0].text()).toContain('Анна')
    expect(rows[1].text()).toContain('2 КБ')
  })

  it('без права — ни загрузки, ни удаления', async () => {
    const w = await mountIt(false)
    expect(w.find('input[type="file"]').exists()).toBe(false)
    expect(w.findAll('[data-test="file-delete"]').length).toBe(0)
  })

  it('больше 50 МБ — не отправляем, говорим почему', async () => {
    const w = await mountIt(true)
    const big = new File(['x'], 'big.pdf', { type: 'application/pdf' })
    Object.defineProperty(big, 'size', { value: 50 * 1024 * 1024 + 1 })
    await pick(w, big)
    expect(post).not.toHaveBeenCalled()
    expect(toast).toHaveBeenCalledWith({ type: 'error', text: 'Файл больше 50 МБ.' })
  })

  it('загрузка — multipart на адрес объекта, затем список перечитывается', async () => {
    const w = await mountIt(true)
    await pick(w, new File(['%PDF-1'], 'смета.pdf', { type: 'application/pdf' }))
    expect(post.mock.calls[0][0]).toBe(endpoints.objects.files(7))
    const fd = post.mock.calls[0][1] as FormData
    expect((fd.get('file') as File).name).toBe('смета.pdf')
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('удаление — с вопросом; отказ — ничего', async () => {
    const w = await mountIt(true)
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    await w.findAll('[data-test="file-delete"]')[0].trigger('click')
    await flushPromises()
    expect(del).not.toHaveBeenCalled()
    await w.findAll('[data-test="file-delete"]')[0].trigger('click')
    await flushPromises()
    expect(del).toHaveBeenCalledWith(endpoints.objects.file(7, 1))
  })

  // F-1116 (ревью F-1110): ссылки подписаны на час — список обновляется, пока карточка открыта
  it('список перечитывается через 45 минут и при возвращении на вкладку после долгого перерыва', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    try {
      const w = await mountIt(false)
      expect(get).toHaveBeenCalledTimes(1)
      vi.advanceTimersByTime(44 * 60 * 1000)
      expect(get).toHaveBeenCalledTimes(1)                      // ещё свежо
      vi.advanceTimersByTime(60 * 1000)
      await flushPromises()
      expect(get).toHaveBeenCalledTimes(2)                      // 45 минут — обновили
      vi.setSystemTime(Date.now() + 50 * 60 * 1000)              // вкладка «спала», таймер не шёл
      document.dispatchEvent(new Event('visibilitychange'))
      await flushPromises()
      expect(get).toHaveBeenCalledTimes(3)
      w.unmount()
      vi.advanceTimersByTime(120 * 60 * 1000)
      expect(get).toHaveBeenCalledTimes(3)                      // после закрытия карточки — тишина
    } finally {
      vi.useRealTimers()
    }
  })

  // F-1119 (ревью-14): фоновое обновление — тихое и не затирает свежий список
  describe('фоновое обновление (F-1119)', () => {
    const F = (id: number, name: string) => ({ ...FILES[0], id, name, url: `https://api.elom.uz/protected-media/${id}?token=t` })
    beforeEach(() => { vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] }) })
    afterEach(() => { vi.useRealTimers() })

    it('офлайн: без тостов ошибки, повтор через 5 минут, а не каждую минуту', async () => {
      const w = await mountIt(false)
      get.mockReset().mockRejectedValue(new Error('Network Error'))
      toast.mockClear()
      vi.advanceTimersByTime(45 * 60 * 1000)
      await flushPromises()
      expect(get).toHaveBeenCalledTimes(1)
      for (let i = 0; i < 4; i++) { vi.advanceTimersByTime(60 * 1000); await flushPromises() }
      expect(get).toHaveBeenCalledTimes(1)                     // через 4 минуты — ещё не повторяли
      vi.advanceTimersByTime(60 * 1000)
      await flushPromises()
      expect(get).toHaveBeenCalledTimes(2)                     // 5 минут — повтор
      expect(toast).not.toHaveBeenCalled()
      expect(w.findAll('[data-test="file-row"]').length).toBe(2)   // прежний список на месте
    })

    it('поздний фоновый ответ не затирает список после загрузки; «Загрузка…» не показывается', async () => {
      get.mockReset().mockResolvedValueOnce({ data: [F(1, 'a.pdf'), F(2, 'b.pdf')] })
      const w = mount(ObjectFiles, { props: { objectId: 7, canManage: true } })
      await flushPromises()
      let release: (v: unknown) => void = () => {}
      get.mockReturnValueOnce(new Promise(r => { release = r }))
      vi.advanceTimersByTime(45 * 60 * 1000)
      await flushPromises()
      expect(w.text()).not.toContain('Загрузка')
      get.mockResolvedValueOnce({ data: [F(3, 'new.pdf'), F(1, 'a.pdf'), F(2, 'b.pdf')] })
      await pick(w as never, new File(['%PDF-1'], 'new.pdf', { type: 'application/pdf' }))
      release({ data: [F(1, 'a.pdf'), F(2, 'b.pdf')] })
      await flushPromises()
      expect(w.findAll('[data-test="file-row"]').map(r => r.find('a').text())).toEqual(['new.pdf', 'a.pdf', 'b.pdf'])
    })
  })

  // F-1122 (ревью-15): фоновый запрос не стартует во время основной загрузки — иначе при своём сбое он отбрасывал
  // успешный ответ основного (номер очереди)
  describe('фон не перебивает основную загрузку (F-1122)', () => {
    const F = (id: number, name: string) => ({ ...FILES[0], id, name, url: `https://x/${id}?token=t` })
    const names = (w: ReturnType<typeof mount>) => w.findAll('[data-test="file-row"]').map(r => r.find('a').text())
    beforeEach(() => { vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] }) })
    afterEach(() => { vi.useRealTimers() })

    it('смена объекта во время фонового сбоя — показан список нового объекта', async () => {
      get.mockReset().mockResolvedValueOnce({ data: [F(1, 'obj7-a.pdf'), F(2, 'obj7-b.pdf')] })
      const w = mount(ObjectFiles, { props: { objectId: 7, canManage: false } })
      await flushPromises()
      vi.advanceTimersByTime(44 * 60 * 1000 + 30 * 1000)
      await flushPromises()
      let fg: (v: unknown) => void = () => {}
      get.mockReturnValueOnce(new Promise(r => { fg = r }))
      await w.setProps({ objectId: 8 })
      get.mockRejectedValueOnce(new Error('Network Error'))
      vi.advanceTimersByTime(60 * 1000)
      await flushPromises()
      fg({ data: [F(9, 'obj8-z.pdf')] })
      await flushPromises()
      expect(names(w)).toEqual(['obj8-z.pdf'])
    })

    it('загрузка файла во время фонового сбоя — новый файл в списке', async () => {
      get.mockReset().mockResolvedValueOnce({ data: [F(1, 'a.pdf')] })
      const w = mount(ObjectFiles, { props: { objectId: 7, canManage: true } })
      await flushPromises()
      vi.advanceTimersByTime(44 * 60 * 1000 + 30 * 1000)
      await flushPromises()
      let fg: (v: unknown) => void = () => {}
      get.mockReturnValueOnce(new Promise(r => { fg = r }))
      await pick(w as never, new File(['%PDF'], 'new.pdf', { type: 'application/pdf' }))
      get.mockRejectedValueOnce(new Error('Network Error'))
      vi.advanceTimersByTime(60 * 1000)
      await flushPromises()
      fg({ data: [F(3, 'new.pdf'), F(1, 'a.pdf')] })
      await flushPromises()
      expect(names(w)).toEqual(['new.pdf', 'a.pdf'])
    })
  })

  // F-1123 (ревью-16): удалённый файл не возвращается поздним фоновым ответом, снятым до удаления
  describe('удаление во время фонового обновления (F-1123)', () => {
    const F = (id: number, name: string) => ({ ...FILES[0], id, name, url: `https://x/${id}?token=t` })
    beforeEach(() => { vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] }) })
    afterEach(() => { vi.useRealTimers() })

    it('поздний фоновый ответ не возвращает удалённый файл', async () => {
      get.mockReset().mockResolvedValueOnce({ data: [F(1, 'a.pdf'), F(2, 'b.pdf')] })
      const w = mount(ObjectFiles, { props: { objectId: 7, canManage: true } })
      await flushPromises()
      let release: (v: unknown) => void = () => {}
      get.mockReturnValueOnce(new Promise(r => { release = r }))
      vi.advanceTimersByTime(45 * 60 * 1000)
      await flushPromises()
      get.mockResolvedValueOnce({ data: [F(2, 'b.pdf')] })
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      await w.findAll('[data-test="file-delete"]')[0].trigger('click')
      await flushPromises()
      release({ data: [F(1, 'a.pdf'), F(2, 'b.pdf')] })
      await flushPromises()
      expect(w.findAll('[data-test="file-row"]').map(r => r.find('a').text())).toEqual(['b.pdf'])
      expect(w.text()).not.toContain('Загрузка')
    })
  })

  // F-1124 (ревью-17): удаление «в полёте», а карточка уже показывает другой объект — список нового объекта не трогаем
  it('удаление завершилось после смены объекта — показан список нового объекта (F-1124)', async () => {
    const F = (id: number, name: string) => ({ ...FILES[0], id, name, url: `https://x/${id}?token=t` })
    get.mockReset().mockResolvedValueOnce({ data: [F(1, 'obj7-a.pdf'), F(2, 'obj7-b.pdf')] })
    const w = mount(ObjectFiles, { props: { objectId: 7, canManage: true } })
    await flushPromises()
    let releaseDel: (v: unknown) => void = () => {}
    del.mockReset().mockReturnValueOnce(new Promise(r => { releaseDel = r }))
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await w.findAll('[data-test="file-delete"]')[0].trigger('click')
    let release8: (v: unknown) => void = () => {}
    get.mockReturnValueOnce(new Promise(r => { release8 = r }))
    await w.setProps({ objectId: 8 })
    get.mockRejectedValueOnce(new Error('network'))
    releaseDel({})
    await flushPromises()
    release8({ data: [F(3, 'obj8-c.pdf')] })
    await flushPromises()
    expect(w.findAll('[data-test="file-row"]').map(r => r.find('a').text())).toEqual(['obj8-c.pdf'])
  })
})
