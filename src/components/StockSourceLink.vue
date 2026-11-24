<template>
  <!-- F-827: у прихода — ссылка на накладную закупки (по id документа, не позиции) -->
  <router-link
    v-if="href"
    :to="href"
    class="link link-hover"
    @click.stop
  >{{ label }}</router-link>
  <span v-else>{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePermissions } from '@/composables/usePermissions'

interface SourceItem {
  source_type: string
  source_id: number
  source_document_id?: number | null
  source_description?: string
}

const props = defineProps<{ item: SourceItem }>()
const { can } = usePermissions()

const TYPE_LABEL: Record<string, string> = { purchase_item: 'Закупка', writeoff: 'Списание' }

const label = computed(() => props.item.source_description
  || `${TYPE_LABEL[props.item.source_type] || props.item.source_type} № ${props.item.source_id}`)

const href = computed(() => {
  if (props.item.source_type !== 'purchase_item' || !props.item.source_document_id) { return null }
  // как маршрут /purchases/:id/print (F-882): view или view_own; объекты скоупит бэкенд
  if (!can('purchases', 'view') && !can('purchases', 'view_own')) { return null }
  return { name: 'PurchasePrint', params: { id: props.item.source_document_id } }
})
</script>
