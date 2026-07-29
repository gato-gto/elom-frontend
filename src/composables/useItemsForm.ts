import { ref, reactive, computed } from 'vue'
import type { Ref } from 'vue'
import { DUPLICATE_MATERIAL_MESSAGE } from '@/constants/validation'

/**
 * Базовый интерфейс для элемента позиции (материал + количество)
 */
export interface BaseItem {
  _k: string // Уникальный ключ для Vue
  material: number | null | undefined
  unit: number
  quantity: string | number
}

/**
 * Конфигурация для useItemsForm
 */
export interface UseItemsFormOptions<T extends BaseItem> {
  /**
   * Функция для создания нового элемента позиции
   */
  createNewItem: () => T
  
  /**
   * Функция для пересчета значений элемента (опционально)
   */
  recalculate?: (item: T) => void
  
  /**
   * Валидация дубликатов материалов
   */
  allowDuplicates?: boolean
}

/**
 * Возвращаемый тип для useItemsForm
 */
export interface UseItemsFormReturn<T extends BaseItem> {
  /** Список позиций */
  items: Ref<T[]>
  
  /** Ошибки валидации для позиций */
  itemErrors: Record<string, string>
  
  /** Добавить новую позицию */
  addItem: () => void
  
  /** Удалить позицию по индексу */
  removeItem: (index: number) => void
  
  /** Очистить все позиции */
  clearItems: () => void
  
  /** Получить ошибку для конкретного поля позиции */
  getItemFieldError: (itemIndex: number, fieldName: string) => string | undefined
  
  /** Очистить ошибки дублирования материалов */
  clearItemsDuplicateErrors: () => void
  
  /** Валидация дубликатов материалов */
  validateDuplicates: () => boolean
  
  /** Список ID использованных материалов */
  usedMaterialIds: Ref<number[]>
}

/**
 * Composable для управления списком позиций (материалов) в формах
 * 
 * Используется в PurchaseForm и WriteOffForm для:
 * - Добавления/удаления позиций
 * - Валидации дубликатов материалов
 * - Управления ошибками валидации
 * 
 * @example
 * ```ts
 * const {
 *   items,
 *   itemErrors,
 *   addItem,
 *   removeItem,
 *   getItemFieldError
 * } = useItemsForm({
 *   createNewItem: () => ({
 *     _k: Math.random().toString(36).substr(2, 9),
 *     material: null,
 *     unit: 0,
 *     quantity: '0'
 *   })
 * })
 * ```
 */
export function useItemsForm<T extends BaseItem>(
  options: UseItemsFormOptions<T>
): UseItemsFormReturn<T> {
  
  // ========== State ==========
  
  const items = ref<T[]>([]) as Ref<T[]>
  const itemErrors = reactive<Record<string, string>>({})
  
  // ========== Computed ==========
  
  /**
   * Список ID использованных материалов (для исключения из выбора)
   */
  const usedMaterialIds = computed(() => {
    return items.value
      .map(item => item.material)
      .filter((id): id is number => typeof id === 'number' && id > 0)
  })
  
  // ========== Methods ==========
  
  /**
   * Добавить новую позицию
   */
  function addItem() {
    const newItem = options.createNewItem()
    items.value.push(newItem)
    
    // Пересчитываем значения если задана функция
    if (options.recalculate) {
      options.recalculate(newItem)
    }
    
    // Очищаем ошибки дублирования
    clearItemsDuplicateErrors()
  }
  
  /**
   * Удалить позицию по индексу
   */
  function removeItem(index: number) {
    if (index >= 0 && index < items.value.length) {
      items.value.splice(index, 1)

      // Очищаем ошибки дублирования после удаления
      clearItemsDuplicateErrors()

      // F-883 (класс F-628): переиндексируем itemErrors после splice. Раньше ошибки позиций НИЖЕ
      // удалённой оставались на старых ключах items[j] и показывались на ЧУЖОЙ строке. Убираем
      // ошибки удалённой строки, сдвигаем items[j] → items[j-1] для j > index; не-item ключи не трогаем.
      const reindexed: Record<string, string> = {}
      Object.keys(itemErrors).forEach(key => {
        const m = key.match(/^items\[(\d+)\]\.(.+)$/)
        if (!m) { reindexed[key] = itemErrors[key]; return }
        const j = parseInt(m[1], 10)
        if (j === index) { return }
        const nj = j > index ? j - 1 : j
        reindexed[`items[${nj}].${m[2]}`] = itemErrors[key]
      })
      Object.keys(itemErrors).forEach(k => delete itemErrors[k])
      Object.assign(itemErrors, reindexed)
    }
  }
  
  /**
   * Очистить все позиции
   */
  function clearItems() {
    items.value = []
    Object.keys(itemErrors).forEach(key => delete itemErrors[key])
  }
  
  /**
   * Получить ошибку для конкретного поля позиции
   */
  function getItemFieldError(itemIndex: number, fieldName: string): string | undefined {
    const errorKey = `items[${itemIndex}].${fieldName}`
    return itemErrors[errorKey]
  }
  
  /**
   * Очистить ошибки дублирования материалов
   */
  function clearItemsDuplicateErrors() {
    // Удаляем ошибки дублирования материалов
    Object.keys(itemErrors).forEach(key => {
      if (key.includes('.material') && itemErrors[key]?.startsWith(DUPLICATE_MATERIAL_MESSAGE)) {
        delete itemErrors[key]
      }
    })
  }
  
  /**
   * Валидация дубликатов материалов
   * @returns true если дубликатов нет, false если есть
   */
  function validateDuplicates(): boolean {
    // Если дубликаты разрешены - пропускаем валидацию
    if (options.allowDuplicates) {
      return true
    }
    
    // Получаем список ID материалов (исключая null и 0)
    const materialIds = items.value
      .map(item => item.material)
      .filter((id): id is number => typeof id === 'number' && id > 0)
    
    // Ищем дубликаты
    const duplicates = materialIds.filter((id, index) => materialIds.indexOf(id) !== index)
    
    if (duplicates.length > 0) {
      // Находим индекс первого дубликата
      const duplicateId = duplicates[0]
      const firstIndex = items.value.findIndex(item => item.material === duplicateId)
      
      if (firstIndex !== -1) {
        itemErrors[`items[${firstIndex}].material`] = DUPLICATE_MATERIAL_MESSAGE
      }
      
      return false
    }
    
    return true
  }
  
  // ========== Return ==========
  
  return {
    items,
    itemErrors,
    addItem,
    removeItem,
    clearItems,
    getItemFieldError,
    clearItemsDuplicateErrors,
    validateDuplicates,
    usedMaterialIds
  }
}

