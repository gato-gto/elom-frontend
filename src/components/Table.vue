<template>
  <div class="overflow-auto border rounded-xl">
    <table class="table table-zebra w-full">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            class="bg-gray-50"
            :class="column.class"
          >
            <div class="flex items-center gap-2">
              <span>{{ column.title }}</span>
              <button
                v-if="column.sortable"
                class="btn btn-ghost btn-xs"
                @click="handleSort(column.key)"
              >
                <svg
                  class="w-3 h-3"
                  :class="{
                    'opacity-50': sortBy !== column.key,
                    'rotate-180': sortBy === column.key && sortOrder === 'desc'
                  }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </button>
            </div>
          </th>
          <th v-if="actions.length > 0" class="bg-gray-50">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length + (actions.length > 0 ? 1 : 0)" class="text-center py-8">
            <div class="loading loading-spinner loading-md"></div>
          </td>
        </tr>
        <tr v-else-if="data.length === 0">
          <td :colspan="columns.length + (actions.length > 0 ? 1 : 0)" class="text-center py-8 text-gray-700-60">
            {{ emptyText }}
          </td>
        </tr>
        <tr v-else v-for="(row, index) in data" :key="getRowKey(row, index)">
          <td
            v-for="column in columns"
            :key="column.key"
            :class="column.class"
          >
            <slot
              :name="`cell-${column.key}`"
              :row="row"
              :value="getNestedValue(row, column.key)"
              :index="index"
            >
              {{ formatValue(getNestedValue(row, column.key), column) }}
            </slot>
          </td>
          <td v-if="actions.length > 0">
            <div class="flex gap-1">
              <button
                v-for="action in actions"
                :key="action.key"
                class="btn btn-ghost btn-xs"
                :class="action.class"
                :disabled="action.disabled?.(row)"
                @click="handleAction(action.key, row)"
              >
                <component :is="action.icon" v-if="action.icon" class="w-3 h-3" />
                {{ action.label }}
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
// import { computed } from 'vue' // Не используется

interface Column {
  key: string
  title: string
  sortable?: boolean
  class?: string
  formatter?: (value: any) => string
}

interface Action {
  key: string
  label: string
  icon?: any
  class?: string
  disabled?: (row: any) => boolean
}

interface Props {
  data: any[]
  columns: Column[]
  actions?: Action[]
  loading?: boolean
  emptyText?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface Emits {
  (e: 'sort', key: string): void
  (e: 'action', action: string, row: any): void
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  columns: () => [],
  actions: () => [],
  loading: false,
  emptyText: 'Нет данных',
  sortBy: '',
  sortOrder: 'asc'
})
void props

const emit = defineEmits<Emits>()

const getRowKey = (row: any, index: number) => {
  return row.id || row.key || index
}

const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

const formatValue = (value: any, column: Column) => {
  if (column.formatter) {
    return column.formatter(value)
  }
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'boolean') {
    return value ? 'Да' : 'Нет'
  }
  return String(value)
}

const handleSort = (key: string) => {
  emit('sort', key)
}

const handleAction = (action: string, row: any) => {
  emit('action', action, row)
}
</script>


