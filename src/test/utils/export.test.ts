/**
 * Тесты для утилит экспорта
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/export'

// Mock file download
const mockCreateObjectURL = vi.fn()
const mockRevokeObjectURL = vi.fn()
const mockClick = vi.fn()

// Mock DOM APIs
Object.defineProperty(window.URL, 'createObjectURL', {
  value: mockCreateObjectURL
})
Object.defineProperty(window.URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL
})

const mockLink = {
  click: mockClick,
  setAttribute: vi.fn(),
  style: {}
}

Object.defineProperty(document, 'createElement', {
  value: vi.fn().mockReturnValue(mockLink)
})

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn()
})

Object.defineProperty(document.body, 'removeChild', {
  value: vi.fn()
})

describe('Export Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateObjectURL.mockReturnValue('mock-blob-url')
  })

  describe('exportToCSV', () => {
    const testData = [
      { id: 1, name: 'Item 1', category: 'Category A', price: 100.50 },
      { id: 2, name: 'Item 2', category: 'Category B', price: 200.75 },
      { id: 3, name: 'Item with "quotes"', category: 'Category, with comma', price: 300 }
    ]

    const testColumns = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'category', label: 'Category' },
      { key: 'price', label: 'Price' }
    ]

    it('should export data to CSV', () => {
      exportToCSV(testData, testColumns, 'test-export')

      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob))
      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'mock-blob-url')
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'test-export.csv')
      expect(mockClick).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-blob-url')
    })

    it('should generate correct CSV content', () => {
      exportToCSV(testData, testColumns, 'test')

      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob
      expect(blob.type).toBe('text/csv;charset=utf-8;')
      
      // Check CSV content structure (headers + data rows)
      blob.text().then(content => {
        const lines = content.split('\n')
        expect(lines[0]).toBe('ID,Name,Category,Price') // Headers
        expect(lines[1]).toBe('1,Item 1,Category A,100.5') // First row
        expect(lines[2]).toBe('2,Item 2,Category B,200.75') // Second row
        expect(lines[3]).toBe('3,"Item with ""quotes""","Category, with comma",300') // Escaped row
      })
    })

    it('should handle empty data', () => {
      exportToCSV([], testColumns, 'empty')

      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob
      blob.text().then(content => {
        expect(content).toBe('ID,Name,Category,Price\n')
      })
    })

    it('should handle missing columns', () => {
      const dataWithMissingFields = [
        { id: 1, name: 'Item 1' }, // missing category and price
        { id: 2, category: 'Category B', price: 200 } // missing name
      ]

      exportToCSV(dataWithMissingFields, testColumns, 'missing-fields')

      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob
      blob.text().then(content => {
        const lines = content.split('\n')
        expect(lines[1]).toBe('1,Item 1,,') // Empty values for missing fields
        expect(lines[2]).toBe('2,,Category B,200')
      })
    })

    it('should escape special characters in CSV', () => {
      const specialData = [
        { 
          id: 1, 
          name: 'Item with "quotes"', 
          category: 'Category, with comma',
          description: 'Line 1\nLine 2'
        }
      ]

      const specialColumns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'category', label: 'Category' },
        { key: 'description', label: 'Description' }
      ]

      exportToCSV(specialData, specialColumns, 'special')

      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob
      blob.text().then(content => {
        const lines = content.split('\n')
        expect(lines[1]).toContain('"Item with ""quotes"""') // Escaped quotes
        expect(lines[1]).toContain('"Category, with comma"') // Quoted comma
        expect(lines[1]).toContain('"Line 1\nLine 2"') // Quoted newline
      })
    })
  })

  describe('exportToExcel', () => {
    const testData = [
      { id: 1, name: 'Excel Item 1', amount: 1500.25 },
      { id: 2, name: 'Excel Item 2', amount: 2500.50 }
    ]

    const testColumns = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'amount', label: 'Amount' }
    ]

    it('should export data to Excel', () => {
      exportToExcel(testData, testColumns, 'excel-export')

      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob))
      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'mock-blob-url')
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'excel-export.xlsx')
      expect(mockClick).toHaveBeenCalled()
    })

    it('should generate XLSX blob', () => {
      exportToExcel(testData, testColumns, 'test')

      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob
      expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    })

    it('should handle empty Excel data', () => {
      expect(() => exportToExcel([], testColumns, 'empty-excel')).not.toThrow()
    })

    it('should handle complex Excel data types', () => {
      const complexData = [
        { 
          id: 1, 
          name: 'Complex Item',
          date: '2024-01-15T10:30:00Z',
          isActive: true,
          tags: ['tag1', 'tag2'],
          metadata: { key: 'value' }
        }
      ]

      const complexColumns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'date', label: 'Date' },
        { key: 'isActive', label: 'Active' },
        { key: 'tags', label: 'Tags' },
        { key: 'metadata', label: 'Metadata' }
      ]

      expect(() => exportToExcel(complexData, complexColumns, 'complex')).not.toThrow()
    })
  })

  describe('exportToPDF', () => {
    const testData = [
      { id: 1, name: 'PDF Item 1', description: 'Description 1' },
      { id: 2, name: 'PDF Item 2', description: 'Description 2' }
    ]

    const testColumns = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' }
    ]

    it('should export data to PDF', () => {
      exportToPDF(testData, testColumns, 'pdf-export')

      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob))
      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'mock-blob-url')
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'pdf-export.pdf')
      expect(mockClick).toHaveBeenCalled()
    })

    it('should generate PDF blob', () => {
      exportToPDF(testData, testColumns, 'test')

      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob
      expect(blob.type).toBe('application/pdf')
    })

    it('should handle empty PDF data', () => {
      expect(() => exportToPDF([], testColumns, 'empty-pdf')).not.toThrow()
    })

    it('should handle long text in PDF cells', () => {
      const longTextData = [
        {
          id: 1,
          name: 'Item with very long name that might not fit in a single line',
          description: 'This is a very long description that contains multiple sentences and should be properly wrapped in the PDF table cell to ensure readability and proper formatting.'
        }
      ]

      const longTextColumns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' }
      ]

      expect(() => exportToPDF(longTextData, longTextColumns, 'long-text')).not.toThrow()
    })

    it('should handle special characters in PDF', () => {
      const specialData = [
        {
          id: 1,
          name: 'Инструмент с русскими символами',
          description: 'Описание: №1, цена 1,500.00 ₽'
        }
      ]

      expect(() => exportToPDF(specialData, testColumns, 'special-chars')).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle blob creation errors', () => {
      mockCreateObjectURL.mockImplementation(() => {
        throw new Error('Blob creation failed')
      })

      // Should not throw error, but handle gracefully
      expect(() => exportToCSV([], [], 'error-test')).not.toThrow()
    })

    it('should handle download errors', () => {
      mockClick.mockImplementation(() => {
        throw new Error('Download failed')
      })

      expect(() => exportToCSV([{ id: 1 }], [{ key: 'id', label: 'ID' }], 'download-error')).not.toThrow()
    })

    it('should handle invalid data types', () => {
      const invalidData = [
        { id: 1, circular: null }
      ]
      invalidData[0].circular = invalidData[0] // Create circular reference

      const columns = [
        { key: 'id', label: 'ID' },
        { key: 'circular', label: 'Circular' }
      ]

      expect(() => exportToCSV(invalidData, columns, 'invalid')).not.toThrow()
    })

    it('should handle undefined/null data gracefully', () => {
      expect(() => exportToCSV(undefined as any, [], 'undefined-data')).not.toThrow()
      expect(() => exportToCSV(null as any, [], 'null-data')).not.toThrow()
      expect(() => exportToCSV([], undefined as any, 'undefined-columns')).not.toThrow()
      expect(() => exportToCSV([], null as any, 'null-columns')).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large datasets', () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        category: `Category ${(i % 10) + 1}`,
        value: Math.random() * 1000
      }))

      const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'category', label: 'Category' },
        { key: 'value', label: 'Value' }
      ]

      expect(() => exportToCSV(largeData, columns, 'large-dataset')).not.toThrow()
    })

    it('should handle columns with nested object keys', () => {
      const nestedData = [
        {
          id: 1,
          user: {
            name: 'John Doe',
            profile: {
              role: 'admin'
            }
          }
        }
      ]

      const nestedColumns = [
        { key: 'id', label: 'ID' },
        { key: 'user.name', label: 'User Name' },
        { key: 'user.profile.role', label: 'Role' }
      ]

      expect(() => exportToCSV(nestedData, nestedColumns, 'nested')).not.toThrow()
    })

    it('should handle different data types in cells', () => {
      const mixedData = [
        {
          id: 1,
          name: 'Mixed Item',
          isActive: true,
          date: new Date('2024-01-15'),
          nullValue: null,
          undefinedValue: undefined,
          zeroValue: 0,
          emptyString: '',
          array: ['a', 'b', 'c'],
          object: { nested: 'value' }
        }
      ]

      const mixedColumns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'isActive', label: 'Active' },
        { key: 'date', label: 'Date' },
        { key: 'nullValue', label: 'Null' },
        { key: 'undefinedValue', label: 'Undefined' },
        { key: 'zeroValue', label: 'Zero' },
        { key: 'emptyString', label: 'Empty' },
        { key: 'array', label: 'Array' },
        { key: 'object', label: 'Object' }
      ]

      expect(() => exportToCSV(mixedData, mixedColumns, 'mixed-types')).not.toThrow()
    })
  })

  describe('File Naming', () => {
    it('should sanitize filename', () => {
      const unsafeFilename = 'file/with\\unsafe:chars<>|*?"'
      
      exportToCSV([], [], unsafeFilename)
      
      const downloadAttribute = mockLink.setAttribute.mock.calls.find(
        call => call[0] === 'download'
      )?.[1]
      
      // Should not contain unsafe characters
      expect(downloadAttribute).not.toMatch(/[\/\\:*?"<>|]/)
    })

    it('should add timestamp to filename if requested', () => {
      exportToCSV([], [], 'timestamped', { addTimestamp: true })
      
      const downloadAttribute = mockLink.setAttribute.mock.calls.find(
        call => call[0] === 'download'
      )?.[1]
      
      // Should contain date/time
      expect(downloadAttribute).toMatch(/timestamped_\d{4}-\d{2}-\d{2}.*\.csv/)
    })

    it('should handle empty filename', () => {
      exportToCSV([], [], '')
      
      const downloadAttribute = mockLink.setAttribute.mock.calls.find(
        call => call[0] === 'download'
      )?.[1]
      
      // Should have default filename
      expect(downloadAttribute).toBe('export.csv')
    })
  })

  describe('Column Configuration', () => {
    it('should respect column formatter functions', () => {
      const data = [
        { id: 1, amount: 1234.56, date: '2024-01-15T10:30:00Z' }
      ]

      const columnsWithFormatters = [
        { key: 'id', label: 'ID' },
        { 
          key: 'amount', 
          label: 'Amount',
          formatter: (value: number) => `$${value.toFixed(2)}`
        },
        {
          key: 'date',
          label: 'Date',
          formatter: (value: string) => new Date(value).toLocaleDateString()
        }
      ]

      exportToCSV(data, columnsWithFormatters, 'formatted')

      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob
      blob.text().then(content => {
        expect(content).toContain('$1234.56')
        expect(content).toContain('1/15/2024') // Depends on locale
      })
    })

    it('should handle columns without keys', () => {
      const data = [{ id: 1, name: 'Test' }]
      const invalidColumns = [
        { label: 'No Key Column' },
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' }
      ]

      expect(() => exportToCSV(data, invalidColumns as any, 'invalid-columns')).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = Date.now()
      
      const largeData = Array.from({ length: 5000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: `Description for item ${i}`,
        category: `Category ${i % 100}`,
        value: Math.random() * 1000,
        created_at: new Date().toISOString()
      }))

      const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'category', label: 'Category' },
        { key: 'value', label: 'Value' },
        { key: 'created_at', label: 'Created' }
      ]

      exportToCSV(largeData, columns, 'performance-test')
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete within reasonable time (less than 1 second for 5k records)
      expect(duration).toBeLessThan(1000)
    })
  })
})

