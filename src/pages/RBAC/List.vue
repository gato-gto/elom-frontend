<template>
  <div class="list-container">
    <!-- Header -->
    <ListHeader
      :title="'Управление ролями'"
      :subtitle="'Создание и редактирование ролей с назначением разрешений'"
      :icon="'shield'"
      :show-create="canCreate"
      :create-text="'Создать роль'"
      :can-create="canCreate"
      :loading="rbacStore.loading"
      :show-stats="true"
      :total-count="roles.length"
      :filtered-count="filteredRoles.length"
      @create="openCreate"
    >
      <template #actions>
        <button
          @click="handleRefresh"
          class="btn btn-sm btn-outline"
          :disabled="rbacStore.loading"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Обновить
        </button>
      </template>
    </ListHeader>

    <!-- Filters -->
    <FilterPanel
      :columns="2"
      :loading="rbacStore.loading"
      @reset="handleResetFilters"
    >
      <FilterField
        v-model="filters.search"
        type="text"
        label="Поиск"
        placeholder="Название, описание роли"
        @update:model-value="handleFilterChange"
      />
      <FilterField
        v-model="filters.is_system"
        type="select"
        label="Тип роли"
        :options="roleTypeOptions"
        @update:model-value="handleFilterChange"
      />
    </FilterPanel>

    <!-- Error message -->
    <div v-if="rbacStore.error" class="alert alert-error">
      <span>{{ rbacStore.error }}</span>
      <button class="btn btn-sm btn-ghost" @click="rbacStore.error = null">×</button>
    </div>

    <!-- Loading -->
    <LoadingSpinner
      v-if="rbacStore.loading && roles.length === 0"
      size="lg"
      variant="primary"
      text="Загрузка ролей..."
      :overlay="false"
    />

    <!-- Table -->
    <div v-else class="table-container">
      <table class="modern-table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Описание</th>
            <th>Разрешения</th>
            <th>Тип</th>
            <th>Статус</th>
            <th class="text-right">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="role in filteredRoles" :key="role.id">
            <td>
              <div class="font-medium">{{ role.display_name }}</div>
              <div class="text-xs text-muted">{{ role.name }}</div>
            </td>
            <td>
              <div class="text-sm">{{ role.description || '—' }}</div>
            </td>
            <td>
              <div class="flex items-center gap-2">
                <span class="badge badge-primary badge-sm font-mono">
                  {{ getRolePermissionsCount(role.id) }} разрешений
                </span>
                <button
                  v-if="canManage"
                  @click="viewPermissions(role)"
                  class="btn btn-xs btn-ghost"
                >
                  Просмотр
                </button>
              </div>
            </td>
            <td>
              <span v-if="role.is_system" class="badge badge-info badge-sm">Системная</span>
              <span v-else class="badge badge-ghost badge-sm">Пользовательская</span>
            </td>
            <td>
              <span class="badge badge-success badge-sm">Активна</span>
            </td>
            <td class="text-right">
              <div class="flex gap-1 justify-end">
                <!-- Системную роль нельзя менять/удалять через API (права задаются init_rbac),
                     поэтому для неё показываем только «Просмотр» — без вводящих в заблуждение кнопок. -->
                <button
                  v-if="canManage && !role.is_system"
                  @click="openEdit(role)"
                  class="btn btn-xs btn-outline"
                >
                  Редактировать
                </button>
                <button
                  v-if="canManage && !role.is_system"
                  @click="handleDelete(role)"
                  class="btn btn-xs btn-error"
                >
                  Удалить
                </button>
                <span v-if="role.is_system" class="text-xs text-subtle">системная — только просмотр</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty state -->
      <div v-if="filteredRoles.length === 0 && !rbacStore.loading" class="text-center py-12">
        <svg class="w-16 h-16 mx-auto mb-4 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
        <p class="text-muted font-medium text-lg">Нет ролей</p>
        <p class="text-sm text-subtle mt-2">
          {{ filters.search || filters.is_system ? 'Попробуйте изменить фильтры' : 'Создайте первую роль для начала работы' }}
        </p>
        <button
          v-if="canCreate && !filters.search && !filters.is_system"
          @click="openCreate"
          class="btn btn-primary btn-sm mt-4"
        >
          Создать роль
        </button>
      </div>
    </div>

    <!-- Modal for Role Form -->
    <Modal v-model="modalOpen" :title="modalTitle" size="6xl" :closable="true">
      <RoleForm :initial="current" @saved="onSaved" @cancel="modalOpen = false" />
    </Modal>

    <!-- Modal for Permissions View -->
    <Modal v-model="permissionsModalOpen" :title="permissionsModalTitle" size="4xl" :closable="true">
      <div v-if="viewingRole" class="space-y-4">
        <div class="alert alert-info">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <div class="font-semibold">Разрешения роли "{{ viewingRole.display_name }}"</div>
            <div class="text-sm">Всего разрешений: <span class="font-mono">{{ viewingRolePermissions.length }}</span></div>
          </div>
        </div>
        
        <div class="space-y-2">
          <div
            v-for="permission in viewingRolePermissions"
            :key="permission.id"
            class="flex items-center gap-2 p-2 bg-base-200 rounded"
          >
            <span class="font-medium">{{ permission.name }}</span>
            <span class="text-xs text-muted">({{ permission.codename }})</span>
          </div>
        </div>

        <div v-if="viewingRolePermissions.length === 0" class="text-center py-8 text-subtle">
          <p>У роли нет назначенных разрешений</p>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRbacStore } from '@/stores/rbac'
import { usePermissions } from '@/composables/usePermissions'
import { useUiStore } from '@/stores/ui'
import { parseApiError } from '@/utils/errorHandler'
import type { Role, RoleWithPermissions } from '@/api/types/rbac'
import Modal from '@/components/Modal.vue'
import RoleForm from './RoleForm.vue'
import ListHeader from '@/components/ListHeader.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import FilterField from '@/components/FilterField.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const rbacStore = useRbacStore()
const ui = useUiStore()
const { canManageRoles } = usePermissions()

const canManage = computed(() => canManageRoles.value === true)
const canCreate = computed(() => canManageRoles.value === true)

const modalOpen = ref(false)
const permissionsModalOpen = ref(false)
const current = ref<Role | null>(null)
const viewingRole = ref<RoleWithPermissions | null>(null)

const filters = ref({
  search: '',
  is_system: ''
})

const roleTypeOptions = [
  { value: '', label: 'Все роли' },
  { value: 'true', label: 'Системные' },
  { value: 'false', label: 'Пользовательские' }
]

const modalTitle = computed(() => {
  return current.value ? 'Редактировать роль' : 'Создать роль'
})

const permissionsModalTitle = computed(() => {
  return viewingRole.value ? `Разрешения роли "${viewingRole.value.display_name}"` : 'Разрешения роли'
})

const roles = computed(() => {
  return rbacStore.roles
})

const filteredRoles = computed(() => {
  let result = roles.value

  // Фильтр по поиску
  if (filters.value.search.trim()) {
    const query = filters.value.search.toLowerCase()
    result = result.filter(role =>
      role.display_name.toLowerCase().includes(query) ||
      role.name.toLowerCase().includes(query) ||
      (role.description && role.description.toLowerCase().includes(query))
    )
  }

  // Фильтр по типу
  if (filters.value.is_system) {
    const isSystem = filters.value.is_system === 'true'
    result = result.filter(role => role.is_system === isSystem)
  }

  return result
})

const viewingRolePermissions = computed(() => {
  if (!viewingRole.value) {return []}
  return viewingRole.value.permissions || []
})

const getRolePermissionsCount = (roleId: number): number => {
  // Проверяем кэш деталей роли
  const roleDetails = rbacStore.roleDetails[roleId]
  if (roleDetails && roleDetails.permissions) {
    return roleDetails.permissions.length
  }
  
  // Если детали не загружены, пытаемся найти роль в списке
  // (API может возвращать роли с permissions в некоторых случаях)
  const role = rbacStore.getRoleById(roleId)
  if (role && 'permissions' in role && Array.isArray((role as any).permissions)) {
    return (role as any).permissions.length
  }
  
  // Если ничего не найдено, возвращаем 0
  return 0
}

// Methods
function openCreate() {
  current.value = null
  modalOpen.value = true
}

function openEdit(role: Role) {
  current.value = role
  modalOpen.value = true
}

async function viewPermissions(role: Role) {
  try {
    // Загружаем детали роли с разрешениями
    const roleDetails = await rbacStore.fetchRoleWithPermissions(role.id)
    viewingRole.value = roleDetails
    permissionsModalOpen.value = true
  } catch (error: any) {
    const parsedError = parseApiError(error)
    ui.toast({
      type: 'error',
      text: `Не удалось загрузить разрешения: ${parsedError.detail}`
    })
  }
}

async function handleDelete(role: Role) {
  if (!confirm(`Удалить роль "${role.display_name}"?\n\nЭто действие нельзя отменить.`)) {
    return
  }

  try {
    await rbacStore.deleteRole(role.id)
    ui.toast({
      type: 'success',
      text: `Роль "${role.display_name}" удалена`
    })
  } catch (error: any) {
    const parsedError = parseApiError(error)
    ui.toast({
      type: 'error',
      text: `Не удалось удалить роль: ${parsedError.detail}`
    })
  }
}

async function handleRefresh() {
  try {
    await rbacStore.fetchRoles()
    ui.toast({
      type: 'success',
      text: 'Список ролей обновлен'
    })
  } catch (error: any) {
    const parsedError = parseApiError(error)
    ui.toast({
      type: 'error',
      text: `Не удалось обновить список: ${parsedError.detail}`
    })
  }
}

function handleFilterChange() {
  // Фильтры применяются автоматически через computed
}

function handleResetFilters() {
  filters.value = {
    search: '',
    is_system: ''
  }
}

async function onSaved() {
  modalOpen.value = false
  ui.toast({
    type: 'success',
    text: 'Роль сохранена'
  })
  // Перезагружаем список ролей
  await rbacStore.fetchRoles()
}

// Lifecycle
onMounted(async () => {
  try {
    // Загружаем роли
    if (rbacStore.roles.length === 0) {
      await rbacStore.fetchRoles()
    }
    // Загружаем разрешения для отображения количества
    if (rbacStore.permissions.length === 0) {
      await rbacStore.fetchPermissions()
    }
  } catch (error: any) {
    const parsedError = parseApiError(error)
    ui.toast({
      type: 'error',
      text: `Ошибка загрузки: ${parsedError.detail}`
    })
  }
})
</script>

<style scoped>
.list-container {
  @apply w-full;
}
</style>
