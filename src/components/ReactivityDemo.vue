<template>
  <div class="reactivity-demo">
    <div class="demo-header">
      <h2 class="demo-title">🚀 Демонстрация оптимизированной реактивности</h2>
      <p class="demo-subtitle">Сравнение производительности обычной и оптимизированной версий</p>
    </div>

    <div class="demo-grid">
      <!-- Обычная версия -->
      <div class="demo-card">
        <div class="card-header">
          <h3>📊 Обычная версия</h3>
          <div class="performance-indicator" :class="{ 'slow': normalPerformance.isSlow }">
            {{ normalPerformance.status }}
          </div>
        </div>
        
        <div class="demo-content">
          <div class="input-group">
            <label>Поиск:</label>
            <input 
              v-model="normalSearch" 
              type="text" 
              placeholder="Введите текст для поиска..."
              class="demo-input"
            />
          </div>
          
          <div class="stats">
            <div class="stat">
              <span class="stat-label">Перерендеры:</span>
              <span class="stat-value">{{ normalRenders }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Время поиска:</span>
              <span class="stat-value">{{ normalSearchTime }}ms</span>
            </div>
            <div class="stat">
              <span class="stat-label">Результаты:</span>
              <span class="stat-value">{{ normalResults.length }}</span>
            </div>
          </div>
          
          <div class="results">
            <div 
              v-for="item in normalResults" 
              :key="item.id"
              class="result-item"
            >
              {{ item.name }}
            </div>
          </div>
        </div>
      </div>

      <!-- Оптимизированная версия -->
      <div class="demo-card optimized">
        <div class="card-header">
          <h3>⚡ Оптимизированная версия</h3>
          <div class="performance-indicator" :class="{ 'fast': optimizedPerformance.isFast }">
            {{ optimizedPerformance.status }}
          </div>
        </div>
        
        <div class="demo-content">
          <div class="input-group">
            <label>Поиск:</label>
            <input 
              v-model="optimizedSearch" 
              type="text" 
              placeholder="Введите текст для поиска..."
              class="demo-input"
            />
          </div>
          
          <div class="stats">
            <div class="stat">
              <span class="stat-label">Перерендеры:</span>
              <span class="stat-value">{{ optimizedRenders }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Время поиска:</span>
              <span class="stat-value">{{ optimizedSearchTime }}ms</span>
            </div>
            <div class="stat">
              <span class="stat-label">Результаты:</span>
              <span class="stat-value">{{ optimizedResults.length }}</span>
            </div>
          </div>
          
          <div class="results">
            <div 
              v-for="item in optimizedResults" 
              :key="item.id"
              class="result-item"
            >
              {{ item.name }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Сравнение производительности -->
    <div class="performance-comparison">
      <h3>📈 Сравнение производительности</h3>
      <div class="comparison-grid">
        <div class="comparison-item">
          <span class="comparison-label">Перерендеры:</span>
          <div class="comparison-bar">
            <div class="bar normal" :style="{ width: `${normalRenders * 2}%` }">
              {{ normalRenders }}
            </div>
            <div class="bar optimized" :style="{ width: `${optimizedRenders * 2}%` }">
              {{ optimizedRenders }}
            </div>
          </div>
        </div>
        
        <div class="comparison-item">
          <span class="comparison-label">Время поиска:</span>
          <div class="comparison-bar">
            <div class="bar normal" :style="{ width: `${Math.min(normalSearchTime * 2, 100)}%` }">
              {{ normalSearchTime }}ms
            </div>
            <div class="bar optimized" :style="{ width: `${Math.min(optimizedSearchTime * 2, 100)}%` }">
              {{ optimizedSearchTime }}ms
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Технические детали -->
    <div class="technical-details">
      <h3>🔧 Технические улучшения</h3>
      <div class="improvements-grid">
        <div class="improvement">
          <div class="improvement-icon">🎯</div>
          <div class="improvement-content">
            <h4>Мемоизация</h4>
            <p>Computed свойства кэшируются и пересчитываются только при изменении зависимостей</p>
          </div>
        </div>
        
        <div class="improvement">
          <div class="improvement-icon">⏱️</div>
          <div class="improvement-content">
            <h4>Debounce</h4>
            <p>Поиск выполняется с задержкой, предотвращая избыточные запросы</p>
          </div>
        </div>
        
        <div class="improvement">
          <div class="improvement-icon">🔄</div>
          <div class="improvement-content">
            <h4>Batch обновления</h4>
            <p>Множественные изменения группируются для предотвращения лишних перерендеров</p>
          </div>
        </div>
        
        <div class="improvement">
          <div class="improvement-icon">💾</div>
          <div class="improvement-content">
            <h4>Кэширование</h4>
            <p>Результаты запросов кэшируются для ускорения повторных обращений</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { debounce } from '@/utils/debounce'

// Тестовые данные
const testData = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`,
  category: `Category ${Math.floor(i / 100) + 1}`,
  value: Math.random() * 1000
}))

// Обычная версия
const normalSearch = ref('')
const normalResults = ref(testData)
const normalRenders = ref(0)
const normalSearchTime = ref(0)

// Оптимизированная версия
const optimizedSearch = ref('')
const optimizedResults = ref(testData)
const optimizedRenders = ref(0)
const optimizedSearchTime = ref(0)

// Производительность
const normalPerformance = computed(() => {
  const isSlow = normalRenders.value > 50 || normalSearchTime.value > 100
  return {
    status: isSlow ? '🐌 Медленно' : '⚡ Быстро',
    isSlow
  }
})

const optimizedPerformance = computed(() => {
  const isFast = optimizedRenders.value < 10 && optimizedSearchTime.value < 50
  return {
    status: isFast ? '🚀 Очень быстро' : '⚡ Быстро',
    isFast
  }
})

// Обычный поиск (без оптимизации)
const performNormalSearch = (query: string) => {
  const startTime = performance.now()
  normalRenders.value++
  
  if (!query.trim()) {
    normalResults.value = testData
  } else {
    normalResults.value = testData.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase())
    )
  }
  
  normalSearchTime.value = Math.round(performance.now() - startTime)
}

// Оптимизированный поиск
const performOptimizedSearch = debounce((query: string) => {
  const startTime = performance.now()
  optimizedRenders.value++
  
  if (!query.trim()) {
    optimizedResults.value = testData
  } else {
    optimizedResults.value = testData.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase())
    )
  }
  
  optimizedSearchTime.value = Math.round(performance.now() - startTime)
}, 300)

// Watchers
watch(normalSearch, (newValue) => {
  performNormalSearch(newValue)
})

watch(optimizedSearch, (newValue) => {
  performOptimizedSearch(newValue)
})

// Инициализация
onMounted(() => {
  // Симуляция начальной загрузки
  setTimeout(() => {
    performNormalSearch('')
    performOptimizedSearch('')
  }, 100)
})
</script>

<style scoped>
.reactivity-demo {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-header {
  text-align: center;
  margin-bottom: 2rem;
}

.demo-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.demo-subtitle {
  color: #64748b;
  font-size: 1.125rem;
}

.demo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.demo-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.1);
  overflow: hidden;
}

.demo-card.optimized {
  border-color: #10b981;
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
}

.demo-card.optimized .card-header {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-bottom-color: rgba(16, 185, 129, 0.1);
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.performance-indicator {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  background: #e2e8f0;
  color: #64748b;
}

.performance-indicator.slow {
  background: #fef2f2;
  color: #dc2626;
}

.performance-indicator.fast {
  background: #f0fdf4;
  color: #16a34a;
}

.demo-content {
  padding: 1.5rem;
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.demo-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.demo-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat {
  text-align: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.results {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
}

.result-item {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
  color: #374151;
}

.result-item:last-child {
  border-bottom: none;
}

.performance-comparison {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.performance-comparison h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.comparison-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.comparison-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.comparison-label {
  min-width: 120px;
  font-weight: 500;
  color: #374151;
}

.comparison-bar {
  flex: 1;
  display: flex;
  gap: 0.5rem;
  height: 2rem;
  border-radius: 0.5rem;
  overflow: hidden;
}

.bar {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
  min-width: 2rem;
}

.bar.normal {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.bar.optimized {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.technical-details {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.technical-details h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.improvements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.improvement {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
}

.improvement-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.improvement-content h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.improvement-content p {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.5;
}

/* Dark theme support */
:root.dark .reactivity-demo {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

:root.dark .demo-title {
  color: #e2e8f0;
}

:root.dark .demo-subtitle {
  color: #94a3b8;
}

:root.dark .demo-card {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(148, 163, 184, 0.1);
}

:root.dark .demo-card.optimized {
  border-color: rgba(16, 185, 129, 0.2);
}

:root.dark .card-header {
  background: linear-gradient(135deg, rgba(51, 65, 85, 0.8) 0%, rgba(71, 85, 105, 0.8) 100%);
  border-bottom-color: rgba(148, 163, 184, 0.1);
}

:root.dark .demo-card.optimized .card-header {
  background: linear-gradient(135deg, rgba(6, 78, 59, 0.8) 0%, rgba(4, 120, 87, 0.8) 100%);
  border-bottom-color: rgba(16, 185, 129, 0.1);
}

:root.dark .card-header h3 {
  color: #e2e8f0;
}

:root.dark .performance-indicator {
  background: rgba(51, 65, 85, 0.8);
  color: #94a3b8;
}

:root.dark .input-group label {
  color: #e2e8f0;
}

:root.dark .demo-input {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(148, 163, 184, 0.2);
  color: #e2e8f0;
}

:root.dark .demo-input:focus {
  border-color: #3b82f6;
}

:root.dark .stat {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(148, 163, 184, 0.1);
}

:root.dark .stat-label {
  color: #94a3b8;
}

:root.dark .stat-value {
  color: #e2e8f0;
}

:root.dark .results {
  border-color: rgba(148, 163, 184, 0.1);
}

:root.dark .result-item {
  border-bottom-color: rgba(148, 163, 184, 0.1);
  color: #e2e8f0;
}

:root.dark .performance-comparison,
:root.dark .technical-details {
  background: rgba(30, 41, 59, 0.8);
}

:root.dark .performance-comparison h3,
:root.dark .technical-details h3 {
  color: #e2e8f0;
}

:root.dark .comparison-label {
  color: #e2e8f0;
}

:root.dark .improvement {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(148, 163, 184, 0.1);
}

:root.dark .improvement-content h4 {
  color: #e2e8f0;
}

:root.dark .improvement-content p {
  color: #94a3b8;
}
</style>
