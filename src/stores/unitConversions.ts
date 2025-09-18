// src/stores/unitConversions.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/client'
import endpoints, { buildQuery } from '@/api/endpoints'
import type { 
  PageResponse, 
  UnitConversion, 
  UnitConversionRequest, 
  PatchedUnitConversionRequest,
  Unit,
  ID 
} from '@/api/types'

export const useUnitConversionsStore = defineStore('unitConversions', () => {
  const items = ref<UnitConversion[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Пагинация
  const pagination = ref({
    page: 1,
    pageSize: 20,
    count: 0
  })

  // Геттеры
  const activeConversions = computed(() => 
    items.value.filter(conversion => conversion.is_active)
  )

  // Получить все возможные конвертации для единицы
  const getConversionsForUnit = computed(() => (unitId: ID) => {
    return activeConversions.value.filter(conversion => 
      conversion.from_unit === unitId || conversion.to_unit === unitId
    )
  })

  // Получить коэффициент конвертации между двумя единицами
  const getConversionFactor = computed(() => (fromUnitId: ID, toUnitId: ID): number | null => {
    if (fromUnitId === toUnitId) return 1

    // Прямая конвертация
    const directConversion = activeConversions.value.find(conversion => 
      conversion.from_unit === fromUnitId && conversion.to_unit === toUnitId
    )
    if (directConversion) return directConversion.conversion_factor

    // Обратная конвертация
    const reverseConversion = activeConversions.value.find(conversion => 
      conversion.from_unit === toUnitId && conversion.to_unit === fromUnitId
    )
    if (reverseConversion) return 1 / reverseConversion.conversion_factor

    return null
  })

  // Получить все единицы, в которые можно конвертировать
  const getConvertibleUnits = computed(() => (unitId: ID) => {
    const conversions = getConversionsForUnit.value(unitId)
    const units = new Set<ID>()
    
    conversions.forEach(conversion => {
      if (conversion.from_unit === unitId) {
        units.add(conversion.to_unit)
      } else {
        units.add(conversion.from_unit)
      }
    })
    
    return Array.from(units)
  })

  // Действия
  async function fetchList(params?: {
    page?: number
    page_size?: number
    search?: string
    from_unit?: ID
    to_unit?: ID
    is_active?: boolean
    ordering?: string
  }) {
    loading.value = true
    error.value = null
    
    try {
      const query = {
        page: params?.page || pagination.value.page,
        page_size: params?.page_size || pagination.value.pageSize,
        ...params
      }
      
      const { data } = await api.get<PageResponse<UnitConversion>>(
        endpoints.unitConversions.list + buildQuery(query)
      )
      
      items.value = data.results
      pagination.value = {
        page: query.page,
        pageSize: query.page_size || 20,
        count: data.count
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Ошибка загрузки конвертаций'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: ID) {
    loading.value = true
    error.value = null
    
    try {
      const { data } = await api.get<UnitConversion>(endpoints.unitConversions.detail(id))
      return data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Ошибка загрузки конвертации'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function create(conversion: UnitConversionRequest) {
    loading.value = true
    error.value = null
    
    try {
      const { data } = await api.post<UnitConversion>(endpoints.unitConversions.list, conversion)
      items.value.unshift(data)
      pagination.value.count++
      return data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Ошибка создания конвертации'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function update(id: ID, conversion: PatchedUnitConversionRequest) {
    loading.value = true
    error.value = null
    
    try {
      const { data } = await api.patch<UnitConversion>(endpoints.unitConversions.detail(id), conversion)
      
      const index = items.value.findIndex(item => item.id === id)
      if (index > -1) {
        items.value[index] = data
      }
      
      return data
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Ошибка обновления конвертации'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteItem(id: ID) {
    loading.value = true
    error.value = null
    
    try {
      await api.delete(endpoints.unitConversions.detail(id))
      
      const index = items.value.findIndex(item => item.id === id)
      if (index > -1) {
        items.value.splice(index, 1)
        pagination.value.count--
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Ошибка удаления конвертации'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Утилиты для конвертации
  function convertValue(value: number, fromUnitId: ID, toUnitId: ID): number | null {
    const factor = getConversionFactor.value(fromUnitId, toUnitId)
    return factor !== null ? value * factor : null
  }

  function canConvert(fromUnitId: ID, toUnitId: ID): boolean {
    return getConversionFactor.value(fromUnitId, toUnitId) !== null
  }

  // Создать обратную конвертацию автоматически
  async function createReverseConversion(conversion: UnitConversionRequest) {
    const reverseConversion: UnitConversionRequest = {
      from_unit: conversion.to_unit,
      to_unit: conversion.from_unit,
      conversion_factor: 1 / conversion.conversion_factor,
      is_active: conversion.is_active
    }
    
    return await create(reverseConversion)
  }

  // Создать конвертацию в обе стороны
  async function createBidirectionalConversion(conversion: UnitConversionRequest) {
    const results = []
    
    // Создаем прямую конвертацию
    const direct = await create(conversion)
    results.push(direct)
    
    // Создаем обратную конвертацию
    const reverse = await createReverseConversion(conversion)
    results.push(reverse)
    
    return results
  }

  // Сброс состояния
  function reset() {
    items.value = []
    loading.value = false
    error.value = null
    pagination.value = {
      page: 1,
      pageSize: 20,
      count: 0
    }
  }

  return {
    // Состояние
    items,
    loading,
    error,
    pagination,
    
    // Геттеры
    activeConversions,
    getConversionsForUnit,
    getConversionFactor,
    getConvertibleUnits,
    
    // Действия
    fetchList,
    fetchOne,
    create,
    update,
    deleteItem,
    
    // Утилиты
    convertValue,
    canConvert,
    createReverseConversion,
    createBidirectionalConversion,
    reset
  }
})
