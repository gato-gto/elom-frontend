<template>
  <MobileCard :title="object.name" :badge="object.is_active ? 'Активный' : 'Неактивный'" :badge-class="object.is_active ? 'badge-success' : 'badge-error'" :actions="actions" @action="$emit('action', $event)">
    <template #content>
      <div class="space-y-2 text-sm">
        <div>
          <span class="text-gray-500">Адрес:</span>
          <span class="font-medium ml-2">{{ object.address }}</span>
        </div>
        
        <div v-if="object.date_start">
          <span class="text-gray-500">Начало работ:</span>
          <span class="font-medium ml-2">{{ formatDate(object.date_start || null) }}</span>
        </div>
        
        <div v-if="object.date_end">
          <span class="text-gray-500">Окончание:</span>
          <span class="font-medium ml-2">{{ formatDate(object.date_end) }}</span>
        </div>
        
        <div v-if="getProjectProgress() !== null">
          <span class="text-gray-500">Прогресс:</span>
          <span class="font-medium ml-2">{{ getProjectProgress() }}%</span>
        </div>
        
        <div v-if="object.responsible_name">
          <span class="text-gray-500">Ответственный:</span>
          <span class="font-medium ml-2 text-primary">{{ object.responsible_name }}</span>
        </div>
        
        <div v-if="object.key_person_name">
          <span class="text-gray-500">Прораб:</span>
          <span class="font-medium ml-2">{{ object.key_person_name }}</span>
        </div>
        
        <div v-if="object.key_person_contacts">
          <span class="text-gray-500">Контакты прораба:</span>
          <span class="font-medium ml-2">{{ object.key_person_contacts }}</span>
        </div>
        
        <div v-if="object.location_url">
          <span class="text-gray-500">Локация:</span>
          <a 
            :href="object.location_url" 
            target="_blank" 
            rel="noopener noreferrer"
            class="font-medium ml-2 text-info hover:underline"
          >
            Показать на карте
          </a>
        </div>
        
        <div v-else-if="object.lat && object.lng">
          <span class="text-gray-500">Координаты:</span>
          <span class="font-medium ml-2">{{ object.lat }}, {{ object.lng }}</span>
        </div>
      </div>
    </template>
    
    <template #extra>
      <div class="flex justify-between items-center text-xs text-gray-500">
        <span>Создан: {{ formatDate(object.created_at) }}</span>
        <span v-if="object.updated_at !== object.created_at">
          Обновлен: {{ formatDate(object.updated_at) }}
        </span>
      </div>
    </template>
  </MobileCard>
</template>

<script setup lang="ts">
import { SiteObject } from '@/api/types/objects'
import MobileCard from '@/components/MobileCard.vue'
import { useMobileCardHelpers } from '@/composables/useResponsiveTable'
import { formatDate } from '@/utils/formatters'

interface Props {
  object: SiteObject
  actions?: Array<{
    key: string
    label: string
    shortLabel?: string
    class?: string
    disabled?: boolean
    tooltip?: string
    icon?: any
  }>
}

interface Emits {
  (e: 'action', action: string): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const { truncateText } = useMobileCardHelpers()

const getProjectProgress = () => {
  if (!props.object.date_start || !props.object.date_end) return null
  
  const start = new Date(props.object.date_start)
  const end = new Date(props.object.date_end)
  const now = new Date()
  
  if (now < start) return 0
  if (now > end) return 100
  
  const total = end.getTime() - start.getTime()
  const passed = now.getTime() - start.getTime()
  
  return Math.round((passed / total) * 100)
}
</script>