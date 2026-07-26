// src/stores/permissions.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { parseApiError } from '@/utils/errorHandler'
import type { Permission, Role, UserPermissionsResponse } from '@/api/types/rbac'
import { useAuthStore } from './auth'
import { useUiStore } from './ui'

/**
 * Store для управления разрешениями пользователя
 * 
 * ВАЖНО: Роли хранятся только для отображения в UI.
 * Логика доступа основана на permissions, а не на именах ролей!
 */
export const usePermissionsStore = defineStore('permissions', () => {
  const permissions = ref<Permission[]>([])
  const roles = ref<Role[]>([])  // Только для отображения в UI!
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetch = ref<Date | null>(null)
  
  // Время кэширования разрешений (5 минут)
  const CACHE_TIME = 5 * 60 * 1000

  // F-074: суперпользователь Django имеет все права, даже без RBAC-роли.
  // Раньше nav/guard/кнопки проверяли только permissions → чистый суперпользователь
  // (без роли) получал пустую навигацию и его выкидывало со всех маршрутов.
  const isSuperuser = computed<boolean>(() => {
    try {
      return !!useAuthStore().me?.is_superuser
    } catch {
      return false
    }
  })

  // F-525: права загружены хотя бы раз (или суперюзер — ему права не нужны). Пока false,
  // навигация не должна показывать «пустое меню»: строится синхронным computed, а fetch —
  // асинхронный, поэтому при холодной загрузке меню фильтровалось по ещё пустым правам.
  const ready = computed<boolean>(() => isSuperuser.value || lastFetch.value !== null)
  
  /**
   * Загрузить разрешения пользователя из API
   * 
   * @param force - Принудительное обновление (игнорировать кэш)
   */
  const fetchPermissions = async (force = false): Promise<void> => {
    // F-069: без токена не запрашиваем my-permissions (иначе 401 на странице логина)
    if (typeof localStorage !== 'undefined' && !localStorage.getItem('elom_access')) {
      return
    }
    // Проверка кэша
    if (!force && lastFetch.value) {
      const cacheAge = Date.now() - lastFetch.value.getTime()
      if (cacheAge < CACHE_TIME) {
        return  // Используем кэш
      }
    }
    
    loading.value = true
    error.value = null
    
    try {
      const { data } = await api.get<UserPermissionsResponse>(
        endpoints.rbac.myPermissions
      )
      
      permissions.value = data.permissions || []
      roles.value = data.roles || []  // Сохраняем для UI, но не используем для логики!
      lastFetch.value = new Date()
    } catch (err: any) {
      const parsedError = parseApiError(err)
      error.value = parsedError.detail
      console.error('Failed to fetch permissions:', err)
      // При ошибке не очищаем кэш - используем старые данные.
      // EH-FE-15 (F-555): но на ПЕРВОЙ загрузке (кэша нет) молчание = пользователь без прав
      // и с пустой навигацией без объяснения — даём явный сигнал. Фоновые refresh тихие.
      if (!lastFetch.value) {
        useUiStore().toast({ type: 'error', text: 'Не удалось загрузить права — часть функций может быть скрыта' })
      }
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Проверить, есть ли у пользователя разрешение
   * 
   * @param codename - Код разрешения (например: 'materials.create')
   */
  const hasPermission = computed(() => (codename: string): boolean => {
    if (isSuperuser.value) { return true }
    return permissions.value.some(p => p.codename === codename)
  })
  
  /**
   * Проверить, есть ли хотя бы одно из разрешений
   * 
   * @param codenames - Массив кодов разрешений
   */
  const hasAnyPermission = computed(() => (...codenames: string[]): boolean => {
    if (isSuperuser.value) { return true }
    const permissionCodenames = new Set(permissions.value.map(p => p.codename))
    return codenames.some(codename => permissionCodenames.has(codename))
  })
  
  /**
   * Проверить, есть ли все указанные разрешения
   * 
   * @param codenames - Массив кодов разрешений
   */
  const hasAllPermissions = computed(() => (...codenames: string[]): boolean => {
    if (isSuperuser.value) { return true }
    const permissionCodenames = new Set(permissions.value.map(p => p.codename))
    return codenames.every(codename => permissionCodenames.has(codename))
  })
  
  /**
   * Проверить доступ к ресурсу с действием
   * 
   * @param resource - Ресурс (например: 'materials')
   * @param action - Действие (например: 'create')
   */
  const can = computed(() => (resource: string, action: string): boolean => {
    return hasPermission.value(`${resource}.${action}`)
  })
  
  /**
   * Очистить кэш разрешений
   */
  const clearCache = (): void => {
    permissions.value = []
    roles.value = []
    lastFetch.value = null
  }
  
  return {
    // State
    permissions,
    roles,  // Только для отображения в UI!
    loading,
    error,
    
    // Actions
    fetchPermissions,
    clearCache,
    
    // Getters (computed)
    ready,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
  }
})
