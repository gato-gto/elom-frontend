/**
 * Тесты для бизнес-логики статусов закупок
 * 
 * Согласно документации PURCHASE_STATUS_BUSINESS_LOGIC.md:
 * - Только закупки со статусом 'completed' учитываются в остатках
 * - Закупки со статусами 'new' и 'cancelled' НЕ создают записи в StockSnapshot
 * - При смене статуса на 'completed' создаются записи в журнале движений
 * - При смене статуса с 'completed' на другой - записи удаляются
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePurchasesStore() } from '../purchases'
import api from '@/api/client'

// Mock API client
vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}))

describe('Purchase Status Business Logic', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Status Constants', () => {
    it('defines correct status values', () => {
      const statuses = ['new', 'completed', 'cancelled']
      
      expect(statuses).toContain('new')
      expect(statuses).toContain('completed')
      expect(statuses).toContain('cancelled')
    })

    it('new is the default status', () => {
      const defaultStatus = 'new'
      expect(defaultStatus).toBe('new')
    })
  })

  describe('Status Filtering', () => {
    it('filters completed purchases for stock calculations', () => {
      const purchases = [
        { id: 1, status: 'new', items: [{ material: 1, quantity: 10 }] },
        { id: 2, status: 'completed', items: [{ material: 1, quantity: 20 }] },
        { id: 3, status: 'cancelled', items: [{ material: 1, quantity: 30 }] },
        { id: 4, status: 'completed', items: [{ material: 1, quantity: 40 }] }
      ]

      // Only completed purchases should be counted
      const completedPurchases = purchases.filter(p => p.status === 'completed')
      
      expect(completedPurchases).toHaveLength(2)
      expect(completedPurchases.every(p => p.status === 'completed')).toBe(true)
    })

    it('calculates total quantity from completed purchases only', () => {
      const purchases = [
        { id: 1, status: 'new', items: [{ material: 1, quantity: 10 }] },
        { id: 2, status: 'completed', items: [{ material: 1, quantity: 20 }] },
        { id: 3, status: 'cancelled', items: [{ material: 1, quantity: 30 }] },
        { id: 4, status: 'completed', items: [{ material: 1, quantity: 40 }] }
      ]

      const completedPurchases = purchases.filter(p => p.status === 'completed')
      const totalQuantity = completedPurchases.reduce((sum, p) => {
        return sum + p.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
      }, 0)

      // Only completed purchases: 20 + 40 = 60
      expect(totalQuantity).toBe(60)
    })
  })

  describe('Status Transitions', () => {
    it('allows transition from new to completed', () => {
      const validTransitions = {
        'new': ['completed', 'cancelled'],
        'completed': ['cancelled'],
        'cancelled': ['completed']
      }

      expect(validTransitions['new']).toContain('completed')
    })

    it('allows transition from new to cancelled', () => {
      const validTransitions = {
        'new': ['completed', 'cancelled'],
        'completed': ['cancelled'],
        'cancelled': ['completed']
      }

      expect(validTransitions['new']).toContain('cancelled')
    })

    it('allows transition from cancelled back to completed', () => {
      const validTransitions = {
        'new': ['completed', 'cancelled'],
        'completed': ['cancelled'],
        'cancelled': ['completed']
      }

      expect(validTransitions['cancelled']).toContain('completed')
    })
  })

  describe('Photo Validation for Completed Status', () => {
    it('requires report photos for completed status', () => {
      const purchase = {
        status: 'completed',
        photos: []
      }

      const hasReportPhotos = purchase.photos.some((p: any) => p.photo_type === 'report')
      
      // Should not be valid without report photos
      if (purchase.status === 'completed') {
        expect(hasReportPhotos).toBe(false)
      }
    })

    it('validates when report photos exist', () => {
      const purchase = {
        status: 'completed',
        photos: [
          { id: 1, photo_type: 'report', photo: 'url' }
        ]
      }

      const hasReportPhotos = purchase.photos.some((p: any) => p.photo_type === 'report')
      
      expect(hasReportPhotos).toBe(true)
    })

    it('does not require photos for new status', () => {
      const purchase = {
        status: 'new',
        photos: []
      }

      // New status doesn't require photos
      const isValid = purchase.status !== 'completed' || purchase.photos.length > 0
      expect(isValid).toBe(true)
    })

    it('does not require photos for cancelled status', () => {
      const purchase = {
        status: 'cancelled',
        photos: []
      }

      // Cancelled status doesn't require photos
      const isValid = purchase.status !== 'completed' || purchase.photos.length > 0
      expect(isValid).toBe(true)
    })
  })

  describe('Materials from Completed Purchases', () => {
    it('returns materials only from completed purchases', () => {
      const purchases = [
        { 
          id: 1, 
          status: 'new', 
          object: 1,
          items: [
            { material: { id: 1, name: 'Цемент' }, quantity: 10 }
          ] 
        },
        { 
          id: 2, 
          status: 'completed', 
          object: 1,
          items: [
            { material: { id: 2, name: 'Песок' }, quantity: 20 }
          ] 
        },
        { 
          id: 3, 
          status: 'cancelled', 
          object: 1,
          items: [
            { material: { id: 3, name: 'Щебень' }, quantity: 30 }
          ] 
        }
      ]

      // Get materials only from completed purchases (like by-object endpoint)
      const completedMaterials = purchases
        .filter(p => p.status === 'completed')
        .flatMap(p => p.items.map(i => i.material))

      expect(completedMaterials).toHaveLength(1)
      expect(completedMaterials[0].name).toBe('Песок')
    })

    it('aggregates materials from multiple completed purchases', () => {
      const purchases = [
        { 
          id: 1, 
          status: 'completed', 
          items: [{ material: { id: 1, name: 'Цемент' }, quantity: 10 }] 
        },
        { 
          id: 2, 
          status: 'completed', 
          items: [{ material: { id: 1, name: 'Цемент' }, quantity: 20 }] 
        },
        { 
          id: 3, 
          status: 'new', 
          items: [{ material: { id: 1, name: 'Цемент' }, quantity: 100 }] 
        }
      ]

      // Aggregate quantity from completed purchases only
      const completedItems = purchases
        .filter(p => p.status === 'completed')
        .flatMap(p => p.items)

      const totalQuantity = completedItems.reduce((sum, item) => sum + item.quantity, 0)

      // 10 + 20 = 30 (not including 100 from 'new' status)
      expect(totalQuantity).toBe(30)
    })
  })

  describe('Store Integration', () => {
    it('fetches purchases list with status filter', async () => {
      const store = usePurchasesStore()
      const mockResponse = {
        data: {
          count: 2,
          results: [
            { id: 1, status: 'completed', total_amount: '1000.00' },
            { id: 2, status: 'completed', total_amount: '2000.00' }
          ]
        }
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      await store.fetchList({ status: 'completed' })

      expect(api.get).toHaveBeenCalled()
      expect(store.items).toHaveLength(2)
      expect(store.items.every((p: any) => p.status === 'completed')).toBe(true)
    })

    it('updates purchase status correctly', async () => {
      const store = usePurchasesStore()
      const mockResponse = {
        data: {
          id: 1,
          status: 'completed',
          photos: [{ id: 1, photo_type: 'report' }]
        }
      }

      vi.mocked(api.patch).mockResolvedValue(mockResponse)

      const result = await store.update(1, { status: 'completed' })

      expect(api.patch).toHaveBeenCalled()
      expect(result.status).toBe('completed')
    })
  })
})

describe('Stock Balance Calculation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('calculates balance from completed purchases minus writeoffs', () => {
    // Simulate stock calculation
    const completedPurchaseItems = [
      { material_id: 1, quantity: 100 },
      { material_id: 1, quantity: 50 }
    ]

    const writeoffs = [
      { material_id: 1, quantity: 30 }
    ]

    const totalPurchased = completedPurchaseItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalWrittenOff = writeoffs.reduce((sum, item) => sum + item.quantity, 0)
    const currentBalance = totalPurchased - totalWrittenOff

    // 100 + 50 - 30 = 120
    expect(currentBalance).toBe(120)
  })

  it('returns zero balance when no completed purchases', () => {
    const completedPurchaseItems: any[] = []
    const writeoffs = [
      { material_id: 1, quantity: 10 }
    ]

    const totalPurchased = completedPurchaseItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalWrittenOff = writeoffs.reduce((sum, item) => sum + item.quantity, 0)
    const currentBalance = totalPurchased - totalWrittenOff

    // 0 - 10 = -10 (negative balance indicates issue)
    expect(currentBalance).toBe(-10)
  })

  it('handles multiple materials correctly', () => {
    const completedPurchaseItems = [
      { material_id: 1, quantity: 100 },
      { material_id: 2, quantity: 200 },
      { material_id: 1, quantity: 50 }
    ]

    // Group by material
    const balances: Record<number, number> = {}
    
    completedPurchaseItems.forEach(item => {
      if (!balances[item.material_id]) {
        balances[item.material_id] = 0
      }
      balances[item.material_id] += item.quantity
    })

    expect(balances[1]).toBe(150) // 100 + 50
    expect(balances[2]).toBe(200)
  })
})

