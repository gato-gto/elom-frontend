<template>
  <div class="list-container">
    <!-- GenericList Component -->
    <GenericList
      :store="employeesStore"
      :config="listConfig"
      @create="openCreate"
      @action="handleAction"
    >
      <!-- Custom column for roles with badges -->
      <template #column-roles="{ item }">
        <div class="flex flex-wrap gap-1">
          <!-- ✅ RBAC роли (поле role удалено, используем roles) -->
          <template v-if="item.roles && item.roles.length > 0">
            <span
              v-for="role in item.roles"
              :key="role.id"
              class="badge badge-primary badge-sm"
              :title="role.name"
            >
              {{ role.display_name }}
            </span>
          </template>
          <span v-else class="badge badge-ghost badge-sm">Нет ролей</span>
        </div>
      </template>

      <!-- Custom column for status with badge -->
      <template #column-is_active="{ value }">
        <div class="badge" :class="value ? 'badge-success' : 'badge-error'">
          {{ value ? 'Активный' : 'Неактивный' }}
        </div>
      </template>
    </GenericList>

    <!-- Modal -->
    <Modal v-model="modalOpen" :title="modalTitle" size="6xl" :closable="true">
      <EmployeeForm :initial="current" @saved="onSaved" @cancel="modalOpen=false"/>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEmployeesStore } from '@/stores/employees'
import { usePermissions } from '@/composables/usePermissions'
import { useRbacStore } from '@/stores/rbac'
import { useUiStore } from '@/stores/ui'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useEditQuery } from '@/composables/useEditQuery'
import type { Employee } from '@/api/types'
import type { GenericListConfig } from '@/types/generic'
import Modal from '@/components/Modal.vue'
import EmployeeForm from './EmployeeForm.vue'
import GenericList from '@/components/GenericList.vue'
import EmployeeCard from '@/components/cards/EmployeeCard.vue'

const employeesStore = useEmployeesStore()
const ui = useUiStore()

// Error handling
const { handleLoadingError, handleDeleteError } = useErrorHandler()

// ✅ RBAC: используем permissions
const { can, canExportReports } = usePermissions()
const canEdit = computed(() => can('employees', 'edit'))
// F-867: фильтр по RBAC-роли доступен лишь тем, кто может читать /rbac/roles/ (rbac.manage_roles ИЛИ
// manage_user_roles) — иначе fetchRoles даёт 403 (F-559). Обычно = администратор.
const rbacStore = useRbacStore()
const canFilterByRole = computed(() => can('rbac', 'manage_roles') || can('rbac', 'manage_user_roles'))
const roleFilterOptions = computed(() => [
  { value: '', label: 'Все роли' },
  ...rbacStore.roles.map(r => ({ value: r.id, label: r.name })),
])

const modalOpen = ref(false)
const current = ref<Employee | null>(null)

const modalTitle = computed(() => {
  return current.value ? 'Редактировать сотрудника' : 'Добавить сотрудника'
})

// ✅ Фильтр по role удален - поле role удалено из модели
// Filter options больше не нужны для фильтрации по role
// TODO: Можно добавить фильтр по RBAC ролям через user_roles__role__name в будущем

const statusFilterOptions = computed(() => [
  { value: '', label: 'Все статусы' },
  { value: 'true', label: 'Активный' },
  { value: 'false', label: 'Неактивный' }
])

// GenericList configuration
const listConfig = computed<GenericListConfig<Employee>>(() => ({
  title: 'Сотрудники',
  subtitle: 'Управление пользователями системы и их ролями',
  icon: 'people',
  showCreate: true, // Видимость контролируется через canCreate и resource
  createText: 'Добавить сотрудника',
  canCreate: canEdit.value, // Оставляем для обратной совместимости
  showStats: true,
  // F-861: кнопка экспорта убрана — у /employees/ нет бэкенд-экспорта (?export=xlsx → JSON), а
  // локальный фолбэк выгружал лишь текущую страницу (≤20) = неполно. Вернуть при добавлении BE-экспорта.
  exportable: false,
  loadingText: 'Загрузка сотрудников...',
  emptyText: 'Нет сотрудников',
  emptyTitle: 'Нет сотрудников',
  emptySubtitle: 'Создайте первого сотрудника для начала работы',
  filterColumns: 3,
  // ✅ RBAC: Указываем ресурс для автоматического определения permissions
  resource: 'employees',
  columns: [
    { key: 'username', label: 'Логин', sortable: true },
    { key: 'first_name', label: 'Имя', sortable: true },
    { key: 'last_name', label: 'Фамилия', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    // ✅ Колонка role удалена - отображение через column-role template с roles (RBAC)
    { key: 'roles', label: 'Роли', sortable: false }, // Отображение через custom template
    { key: 'is_active', label: 'Статус', sortable: true }
  ],
  filters: [
    {
      key: 'search',
      type: 'text',
      label: 'Поиск',
      placeholder: 'Имя, email'
    },
    // F-867: фильтр по RBAC-роли (?role=<id>). Показываем только тем, кто может читать роли —
    // иначе скрыт (без 403 на /rbac/roles/).
    ...(canFilterByRole.value ? [{
      key: 'role',
      type: 'select' as const,
      label: 'Роль',
      options: roleFilterOptions.value,
    }] : []),
    {
      key: 'is_active',
      type: 'select',
      label: 'Статус',
      options: statusFilterOptions.value
    }
  ],
  actions: [
    {
      key: 'edit',
      label: 'Редактировать',
      class: 'btn-outline',
      // ✅ RBAC: Permission будет автоматически определен как 'employees.edit'
      // через resource, но можно указать явно или для кастомных случаев
      disabled: () => !canEdit.value
    },
    {
      key: 'delete',
      label: 'Удалить',
      class: 'btn-error',
      // ✅ RBAC: Permission будет автоматически определен как 'employees.delete'
      disabled: () => !canEdit.value,
      confirm: (item: Employee) => `Удалить сотрудника "${item.first_name} ${item.last_name}"?`
    }
  ],
  mobileCardComponent: EmployeeCard,
  mobileCardProp: 'employee',
  defaultSort: 'id',
  defaultSortOrder: 'asc'
}))

// Methods
function openCreate() {
  current.value = null
  modalOpen.value = true
}

function openEdit(employee: Employee) {
  current.value = employee
  modalOpen.value = true
}

async function onSaved() {
  modalOpen.value = false
  ui.toast({ type: 'success', text: 'Сотрудник сохранен' })
  // ✅ RBAC: Перезагружаем список сотрудников для отображения обновленных ролей
  // (колонка «Роли» — из item.roles ответа /employees/; каталог /rbac/roles/ здесь не нужен).
  await employeesStore.fetchList()
}

async function handleAction(action: string, item: Employee) {
  switch (action) {
    case 'edit':
      openEdit(item)
      break
    case 'delete':
      await handleDelete(item)
      break
  }
}

async function handleDelete(employee: Employee) {
  if (!confirm(`Удалить сотрудника "${employee.first_name} ${employee.last_name}"?`)) { return }
  
  try {
    await employeesStore.remove(employee.id)
    ui.toast({ type: 'success', text: `Сотрудник "${employee.first_name} ${employee.last_name}" удален` })
  } catch (error) {
    await handleDeleteError(error, 'employee', employee.id)
  }
}

// Lifecycle
onMounted(async () => {
  try {
    // F-867: каталог ролей для фильтра грузим ТОЛЬКО если есть право читать /rbac/roles/.
    // F-559: иначе ungated fetchRoles() давал 403 (+console error) не-admin ролям. Колонка «Роли»
    // рендерится из item.roles (встроены в ответ /employees/) и от этого не зависит.
    if (canFilterByRole.value) { rbacStore.fetchRoles().catch(() => {}) }
    await employeesStore.fetchList()
  } catch (error) {
    await handleLoadingError(error, 'employees')
  }
})

// F-507: /:id/edit ведёт сюда с ?edit=:id — открываем модалку уже с записью
// (форма получает данные только через :initial, роутом рендерилась пустой — см. F-505).
useEditQuery(employeesStore, openEdit)
</script>

<style scoped>
/* Все анимации теперь в @/styles/animations.css */
</style>