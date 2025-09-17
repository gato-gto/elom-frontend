# Анализ API Backend - Требуемые доработки

## 🔍 Обзор

После изучения документации API и сравнения с frontend кодом, выявлены следующие несоответствия и требуемые доработки backend.

## ❌ Критические несоответствия

### 1. **Фильтры закупок (Purchases)**

**Проблема:** Frontend использует параметры, которые не поддерживаются backend.

**Frontend ожидает:**
```typescript
interface PurchaseListFilters {
  date_after?: string;      // YYYY-MM-DD
  date_before?: string;     // YYYY-MM-DD
  object?: ID;
  material?: ID;            // ❌ НЕ ПОДДЕРЖИВАЕТСЯ
  responsible?: ID;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
  is_archived?: boolean;
}
```

**Backend поддерживает:**
```python
# В PurchaseFilter отсутствует фильтр по material
# Нужно добавить фильтр по материалу через связанные PurchaseItem
```

**Решение:** Добавить в `purchases/filters.py`:
```python
class PurchaseFilter(django_filters.FilterSet):
    # ... существующие фильтры
    material = django_filters.NumberFilter(
        field_name='items__material', 
        lookup_expr='exact',
        help_text='Фильтр по материалу через позиции закупки'
    )
```

### 2. **Отсутствует поле `responsible_name` в ответе**

**Проблема:** Frontend ожидает `responsible_name`, но backend возвращает только `responsible` (ID).

**Frontend код:**
```typescript
// В List.vue строка 63
responsible_name: (p as any).responsible_name ?? p.responsible ?? '—'
```

**Решение:** Обновить `PurchaseSerializer` в `purchases/serializers.py`:
```python
class PurchaseSerializer(serializers.ModelSerializer):
    responsible_name = serializers.CharField(source='responsible.username', read_only=True)
    # ... остальные поля
```

### 3. **Отсутствует поле `object_name` в ответе**

**Проблема:** Аналогично с `object_name`.

**Решение:** Добавить в `PurchaseSerializer`:
```python
object_name = serializers.CharField(source='object.name', read_only=True)
```

### 4. **Неправильные параметры фильтрации дат**

**Проблема:** Frontend использует `date_after`/`date_before`, backend ожидает `date_from`/`date_to`.

**Frontend:**
```typescript
date_after: undefined, date_before: undefined
```

**Backend:**
```python
# В PurchaseFilter
date_from = django_filters.DateFilter(field_name='date', lookup_expr='gte')
date_to = django_filters.DateFilter(field_name='date', lookup_expr='lte')
```

**Решение:** Обновить frontend для использования правильных параметров или добавить алиасы в backend.

## ⚠️ Потенциальные проблемы

### 5. **Импорт Excel - несоответствие типов**

**Frontend типы:**
```typescript
export interface ImportPrepareResponse {
  ok: boolean;
  sheets: string[];
  columns?: string[];
  hash: ImportHash;
  warnings?: string[];
}
```

**Backend возвращает:**
```python
{
  "header": ["Дата", "Объект", ...],
  "auto_mapping": {"date": 0, "object": 1, ...}
}
```

**Решение:** Привести к единому формату или обновить frontend типы.

### 6. **Stock Snapshots - лишние поля**

**Frontend ожидает:**
```typescript
interface StockSnapshot {
  // ... основные поля
  purchased_qty: string;    // ❌ НЕ ПОДДЕРЖИВАЕТСЯ
  write_off_qty: string;    // ❌ НЕ ПОДДЕРЖИВАЕТСЯ
}
```

**Backend модель не содержит эти поля.**

**Решение:** Удалить из frontend типов или добавить в backend модель.

### 7. **Archive Periods - несоответствие полей**

**Frontend ожидает:**
```typescript
interface ArchivePeriod {
  // ... основные поля
  is_closed?: boolean;      // ❌ НЕ ПОДДЕРЖИВАЕТСЯ
}
```

**Решение:** Удалить из frontend типов или добавить computed поле в backend.

## 🔧 Рекомендуемые доработки Backend

### 1. **Обновить PurchaseSerializer**

```python
# purchases/serializers.py
class PurchaseSerializer(serializers.ModelSerializer):
    object_name = serializers.CharField(source='object.name', read_only=True)
    responsible_name = serializers.CharField(source='responsible.username', read_only=True)
    
    class Meta:
        model = Purchase
        fields = [
            'id', 'date', 'object', 'object_name', 'supplier', 
            'invoice_number', 'vat_included', 'currency', 'comment',
            'responsible', 'responsible_name', 'total_amount', 
            'is_archived', 'cover_photo_url', 'items', 'photos',
            'created_at', 'updated_at'
        ]
```

### 2. **Обновить PurchaseFilter**

```python
# purchases/filters.py
class PurchaseFilter(django_filters.FilterSet):
    # Существующие фильтры
    date_from = django_filters.DateFilter(field_name='date', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='date', lookup_expr='lte')
    object = django_filters.NumberFilter(field_name='object')
    responsible = django_filters.NumberFilter(field_name='responsible')
    is_archived = django_filters.BooleanFilter(field_name='is_archived')
    
    # Новые фильтры
    material = django_filters.NumberFilter(
        field_name='items__material', 
        lookup_expr='exact',
        help_text='Фильтр по материалу через позиции закупки'
    )
    
    # Алиасы для совместимости с frontend
    date_after = django_filters.DateFilter(field_name='date', lookup_expr='gte')
    date_before = django_filters.DateFilter(field_name='date', lookup_expr='lte')
    
    class Meta:
        model = Purchase
        fields = ['date_from', 'date_to', 'date_after', 'date_before', 
                 'object', 'responsible', 'is_archived', 'material']
```

### 3. **Обновить ImportPrepareView**

```python
# purchases/views.py
class ImportPrepareView(APIView):
    def post(self, request):
        # ... существующий код ...
        
        return Response({
            "ok": True,
            "sheets": [wb.sheetnames[0]],  # Пока только первый лист
            "columns": header,
            "hash": hashlib.sha256(xlsx.read()).hexdigest(),
            "header": header,  # Для обратной совместимости
            "auto_mapping": mapping,  # Для обратной совместимости
            "warnings": []
        })
```

### 4. **Добавить computed поля в StockSnapshotSerializer**

```python
# stock/serializers.py
class StockSnapshotSerializer(serializers.ModelSerializer):
    object_name = serializers.CharField(source='object.name', read_only=True)
    material_name = serializers.CharField(source='material.name', read_only=True)
    unit_code = serializers.CharField(source='unit.code', read_only=True)
    responsible_name = serializers.CharField(source='responsible.username', read_only=True)
    
    # Computed поля (если нужны)
    purchased_qty = serializers.SerializerMethodField()
    write_off_qty = serializers.SerializerMethodField()
    
    def get_purchased_qty(self, obj):
        # Логика вычисления закупленного количества
        return "0.000"
    
    def get_write_off_qty(self, obj):
        # Логика вычисления списанного количества
        return "0.000"
    
    class Meta:
        model = StockSnapshot
        fields = [
            'id', 'date', 'object', 'object_name', 'material', 'material_name',
            'unit', 'unit_code', 'quantity', 'stage', 'responsible', 'responsible_name',
            'comment', 'is_archived', 'purchased_qty', 'write_off_qty',
            'created_at', 'updated_at'
        ]
```

### 5. **Обновить ArchivePeriodSerializer**

```python
# stock/serializers.py
class ArchivePeriodSerializer(serializers.ModelSerializer):
    object_name = serializers.CharField(source='object.name', read_only=True)
    closed_by_name = serializers.CharField(source='closed_by.username', read_only=True)
    is_closed = serializers.SerializerMethodField()
    
    def get_is_closed(self, obj):
        return True  # Все записи в архиве считаются закрытыми
    
    class Meta:
        model = ArchivePeriod
        fields = [
            'id', 'month', 'object', 'object_name', 
            'closed_at', 'closed_by', 'closed_by_name', 'is_closed'
        ]
```

## 📋 Приоритеты доработок

### 🔴 Высокий приоритет (критично для работы)
1. Добавить `object_name` и `responsible_name` в PurchaseSerializer
2. Добавить фильтр по материалу в PurchaseFilter
3. Исправить параметры фильтрации дат

### 🟡 Средний приоритет (улучшение UX)
4. Обновить ImportPrepareView для соответствия типам
5. Добавить computed поля в StockSnapshotSerializer
6. Обновить ArchivePeriodSerializer

### 🟢 Низкий приоритет (оптимизация)
7. Добавить алиасы для обратной совместимости
8. Улучшить обработку ошибок в API
9. Добавить валидацию параметров

## 🧪 Тестирование

После внесения изменений необходимо протестировать:

1. **Загрузка списка закупок** с различными фильтрами
2. **Импорт Excel** файлов
3. **Работа с остатками** (stock snapshots)
4. **Архивирование периодов**
5. **Экспорт отчетов**

## 📝 Заключение

Основные проблемы связаны с несоответствием полей в ответах API и параметров фильтрации. Большинство проблем можно решить обновлением serializers и filters без изменения бизнес-логики.

Рекомендуется начать с исправлений высокого приоритета, так как они критичны для корректной работы frontend приложения.
