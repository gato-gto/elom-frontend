<template>
  <div class="list-container">
    <!-- GenericList Component -->
    <GenericList
      :store="toolIssuesStore"
      :config="listConfig"
      @action="handleAction"
      @export="handleExport"
    >
      <!-- Custom column for tool (includes category, brand, and name) -->
      <template #column-tool_inventory_number="{ item, value }">
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2">
            <span class="font-mono font-bold text-primary break-words">{{ value }}</span>
          </div>
          <span class="font-medium break-words">
            {{ [
              item.tool_category?.split(',')[0]?.trim(),
              item.tool_brand,
              item.tool_name
            ].filter(Boolean).join(' ') }}
          </span>
        </div>
      </template>

      <!-- Custom column for issued_at -->
      <template #column-issued_at="{ item, value }">
        <div class="flex flex-col gap-0.5">
          <span class="text-sm font-medium">{{ formatDate(value) }}</span>
          <span class="text-xs text-base-content/60">{{ formatTime(value) }}</span>
        </div>
      </template>

      <!-- Custom column for return_date -->
      <template #column-return_date="{ item, value }">
        <div v-if="value" class="flex flex-col gap-0.5">
          <span class="text-sm font-medium">{{ formatDate(value) }}</span>
          <span class="text-xs text-base-content/60">{{ formatTime(value) }}</span>
        </div>
        <span v-else class="badge badge-warning badge-sm">Не возвращён</span>
      </template>

      <!-- Custom column for issue_condition -->
      <template #column-issue_condition="{ item, value }">
        <div class="badge badge-sm" :class="getConditionBadgeClass(value)">
          {{ item.issue_condition_display || getConditionDisplayName(value) }}
        </div>
      </template>

      <!-- Custom column for return_condition -->
      <template #column-return_condition="{ item, value }">
        <div v-if="value" class="badge badge-sm" :class="getConditionBadgeClass(value)">
          {{ item.return_condition_display || getConditionDisplayName(value) }}
        </div>
        <span v-else class="text-gray-400">—</span>
      </template>

      <!-- Custom column for status -->
      <template #column-is_open="{ item, value }">
        <div class="badge" :class="value ? 'badge-warning' : 'badge-success'">
          {{ value ? 'Активна' : 'Закрыта' }}
        </div>
      </template>
    </GenericList>

    <!-- Modal for returning tool -->
    <Modal v-model="returnModalOpen" title="Возврат инструмента" size="lg" :closable="true">
      <ToolReturnForm :issue="returningIssue" @saved="onReturnSaved" @cancel="returnModalOpen = false" />
    </Modal>

    <!-- Modal for viewing details -->
    <Modal v-model="detailsModalOpen" title="Детали выдачи" size="xl" :closable="true">
      <ToolIssueInfo :issue="viewingIssue" @close="detailsModalOpen = false" />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToolIssuesStore } from '@/stores/toolIssues'
import { useToolsStore } from '@/stores/tools'
import { useUiStore } from '@/stores/ui'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { usePermissions } from '@/composables/usePermissions'
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/export'
import { formatDate as formatDateUtil } from '@/utils/formatters'
import type { ToolIssue } from '@/api/types/tools'
import type { GenericListConfig } from '@/types/generic'
import Modal from '@/components/Modal.vue'
import ToolReturnForm from '../ToolReturnForm.vue'
import ToolIssueInfo from '../ToolIssueInfo.vue'
import GenericList from '@/components/GenericList.vue'
import ToolIssueCard from '@/components/cards/ToolIssueCard.vue'

// Stores
const toolIssuesStore = useToolIssuesStore()
const toolsStore = useToolsStore()
const ui = useUiStore()

// Error handling
const { handleLoadingError } = useErrorHandler()

// ✅ RBAC: проверка экспорта через permissions
const { canExportReports } = usePermissions()

// Modal state
const returnModalOpen = ref(false)
const returningIssue = ref<ToolIssue | null>(null)
const detailsModalOpen = ref(false)
const viewingIssue = ref<ToolIssue | null>(null)

// Filter options
const statusFilterOptions = computed(() => [
  { value: '', label: 'Все' },
  { value: 'true', label: 'Активные' },
  { value: 'false', label: 'Закрытые' }
])

// GenericList configuration
const listConfig = computed<GenericListConfig<ToolIssue>>(() => ({
  title: 'Выдачи инструментов',
  subtitle: 'Журнал выдач и возвратов инструментов',
  icon: 'assignment',
  showCreate: false,
  showStats: true,
  exportable: canExportReports.value, // ✅ RBAC: контроль экспорта через permissions
  exportFilename: 'tool_issues',
  exportUrl: '/api/v1/tool-issues/',
  loadingText: 'Загрузка выдач...',
  emptyText: 'Нет выдач',
  emptyTitle: 'Нет выдач',
  emptySubtitle: 'Выдайте инструмент со страницы "Инструменты"',
  filterColumns: 3,
  columns: [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'tool_inventory_number', label: 'Название', sortable: true, sortKey: 'tool__inventory_number' },
    { key: 'issued_to_name', label: 'Кому', sortable: true, sortKey: 'issued_to' },
    { key: 'issued_at', label: 'Дата выдачи', sortable: true },
    { key: 'return_date', label: 'Дата возврата', sortable: true },
    { key: 'issue_condition', label: 'Состояние (выдача)', sortable: true },
    { key: 'return_condition', label: 'Состояние (возврат)', sortable: true },
    { key: 'is_open', label: 'Статус', sortable: false }
  ],
  filters: [
    {
      key: 'search',
      type: 'text',
      label: 'Поиск',
      placeholder: 'Инв. номер, имя сотрудника...'
    },
    {
      key: 'is_open',
      type: 'select',
      label: 'Статус',
      options: statusFilterOptions.value
    }
  ],
  actions: [
    {
      key: 'return',
      label: 'Вернуть',
      class: 'btn-success btn-sm',
      disabled: (item: ToolIssue) => !item.is_open
    },
    {
      key: 'view',
      label: 'Детали',
      class: 'btn-outline btn-sm'
    }
  ],
  mobileCardComponent: ToolIssueCard,
  mobileCardProp: 'issue',
  defaultSort: '-issued_at',
  defaultSortOrder: 'desc'
}))

// Helper functions
function formatDate(dateStr: string | null): string {
  if (!dateStr) {return '—'}
  return formatDateUtil(dateStr)
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) {return ''}
  return new Date(dateStr).toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

function getConditionDisplayName(condition: string): string {
  const conditions: Record<string, string> = {
    'new': 'Новый',
    'good': 'Хорошее',
    'after_repair': 'После ремонта',
    'needs_repair': 'Требует ремонта',
    'broken': 'Сломан',
    'lost': 'Утерян'
  }
  return conditions[condition] || condition
}

function getConditionBadgeClass(condition: string): string {
  const badges: Record<string, string> = {
    'new': 'badge-success',
    'good': 'badge-info',
    'after_repair': 'badge-primary',
    'needs_repair': 'badge-warning',
    'broken': 'badge-error',
    'lost': 'badge-ghost'
  }
  return badges[condition] || 'badge-ghost'
}

// Methods
function openReturn(issue: ToolIssue) {
  returningIssue.value = issue
  returnModalOpen.value = true
}

function openDetails(issue: ToolIssue) {
  viewingIssue.value = issue
  detailsModalOpen.value = true
}

async function onReturnSaved() {
  returnModalOpen.value = false
  ui.toast({ type: 'success', text: 'Инструмент возвращён' })
  await Promise.all([
    toolIssuesStore.fetchList(),
    toolsStore.fetchList()
  ])
}

async function handleExport(format: 'csv' | 'excel' | 'pdf') {
  try {
    const data = toolIssuesStore.items
    const filename = `tool_issues_${new Date().toISOString().split('T')[0]}`

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
  } catch (error) {
    await handleLoadingError(error, 'toolIssues')
  }
}

async function handleAction(action: string, item: ToolIssue) {
  switch (action) {
    case 'return':
      openReturn(item)
      break
    case 'view':
      openDetails(item)
      break
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await toolIssuesStore.fetchList()
  } catch (error) {
    await handleLoadingError(error, 'toolIssues')
  }
})
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>
