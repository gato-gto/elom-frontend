# Улучшения отображения ошибок валидации

## Проблема

В формах закупок ошибки валидации не отображались корректно. API возвращает вложенные ошибки в формате:

```json
{
    "detail": "Validation error",
    "errors": {
        "items": [
            {
                "material": ["Недопустимый первичный ключ \"0\" - объект не существует."],
                "unit": ["Недопустимый первичный ключ \"0\" - объект не существует."],
                "quantity": ["Убедитесь, что это значение больше либо равно 0.001."]
            }
        ]
    }
}
```

Но система не могла правильно парсить и отображать такие вложенные ошибки.

## Решение

### 1. Улучшен парсинг ошибок в `errorHandler.ts`

Добавлена функция `parseNestedErrors()` которая:

- Парсит массивы ошибок (например, `items[0].material`)
- Парсит вложенные объекты (например, `object.name`)
- Обрабатывает смешанные структуры ошибок
- Возвращает плоскую структуру для удобного отображения

```typescript
function parseNestedErrors(errors: any): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  
  for (const [key, value] of Object.entries(errors)) {
    if (Array.isArray(value)) {
      // Обрабатываем массивы (например, items)
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          // Обрабатываем объекты в массиве
          for (const [fieldKey, fieldErrors] of Object.entries(item)) {
            if (Array.isArray(fieldErrors)) {
              const nestedKey = `${key}[${index}].${fieldKey}`
              result[nestedKey] = fieldErrors as string[]
            }
          }
        }
      })
    }
    // ... обработка других типов
  }
  
  return result
}
```

### 2. Обновлен `useGenericForm.ts`

Улучшена функция `getFieldError()` для поддержки вложенных ошибок:

```typescript
function getFieldError(key: string): string {
  // Проверяем прямую ошибку
  if (errors.value[key]) {
    return errors.value[key]
  }
  
  // Проверяем вложенные ошибки для массивов (например, items[0].material)
  const arrayMatch = key.match(/^(.+)\[(\d+)\]\.(.+)$/)
  if (arrayMatch) {
    const [, arrayKey, index, fieldKey] = arrayMatch
    const nestedKey = `${arrayKey}[${index}].${fieldKey}`
    return errors.value[nestedKey] || ''
  }
  
  // Проверяем вложенные ошибки для объектов (например, object.name)
  const objectMatch = key.match(/^(.+)\.(.+)$/)
  if (objectMatch) {
    const [, objectKey, fieldKey] = objectMatch
    const nestedKey = `${objectKey}.${fieldKey}`
    return errors.value[nestedKey] || ''
  }
  
  return ''
}
```

### 3. Обновлен `PurchaseForm.vue`

Добавлена функция `getItemFieldError()` для получения ошибок конкретных полей позиций:

```typescript
function getItemFieldError(itemIndex: number, fieldName: string): string {
  const errorKey = `items[${itemIndex}].${fieldName}`
  return errors[errorKey] || ''
}
```

Обновлен шаблон для отображения ошибок в полях позиций:

```vue
<!-- Desktop view -->
<input 
  v-model="it.quantity" 
  type="number" 
  step="0.001" 
  min="0" 
  class="input input-bordered input-sm w-full"
  :class="{ 'input-error': getItemFieldError(idx, 'quantity') }"
  @input="recalc(it)"
/>
<div v-if="getItemFieldError(idx, 'quantity')" class="text-error text-xs mt-1">
  {{ getItemFieldError(idx, 'quantity') }}
</div>
```

## Результат

### До улучшений:
- Ошибки валидации не отображались в полях позиций
- Пользователь не видел, какие именно поля содержат ошибки
- Сложно было понять, что нужно исправить

### После улучшений:
- ✅ Ошибки отображаются под каждым полем с ошибкой
- ✅ Поля с ошибками подсвечиваются красным цветом
- ✅ Четкие сообщения об ошибках на русском языке
- ✅ Поддержка как desktop, так и mobile версий
- ✅ Работает для всех типов форм (GenericForm и прямые FormField)

## Поддерживаемые структуры ошибок

### 1. Простые ошибки полей
```json
{
  "name": ["Это поле обязательно"],
  "email": ["Введите корректный email"]
}
```

### 2. Ошибки массивов (позиции закупок)
```json
{
  "items": [
    {
      "material": ["Недопустимый первичный ключ \"0\" - объект не существует."],
      "quantity": ["Убедитесь, что это значение больше либо равно 0.001."]
    }
  ]
}
```

### 3. Ошибки вложенных объектов
```json
{
  "object": {
    "name": ["Название объекта обязательно"],
    "location": ["Адрес не может быть пустым"]
  }
}
```

### 4. Смешанные ошибки
```json
{
  "name": ["Это поле обязательно"],
  "items": [{"material": ["Ошибка материала"]}],
  "object": {"name": ["Ошибка объекта"]}
}
```

## Тестирование

Создан тестовый файл `src/test/validation-errors.test.ts` с примерами всех поддерживаемых структур ошибок.

## Совместимость

- ✅ Все существующие формы продолжают работать
- ✅ Обратная совместимость с простыми ошибками
- ✅ Поддержка всех типов форм (GenericForm, FormField)
- ✅ Работает на всех устройствах (desktop, mobile)

## Затронутые файлы

1. `src/utils/errorHandler.ts` - улучшен парсинг ошибок
2. `src/composables/useGenericForm.ts` - поддержка вложенных ошибок
3. `src/pages/Purchases/PurchaseForm.vue` - отображение ошибок позиций
4. `src/test/validation-errors.test.ts` - тесты парсинга ошибок

## Заключение

Теперь все формы корректно отображают ошибки валидации, включая сложные вложенные структуры. Пользователи получают четкую обратную связь о том, какие поля содержат ошибки и как их исправить.
