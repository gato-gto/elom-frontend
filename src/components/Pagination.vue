<template>
  <div v-if="totalPages > 1" class="flex justify-center">
    <div class="btn-group">
      <button
        class="btn btn-sm"
        :disabled="currentPage === 1"
        @click="goToPage(1)"
      >
        ««
      </button>
      <button
        class="btn btn-sm"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
      >
        «
      </button>
      
      <template v-for="page in visiblePages" :key="page">
        <button
          v-if="page !== '...'"
          class="btn btn-sm"
          :class="{ 'btn-active': page === currentPage }"
          @click="goToPage(page as number)"
        >
          {{ page }}
        </button>
        <span v-else class="btn btn-sm btn-disabled">...</span>
      </template>
      
      <button
        class="btn btn-sm"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
      >
        »
      </button>
      <button
        class="btn btn-sm"
        :disabled="currentPage === totalPages"
        @click="goToPage(totalPages)"
      >
        »»
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  currentPage: number
  totalPages: number
  maxVisible?: number
}

interface Emits {
  (e: 'page-change', page: number): void
}

const props = withDefaults(defineProps<Props>(), {
  maxVisible: 5
})

const emit = defineEmits<Emits>()

const visiblePages = computed(() => {
  const { currentPage, totalPages, maxVisible } = props
  const pages: (number | string)[] = []
  
  if (totalPages <= maxVisible) {
    // Показываем все страницы
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    // Показываем страницы с многоточием
    const half = Math.floor(maxVisible / 2)
    let start = Math.max(1, currentPage - half)
    const end = Math.min(totalPages, start + maxVisible - 1)
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    
    if (start > 1) {
      pages.push(1)
      if (start > 2) {
        pages.push('...')
      }
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...')
      }
      pages.push(totalPages)
    }
  }
  
  return pages
})

const goToPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page)
  }
}
</script>
