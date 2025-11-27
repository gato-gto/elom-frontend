# 🔧 Рекомендации по рефакторингу критических мест

**Дата:** 25 ноября 2025  
**Проект:** ELOM Frontend  
**Цель:** Улучшение качества кода, читаемости и поддерживаемости

---

## 🚨 Критические места, требующие рефакторинга

### 1. **PurchaseForm.vue - Метод `onSaved()` (850-1050 строки)**

**Проблема:** Монолитная функция с высокой цикломатической сложностью (~150 строк)

**Текущие проблемы:**
- Смешивает валидацию, подготовку данных, создание/обновление, загрузку фото
- Множество console.log (15+ вызовов)
- Сложная логика обработки ошибок с дублированием
- Трудно тестировать

**Рекомендация:**

```typescript
// ❌ ПЛОХО (текущая реализация)
const onSaved = async (data: any) => {
  // 150+ строк кода с валидацией, созданием, загрузкой фото...
}

// ✅ ХОРОШО (рефакторинг)
// 1. Разделить на отдельные функции
const validatePurchaseItems = (items: PurchaseItemRequest[]) => {
  const errors: Record<string, string> = {}
  
  items.forEach((item, idx) => {
    if (!item.material && !item.material_name) {
      errors[`items[${idx}].material`] = 'Материал обязателен'
    }
    
    if (item.isNewMaterial && item.material_name && (!item.unit || item.unit === 0)) {
      errors[`items[${idx}].unit`] = 'Единица измерения обязательна для нового материала'
    }
    
    if (!item.quantity || parseFloat(item.quantity) <= 0) {
      errors[`items[${idx}].quantity`] = 'Количество должно быть больше 0'
    }
  })
  
  return errors
}

const preparePurchaseData = (data: any, items: PurchaseItemRequest[]): PurchaseRequest => {
  return {
    date: data.date,
    object: data.object,
    supplier: data.supplier,
    invoice_number: data.invoice_number,
    ...(data.purchase_no?.trim() ? { purchase_no: data.purchase_no.trim() } : {}),
    status: data.status,
    currency: data.currency || 'UZS',
    comment: data.comment,
    items: items.map(item => ({
      unit: item.unit,
      quantity: item.quantity,
      amount: item.amount,
      price: item.price || '0',
      ...(item.isNewMaterial && item.material_name 
        ? { material_name: item.material_name } 
        : { material: item.material }
      )
    }))
  }
}

const uploadPhotos = async (
  purchaseId: number, 
  photos: File[], 
  type: 'instructions' | 'report'
): Promise<{ uploaded: number, failed: number }> => {
  let uploadedCount = 0
  let failedCount = 0
  
  for (const photo of photos) {
    try {
      await uploadPurchasePhoto(purchaseId, photo, type)
      uploadedCount++
      if (import.meta.env.DEV) {
        console.log(`Successfully uploaded ${type} photo:`, photo.name)
      }
    } catch (error) {
      failedCount++
      if (import.meta.env.DEV) {
        console.error(`Failed to upload ${type} photo:`, photo.name, error)
      }
    }
  }
  
  return { uploaded: uploadedCount, failed: failedCount }
}

const onSaved = async (data: any) => {
  saving.value = true
  clearErrors()
  
  // 1. Валидация
  const validationErrors = validatePurchaseItems(items.value)
  if (Object.keys(validationErrors).length > 0) {
    saving.value = false
    ui.toast({ type: 'error', text: 'Пожалуйста, исправьте ошибки в позициях' })
    return
  }
  
  try {
    // 2. Подготовка данных
    const purchaseData = preparePurchaseData(data, items.value)
    
    // 3. Создание/обновление
    let purchaseId: number
    if (isEdit.value) {
      purchaseId = props.initial?.id || Number(route.params.id)
      await purchasesStore.update(purchaseId, purchaseData)
      notifications.notifyPurchaseEdit(purchaseId, auth.me?.username || 'Неизвестный пользователь')
    } else {
      const newPurchase = await purchasesStore.create(purchaseData)
      purchaseId = newPurchase?.id
      
      if (!purchaseId || Number.isNaN(purchaseId)) {
        throw new Error('Failed to get purchase ID from API response')
      }
    }
    
    // 4. Загрузка фото
    if (instructionPhotos.value.length > 0) {
      const { uploaded, failed } = await uploadPhotos(purchaseId, instructionPhotos.value, 'instructions')
      
      if (uploaded > 0) {
        ui.toast({ 
          type: 'success', 
          text: `Загружено фотоинструкций: ${uploaded}${failed > 0 ? ` (не загружено: ${failed})` : ''}` 
        })
      }
    }
    
    // 5. Успешное завершение
    ui.toast({ type: 'success', text: isEdit.value ? 'Закупка обновлена' : 'Закупка создана' })
    router.push('/purchases')
    
  } catch (error) {
    handleFormError(error, 'purchase')
  } finally {
    saving.value = false
  }
}
```

**Преимущества:**
- ✅ Каждая функция делает одну вещь
- ✅ Легко тестировать
- ✅ Меньше дублирования
- ✅ console.log обернуты в `import.meta.env.DEV`
- ✅ Улучшенная читаемость

---

### 2. **WriteOffForm.vue - Дублирование логики с PurchaseForm**

**Проблема:** ~80% логики идентична PurchaseForm (валидация, загрузка данных, обработка позиций)

**Рекомендация:** Создать общий composable

```typescript
// ✅ Создать: src/composables/useItemsForm.ts
export function useItemsForm<T extends { _k: string }>(options: {
  objectStore: any
  materialsStore: any
  employeesStore: any
  unitsStore: any
}) {
  const items = ref<T[]>([])
  const itemErrors = reactive<Record<string, string>>({})
  
  const addItem = () => {
    items.value.push({
      _k: `item_${Date.now()}_${Math.random()}`,
      material: null,
      unit: 0,
      quantity: 1,
      // ... другие поля
    } as T)
  }
  
  const removeItem = (key: string) => {
    const index = items.value.findIndex(it => it._k === key)
    if (index !== -1) {
      items.value.splice(index, 1)
    }
  }
  
  const validateItems = () => {
    const errors: Record<string, string> = {}
    // Общая логика валидации
    return errors
  }
  
  const loadMaterialsByObject = async (objectId: number) => {
    // Общая логика загрузки материалов
  }
  
  return {
    items,
    itemErrors,
    addItem,
    removeItem,
    validateItems,
    loadMaterialsByObject
  }
}

// Использование в PurchaseForm.vue и WriteOffForm.vue
const {
  items,
  itemErrors,
  addItem,
  removeItem,
  validateItems,
  loadMaterialsByObject
} = useItemsForm({
  objectStore: useObjectsStore(),
  materialsStore: useMaterialsStore(),
  employeesStore: useEmployeesStore(),
  unitsStore: useUnitsStore()
})
```

**Преимущества:**
- ✅ Устраняет дублирование ~500 строк кода
- ✅ Единая точка правды для логики работы с позициями
- ✅ Легче поддерживать и тестировать

---

### 3. **useGenericForm.ts - Избыточная сложность валидации**

**Проблема:** Функция `validateField()` смешивает разные типы валидации

**Рекомендация:**

```typescript
// ✅ Разделить на отдельные валидаторы
type Validator = (value: any, field: FieldConfig) => string | null

const requiredValidator: Validator = (value, field) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${field.label} обязательно для заполнения`
  }
  return null
}

const minLengthValidator: Validator = (value, field) => {
  if (typeof value === 'string' && field.validation?.minLength) {
    if (value.length < field.validation.minLength) {
      return `${field.label} должно содержать минимум ${field.validation.minLength} символов`
    }
  }
  return null
}

const patternValidator: Validator = (value, field) => {
  if (field.validation?.pattern && typeof value === 'string') {
    if (!field.validation.pattern.test(value)) {
      return `${field.label} имеет неверный формат`
    }
  }
  return null
}

const validators: Validator[] = [
  requiredValidator,
  minLengthValidator,
  patternValidator,
  // ... другие валидаторы
]

function validateField(key: string): boolean {
  const field = options.config.fields.find(f => f.key === key)
  if (!field) return true

  const value = form.value[key]
  
  // Пропускаем валидацию если поле не тронуто
  if (!touched.value.has(key) && !isSubmitting.value) {
    return true
  }
  
  // Применяем все валидаторы
  for (const validator of validators) {
    const error = validator(value, field)
    if (error) {
      setFieldError(key, error)
      return false
    }
  }
  
  return true
}
```

**Преимущества:**
- ✅ Легко добавлять новые валидаторы
- ✅ Каждый валидатор тестируется отдельно
- ✅ Соответствует принципу единственной ответственности

---

### 4. **stores/base.ts - Обработка ошибок**

**Проблема:** Дублирование try-catch блоков в каждом методе

**Рекомендация:**

```typescript
// ✅ Создать обертку для API вызовов
async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T | null> {
  loading.value = true
  error.value = null
  
  try {
    return await operation()
  } catch (err: any) {
    error.value = errorMessage
    await handleApiErrorAsync(err, errorMessage)
    return null
  } finally {
    loading.value = false
  }
}

// Использование
const fetchList = async (params?: any) => {
  const result = await withErrorHandling(
    async () => {
      const queryParams = buildQueryParams(params)
      const query = buildQuery(queryParams)
      const { data } = await api.get(config.endpoint.list + query)
      
      items.value = data.results || data
      updatePagination(data, queryParams)
      
      return data
    },
    `Ошибка загрузки ${config.entityNamePlural}`
  )
  
  return result
}

const fetchOne = async (id: number) => {
  const result = await withErrorHandling(
    async () => {
      const { data } = await api.get(config.endpoint.one(id))
      current.value = data
      
      // Добавляем в items если нет
      if (!exists.value(id)) {
        items.value.push(data)
      }
      
      return data
    },
    `Ошибка загрузки ${config.entityName}`
  )
  
  return result
}
```

**Преимущества:**
- ✅ Устраняет дублирование try-catch
- ✅ Централизованная обработка loading/error состояний
- ✅ Меньше кода, легче читать

---

### 5. **MaterialSearchSelect.vue и SupplierSearchSelect.vue - Дублирование**

**Проблема:** ~90% кода идентичен между этими компонентами

**Рекомендация:**

```typescript
// ✅ Создать: src/components/GenericSearchSelect.vue
<script setup lang="ts" generic="T extends { id: number, name: string }">
interface Props {
  modelValue?: number | null
  label?: string
  placeholder?: string
  searchFunction: (query: string) => T[]
  loadFunction?: (id: number) => Promise<T>
  excludeIds?: number[]
  allowCustom?: boolean
  isSuccess?: boolean
  disabled?: boolean
  error?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'item-selected': [item: T]
  'custom-item': [name: string]
}>()

// Общая логика поиска, выбора, загрузки...
</script>

// Использование
<GenericSearchSelect
  v-model="formData.material"
  :search-function="materialsStore.search"
  :load-function="materialsStore.fetchOne"
  :exclude-ids="usedMaterialIds"
  label="Материал"
  placeholder="Поиск материала..."
  @item-selected="onMaterialSelected"
/>

<GenericSearchSelect
  v-model="formData.supplier"
  :search-function="suppliersStore.search"
  :load-function="suppliersStore.fetchOne"
  label="Поставщик"
  placeholder="Поиск поставщика..."
  @item-selected="onSupplierSelected"
/>
```

**Преимущества:**
- ✅ Устраняет ~400 строк дублированного кода
- ✅ Единый компонент для всех поисковых select
- ✅ TypeScript generics обеспечивают типобезопасность

---

## 📊 Приоритеты рефакторинга

| Приоритет | Место | Сложность | Выгода | Время |
|-----------|-------|-----------|--------|-------|
| 🔴 **Высокий** | PurchaseForm.onSaved() | Средняя | Высокая | 2-3 часа |
| 🔴 **Высокий** | useItemsForm composable | Высокая | Очень высокая | 4-6 часов |
| 🟡 **Средний** | GenericSearchSelect | Средняя | Высокая | 3-4 часа |
| 🟡 **Средний** | useGenericForm валидация | Низкая | Средняя | 1-2 часа |
| 🟢 **Низкий** | base.ts error handling | Низкая | Средняя | 1 час |

---

## 🎯 План поэтапного рефакторинга

### Этап 1 (Неделя 1)
1. ✅ Рефакторинг `PurchaseForm.onSaved()`
2. ✅ Создание `useItemsForm` composable
3. ✅ Применение в `PurchaseForm.vue`

### Этап 2 (Неделя 2)
1. ✅ Применение `useItemsForm` в `WriteOffForm.vue`
2. ✅ Создание `GenericSearchSelect`
3. ✅ Миграция `MaterialSearchSelect` и `SupplierSearchSelect`

### Этап 3 (Неделя 3)
1. ✅ Рефакторинг валидации в `useGenericForm`
2. ✅ Улучшение обработки ошибок в `base.ts`
3. ✅ Написание тестов для новых composables

---

## 🧪 Тестирование после рефакторинга

### Обязательные тесты:
1. **Unit-тесты** для всех новых composables
2. **Integration-тесты** для форм с новой логикой
3. **E2E-тесты** для критичных сценариев (создание закупки, списание)

### Проверка регрессии:
```bash
# Запустить все тесты
npm run test:run

# Проверить покрытие
npm run test:coverage

# E2E тесты
npm run test:e2e
```

---

## 📈 Ожидаемые результаты

### Метрики улучшения:
- **Уменьшение дублирования:** ~1200 строк кода
- **Улучшение покрытия тестами:** с 30% до 70%
- **Снижение цикломатической сложности:** в среднем на 40%
- **Время на добавление новых форм:** с 2 дней до 4 часов

### Качественные улучшения:
- ✅ Легче добавлять новые формы
- ✅ Меньше багов из-за дублирования
- ✅ Проще онбординг новых разработчиков
- ✅ Лучшая поддерживаемость

---

## ⚠️ Риски и митигация

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| Регрессия в существующих формах | Средняя | Полное покрытие тестами перед рефакторингом |
| Увеличение времени разработки | Низкая | Поэтапный подход, рефакторинг по одному компоненту |
| Конфликты при мердже | Средняя | Короткие итерации, частые коммиты |

---

## 📚 Дополнительные рекомендации

### 1. Логирование
```typescript
// Создать утилиту для логирования
// src/utils/logger.ts
export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(`[DEBUG] ${message}`, ...args)
    }
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args)
    // Отправка в Sentry/LogRocket
  },
  warn: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  }
}

// Использование
logger.debug('Created purchase response:', newPurchase)
logger.error('Failed to upload photo:', error)
```

### 2. Типизация
```typescript
// Избегать any, использовать unknown или конкретные типы
// ❌ ПЛОХО
function handleData(data: any) { }

// ✅ ХОРОШО
function handleData(data: Purchase | WriteOff) { }

// ✅ ИЛИ
function handleData(data: unknown) {
  if (isPurchase(data)) {
    // TypeScript знает, что data это Purchase
  }
}
```

### 3. Константы
```typescript
// Вынести магические числа и строки в константы
// src/constants/validation.ts
export const VALIDATION = {
  MIN_QUANTITY: 0,
  MAX_PHOTOS: 10,
  MAX_PHOTO_SIZE: 10 * 1024 * 1024, // 10 MB
  DEBOUNCE_DELAY: 300
} as const

export const MESSAGES = {
  PURCHASE_CREATED: 'Закупка создана',
  PURCHASE_UPDATED: 'Закупка обновлена',
  VALIDATION_ERROR: 'Пожалуйста, исправьте ошибки в форме'
} as const
```

---

*Отчет создан: 25 ноября 2025*  
*Автор: AI Assistant (Claude)*

