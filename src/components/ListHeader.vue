<template>
  <div class="list-header">
    <div class="header-content">
      <div class="header-title-section">
        <h1 class="list-title">
          <svg v-if="icon" class="title-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconPath(icon)" />
          </svg>
          {{ title }}
        </h1>
        <p v-if="subtitle" class="list-subtitle">{{ subtitle }}</p>
      </div>
      
      <div class="header-actions">
        <slot name="actions" />
        
        <!-- Стандартная кнопка "Добавить" - скрыта на мобильных, если есть кастомные actions -->
        <button
          v-if="showCreate && canCreate"
          class="action-btn action-btn-primary hidden md:flex"
          @click="$emit('create')"
          :disabled="loading"
        >
          <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>{{ createText }}</span>
        </button>
      </div>
    </div>
    
    <div v-if="showStats" class="header-stats">
      <div class="stat-item">
        <span class="stat-label">Всего записей:</span>
        <span class="stat-value">{{ totalCount }}</span>
      </div>
      <div v-if="filteredCount !== totalCount" class="stat-item">
        <span class="stat-label">На странице:</span>
        <span class="stat-value">{{ filteredCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getIconPath } from '@/assets/icons'

interface Props {
  title: string
  subtitle?: string
  icon?: string
  showCreate?: boolean
  createText?: string
  canCreate?: boolean
  loading?: boolean
  showStats?: boolean
  totalCount?: number
  filteredCount?: number
}

withDefaults(defineProps<Props>(), {
  showCreate: true,
  createText: 'Добавить',
  canCreate: true,
  loading: false,
  showStats: false,
  totalCount: 0,
  filteredCount: 0
})

defineEmits<{
  create: []
}>()
</script>

<style scoped>
.list-header {
  background: hsl(var(--b1));
  border: 1px solid hsl(var(--b3));
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px rgba(14, 20, 23, 0.06);
  /* F-864: было `overflow: hidden` (нужно лишь чтобы скруглить ::before top-rule по углам хедера) —
     но оно ОБРЕЗАЛО выпадающее меню экспорта (.dropdown-content выходит за нижнюю границу хедера,
     часть пунктов пряталась). Скругляем ::before напрямую, а overflow оставляем visible. */
  position: relative;
}

/* copper top-rule — the one accent, spent with restraint */
.list-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: hsl(var(--p));
  /* F-864: скругляем сам top-rule (раньше это делал parent overflow:hidden, теперь его нет). */
  border-top-left-radius: 0.375rem;
  border-top-right-radius: 0.375rem;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .header-content {
    padding: 1.5rem;
    gap: 1rem;
  }
}

.header-title-section {
  flex: 1;
  min-width: 0;
}

.list-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: hsl(var(--bc));
  margin: 0;
  line-height: 1.2;
}

.title-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: hsl(var(--p));
  flex-shrink: 0;
}

.list-subtitle {
  margin: 0.5rem 0 0 0;
  color: hsl(var(--tx-2));
  font-size: 0.875rem;
  line-height: 1.4;
}

/* Мобильная адаптивность - оптимизированные отступы */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
    padding: 0.75rem;
    gap: 0.5rem;
  }
  
  .header-title-section {
    width: 100%;
  }
  
  .list-title {
    font-size: 1.125rem;
    gap: 0.375rem;
    flex-wrap: wrap;
  }
  
  .title-icon {
    width: 1.125rem;
    height: 1.125rem;
  }
  
  .list-subtitle {
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
  
  .header-actions {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.375rem;
    width: 100%;
    justify-content: flex-start;
  }
  
  .action-btn {
    flex: 1 1 auto;
    min-width: fit-content;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
  
  .header-stats {
    flex-direction: row;
    flex-wrap: wrap;
    padding: 0.5rem 0.75rem;
    gap: 0.75rem;
  }
  
  .stat-item {
    flex: 1 1 auto;
    min-width: fit-content;
    gap: 0.375rem;
  }
  
  .stat-label {
    font-size: 0.75rem;
  }
  
  .stat-value {
    font-size: 0.75rem;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.action-btn {
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
  text-decoration: none;
}

/* A-06 (F-520): тач-цель ≥44pt (Apple HIG). Глобальное правило перебивалось scoped-селектором. */
@media (pointer: coarse) {
  .action-btn {
    min-height: 44px;
  }
}

.action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.action-btn-primary {
  background: hsl(var(--p));
  color: hsl(var(--pc));
  box-shadow: 0 1px 2px rgba(14, 20, 23, 0.06);
}

.action-btn-primary:hover:not(:disabled) {
  background: color-mix(in oklab, hsl(var(--p)) 88%, black);
}

.action-btn-outline {
  background: transparent;
  color: hsl(var(--tx-2));
  border: 1px solid hsl(var(--b3));
}

.action-btn-outline:hover:not(:disabled) {
  background: hsl(var(--b2));
  color: hsl(var(--p));
  border-color: hsl(var(--p));
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

.header-stats {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  background: hsl(var(--b2));
  border-top: 1px solid hsl(var(--b3));
}

@media (min-width: 768px) {
  .header-stats {
    gap: 2rem;
    padding: 1rem 1.5rem;
  }
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: hsl(var(--tx-2));
  font-weight: 500;
}

/* stat value is DATA → monospace, per the design language */
.stat-value {
  font-size: 0.875rem;
  color: hsl(var(--p-text)); /* H-2 (F-591): читаемая медь на тёмном (было hsl(var(--p)) = 3.51:1) */
  font-weight: 600;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
}

/* Дополнительные стили для очень маленьких экранов */
@media (max-width: 480px) {
  .header-content {
    padding: 0.5rem;
    gap: 0.375rem;
  }
  
  .list-title {
    font-size: 1rem;
    gap: 0.25rem;
  }
  
  .title-icon {
    width: 1rem;
    height: 1rem;
  }
  
  .list-subtitle {
    font-size: 0.6875rem;
    margin-top: 0.125rem;
  }
  
  .header-actions {
    gap: 0.25rem;
  }
  
  .action-btn {
    padding: 0.4375rem 0.625rem;
    font-size: 0.75rem; /* F-865 (mobile-audit): было 0.6875rem (11px) — CTA-лейбл читаемее */
    min-height: 44px; /* A-06 (F-520): тач-цель ≥44pt (было 2.5rem=40px, перебивало coarse-правило) */
  }
  
  .header-stats {
    padding: 0.4375rem 0.5rem;
    gap: 0.5rem;
  }
  
  .stat-item {
    gap: 0.25rem;
  }
  
  .stat-label,
  .stat-value {
    font-size: 0.75rem; /* F-865 (mobile-audit): было 0.6875rem (11px) — числа записей = данные */
  }
}
</style>
