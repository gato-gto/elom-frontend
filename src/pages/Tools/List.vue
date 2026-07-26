<template>
  <div class="list-container">
    <!-- GenericList Component -->
    <GenericList
      :store="toolsStore"
      :config="listConfig"
      @create="openCreate"
      @action="handleAction"
      @export="handleExport"
    >
      <!-- Header actions -->
      <template #header-actions>
        <button 
          class="btn btn-outline btn-sm md:btn-md shadow-sm hover:shadow-md transition-all duration-200" 
          @click="openBulkAdd"
        >
          <svg class="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span class="hidden md:inline">Массовое добавление</span>
          <span class="md:hidden">Массово</span>
        </button>
      </template>

      <!-- Custom column for inventory_number -->
      <template #column-inventory_number="{ item, value }">
        <div class="flex items-center gap-2">
          <span 
            class="font-mono font-bold text-primary cursor-pointer hover:underline transition-colors duration-200 break-words" 
            @click="openHistory(item)"
            title="Нажмите для просмотра истории"
          >
            {{ value }}
          </span>
        </div>
      </template>

      <!-- Custom column for name (includes category, brand, and name) -->
      <template #column-name="{ item, value }">
        <span class="font-medium break-words">
          {{ [
            item.category?.split(',')[0]?.trim(),
            item.brand,
            value
          ].filter(Boolean).join(' ') }}
        </span>
      </template>

      <!-- Custom column for condition -->
      <template #column-condition="{ item, value }">
        <div class="badge" :class="getConditionBadgeClass(value)">
          {{ item.condition_display || getConditionDisplayName(value) }}
        </div>
      </template>

      <!-- Custom column for current_holder -->
      <template #column-current_holder="{ item }">
        <div v-if="item.current_holder_name" class="flex flex-col gap-1">
          <span class="font-medium break-words">{{ item.current_holder_name }}</span>
          <span v-if="item.current_object_name" class="text-xs text-muted break-words">
            {{ item.current_object_name }}
          </span>
        </div>
        <span v-else class="badge badge-success badge-sm">На складе</span>
      </template>
    </GenericList>

    <!-- Modal for creating/editing tool -->
    <Modal v-model="modalOpen" :title="modalTitle" size="lg" :closable="true">
      <ToolForm :initial="current" @saved="onSaved" @cancel="modalOpen = false" />
    </Modal>

    <!-- Modal for bulk add -->
    <Modal v-model="bulkAddModalOpen" title="Массовое добавление инструментов" size="6xl" :closable="true">
      <ToolBulkAddForm @saved="onBulkAddSaved" @cancel="bulkAddModalOpen = false" />
    </Modal>

    <!-- Modal for issuing tool -->
    <Modal v-model="issueModalOpen" title="Выдать инструмент" size="lg" :closable="true">
      <ToolIssueForm :tool="issuingTool" @saved="onIssueSaved" @cancel="issueModalOpen = false" />
    </Modal>

    <!-- Modal for returning tool -->
    <Modal v-model="returnModalOpen" title="Возврат инструмента" size="lg" :closable="true">
      <ToolReturnForm :issue="returningIssue" @saved="onReturnSaved" @cancel="returnModalOpen = false" />
    </Modal>

    <!-- Modal for tool history -->
    <Modal v-model="historyModalOpen" title="История инструмента" size="6xl" :closable="true">
      <ToolHistory :tool="historyTool" @close="historyModalOpen = false" />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToolsStore } from '@/stores/tools'
import { useToolIssuesStore } from '@/stores/toolIssues'
import { useObjectsStore } from '@/stores/objects'
import { useEmployeesStore } from '@/stores/employees'
import { useUiStore } from '@/stores/ui'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/export'
import type { Tool, ToolIssue } from '@/api/types/tools'
import type { GenericListConfig } from '@/types/generic'
import Modal from '@/components/Modal.vue'
import ToolForm from './ToolForm.vue'
import ToolBulkAddForm from './ToolBulkAddForm.vue'
import ToolIssueForm from './ToolIssueForm.vue'
import ToolReturnForm from './ToolReturnForm.vue'
import ToolHistory from './ToolHistory.vue'
import GenericList from '@/components/GenericList.vue'
import ToolCard from '@/components/cards/ToolCard.vue'
import api from '@/api/client'
import { endpoints, buildQuery } from '@/api/endpoints'
import { usePermissions } from '@/composables/usePermissions'
import { useEditQuery } from '@/composables/useEditQuery'

// ✅ RBAC: проверка через permissions
const { can, canExportReports } = usePermissions()
const canEdit = computed(() => can('tools', 'edit'))

// Stores
const toolsStore = useToolsStore()
// F-592: ?edit=<id> открывает форму редактирования инструмента (паритет диплинков).
useEditQuery(toolsStore, openEdit)
const _toolIssuesStore = useToolIssuesStore()
const objectsStore = useObjectsStore()
const employeesStore = useEmployeesStore()
const ui = useUiStore()

// Error handling
const { handleLoadingError, handleDeleteError } = useErrorHandler()

// Modal state
const modalOpen = ref(false)
const current = ref<Tool | null>(null)
const bulkAddModalOpen = ref(false)
const issueModalOpen = ref(false)
const issuingTool = ref<Tool | null>(null)
const returnModalOpen = ref(false)
const returningIssue = ref<ToolIssue | null>(null)
const historyModalOpen = ref(false)
const historyTool = ref<Tool | null>(null)

// Categories for filter
const categories = ref<string[]>([])

const modalTitle = computed(() => {
  return current.value ? 'Редактировать инструмент' : 'Новый инструмент'
})

// Filter options
const conditionFilterOptions = computed(() => [
  { value: '', label: 'Все состояния' },
  { value: 'new', label: 'Новый' },
  { value: 'good', label: 'Хорошее' },
  { value: 'after_repair', label: 'После ремонта' },
  { value: 'needs_repair', label: 'Требует ремонта' },
  { value: 'broken', label: 'Сломан' },
  { value: 'lost', label: 'Утерян' }
])

const stockFilterOptions = computed(() => [
  { value: '', label: 'Все' },
  { value: 'true', label: 'На складе' },
  { value: 'false', label: 'Выдано' }
])

const objectOptions = computed(() => [
  { value: '', label: 'Все объекты' },
  ...objectsStore.items.map(o => ({ value: o.id, label: o.name }))
])

const employeeOptions = computed(() => [
  { value: '', label: 'Все сотрудники' },
  ...employeesStore.items.map(e => ({ 
    value: e.id, 
    label: `${e.first_name || e.username} ${e.last_name || ''}`.trim()
  }))
])

const categoryOptions = computed(() => [
  { value: '', label: 'Все категории' },
  ...categories.value.map(c => ({ value: c, label: c }))
])

// GenericList configuration
const listConfig = computed<GenericListConfig<Tool>>(() => ({
  title: 'Инструменты',
  subtitle: 'Учёт и управление инструментами',
  icon: 'build',
  showCreate: true,
  createText: 'Добавить инструмент',
  canCreate: canEdit.value,
  showStats: true,
  exportable: canExportReports.value, // ✅ RBAC: контроль экспорта через permissions
  exportFilename: 'tools',
  exportUrl: '/api/v1/tools/',
  loadingText: 'Загрузка инструментов...',
  emptyText: 'Нет инструментов',
  emptyTitle: 'Нет инструментов',
  emptySubtitle: 'Добавьте первый инструмент для начала работы',
  filterColumns: 5,
  columns: [
    { key: 'inventory_number', label: 'Инв. номер', sortable: true },
    { key: 'name', label: 'Инструмент', sortable: true },
    { key: 'condition', label: 'Состояние', sortable: true },
    { key: 'current_holder', label: 'Местоположение', sortable: false }
  ],
  filters: [
    {
      key: 'search',
      type: 'text',
      label: 'Поиск',
      placeholder: 'Инв. номер, название...'
    },
    {
      key: 'condition',
      type: 'select',
      label: 'Состояние',
      options: conditionFilterOptions.value
    },
    {
      key: 'in_stock',
      type: 'select',
      label: 'Местоположение',
      options: stockFilterOptions.value
    },
    {
      key: 'current_object',
      type: 'select',
      label: 'Объект',
      options: objectOptions.value
    },
    {
      key: 'current_holder',
      type: 'select',
      label: 'У сотрудника',
      options: employeeOptions.value
    },
    {
      key: 'category',
      type: 'select',
      label: 'Категория',
      options: categoryOptions.value
    }
  ],
  actions: [
    {
      key: 'issue',
      label: 'Выдать',
      class: 'btn-success btn-sm',
      disabled: (item: Tool) => !!item.current_holder
    },
    {
      key: 'return',
      label: 'Вернуть',
      class: 'btn-warning btn-sm',
      disabled: (item: Tool) => !item.current_holder
    },
    {
      key: 'history',
      label: 'История',
      class: 'btn-ghost btn-sm'
    },
    {
      key: 'edit',
      label: 'Редактировать',
      class: 'btn-outline btn-sm'
    },
    {
      key: 'delete',
      label: 'Удалить',
      class: 'btn-error btn-sm',
      confirm: (item: Tool) => `Удалить инструмент "${item.name}"?`
    }
  ],
  mobileCardComponent: ToolCard,
  mobileCardProp: 'tool',
  defaultSort: 'inventory_number',
  defaultSortOrder: 'asc'
}))

// Helper functions
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
function openCreate() {
  current.value = null
  modalOpen.value = true
}

function openBulkAdd() {
  bulkAddModalOpen.value = true
}

function openEdit(tool: Tool) {
  current.value = tool
  modalOpen.value = true
}

function openIssue(tool: Tool) {
  issuingTool.value = tool
  issueModalOpen.value = true
}

async function openReturn(tool: Tool) {
  // Find active issue for this tool
  try {
    const query = buildQuery({ tool: tool.id, is_open: true })
    const { data } = await api.get(endpoints.toolIssues.list + query)
    const issues = data.results || data
    
    if (issues.length > 0) {
      returningIssue.value = issues[0]
      returnModalOpen.value = true
    } else {
      ui.toast({ type: 'info', text: 'Активная выдача не найдена' })
    }
  } catch (error) {
    ui.toast({ type: 'error', text: 'Ошибка при поиске выдачи' })
  }
}

function openHistory(tool: Tool) {
  historyTool.value = tool
  historyModalOpen.value = true
}

async function onSaved() {
  modalOpen.value = false
  ui.toast({ type: 'success', text: 'Инструмент сохранён' })
  await toolsStore.fetchList()
}

async function onBulkAddSaved() {
  bulkAddModalOpen.value = false
  await toolsStore.fetchList()
}

async function onIssueSaved() {
  issueModalOpen.value = false
  ui.toast({ type: 'success', text: 'Инструмент выдан' })
  await toolsStore.fetchList()
}

async function onReturnSaved() {
  returnModalOpen.value = false
  ui.toast({ type: 'success', text: 'Инструмент возвращён' })
  await toolsStore.fetchList()
}

async function handleExport(format: 'csv' | 'excel' | 'pdf') {
  try {
    const data = toolsStore.items
    const filename = `tools_${new Date().toISOString().split('T')[0]}`

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
    await handleLoadingError(error, 'tools')
  }
}

async function handleAction(action: string, item: Tool) {
  switch (action) {
    case 'edit':
      openEdit(item)
      break
    case 'issue':
      openIssue(item)
      break
    case 'return':
      await openReturn(item)
      break
    case 'history':
      openHistory(item)
      break
    case 'delete':
      await handleDelete(item)
      break
  }
}

async function handleDelete(tool: Tool) {
  if (!confirm(`Удалить инструмент "${tool.name}"?`)) { return }
  
  try {
    await toolsStore.remove(tool.id)
    ui.toast({ type: 'success', text: `Инструмент "${tool.name}" удалён` })
  } catch (error) {
    await handleDeleteError(error, 'tool', tool.id)
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await Promise.all([
      toolsStore.fetchList(),
      toolsStore.fetchCategories().then(cats => { categories.value = cats }),
      objectsStore.fetchList({ page_size: 1000, ordering: 'name', is_active: true } as any),
      employeesStore.fetchList({ page_size: 1000, ordering: 'username' } as any)
    ])
  } catch (error) {
    await handleLoadingError(error, 'tools')
  }
})
</script>
