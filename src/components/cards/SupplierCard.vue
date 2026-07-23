<template>
  <MobileCard
    :title="supplier.name"
    :badge="supplier.is_active ? 'Активен' : 'Неактивен'"
    :badge-variant="supplier.is_active ? 'success' : 'error'"
    :actions="actions"
    @action="$emit('action', $event, supplier)"
  >
    <template #header>
      <div class="flex justify-between items-start mb-3">
        <h3 class="text-lg font-semibold text-base-content">
          {{ supplier.name }}
        </h3>
        <div class="badge" :class="supplier.is_active ? 'badge-success' : 'badge-error'">
          {{ supplier.is_active ? 'Активен' : 'Неактивен' }}
        </div>
      </div>
    </template>
    <template #content>
      <div>
        <p class="text-xs text-muted">Контактное лицо:</p>
        <p class="font-medium">{{ supplier.contact_person || '—' }}</p>
      </div>
      <div>
        <p class="text-xs text-muted">Телефон:</p>
        <p class="font-medium">{{ supplier.phone || '—' }}</p>
      </div>
      <div>
        <p class="text-xs text-muted">Email:</p>
        <p class="font-medium">{{ supplier.email || '—' }}</p>
      </div>
      <div>
        <p class="text-xs text-muted">Создан:</p>
        <p class="font-medium font-mono">{{ formatDate(supplier.created_at) }}</p>
      </div>
      <div v-if="supplier.address" class="col-span-2">
        <p class="text-xs text-muted">Адрес:</p>
        <p class="text-sm italic text-muted">{{ supplier.address }}</p>
      </div>
    </template>
  </MobileCard>
</template>

<script setup lang="ts">
import MobileCard from '@/components/MobileCard.vue'
import type { PurchaseSupplier } from '@/api/types/suppliers'
import { formatDate } from '@/utils/formatters'

interface CardAction {
  key: string
  label: string
  shortLabel?: string
  icon?: any
  class?: string
  disabled?: boolean
}

defineProps<{
  supplier: PurchaseSupplier
  actions: CardAction[]
}>()

defineEmits(['action'])
</script>