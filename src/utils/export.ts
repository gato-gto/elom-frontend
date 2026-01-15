// Утилиты для экспорта данных
import { formatCurrencyWithCode, formatDate, formatDateTime, formatDateWithOptions, formatNumberWithOptions } from '@/utils/formatters'

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

// Экспорт через backend API
export async function exportFromBackend(
  url: string, 
  format: 'xlsx' | 'pdf', 
  filename: string,
  filters?: Record<string, any>
) {
  try {
    // Добавляем параметр export к URL
    const exportUrl = new URL(url)
    exportUrl.searchParams.set('export', format)
    
    // Добавляем фильтры к URL
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => exportUrl.searchParams.append(key, v.toString()))
          } else {
            exportUrl.searchParams.set(key, value.toString())
          }
        }
      })
    }
    
    // Получаем токен авторизации
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Токен авторизации не найден')
    }
    
    // Выполняем запрос
    const response = await fetch(exportUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': format === 'xlsx' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Ошибка экспорта: ${response.status} ${response.statusText}`)
    }
    
    // Получаем blob и скачиваем файл
    const blob = await response.blob()
    const extension = format === 'xlsx' ? 'xlsx' : 'pdf'
    downloadBlob(blob, `${filename}.${extension}`)
    
    return true
  } catch (error) {
    console.error('Ошибка экспорта:', error)
    throw error
  }
}

export interface ExportOptions {
  headers?: string[]
  formatters?: Record<string, (value: any) => string>
}

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  options?: ExportOptions | string[]
) {
  if (!data || data.length === 0) {
    throw new Error('Нет данных для экспорта')
  }

  // Определяем заголовки
  const headers = Array.isArray(options) ? options : options?.headers
  const csvHeaders = headers || Object.keys(data[0])
  
  // Создаем CSV контент
  const csvContent = [
    csvHeaders.join(','),
    ...data.map(row => 
      csvHeaders.map(header => {
        const value = row[header]
        // Экранируем значения с запятыми или кавычками
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value || ''
      }).join(',')
    )
  ].join('\n')

  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;')
  return true
}

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  options?: ExportOptions | string[]
) {
  // Для простоты экспортируем как CSV с расширением .xlsx
  // В реальном приложении можно использовать библиотеку xlsx
  exportToCSV(data, filename, options)
  
  // Переименовываем файл
  setTimeout(() => {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    link.download = `${filename}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, 100)
  return true
}

export function exportToPDF<T extends Record<string, any>>(
  data: T[],
  filename: string,
  options?: ExportOptions | string[]
) {
  if (!data || data.length === 0) {
    throw new Error('Нет данных для экспорта')
  }

  // Определяем заголовки
  const headers = Array.isArray(options) ? options : options?.headers
  const csvHeaders = headers || Object.keys(data[0])

  // Простая реализация PDF экспорта
  // В реальном приложении можно использовать библиотеку jsPDF
  const pdfContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${filename}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        h1 { color: #333; }
      </style>
    </head>
    <body>
      <h1>${filename}</h1>
      <p>Дата экспорта: ${formatDateWithOptions(new Date(), { year: 'numeric', month: '2-digit', day: '2-digit' })}</p>
      <p>Количество записей: ${data.length}</p>
      <table>
        <thead>
          <tr>
            ${csvHeaders.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => 
            `<tr>${csvHeaders.map(header => 
              `<td>${row[header] || ''}</td>`
            ).join('')}</tr>`
          ).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `

  downloadFile(pdfContent, `${filename}.html`, 'text/html')
  return true
}

// Утилиты для форматирования данных перед экспортом
export function formatDataForExport<T extends Record<string, any>>(
  data: T[],
  formatters?: Partial<Record<keyof T, (value: any) => string>>
): Record<string, any>[] {
  return data.map(row => {
    const formattedRow: Record<string, any> = {}
    
    Object.keys(row).forEach(key => {
      const value = row[key]
      const formatter = formatters?.[key as keyof T]
      
      if (formatter) {
        formattedRow[key] = formatter(value)
      } else if (value instanceof Date) {
        formattedRow[key] = formatDate(value)
      } else if (typeof value === 'boolean') {
        formattedRow[key] = value ? 'Да' : 'Нет'
      } else {
        formattedRow[key] = value
      }
    })
    
    return formattedRow
  })
}

// Предустановленные форматтеры для разных типов данных
export const defaultFormatters = {
  date: (value: any) => (value ? formatDate(value) : ''),
  datetime: (value: any) => (value ? formatDateTime(value) : ''),
  boolean: (value: any) => value ? 'Да' : 'Нет',
  currency: (value: any) => {
    if (value === null || value === undefined || value === '') {return value}
    return formatCurrencyWithCode(value, 'RUB')
  },
  number: (value: any) => {
    if (value === null || value === undefined || value === '') {return value}
    return formatNumberWithOptions(value)
  }
}
