// Утилиты для экспорта данных
import api from '@/api/client'
import { formatCurrencyWithCode, formatDate, formatDateTime, formatDateWithOptions, formatNumberWithOptions } from '@/utils/formatters'
import { getClientPlatform } from '@/utils/device'

function _triggerDownload(url: string, filename: string) {
  // Ошибку click() гасим, чтобы сбой скачивания не ронял приложение/тесты (F-064).
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (e) {
    console.error('Download failed:', e)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  _triggerDownload(URL.createObjectURL(blob), filename)
}

export function downloadBlob(blob: Blob, filename: string) {
  _triggerDownload(URL.createObjectURL(blob), filename)
}

// Экспорт через backend API
export async function exportFromBackend(
  url: string,
  format: 'xlsx' | 'csv',
  filename: string,
  filters?: Record<string, any>
) {
  try {
    // F-626: раньше здесь был сырой fetch + localStorage.getItem('access_token') — но приложение
    // хранит токен под ключом 'elom_access', поэтому token был null → «Токен авторизации не найден»,
    // и кнопка «Экспорт» не работала нигде. Идём через общий api-клиент: он сам ставит Authorization
    // из elom_access (+ рефреш), а не дублирует чтение токена с неверным ключом. baseURL клиента —
    // /api/v1, а exportUrl в конфигах — полный '/api/v1/...' → срезаем префикс до относительного.
    const relative = url.replace(/^\/api\/v1/, '') || url

    // Чистим фильтры (пустые не шлём) + добавляем export=<format>
    const params: Record<string, any> = { export: format }
    // F-866: для CSV сообщаем платформу — бэкенд отдаёт разделитель/переносы под Windows/Mac Excel.
    if (format === 'csv') { params.platform = getClientPlatform() }
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== null && value !== undefined && value !== '') { params[key] = value }
      }
    }

    const response = await api.get(relative, { params, responseType: 'blob' })
    const blob = response.data as Blob

    // Если бэкенд не поддержал экспорт в этом формате (вернул JSON/ошибку вместо файла) — не
    // скачиваем «битый» файл, а показываем понятную ошибку. Пока сервер отдаёт xlsx для списков;
    // pdf-экспорт списков не реализован (MVP) → сюда прилетит не-файловый ответ.
    if (blob.type && blob.type.includes('application/json')) {
      throw new Error('Экспорт в этом формате пока не поддерживается сервером')
    }

    const extension = format === 'csv' ? 'csv' : 'xlsx'
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

// F-887 (CWE-1236): нейтрализация CSV/формула-инъекций в КЛИЕНТСКОМ экспорте (отчёты качают CSV
// на фронте). Строку, начинающуюся с формула-триггера, префиксуем ' — Excel/Numbers трактуют
// ячейку как текст, а не как живую формулу/DDE. Зеркалит серверный neutralize_formula_cell (F-626).
const _FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r']
function neutralizeFormulaCell(value: any): any {
  if (typeof value === 'string' && value.length > 0 && _FORMULA_TRIGGERS.includes(value[0])) {
    return "'" + value
  }
  return value
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
        const value = neutralizeFormulaCell(row[header])  // F-887: гасим формула-инъекцию
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
  // Без xlsx-библиотеки экспортируем данные как CSV (единый файл).
  // Раньше здесь через setTimeout скачивался ещё и ПУСТОЙ .xlsx (0 байт),
  // что ломало экспорт и роняло тесты (uncaught в таймере) — убрано (F-064).
  exportToCSV(data, filename, options)
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
