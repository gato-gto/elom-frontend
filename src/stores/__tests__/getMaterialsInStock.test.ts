import { describe, it, expect, vi, beforeEach } from 'vitest'

// Единый источник «материалы, доступные к списанию на объекте» — только те, что в наличии
// (current_balance > 0). Используется MaterialSearchSelect (filter-by-balance) и формой
// «Внести остатки». Тест фиксирует правило фильтра в одном месте (класс, а не случай).

const { get } = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/api/client', () => ({ default: { get } }))

import { getMaterialsInStock } from '@/stores/materials'

const material = (id: number, balance: string) => ({
  material_id: id, material_name: `M${id}`, unit_code: 'шт', current_balance: balance,
  total_purchased: '0', total_written_off: '0',
})

describe('getMaterialsInStock', () => {
  beforeEach(() => { get.mockReset() })

  it('оставляет только материалы с положительным книжным остатком', async () => {
    get.mockResolvedValue({ data: { objects: [{ materials: [
      material(1, '5.000000'),
      material(2, '0.000000'),   // нет в наличии — списывать нечего
      material(3, '2.500000'),
      material(4, '0'),          // ноль — исключаем
      { material_id: 5, material_name: 'M5', unit_code: 'шт', current_balance: null }, // null → исключаем
    ] }] } as any })
    const res = await getMaterialsInStock(7, '2026-07-23')
    expect(res.map(m => m.material_id)).toEqual([1, 3])
  })

  it('передаёт object_id и date в /by-objects/', async () => {
    get.mockResolvedValue({ data: { objects: [{ materials: [] }] } })
    await getMaterialsInStock(7, '2026-07-23')
    const url = get.mock.calls[0][0] as string
    expect(url).toContain('object_id=7')
    expect(url).toContain('date=2026-07-23')
  })

  it('без объекта или даты не делает запрос и возвращает []', async () => {
    expect(await getMaterialsInStock(0, '2026-07-23')).toEqual([])
    expect(await getMaterialsInStock(7, '')).toEqual([])
    expect(get).not.toHaveBeenCalled()
  })

  it('при ошибке API пробрасывает исключение (решение о fail-open/closed — на вызывающем)', async () => {
    get.mockRejectedValue(new Error('boom'))
    await expect(getMaterialsInStock(7, '2026-07-23')).rejects.toThrow('boom')
  })

  it('пустой ответ (нет объекта в выборке) → []', async () => {
    get.mockResolvedValue({ data: { objects: [] } })
    expect(await getMaterialsInStock(7, '2026-07-23')).toEqual([])
  })

  it('объект без ключа materials → []', async () => {
    get.mockResolvedValue({ data: { objects: [{}] } })
    expect(await getMaterialsInStock(7, '2026-07-23')).toEqual([])
  })
})
