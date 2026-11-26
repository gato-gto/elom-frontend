<template>
  <MobileCard :title="object.name" :badge="object.is_active ? 'Активный' : 'Неактивный'" :badge-class="object.is_active ? 'badge-success' : 'badge-error'" :actions="actions" @action="$emit('action', $event)">
    <template #content>
      <div class="space-y-2 text-sm">
        <div>
          <span class="text-muted">Адрес:</span>
          <span class="font-medium ml-2">{{ object.address }}</span>
        </div>
        
        <!-- F-1134 (ответы 23 и 31): сроки — застройщика, процент «прогресса» убран -->
        <div v-if="object.date_start || object.date_end" data-test="developer-term">
          <span class="text-muted">Сроки застройщика:</span>
          <span class="font-medium ml-2 font-mono">{{ formatDate(object.date_start || null) }} — {{ formatDate(object.date_end || null) }}</span>
        </div>
        
        <div v-if="object.responsible_name">
          <span class="text-muted">Ответственный:</span>
          <span class="font-medium ml-2 text-primary">{{ object.responsible_name }}</span>
        </div>
        
        <div v-if="object.key_person_name">
          <span class="text-muted">Прораб:</span>
          <span class="font-medium ml-2">{{ object.key_person_name }}</span>
        </div>
        
        <div v-if="object.key_person_contacts">
          <span class="text-muted">Контакты прораба:</span>
          <span class="font-medium ml-2">{{ object.key_person_contacts }}</span>
        </div>
        
        <div v-if="object.location_url">
          <span class="text-muted">Локация:</span>
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
          <span class="text-muted">Координаты:</span>
          <span class="font-medium ml-2 font-mono">{{ object.lat }}, {{ object.lng }}</span>
        </div>
      </div>
    </template>
    
    <template #extra>
      <div class="flex justify-between items-center text-xs text-muted">
        <span>Создан: <span class="font-mono">{{ formatDate(object.created_at) }}</span></span>
        <span v-if="object.updated_at !== object.created_at">
          Обновлен: <span class="font-mono">{{ formatDate(object.updated_at) }}</span>
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

defineProps<Props>()
defineEmits<Emits>()

useMobileCardHelpers()

</script>