<template>
  <div class="chart-container">
    <!-- Chart Header -->
    <div class="chart-header">
      <div class="chart-title-section">
        <h3 class="chart-title">{{ title }}</h3>
        <p v-if="subtitle" class="chart-subtitle">{{ subtitle }}</p>
      </div>
      
      <!-- Chart Controls -->
      <div v-if="showControls" class="chart-controls">
        <div class="chart-legend" v-if="showLegend">
          <div 
            v-for="(item, index) in legendItems" 
            :key="index"
            class="legend-item"
          >
            <div 
              class="legend-color" 
              :style="{ backgroundColor: item.color }"
            ></div>
            <span class="legend-label">{{ item.label }}</span>
          </div>
        </div>
        
        <div class="chart-actions">
          <button 
            v-if="showDownload"
            @click="downloadChart"
            class="btn btn-sm btn-outline btn-square"
            title="Скачать график"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          
          <button 
            v-if="showFullscreen"
            @click="toggleFullscreen"
            class="btn btn-sm btn-outline btn-square"
            title="Полноэкранный режим"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Chart Content -->
    <div class="chart-content" :class="{ 'chart-loading': loading }">
      <!-- Loading State -->
      <div v-if="loading" class="chart-loading-overlay">
        <div class="loading-spinner">
          <div class="spinner"></div>
        </div>
        <p class="loading-text">{{ loadingText || 'Загрузка графика...' }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!hasData" class="chart-empty">
        <div class="empty-icon">
          <svg class="w-12 h-12 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p class="empty-text">{{ emptyText || 'Нет данных для отображения' }}</p>
      </div>

      <!-- Chart Canvas -->
      <div v-else class="chart-wrapper" :style="{ height: chartHeight }">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </div>

    <!-- Chart Footer -->
    <div v-if="showFooter && (hasData || loading)" class="chart-footer">
      <div class="chart-stats" v-if="stats">
        <div v-for="(stat, key) in stats" :key="key" class="stat-item">
          <span class="stat-label">{{ stat.label }}:</span>
          <span class="stat-value">{{ stat.value }}</span>
        </div>
      </div>
      
      <div v-if="lastUpdated" class="chart-updated">
        Обновлено: {{ formatDateTime(lastUpdated) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { 
  Chart, 
  ChartConfiguration, 
  // ChartData, // Не используется 
  ChartOptions, 
  CategoryScale, 
  LinearScale, 
  ArcElement, 
  Tooltip, 
  Legend,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  // F-504: Chart.js v4 требует регистрировать КОНТРОЛЛЕРЫ, а не только элементы/шкалы.
  // Их не было — поэтому new Chart({type:'bar'|'line'|'pie'|'doughnut'}) бросал
  // «… is not a registered controller», ошибка глоталась (см. catch ниже) и графики
  // во ВСЕХ отчётах оставались пустым canvas'ом.
  BarController,
  LineController,
  PieController,
  DoughnutController
} from 'chart.js'
import { formatDateTime } from '@/utils/formatters'
import { useThemeStore } from '@/stores/theme'

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  BarController,
  LineController,
  PieController,
  DoughnutController
)

export interface LegendItem {
  label: string
  color: string
}

export interface ChartStat {
  label: string
  value: string | number
}

export interface ChartContainerProps {
  title: string
  subtitle?: string
  chartHeight?: string
  loading?: boolean
  loadingText?: string
  emptyText?: string
  showControls?: boolean
  showLegend?: boolean
  showDownload?: boolean
  showFullscreen?: boolean
  showFooter?: boolean
  legendItems?: LegendItem[]
  stats?: Record<string, ChartStat>
  lastUpdated?: string
  hasData?: boolean
}

const props = withDefaults(defineProps<ChartContainerProps>(), {
  chartHeight: '400px',
  loading: false,
  showControls: true,
  showLegend: true,
  showDownload: true,
  showFullscreen: true,
  showFooter: true,
  hasData: true
})

const emit = defineEmits<{
  download: []
  fullscreen: [isFullscreen: boolean]
}>()

const chartCanvas = ref<any>() // HTMLCanvasElement
const chartInstance = ref<Chart | null>(null)
const isFullscreen = ref(false)
// F-065: последний конфиг — чтобы пересобрать график с цветами новой темы
let lastChartConfig: ChartConfiguration | null = null

// F-065/F-575: тема графика берётся из РЕАКТИВНОГО стора (единый источник правды),
// а НЕ из DOM-класса .dark. Класс в момент создания графика мог отставать от isDark
// (тултип в тёмной теме получал светлые «дневные» цвета — тёмный бокс на тёмном фоне).
const themeStore = useThemeStore()

// Chart configuration
// Цвета осей/сетки/тултипа зависят от темы (в тёмной чёрный тултип и светлая сетка
// выглядели инородно). В тёмной теме тултип светлый (контраст с тёмным графиком).
function getThemeColors() {
  const dark = themeStore.isDark
  return {
    grid: dark ? 'rgba(212, 219, 223, 0.10)' : 'rgba(28, 40, 46, 0.10)',
    ticks: dark ? '#AAB6BD' : '#5C6B74',          // graphite-300 / graphite-500
    tooltipBg: dark ? 'rgba(232, 237, 240, 0.96)' : 'rgba(20, 26, 29, 0.92)',
    tooltipText: dark ? '#161D22' : '#FFFFFF',
    tooltipBorder: dark ? 'rgba(20, 26, 29, 0.12)' : 'rgba(255, 255, 255, 0.12)',
  }
}

function getDefaultOptions(): ChartOptions {
  const c = getThemeColors()
  return {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false, // We handle legend manually
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          family: 'IBM Plex Sans, system-ui, sans-serif',
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: c.tooltipBg,
      titleColor: c.tooltipText,
      bodyColor: c.tooltipText,
      borderColor: c.tooltipBorder,
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
             titleFont: {
               family: 'IBM Plex Sans, system-ui, sans-serif',
               size: 13,
               weight: 'bold'
             },
      // tooltip body shows values (DATA) → monospace
      bodyFont: {
        family: 'IBM Plex Mono, ui-monospace, monospace',
        size: 12
      },
      padding: 12
    }
  },
  scales: {
           x: {
             grid: {
               color: c.grid
             },
             // axis tick labels are DATA → monospace
             ticks: {
               font: {
                 family: 'IBM Plex Mono, ui-monospace, monospace',
                 size: 11
               },
               color: c.ticks
             }
           },
           y: {
             grid: {
               color: c.grid
             },
             ticks: {
               font: {
                 family: 'IBM Plex Mono, ui-monospace, monospace',
                 size: 11
               },
               color: c.ticks
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
  }
  }
}

// ELOM series palette — copper accent + steel/graphite + domain status hues
// (derived from DESIGN_LANGUAGE.md; no default blue/violet/indigo/cyan/pink).
const daisyColors = [
  '#B0500F', // copper-600 (primary accent)
  '#3E6B8C', // steel-blue
  '#1F7A54', // terminal-green
  '#C77A0A', // signal-amber
  '#5C6B74', // graphite-500
  '#B23A2E', // fault-red
  '#8F400B', // copper-700
  '#7FA3BE', // steel-blue light
  '#2C3840', // graphite-700
  '#4E7C6F'  // muted teal-green
]

// F-575: ГЛУБОКИЙ мёрж опций. Раньше был поверхностный { ...base, ...config.options }:
// page-конфиг (createLineChartConfig) задаёт свой plugins.tooltip (только callbacks, без цветов),
// поэтому он ЦЕЛИКОМ перекрывал темизированный tooltip из getDefaultOptions → тултип всегда
// падал на дефолт Chart.js (тёмный бокс) и НЕ следовал теме (в тёмной теме тёмный-на-тёмном).
// Мёржим plugins.tooltip/legend по-отдельности: цвета из base (тема) + колбэки/формат из страницы.
function mergeChartOptions(config: ChartConfiguration): ChartOptions {
  const base = getDefaultOptions() as any
  const o = (config.options || {}) as any
  const bp = base.plugins || {}
  const op = o.plugins || {}
  return {
    ...base,
    ...o,
    plugins: {
      ...bp,
      ...op,
      tooltip: { ...(bp.tooltip || {}), ...(op.tooltip || {}) },
      legend: { ...(bp.legend || {}), ...(op.legend || {}) },
    },
  }
}

// Methods
function createChart(config: ChartConfiguration) {
  if (!chartCanvas.value) { return }
  lastChartConfig = config

  // Destroy existing chart completely
  if (chartInstance.value) {
    chartInstance.value.destroy()
    chartInstance.value = null
  }

  // Clear canvas
  const ctx = chartCanvas.value.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, chartCanvas.value.width, chartCanvas.value.height)
  }

  // Merge with default options (deep for plugins — F-575)
  const finalConfig = {
    ...config,
    options: mergeChartOptions(config)
  }

  try {
    chartInstance.value = new Chart(chartCanvas.value, finalConfig)
  } catch (error) {
    // F-504: раньше лог был закомментирован «для продакшена» — из-за этого падение отрисовки
    // было полностью НЕМЫМ: пустой canvas при чистой консоли, и баг жил незамеченным.
    // Диагностика в консоль обязана оставаться: это сигнал разработчику, а не пользователю.
    console.error('ChartContainer: не удалось создать график', error)
    chartInstance.value = null
  }
}

function updateChart(config: ChartConfiguration) {
  if (!chartInstance.value) {
    // If no chart exists, create a new one
    createChart(config)
    return
  }

  // Merge with default options (deep for plugins — F-575)
  const finalConfig = {
    ...config,
    options: mergeChartOptions(config)
  }

  try {
    chartInstance.value.data = finalConfig.data
    chartInstance.value.options = finalConfig.options
    chartInstance.value.update('active')
  } catch (error) {
    // F-504: лог не глушим — немой catch уже спрятал баг с контроллерами Chart.js.
    console.error('ChartContainer: не удалось обновить график, пересоздаю', error)
    // If update fails, recreate the chart
    createChart(config)
  }
}

function destroyChart() {
  if (chartInstance.value) {
    chartInstance.value.destroy()
    chartInstance.value = null
  }
}

function downloadChart() {
  if (!chartInstance.value) { return }

  const url = chartInstance.value.toBase64Image('image/png', 1.0)
  const link = document.createElement('a')
  link.download = `${props.title.toLowerCase().replace(/\s+/g, '_')}_chart.png`
  link.href = url
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  emit('download')
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  emit('fullscreen', isFullscreen.value)
  
  // Resize chart after fullscreen toggle
  nextTick(() => {
    if (chartInstance.value) {
      chartInstance.value.resize()
    }
  })
}

// Expose methods for parent components
defineExpose({
  createChart,
  updateChart,
  destroyChart,
  chartInstance: computed(() => chartInstance.value)
})

// Lifecycle
onMounted(() => {
  // Chart will be created by parent component
})

onUnmounted(() => {
  destroyChart()
})

// F-065: при смене темы пересобираем график, чтобы применились цвета сетки/
// осей/тултипа новой темы (options запекаются при создании — update() их не меняет).
// Следим за РЕАКТИВНЫМ isDark из стора (класс .dark на DOM сам по себе не реактивен).
// themeStore объявлен выше (у getThemeColors).
watch(() => themeStore.isDark, () => {
  if (chartInstance.value && lastChartConfig) {
    createChart(lastChartConfig)
  }
})
</script>

<style scoped>
.chart-container {
  background-color: hsl(var(--b1));
  border-radius: 0.375rem;
  border: 1px solid hsl(var(--b3));
  box-shadow: 0 1px 2px rgba(14, 20, 23, 0.06);
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.dark .chart-header {
  border-bottom-color: #374151;
}

.chart-title-section {
  flex: 1;
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.dark .chart-title {
  color: #f9fafb;
}

.chart-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
}

.dark .chart-subtitle {
  color: #9ca3af;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap; /* F-561: не переполнять контейнер на планшете (iPad) — переносим легенду/кнопки */
}

.chart-legend {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap; /* F-561: длинная легенда переносится и на планшете (iPad), не только на мобиле */
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
}

.legend-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.dark .legend-label {
  color: #9ca3af;
}

.chart-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chart-content {
  position: relative;
}

.chart-loading {
  pointer-events: none;
}

.chart-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: hsl(var(--b1) / 0.9);
  z-index: 10;
}

.loading-spinner {
  margin-bottom: 0.75rem;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid hsl(var(--p));
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 0.875rem;
  color: #6b7280;
}

.dark .loading-text {
  color: #9ca3af;
}

.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
}

.empty-icon {
  margin-bottom: 0.75rem;
}

.empty-text {
  font-size: 0.875rem;
  color: #6b7280;
}

.chart-wrapper {
  position: relative;
  padding: 1rem;
}

.chart-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.dark .chart-footer {
  border-top-color: #374151;
  background-color: #111827;
}

.chart-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.dark .stat-label {
  color: #9ca3af;
}

.stat-value {
  font-size: 0.75rem;
  font-weight: 500;
  color: #111827;
}

.dark .stat-value {
  color: #f9fafb;
}

.chart-updated {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .chart-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .chart-legend {
    flex-wrap: wrap;
  }
  
  .chart-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .chart-stats {
    flex-wrap: wrap;
  }
}

/* Animation for chart loading */
.chart-content {
  transition: opacity 0.3s ease;
}

.chart-loading .chart-content {
  opacity: 0.6;
}

/* Fullscreen mode */
.chart-container.fullscreen {
  position: fixed;
  inset: 0;
  z-index: 50;
  background-color: white;
}

.dark .chart-container.fullscreen {
  background-color: #1f2937;
}

.chart-container.fullscreen .chart-wrapper {
  height: 100%;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
