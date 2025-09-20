import { ChartConfiguration, ChartData, ChartOptions } from 'chart.js'

// DaisyUI color palette
export const DAISY_COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
  '#6366f1'  // indigo-500
]

// Dark theme colors
export const DAISY_COLORS_DARK = [
  '#60a5fa', // blue-400
  '#f87171', // red-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#a78bfa', // violet-400
  '#22d3ee', // cyan-400
  '#a3e635', // lime-400
  '#fb923c', // orange-400
  '#f472b6', // pink-400
  '#818cf8'  // indigo-400
]

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  borderWidth?: number
  fill?: boolean
  tension?: number
  pointBackgroundColor?: string
  pointBorderColor?: string
  pointRadius?: number
  pointHoverRadius?: number
  yAxisID?: string
}

export interface ChartConfig {
  labels: string[]
  datasets: ChartDataset[]
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'horizontalBar'
}

// Get colors based on theme
export function getColors(isDark: boolean = false): string[] {
  return isDark ? DAISY_COLORS_DARK : DAISY_COLORS
}

// Get color by index
export function getColor(index: number, isDark: boolean = false): string {
  const colors = getColors(isDark)
  return colors[index % colors.length]
}

// Generate gradient colors
export function generateGradientColors(
  ctx: any, // CanvasRenderingContext2D
  color: string,
  direction: 'vertical' | 'horizontal' = 'vertical'
): any { // CanvasGradient
  const gradient = direction === 'vertical' 
    ? ctx.createLinearGradient(0, 0, 0, 400)
    : ctx.createLinearGradient(0, 0, 400, 0)
  
  gradient.addColorStop(0, color + '80') // 50% opacity
  gradient.addColorStop(1, color + '20') // 12% opacity
  
  return gradient
}

// Format currency for tooltips
export function formatCurrencyTooltip(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

// Format number for tooltips
export function formatNumberTooltip(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}

// Format date for tooltips
export function formatDateTooltip(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Create line chart configuration
export function createLineChartConfig(
  config: ChartConfig,
  options: Partial<ChartOptions> = {}
): ChartConfiguration {
  const isDark = document.documentElement.classList.contains('dark')
  const colors = getColors(isDark)
  
  const datasets = config.datasets.map((dataset, index) => ({
    ...dataset,
    borderColor: dataset.borderColor || colors[index % colors.length],
    backgroundColor: dataset.backgroundColor || colors[index % colors.length] + '20',
    borderWidth: dataset.borderWidth || 2,
    fill: dataset.fill || false,
    tension: dataset.tension || 0.4,
    pointBackgroundColor: dataset.pointBackgroundColor || colors[index % colors.length],
    pointBorderColor: dataset.pointBorderColor || '#ffffff',
    pointRadius: dataset.pointRadius || 4,
    pointHoverRadius: dataset.pointHoverRadius || 6
  }))

  return {
    type: 'line',
    data: {
      labels: config.labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || ''
              const value = context.parsed.y
              return `${label}: ${formatCurrencyTooltip(value)}`
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            color: isDark ? '#9ca3af' : '#6b7280'
          }
        },
        y: {
          grid: {
            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            color: isDark ? '#9ca3af' : '#6b7280',
            callback: (value) => formatCurrencyTooltip(Number(value))
          }
        }
      },
      ...options
    }
  }
}

// Create bar chart configuration
export function createBarChartConfig(
  config: ChartConfig,
  options: Partial<ChartOptions> = {}
): ChartConfiguration {
  const isDark = document.documentElement.classList.contains('dark')
  const colors = getColors(isDark)
  
  const datasets = config.datasets.map((dataset, index) => ({
    ...dataset,
    backgroundColor: dataset.backgroundColor || colors[index % colors.length] + '80',
    borderColor: dataset.borderColor || colors[index % colors.length],
    borderWidth: dataset.borderWidth || 1
  }))

  return {
    type: 'bar',
    data: {
      labels: config.labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || ''
              const value = context.parsed.y
              return `${label}: ${formatCurrencyTooltip(value)}`
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            color: isDark ? '#9ca3af' : '#6b7280'
          }
        },
        y: {
          grid: {
            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            color: isDark ? '#9ca3af' : '#6b7280',
            callback: (value) => formatCurrencyTooltip(Number(value))
          }
        }
      },
      ...options
    }
  }
}

// Create horizontal bar chart configuration
export function createHorizontalBarChartConfig(
  config: ChartConfig,
  options: Partial<ChartOptions> = {}
): ChartConfiguration {
  const isDark = document.documentElement.classList.contains('dark')
  const colors = getColors(isDark)
  
  const datasets = config.datasets.map((dataset, index) => ({
    ...dataset,
    backgroundColor: dataset.backgroundColor || colors[index % colors.length] + '80',
    borderColor: dataset.borderColor || colors[index % colors.length],
    borderWidth: dataset.borderWidth || 1
  }))

  return {
    type: 'bar',
    data: {
      labels: config.labels,
      datasets
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || ''
              const value = context.parsed.x
              return `${label}: ${formatCurrencyTooltip(value)}`
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            color: isDark ? '#9ca3af' : '#6b7280',
            callback: (value) => formatCurrencyTooltip(Number(value))
          }
        },
        y: {
          grid: {
            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            color: isDark ? '#9ca3af' : '#6b7280'
          }
        }
      },
      animation: {
        duration: 800,
        easing: 'easeInOutQuart'
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      ...options
    }
  }
}

// Create pie chart configuration
export function createPieChartConfig(
  config: ChartConfig,
  options: Partial<ChartOptions> = {}
): ChartConfiguration {
  const isDark = document.documentElement.classList.contains('dark')
  const colors = getColors(isDark)
  
  const datasets = config.datasets.map((dataset) => ({
    ...dataset,
    backgroundColor: dataset.backgroundColor || colors.slice(0, config.labels.length),
    borderColor: dataset.borderColor || '#ffffff',
    borderWidth: dataset.borderWidth || 2
  }))

  return {
    type: 'pie',
    data: {
      labels: config.labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || ''
              const value = context.parsed
              const total = context.dataset.data.reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0)
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
              return `${label}: ${formatCurrencyTooltip(value)} (${percentage}%)`
            }
          }
        }
      },
      ...options
    }
  }
}

// Create doughnut chart configuration
export function createDoughnutChartConfig(
  config: ChartConfig,
  options: Partial<ChartOptions> = {}
): ChartConfiguration {
  const isDark = document.documentElement.classList.contains('dark')
  const colors = getColors(isDark)
  
  const datasets = config.datasets.map((dataset) => ({
    ...dataset,
    backgroundColor: dataset.backgroundColor || colors.slice(0, config.labels.length),
    borderColor: dataset.borderColor || '#ffffff',
    borderWidth: dataset.borderWidth || 2
  }))

  return {
    type: 'doughnut',
    data: {
      labels: config.labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || ''
              const value = context.parsed
              const total = context.dataset.data.reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0)
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
              return `${label}: ${formatCurrencyTooltip(value)} (${percentage}%)`
            }
          }
        }
      },
      ...options
    }
  }
}

// Utility to truncate long labels
export function truncateLabel(label: string, maxLength: number = 20): string {
  if (label.length <= maxLength) return label
  return label.substring(0, maxLength - 3) + '...'
}

// Utility to format large numbers
export function formatLargeNumber(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M'
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K'
  }
  return value.toString()
}

// Utility to get chart height based on data length
export function getChartHeight(dataLength: number, minHeight: number = 300, maxHeight: number = 600): string {
  const height = Math.max(minHeight, Math.min(maxHeight, dataLength * 40 + 100))
  return `${height}px`
}
