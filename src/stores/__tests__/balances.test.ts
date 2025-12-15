import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBalancesStore(), fetchBalancesList, setBalancesFilters, resetBalancesFilters, getBalancesFilters } from '../balances'
import api from '@/api/client'

// Mock API client
vi.mock('@/api/client')

describe('Balances Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const store = useBalancesStore()
    
    expect(store.items).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.pagination.count).toBe(0)
  })

  it('fetches balances list successfully', async () => {
    const mockResponse = {
      data: {
        objects: [
          {
            object_id: 1,
            object_name: 'Object 1',
            object_address: 'Address 1',
            materials: [
              {
                material_id: 1,
                material_name: 'Material 1',
                unit_code: 'шт',
                current_balance: '100.00',
                total_purchased: '150.00',
                total_written_off: '50.00'
              }
            ]
          }
        ]
      }
    }
    
    vi.mocked(api.get).mockResolvedValue(mockResponse)
    
    await fetchBalancesList()
    
    expect(useBalancesStore().items).toHaveLength(1)
    expect(useBalancesStore().items[0].object_name).toBe('Object 1')
    expect(useBalancesStore().items[0].materials).toHaveLength(1)
    expect(useBalancesStore().items[0].materials[0].material_name).toBe('Material 1')
    expect(api.get).toHaveBeenCalled()
  })

  it('applies object filter correctly', async () => {
    const mockResponse = {
      data: {
        objects: [
          {
            object_id: 1,
            object_name: 'Object 1',
            object_address: 'Address 1',
            materials: []
          }
        ]
      }
    }
    
    vi.mocked(api.get).mockResolvedValue(mockResponse)
    
    await setBalancesFilters({ object: '1' })
    
    expect(api.get).toHaveBeenCalled()
    const callArgs = vi.mocked(api.get).mock.calls[0][0]
    expect(callArgs).toContain('object_id=1')
  })

  it('applies date filter correctly', async () => {
    const mockResponse = {
      data: {
        objects: []
      }
    }
    
    const testDate = '2024-01-15'
    vi.mocked(api.get).mockResolvedValue(mockResponse)
    
    await setBalancesFilters({ date: testDate })
    
    expect(api.get).toHaveBeenCalled()
    const callArgs = vi.mocked(api.get).mock.calls[0][0]
    expect(callArgs).toContain(`date=${testDate}`)
  })

  it('resets filters correctly', async () => {
    const mockResponse = {
      data: {
        objects: []
      }
    }
    
    vi.mocked(api.get).mockResolvedValue(mockResponse)
    
    await setBalancesFilters({ object: '1', date: '2024-01-01' })
    await resetBalancesFilters()
    
    const filters = getBalancesFilters()
    expect(filters.value.object).toBe('')
    expect(filters.value.search).toBe('')
    // date should be reset to today's date
    expect(filters.value.date).toBeTruthy()
  })

  it('handles API errors correctly', async () => {
    const errorResponse = {
      response: {
        data: {
          detail: 'Error loading balances'
        }
      }
    }
    
    vi.mocked(api.get).mockRejectedValue(errorResponse)
    
    try {
      await fetchBalancesList()
    } catch (error) {
      expect(error).toBe(errorResponse)
    }
    
    expect(useBalancesStore().error).toBe('Ошибка загрузки остатков')
    expect(useBalancesStore().loading).toBe(false)
  })

  it('synchronizes filters with store', async () => {
    const mockResponse = {
      data: {
        objects: []
      }
    }
    
    vi.mocked(api.get).mockResolvedValue(mockResponse)
    
    await setBalancesFilters({ object: '1' })
    
    expect(useBalancesStore().filters.object).toBe('1')
  })

  describe('URL Query Parameter Support', () => {
    it('applies object filter from URL query parameter', async () => {
      const mockResponse = {
        data: {
          objects: [
            {
              object_id: 336,
              object_name: 'Test Object',
              materials: []
            }
          ]
        }
      }
      
      vi.mocked(api.get).mockResolvedValue(mockResponse)
      
      // Simulate URL query: ?object=336
      await setBalancesFilters({ object: '336' })
      
      expect(api.get).toHaveBeenCalled()
      const callArgs = vi.mocked(api.get).mock.calls[0][0]
      expect(callArgs).toContain('object_id=336')
    })

    it('handles numeric object filter', async () => {
      const mockResponse = {
        data: {
          objects: []
        }
      }
      
      vi.mocked(api.get).mockResolvedValue(mockResponse)
      
      // Filter can be passed as string (from URL) or number
      await setBalancesFilters({ object: '123' })
      
      expect(useBalancesStore().filters.object).toBe('123')
    })
  })

  describe('Balance Calculations', () => {
    it('correctly displays balance with purchases and writeoffs', async () => {
      const mockResponse = {
        data: {
          objects: [
            {
              object_id: 1,
              object_name: 'Test Object',
              materials: [
                {
                  material_id: 1,
                  material_name: 'Цемент',
                  unit_code: 'кг',
                  current_balance: '120.000000',
                  total_purchased: '150.000000',
                  total_written_off: '30.000000'
                }
              ]
            }
          ]
        }
      }
      
      vi.mocked(api.get).mockResolvedValue(mockResponse)
      
      await fetchBalancesList()
      
      const material = useBalancesStore().items[0].materials[0]
      
      // current_balance = total_purchased - total_written_off
      // 120 = 150 - 30
      expect(parseFloat(material.current_balance)).toBe(120)
      expect(parseFloat(material.total_purchased)).toBe(150)
      expect(parseFloat(material.total_written_off)).toBe(30)
    })

    it('handles zero balance correctly', async () => {
      const mockResponse = {
        data: {
          objects: [
            {
              object_id: 1,
              object_name: 'Empty Object',
              materials: [
                {
                  material_id: 1,
                  material_name: 'Песок',
                  unit_code: 'м³',
                  current_balance: '0.000000',
                  total_purchased: '50.000000',
                  total_written_off: '50.000000'
                }
              ]
            }
          ]
        }
      }
      
      vi.mocked(api.get).mockResolvedValue(mockResponse)
      
      await fetchBalancesList()
      
      const material = useBalancesStore().items[0].materials[0]
      expect(parseFloat(material.current_balance)).toBe(0)
    })
  })

  describe('Multiple Objects Support', () => {
    it('handles multiple objects with materials', async () => {
      const mockResponse = {
        data: {
          objects: [
            {
              object_id: 1,
              object_name: 'Object 1',
              materials: [
                { material_id: 1, material_name: 'Material A', current_balance: '100.00' }
              ]
            },
            {
              object_id: 2,
              object_name: 'Object 2',
              materials: [
                { material_id: 2, material_name: 'Material B', current_balance: '200.00' },
                { material_id: 3, material_name: 'Material C', current_balance: '300.00' }
              ]
            }
          ]
        }
      }
      
      vi.mocked(api.get).mockResolvedValue(mockResponse)
      
      await fetchBalancesList()
      
      expect(useBalancesStore().items).toHaveLength(2)
      expect(useBalancesStore().items[0].materials).toHaveLength(1)
      expect(useBalancesStore().items[1].materials).toHaveLength(2)
    })
  })
})


