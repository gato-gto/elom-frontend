<template>
  <div class="relative">
    <button 
      class="btn btn-outline btn-sm"
      :class="{ 'btn-disabled': loading }"
      @click="toggleDropdown"
      :disabled="loading"
    >
      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {{ loading ? 'Экспорт...' : 'Экспорт' }}
    </button>

    <!-- Dropdown menu -->
    <div 
      v-if="showDropdown" 
      class="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
    >
      <div class="py-1">
        <button 
          class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          @click="exportToCSV"
          :disabled="loading"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          CSV файл
        </button>
        
        <button 
          class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          @click="exportToExcel"
          :disabled="loading"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Excel файл
        </button>
        
        <button 
          class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          @click="exportToPDF"
          :disabled="loading"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          PDF файл
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  data: any[]
  filename?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'export', format: 'csv' | 'excel' | 'pdf'): void
}>()

const showDropdown = ref(false)

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function exportToCSV() {
  showDropdown.value = false
  emit('export', 'csv')
}

function exportToExcel() {
  showDropdown.value = false
  emit('export', 'excel')
}

function exportToPDF() {
  showDropdown.value = false
  emit('export', 'pdf')
}

// Close dropdown when clicking outside
function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showDropdown.value = false
  }
}

// Add event listener when component mounts
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>