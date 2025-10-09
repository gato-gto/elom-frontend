<template>
  <div class="list-container">
    <!-- Header -->
    <ListHeader
      :title="config.title"
      :subtitle="config.subtitle"
      :icon="config.icon"
      :show-create="config.showCreate"
      :create-text="config.createText"
      :can-create="config.canCreate"
      :loading="store.loading"
      :show-stats="config.showStats"
      :total-count="store.pagination?.count || 0"
      :filtered-count="store.items?.length || 0"
      @create="$emit('create')"
    >
      <template #actions>
        <ExportButton 
          v-if="config.exportable"
          :data="store.items"
          :filename="config.exportFilename"
          :loading="store.loading"
          @export="handleExport"
        />
        <slot name="header-actions" />
      </template>
    </ListHeader>

    <!-- Filters -->
    <FilterPanel
      v-if="config.filters && config.filters.length > 0"
      :columns="config.filterColumns || 3"
      :loading="store.loading"
      @reset="handleResetFilters"
    >
      <FilterField
        v-for="filter in config.filters"
        :key="filter.key"
        :model-value="store.filters?.[filter.key] || ''"
        :type="filter.type"
        :label="filter.label"
        :placeholder="filter.placeholder"
        :options="filter.options"
        :required="filter.required"
        @update:model-value="(value) => updateFilter(filter.key, value)"
      />
    </FilterPanel>

    <!-- Error message -->
    <div v-if="store.error" class="alert alert-error">
      <span>{{ store.error }}</span>
      <button class="btn btn-sm btn-ghost" @click="store.clearError()">×</button>
    </div>

    <!-- Table/Cards -->
    <div class="list-content" :class="{ 'relative': store.loading }">
      <!-- Loading Overlay -->
      <LoadingSpinner 
        v-if="store.loading && store.items.length === 0"
        size="lg"
        variant="primary"
        :text="config.loadingText || 'Загрузка данных...'"
        :overlay="false"
      />
      
      <!-- Loading Skeleton for existing data -->
      <div v-if="store.loading && store.items.length > 0" class="loading-overlay">
        <LoadingSpinner 
          size="md"
          variant="primary"
          text="Обновление данных..."
          :overlay="true"
        />
      </div>

      <!-- Desktop: Table View -->
      <div v-if="!isMobile" class="table-container desktop-only">
        <table class="modern-table" role="table" aria-label="Data table">
          <thead>
            <tr>
              <th 
                v-for="column in config.columns" 
                :key="column.key"
                :class="[
                  'cursor-pointer hover:bg-gray-50',
                  column.sortable !== false ? '' : 'cursor-default'
                ]"
                @click="column.sortable !== false ? handleSort(column.key) : null"
              >
                {{ column.label }}
                <span v-if="column.sortable !== false && sortBy === column.key" class="ml-1">
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th v-if="config.actions && config.actions.length > 0" class="text-right">Действия</th>
            </tr>
          </thead>
          
          <!-- Skeleton Loading -->
          <TableSkeleton 
            v-if="store.loading && store.items.length === 0"
            :rows="store.pagination.pageSize"
            :columns="config.columns.length + (config.actions ? 1 : 0)"
          />
          
          <!-- Actual Data -->
          <tbody v-else>
            <template v-for="item in store.items" :key="item.id">
              <tr class="table-row">
                <td v-for="column in config.columns" :key="column.key">
                  <slot 
                    :name="`column-${column.key}`" 
                    :item="item" 
                    :value="getColumnValue(item, column)"
                  >
                    <component 
                      v-if="column.component"
                      :is="column.component"
                      :item="item"
                      :value="getColumnValue(item, column)"
                    />
                        <span v-else>{{ formatColumnValue(getColumnValue(item, column), column, item) }}</span>
                  </slot>
                </td>
                <td v-if="config.actions && config.actions.length > 0" class="text-right">
                  <div class="flex gap-1 justify-end">
                    <button 
                      v-for="action in config.actions"
                      :key="action.key"
                      :class="[
                        'btn btn-xs',
                        action.class || 'btn-outline',
                        action.disabled && action.disabled(item) ? 'btn-disabled' : ''
                      ]"
                      :disabled="action.disabled && action.disabled(item)"
                      @click="handleAction(action.key, item)"
                    >
                      {{ action.label }}
                    </button>
                  </div>
                </td>
              </tr>
              <!-- Expanded row slot -->
              <slot name="row-expanded" :item="item" />
            </template>
            <tr v-if="!store.loading && store.items.length === 0">
              <td :colspan="config.columns.length + (config.actions ? 1 : 0)" class="text-center text-gray-500 py-8">
                <div class="flex flex-col items-center gap-2">
                  <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <span class="text-sm">{{ config.emptyText || 'Нет данных' }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Mobile: Cards View -->
      <div v-else class="mobile-cards-container mobile-only">
        <div v-if="store.items.length > 0" class="space-y-4">
          <component
            v-for="item in store.items"
            :key="item.id"
            :is="config.mobileCardComponent"
            v-bind="{[config.mobileCardProp || 'item']: item}" as any
            :actions="getCardActions(item)"
            @action="handleCardAction(item, $event)"
          />
        </div>
        
        <!-- Empty State для мобильных -->
        <div v-else class="flex flex-col items-center gap-4 py-12 text-center">
          <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-1">{{ config.emptyTitle || 'Нет данных' }}</h3>
            <p class="text-gray-500">{{ config.emptySubtitle || 'Создайте первый элемент для начала работы' }}</p>
          </div>
          <button 
            v-if="config.showCreate && config.canCreate" 
            class="btn btn-primary" 
            @click="$emit('create')"
          >
            {{ config.createText || 'Создать' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <ModernPagination
      :current-page="store.pagination.page"
      :total-pages="Math.ceil(store.pagination.count / store.pagination.pageSize)"
      :total-items="store.pagination.count"
      :page-size="store.pagination.pageSize"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { debounce } from '@/utils/debounce'
import { useResponsiveTable } from '@/composables/useResponsiveTable'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { exportToCSV, exportToExcel, exportToPDF, exportFromBackend } from '@/utils/export'
import type { 
  GenericListConfig, 
  ColumnConfig, 
  FilterConfig, 
  ActionConfig 
} from '@/types/generic'

// Components
import ListHeader from './ListHeader.vue'
import FilterPanel from './FilterPanel.vue'
import FilterField from './FilterField.vue'
import ModernPagination from './ModernPagination.vue'
import LoadingSpinner from './LoadingSpinner.vue'
import ExportButton from './ExportButton.vue'
import TableSkeleton from './TableSkeleton.vue'

// Types imported from @/types/generic

// Props
interface Props {
  store: any // Store с методами fetchList, pagination, filters, etc.
  config: GenericListConfig
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  create: []
  action: [action: string, item: any]
  export: [format: 'csv' | 'excel' | 'pdf']
}>()

// Composables
const { isMobile } = useResponsiveTable()
const { handleLoadingError, handleExportError } = useErrorHandler()

// State
const sortBy = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')

// Methods
function getColumnValue(item: any, column: ColumnConfig) {
  if (column.path) {
    return column.path.split('.').reduce((obj, key) => obj?.[key], item)
  }
  return item[column.key]
}

function formatColumnValue(value: any, column: ColumnConfig, item: any) {
  if (column.formatter) {
    return column.formatter(value, item)
  }
  if (value === null || value === undefined) {
    return '—'
  }
  return String(value)
}

async function handleSort(key: string) {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }
  
  const ordering = sortOrder.value === 'desc' ? `-${key}` : key
  await props.store.setFilters({ ordering })
}

async function handlePageChange(page: number) {
  await props.store.setPage(page)
}

async function handlePageSizeChange(size: number) {
  await props.store.setPageSize(size)
}

function handleAction(action: string, item: any) {
  emit('action', action, item)
}

function getCardActions(item: any) {
  if (!props.config.actions) {return []}
  
  return props.config.actions.map(action => ({
    key: action.key,
    label: action.label,
    shortLabel: action.label.substring(0, 4),
    class: action.class || 'btn-outline',
    disabled: action.disabled ? action.disabled(item) : false
  }))
}

function handleCardAction(item: any, action: string) {
  handleAction(action, item)
}

async function handleExport(format: 'csv' | 'excel' | 'pdf') {
  try {
    const filename = `${props.config.exportFilename || 'data'}_${new Date().toISOString().split('T')[0]}`

    // Если есть backend URL для экспорта, используем его
    if (props.config.exportUrl && (format === 'excel' || format === 'pdf')) {
      const backendFormat = format === 'excel' ? 'xlsx' : 'pdf'
      await exportFromBackend(
        props.config.exportUrl,
        backendFormat,
        filename,
        props.store.filters
      )
    } else {
      // Fallback на локальный экспорт для CSV или если нет backend URL
      const data = props.store.items
      
      switch (format) {
        case 'csv':
          exportToCSV(data, filename)
          break
        case 'excel':
          exportToExcel(data, filename)
          break
        case 'pdf':
          exportToPDF(data, filename)
          break
      }
    }

    emit('export', format)
  } catch (error) {
    await handleExportError(error, props.config.title.toLowerCase())
  }
}

// Debounced search
const debouncedSearch = debounce(async () => {
  try {
    await props.store.fetchList()
  } catch (error) {
    await handleLoadingError(error, props.config.title.toLowerCase())
  }
}, 500)

// Update filter value
async function updateFilter(key: string, value: any) {
  await props.store.setFilters({ [key]: value })
}

// Reset filters
async function handleResetFilters() {
  await props.store.resetFilters()
}

// Watch for filter changes
watch(
  () => props.store.filters,
  () => {
    props.store.pagination.page = 1
    debouncedSearch()
  },
  { deep: true }
)



</script>

<style scoped>
/* Стили уже определены в глобальных CSS файлах */
</style>
