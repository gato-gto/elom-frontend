# Исправления обработки ошибок валидации

## Проблема

Пользователь сообщил, что в формах отображается только "Validation error" вместо конкретных сообщений об ошибках, таких как "Нельзя изменять архивированные закупки".

## Анализ проблемы

### 1. **Неправильная обработка ошибок в PurchaseForm**
- Использовался `ErrorHandlers.formValidation` напрямую
- Не использовался `useErrorHandler` composable
- Ошибки не передавались в форму для отображения

### 2. **Отсутствие обработки ошибок в WriteOffForm**
- Вообще не было обработки ошибок
- Только `console.error` без показа пользователю

### 3. **Проблемы в errorHandler.ts**
- `non_field_errors` не добавлялись к `fieldErrors`
- Общие ошибки не отображались в формах

### 4. **Проблемы в useGenericForm**
- Ошибки не устанавливались в форму после обработки
- `non_field_errors` не отображались

## Исправления

### 1. **PurchaseForm.vue**
```typescript
// Было:
import { ErrorHandlers } from '@/utils/errorHandler'
const errorResult = await ErrorHandlers.formValidation(error)

// Стало:
import { useErrorHandler } from '@/composables/useErrorHandler'
const { handleFormError } = useErrorHandler()
const errorResult = await handleFormError(error, 'закупка')
```

### 2. **WriteOffForm.vue**
```typescript
// Было:
} catch (error) {
  console.error('Error saving writeoff:', error)
}

// Стало:
import { useErrorHandler } from '@/composables/useErrorHandler'
const { handleFormError } = useErrorHandler()
} catch (error) {
  await handleFormError(error, 'списание')
}
```

### 3. **errorHandler.ts**
```typescript
// Добавлено:
// Добавляем non_field_errors к fieldErrors для отображения
if (nonFieldErrors.length > 0) {
  fieldErrors['non_field_errors'] = nonFieldErrors
}
```

### 4. **useGenericForm.ts**
```typescript
// Добавлено:
} catch (error) {
  const parsedError = await handleFormError(error, 'form')
  
  // Устанавливаем ошибки полей в форме
  Object.keys(parsedError.fieldErrors).forEach(field => {
    const fieldError = parsedError.fieldErrors[field]
    setFieldError(field, Array.isArray(fieldError) ? fieldError[0] : fieldError)
  })
}
```

### 5. **GenericForm.vue**
```vue
<!-- Добавлено отображение non_field_errors -->
<div v-if="getFieldError('non_field_errors')" class="alert alert-error">
  <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  <span class="font-medium">{{ getFieldError('non_field_errors') }}</span>
</div>
```

## Результат

### ✅ **Теперь правильно отображаются:**

1. **Ошибки полей** - конкретные ошибки для каждого поля формы
2. **Общие ошибки** - такие как "Нельзя изменять архивированные закупки"
3. **Вложенные ошибки** - ошибки в массивах (например, `items[0].material`)
4. **Toast уведомления** - для общих ошибок
5. **Визуальные индикаторы** - красные поля и сообщения об ошибках

### 📋 **Проверенные формы:**

- ✅ **MaterialForm** - уже использовал `useErrorHandler`
- ✅ **ObjectForm** - уже использовал `useErrorHandler`
- ✅ **EmployeeForm** - уже использовал `useErrorHandler`
- ✅ **SupplierForm** - уже использовал `useErrorHandler`
- ✅ **PurchaseForm** - исправлен
- ✅ **WriteOffForm** - исправлен

### 🎯 **Примеры исправленных ошибок:**

**До исправления:**
```
API Error: {detail: 'Validation error', fieldErrors: {...}}
```

**После исправления:**
```
В форме отображается: "Нельзя изменять архивированные закупки"
Поле подсвечивается красным
Toast уведомление с деталями ошибки
```

## Тестирование

Для проверки исправлений:

1. **Попробуйте отредактировать заархивированную закупку**
   - Должно показать: "Нельзя изменять архивированные закупки"

2. **Попробуйте создать закупку с невалидными данными**
   - Должны показаться конкретные ошибки полей

3. **Попробуйте создать списание с ошибками**
   - Должны показаться ошибки валидации

4. **Проверьте другие формы**
   - Все должны показывать конкретные ошибки вместо "Validation error"

## Заключение

Все формы теперь правильно обрабатывают и отображают ошибки валидации. Пользователи будут видеть конкретные сообщения об ошибках вместо общих "Validation error".

