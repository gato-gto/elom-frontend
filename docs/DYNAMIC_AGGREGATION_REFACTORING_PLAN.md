# План перехода на динамическую агрегацию данных

**Дата создания:** 3 октября 2025  
**Версия:** 1.0  
**Статус:** В процессе реализации

## Обзор

Переход от хранения избыточных вычисляемых данных к динамической агрегации on-the-fly для минимизации избыточности, упрощения схемы БД и автоматической согласованности данных.

---

## 1. Анализ избыточных данных

### 1.1 Выявленные избыточные поля

#### Purchase (purchases/models.py)
- ❌ **`total_amount`** (DecimalField) - сумма позиций закупки
  - **Источник:** `SUM(PurchaseItem.quantity * PurchaseItem.price)`
  - **Использование:** Отображение в списках, отчетах, сортировка
  - **Статус:** ✅ Удалено, заменено на метод `get_total_amount()`

#### PurchaseItem (purchases/models.py)
- ❌ **`amount`** (DecimalField) - произведение количества на цену
  - **Источник:** `quantity * price`
  - **Использование:** Отображение в позициях, расчет total_amount
  - **Статус:** ✅ Удалено, заменено на `SerializerMethodField`

#### Material (common/models.py)
- ❌ **`average_price`** (DecimalField) - средняя цена материала
  - **Источник:** `AVG(PurchaseItem.price WHERE material=X)`
  - **Использование:** Отображение в справочнике материалов
  - **Статус:** ✅ Удалено, заменено на агрегацию

#### MaterialSerializer (common/serializers.py)
- ❌ **`purchases_count`** (SerializerMethodField) - количество закупок
  - **Источник:** `COUNT(PurchaseItem WHERE material=X)`
  - **Статус:** ✅ Переведено на `MaterialAggregationService`

- ❌ **`total_purchased_amount`** (SerializerMethodField) - общая сумма закупок
  - **Источник:** `SUM(PurchaseItem.amount WHERE material=X)`
  - **Статус:** ✅ Переведено на `MaterialAggregationService`

- ❌ **`last_purchase_date`** (SerializerMethodField) - дата последней закупки
  - **Источник:** `MAX(Purchase.date WHERE material=X)`
  - **Статус:** ✅ Переведено на `MaterialAggregationService`

- ❌ **`current_stock`** (SerializerMethodField) - текущий остаток
  - **Источник:** `SUM(StockSnapshot.quantity_signed WHERE material=X)`
  - **Статус:** ✅ Переведено на `MaterialAggregationService`

#### MaterialCategorySerializer (common/serializers.py)
- ❌ **`children_count`** (SerializerMethodField) - количество дочерних категорий
  - **Источник:** `COUNT(MaterialCategory WHERE parent=X)`
  - **Статус:** ✅ Переведено на `CategoryAggregationService`

- ❌ **`materials_count`** (SerializerMethodField) - количество материалов
  - **Источник:** `COUNT(Material WHERE category=X)`
  - **Статус:** ✅ Переведено на `CategoryAggregationService`

- ❌ **`full_path`** (SerializerMethodField) - полный путь категории
  - **Источник:** Рекурсивный обход `parent`
  - **Статус:** ✅ Переведено на `CategoryAggregationService`

#### PurchaseSupplierSerializer (purchases/serializers.py)
- ❌ **`purchases_count`** (SerializerMethodField) - количество закупок у поставщика
  - **Источник:** `COUNT(Purchase WHERE supplier=X)`
  - **Статус:** ✅ Переведено на `PurchaseAggregationService`

- ❌ **`total_amount`** (SerializerMethodField) - общая сумма закупок
  - **Источник:** `SUM(Purchase.total_amount WHERE supplier=X)`
  - **Статус:** ✅ Переведено на `PurchaseAggregationService`

- ❌ **`avg_amount`** (SerializerMethodField) - средняя сумма закупки
  - **Источник:** `AVG(Purchase.total_amount WHERE supplier=X)`
  - **Статус:** ✅ Переведено на `PurchaseAggregationService`

- ❌ **`last_purchase_date`** (SerializerMethodField) - дата последней закупки
  - **Источник:** `MAX(Purchase.date WHERE supplier=X)`
  - **Статус:** ✅ Переведено на `PurchaseAggregationService`

### 1.2 Поля, которые ОСТАЮТСЯ (первичные транзакционные данные)

#### Purchase ✅
- `date`, `object`, `supplier`, `invoice_number`, `currency`, `comment`, `responsible`
- `is_archived`, `cover_photo`, `status`, `purchase_no`

#### PurchaseItem ✅
- `purchase`, `material`, `unit`, `quantity`, `price`

#### StockSnapshot ✅ (Unified Ledger)
- `date`, `object`, `material`, `unit`, `quantity_signed`, `stage`
- `source_type`, `source_id`, `responsible`, `comment`, `is_archived`

#### WriteOff ✅
- `date`, `object`, `material`, `unit`, `quantity`, `stage`
- `responsible`, `comment`, `is_archived`

#### Material ✅
- `name`, `sku`, `category`, `default_unit`, `photo`
- `is_active`, `created_date`, `description`, `manufacturer`

---

## 2. Создание сервисов агрегации

### 2.1 Созданные сервисы

#### ✅ `PurchaseAggregationService` (common/aggregation_services.py)
```python
- get_purchase_total_amount(purchase_id) → Decimal
- get_purchase_item_amount(quantity, price) → Decimal
- get_supplier_stats(supplier_id) → dict
```

#### ✅ `MaterialAggregationService` (common/aggregation_services.py)
```python
- get_material_stats(material_id) → dict
- get_material_average_price(material_id) → Decimal
```

#### ✅ `CategoryAggregationService` (common/aggregation_services.py)
```python
- get_category_stats(category_id) → dict
- get_category_full_path(category_id) → str
```

#### ✅ `StockAggregationService` (common/aggregation_services.py)
```python
- get_current_balance(object_id, material_id, date) → Decimal
- get_material_balance_summary(object_id, material_id) → dict
```

#### ✅ `ReportAggregationService` (common/aggregation_services.py)
```python
- get_purchases_by_object_stats(...) → QuerySet
- get_purchases_by_material_stats(...) → QuerySet
- get_purchases_by_responsible_stats(...) → QuerySet
- get_purchases_by_period_stats(...) → QuerySet
```

---

## 3. Обновление моделей

### 3.1 Удалённые поля

#### Purchase
```python
# БЫЛО:
total_amount = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0.00"))

# СТАЛО:
# total_amount удалено - вычисляется динамически через агрегацию

# ДОБАВЛЕН МЕТОД:
def get_total_amount(self):
    from common.aggregation_services import PurchaseAggregationService
    return PurchaseAggregationService.get_purchase_total_amount(self.id)
```

#### PurchaseItem
```python
# БЫЛО:
amount = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0.00"))

def save(self, *args, **kwargs):
    if self.quantity and self.price:
        self.amount = self.quantity * self.price
    super().save(*args, **kwargs)

# СТАЛО:
# amount удалено - вычисляется динамически через агрегацию (quantity * price)

def save(self, *args, **kwargs):
    # amount больше не сохраняется - вычисляется динамически
    super().save(*args, **kwargs)
```

#### Material
```python
# БЫЛО:
average_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

# СТАЛО:
# average_price удалено - вычисляется динамически через агрегацию
```

### 3.2 Удалённые/закомментированные сигналы

```python
# БЫЛО (purchases/models.py):
@receiver([post_save, post_delete], sender=PurchaseItem)
def _recalc_on_item_change(sender, instance, **kwargs):
    instance.purchase.recalc_total()

# СТАЛО:
# Сигнал для пересчета total_amount больше не нужен - вычисляется динамически
```

---

## 4. Обновление сериализаторов

### 4.1 PurchaseSerializer

```python
# ДОБАВЛЕНО:
total_amount = serializers.SerializerMethodField()

@extend_schema_field(serializers.DecimalField(max_digits=18, decimal_places=2))
def get_total_amount(self, obj):
    """Получить общую сумму закупки (динамически)"""
    return obj.get_total_amount()
```

### 4.2 PurchaseItemSerializer

```python
# ДОБАВЛЕНО:
amount = serializers.SerializerMethodField()

@extend_schema_field(serializers.DecimalField(max_digits=18, decimal_places=2))
def get_amount(self, obj):
    """Получить сумму позиции (динамически)"""
    from common.aggregation_services import PurchaseAggregationService
    return PurchaseAggregationService.get_purchase_item_amount(obj.quantity, obj.price)
```

### 4.3 MaterialSerializer

```python
# ОБНОВЛЕНО: Все статистические поля используют MaterialAggregationService
average_price = serializers.SerializerMethodField()
purchases_count = serializers.SerializerMethodField()
total_purchased_amount = serializers.SerializerMethodField()
last_purchase_date = serializers.SerializerMethodField()
current_stock = serializers.SerializerMethodField()
```

### 4.4 PurchaseSupplierSerializer

```python
# ОБНОВЛЕНО: Все статистические поля используют PurchaseAggregationService
purchases_count = serializers.SerializerMethodField()
total_amount = serializers.SerializerMethodField()
avg_amount = serializers.SerializerMethodField()
last_purchase_date = serializers.SerializerMethodField()
```

---

## 5. Миграции

### 5.1 Созданные миграции

#### `purchases/migrations/0011_remove_redundant_fields.py`
```python
operations = [
    migrations.RemoveField(model_name='purchase', name='total_amount'),
    migrations.RemoveField(model_name='purchaseitem', name='amount'),
]
```

#### `common/migrations/0002_remove_average_price.py`
```python
operations = [
    migrations.RemoveField(model_name='material', name='average_price'),
]
```

### 5.2 Порядок применения

1. Сначала обновить код (модели, сериализаторы, сервисы)
2. Создать резервную копию БД
3. Применить миграции:
   ```bash
   python manage.py migrate common 0002_remove_average_price
   python manage.py migrate purchases 0011_remove_redundant_fields
   ```
4. Проверить работу API
5. Обновить frontend

---

## 6. Обновление админки Django

### 6.1 PurchaseAdmin

```python
# ОБНОВИТЬ:
readonly_fields = ("total_amount", "created_at", "updated_at", "cover_preview_ro")
# НА:
readonly_fields = ("created_at", "updated_at", "cover_preview_ro")

# ОБНОВИТЬ метод:
def total_amount_fmt(self, obj: Purchase):
    return f"{obj.get_total_amount():.2f}"

# УДАЛИТЬ action:
@admin.action(description="Recalculate totals")
def action_recalc(self, request, queryset):
    # Больше не нужен - пересчет происходит автоматически
    pass
```

### 6.2 PurchaseItemInline

```python
# ОБНОВИТЬ:
fields = ("material", "unit", "quantity", "price", "amount", "created_at")
readonly_fields = ("amount", "created_at")
# НА:
fields = ("material", "unit", "quantity", "price", "created_at")
readonly_fields = ("created_at")

# amount будет вычисляться через display метод
```

---

## 7. Обновление views и отчетов

### 7.1 Reports (reports/views.py)

**Текущее состояние:** Отчеты УЖЕ используют динамическую агрегацию ✅

```python
# Пример: ByPeriodView
queryset.annotate(
    period=TruncMonth('date')
).values('period').annotate(
    purchases=Count('id'),
    total_sum=Sum('total_amount'),  # ← НУЖНО ОБНОВИТЬ
    avg_amount=Avg('total_amount'),  # ← НУЖНО ОБНОВИТЬ
    ...
)
```

**Требуется обновить** на использование агрегации позиций:

```python
# ОБНОВИТЬ НА:
from django.db.models import F

.annotate(
    total_sum=Sum(F('items__quantity') * F('items__price')),
    avg_amount=Avg(F('items__quantity') * F('items__price')),
    ...
)
```

### 7.2 PurchaseViewSet (purchases/views.py)

**Требуется обновить:**
- Сортировка по `total_amount` → использовать аннотацию
- Фильтрация по `min_total`/`max_total` → обновить фильтры
- Статистические endpoints → использовать `PurchaseAggregationService`

---

## 8. Оптимизация производительности

### 8.1 Индексы БД

**Критические индексы для агрегации:**

```python
# PurchaseItem
indexes = [
    models.Index(fields=['purchase', 'material']),  # ✅ Уже есть
    models.Index(fields=['material', 'purchase']),  # ← ДОБАВИТЬ
    models.Index(fields=['purchase']),              # ← ДОБАВИТЬ для SUM по purchase
]

# StockSnapshot
indexes = [
    models.Index(fields=['object', 'material', 'date']),  # ✅ Уже есть
    models.Index(fields=['material', 'object']),           # ✅ Уже есть
]
```

### 8.2 Кэширование (Redis)

**Стратегия кэширования:**

```python
# common/cache_utils.py - РАСШИРИТЬ
from django.core.cache import cache
from functools import wraps

def cache_aggregation(key_prefix, timeout=300):
    """Декоратор для кэширования агрегаций"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = f"{key_prefix}:{':'.join(map(str, args))}"
            result = cache.get(cache_key)
            
            if result is None:
                result = func(*args, **kwargs)
                cache.set(cache_key, result, timeout)
            
            return result
        return wrapper
    return decorator

# Применение:
@cache_aggregation('purchase_total', timeout=60)
def get_purchase_total_amount(purchase_id):
    # ... агрегация
    pass
```

**Инвалидация кэша:**

```python
# Сигналы для очистки кэша
@receiver([post_save, post_delete], sender=PurchaseItem)
def invalidate_purchase_cache(sender, instance, **kwargs):
    cache.delete(f"purchase_total:{instance.purchase_id}")
    cache.delete(f"material_stats:{instance.material_id}")
```

### 8.3 Оптимизация запросов

**Batch-агрегация для списков:**

```python
# ВМЕСТО N запросов для каждого объекта:
for purchase in purchases:
    total = purchase.get_total_amount()  # N запросов

# ИСПОЛЬЗОВАТЬ аннотацию:
from django.db.models import F, Sum

purchases = Purchase.objects.annotate(
    total_amount_computed=Sum(F('items__quantity') * F('items__price'))
).all()

for purchase in purchases:
    total = purchase.total_amount_computed  # 1 запрос
```

---

## 9. Обновление Frontend

### 9.1 API Types

**Обновить типы:**

```typescript
// src/api/types/purchases.ts
export interface Purchase {
  // total_amount удалено - вычисляется динамически через агрегацию
  total_amount?: number; // Остается как optional для обратной совместимости
}

export interface PurchaseItem {
  // amount удалено - вычисляется динамически через агрегацию
  amount?: number; // Остается как optional для обратной совместимости
}
```

```typescript
// src/api/types/materials.ts
export interface Material {
  // average_price удалено - вычисляется динамически через агрегацию
  average_price?: number; // Остается как optional для обратной совместимости
}
```

### 9.2 Компоненты

**Обновить вычисления на клиенте:**

```typescript
// PurchaseForm.vue - расчет суммы позиции
const computeItemAmount = (item: PurchaseItem) => {
  return (item.quantity || 0) * (item.price || 0)
}

// PurchaseInfo.vue - расчет общей суммы
const computeTotalAmount = (purchase: Purchase) => {
  return purchase.items.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.price || 0)
  }, 0)
}
```

**Проблемные места:**
- ❌ `stores/purchases.ts` - использует `purchase.total_amount`
- ❌ `components/cards/PurchaseCard.vue` - отображает `total_amount`
- ❌ `pages/Purchases/PurchaseInfo.vue` - отображает `total_amount`
- ❌ `pages/Reports/*.vue` - используют `total_amount` в отчетах

---

## 10. Валидация и бизнес-правила

### 10.1 Обновить валидацию

```python
# purchases/serializers.py
# БЫЛО:
def validate_total_amount(self, value):
    if value is not None and value < 0:
        raise serializers.ValidationError("Общая сумма не может быть отрицательной")
    return value

# СТАЛО:
# Валидация total_amount удалена - проверка выполняется на уровне items
```

### 10.2 Проверки на уровне модели

```python
# Purchase.clean() - обновить
def clean(self):
    super().clean()
    
    # Проверка total_amount через агрегацию
    if self.pk:  # Только для существующих записей
        total = self.get_total_amount()
        if total < 0:
            raise ValidationError("Общая сумма не может быть отрицательной")
```

---

## 11. Тестирование

### 11.1 Unit тесты

```python
# tests/test_aggregation_services.py
class TestPurchaseAggregation(TestCase):
    def test_get_purchase_total_amount(self):
        # Создать закупку с позициями
        purchase = Purchase.objects.create(...)
        PurchaseItem.objects.create(purchase=purchase, quantity=10, price=100)
        PurchaseItem.objects.create(purchase=purchase, quantity=5, price=200)
        
        # Проверить агрегацию
        total = PurchaseAggregationService.get_purchase_total_amount(purchase.id)
        self.assertEqual(total, Decimal('2000.00'))  # 10*100 + 5*200
```

### 11.2 Integration тесты

```python
# tests/test_api_with_aggregation.py
class TestPurchaseAPI(APITestCase):
    def test_purchase_list_has_total_amount(self):
        response = self.client.get('/api/v1/purchases/')
        self.assertEqual(response.status_code, 200)
        
        for purchase in response.data['results']:
            self.assertIn('total_amount', purchase)
            self.assertIsNotNone(purchase['total_amount'])
```

### 11.3 Performance тесты

```python
# tests/test_performance.py
class TestAggregationPerformance(TestCase):
    def test_bulk_aggregation_performance(self):
        # Создать 1000 закупок
        purchases = [Purchase(...) for _ in range(1000)]
        Purchase.objects.bulk_create(purchases)
        
        # Измерить время
        import time
        start = time.time()
        
        # Получить список с total_amount
        response = self.client.get('/api/v1/purchases/?page_size=1000')
        
        end = time.time()
        self.assertLess(end - start, 2.0)  # < 2 секунд
```

---

## 12. Обновление документации

### 12.1 Файлы для обновления

- ✅ `docs/summary/02-data-models.md` - обновить описание моделей
- ✅ `docs/summary/03-api-documentation.md` - обновить примеры API
- ⏳ `docs/BACKEND_MODELS_AUDIT_REPORT.md` - добавить раздел об агрегации
- ⏳ `ELOM_SYSTEM_LOGIC_DOCUMENTATION.md` - обновить бизнес-логику

### 12.2 Новые разделы документации

**Создать:** `docs/DYNAMIC_AGGREGATION_GUIDE.md`
- Преимущества динамической агрегации
- Список сервисов и их методов
- Примеры использования
- Best practices
- Troubleshooting

---

## 13. Детальный план выполнения

### Фаза 1: Backend рефакторинг ✅ (ЗАВЕРШЕНО)

1. ✅ Создать `common/aggregation_services.py`
2. ✅ Обновить сериализаторы для использования сервисов
3. ✅ Закомментировать избыточные поля в моделях
4. ✅ Удалить/закомментировать сигналы для пересчета
5. ✅ Создать миграции для удаления полей

### Фаза 2: Оптимизация производительности ⏳

6. ⏳ Добавить индексы для оптимизации агрегации
7. ⏳ Реализовать кэширование через Redis
8. ⏳ Оптимизировать запросы с аннотациями для списков
9. ⏳ Обновить views для batch-агрегации

### Фаза 3: Обновление админки ⏳

10. ⏳ Обновить `PurchaseAdmin` для работы без `total_amount`
11. ⏳ Обновить `PurchaseItemInline` для работы без `amount`
12. ⏳ Удалить action `action_recalc`
13. ⏳ Обновить display методы

### Фаза 4: Frontend обновления ⏳

14. ⏳ Обновить API типы (TypeScript)
15. ⏳ Добавить клиентские вычисления для форм
16. ⏳ Обновить компоненты отображения
17. ⏳ Обновить stores для работы с новой структурой

### Фаза 5: Тестирование ⏳

18. ⏳ Unit тесты для сервисов агрегации
19. ⏳ Integration тесты для API
20. ⏳ Performance тесты для больших датасетов
21. ⏳ E2E тесты для критических workflow

### Фаза 6: Документация ⏳

22. ⏳ Обновить техническую документацию
23. ⏳ Создать guide по динамической агрегации
24. ⏳ Обновить API документацию
25. ⏳ Добавить примеры использования

---

## 14. Риски и митигация

### 14.1 Производительность

**Риск:** Медленные запросы при большом количестве данных

**Митигация:**
- ✅ Индексы на ключевых полях
- ✅ Кэширование результатов агрегации (Redis)
- ✅ Batch-агрегация для списков через `annotate()`
- Мониторинг slow queries

### 14.2 Обратная совместимость

**Риск:** Поломка существующего кода, зависящего от полей

**Митигация:**
- ✅ Методы `get_total_amount()` вместо прямого доступа к полю
- ✅ `SerializerMethodField` для API
- Поэтапное удаление полей (сначала nullable, потом удаление)

### 14.3 Кэш инвалидация

**Риск:** Устаревшие данные в кэше

**Митигация:**
- Сигналы для инвалидации кэша
- TTL для автоматического истечения
- Версионирование ключей кэша

---

## 15. Метрики успеха

### 15.1 Производительность

- [ ] API endpoints отвечают < 200ms (простые запросы)
- [ ] Отчеты генерируются < 2s (до 1000 записей)
- [ ] Списки загружаются < 500ms (20 записей на страницу)

### 15.2 Размер БД

- [ ] Сокращение размера таблицы `purchases_purchase` на ~10-15%
- [ ] Сокращение размера таблицы `purchases_purchaseitem` на ~15-20%
- [ ] Сокращение размера таблицы `common_material` на ~5%

### 15.3 Качество кода

- [ ] Покрытие тестами сервисов агрегации > 90%
- [ ] Нет дублирования логики расчетов
- [ ] Все API endpoints возвращают корректные данные

---

## 16. Rollback план

### В случае проблем:

1. **Откатить миграции:**
   ```bash
   python manage.py migrate purchases 0010_alter_purchasephoto_type
   python manage.py migrate common 0001_initial
   ```

2. **Восстановить код из Git:**
   ```bash
   git checkout HEAD~1 purchases/models.py
   git checkout HEAD~1 common/models.py
   git checkout HEAD~1 common/serializers.py
   ```

3. **Пересоздать поля:**
   - Вернуть `total_amount` в `Purchase`
   - Вернуть `amount` в `PurchaseItem`
   - Вернуть `average_price` в `Material`

4. **Восстановить данные:**
   ```python
   # Пересчитать все total_amount
   for purchase in Purchase.objects.all():
       purchase.recalc_total()
   ```

---

## 17. Следующие шаги (приоритет)

### Критические (сейчас)

1. ⏳ Обновить `reports/views.py` для работы без `Purchase.total_amount`
2. ⏳ Обновить `purchases/views.py` - статистические endpoints
3. ⏳ Обновить `purchases/admin.py` - display методы
4. ⏳ Добавить индексы для оптимизации агрегации

### Важные (следующая итерация)

5. ⏳ Реализовать кэширование через Redis
6. ⏳ Обновить frontend компоненты
7. ⏳ Создать unit тесты для сервисов
8. ⏳ Performance тесты

### Дополнительные (опционально)

9. ⏳ Документация и примеры
10. ⏳ Мониторинг производительности
11. ⏳ Оптимизация batch-запросов

---

## 18. Преимущества реализации

### 18.1 Техничес кие

- ✅ **Минимизация избыточности** - нет дублирования данных
- ✅ **Автоматическая согласованность** - нет рассинхронизации
- ✅ **Упрощение схемы БД** - меньше полей, меньше миграций
- ✅ **Единая точка истины** - все расчеты в одном месте

### 18.2 Бизнес

- ✅ **Точность данных** - всегда актуальные значения
- ✅ **Гибкость отчетов** - легко добавлять новые метрики
- ✅ **Прозрачность** - понятно откуда берутся данные
- ✅ **Экономия места** - меньше хранимых данных

### 18.3 Разработка

- ✅ **Меньше кода** - нет логики пересчета
- ✅ **Меньше багов** - нет рассинхронизации
- ✅ **Проще тестирование** - прямые SQL-запросы
- ✅ **Легче поддержка** - централизованная логика

---

## 19. Заключение

Переход на динамическую агрегацию - это архитектурное улучшение, которое:
1. Упрощает модели данных
2. Повышает согласованность данных
3. Снижает сложность кода
4. Улучшает производительность при правильной оптимизации

**Текущий прогресс:** ~40% (backend рефакторинг завершён, требуется оптимизация, обновление views/admin, frontend, тесты)

**Следующий шаг:** Обновление `reports/views.py` и `purchases/views.py` для работы с новой структурой.

