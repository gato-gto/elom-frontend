<template>
  <div class="card bg-base-100 shadow-sm border mobile-card p-4">
    <!-- Заголовок с бейджем -->
    <div class="flex items-start justify-between mb-3">
      <h3 class="card-title text-base leading-tight flex-1 min-w-0">{{ title }}</h3>
      <div v-if="badge" class="badge flex-shrink-0 ml-2" :class="badgeClass">{{ badge }}</div>
    </div>

    <!-- Слот для основного контента -->
    <div class="mobile-card-content">
      <slot name="content"/>
    </div>

    <!-- Дополнительная информация (опционально) -->
    <div v-if="$slots.extra" class="mobile-card-extra mt-3 pt-3 border-t border-base-300">
      <slot name="extra"/>
    </div>

    <!-- Действия -->
      <div v-if="actions && actions.length > 0" class="card-actions justify-end mt-4">
        <button v-for="action in actions" :key="action.key" class="btn btn-sm" :class="action.class || 'btn-outline'" :disabled="action.disabled" :title="action.tooltip" @click="$emit('action', action.key)">
          <component :is="action.icon" v-if="action.icon" class="w-4 h-4 mr-1"/>
          <span>{{ action.label }}</span>
        </button>
      </div>

    <!-- Альтернативные действия (dropdown для экономии места) -->
    <div v-else-if="dropdownActions && dropdownActions.length > 0" class="card-actions justify-end mt-4">
      <div class="dropdown dropdown-top dropdown-end">
        <label tabindex="0" class="btn btn-sm btn-outline">
          Действия
          <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </label>
        <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
          <li v-for="action in dropdownActions" :key="action.key">
            <a :class="{ 'disabled': action.disabled }" @click="!action.disabled && $emit('action', action.key)">
              <component :is="action.icon" v-if="action.icon" class="w-4 h-4"/>
              {{ action.label }}
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface CardAction {
  key: string
  label: string
  shortLabel?: string // Короткая версия для мобильных
  icon?: any
  class?: string
  disabled?: boolean
  tooltip?: string
}

interface Props {
  title: string
  subtitle?: string
  badge?: string
  badgeClass?: string
  actions?: CardAction[]
  dropdownActions?: CardAction[] // Альтернатива для экономии места
}

interface Emits {
  (e: 'action', action: string): void
}

withDefaults(defineProps<Props>(), {
  badgeClass: 'badge-neutral'
})

defineEmits<Emits>()
</script>

<style scoped>
.mobile-card {
  /* Небольшое увеличение при наведении */
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.mobile-card:hover {
  transform: translateY(-1px);
}

.mobile-card-content {
  /* Стили для контентной области */
  font-size: 0.875rem; /* text-sm */
}

/* Адаптивность кнопок действий */
@media (max-width: 640px) {
  .btn-group .btn {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
}
</style>