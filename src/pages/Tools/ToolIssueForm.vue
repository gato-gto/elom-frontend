<template>
  <div class="tool-issue-form">
    <!-- Tool info -->
    <div v-if="tool" class="alert alert-info mb-4">
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
      </svg>
      <div>
        <div class="font-bold">{{ tool.inventory_number }} — {{ tool.name }}</div>
        <div class="text-sm">Текущее состояние: {{ getConditionDisplayName(tool.condition) }}</div>
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
import { computed, onMounted } from 'vue'
import { useToolIssuesStore } from '@/stores/toolIssues'
import { useEmployeesStore } from '@/stores/employees'
import { useObjectsStore } from '@/stores/objects'
import type { Tool, ToolIssueCreateRequest, ToolCondition } from '@/api/types/tools'
import type { GenericFormConfig } from '@/types/generic'
import GenericForm from '@/components/GenericForm.vue'
import { useErrorHandler } from '@/composables/useErrorHandler'

const props = defineProps<{
  tool: Tool | null
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const toolIssuesStore = useToolIssuesStore()
const employeesStore = useEmployeesStore()
const objectsStore = useObjectsStore()
const { handleFormError } = useErrorHandler()

onMounted(async () => {
  await Promise.all([
    employeesStore.fetchList({ page_size: 1000, ordering: 'username' } as any),
    objectsStore.fetchList({ page_size: 1000, ordering: 'name', is_active: true } as any)
  ])
})

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

// Options
const conditionOptions = [
  { value: 'new', label: 'Новый' },
  { value: 'good', label: 'Хорошее' },
  { value: 'after_repair', label: 'После ремонта' },
  { value: 'needs_repair', label: 'Требует ремонта' },
  { value: 'broken', label: 'Сломан' }
]

const employeeOptions = computed(() => 
  employeesStore.items.map(e => ({
    value: e.id,
    label: `${e.first_name || e.username} ${e.last_name || ''}`.trim()
  }))
)

const objectOptions = computed(() => [
  { value: '', label: '— не указывать —' },
  ...objectsStore.items.map(o => ({
    value: o.id,
    label: o.name
  }))
])

// Form configuration
const formConfig = computed<GenericFormConfig<ToolIssueCreateRequest>>(() => ({
  title: 'Выдача инструмента',
  subtitle: 'Укажите кому и куда выдаётся инструмент',
  sections: [
    {
      title: 'Получатель',
      description: 'Кому выдаётся инструмент',
      fields: ['issued_to', 'object'],
      order: 1
    },
    {
      title: 'Состояние',
      description: 'Состояние инструмента при выдаче',
      fields: ['issue_condition'],
      order: 2
    }
  ],
  fields: [
    {
      key: 'issued_to',
      type: 'select',
      label: 'Кому выдать',
      placeholder: '— выберите сотрудника —',
      options: employeeOptions.value,
      required: true,
      order: 1,
      width: 'full'
    },
    {
      key: 'object',
      type: 'select',
      label: 'На какой объект',
      placeholder: '— выберите объект —',
      options: objectOptions.value,
      order: 2,
      width: 'full',
      help: 'Необязательно'
    },
    {
      key: 'issue_condition',
      type: 'select',
      label: 'Состояние при выдаче',
      placeholder: '— выберите состояние —',
      options: conditionOptions,
      required: true,
      order: 3,
      width: 'full'
    }
  ],
  submitText: 'Выдать инструмент',
  cancelText: 'Отмена',
  showCancel: true
}))

// Initial form data
const initialFormData = computed<ToolIssueCreateRequest>(() => ({
  tool: props.tool?.id || 0,
  issued_to: 0,
  object: undefined,
  issue_condition: (props.tool?.condition as ToolCondition) || 'good'
}))

// Methods
async function handleSubmit(formData: ToolIssueCreateRequest) {
  try {
    // Ensure tool ID is set
    formData.tool = props.tool?.id || 0
    // F-265: без конкретного инструмента POST /tool-issues/issue/ уйдёт с tool=0 и 400.
    if (!formData.tool || formData.tool <= 0) {
      throw new Error('Инструмент не выбран — выдача невозможна')
    }

    // Convert empty object to undefined
    if (!formData.object) {
      formData.object = undefined
    }
    
    // Ensure numbers are numbers, not strings
    if (typeof formData.issued_to === 'string') {
      formData.issued_to = parseInt(formData.issued_to, 10)
    }
    if (formData.object && typeof formData.object === 'string') {
      formData.object = parseInt(formData.object, 10)
    }
    
    await toolIssuesStore.create(formData)
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

