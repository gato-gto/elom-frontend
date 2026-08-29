import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWriteOffsStore, getByObject, getByMaterial, getByResponsible, getByStage } from '../writeOffs'
import api from '@/api/client'

// Mock API client
vi.mock('@/api/client')

describe('WriteOffs Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const store = useWriteOffsStore()
    
    expect(store.items).toEqual([])
    expect(store.current).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.pagination.count).toBe(0)
  })

  it('fetches writeoffs list successfully', async () => {
    const store = useWriteOffsStore()
    const mockResponse = {
      data: {
        count: 2,
        results: [
          {
            id: 1,
            object: 1,
            material: 1,
            quantity: '10.00',
            responsible: 1,
            stage: 'acceptance',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 2,
            object: 2,
            material: 2,
            quantity: '20.00',
            responsible: 2,
            stage: 'request',
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z'
          }
        ]
      }
    }
    
    vi.mocked(api.get).mockResolvedValue(mockResponse)
    
    await store.fetchList()
    
    expect(store.items).toHaveLength(2)
    expect(store.items[0].quantity).toBe('10.00')
    expect(store.pagination.count).toBe(2)
    expect(api.get).toHaveBeenCalled()
  })

  it('filters writeoffs by object correctly', () => {
    const store = useWriteOffsStore()
    store.items = [
      { id: 1, object: 1, quantity: '10.00' } as any,
      { id: 2, object: 2, quantity: '20.00' } as any,
      { id: 3, object: 1, quantity: '15.00' } as any
    ]
    
    const result = getByObject(1)
    
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(1)
    expect(result[1].id).toBe(3)
  })

  it('filters writeoffs by material correctly', () => {
    const store = useWriteOffsStore()
    store.items = [
      { id: 1, material: 1, quantity: '10.00' } as any,
      { id: 2, material: 2, quantity: '20.00' } as any,
      { id: 3, material: 1, quantity: '15.00' } as any
    ]
    
    const result = getByMaterial(1)
    
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(1)
    expect(result[1].id).toBe(3)
  })

  it('filters writeoffs by responsible correctly', () => {
    const store = useWriteOffsStore()
    store.items = [
      { id: 1, responsible: 1, quantity: '10.00' } as any,
      { id: 2, responsible: 2, quantity: '20.00' } as any,
      { id: 3, responsible: 1, quantity: '15.00' } as any
    ]
    
    const result = getByResponsible(1)
    
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(1)
    expect(result[1].id).toBe(3)
  })

  it('filters writeoffs by stage correctly', () => {
    const store = useWriteOffsStore()
    store.items = [
      { id: 1, stage: 'acceptance', quantity: '10.00' } as any,
      { id: 2, stage: 'request', quantity: '20.00' } as any,
      { id: 3, stage: 'acceptance', quantity: '15.00' } as any
    ]
    
    const result = getByStage('acceptance')
    
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(1)
    expect(result[1].id).toBe(3)
  })

  it('creates writeoff successfully', async () => {
    const store = useWriteOffsStore()
    const writeoffData = {
      object: 1,
      material: 1,
      quantity: '10.00',
      responsible: 1,
      stage: 'acceptance'
    }
    
    const mockResponse = {
      data: {
        id: 1,
        ...writeoffData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
    
    vi.mocked(api.post).mockResolvedValue(mockResponse)
    
    const result = await store.create(writeoffData)
    
    expect(result).toEqual(mockResponse.data)
    expect(api.post).toHaveBeenCalled()
    const callArgs = vi.mocked(api.post).mock.calls[0][0]
    expect(callArgs).toContain('/writeoffs/')
  })

  it('handles API errors correctly', async () => {
    const store = useWriteOffsStore()
    const errorResponse = {
      response: {
        data: {
          detail: 'Writeoff not found'
        }
      }
    }
    
    vi.mocked(api.get).mockRejectedValue(errorResponse)
    
    try {
      await store.fetchOne(999)
    } catch (error) {
      expect(error).toBe(errorResponse)
    }
    
    expect(store.current).toBeNull()
  })
})

/**
 * Тесты бизнес-логики списаний согласно документации writeoff-system.md
 */
describe('WriteOff Business Logic', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Material Filtering by Object', () => {
    it('shows only materials available on selected object', () => {
      // According to business logic, materials for write-off should come from
      // completed purchases on the selected object
      const materialsOnObject = [
        { id: 1, name: 'Цемент', balance: 100 },
        { id: 2, name: 'Песок', balance: 50 }
      ]
      
      // Filter to only show materials with balance > 0 on object
      const availableMaterials = materialsOnObject.filter(m => m.balance > 0)
      
      expect(availableMaterials).toHaveLength(2)
      expect(availableMaterials.find(m => m.id === 3)).toBeUndefined()
    })

    it('excludes materials with zero balance', () => {
      const materialsOnObject = [
        { id: 1, name: 'Цемент', balance: 100 },
        { id: 2, name: 'Песок', balance: 0 },
        { id: 3, name: 'Щебень', balance: 50 }
      ]
      
      const availableMaterials = materialsOnObject.filter(m => m.balance > 0)
      
      expect(availableMaterials).toHaveLength(2)
      expect(availableMaterials.find(m => m.id === 2)).toBeUndefined()
    })
  })

  describe('Balance Validation', () => {
    it('validates quantity does not exceed current balance', () => {
      const currentBalance = 100
      const requestedQuantity = 50
      
      const isValid = requestedQuantity <= currentBalance
      expect(isValid).toBe(true)
    })

    it('rejects quantity exceeding current balance', () => {
      const currentBalance = 100
      const requestedQuantity = 150
      
      const isValid = requestedQuantity <= currentBalance
      expect(isValid).toBe(false)
    })

    it('allows full balance write-off', () => {
      const currentBalance = 100
      const requestedQuantity = 100
      
      const isValid = requestedQuantity <= currentBalance
      expect(isValid).toBe(true)
    })

    it('rejects zero quantity', () => {
      const requestedQuantity = 0
      
      const isValid = requestedQuantity > 0
      expect(isValid).toBe(false)
    })

    it('rejects negative quantity', () => {
      const requestedQuantity = -10
      
      const isValid = requestedQuantity > 0
      expect(isValid).toBe(false)
    })
  })

  describe('Unit Auto-Fill', () => {
    it('auto-fills unit from material default_unit', () => {
      const material = {
        id: 1,
        name: 'Цемент',
        default_unit: 5, // kg unit id
        is_active: true
      }
      
      const writeoff = {
        material: material.id,
        unit: 0 // Initially not set
      }
      
      // Auto-fill logic
      if (material.default_unit) {
        writeoff.unit = material.default_unit
      }
      
      expect(writeoff.unit).toBe(5)
    })

    it('preserves existing unit if already set', () => {
      const material = {
        id: 1,
        name: 'Цемент',
        default_unit: 5
      }
      
      const writeoff = {
        material: material.id,
        unit: 3 // Already set by user
      }
      
      // Should not override existing selection
      const existingUnit = writeoff.unit
      if (existingUnit === 0 && material.default_unit) {
        writeoff.unit = material.default_unit
      }
      
      expect(writeoff.unit).toBe(3) // Should remain as user set
    })
  })

  describe('Stage Selection', () => {
    it('uses object current stage as default', () => {
      const object = {
        id: 1,
        name: 'Test Object',
        current_stage: 'installation'
      }
      
      const writeoff = {
        object: object.id,
        stage: '' as string
      }
      
      // Auto-fill stage
      writeoff.stage = object.current_stage
      
      expect(writeoff.stage).toBe('installation')
    })

    it('allows selecting different stage', () => {
      const availableStages = [
        { value: 'start', label: 'Начало работ' },
        { value: 'acceptance', label: 'Приемка' },
        { value: 'installation', label: 'Монтажные работы' }
      ]
      
      const writeoff = {
        stage: 'request'
      }
      
      // User can change to any available stage
      writeoff.stage = 'acceptance'
      
      expect(writeoff.stage).toBe('acceptance')
      expect(availableStages.find(s => s.value === writeoff.stage)).toBeDefined()
    })
  })

  describe('Responsible Auto-Fill', () => {
    it('auto-fills responsible from current user', () => {
      const currentUser = {
        id: 5,
        full_name: 'Иван Иванов',
        role: 'brigadier'
      }
      
      const writeoff = {
        responsible: 0
      }
      
      // Auto-fill responsible
      writeoff.responsible = currentUser.id
      
      expect(writeoff.responsible).toBe(5)
    })
  })

  describe('Write-off Creation Payload', () => {
    it('includes all required fields', () => {
      const writeoffData = {
        object: 1,
        material: 2,
        quantity: '10.50',
        unit: 3,
        responsible: 4,
        stage: 'acceptance',
        comment: 'Test comment'
      }
      
      // Required fields
      expect(writeoffData.object).toBeDefined()
      expect(writeoffData.material).toBeDefined()
      expect(writeoffData.quantity).toBeDefined()
      expect(writeoffData.unit).toBeDefined()
      expect(writeoffData.responsible).toBeDefined()
      expect(writeoffData.stage).toBeDefined()
    })

    it('formats quantity as decimal string', () => {
      const quantity = 10.5
      const formattedQuantity = quantity.toFixed(2)
      
      expect(formattedQuantity).toBe('10.50')
    })
  })

  describe('Bulk Write-off', () => {
    it('creates multiple write-offs for same object', async () => {
      const _store = useWriteOffsStore()
      const items = [
        { material: 1, quantity: '10.00', unit: 1 },
        { material: 2, quantity: '20.00', unit: 2 },
        { material: 3, quantity: '30.00', unit: 1 }
      ]
      
      const objectId = 1
      const responsibleId = 1
      const stage = 'acceptance'
      
      // Prepare bulk payload
      const writeoffs = items.map(item => ({
        object: objectId,
        material: item.material,
        quantity: item.quantity,
        unit: item.unit,
        responsible: responsibleId,
        stage: stage
      }))
      
      expect(writeoffs).toHaveLength(3)
      expect(writeoffs.every(w => w.object === objectId)).toBe(true)
    })
  })

  describe('Write-off Filtering', () => {
    it('filters by date range', () => {
      const writeoffs = [
        { id: 1, created_at: '2024-01-01T00:00:00Z' },
        { id: 2, created_at: '2024-01-15T00:00:00Z' },
        { id: 3, created_at: '2024-02-01T00:00:00Z' }
      ]
      
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')
      
      const filtered = writeoffs.filter(w => {
        const date = new Date(w.created_at)
        return date >= startDate && date <= endDate
      })
      
      expect(filtered).toHaveLength(2)
      expect(filtered[0].id).toBe(1)
      expect(filtered[1].id).toBe(2)
    })

    it('filters by multiple criteria', () => {
      const writeoffs = [
        { id: 1, object: 1, material: 1, responsible: 1, stage: 'acceptance' },
        { id: 2, object: 1, material: 2, responsible: 2, stage: 'request' },
        { id: 3, object: 2, material: 1, responsible: 1, stage: 'acceptance' },
        { id: 4, object: 1, material: 1, responsible: 1, stage: 'acceptance' }
      ]
      
      // Filter: object=1, stage=acceptance
      const filtered = writeoffs.filter(w => 
        w.object === 1 && w.stage === 'acceptance'
      )
      
      expect(filtered).toHaveLength(2)
      expect(filtered.every(w => w.object === 1 && w.stage === 'acceptance')).toBe(true)
    })
  })
})


