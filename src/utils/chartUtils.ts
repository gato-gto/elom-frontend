import type { ChartConfiguration, ChartOptions } from 'chart.js'
import { formatCurrencyWithCode, formatDateWithOptions, formatNumberWithOptions } from '@/utils/formatters'

// D-030: палитра графиков из токенов ELOM (сталь-синий, медь, зелёный, слива, охра, бирюза), проверена
// валидатором dataviz (яркость, насыщенность, различимость при дальтонизме, контраст) для светлой
// поверхности и тёмной #161D22. Цвета по порядку, БЕЗ повтора по кругу: 7-я и дальше категории — «Другие».
export const DAISY_COLORS = ['#2f6ea8', '#b0500f', '#1f7a54', '#8a4fa0', '#a07c00', '#008aa8']
export const DAISY_COLORS_DARK = ['#5a93cc', '#d06a28', '#3fa577', '#a874c0', '#b38c18', '#2a9bb0']
export const OTHER_COLOR = '#8a969c'
export const OTHER_COLOR_DARK = '#6b7a82'

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
  return index < colors.length ? colors[index] : (isDark ? OTHER_COLOR_DARK : OTHER_COLOR)
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
  return formatCurrencyWithCode(value, 'UZS', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

// Format number for tooltips
export function formatNumberTooltip(value: number): string {
  return formatNumberWithOptions(value)
}

// Format date for tooltips
export function formatDateTooltip(dateString: string): string {
  return formatDateWithOptions(dateString, {
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
    borderColor: dataset.borderColor ?? colors[index % colors.length],
    backgroundColor: dataset.backgroundColor ?? colors[index % colors.length] + '20',
    borderWidth: dataset.borderWidth ?? 2,
    fill: dataset.fill ?? false,
    tension: dataset.tension ?? 0.4,
    pointBackgroundColor: dataset.pointBackgroundColor ?? colors[index % colors.length],
    pointBorderColor: dataset.pointBorderColor ?? '#ffffff',
    pointRadius: dataset.pointRadius ?? 4,
    pointHoverRadius: dataset.pointHoverRadius ?? 6
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
              const value = context.parsed.y ?? 0
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
    backgroundColor: dataset.backgroundColor ?? colors[index % colors.length] + '80',
    borderColor: dataset.borderColor ?? colors[index % colors.length],
    borderWidth: dataset.borderWidth ?? 1
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
              const value = context.parsed.y ?? 0
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
    backgroundColor: dataset.backgroundColor ?? colors[index % colors.length] + '80',
    borderColor: dataset.borderColor ?? colors[index % colors.length],
    borderWidth: dataset.borderWidth ?? 1
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
              const value = context.parsed.x ?? 0
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
    backgroundColor: dataset.backgroundColor ?? colors.slice(0, config.labels.length),
    borderColor: dataset.borderColor ?? '#ffffff',
    borderWidth: dataset.borderWidth ?? 2
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
              const value = context.parsed as number
              const total = (context.dataset.data as number[]).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0)
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
    backgroundColor: dataset.backgroundColor ?? colors.slice(0, config.labels.length),
    borderColor: dataset.borderColor ?? '#ffffff',
    borderWidth: dataset.borderWidth ?? 2
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
              const value = context.parsed as number
              const total = (context.dataset.data as number[]).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0)
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
  if (label.length <= maxLength) {return label}
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
