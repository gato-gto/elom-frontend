// Утилиты для экспорта данных

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

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: string[]
) {
  if (data.length === 0) {
    throw new Error('Нет данных для экспорта')
  }

  // Определяем заголовки
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
}

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: string[]
) {
  // Для простоты экспортируем как CSV с расширением .xlsx
  // В реальном приложении можно использовать библиотеку xlsx
  exportToCSV(data, filename, headers)
  
  // Переименовываем файл
  setTimeout(() => {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    link.download = `${filename}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, 100)
}

export function exportToPDF<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: string[]
) {
  if (data.length === 0) {
    throw new Error('Нет данных для экспорта')
  }

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
      <p>Дата экспорта: ${new Date().toLocaleDateString('ru-RU')}</p>
      <p>Количество записей: ${data.length}</p>
      <table>
        <thead>
          <tr>
            ${(headers || Object.keys(data[0])).map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => 
            `<tr>${(headers || Object.keys(row)).map(header => 
              `<td>${row[header] || ''}</td>`
            ).join('')}</tr>`
          ).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `

  downloadFile(pdfContent, `${filename}.html`, 'text/html')
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
        formattedRow[key] = value.toLocaleDateString('ru-RU')
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
  date: (value: any) => {
    if (!value) return ''
    const date = new Date(value)
    return date.toLocaleDateString('ru-RU')
  },
  datetime: (value: any) => {
    if (!value) return ''
    const date = new Date(value)
    return date.toLocaleString('ru-RU')
  },
  boolean: (value: any) => value ? 'Да' : 'Нет',
  currency: (value: any) => {
    if (typeof value !== 'number') return value
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(value)
  },
  number: (value: any) => {
    if (typeof value !== 'number') return value
    return new Intl.NumberFormat('ru-RU').format(value)
  }
}
