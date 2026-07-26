<template>
  <div v-if="tool" class="tool-history">
    <!-- Tool Info Header -->
    <div class="bg-base-200 rounded p-4 mb-4">
      <div class="flex flex-wrap justify-between items-start gap-4">
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-bold font-mono text-primary">{{ tool.inventory_number }}</h3>
          <p class="text-sm font-medium mt-1">
            {{ [
              tool.category?.split(',')[0]?.trim(),
              tool.brand,
              tool.name
            ].filter(Boolean).join(' ') }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="badge" :class="getConditionBadgeClass(tool.condition)">
            {{ tool.condition_display || getConditionDisplayName(tool.condition) }}
          </div>
          <div>
            <span v-if="tool.current_holder_name" class="text-sm">
              У: <strong>{{ tool.current_holder_name }}</strong>
            </span>
            <span v-else class="badge badge-success badge-sm">На складе</span>
          </div>
        </div>
      </div>
    </div>

    <!-- History Table -->
    <div class="overflow-hidden">
      <h4 class="text-sm font-semibold mb-3 text-muted">История выдач и возвратов</h4>
      
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- Empty state -->
      <div v-else-if="history.length === 0" class="text-center py-12 text-muted">
        <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>Нет истории выдач</p>
        <p class="text-xs mt-1">Инструмент ещё не выдавался</p>
      </div>

      <!-- Desktop Table -->
      <template v-else>
        <div class="overflow-x-auto hidden md:block">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th class="text-xs">Дата выдачи</th>
                <th class="text-xs">Кому</th>
                <th class="text-xs">Объект</th>
                <th class="text-xs">Выдал</th>
                <th class="text-xs">Состояние</th>
                <th class="text-xs">Дата возврата</th>
                <th class="text-xs">Состояние</th>
                <th class="text-xs">Длительность</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="issue in history" :key="issue.id" :class="{ 'bg-warning/10': !issue.is_returned }">
                <!-- Дата выдачи -->
                <td>
                  <div class="text-sm font-medium font-mono">{{ formatDate(issue.issued_at) }}</div>
                  <div class="text-xs text-muted font-mono">{{ formatTime(issue.issued_at) }}</div>
                </td>
                
                <!-- Кому -->
                <td>
                  <div class="text-sm">{{ issue.issued_to_name }}</div>
                </td>
                
                <!-- Объект -->
                <td>
                  <div v-if="issue.object_name" class="text-sm">{{ issue.object_name }}</div>
                  <span v-else class="text-xs text-subtle">—</span>
                </td>

                <!-- Выдал -->
                <td>
                  <div class="text-sm text-muted">{{ issue.issued_by_name }}</div>
                </td>
                
                <!-- Состояние при выдаче -->
                <td>
                  <span class="badge badge-sm" :class="getConditionBadgeClass(issue.issue_condition)">
                    {{ getConditionDisplayName(issue.issue_condition) }}
                  </span>
                </td>
                
                <!-- Дата возврата -->
                <td>
                  <div v-if="issue.return_date" class="text-sm font-medium text-success font-mono">
                    {{ formatDate(issue.return_date) }}
                  </div>
                  <div v-if="issue.return_date" class="text-xs text-muted font-mono">{{ formatTime(issue.return_date) }}</div>
                  <span v-else class="badge badge-warning badge-sm">Не возвращён</span>
                </td>
                
                <!-- Состояние при возврате -->
                <td>
                  <span v-if="issue.return_condition" class="badge badge-sm" :class="getConditionBadgeClass(issue.return_condition)">
                    {{ getConditionDisplayName(issue.return_condition) }}
                  </span>
                  <span v-else-if="issue.is_returned" class="text-xs text-subtle">—</span>
                  <span v-else class="text-xs text-subtle">—</span>
                </td>
                
                <!-- Длительность -->
                <td>
                  <div v-if="issue.duration_days !== null && issue.duration_days !== undefined" class="text-sm font-mono">
                    {{ formatDuration(issue.duration_days) }}
                  </div>
                  <div v-else-if="!issue.is_returned" class="text-xs text-muted font-mono">
                    {{ calculateDaysAgo(issue.issued_at) }}
                  </div>
                  <span v-else class="text-xs text-subtle">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards (hidden on desktop) -->
        <div class="block md:hidden space-y-3">
        <div 
          v-for="issue in history" 
          :key="issue.id" 
          class="card  border border-base-300"
          :class="{ 'border-warning': !issue.is_returned }"
        >
          <div class="card-body p-4 space-y-2">
            <!-- Header -->
            <div class="flex justify-between items-start">
              <div>
                <div class="text-sm font-semibold font-mono">{{ formatDate(issue.issued_at) }}</div>
                <div class="text-xs text-muted font-mono">{{ formatTime(issue.issued_at) }}</div>
              </div>
              <span v-if="!issue.is_returned" class="badge badge-warning badge-sm">Активна</span>
              <span v-else class="badge badge-success badge-sm">Возвращена</span>
            </div>

            <!-- Issue info -->
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span class="text-muted">Кому:</span>
                <div class="font-medium">{{ issue.issued_to_name }}</div>
              </div>
              <div>
                <span class="text-muted">Выдал:</span>
                <div>{{ issue.issued_by_name }}</div>
              </div>
              <div v-if="issue.object_name" class="col-span-2">
                <span class="text-muted">Объект:</span>
                <div>{{ issue.object_name }}</div>
              </div>
            </div>

            <!-- Conditions inline -->
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs text-muted">Выдача:</span>
              <span class="badge badge-sm" :class="getConditionBadgeClass(issue.issue_condition)">
                {{ getConditionDisplayName(issue.issue_condition) }}
              </span>
              <span v-if="issue.return_condition" class="text-xs text-muted">→</span>
              <span v-if="issue.return_condition" class="text-xs text-muted">Возврат:</span>
              <span v-if="issue.return_condition" class="badge badge-sm" :class="getConditionBadgeClass(issue.return_condition)">
                {{ getConditionDisplayName(issue.return_condition) }}
              </span>
            </div>

            <!-- Return info -->
            <div v-if="issue.is_returned && issue.return_date" class="border-t border-base-300 pt-2 mt-2">
              <div class="flex justify-between items-center text-sm">
                <span class="text-muted">Возврат:</span>
                <span class="font-medium text-success font-mono">
                  {{ formatDate(issue.return_date) }} {{ formatTime(issue.return_date) }}
                </span>
              </div>
              <div v-if="issue.duration_days !== null && issue.duration_days !== undefined" class="text-xs text-muted mt-1 font-mono">
                Длительность: {{ formatDuration(issue.duration_days) }}
              </div>
            </div>
            <div v-else-if="!issue.is_returned" class="border-t border-base-300 pt-2 mt-2">
              <div class="text-xs text-muted font-mono">{{ calculateDaysAgo(issue.issued_at) }}</div>
            </div>
          </div>
        </div>
      </div>
      </template>
    </div>

    <!-- Actions -->
    <div class="modal-action mt-6">
      <button class="btn btn-ghost" @click="$emit('close')">Закрыть</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Tool, ToolIssue } from '@/api/types/tools'
import api from '@/api/client'
import { endpoints, buildQuery } from '@/api/endpoints'
import { formatDate as formatDateUtil } from '@/utils/formatters'
import { handleApiErrorAsync } from '@/utils/errorHandler'

const props = defineProps<{
  tool: Tool | null
}>()

defineEmits<{
  close: []
}>()

const loading = ref(false)
const history = ref<ToolIssue[]>([])

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

function formatDuration(days: number | null | undefined): string {
  if (days === null || days === undefined) {return '—'}
  if (days === 0) {return 'Менее суток'}
  if (days === 1) {return '1 день'}
  if (days < 5) {return `${days} дня`}
  return `${days} дней`
}

function calculateDaysAgo(dateStr: string): string {
  const issued = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - issued.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {return 'Выдан сегодня'}
  if (diffDays === 1) {return 'Выдан вчера'}
  if (diffDays < 5) {return `Выдан ${diffDays} дня назад`}
  return `Выдан ${diffDays} дней назад`
}

// Fetch history
async function fetchHistory() {
  if (!props.tool) {return}
  
  loading.value = true
  try {
    const query = buildQuery({ 
      tool: props.tool.id, 
      ordering: '-issued_at',
      page_size: 100 
    })
    const { data } = await api.get(endpoints.toolIssues.list + query)
    history.value = data.results || data
  } catch (error) {
    // EH-FE-7 (F-552): сбой загрузки истории больше не выглядит как «история пуста» —
    // показываем тост (интерцептор по FE-3 больше не тостит).
    await handleApiErrorAsync(error, { operation: 'dataLoading', entity: 'история инструмента' })
    history.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchHistory()
})
</script>

<style scoped>
.tool-history {
  min-height: 200px;
}

/* Compact table on desktop */
@media (min-width: 768px) {
  .table th,
  .table td {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }
  
  .table th {
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }
}
</style>
