// src/composables/useExport.ts
import { ref } from 'vue'

export interface ExportOptions {
  filename?: string
  sheetName?: string
  headers?: string[]
}

export function useExport() {
  const exporting = ref(false)

  const exportToCSV = <T extends Record<string, any>>(data: T[], filename: string, options?: ExportOptions) => {
    if (!data || data.length === 0) {
      // No data to export
      return
    }

    const headers = options?.headers || Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value || ''
        }).join(',')
      )
    ].join('\n')

    downloadFile(csvContent, `${filename}.csv`, 'text/csv')
  }

  const exportToExcel = <T extends Record<string, any>>(data: T[], filename: string, options?: ExportOptions) => {
    if (!data || data.length === 0) {
      // No data to export
      return
    }

    // For now, we'll export as CSV with .xlsx extension
    // In a real app, you'd use a library like xlsx
    const headers = options?.headers || Object.keys(data[0])
    const csvContent = [
      headers.join('\t'),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          return value || ''
        }).join('\t')
      )
    ].join('\n')

    downloadFile(csvContent, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  }

  const exportToPDF = <T extends Record<string, any>>(data: T[], filename: string, options?: ExportOptions) => {
    if (!data || data.length === 0) {
      // No data to export
      return
    }

    // For now, we'll export as CSV with .pdf extension
    // In a real app, you'd use a library like jsPDF
    const headers = options?.headers || Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          return value || ''
        }).join(',')
      )
    ].join('\n')

    downloadFile(csvContent, `${filename}.pdf`, 'application/pdf')
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  return {
    exporting,
    exportToCSV,
    exportToExcel,
    exportToPDF
  }
}

// Global export functions for backward compatibility
export const exportToCSV = (data: any[], filename: string, options?: ExportOptions) => {
  const { exportToCSV: exportFn } = useExport()
  exportFn(data, filename, options)
}

export const exportToExcel = (data: any[], filename: string, options?: ExportOptions) => {
  const { exportToExcel: exportFn } = useExport()
  exportFn(data, filename, options)
}

export const exportToPDF = (data: any[], filename: string, options?: ExportOptions) => {
  const { exportToPDF: exportFn } = useExport()
  exportFn(data, filename, options)
}


