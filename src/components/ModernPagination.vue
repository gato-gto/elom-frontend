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
  actualItemsCount?: number // Фактическое количество элементов на текущей странице
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
  // Если указано фактическое количество элементов, используем его
  if (props.actualItemsCount !== undefined) {
    const calculatedEnd = (props.currentPage - 1) * props.pageSize + props.actualItemsCount
    return Math.min(calculatedEnd, props.totalItems)
  }
  // Иначе используем расчетное значение
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
  gap: 0.5rem;
  padding: 0.75rem;
  background: hsl(var(--b2));
  border: 1px solid hsl(var(--b3));
  border-radius: 0.375rem;
  /* Отступ снизу для мобильной навигации */
  margin-bottom: 6rem;
}

@media (min-width: 1024px) {
  .modern-pagination-container {
    margin-bottom: 0;
  }
}

@media (min-width: 768px) {
  .modern-pagination-container {
    gap: 1rem;
    padding: 1.5rem;
  }
}

.pagination-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

@media (min-width: 768px) {
  .pagination-info {
    gap: 1rem;
  }
}

.pagination-stats {
  color: hsl(var(--tx-2));
  font-size: 0.875rem;
  font-weight: 500;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
}

.pagination-size-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.size-label {
  color: hsl(var(--tx-2));
  font-size: 0.875rem;
  font-weight: 500;
}

.size-select {
  padding: 0.375rem 0.75rem;
  border: 1px solid hsl(var(--b3));
  border-radius: 0.25rem;
  background: hsl(var(--b1));
  color: hsl(var(--bc));
  font-size: 0.875rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.size-select:focus {
  outline: none;
  border-color: hsl(var(--p));
  box-shadow: 0 0 0 2px hsl(var(--p) / 0.3);
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
  border-radius: 0.25rem;
  border: 1px solid hsl(var(--b3));
  background: hsl(var(--b1));
  color: hsl(var(--tx-2));
  font-size: 0.875rem;
  font-weight: 500;
  /* page numbers are DATA → monospace */
  font-family: var(--font-mono, ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  cursor: pointer;
  text-decoration: none;
}

.pagination-btn:hover:not(:disabled) {
  background: hsl(var(--p));
  color: hsl(var(--pc));
  border-color: hsl(var(--p));
}

.pagination-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
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
  background: hsl(var(--p));
  color: hsl(var(--pc));
  border-color: hsl(var(--p));
  box-shadow: 0 1px 2px rgba(14, 20, 23, 0.06);
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
  color: hsl(var(--tx-3));
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
  color: hsl(var(--tx-2));
  font-size: 0.875rem;
  font-weight: 500;
}

.jump-input {
  width: 4rem;
  padding: 0.375rem 0.5rem;
  border: 1px solid hsl(var(--b3));
  border-radius: 0.25rem;
  background: hsl(var(--b1));
  color: hsl(var(--bc));
  font-size: 0.875rem;
  text-align: center;
  font-family: var(--font-mono, ui-monospace, monospace);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.jump-input:focus {
  outline: none;
  border-color: hsl(var(--p));
  box-shadow: 0 0 0 2px hsl(var(--p) / 0.3);
}

/* Тёмная тема наследуется через токены (--b1/--b2/--b3/--bc/--p) —
   отдельные :root.dark переопределения больше не нужны. */

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
