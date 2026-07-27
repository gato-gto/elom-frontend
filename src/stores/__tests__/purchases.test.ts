import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePurchasesStore } from '../purchases'
import api from '@/api/client'

// Mock API client
vi.mock('@/api/client')

describe('Purchases Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const store = usePurchasesStore()
    
    expect(store.items).toEqual([])
    expect(store.current).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.pagination.count).toBe(0)
  })

  it('fetches purchases list successfully', async () => {
    const store = usePurchasesStore()
    const mockResponse = {
      data: {
        count: 2,
        results: [
          {
            id: 1,
            purchase_number: 'P0001',
            date: '2024-01-01',
            object: 1,
            supplier: 1,
            responsible: 1,
            status: 'new',
            total_amount: '1000.00',
            currency: 'UZS',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 2,
            purchase_number: 'P0002',
            date: '2024-01-02',
            object: 2,
            supplier: 2,
            responsible: 2,
            status: 'completed',
            total_amount: '2000.00',
            currency: 'UZS',
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z'
          }
        ]
      }
    }
    
    vi.mocked(api.get).mockResolvedValue(mockResponse)
    
    await store.fetchList()
    
    expect(store.items).toHaveLength(2)
    expect(store.items[0].purchase_number).toBe('P0001')
    expect(store.pagination.count).toBe(2)
    // Проверяем, что был вызван правильный endpoint (может быть полный URL)
    expect(api.get).toHaveBeenCalled()
    const callArgs = vi.mocked(api.get).mock.calls[0][0]
    expect(callArgs).toContain('/purchases/')
  })

  it('creates purchase successfully', async () => {
    const store = usePurchasesStore()
    const purchaseData = {
      date: '2024-01-01',
      object: 1,
      supplier: 1,
      responsible: 1,
      status: 'new',
      items: []
    }
    
    const mockResponse = {
      data: {
        id: 3,
        purchase_number: 'P0003',
        ...purchaseData,
        total_amount: '0.00',
        currency: 'UZS',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    }
    
    vi.mocked(api.post).mockResolvedValue(mockResponse)
    
    const result = await store.create(purchaseData)
    
    expect(result).toEqual(mockResponse.data)
    // Проверяем, что был вызван правильный endpoint
    expect(api.post).toHaveBeenCalled()
    const callArgs = vi.mocked(api.post).mock.calls[0][0]
    expect(callArgs).toContain('/purchases/')
  })

  it('uploads photo successfully', async () => {
    const _store = usePurchasesStore()
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const mockPurchaseResponse = {
      data: {
        id: 1,
        purchase_number: 'P0001',
        date: '2024-01-01',
        object: 1,
        supplier: 1,
        responsible: 1,
        status: 'new',
        total_amount: '1000.00',
        currency: 'UZS',
        photos: []
      }
    }
    
    vi.mocked(api.post).mockResolvedValue({ data: { success: true } })
    vi.mocked(api.get).mockResolvedValue(mockPurchaseResponse)
    
    const { uploadPhoto } = await import('../purchases')
    const result = await uploadPhoto(1, { photo: mockFile, photo_type: 'instructions' })
    
    expect(result).toBe(true)
    // Проверяем, что был вызван правильный endpoint
    expect(api.post).toHaveBeenCalled()
    const callArgs = vi.mocked(api.post).mock.calls[0][0]
    expect(callArgs).toContain('/purchases/1/photos/upload/')
  })

  it('handles API errors correctly', async () => {
    const store = usePurchasesStore()
    const errorResponse = {
      response: {
        data: {
          detail: 'Purchase not found'
        }
      }
    }
    
    vi.mocked(api.get).mockRejectedValue(errorResponse)
    
    try {
      await store.fetchOne(999)
    } catch (error) {
      // Ожидаем, что ошибка будет выброшена
      expect(error).toBe(errorResponse)
    }
    
    // Проверяем, что текущий элемент не установлен
    expect(store.current).toBeNull()
  })

  it('sets filters correctly', async () => {
    const store = usePurchasesStore()
    vi.mocked(api.get).mockResolvedValue({ data: { count: 0, results: [] } })
    
    await store.setFilters({
      search: 'test',
      status: 'new'
    })
    
    expect(store.filters.search).toBe('test')
    expect(store.filters.status).toBe('new')
  })

  it('resets filters correctly', async () => {
    const store = usePurchasesStore()
    vi.mocked(api.get).mockResolvedValue({ data: { count: 0, results: [] } })

    await store.setFilters({ search: 'test', status: 'new' })

    await store.resetFilters()

    expect(store.filters.search).toBe('')
    expect(store.filters.status).toBe('')
  })

  // F-616: догрузка фото-отчёта + одобрение с опциональным фото-отчётом
  describe('report photo + approve (F-616)', () => {
    const file = () => new File(['x'], 'report.jpg', { type: 'image/jpeg' })
    const postUrls = () => vi.mocked(api.post).mock.calls.map(c => c[0] as string)

    it('uploadReportPhoto posts multipart to /purchase-photos/ with type=report', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { id: 10 } })
      const { uploadReportPhoto } = await import('../purchases')
      const f = file()
      await uploadReportPhoto(7, f)

      expect(api.post).toHaveBeenCalledTimes(1)
      const [url, body] = vi.mocked(api.post).mock.calls[0]
      expect(url).toBe('/purchase-photos/')
      expect(body).toBeInstanceOf(FormData)
      expect((body as FormData).get('type')).toBe('report')
      expect((body as FormData).get('purchase')).toBe('7')
      expect((body as FormData).get('file')).toBe(f)
    })

    // F-636: approve-first — иначе сбой approve (закрытый период 400) оставлял бы залитые фото
    // сиротами на 'new'-закупке, а M3-дедуп + ре-селект давали дубли.
    it('F-636: approves FIRST, then uploads photos', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { id: 5, status: 'completed' } })
      vi.mocked(api.get).mockResolvedValue({ data: { id: 5, status: 'completed' } })
      const { approvePurchaseWithReport } = await import('../purchases')

      const res = await approvePurchaseWithReport(5, [file(), file()])

      const urls = postUrls()
      expect(urls[0]).toContain('approve')                                  // approve СТРОГО первым
      expect(urls.slice(1, 3)).toEqual(['/purchase-photos/', '/purchase-photos/'])
      expect(res).toMatchObject({ uploaded: 2, failed: 0 })
    })

    it('F-636: a photo-upload failure does NOT roll back the approve (returns failed count)', async () => {
      vi.mocked(api.post)
        .mockResolvedValueOnce({ data: { id: 5, status: 'completed' } })    // approve OK (первым)
        .mockRejectedValueOnce(new Error('413 too large'))                  // фото падает
      vi.mocked(api.get).mockResolvedValue({ data: { id: 5, status: 'completed' } })
      const { approvePurchaseWithReport } = await import('../purchases')

      const res = await approvePurchaseWithReport(5, [file()])

      expect(res).toMatchObject({ uploaded: 0, failed: 1 })                 // одобрение НЕ откатано
      expect(postUrls()[0]).toContain('approve')
    })

    it('F-636: an approve failure uploads NO photos (no orphans)', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Период закрыт (архив)'))  // approve падает первым
      const { approvePurchaseWithReport } = await import('../purchases')

      await expect(approvePurchaseWithReport(5, [file(), file()])).rejects.toThrow('Период закрыт')

      expect(postUrls().some(u => u === '/purchase-photos/')).toBe(false)  // ни одного фото не залито
    })

    it('approvePurchaseWithReport with no files just approves', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { id: 5 } })
      vi.mocked(api.get).mockResolvedValue({ data: { id: 5 } })
      const { approvePurchaseWithReport } = await import('../purchases')

      const res = await approvePurchaseWithReport(5, [])

      const urls = postUrls()
      expect(urls).toHaveLength(1)
      expect(urls[0]).toContain('approve')
      expect(res).toMatchObject({ uploaded: 0, failed: 0 })
    })
  })
})

