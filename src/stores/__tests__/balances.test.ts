import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBalancesStore, fetchBalancesList, setBalancesFilters, resetBalancesFilters, getBalancesFilters } from '../balances'
import api from '@/api/client'

// Mock API client
vi.mock('@/api/client')

describe('Balances Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const store = useBalancesStore
    
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
    
    expect(useBalancesStore.items).toHaveLength(1)
    expect(useBalancesStore.items[0].object_name).toBe('Object 1')
    expect(useBalancesStore.items[0].materials).toHaveLength(1)
    expect(useBalancesStore.items[0].materials[0].material_name).toBe('Material 1')
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
    
    expect(useBalancesStore.error).toBe('Ошибка загрузки остатков')
    expect(useBalancesStore.loading).toBe(false)
  })

  it('synchronizes filters with store', async () => {
    const mockResponse = {
      data: {
        objects: []
      }
    }
    
    vi.mocked(api.get).mockResolvedValue(mockResponse)
    
    await setBalancesFilters({ object: '1' })
    
    expect(useBalancesStore.filters.object).toBe('1')
  })
})


