<template>
  <div class="list-container">
    <!-- Admin Info -->
    <div class="alert alert-info mb-6">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
        </svg>
      <div>
        <h3 class="font-bold">Для администраторов</h3>
        <div class="text-xs">
          Создавайте единицы измерения для материалов. Пользователи видят автоматически конвертированные значения (например, 1000г → 1кг).
          <br>
          <strong>Поддерживаемые категории:</strong> масса (г, кг, т), длина (мм, см, м, км), площадь (см², м², га), объем (мл, л, м³).
        </div>
      </div>
    </div>

    <!-- GenericList Component -->
    <GenericList
      :store="unitsStore"
      :config="listConfig"
      @create="openCreate"
      @action="handleAction"
      @export="handleExport"
    >
      <!-- Custom column for code -->
      <template #column-code="{ item, value }">
        <div class="text-sm text-muted font-mono">{{ value }}</div>
      </template>

      <!-- Custom column for smart conversion -->
      <template #column-smart_conversion="{ item }">
        <span v-if="isUsedInSmartConversion(item.code)" class="badge badge-success badge-xs">
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
          </svg>
          Поддерживается
        </span>
        <span v-else class="badge badge-ghost badge-xs">
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
          Не поддерживается
        </span>
      </template>
    </GenericList>

    <!-- Modal -->
    <Modal v-model="modalOpen" :title="modalTitle" size="lg" :closable="true">
      <UnitForm :initial="current" @saved="onSaved" @cancel="modalOpen=false"/>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUnitsStore } from '@/stores/units'
import { usePermissions } from '@/composables/usePermissions'
import { useUiStore } from '@/stores/ui'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { exportToCSV, exportToExcel, exportToPDF } from '@/utils/export'
import type { Unit } from '@/api/types'
import type { GenericListConfig } from '@/types/generic'
import Modal from '@/components/Modal.vue'
import UnitForm from './UnitForm.vue'
import GenericList from '@/components/GenericList.vue'
import UnitCard from '@/components/cards/UnitCard.vue'

const unitsStore = useUnitsStore()
const ui = useUiStore()

// Error handling
const { handleLoadingError, handleDeleteError } = useErrorHandler()

// ✅ RBAC: используем permissions
const { can, canExportReports } = usePermissions()
const canEdit = computed(() => can('units', 'edit'))

const modalOpen = ref(false)
const current = ref<Unit | null>(null)

const modalTitle = computed(() => {
  return current.value ? 'Редактировать единицу измерения' : 'Добавить единицу измерения'
})

// GenericList configuration
const listConfig = computed<GenericListConfig<Unit>>(() => ({
  title: 'Единицы измерения',
  subtitle: 'Управление базовыми единицами для материалов и закупок',
  icon: 'straighten',
  showCreate: canEdit.value,
  createText: 'Добавить единицу',
  canCreate: canEdit.value,
  showStats: true,
  exportable: canExportReports.value, // ✅ RBAC: контроль экспорта через permissions
  exportFilename: 'units',
  exportUrl: '/api/v1/units/',
  loadingText: 'Загрузка единиц измерения...',
  emptyText: 'Нет единиц измерения',
  emptyTitle: 'Нет единиц измерения',
  emptySubtitle: 'Создайте первую единицу измерения для начала работы',
  filterColumns: 3,
  columns: [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Название', sortable: true },
    { key: 'code', label: 'Код', sortable: true },
    { key: 'smart_conversion', label: 'Умная конвертация', sortable: false }
  ],
  filters: [
    {
      key: 'search',
      type: 'text',
      label: 'Поиск',
      placeholder: 'Название, код'
    },
    {
      key: 'code',
      type: 'text',
      label: 'Код',
      placeholder: 'Код единицы'
    },
    {
      key: 'name',
      type: 'text',
      label: 'Название',
      placeholder: 'Название единицы'
    }
  ],
  actions: [
    {
      key: 'edit',
      label: 'Редактировать',
      class: 'btn-outline',
      disabled: () => !canEdit.value
    },
    {
      key: 'delete',
      label: 'Удалить',
      class: 'btn-error',
      disabled: () => !canEdit.value,
      confirm: (item: Unit) => {
        const isSmartUnit = isUsedInSmartConversion(item.code)
        let message = `Удалить единицу измерения "${item.name}" (${item.code})?`
        
        if (isSmartUnit) {
          message += `\n\nВНИМАНИЕ: Эта единица поддерживает умную конвертацию!\nУдаление может нарушить работу автоматического округления значений.\n\nРекомендуется оставить единицу для корректной работы системы.`
        }
        
        return message
      }
    }
  ],
  mobileCardComponent: UnitCard,
  mobileCardProp: 'unit',
  defaultSort: 'id',
  defaultSortOrder: 'asc'
}))

// Methods
function openCreate() {
  current.value = null
  modalOpen.value = true
}

function openEdit(unit: Unit) {
  current.value = unit
  modalOpen.value = true
}

async function onSaved() {
  modalOpen.value = false
  ui.toast({ type: 'success', text: 'Единица измерения сохранена' })
  await unitsStore.fetchList()
}

async function handleExport(format: 'csv' | 'excel' | 'pdf') {
  try {
    const data = unitsStore.items
    const filename = `units_${new Date().toISOString().split('T')[0]}`

    switch (format) {
      case 'csv':
        exportToCSV(data, filename)
        break
      case 'excel':
        exportToExcel(data, filename)
        break
      case 'pdf':
        exportToPDF(data, filename)
        break
    }
  } catch (error) {
    await handleLoadingError(error, 'units')
  }
}

async function handleAction(action: string, item: Unit) {
  switch (action) {
    case 'edit':
      openEdit(item)
      break
    case 'delete':
      await handleDelete(item)
      break
  }
}

async function handleDelete(unit: Unit) {
  // Проверяем, используется ли единица в умной конвертации
  const isSmartUnit = isUsedInSmartConversion(unit.code)
  
  let confirmMessage = `Удалить единицу измерения "${unit.name}" (${unit.code})?`
  
  if (isSmartUnit) {
    confirmMessage += `\n\nВНИМАНИЕ: Эта единица поддерживает умную конвертацию!`
    confirmMessage += `\nУдаление может нарушить работу автоматического округления значений.`
    confirmMessage += `\n\nРекомендуется оставить единицу для корректной работы системы.`
  }
  
  if (!confirm(confirmMessage)) {return}
  
  // Дополнительное подтверждение для умных единиц
  if (isSmartUnit) {
    const doubleConfirm = confirm(`Вы уверены, что хотите удалить единицу "${unit.name}"?\n\nЭто может нарушить работу умной конвертации!`)
    if (!doubleConfirm) {return}
  }
  
  try {
    await unitsStore.remove(unit.id)
    ui.toast({ type: 'success', text: `Единица измерения "${unit.name}" удалена` })
  } catch (error) {
    await handleDeleteError(error, 'unit', unit.id)
  }
}

// Функция для проверки поддержки умной конвертации
function isUsedInSmartConversion(unitCode: string): boolean {
  // Единицы, поддерживаемые умной конвертацией (из бэкенда)
  const smartConversionUnits = [
    // Масса
    'г', 'кг', 'т',
    // Длина
    'мм', 'см', 'м', 'км',
    // Площадь
    'см²', 'м²', 'га',
    // Объем
    'см³', 'м³', 'л', 'мл'
  ]
  
  return smartConversionUnits.includes(unitCode)
}

// Lifecycle
onMounted(async () => {
  try {
    await unitsStore.fetchList()
  } catch (error) {
    await handleLoadingError(error, 'units')
  }
})
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>