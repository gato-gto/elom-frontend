<template>
  <!-- F-860: было .dropdown с триггером <div tabindex role=button> (CSS focus-метод). На клик он не
       фокусировался надёжно (iOS Safari не фокусит non-form div; на desktop родительский .dropdown
       перехватывал pointer-events) → меню НЕ открывалось = «кнопка не нажимается». Перешли на
       нативный <details>/<summary> (DaisyUI v5 его поддерживает: :not(details,…) в hide-правиле) —
       переключается по клику/тапу на всех устройствах и с клавиатуры, без зависимости от focus. -->
  <details ref="dd" class="dropdown dropdown-end w-full md:w-auto">
    <summary
      class="export-trigger btn btn-outline btn-sm w-full md:w-auto"
      :class="{ 'btn-disabled': loading }"
      @click="onToggle"
    >
      <svg v-if="loading" class="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <svg v-else class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span class="hidden md:inline">{{ loading ? 'Экспорт...' : 'Экспорт' }}</span>
      <span class="md:hidden text-xs">{{ loading ? '...' : 'Экспорт' }}</span>
    </summary>

    <ul class="dropdown-content menu p-2 shadow rounded-box w-52 z-50">
      <li>
        <button class="flex items-center" @click="pick('csv')" :disabled="loading">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          CSV файл
        </button>
      </li>
      <li>
        <button class="flex items-center" @click="pick('excel')" :disabled="loading">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Excel файл
        </button>
      </li>
      <li>
        <button class="flex items-center" @click="pick('pdf')" :disabled="loading">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          PDF файл
        </button>
      </li>
    </ul>
  </details>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  data?: any[]
  filename?: string
  loading?: boolean
}>(), {
  data: () => [],
  filename: 'export',
  loading: false
})

const emit = defineEmits<{
  (e: 'export', format: 'csv' | 'excel' | 'pdf'): void
}>()

const dd = ref<HTMLElement>()

// Пока идёт экспорт — не даём открывать меню (штатный disabled-паттерн; у <summary> нет native disabled).
function onToggle(e: MouseEvent) {
  if (props.loading) { e.preventDefault() }
}

function pick(format: 'csv' | 'excel' | 'pdf') {
  dd.value?.removeAttribute('open')  // закрываем <details> после выбора формата
  emit('export', format)
}
</script>

<style scoped>
/* Убираем нативный маркер disclosure у <summary>, чтобы кнопка выглядела как обычный btn. */
.export-trigger {
  list-style: none;
}
.export-trigger::-webkit-details-marker {
  display: none;
}

/* H-1 (F-588): btn-outline без --btn-fg рендерил «Экспорт» невидимым (контраст ~1.0 в обеих темах).
   Явный читаемый base-content + рамка по дизайн-языку (steel/graphite), copper на ховере. */
.export-trigger:not(.btn-disabled) {
  color: hsl(var(--bc)) !important;
  border-color: hsl(var(--bc) / 0.28) !important;
  background-color: transparent;
}
.export-trigger:not(.btn-disabled):hover {
  color: hsl(var(--p)) !important;
  border-color: hsl(var(--p)) !important;
  background-color: hsl(var(--bc) / 0.06) !important;
}
</style>
