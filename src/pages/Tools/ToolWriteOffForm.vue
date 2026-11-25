<template>
  <div class="tool-write-off-form">
    <div v-if="tool" class="alert alert-warning mb-4">
      <div>
        <div class="font-bold"><span class="font-code">{{ tool.inventory_number }}</span> — {{ tool.name }}</div>
        <div class="text-sm">Списанный инструмент нельзя выдать. Ошибочное списание можно отменить кнопкой «Вернуть в работу».</div>
      </div>
    </div>

    <GenericForm
      :config="formConfig"
      :initial-data="initialFormData"
      :on-submit="handleSubmit"
      :on-cancel="() => emit('cancel')"
      :validate-on-change="true"
      :reset-on-submit="false"
    />
  </div>
</template>

<script setup lang="ts">
// F-1101 (ответ владельца 12): окно «Списать инструмент». Причина обязательна (сервер — 400 без неё),
// дата — не позже сегодня (по умолчанию сегодня; пустую сервер тоже заменит сегодняшней).
import { computed } from 'vue'
import { useToolsStore } from '@/stores/tools'
import type { Tool } from '@/api/types/tools'
import type { GenericFormConfig } from '@/types/generic'
import GenericForm from '@/components/GenericForm.vue'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { todayLocal } from '@/utils/formatters'

type WriteOffForm = { reason: string; date: string }

const props = defineProps<{ tool: Pick<Tool, 'id' | 'inventory_number' | 'name'> | null }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const toolsStore = useToolsStore()
const { handleFormError } = useErrorHandler()

const formConfig = computed<GenericFormConfig<WriteOffForm>>(() => ({
  title: 'Списать инструмент',
  sections: [{ title: 'Списание', fields: ['reason', 'date'], order: 1 }],
  fields: [
    {
      key: 'reason',
      type: 'textarea',
      label: 'Причина',
      placeholder: 'Например: сгорел двигатель, ремонт невыгоден',
      required: true,
      order: 1,
      width: 'full',
      validation: { maxLength: 256 }
    },
    {
      key: 'date',
      type: 'date',
      label: 'Дата списания',
      order: 2,
      width: 'half',
      // строки 'YYYY-MM-DD' сравниваются как даты; сервер проверяет то же (400)
      validation: { custom: (v: string) => (v && v > todayLocal() ? 'Дата списания не может быть в будущем' : null) }
    }
  ],
  submitText: 'Списать',
  cancelText: 'Отмена',
  showCancel: true
}))

const initialFormData = computed<WriteOffForm>(() => ({ reason: '', date: todayLocal() }))

async function handleSubmit(data: WriteOffForm) {
  if (!props.tool) { throw new Error('Инструмент не выбран') }
  const payload: { reason: string; date?: string } = { reason: (data.reason || '').trim() }
  if (data.date) { payload.date = data.date }
  try {
    await toolsStore.writeOff(props.tool.id, payload)
    emit('saved')
  } catch (error) {
    await handleFormError(error, 'tool')
    throw error
  }
}
</script>
