<template>
  <div class="permission-assignment">
    <!-- Header -->
    <div class="mb-4">
      <label class="label">
        <span class="label-text font-semibold">Разрешения роли</span>
        <span class="label-text-alt text-base-content/70">
          Выберите разрешения для роли. Разрешения сгруппированы по ресурсам.
        </span>
      </label>
    </div>

    <!-- Search and Filter -->
    <div class="mb-4 space-y-2">
      <div class="form-control">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск разрешений..."
          class="input input-bordered input-sm w-full"
        />
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="resource in availableResources"
          :key="resource"
          @click="toggleResourceFilter(resource)"
          class="btn btn-xs"
          :class="resourceFilter === resource ? 'btn-primary' : 'btn-outline'"
        >
          {{ getResourceDisplayName(resource) }}
        </button>
        <button
          v-if="resourceFilter"
          @click="resourceFilter = null"
          class="btn btn-xs btn-ghost"
        >
          Сбросить фильтр
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md"></span>
      <span class="ml-3 text-base-content/70">Загрузка разрешений...</span>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="alert alert-error mb-4">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <div class="flex-1">
        <div class="font-semibold">Ошибка загрузки разрешений</div>
        <div class="text-sm">{{ error }}</div>
      </div>
      <button @click="handleRefreshPermissions" class="btn btn-sm btn-ghost">Повторить</button>
    </div>

    <!-- Permissions grouped by resource -->
    <div v-else class="space-y-4">
      <template v-for="resource in filteredResources" :key="resource">
        <div class="card bg-base-200">
          <div class="card-body p-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="card-title text-base">
                {{ getResourceDisplayName(resource) }}
                <span class="badge badge-sm badge-primary">
                  {{ getResourcePermissions(resource).length }}
                </span>
              </h3>
              <div class="flex items-center gap-2">
                <span class="text-xs text-base-content/70">
                  {{ getSelectedCountForResource(resource) }} / {{ getResourcePermissions(resource).length }}
                </span>
                <button
                  @click="toggleResourceAll(resource)"
                  class="btn btn-xs btn-ghost"
                  :disabled="!canManage"
                >
                  {{ isResourceAllSelected(resource) ? 'Снять все' : 'Выбрать все' }}
                </button>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <label
                v-for="permission in getResourcePermissions(resource)"
                :key="permission.id"
                class="flex items-start gap-2 p-2 rounded-lg hover:bg-base-300 cursor-pointer transition-colors"
                :class="{ 'bg-base-300': isPermissionSelected(permission.id) }"
              >
                <input
                  type="checkbox"
                  :checked="isPermissionSelected(permission.id)"
                  :disabled="!canManage"
                  @change="togglePermission(permission.id)"
                  class="checkbox checkbox-primary checkbox-sm mt-0.5"
                />
                <div class="flex-1">
                  <div class="font-medium text-sm">{{ permission.name }}</div>
                  <div class="text-xs text-base-content/60">{{ permission.codename }}</div>
                  <div v-if="permission.description" class="text-xs text-base-content/50 mt-1">
                    {{ permission.description }}
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </template>

      <!-- No permissions message -->
      <div v-if="filteredPermissions.length === 0" class="text-center py-8 text-base-content/50">
        <svg class="w-12 h-12 mx-auto mb-3 text-base-content/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        <p class="text-base-content/70 font-medium">Нет доступных разрешений</p>
        <p class="text-sm text-base-content/50 mt-1">
          {{ searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Разрешения могут быть еще не загружены' }}
        </p>
      </div>
    </div>

    <!-- Selected permissions summary -->
    <div v-if="selectedPermissionIds.length > 0" class="mt-4 p-3 bg-base-200 rounded-lg">
      <div class="text-sm font-semibold mb-2">
        Выбрано разрешений: {{ selectedPermissionIds.length }} из {{ allPermissions.length }}
      </div>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="permId in selectedPermissionIds.slice(0, 10)"
          :key="permId"
          class="badge badge-primary badge-sm"
        >
          {{ getPermissionDisplayName(permId) }}
        </span>
        <span v-if="selectedPermissionIds.length > 10" class="badge badge-ghost badge-sm">
          +{{ selectedPermissionIds.length - 10 }} еще
        </span>
      </div>
    </div>

    <!-- Help text -->
    <div class="mt-4 text-xs text-base-content/60 border-t border-base-300 pt-3">
      <p class="flex items-start gap-2">
        <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>
          Разрешения определяют, какие действия может выполнять пользователь с ролью.
          Разрешения сгруппированы по ресурсам (материалы, закупки, объекты и т.д.).
        </span>
      </p>
      <p v-if="!canManage" class="mt-2 text-warning flex items-start gap-2">
        <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <span>
          Для управления разрешениями требуется разрешение <code class="bg-base-300 px-1 rounded text-xs">rbac.manage_roles</code>
        </span>
      </p>
      <p v-if="props.disabled" class="mt-2 text-base-content/50 flex items-start gap-2">
        <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        <span>Редактирование разрешений отключено</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRbacStore } from '@/stores/rbac'
import { parseApiError } from '@/utils/errorHandler'
import { usePermissions } from '@/composables/usePermissions'
import type { Permission } from '@/api/types/rbac'

interface Props {
  selectedPermissionIds?: number[]  // Предвыбранные разрешения
  disabled?: boolean
}

interface Emits {
  (e: 'update:selectedPermissionIds', value: number[]): void
  (e: 'change', permissionIds: number[]): void
}

const props = withDefaults(defineProps<Props>(), {
  selectedPermissionIds: () => [],
  disabled: false
})

const emit = defineEmits<Emits>()

const rbacStore = useRbacStore()
const { canManageRoles } = usePermissions()

const canManage = computed(() => canManageRoles.value === true && !props.disabled)

// Local state
const loading = ref(false)
const error = ref<string | null>(null)
const localSelectedPermissionIds = ref<number[]>([])
const searchQuery = ref('')
const resourceFilter = ref<string | null>(null)

// Sync with prop
watch(() => props.selectedPermissionIds, (newVal) => {
  localSelectedPermissionIds.value = [...newVal]
}, { immediate: true })

// Load permissions on mount
onMounted(async () => {
  const currentPermissions = rbacStore.permissions
  if (currentPermissions.length === 0) {
    loading.value = true
    try {
      await rbacStore.fetchPermissions()
    } catch (err: any) {
      const parsedError = parseApiError(err)
      error.value = parsedError.detail
    } finally {
      loading.value = false
    }
  }
})

// Computed
const allPermissions = computed(() => {
  return rbacStore.permissions.filter(p => p.is_active)
})

const filteredPermissions = computed(() => {
  let permissions = allPermissions.value

  // Фильтр по ресурсу
  if (resourceFilter.value) {
    permissions = permissions.filter(p => p.resource === resourceFilter.value)
  }

  // Поиск
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    permissions = permissions.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.codename.toLowerCase().includes(query) ||
      p.resource.toLowerCase().includes(query) ||
      p.action.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query))
    )
  }

  return permissions
})

const availableResources = computed(() => {
  return rbacStore.getResources()
})

const filteredResources = computed(() => {
  const resources = new Set(filteredPermissions.value.map(p => p.resource))
  return Array.from(resources).sort()
})

const getResourcePermissions = (resource: string): Permission[] => {
  return filteredPermissions.value.filter(p => p.resource === resource)
}

const getResourceDisplayName = (resource: string): string => {
  const resourceNames: Record<string, string> = {
    materials: 'Материалы',
    purchases: 'Закупки',
    objects: 'Объекты',
    employees: 'Сотрудники',
    suppliers: 'Поставщики',
    stock: 'Склад',
    writeoffs: 'Списания',
    tools: 'Инструменты',
    reports: 'Отчеты',
    rbac: 'RBAC',
    units: 'Единицы измерения',
    material_categories: 'Категории материалов',
  }
  return resourceNames[resource] || resource
}

const isPermissionSelected = (permissionId: number): boolean => {
  return localSelectedPermissionIds.value.includes(permissionId)
}

const getSelectedCountForResource = (resource: string): number => {
  const resourcePerms = getResourcePermissions(resource)
  return resourcePerms.filter(p => isPermissionSelected(p.id)).length
}

const isResourceAllSelected = (resource: string): boolean => {
  const resourcePerms = getResourcePermissions(resource)
  if (resourcePerms.length === 0) return false
  return resourcePerms.every(p => isPermissionSelected(p.id))
}

const getPermissionDisplayName = (permissionId: number): string => {
  const permission = rbacStore.getPermissionById(permissionId)
  return permission?.name || permission?.codename || `Разрешение #${permissionId}`
}

// Methods
const togglePermission = (permissionId: number) => {
  if (!canManage.value) return

  const index = localSelectedPermissionIds.value.indexOf(permissionId)
  if (index > -1) {
    localSelectedPermissionIds.value = localSelectedPermissionIds.value.filter(id => id !== permissionId)
  } else {
    localSelectedPermissionIds.value = [...localSelectedPermissionIds.value, permissionId]
  }

  emit('update:selectedPermissionIds', localSelectedPermissionIds.value)
  emit('change', localSelectedPermissionIds.value)
}

const toggleResourceAll = (resource: string) => {
  if (!canManage.value) return

  const resourcePerms = getResourcePermissions(resource)
  const allSelected = isResourceAllSelected(resource)

  if (allSelected) {
    // Снять все
    const resourcePermIds = resourcePerms.map(p => p.id)
    localSelectedPermissionIds.value = localSelectedPermissionIds.value.filter(
      id => !resourcePermIds.includes(id)
    )
  } else {
    // Выбрать все
    const resourcePermIds = resourcePerms.map(p => p.id)
    const newIds = [...new Set([...localSelectedPermissionIds.value, ...resourcePermIds])]
    localSelectedPermissionIds.value = newIds
  }

  emit('update:selectedPermissionIds', localSelectedPermissionIds.value)
  emit('change', localSelectedPermissionIds.value)
}

const toggleResourceFilter = (resource: string) => {
  resourceFilter.value = resourceFilter.value === resource ? null : resource
}

const handleRefreshPermissions = async () => {
  loading.value = true
  error.value = null
  try {
    await rbacStore.fetchPermissions()
  } catch (err: any) {
    const parsedError = parseApiError(err)
    error.value = parsedError.detail
  } finally {
    loading.value = false
  }
}

// Watch for external changes
watch(() => props.selectedPermissionIds, (newVal) => {
  if (JSON.stringify(newVal) !== JSON.stringify(localSelectedPermissionIds.value)) {
    localSelectedPermissionIds.value = [...newVal]
  }
})
</script>

<style scoped>
.permission-assignment {
  @apply w-full;
}
</style>
