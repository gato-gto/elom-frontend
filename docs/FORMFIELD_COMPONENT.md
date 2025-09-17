# FormField Component v2.0

Универсальный компонент для создания полей форм с поддержкой всех типов ввода и DaisyUI стилей.

## 🚀 Новые возможности v2.0

### ✨ Новые типы полей:
- **Switch** - переключатель (toggle)
- **Range** - ползунок для выбора числового значения
- **Улучшенный File Input** - с поддержкой множественного выбора

### 🎨 Улучшенный дизайн:
- **Размеры** - xs, sm, md, lg для всех типов полей (соответствует [DaisyUI](https://daisyui.com/components/select/))
- **Кастомные классы** - возможность добавления собственных CSS классов
- **Улучшенная типизация** - строгая типизация для всех props
- **События** - focus, blur, input для всех полей
- **Полное соответствие DaisyUI** - все классы соответствуют официальной документации

### 📱 Дополнительные возможности:
- **Автодополнение** - поддержка autocomplete атрибута
- **Ограничения** - min, max, step, maxlength
- **Счетчик символов** - для textarea с maxlength
- **Слоты** - для кастомных опций в select

## 📋 API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `any` | - | Значение поля (v-model) |
| `type` | `'input' \| 'textarea' \| 'select' \| 'file' \| 'checkbox' \| 'radio' \| 'switch' \| 'range'` | `'input'` | Тип поля |
| `inputType` | `string` | `'text'` | Тип input (text, email, password, number, etc.) |
| `label` | `string` | - | Подпись поля |
| `placeholder` | `string` | - | Плейсхолдер |
| `helpText` | `string` | - | Текст подсказки |
| `errorMessage` | `string` | - | Сообщение об ошибке |
| `required` | `boolean` | `false` | Обязательное поле |
| `disabled` | `boolean` | `false` | Отключенное поле |
| `readonly` | `boolean` | `false` | Только для чтения |
| `hasError` | `boolean` | `false` | Состояние ошибки |
| `options` | `Option[]` | `[]` | Опции для select/radio |
| `rows` | `number` | `3` | Количество строк для textarea |
| `accept` | `string` | - | Типы файлов для file input |
| `multiple` | `boolean` | `false` | Множественный выбор файлов |
| `checkboxLabel` | `string` | - | Подпись для checkbox |
| `switchLabel` | `string` | - | Подпись для switch |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Размер поля |
| `customClass` | `string` | - | Дополнительные CSS классы |
| `min` | `number \| string` | - | Минимальное значение |
| `max` | `number \| string` | - | Максимальное значение |
| `step` | `number \| string` | - | Шаг для числовых полей |
| `maxlength` | `number` | - | Максимальная длина текста |
| `autocomplete` | `string` | - | Автодополнение |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `any` | Обновление значения |
| `blur` | - | Потеря фокуса |
| `focus` | - | Получение фокуса |

### Slots

| Slot | Description |
|------|-------------|
| `default` | Кастомное содержимое поля |
| `options` | Кастомные опции для select |

## 💡 Примеры использования

### Базовые поля

```vue
<template>
  <!-- Текстовое поле -->
  <FormField
    v-model="name"
    label="Имя"
    placeholder="Введите имя"
    required
  />

  <!-- Email поле -->
  <FormField
    v-model="email"
    type="input"
    input-type="email"
    label="Email"
    placeholder="user@example.com"
    required
  />

  <!-- Числовое поле -->
  <FormField
    v-model="age"
    type="input"
    input-type="number"
    label="Возраст"
    :min="0"
    :max="120"
    :step="1"
  />

  <!-- Пароль -->
  <FormField
    v-model="password"
    type="input"
    input-type="password"
    label="Пароль"
    required
  />
</template>
```

### Текстовые области

```vue
<template>
  <!-- Обычная textarea -->
  <FormField
    v-model="description"
    type="textarea"
    label="Описание"
    placeholder="Введите описание"
    :rows="4"
  />

  <!-- Textarea с ограничением длины -->
  <FormField
    v-model="comment"
    type="textarea"
    label="Комментарий"
    :maxlength="500"
    help-text="Максимум 500 символов"
  />
</template>
```

### Выбор значений

```vue
<template>
  <!-- Select -->
  <FormField
    v-model="category"
    type="select"
    label="Категория"
    placeholder="Выберите категорию"
    :options="categoryOptions"
  />

  <!-- Radio buttons -->
  <FormField
    v-model="status"
    type="radio"
    label="Статус"
    :options="statusOptions"
  />

  <!-- Checkbox -->
  <FormField
    v-model="agreed"
    type="checkbox"
    label="Согласен с условиями"
    required
  />

  <!-- Switch -->
  <FormField
    v-model="notifications"
    type="switch"
    label="Уведомления"
  />
</template>

<script setup>
const categoryOptions = [
  { value: 1, label: 'Категория 1' },
  { value: 2, label: 'Категория 2' }
]

const statusOptions = [
  { value: 'active', label: 'Активный' },
  { value: 'inactive', label: 'Неактивный' }
]
</script>
```

### Файлы и диапазоны

```vue
<template>
  <!-- Одиночный файл -->
  <FormField
    v-model="avatar"
    type="file"
    label="Аватар"
    accept="image/*"
  />

  <!-- Множественные файлы -->
  <FormField
    v-model="documents"
    type="file"
    label="Документы"
    accept=".pdf,.doc,.docx"
    :multiple="true"
  />

  <!-- Range slider -->
  <FormField
    v-model="volume"
    type="range"
    label="Громкость"
    :min="0"
    :max="100"
    :step="1"
  />
</template>
```

### Размеры и стили

```vue
<template>
  <!-- Маленькое поле -->
  <FormField
    v-model="code"
    label="Код"
    size="sm"
    custom-class="font-mono"
  />

  <!-- Большое поле -->
  <FormField
    v-model="title"
    label="Заголовок"
    size="lg"
    custom-class="text-2xl"
  />

  <!-- Поле с ошибкой -->
  <FormField
    v-model="email"
    label="Email"
    :has-error="true"
    error-message="Неверный формат email"
  />
</template>
```

### Кастомные опции

```vue
<template>
  <!-- Select с кастомными опциями -->
  <FormField
    v-model="country"
    type="select"
    label="Страна"
  >
    <template #options>
      <option value="ru">🇷🇺 Россия</option>
      <option value="us">🇺🇸 США</option>
      <option value="de">🇩🇪 Германия</option>
    </template>
  </FormField>
</template>
```

## 🎨 Стилизация

### Размеры
- `size="xs"` - очень маленькие поля
- `size="sm"` - маленькие поля
- `size="md"` - средние поля (по умолчанию)
- `size="lg"` - большие поля

### Состояния
- `hasError` - красная обводка и текст ошибки
- `disabled` - отключенное состояние
- `readonly` - только для чтения

### Кастомные классы
Используйте `customClass` для добавления собственных CSS классов:

```vue
<FormField
  v-model="value"
  label="Поле"
  custom-class="border-2 border-blue-500"
/>
```

## 🔧 Миграция с v1.0

### Изменения в API:
1. **Новые типы**: `switch`, `range`
2. **Новые props**: `size`, `customClass`, `min`, `max`, `step`, `maxlength`, `autocomplete`
3. **Новые события**: `focus`
4. **Улучшенная типизация**: строгие типы для всех props

### Обратная совместимость:
- Все существующие props работают как раньше
- Старые формы не требуют изменений
- Новые возможности доступны опционально

## 🎨 Соответствие DaisyUI

FormField v2.0 полностью соответствует официальной документации [DaisyUI](https://daisyui.com/components/select/):

### ✅ Поддерживаемые компоненты:
- **Input** - [DaisyUI Input](https://daisyui.com/components/input/) с классами `input`, `input-bordered`, `input-xs/sm/md/lg`
- **Select** - [DaisyUI Select](https://daisyui.com/components/select/) с классами `select`, `select-bordered`, `select-xs/sm/md/lg`
- **Textarea** - с классами `textarea`, `textarea-bordered`, `textarea-xs/sm/md/lg`
- **File Input** - с классами `file-input`, `file-input-bordered`, `file-input-xs/sm/md/lg`
- **Checkbox** - с классами `checkbox`, `checkbox-xs/sm/md/lg`
- **Radio** - с классами `radio`, `radio-xs/sm/md/lg`
- **Toggle** - с классами `toggle`, `toggle-primary`, `toggle-xs/sm/md/lg`
- **Range** - с классами `range`, `range-primary`, `range-xs/sm/md/lg`

### 🎯 Размеры (соответствуют DaisyUI):
- `xs` - Extra small
- `sm` - Small  
- `md` - Medium (по умолчанию)
- `lg` - Large

### 🎨 Состояния ошибок:
- `input-error`, `select-error`, `textarea-error` и т.д.

## 🚀 Готово к использованию!

FormField v2.0 полностью готов к использованию во всех формах проекта. Все существующие формы продолжают работать, а новые возможности доступны для улучшения UX.
