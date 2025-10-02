import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportToCSV, exportToExcel, exportToPDF } from '../export'

// Mock xlsx
vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn()
  },
  writeFile: vi.fn()
}))

// Mock jsPDF
vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    text: vi.fn(),
    autoTable: vi.fn(),
    save: vi.fn()
  }))
}))

// Mock autoTable
vi.mock('jspdf-autotable', () => ({
  default: vi.fn()
}))

describe('Export Utils', () => {
  const mockData = [
    { id: 1, name: 'Test 1', value: 100 },
    { id: 2, name: 'Test 2', value: 200 }
  ]

  const mockHeaders = ['ID', 'Name', 'Value']

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exportToCSV', () => {
    it('exports data to CSV with default headers', () => {
      const result = exportToCSV(mockData, 'test.csv')

      expect(result).toBe(true)
    })

    it('exports data to CSV with custom headers', () => {
      const result = exportToCSV(mockData, 'test.csv', mockHeaders)

      expect(result).toBe(true)
    })

    it('exports data to CSV with options object', () => {
      const options = {
        headers: mockHeaders,
        formatters: {
          value: (val: number) => `$${val}`
        }
      }

      const result = exportToCSV(mockData, 'test.csv', options)

      expect(result).toBe(true)
    })

    it('handles empty data correctly', () => {
      expect(() => {
        exportToCSV([], 'test.csv')
      }).toThrow('Нет данных для экспорта')
    })

    it('handles null data correctly', () => {
      expect(() => {
        exportToCSV(null as any, 'test.csv')
      }).toThrow('Нет данных для экспорта')
    })
  })

  describe('exportToExcel', () => {
    it('exports data to Excel with default headers', () => {
      const result = exportToExcel(mockData, 'test.xlsx')

      expect(result).toBe(true)
    })

    it('exports data to Excel with custom headers', () => {
      const result = exportToExcel(mockData, 'test.xlsx', mockHeaders)

      expect(result).toBe(true)
    })

    it('exports data to Excel with options object', () => {
      const options = {
        headers: mockHeaders,
        formatters: {
          value: (val: number) => `$${val}`
        }
      }

      const result = exportToExcel(mockData, 'test.xlsx', options)

      expect(result).toBe(true)
    })

    it('handles empty data correctly', () => {
      expect(() => {
        exportToExcel([], 'test.xlsx')
      }).toThrow('Нет данных для экспорта')
    })

    it('handles null data correctly', () => {
      expect(() => {
        exportToExcel(null as any, 'test.xlsx')
      }).toThrow('Нет данных для экспорта')
    })
  })

  describe('exportToPDF', () => {
    it('exports data to PDF with default headers', () => {
      const result = exportToPDF(mockData, 'test.pdf')

      expect(result).toBe(true)
    })

    it('exports data to PDF with custom headers', () => {
      const result = exportToPDF(mockData, 'test.pdf', mockHeaders)

      expect(result).toBe(true)
    })

    it('exports data to PDF with options object', () => {
      const options = {
        headers: mockHeaders,
        formatters: {
          value: (val: number) => `$${val}`
        }
      }

      const result = exportToPDF(mockData, 'test.pdf', options)

      expect(result).toBe(true)
    })

    it('handles empty data correctly', () => {
      expect(() => {
        exportToPDF([], 'test.pdf')
      }).toThrow('Нет данных для экспорта')
    })

    it('handles null data correctly', () => {
      expect(() => {
        exportToPDF(null as any, 'test.pdf')
      }).toThrow('Нет данных для экспорта')
    })
  })

  describe('formatters', () => {
    it('applies formatters correctly', () => {
      const options = {
        headers: mockHeaders,
        formatters: {
          value: (val: number) => `$${val}`
        }
      }

      const result = exportToCSV(mockData, 'test.csv', options)

      expect(result).toBe(true)
    })

    it('handles missing formatters gracefully', () => {
      const options = {
        headers: mockHeaders
      }

      const result = exportToCSV(mockData, 'test.csv', options)

      expect(result).toBe(true)
    })
  })

  describe('error handling', () => {
    it('handles export errors gracefully', () => {
      // Mock xlsx to throw an error
      const xlsx = vi.mocked(await import('xlsx'))
      xlsx.utils.json_to_sheet.mockImplementation(() => {
        throw new Error('Export error')
      })

      expect(() => {
        exportToExcel(mockData, 'test.xlsx')
      }).toThrow('Export error')
    })
  })
})