<template>
  <div class="tool-return-form">
    <!-- Issue info -->
    <div v-if="issue" class="alert alert-info mb-4">
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
      </svg>
      <div>
        <div class="font-bold">{{ issue.tool_inventory_number }} — {{ issue.tool_name }}</div>
        <div class="text-sm">Выдан: {{ formatDate(issue.issued_at) }}</div>
        <div class="text-sm">Кому: {{ issue.issued_to_name }}</div>
        <div class="text-sm">Состояние при выдаче: {{ getConditionDisplayName(issue.issue_condition) }}</div>
      </div>
    </div>

    <!-- Generic Form -->
    <GenericForm
      :config="formConfig"
      :initial-data="initialFormData"
      :on-submit="handleSubmit"
      :on-cancel="handleCancel"
      :validate-on-change="true"
      :reset-on-submit="false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useToolIssuesStore } from '@/stores/toolIssues'
import type { ToolIssue, ToolIssueReturnRequest, ToolCondition } from '@/api/types/tools'
import type { GenericFormConfig } from '@/types/generic'
import GenericForm from '@/components/GenericForm.vue'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { formatDate as formatDateUtil } from '@/utils/formatters'

const props = defineProps<{
  issue: ToolIssue | null
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const toolIssuesStore = useToolIssuesStore()
const { handleFormError } = useErrorHandler()

// Helper functions
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return formatDateUtil(dateStr)
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

// Condition options
const conditionOptions = [
  { value: 'new', label: 'Новый' },
  { value: 'good', label: 'Хорошее' },
  { value: 'after_repair', label: 'После ремонта' },
  { value: 'needs_repair', label: 'Требует ремонта' },
  { value: 'broken', label: 'Сломан' },
  { value: 'lost', label: 'Утерян' }
]

// Form configuration
const formConfig = computed<GenericFormConfig<ToolIssueReturnRequest>>(() => ({
  title: 'Возврат инструмента',
  subtitle: 'Укажите состояние инструмента при возврате',
  sections: [
    {
      title: 'Состояние при возврате',
      description: 'Обязательно укажите состояние инструмента',
      fields: ['return_condition'],
      order: 1
    }
  ],
  fields: [
    {
      key: 'return_condition',
      type: 'select',
      label: 'Состояние при возврате',
      placeholder: '— выберите состояние —',
      options: conditionOptions,
      required: true,
      order: 1,
      width: 'full',
      help: 'Обязательно выберите актуальное состояние инструмента'
    }
  ],
  submitText: 'Оформить возврат',
  cancelText: 'Отмена',
  showCancel: true
}))

// Initial form data
const initialFormData = computed<ToolIssueReturnRequest>(() => ({
  return_condition: 'good' as ToolCondition
}))

// Methods
async function handleSubmit(formData: ToolIssueReturnRequest) {
  try {
    if (!props.issue) {
      throw new Error('Выдача не указана')
    }
    
    await toolIssuesStore.returnTool(props.issue.id, formData)
    emit('saved')
  } catch (error) {
    await handleFormError(error, 'toolIssue')
    throw error
  }
}

function handleCancel() {
  emit('cancel')
}
</script>

