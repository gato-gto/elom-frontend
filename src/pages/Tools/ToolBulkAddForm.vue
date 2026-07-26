<template>
  <div class="tool-bulk-add-form">
    <!-- Issue info section (optional) -->
    <div class="card bg-base-200 mb-4">
      <div class="card-body">
        <h4 class="card-title text-sm flex items-center gap-2">
          <input 
            type="checkbox" 
            v-model="autoIssue" 
            class="checkbox checkbox-primary checkbox-sm"
          />
          Сразу выдать инструменты
        </h4>
        
        <div v-if="autoIssue" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <!-- Кому выдать -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Кому выдать <span class="text-error">*</span></span>
            </label>
            <select v-model="issueData.issued_to" class="select select-bordered w-full" required>
              <option value="">— выберите сотрудника —</option>
              <option v-for="emp in employeeOptions" :key="emp.value" :value="emp.value">
                {{ emp.label }}
              </option>
            </select>
          </div>

          <!-- На какой объект -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">На какой объект</span>
            </label>
            <select v-model="issueData.object" class="select select-bordered w-full">
              <option value="">— не указывать —</option>
              <option v-for="obj in objectOptions" :key="obj.value" :value="obj.value">
                {{ obj.label }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Tools list -->
    <div class="card bg-base-200 mb-4">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h4 class="card-title text-sm">Инструменты</h4>
          <button type="button" class="btn btn-primary btn-sm" @click="addTool">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Добавить позицию
          </button>
        </div>

        <!-- Tool items -->
        <div v-for="(tool, index) in tools" :key="index" class="border border-base-300 rounded-lg p-4 mb-4">
          <div class="flex justify-between items-start mb-3">
            <span class="badge badge-primary">Инструмент #{{ index + 1 }}</span>
            <button 
              v-if="tools.length > 1" 
              type="button" 
              class="btn btn-ghost btn-xs text-error"
              @click="removeTool(index)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Инвентарный номер -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Инв. номер <span class="text-error">*</span></span>
              </label>
              <input 
                v-model="tool.inventory_number" 
                type="text" 
                class="input input-bordered input-sm w-full"
                placeholder="INV001"
                required
              />
            </div>

            <!-- Название -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Название <span class="text-error">*</span></span>
              </label>
              <input 
                v-model="tool.name" 
                type="text" 
                class="input input-bordered input-sm w-full"
                placeholder="Перфоратор Makita"
                required
              />
            </div>

            <!-- Категория -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Категория</span>
              </label>
              <input 
                v-model="tool.category" 
                type="text" 
                class="input input-bordered input-sm w-full"
                placeholder="Перфоратор, SDS-Plus"
                list="category-list"
                @input="onCategoryInput($event, index)"
              />
              <datalist id="category-list">
                <option v-for="cat in filteredCategories" :key="cat" :value="cat" />
              </datalist>
              <label class="label">
                <span class="label-text-alt">Через запятую</span>
              </label>
            </div>

            <!-- Марка -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Марка</span>
              </label>
              <input 
                v-model="tool.brand" 
                type="text" 
                class="input input-bordered input-sm w-full"
                placeholder="Makita"
              />
            </div>

            <!-- Состояние -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Состояние <span class="text-error">*</span></span>
              </label>
              <select v-model="tool.condition" class="select select-bordered select-sm w-full" required>
                <option v-for="cond in conditionOptions" :key="cond.value" :value="cond.value">
                  {{ cond.label }}
                </option>
              </select>
            </div>

            <!-- Индивидуальное состояние при выдаче (если autoIssue) -->
            <div v-if="autoIssue" class="form-control">
              <label class="label">
                <span class="label-text">Состояние при выдаче</span>
              </label>
              <select v-model="tool.issue_condition" class="select select-bordered select-sm w-full">
                <option v-for="cond in conditionOptions" :key="cond.value" :value="cond.value">
                  {{ cond.label }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="tools.length === 0" class="text-center py-8 text-muted">
          <p>Добавьте хотя бы один инструмент</p>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-2">
      <button type="button" class="btn btn-ghost" @click="handleCancel">
        Отмена
      </button>
      <button 
        type="button" 
        class="btn btn-primary" 
        @click="handleSubmit"
        :disabled="!isValid || loading"
      >
        <span v-if="loading" class="loading loading-spinner loading-sm"></span>
        {{ autoIssue ? 'Создать и выдать' : 'Создать инструменты' }}
        <span class="badge badge-ghost badge-sm ml-2">{{ tools.length }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useToolsStore } from '@/stores/tools'
import { useEmployeesStore } from '@/stores/employees'
import { useObjectsStore } from '@/stores/objects'
import { useUiStore } from '@/stores/ui'
import { parseApiError } from '@/utils/errorHandler'
import type { Tool, ToolBulkCreateRequest, ToolBulkItem, ToolCondition } from '@/api/types/tools'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const toolsStore = useToolsStore()
const employeesStore = useEmployeesStore()
const objectsStore = useObjectsStore()
const ui = useUiStore()

const loading = ref(false)
const autoIssue = ref(false)
const categories = ref<string[]>([])
const categorySearch = ref('')

// Issue data (when autoIssue is true)
const issueData = ref({
  issued_to: null as number | null,
  object: null as number | null
})

// Tools list
interface ToolItem {
  inventory_number: string
  name: string
  category: string
  brand: string
  condition: ToolCondition
  issue_condition: ToolCondition
}

const tools = ref<ToolItem[]>([
  {
    inventory_number: '',
    name: '',
    category: '',
    brand: '',
    condition: 'new',
    issue_condition: 'good'
  }
])

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

const objectOptions = computed(() => 
  objectsStore.items.map(o => ({
    value: o.id,
    label: o.name
  }))
)

const filteredCategories = computed(() => {
  if (!categorySearch.value) {return categories.value}
  const search = categorySearch.value.toLowerCase()
  return categories.value.filter(cat => cat.toLowerCase().includes(search))
})

// FE-4/F-563: пустая хвостовая строка (без инв.номера И без названия) — не инструмент,
// не должна блокировать «Сохранить». Валидируем/отправляем только начатые строки.
const isEmptyTool = (t: any) => !t.inventory_number?.trim() && !t.name?.trim()

// Validation
const isValid = computed(() => {
  const filled = tools.value.filter(t => !isEmptyTool(t))
  if (filled.length === 0) {return false}

  // Все НАЧАТЫЕ строки должны быть полными
  for (const tool of filled) {
    if (!tool.inventory_number?.trim() || !tool.name?.trim()) {
      return false
    }
  }
  
  // If autoIssue, check issued_to
  if (autoIssue.value && !issueData.value.issued_to) {
    return false
  }
  
  return true
})

// Methods
function addTool() {
  tools.value.push({
    inventory_number: '',
    name: '',
    category: '',
    brand: '',
    condition: 'new',
    issue_condition: autoIssue.value ? 'good' : 'good' // Always set default, will be used if autoIssue is enabled
  })
}

function removeTool(index: number) {
  tools.value.splice(index, 1)
}

function onCategoryInput(event: Event, _index: number) {
  const input = event.target as HTMLInputElement
  const value = input.value
  
  // Extract last part after comma for search
  const parts = value.split(',')
  categorySearch.value = parts[parts.length - 1].trim()
}

async function handleSubmit() {
  if (!isValid.value) {return}
  
  loading.value = true
  
  try {
    const payload: ToolBulkCreateRequest = {
      tools: tools.value.filter(t => !isEmptyTool(t)).map(t => ({
        inventory_number: t.inventory_number.trim(),
        name: t.name.trim(),
        category: t.category?.trim() || '',
        brand: t.brand?.trim() || '',
        condition: t.condition,
        issue_condition: autoIssue.value ? t.issue_condition : undefined
      })) as ToolBulkItem[],
      auto_issue: autoIssue.value,
      issued_to: autoIssue.value ? issueData.value.issued_to || undefined : undefined,
      object: autoIssue.value && issueData.value.object ? issueData.value.object : undefined
    }
    
    const { data } = await api.post(endpoints.tools.bulkCreate, payload)
    
    // API возвращает { tools: [...], created_count: ..., issued_count: ... }
    const response = data as { tools?: Tool[]; created_count?: number; issued_count?: number } | Tool[]
    const createdCount = Array.isArray(response) ? response.length : (response?.created_count || 0)
    const issuedCount = Array.isArray(response) ? 0 : (response?.issued_count || 0)
    
    ui.toast({ 
      type: 'success', 
      text: `Создано инструментов: ${createdCount}${issuedCount ? `, выдано: ${issuedCount}` : ''}`
    })
    
    emit('saved')
  } catch (error: any) {
    const parsedError = parseApiError(error)
    ui.toast({ type: 'error', text: parsedError.detail })
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  emit('cancel')
}

// Watch autoIssue to set default issue_condition for all tools
watch(autoIssue, (newValue) => {
  if (newValue) {
    // When enabling autoIssue, set default issue_condition for all tools
    tools.value.forEach(tool => {
      if (!tool.issue_condition) {
        tool.issue_condition = 'good'
      }
    })
  }
})

// Lifecycle
onMounted(async () => {
  try {
    await Promise.all([
      toolsStore.fetchCategories().then(cats => { categories.value = cats }),
      employeesStore.fetchList({ page_size: 1000, ordering: 'username' } as any),
      objectsStore.fetchList({ page_size: 1000, ordering: 'name', is_active: true } as any)
    ])
  } catch (error) {
    console.error('Failed to load data:', error)
  }
})
</script>

