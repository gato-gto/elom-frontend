/**
 * F-997 — модалка импорта «отчёта цен» (2 шага: dry-run → commit; BE F-766).
 * Контракт: файл → превью (числа/warnings/идемпотентность/прематч объекта по хинту);
 * commit без объекта — блок с ошибкой БЕЗ запроса; 201 → imported(id)+закрытие; 200 already → без дубля.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const { dryRun, commit, toast } = vi.hoisted(() => ({
  dryRun: vi.fn(),
  commit: vi.fn(),
  toast: vi.fn(),
}))
vi.mock('@/stores/estimates', () => ({
  importEstimateDryRun: dryRun,
  importEstimateCommit: commit,
  useEstimatesStore: () => ({}),
}))
vi.mock('@/stores/objects', () => ({
  useObjectsStore: () => ({ items: [{ id: 5, name: 'Тиара' }, { id: 7, name: 'Оникс' }] }),
}))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ toast }) }))

import ImportEstimateModal from '@/components/ImportEstimateModal.vue'

const PREVIEW = {
  title_hint: 'Смета Тиара', object_hint: 'Тиара', groups: 3, lines: 17, coefficients: 1,
  would_create_items: 0, warnings: ['строка 40: пустая ед.изм.'], already_imported: false,
  content_hash: 'abc123',
}

async function pickFile(wrapper: ReturnType<typeof mount>) {
  const input = wrapper.find('input[type="file"]')
  const file = new File(['x'], 'смета.xlsx')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await flushPromises()
  return file
}

describe('ImportEstimateModal (F-997)', () => {
  beforeEach(() => { dryRun.mockReset(); commit.mockReset(); toast.mockReset() })

  it('файл → dry-run → превью: числа, warning, прематч объекта и названия по хинтам', async () => {
    dryRun.mockResolvedValue(PREVIEW)
    const w = mount(ImportEstimateModal, { props: { modelValue: true } })
    const f = await pickFile(w)
    expect(dryRun).toHaveBeenCalledWith(f)
    const text = w.text()
    expect(text).toContain('17')                          // позиций
    expect(text).toContain('строка 40: пустая ед.изм.')   // warning виден
    const select = w.find('select').element as HTMLSelectElement
    expect(select.value).toBe('5')                        // «Тиара» прематчена по object_hint
    expect((w.find('input[type="text"]').element as HTMLInputElement).value).toBe('Смета Тиара')
  })

  it('файл уже импортирован → предупреждение об идемпотентности видно', async () => {
    dryRun.mockResolvedValue({ ...PREVIEW, already_imported: true })
    const w = mount(ImportEstimateModal, { props: { modelValue: true } })
    await pickFile(w)
    expect(w.text()).toContain('уже импортирован')
  })

  it('commit БЕЗ объекта: инлайн-ошибка, запрос НЕ уходит', async () => {
    dryRun.mockResolvedValue({ ...PREVIEW, object_hint: 'Неизвестный' })
    const w = mount(ImportEstimateModal, { props: { modelValue: true } })
    await pickFile(w)
    expect((w.find('select').element as HTMLSelectElement).value).toBe('')  // прематч не сработал
    await w.find('button.btn-primary').trigger('click')
    await flushPromises()
    expect(commit).not.toHaveBeenCalled()
    expect(w.text()).toContain('Выберите объект')
  })

  it('commit 201 → emit imported(id) + закрытие', async () => {
    dryRun.mockResolvedValue(PREVIEW)
    commit.mockResolvedValue({ id: 42, title: 'Смета Тиара', lines: 17, content_hash: 'abc123' })
    const w = mount(ImportEstimateModal, { props: { modelValue: true } })
    const f = await pickFile(w)
    await w.find('button.btn-primary').trigger('click')
    await flushPromises()
    expect(commit).toHaveBeenCalledWith(f, 5, 'Смета Тиара')
    expect(w.emitted('imported')![0]).toEqual([42])
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([false])
  })

  it('commit 200 already-imported (без id) → закрытие БЕЗ imported (дубль не создан)', async () => {
    dryRun.mockResolvedValue(PREVIEW)
    commit.mockResolvedValue({ detail: 'already imported', content_hash: 'abc123' })
    const w = mount(ImportEstimateModal, { props: { modelValue: true } })
    await pickFile(w)
    await w.find('button.btn-primary').trigger('click')
    await flushPromises()
    expect(w.emitted('imported')).toBeUndefined()
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([false])
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ type: 'info' }))
  })

  it('ошибка dry-run (DRF detail) показана инлайн', async () => {
    dryRun.mockRejectedValue({ response: { data: { file: ['Не удалось разобрать xlsx.'] } } })
    const w = mount(ImportEstimateModal, { props: { modelValue: true } })
    await pickFile(w)
    expect(w.text()).toContain('Не удалось разобрать xlsx.')
  })
})
