# Система списаний (WriteOff) - Отчет о реализации

## Обзор

Система списаний материалов полностью реализована в проекте ELOM. Включает в себя backend модель WriteOff, frontend форму списаний, автоматическое формирование записей в журнале движений и упрощенный интерфейс без предупреждений.

## Backend реализация

### Модель WriteOff

```python
class WriteOff(models.Model):
    STAGE_CHOICES = [
        ("acceptance", "Acceptance"),           # Приём объекта
        ("request", "Request"),                 # Заявка
        ("delivery_fixed", "Delivery Fixed"),   # Фактическая поставка
        ("post_rough", "Post Rough"),           # После черновых
        ("handover", "Handover"),               # Сдача
    ]
    
    date = models.DateField(help_text="Дата списания")
    object = models.ForeignKey(Object, on_delete=models.PROTECT, help_text="Объект")
    material = models.ForeignKey(Material, on_delete=models.SET_NULL, null=True, blank=True, help_text="Материал")
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT, help_text="Единица измерения")
    quantity = models.DecimalField(
        max_digits=18, decimal_places=6, 
        validators=[MinValueValidator(Decimal('0.000001'))],
        help_text="Количество к списанию"
    )
    stage = models.CharField(
        max_length=32, choices=STAGE_CHOICES,
        help_text="Этап работ"
    )
    responsible = models.ForeignKey(User, on_delete=models.PROTECT, help_text="Ответственный")
    comment = models.TextField(blank=True, default="", help_text="Комментарий")
    is_archived = models.BooleanField(default=False, help_text="Архивировано")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### Автоматическое формирование записей в журнале движений

При создании/обновлении/удалении списания автоматически создаются/обновляются/удаляются записи в журнале движений (StockSnapshot):

```python
@receiver(post_save, sender=WriteOff)
def create_ledger_entry_for_writeoff(sender, instance, created, **kwargs):
    """Создать или обновить запись в журнале движений при создании/обновлении WriteOff"""
    try:
        with transaction.atomic():
            if created:
                BalanceCalculationService.create_ledger_entry_for_writeoff(instance)
            else:
                BalanceCalculationService.update_ledger_entry_for_writeoff(instance)
    except Exception as e:
        if created:
            instance.delete()
        raise e

@receiver(post_delete, sender=WriteOff)
def delete_ledger_entry_for_writeoff(sender, instance, **kwargs):
    """Удалить запись в журнале движений при удалении WriteOff"""
    BalanceCalculationService.delete_ledger_entry_for_writeoff(instance)
```

### API Endpoints

- `GET /api/v1/writeoffs/` - Список списаний
- `POST /api/v1/writeoffs/` - Создание списания
- `GET /api/v1/writeoffs/{id}/` - Получение списания
- `PUT /api/v1/writeoffs/{id}/` - Обновление списания
- `DELETE /api/v1/writeoffs/{id}/` - Удаление списания

## Frontend реализация

### WriteOffForm компонент

Полнофункциональная форма списаний с автозаполнением полей:

#### Основные возможности:
- **Автозаполнение материалов**: При выборе объекта загружаются только материалы, доступные для этого объекта
- **Автозаполнение единиц измерения**: Единица измерения автоматически подставляется из материала
- **Автозаполнение ответственного**: Автоматически выбирается ответственный за объект
- **Отображение актуального остатка**: Показывается текущий остаток материала на объекте
- **Валидация**: Проверка корректности данных перед сохранением

#### Структура формы:
```vue
<template>
  <Modal :model-value="isOpen" :title="modalTitle" @close="closeModal">
    <form @submit.prevent="handleSubmit">
      <!-- Дата списания -->
      <input type="date" v-model="formData.date" />
      
      <!-- Объект -->
      <select v-model="formData.object" @change="onObjectChange">
        <option v-for="obj in objectOptions" :key="obj.value" :value="obj.value">
          {{ obj.label }}
        </option>
      </select>
      
      <!-- Материал -->
      <select v-model="formData.material" @change="onMaterialChange">
        <option v-for="material in materialOptions" :key="material.value" :value="material.value">
          {{ material.label }}
        </option>
      </select>
      
      <!-- Единица измерения -->
      <select v-model="formData.unit" :disabled="isUnitDisabled">
        <option v-for="unit in unitOptions" :key="unit.value" :value="unit.value">
          {{ unit.label }}
        </option>
      </select>
      
      <!-- Количество -->
      <input type="number" v-model="formData.quantity" step="0.000001" />
      
      <!-- Этап работ -->
      <select v-model="formData.stage">
        <option value="acceptance">Приемка</option>
        <option value="request">Заявка</option>
        <option value="delivery_fixed">Доставка</option>
        <option value="post_rough">После черновых</option>
        <option value="handover">Сдача</option>
      </select>
      
      <!-- Ответственный -->
      <select v-model="formData.responsible" @change="onResponsibleChange">
        <option v-for="emp in responsibleOptions" :key="emp.value" :value="emp.value">
          {{ emp.label }}
        </option>
      </select>
      
      <!-- Комментарий -->
      <textarea v-model="formData.comment" rows="3"></textarea>
      
      <!-- Актуальный остаток -->
      <div class="alert alert-info">
        <div class="font-bold">Актуальный остаток материала</div>
        <div class="mt-1">
          <span class="font-mono">{{ currentBalance.toFixed(6) }}</span>
          <span class="ml-1">{{ unitCode }}</span>
        </div>
      </div>
    </form>
  </Modal>
</template>
```

### WriteOffList компонент

Список списаний с использованием GenericList:

```typescript
const listConfig = computed<GenericListConfig<WriteOff>>(() => ({
  title: 'Списания материалов',
  subtitle: 'Учет списаний материалов по объектам',
  icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  showCreate: true,
  showStats: true,
  exportable: true,
  exportFilename: 'writeoffs',
  exportUrl: '/api/v1/writeoffs/',
  columns: [
    { key: 'date', label: 'Дата', sortable: true },
    { key: 'object', label: 'Объект', sortable: true },
    { key: 'material', label: 'Материал', sortable: true },
    { key: 'quantity', label: 'Количество', sortable: true },
    { key: 'stage', label: 'Этап', sortable: true },
    { key: 'current_balance', label: 'Остаток', sortable: true },
    { key: 'responsible', label: 'Ответственный', sortable: true }
  ],
  filters: [
    { key: 'search', type: 'text', label: 'Поиск' },
    { key: 'object', type: 'select', label: 'Объект', options: objectOptions },
    { key: 'material', type: 'select', label: 'Материал', options: materialOptions },
    { key: 'stage', type: 'select', label: 'Этап', options: stageOptions },
    { key: 'responsible', type: 'select', label: 'Ответственный', options: employeeOptions },
    { key: 'date_from', type: 'date', label: 'Дата с' },
    { key: 'date_to', type: 'date', label: 'Дата по' }
  ]
}))
```

### WriteOffCard компонент

Мобильная карточка для отображения списания:

```vue
<template>
  <div class="card  shadow-xl">
    <div class="card-body">
      <h2 class="card-title">{{ writeOff.material_name }}</h2>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span class="text-gray-500">Объект:</span>
          <span class="font-medium">{{ writeOff.object_name }}</span>
        </div>
        <div>
          <span class="text-gray-500">Количество:</span>
          <span class="font-medium">{{ writeOff.quantity }} {{ writeOff.unit_code }}</span>
        </div>
        <div>
          <span class="text-gray-500">Дата:</span>
          <span class="font-medium">{{ formatDate(writeOff.date) }}</span>
        </div>
        <div>
          <span class="text-gray-500">Этап:</span>
          <span class="badge badge-outline">{{ getStageDisplayName(writeOff.stage) }}</span>
        </div>
        <div>
          <span class="text-gray-500">Ответственный:</span>
          <span class="font-medium">{{ writeOff.responsible_name }}</span>
        </div>
        <div>
          <span class="text-gray-500">Остаток:</span>
          <span class="font-medium">{{ writeOff.current_balance }} {{ writeOff.unit_code }}</span>
        </div>
      </div>
      <div v-if="writeOff.comment">
        <span class="text-gray-500">Комментарий:</span>
        <span class="font-medium">{{ writeOff.comment }}</span>
      </div>
    </div>
  </div>
</template>
```

## Упрощение интерфейса

### Удаление системы предупреждений

Полностью удалена система `validation_warnings`:

#### Frontend:
- ❌ Удален `validation_warnings: string[]` из типов
- ❌ Удалена функция `getWithWarnings()` из stores
- ❌ Удалены блоки предупреждений из всех компонентов
- ❌ Удалена функция `generateWarnings()`
- ❌ Удален расчет "После списания"

#### Backend:
- ❌ Удален файл `stock/validation.py`
- ❌ Удален `validation_warnings` из сериализаторов
- ❌ Удалены импорты validation из моделей
- ❌ Упрощена валидация в `WriteOff.clean()`

### Что осталось:

#### Только актуальный остаток:
```vue
<div class="alert alert-info">
  <div class="font-bold">Актуальный остаток материала</div>
  <div class="mt-1">
    <span class="font-mono">{{ currentBalance.toFixed(6) }}</span>
    <span class="ml-1">{{ unitCode }}</span>
  </div>
</div>
```

## API интеграция

### WriteOffsStore

```typescript
export const useWriteOffsStore = createBaseStore<WriteOff, WriteOffCreateRequest, WriteOffUpdateRequest>({
  endpoint: endpoints.writeOffs,
  entityName: 'списание',
  entityNamePlural: 'списания'
})

// Custom getters
export const getByStage = (stage: string) => {
  return useWriteOffsStore.items.filter((item: WriteOff) => item.stage === stage)
}

export const getByObject = (objectId: number) => {
  return useWriteOffsStore.items.filter((item: WriteOff) => item.object === objectId)
}

export const getByMaterial = (materialId: number) => {
  return useWriteOffsStore.items.filter((item: WriteOff) => item.material === materialId)
}

export const getByResponsible = (responsibleId: number) => {
  return useWriteOffsStore.items.filter((item: WriteOff) => item.responsible === responsibleId)
}
```

### Типы

```typescript
export interface WriteOff {
  id: number;
  date: string;
  object: number;
  object_name: string;
  material: number;
  material_name: string;
  unit: number;
  unit_code: string;
  quantity: string;
  stage: Stage;
  responsible: number;
  responsible_name?: string;
  comment?: string;
  is_archived: boolean;
  current_balance: string;
  smart_quantity: SmartQuantity;
  created_at: string;
  updated_at: string;
}

export interface WriteOffCreateRequest {
  date: string;
  object: number;
  material: number | null;
  unit: number;
  quantity: string;
  stage: Stage;
  responsible: number;
  comment?: string;
}

export interface WriteOffUpdateRequest {
  date?: string;
  object?: number;
  material?: number | null;
  unit?: number;
  quantity?: string;
  stage?: Stage;
  responsible?: number;
  comment?: string;
}
```

## Бизнес-логика

### Автозаполнение полей

1. **При выборе объекта:**
   - Загружаются материалы, доступные для этого объекта
   - Автоматически выбирается ответственный за объект
   - Сбрасываются поля "Материал" и "Единица измерения"

2. **При выборе материала:**
   - Автоматически подставляется единица измерения из материала
   - Поле "Единица измерения" блокируется для редактирования

3. **При изменении ответственного:**
   - Поле помечается как измененное пользователем
   - Автозаполнение отключается

### Валидация

- **Количество**: Должно быть больше 0
- **Объект**: Обязательное поле
- **Материал**: Может быть null (для общих списаний)
- **Единица измерения**: Обязательное поле
- **Ответственный**: Обязательное поле
- **Дата**: Обязательное поле

### Журнал движений

Каждое списание автоматически создает запись в журнале движений (StockSnapshot):
- **Тип**: `writeoff`
- **Количество**: Отрицательное (расход)
- **Единица**: Базовая единица материала
- **Конвертация**: Автоматическая конвертация в базовую единицу

## Результат

Система списаний полностью реализована и интегрирована в проект ELOM:

### ✅ Реализовано:
- **Backend модель WriteOff** с полной валидацией
- **Автоматическое формирование записей** в журнале движений
- **Frontend форма списаний** с автозаполнением
- **Список списаний** с фильтрацией и экспортом
- **Мобильные карточки** для отображения списаний
- **Упрощенный интерфейс** без предупреждений
- **API интеграция** с полным CRUD

### 🎯 Особенности:
- **Автозаполнение**: Умное автозаполнение полей на основе выбранного объекта
- **Валидация**: Проверка корректности данных
- **Журнал движений**: Автоматическое формирование записей
- **Упрощенный UI**: Только актуальный остаток, без предупреждений
- **Мобильная поддержка**: Адаптивные карточки для мобильных устройств

Система готова к использованию в продакшене! 🚀
