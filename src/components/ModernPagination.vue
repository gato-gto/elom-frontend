<template>
  <div v-if="totalPages > 1" class="modern-pagination-container">
    <!-- Информация о пагинации -->
    <div class="pagination-info">
      <span class="pagination-stats">
        Показано {{ startItem }}-{{ endItem }} из {{ totalItems }} записей
      </span>
    </div>

    <!-- Навигация по страницам -->
    <div class="pagination-nav">
      <!-- Первая страница -->
<!--      <button-->
<!--        class="pagination-btn pagination-btn-nav"-->
<!--        :disabled="currentPage === 1"-->
<!--        @click="goToPage(1)"-->
<!--        title="Первая страница"-->
<!--      >-->
<!--        <svg class="pagination-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">-->
<!--          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />-->
<!--        </svg>-->
<!--      </button>-->

      <!-- Предыдущая страница -->
<!--      <button-->
<!--        class="pagination-btn pagination-btn-nav"-->
<!--        :disabled="currentPage === 1"-->
<!--        @click="goToPage(currentPage - 1)"-->
<!--        title="Предыдущая страница"-->
<!--      >-->
<!--        <svg class="pagination-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">-->
<!--          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />-->
<!--        </svg>-->
<!--      </button>-->

      <!-- Номера страниц -->
      <div class="pagination-pages">
        <template v-for="page in visiblePages" :key="page">
          <button
            v-if="page !== '...'"
            class="pagination-btn pagination-btn-page"
            :class="{ 'pagination-btn-active': page === currentPage }"
            @click="goToPage(page as number)"
          >
            {{ page }}
          </button>
          <span v-else class="pagination-ellipsis">...</span>
        </template>
      </div>

      <!-- Следующая страница -->
<!--      <button-->
<!--        class="pagination-btn pagination-btn-nav"-->
<!--        :disabled="currentPage === totalPages"-->
<!--        @click="goToPage(currentPage + 1)"-->
<!--        title="Следующая страница"-->
<!--      >-->
<!--        <svg class="pagination-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">-->
<!--          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />-->
<!--        </svg>-->
<!--      </button>-->

      <!-- Последняя страница -->
<!--      <button-->
<!--        class="pagination-btn pagination-btn-nav"-->
<!--        :disabled="currentPage === totalPages"-->
<!--        @click="goToPage(totalPages)"-->
<!--        title="Последняя страница"-->
<!--      >-->
<!--        <svg class="pagination-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">-->
<!--          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />-->
<!--        </svg>-->
<!--      </button>-->
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  maxVisible?: number
  showPageSizeSelector?: boolean
  showJumpToPage?: boolean
}

interface Emits {
  (e: 'page-change', page: number): void
  (e: 'page-size-change', size: number): void
}

const props = withDefaults(defineProps<Props>(), {
  maxVisible: 5,
  showPageSizeSelector: true,
  showJumpToPage: true
})

const emit = defineEmits<Emits>()

const jumpPage = ref<number | null>(null)

// Вычисляемые свойства
const startItem = computed(() => {
  return (props.currentPage - 1) * props.pageSize + 1
})

const endItem = computed(() => {
  return Math.min(props.currentPage * props.pageSize, props.totalItems)
})

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

// Методы
const goToPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page)
  }
}

// const handlePageSizeChange = (event: Event) => { // Не используется
//   const target = event.target as HTMLSelectElement
//   const newSize = parseInt(target.value)
//   emit('page-size-change', newSize)
// }

// const handleJumpToPage = () => { // Не используется
//   if (jumpPage.value && jumpPage.value >= 1 && jumpPage.value <= props.totalPages) {
//     goToPage(jumpPage.value)
//     jumpPage.value = null
//   }
// }

// Сброс jumpPage при изменении текущей страницы
watch(() => props.currentPage, () => {
  jumpPage.value = null
})
</script>

<style scoped>
.modern-pagination-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 1rem 1rem;
}

.pagination-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.pagination-stats {
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
}

.pagination-size-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.size-label {
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
}

.size-select {
  padding: 0.375rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.size-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.pagination-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pagination-pages {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  text-decoration: none;
}

.pagination-btn:hover:not(:disabled) {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.pagination-btn-nav {
  width: 2.5rem;
  height: 2.5rem;
}

.pagination-btn-page {
  width: 2.5rem;
  height: 2.5rem;
}

.pagination-btn-active {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.pagination-btn-jump {
  padding: 0.5rem 1rem;
  height: auto;
}

.pagination-icon {
  width: 1rem;
  height: 1rem;
}

.pagination-ellipsis {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  color: #9ca3af;
  font-weight: 500;
}

.pagination-jump {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.jump-label {
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
}

.jump-input {
  width: 4rem;
  padding: 0.375rem 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  text-align: center;
  transition: all 0.2s ease;
}

.jump-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Темная тема */
:root.dark .modern-pagination-container {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.8) 100%);
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

:root.dark .pagination-stats,
:root.dark .size-label,
:root.dark .jump-label {
  color: #94a3b8;
}

:root.dark .size-select,
:root.dark .jump-input {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(148, 163, 184, 0.2);
  color: #e2e8f0;
}

:root.dark .pagination-btn {
  background: rgba(51, 65, 85, 0.8);
  border-color: rgba(148, 163, 184, 0.2);
  color: #94a3b8;
}

:root.dark .pagination-btn:hover:not(:disabled) {
  background: #60a5fa;
  color: white;
  border-color: #60a5fa;
}

:root.dark .pagination-btn-active {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  color: white;
  border-color: #60a5fa;
}

:root.dark .pagination-ellipsis {
  color: #6b7280;
}

/* Адаптивность */
@media (max-width: 768px) {
  .pagination-info {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .pagination-nav {
    gap: 0.25rem;
  }
  
  .pagination-btn-nav,
  .pagination-btn-page {
    width: 2rem;
    height: 2rem;
    font-size: 0.75rem;
  }
  
  .pagination-icon {
    width: 0.875rem;
    height: 0.875rem;
  }
  
  .pagination-jump {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
