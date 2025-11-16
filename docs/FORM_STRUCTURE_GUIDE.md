# Руководство по структуре форм (на основе MaterialForm)

## Обзор

Данный документ описывает структуру и паттерны использования формы добавления материалов (MaterialForm) для создания и обновления других форм в приложении ELOM.

## Архитектура формы

### Компонентная структура

```
FormComponent.vue
├── GenericForm (основной компонент формы)
│   ├── FormField (универсальные поля)
│   ├── Custom slots (для кастомных полей)
│   └── Form actions (кнопки сохранения/отмены)
└── Дополнительные блоки (предпросмотр фото, информационные карточки)
```

### Базовый паттерн

```vue
<template>
  <div class="entity-form">
    <!-- Дополнительные блоки (опционально) -->
    <div v-if="someCondition" class="card bg-base-100 border mb-6">
      <!-- Предпросмотр, информация и т.д. -->
    </div>

    <!-- Основная форма -->
    <GenericForm
      :config="formConfig"
      :initial-data="initialFormData"
      :on-submit="handleSubmit"
      :on-cancel="handleCancel"
      :validate-on-change="true"
      :reset-on-submit="false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import GenericForm from '@/components/GenericForm.vue'
import { useEntityStore } from '@/stores/entity'
import { useErrorHandler } from '@/composables/useErrorHandler'
import type { Entity, EntityRequest } from '@/api/types'
import type { GenericFormConfig } from '@/types/generic'

// Props
const props = defineProps<{
  initial?: Entity | null
}>()

// Emits
const emit = defineEmits<{
  saved: []
  cancel: []
}>()

// Stores и composables
const entityStore = useEntityStore
const { handleFormError } = useErrorHandler()

// Form configuration
const formConfig = computed<GenericFormConfig<EntityRequest>>(() => ({
  title: props.initial ? 'Редактировать сущность' : 'Новая сущность',
  subtitle: 'Заполните информацию о сущности',
  
  // Секции (опционально, для группировки полей)
  sections: [
    {
      title: 'Основная информация',
      description: 'Описание секции',
      fields: ['field1', 'field2'],
      order: 1
    }
  ],
  
  // Поля формы
  fields: [
    // Определение полей (см. раздел "Типы полей")
  ],
  
  // Кнопки
  submitText: props.initial ? 'Обновить' : 'Создать',
  cancelText: 'Отмена',
  showCancel: true
}))

// Initial form data
const initialFormData = computed<EntityRequest>(() => {
  if (props.initial) {
    return {
      // Данные для редактирования
    }
  }
  
  return {
    // Данные для создания (значения по умолчанию)
  }
})

// Methods
async function handleSubmit(formData: EntityRequest) {
  try {
    if (props.initial) {
      await entityStore.update(props.initial.id, formData)
    } else {
      await entityStore.create(formData)
    }
    
    emit('saved')
  } catch (error) {
    await handleFormError(error, 'entity')
    throw error
  }
}

function handleCancel() {
  emit('cancel')
}

// Lifecycle
onMounted(async () => {
  // Загрузка справочных данных
})
</script>
```

### Базовые принципы (из практики WriteOffForm и PurchaseForm)

- Минимизировать обертки: избегать лишних `card`/`card-body` там, где достаточно утилитарных классов.
- Заголовочные поля (дата, объект, ответственный) располагать в сетке `grid md:grid-cols-2|3 gap-4`, чтобы на desktop они были в ряд.
- Для массивов позиций:
  - Desktop: таблица `<table class="table w-full">` с колонками и четкими min-width.
  - Mobile: список карточек/панелей с `bg-base-200 border rounded` и внутренним `p-4`.
- Использовать единый компонент поиска материала `MaterialSearchSelect`:
  - v-model: ID материала (number|null)
  - событие `@change` отдает объект `Material | null`
  - на `@change` автозаполнять `unit` (если у материала есть `default_unit`)
- Баланс по материалу (остаток) загружать лениво после выбора материала через `/stock/snapshots/balance/`.
- Будущий остаток считать на клиенте как `currentBalance - quantity`.

## Layout заголовочных полей (дата, объект, ответственный)

Рекомендуемая верстка (как в WriteOffForm):

```vue
<div class="grid md:grid-cols-3 gap-4">
  <!-- Дата -->
  <div class="form-control w-full">...</div>
  <!-- Объект -->
  <div class="form-control w-full">...</div>
  <!-- Ответственный -->
  <div class="form-control w-full">...</div>
</div>
```

- На мобильных это будет одна колонка.
- Для `textarea` с 1–2 строками можно задать min-height: auto (см. CSS-трюк ниже).

## Типы полей (FieldConfig)

### Основные типы

#### 1. Input (текстовое поле)

```typescript
{
  key: 'name',
  type: 'input',
  label: 'Название',
  placeholder: 'Введите название',
  required: true,
  order: 1,
  width: 'half', // 'full' | 'half' | 'third' | 'quarter'
  validation: {
    minLength: 2,
    maxLength: 200
  },
  help: 'Подсказка для пользователя'
}
```

#### 2. Textarea (многострочный текст)

```typescript
{
  key: 'description',
  type: 'textarea',
  label: 'Описание',
  placeholder: 'Введите описание',
  order: 2,
  width: 'full',
  rows: 4,
  validation: {
    maxLength: 1000
  }
}
```

#### 3. Select (выпадающий список)

```typescript
{
  key: 'category',
  type: 'select',
  label: 'Категория',
  placeholder: '— выберите категорию —',
  options: categoryOptions.value, // Array<{ value: any; label: string }>
  order: 3,
  width: 'half'
}
```

#### 4. Date (дата)

```typescript
{
  key: 'created_date',
  type: 'date',
  label: 'Дата создания',
  required: true,
  order: 4,
  width: 'half'
}
```

#### 5. Checkbox (чекбокс)

```typescript
{
  key: 'is_active',
  type: 'checkbox',
  label: 'Статус',
  checkboxLabel: 'Активен',
  order: 5,
  width: 'half'
}
```

#### 6. File (файл)

```typescript
{
  key: 'photo',
  type: 'file',
  label: 'Фото',
  accept: 'image/*',
  order: 6,
  width: 'full',
  help: 'Загрузите изображение (максимум 8 МБ)'
}
```

#### 7. Number (число)

```typescript
{
  key: 'price',
  type: 'number',
  label: 'Цена',
  placeholder: '0.00',
  step: 0.01,
  min: 0,
  order: 7,
  width: 'half',
  validation: {
    min: 0,
    max: 1000000
  }
}
```

#### 8. Search (поиск)

```typescript
{
  key: 'material',
  type: 'search',
  label: 'Материал',
  placeholder: 'Поиск материала...',
  order: 8,
  width: 'full'
}
```

#### 9. Custom (кастомное поле)

```typescript
{
  key: 'items',
  type: 'custom',
  label: 'Позиции',
  required: true,
  order: 9,
  width: 'full'
}
```

Затем в шаблоне GenericForm используем слот:

```vue
<template #field-items="{ field, value, error, disabled }">
  <!-- Кастомная реализация -->
</template>
```

## Секции формы

Секции позволяют группировать поля логически:

```typescript
sections: [
  {
    title: 'Основная информация',
    description: 'Базовые данные',
    fields: ['name', 'sku', 'category'],
    order: 1
  },
  {
    title: 'Дополнительная информация',
    description: 'Расширенные параметры',
    fields: ['description', 'manufacturer'],
    order: 2
  }
]
```

**Важно**: Поля должны быть указаны в секциях через их `key`, а сами поля должны быть определены в массиве `fields`.

## Массив позиций (паттерн для items)

Используемый в PurchaseForm/WriteOffForm подход:

- Desktop: таблица с колонками и действиями.
- Mobile: список блоков с полями.
- Единые функции:
  - `addItem()`, `removeItem(index)`
  - `getItemFieldError(index, field)` — из вложенных ошибок `items[0].material`
  - `getItemsGeneralError()` — общая ошибка (например, дубликаты материалов)
  - Валидация на дубликаты материалов по ID в клиенте до отправки

Пример колонок для списаний (WriteOff):
- Материал (MaterialSearchSelect)
- Ед. (readonly показ кода, значение хранится скрыто)
- Количество
- Текущий остаток (после загрузки)
- Будущий остаток (клиентский расчет)
- Действия (удалить)

Пример колонок для закупок (Purchase):
- Материал
- Ед.
- Кол-во
- Цена
- Сумма
- Действия

## Ширина полей (width)

- `'full'` - занимает всю ширину (2 колонки на desktop)
- `'half'` - половина ширины (1 колонка на desktop)
- `'third'` - треть ширины
- `'quarter'` - четверть ширины

**Паттерн**: На desktop формы используют сетку `md:grid-cols-2`, поэтому:
- Два поля с `width: 'half'` будут в одной строке
- Поле с `width: 'full'` будет занимать всю строку

## Валидация полей

### Встроенная валидация

```typescript
validation: {
  minLength: 2,        // Минимальная длина строки
  maxLength: 200,      // Максимальная длина строки
  min: 0,              // Минимальное значение числа
  max: 1000,           // Максимальное значение числа
  pattern: /^[a-z]+$/, // Регулярное выражение
  step: 0.01,          // Шаг для числа
  custom: (value) => { // Кастомная валидация
    if (value === 'invalid') {
      return 'Неверное значение'
    }
    return null
  }
}
```

### Валидация на сервере

Ошибки валидации с сервера автоматически обрабатываются через `useErrorHandler` и отображаются в полях.

### Валидация для массивов позиций (best practice)

- На клиенте:
  - Запрет дубликатов материалов в `items` (показывать сообщение рядом с первым конфликтующим элементом).
  - Проверка что `items.length > 0` перед отправкой (иначе `non_field_errors`).
- На сервере:
  - Возврат ошибок в виде вложенных ключей `items[0].material`, `items[0].quantity`, которые маппятся в форму.

## Обработка файлов

### Загрузка файлов отдельно

```typescript
async function handleSubmit(formData: EntityRequest & { photo?: File }) {
  try {
    let entityId: number

    // Извлекаем файл
    const photoFile = formData.photo
    delete formData.photo // Удаляем из данных формы

    // Сначала сохраняем основную сущность
    if (props.initial) {
      await entityStore.update(props.initial.id, formData)
      entityId = props.initial.id
    } else {
      const newEntity = await entityStore.create(formData)
      entityId = newEntity.id
    }

    // Затем загружаем фото
    if (photoFile) {
      await uploadPhoto(entityId, photoFile)
    }

    emit('saved')
  } catch (error) {
    await handleFormError(error, 'entity')
    throw error
  }
}
```

### Предпросмотр существующего фото

```vue
<div v-if="currentPhotoUrl" class="card bg-base-100 border mb-6">
  <div class="card-body">
    <h3 class="card-title text-lg mb-4">Текущее фото</h3>
    <div class="flex items-center gap-4">
      <div class="relative">
        <img
          :src="currentPhotoUrl"
          alt="Текущее фото"
          class="h-24 w-24 object-cover rounded-lg border"
        />
        <button
          type="button"
          class="absolute -top-2 -right-2 btn btn-error btn-xs btn-circle"
          @click="onDeletePhoto"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</div>
```

## Загрузка справочных данных

### Использование computed для options

```typescript
const categoryOptions = computed(() => materialCategoriesStore.selectOptions)
const unitOptions = computed(() => unitsStore.selectOptions)

// В formConfig
{
  key: 'category',
  type: 'select',
  options: categoryOptions.value, // Используем .value для computed
  // ...
}
```

### Загрузка данных при монтировании

```typescript
onMounted(async () => {
  // Загружаем только если данные еще не загружены
  const promises = []
  
  if (categoriesStore?.items?.length === 0) {
    promises.push(categoriesStore.fetchList())
  }
  
  if (unitsStore?.items?.length === 0) {
    promises.push(unitsStore.fetchList())
  }

  if (promises.length > 0) {
    await Promise.all(promises)
  }
})
```

### Загрузка остатков (WriteOffForm)

- Endpoint: `endpoints.stockSnapshots.balance` → `/stock/snapshots/balance/`
- Параметры: `object_id`, `material_id`, `date`
- Результат: `current_balance` (string/number)

Паттерн:
```ts
const { data } = await api.get(endpoints.stockSnapshots.balance, {
  params: { object_id, material_id, date }
})
item.currentBalance = parseFloat(data.current_balance || 0)
```

## Обработка ошибок

### Автоматическая обработка

`useErrorHandler` автоматически обрабатывает ошибки API и устанавливает их в поля формы:

```typescript
const { handleFormError } = useErrorHandler()

async function handleSubmit(formData: EntityRequest) {
  try {
    // ... сохранение
  } catch (error) {
    await handleFormError(error, 'entity')
    throw error // Важно: пробрасываем ошибку, чтобы GenericForm мог её обработать
  }
}
```

### Вложенные ошибки

Ошибки для массивов (например, `items[0].material`) автоматически обрабатываются и отображаются в соответствующих полях.

## Интеграция MaterialSearchSelect

Контракт компонента:
- v-model: `number | null` — ID материала
- `@change`: `Material | null` — объект материала

Best practice при выборе материала:
```ts
async function onItemMaterialChange(item, material) {
  if (material) {
    item.material = material.id
    if (material.default_unit && !item.unit) {
      item.unit = material.default_unit
    }
    // Ленивая загрузка остатка
    await loadCurrentBalance(item)
  } else {
    item.material = null
    item.unit = 0
    item.currentBalance = null
  }
}
```

## Расчет будущего остатка (WriteOffForm)

```ts
function getFutureBalance(item) {
  if (item.currentBalance == null || !item.material) { return 0 }
  const qty = parseFloat(item.quantity || '0') || 0
  return item.currentBalance - qty
}
```

В UI:
- Показывать цветом:
  - Красный и жирный — если < 0
  - Желтый — если < 10% от текущего

## Условное отображение полей

Используйте свойство `condition` для условного отображения полей:

```typescript
{
  key: 'password',
  type: 'password',
  label: 'Пароль',
  required: !props.initial, // Обязательно только при создании
  condition: () => !props.initial, // Отображать только при создании
  // ...
}
```

## Стилизация

### DaisyUI классы

Форма использует DaisyUI классы:
- `card bg-base-100 border` - карточка формы
- `card-body` - тело карточки
- `input input-bordered` - поля ввода
- `select select-bordered` - выпадающие списки
- `btn btn-primary` - кнопки
- `alert alert-error` - сообщения об ошибках

### Адаптивность

Форма автоматически адаптируется:
- Desktop: сетка `md:grid-cols-2` (или `md:grid-cols-3` для 3-х полей в один ряд)
- Mobile: одна колонка, все поля на полную ширину

### Мелкие UX-улучшения

- Для `textarea` с `rows=1..2` можно сбросить min-height:
```css
textarea.textarea[rows="1"],
textarea.textarea[rows="2"] {
  min-height: auto !important;
}
```

## Примеры использования

### Простая форма (без секций)

```typescript
const formConfig = computed<GenericFormConfig<UnitRequest>>(() => ({
  title: props.initial ? 'Редактировать единицу' : 'Новая единица',
  subtitle: 'Заполните информацию о единице измерения',
  fields: [
    {
      key: 'name',
      type: 'input',
      label: 'Название единицы',
      required: true,
      order: 1,
      width: 'full'
    },
    {
      key: 'code',
      type: 'input',
      label: 'Код единицы',
      required: true,
      order: 2,
      width: 'full'
    }
  ],
  submitText: props.initial ? 'Обновить' : 'Создать',
  cancelText: 'Отмена',
  showCancel: true
}))
```

### Форма с секциями

```typescript
const formConfig = computed<GenericFormConfig<EmployeeRequest>>(() => ({
  title: props.initial ? 'Редактировать сотрудника' : 'Новый сотрудник',
  subtitle: 'Заполните информацию о сотруднике',
  sections: [
    {
      title: 'Основная информация',
      description: 'Личные данные сотрудника',
      fields: ['first_name', 'last_name', 'email'],
      order: 1
    },
    {
      title: 'Роль и доступы',
      description: 'Роль и права доступа',
      fields: ['role', 'password', 'is_active'],
      order: 2
    }
  ],
  fields: [
    // Определение всех полей
  ],
  submitText: props.initial ? 'Обновить' : 'Создать',
  cancelText: 'Отмена',
  showCancel: true
}))
```

### Форма с кастомными полями (массовое добавление)

См. `PurchaseForm.vue` — массив позиций (items) через custom slot:
- Desktop: таблица со столбцами (материал, ед., кол-во, цена, сумма)
- Mobile: карточки с теми же полями
- Общие функции: `addItem`, `removeItem`, `getItemFieldError`, `getItemsGeneralError`, `recalc`
- Автозаполнение `unit` при выборе материала
- Пересчет суммы по `quantity * price`

## Best Practices

### 1. Используйте computed для formConfig

```typescript
// ✅ Правильно
const formConfig = computed<GenericFormConfig<EntityRequest>>(() => ({
  // ...
}))

// ❌ Неправильно
const formConfig = ref<GenericFormConfig<EntityRequest>>({
  // ...
})
```

### 2. Используйте computed для initialFormData

```typescript
// ✅ Правильно
const initialFormData = computed<EntityRequest>(() => {
  if (props.initial) {
    return { /* данные для редактирования */ }
  }
  return { /* данные для создания */ }
})
```

### 3. Всегда обрабатывайте ошибки

```typescript
async function handleSubmit(formData: EntityRequest) {
  try {
    // ... сохранение
  } catch (error) {
    await handleFormError(error, 'entity')
    throw error // Пробрасываем для GenericForm
  }
}
```

### 4. Используйте правильные типы

```typescript
import type { Entity, EntityRequest } from '@/api/types'
import type { GenericFormConfig } from '@/types/generic'
```

### 5. Загружайте справочные данные только при необходимости

```typescript
onMounted(async () => {
  const promises = []
  if (store.items.length === 0) {
    promises.push(store.fetchList())
  }
  if (promises.length > 0) {
    await Promise.all(promises)
  }
})
```

### 6. Используйте порядок полей (order)

Всегда указывайте `order` для полей, чтобы контролировать их последовательность:

```typescript
fields: [
  { key: 'name', order: 1, ... },
  { key: 'email', order: 2, ... },
  { key: 'phone', order: 3, ... }
]
```

### 7. Используйте help для подсказок

```typescript
{
  key: 'code',
  label: 'Код',
  help: 'Короткий код для использования в системе (например: кг, м, шт)'
}
```

## Сравнение: GenericForm vs Ручная форма

### Преимущества GenericForm

✅ **Меньше кода**: Определение формы через конфигурацию  
✅ **Единообразие**: Все формы выглядят одинаково  
✅ **Валидация**: Автоматическая валидация встроена  
✅ **Ошибки**: Автоматическая обработка ошибок API  
✅ **Адаптивность**: Автоматическая адаптация под мобильные  
✅ **Доступность**: Семантический HTML и ARIA атрибуты  

### Когда использовать ручную форму

- Сложная бизнес-логика, которую нельзя описать через конфигурацию
- Массовое добавление позиций (как в PurchaseForm и WriteOffForm)
- Специфичные UI требования, не покрываемые GenericForm

## Шаблон для новой формы

```vue
<template>
  <div class="entity-form">
    <GenericForm
      :config="formConfig"
      :initial-data="initialFormData"
      :on-submit="handleSubmit"
      :on-cancel="handleCancel"
      :validate-on-change="true"
      :reset-on-submit="false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import GenericForm from '@/components/GenericForm.vue'
import { useEntityStore } from '@/stores/entity'
import { useErrorHandler } from '@/composables/useErrorHandler'
import type { Entity, EntityRequest } from '@/api/types'
import type { GenericFormConfig } from '@/types/generic'

const props = defineProps<{
  initial?: Entity | null
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const entityStore = useEntityStore
const { handleFormError } = useErrorHandler()

const formConfig = computed<GenericFormConfig<EntityRequest>>(() => ({
  title: props.initial ? 'Редактировать сущность' : 'Новая сущность',
  subtitle: 'Заполните информацию о сущности',
  fields: [
    // Определите поля здесь
  ],
  submitText: props.initial ? 'Обновить' : 'Создать',
  cancelText: 'Отмена',
  showCancel: true
}))

const initialFormData = computed<EntityRequest>(() => {
  if (props.initial) {
    return {
      // Данные для редактирования
    }
  }
  
  return {
    // Данные для создания
  }
})

async function handleSubmit(formData: EntityRequest) {
  try {
    if (props.initial) {
      await entityStore.update(props.initial.id, formData)
    } else {
      await entityStore.create(formData)
    }
    
    emit('saved')
  } catch (error) {
    await handleFormError(error, 'entity')
    throw error
  }
}

function handleCancel() {
  emit('cancel')
}

onMounted(async () => {
  // Загрузка справочных данных при необходимости
})
</script>
```

---

**Дата создания**: 08 Октября 2025  
**Версия**: 1.0  
**Основано на**: MaterialForm.vue, UnitForm.vue, EmployeeForm.vue, SupplierForm.vue

