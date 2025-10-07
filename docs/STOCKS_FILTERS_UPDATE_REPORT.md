# Отчет об обновлении фильтров в разделе "Остатки"

**Дата:** 3 октября 2025  
**Версия:** 1.0  
**Статус:** Завершено

## Обзор

Обновлен раздел "Остатки" (`/stocks`) для поддержки всех фильтров, доступных в API согласно `StockSnapshotFilter`.

## Доступные фильтры в API

### Согласно `stock/filters.py`:
```python
class StockSnapshotFilter(df.FilterSet):
    date_from = df.DateFilter(field_name="date", lookup_expr="gte")
    date_to = df.DateFilter(field_name="date", lookup_expr="lte")
    object = df.NumberFilter(field_name="object_id")
    material = df.NumberFilter(field_name="material_id")
    unit = df.NumberFilter(field_name="unit_id")
    responsible = df.NumberFilter(field_name="responsible_id")
    stage = df.CharFilter(field_name="stage")
    source_type = df.CharFilter(field_name="source_type")
    source_id = df.NumberFilter(field_name="source_id")
    comment = df.CharFilter(field_name="comment", lookup_expr="icontains")
    min_quantity = df.NumberFilter(field_name="quantity_signed", lookup_expr="gte")
    max_quantity = df.NumberFilter(field_name="quantity_signed", lookup_expr="lte")
    is_archived = StrictBooleanFilter(field_name="is_archived")
```

### Согласно OpenAPI схеме:
- `search` - Поиск по comment|material__name|object__name
- `ordering` - Сортировка
- `date_from` - Дата ≥ (YYYY-MM-DD)
- `date_to` - Дата ≤ (YYYY-MM-DD)
- `object` - ID объекта
- `material` - ID материала
- `stage` - acceptance|request|delivery_fixed|post_rough|handover
- `is_archived` - Флаг архива: true|false

## Реализованные фильтры

### ✅ **Основные фильтры:**
1. **search** - Поиск по материалам, объектам, комментариям
2. **object** - Фильтр по объекту (select)
3. **material** - Фильтр по материалу (select)
4. **stage** - Фильтр по этапу работ (select)
5. **source_type** - Фильтр по типу источника (select)
6. **responsible** - Фильтр по ответственному (select)
7. **date_from** - Дата от (date)
8. **date_to** - Дата до (date)
9. **is_archived** - Фильтр по архиву (select)

### ✅ **Опции для select фильтров:**

#### Этапы работ:
```javascript
const stageOptions = [
  { value: '', label: 'Все этапы' },
  { value: 'acceptance', label: 'Приемка' },
  { value: 'request', label: 'Заявка' },
  { value: 'delivery_fixed', label: 'Доставка' },
  { value: 'post_rough', label: 'После черновых' },
  { value: 'handover', label: 'Сдача' }
]
```

#### Типы источников:
```javascript
const sourceTypeOptions = [
  { value: '', label: 'Все источники' },
  { value: 'purchase_item', label: 'Закупка' },
  { value: 'writeoff', label: 'Списание' }
]
```

#### Архив:
```javascript
const archiveOptions = [
  { value: '', label: 'Все' },
  { value: 'false', label: 'Активные' },
  { value: 'true', label: 'Архивные' }
]
```

## Изменения в коде

### 1. **Добавлены computed свойства:**
```javascript
const stageOptions = computed(() => [...])
const sourceTypeOptions = computed(() => [...])
const responsibleOptions = computed(() => [...])
```

### 2. **Обновлена конфигурация фильтров:**
```javascript
filters: [
  // ... существующие фильтры
  {
    key: 'stage',
    type: 'select',
    label: 'Этап работ',
    options: stageOptions.value
  },
  {
    key: 'source_type',
    type: 'select',
    label: 'Тип источника',
    options: sourceTypeOptions.value
  },
  {
    key: 'responsible',
    type: 'select',
    label: 'Ответственный',
    options: responsibleOptions.value
  },
  {
    key: 'date_from',
    type: 'date',
    label: 'Дата от'
  },
  {
    key: 'date_to',
    type: 'date',
    label: 'Дата до'
  },
  {
    key: 'is_archived',
    type: 'select',
    label: 'Архив',
    options: [...]
  }
]
```

### 3. **Увеличено количество колонок фильтров:**
```javascript
filterColumns: 4  // Было 3
```

## Не реализованные фильтры

### ❌ **Фильтры, которые не добавлены в UI:**
- `unit` - Фильтр по единице измерения
- `source_id` - Фильтр по ID источника
- `comment` - Фильтр по комментарию (отдельно от search)
- `min_quantity` - Минимальное количество
- `max_quantity` - Максимальное количество

### Причины:
- `unit` - Редко используется, можно добавить при необходимости
- `source_id` - Технический фильтр, не нужен в UI
- `comment` - Дублирует функциональность search
- `min_quantity/max_quantity` - Сложные для UI, можно добавить позже

## Результат

### ✅ **Что работает:**
- Все основные фильтры из API
- Корректные опции для select фильтров
- Адаптивная верстка (4 колонки)
- Интеграция с GenericList

### ✅ **Пользовательский опыт:**
- Удобная фильтрация по всем основным параметрам
- Понятные названия фильтров
- Возможность комбинировать фильтры
- Быстрый поиск и сортировка

## Тестирование

### Проверенные сценарии:
1. ✅ Фильтрация по объекту
2. ✅ Фильтрация по материалу
3. ✅ Фильтрация по этапу работ
4. ✅ Фильтрация по типу источника
5. ✅ Фильтрация по ответственному
6. ✅ Фильтрация по датам
7. ✅ Фильтрация по архиву
8. ✅ Комбинирование фильтров
9. ✅ Сброс фильтров

## Заключение

Раздел "Остатки" теперь поддерживает все основные фильтры из API, что значительно улучшает возможности поиска и анализа данных по остаткам материалов.

**Статус:** ✅ **ГОТОВО К ИСПОЛЬЗОВАНИЮ**

---

**ELOM** - система с полной поддержкой фильтрации остатков! 🎯
