<!-- Список смет по объекту. F-931 (дизайн-консистентность, хендофф A): на GenericList (как остальные
     13 списков) + EstimateCard на MobileCard. Object-scope на BE; фильтр «Объект» дополнительно сужает. -->
<template>
  <div class="list-container">
    <GenericList :store="estimatesStore" :config="listConfig" @create="openCreate" @action="handleAction">
      <!-- Кастомная колонка «Итого» — сумма с валютой (formatNumber). -->
      <template #column-total="{ item }">
        <span class="font-mono">{{ formatNumber(item.total) }} <span class="text-xs text-muted">{{ item.currency }}</span></span>
      </template>
      <template #column-title="{ item, value }">
        <span class="font-medium">{{ value || 'Без названия' }}</span>
      </template>
    </GenericList>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEstimatesStore } from '@/stores/estimates'
import { useObjectsStore } from '@/stores/objects'
import { useUiStore } from '@/stores/ui'
import GenericList from '@/components/GenericList.vue'
import EstimateCard from '@/components/cards/EstimateCard.vue'
import { formatNumber, formatDate } from '@/utils/formatters'

const router = useRouter()
const estimatesStore = useEstimatesStore()
const objectsStore = useObjectsStore()
const ui = useUiStore()

const objectOptions = computed(() => objectsStore.items.map(o => ({ value: o.id, label: o.name })))

const listConfig = computed(() => ({
  title: 'Сметы',
  subtitle: 'Отчёт цен по объекту',
  icon: 'clipboard',
  showCreate: true,
  createText: 'Новая смета',
  // RBAC: create/view/delete по estimates.* (GenericList сам гейтит create-кнопку по estimates.create,
  // action-кнопки — по action.permission; F-912/913: гейт = реальное право BE DictPermission).
  resource: 'estimates',
  showStats: true,
  loadingText: 'Загрузка смет...',
  emptyTitle: 'Смет нет',
  emptySubtitle: 'Создайте первую смету по объекту',
  filterColumns: 2,
  columns: [
    { key: 'title', label: 'Название', sortable: false },
    { key: 'object__name', label: 'Объект', sortable: false, displayKey: 'object_name' },
    { key: 'date', label: 'Дата', sortable: true, formatter: (v: any) => (v ? formatDate(v) : 'НЗ') },
    { key: 'total', label: 'Итого', sortable: false }, // кастомный слот
    { key: 'created_by__username', label: 'Автор', sortable: false, displayKey: 'created_by_name' },
  ],
  filters: [
    { key: 'object', type: 'select' as const, label: 'Объект', options: objectOptions.value },
  ],
  actions: [
    { key: 'view', label: 'Открыть', icon: 'view', permission: 'estimates.view' },
    { key: 'delete', label: 'Удалить', class: 'btn-error', icon: 'delete', permission: 'estimates.delete' },
  ],
  mobileCardComponent: EstimateCard,
  mobileCardProp: 'estimate',
}))

function openCreate() {
  // Если выбран фильтр объекта — префилл формы; иначе форма даст выбрать объект.
  const obj = (estimatesStore.filters as Record<string, unknown>)?.object
  router.push(obj ? `/estimates/new?object=${obj}` : '/estimates/new')
}

function handleAction(action: string, item: { id: number; title?: string }) {
  if (action === 'view') {
    router.push(`/estimates/${item.id}`)
  } else if (action === 'delete') {
    // нативный confirm() — как в 8 других списках (согласовано с A: не изобретать модалку).
    if (!confirm(`Удалить смету «${item.title || 'без названия'}»? Действие необратимо.`)) { return }
    estimatesStore.remove(item.id)
      .then(() => ui.toast({ type: 'success', text: 'Смета удалена' }))
      .catch(() => ui.toast({ type: 'error', text: 'Не удалось удалить смету' }))
  }
}

onMounted(() => {
  if (objectsStore.items.length === 0) { objectsStore.fetchList({ page_size: 1000 }).catch(() => {}) }
  // F-932 (регресс F-931, флаг A): GenericList САМ не фетчит на mount (его useUrlFilters init —
  // triggerFetch=false, «список грузит страница»). Все списки зовут fetchList в onMounted; при рефакторе
  // на GenericList я это потерял → холодный /estimates пуст даже при наличии смет (замаскировано 0 смет
  // на проде). Возвращаем. Object-фильтр из URL уже применён useUrlFilters синхронно (setup) ДО сюда.
  estimatesStore.fetchList().catch(() => {})
})
</script>
