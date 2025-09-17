<template>
  <button
    class="btn btn-outline btn-sm"
    :class="{ 'loading': loading }"
    :disabled="loading || disabled"
    @click="handleExport"
  >
    <svg
      v-if="!loading"
      class="w-4 h-4 mr-2"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
    <span v-if="!loading">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  label?: string
  format?: 'xlsx' | 'pdf' | 'csv'
  loading?: boolean
  disabled?: boolean
}

interface Emits {
  (e: 'export', format: string): void
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Экспорт',
  format: 'xlsx',
  loading: false,
  disabled: false
})

const emit = defineEmits<Emits>()

const handleExport = () => {
  emit('export', props.format)
}
</script>


