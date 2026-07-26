<template>
  <div class="filter-panel">
    <!-- F-585: на мобиле шапка сворачивает фильтры (иначе панель съедала весь первый экран до
         данных). На десктопе всегда развёрнуто, шапка не интерактивна. -->
    <div
      class="filter-header"
      :class="{ 'filter-header-toggle': true }"
      role="button"
      :aria-expanded="!collapsed"
      tabindex="0"
      @click="toggle"
      @keydown.enter.prevent="toggle"
      @keydown.space.prevent="toggle"
    >
      <h2 class="filter-title">
        <svg class="filter-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Фильтры и поиск
      </h2>
      <svg class="filter-chevron" :class="{ 'filter-chevron-open': !collapsed }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    <div v-show="!collapsed" class="filter-content">
      <div class="filter-grid" :class="gridClass">
        <slot />
      </div>
      
      <div class="filter-actions">
        <button 
          class="filter-btn filter-btn-outline" 
          @click="$emit('reset')"
          :disabled="loading"
        >
          <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Сбросить фильтры
        </button>
        
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

interface Props {
  columns?: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  columns: 4,
  loading: false
})

// F-585: сворачиваемость фильтров ТОЛЬКО на мобиле (<768px). На десктопе всегда развёрнуто
// (mq не совпадает → collapsed=false, toggle игнорируется). Слушаем resize, чтобы при переходе
// mobile↔desktop состояние было корректным.
const collapsed = ref(false)
// ReturnType<typeof matchMedia> вместо голого MediaQueryList — no-undef в этой eslint-конфигурации
// не знает DOM-lib типы (TS их проверяет), а window — известный глобал.
let mq: ReturnType<typeof window.matchMedia> | null = null
function applyMq() {
  if (mq) { collapsed.value = mq.matches }
}
function toggle() {
  if (mq && mq.matches) { collapsed.value = !collapsed.value }
}
onMounted(() => {
  mq = window.matchMedia('(max-width: 767px)')
  applyMq()
  mq.addEventListener('change', applyMq)
})
onUnmounted(() => {
  mq?.removeEventListener('change', applyMq)
})

const gridClass = computed(() => {
  const cols = props.columns
  if (cols === 1) { return 'filter-grid-1' }
  if (cols === 2) { return 'filter-grid-2' }
  if (cols === 3) { return 'filter-grid-3' }
  if (cols === 4) { return 'filter-grid-4' }
  if (cols === 5) { return 'filter-grid-5' }
  if (cols === 6) { return 'filter-grid-6' }
  return 'filter-grid-4'
})
</script>

<style scoped>
.filter-panel {
  background: hsl(var(--b1));
  border: 1px solid hsl(var(--b3));
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px rgba(14, 20, 23, 0.06);
  overflow: hidden;
  position: relative;
}

.filter-header {
  background: hsl(var(--b2));
  border-bottom: 1px solid hsl(var(--b3));
  padding: 0.625rem 0.75rem;
}

@media (min-width: 768px) {
  .filter-header {
    padding: 1rem 1.5rem;
  }
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: hsl(var(--bc));
  margin: 0;
}

@media (min-width: 768px) {
  .filter-title {
    gap: 0.75rem;
    font-size: 1.125rem;
  }
}

.filter-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: hsl(var(--p));
}

/* F-585: шапка-переключатель. Десктоп — не интерактивна (курсор обычный, шеврон скрыт). */
.filter-header-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  cursor: default;
  user-select: none;
}
.filter-header-toggle:focus-visible {
  outline: 2px solid hsl(var(--p) / 0.5);
  outline-offset: -2px;
}
.filter-chevron {
  width: 1.25rem;
  height: 1.25rem;
  color: hsl(var(--tx-2));
  flex-shrink: 0;
  transition: transform 0.2s ease;
  display: none;
}
.filter-chevron-open {
  transform: rotate(180deg);
}
@media (max-width: 767px) {
  .filter-header-toggle {
    cursor: pointer;
  }
  .filter-chevron {
    display: block;
  }
}

.filter-content {
  padding: 0.75rem;
}

@media (min-width: 768px) {
  .filter-content {
    padding: 1.5rem;
  }
}

.filter-grid {
  display: grid;
  gap: 0.5rem;
}

@media (min-width: 768px) {
  .filter-grid {
    gap: 1rem;
  }
}

.filter-grid-1 {
  grid-template-columns: 1fr;
}

.filter-grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.filter-grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.filter-grid-4 {
  grid-template-columns: repeat(4, 1fr);
}

.filter-grid-5 {
  grid-template-columns: repeat(5, 1fr);
}

.filter-grid-6 {
  grid-template-columns: repeat(6, 1fr);
}

@media (max-width: 1024px) {
  .filter-grid-4,
  .filter-grid-5,
  .filter-grid-6 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .filter-grid-2,
  .filter-grid-3,
  .filter-grid-4,
  .filter-grid-5,
  .filter-grid-6 {
    grid-template-columns: 1fr;
  }
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid hsl(var(--b3));
}

@media (min-width: 768px) {
  .filter-actions {
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
  }
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  cursor: pointer;
  border: none;
  position: relative;
}

.filter-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.filter-btn-primary {
  background: hsl(var(--p));
  color: hsl(var(--pc));
  box-shadow: 0 1px 2px rgba(14, 20, 23, 0.06);
}

.filter-btn-primary:hover:not(:disabled) {
  background: color-mix(in oklab, hsl(var(--p)) 88%, black);
}

.filter-btn-outline {
  background: transparent;
  color: hsl(var(--tx-2));
  border: 1px solid hsl(var(--b3));
}

.filter-btn-outline:hover:not(:disabled) {
  background: hsl(var(--b2));
  color: hsl(var(--p));
  border-color: hsl(var(--p));
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}
</style>
