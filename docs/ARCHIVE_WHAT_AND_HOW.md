# Что и как архивируется в системе

## 🎯 **Что такое архивирование?**

Архивирование - это процесс **"закрытия"** данных за определенный период (месяц) по конкретному объекту. При архивировании данные не удаляются, а помечаются как **"заархивированные"** и становятся **только для чтения**.

## 📦 **Что архивируется?**

### 1. **Закупки (Purchases)**
```python
# Модель Purchase в purchases/models.py
class Purchase(TimeStamped):
    date = models.DateField()                    # Дата закупки
    object = models.ForeignKey(Object)          # Объект
    supplier = models.ForeignKey(PurchaseSupplier) # Поставщик
    responsible = models.ForeignKey(User)        # Ответственный
    is_archived = models.BooleanField(default=False) # Флаг архивирования
    # ... другие поля
```

**Что включает закупка:**
- Основная информация о закупке (дата, объект, поставщик)
- Список материалов (`PurchaseItem`) - что купили
- Фотографии (`PurchasePhoto`) - документы, чеки
- Комментарии и статус

### 2. **Складские снимки (StockSnapshots)**
```python
# Модель StockSnapshot в stock/models.py  
class StockSnapshot(TimeStamped):
    date = models.DateField()                    # Дата снимка
    object = models.ForeignKey(Object)          # Объект
    material = models.ForeignKey(Material)      # Материал
    quantity_signed = models.DecimalField()     # Количество (+/-)
    stage = models.CharField()                  # Этап работ
    source_type = models.CharField()            # Тип источника
    source_id = models.PositiveIntegerField()   # ID источника
    is_archived = models.BooleanField(default=False) # Флаг архивирования
    # ... другие поля
```

**Что включает складской снимок:**
- Движения материалов (приход/расход)
- Связь с закупками или списаниями
- Этапы работ (приемка, поставка, сдача)
- Ответственных за операции

### 3. **Списания (WriteOffs)**
```python
# Модель WriteOff в stock/models.py
class WriteOff(TimeStamped):
    date = models.DateField()                    # Дата списания
    object = models.ForeignKey(Object)          # Объект
    material = models.ForeignKey(Material)      # Материал
    quantity = models.DecimalField()            # Количество
    stage = models.CharField()                  # Этап работ
    responsible = models.ForeignKey(User)        # Ответственный
    is_archived = models.BooleanField(default=False) # Флаг архивирования
    # ... другие поля
```

## ⚙️ **Как происходит архивирование?**

### 1. **Создание архивного периода**
```python
# В stock/signals.py
@receiver(post_save, sender=ArchivePeriod)
def archive_period_created(sender, instance, created, **kwargs):
    if not created:
        return

    with transaction.atomic():
        # 1. Архивируем ВСЕ закупки за период
        purchases = Purchase.objects.filter(
            object=instance.object,              # По объекту
            date__year=instance.month.year,      # За год
            date__month=instance.month.month,    # За месяц
            is_archived=False                    # Только неархивированные
        )
        purchases_count = purchases.update(is_archived=True)
        
        # 2. Архивируем ВСЕ складские снимки за период
        snapshots = StockSnapshot.objects.filter(
            object=instance.object,              # По объекту
            date__year=instance.month.year,      # За год
            date__month=instance.month.month,    # За месяц
            is_archived=False                    # Только неархивированные
        )
        snapshots_count = snapshots.update(is_archived=True)
```

### 2. **Критерии архивирования**
Архивируются **ВСЕ** записи, которые:
- ✅ Принадлежат указанному **объекту**
- ✅ Созданы в указанном **году и месяце**
- ✅ Еще **не заархивированы** (`is_archived=False`)

### 3. **Что НЕ архивируется**
- ❌ **Материалы** - справочная информация
- ❌ **Объекты** - справочная информация  
- ❌ **Пользователи** - справочная информация
- ❌ **Поставщики** - справочная информация
- ❌ **Единицы измерения** - справочная информация

## 🔄 **Процесс архивирования пошагово**

### Шаг 1: Пользователь закрывает период
```javascript
// Frontend: ListWorking.vue
const closeForm = {
  month: "2024-01",    // Январь 2024
  object: 123          // ID объекта
}

// Отправка запроса
await api.post('/api/v1/archive/periods/close/', closeForm)
```

### Шаг 2: Backend создает архивный период
```python
# Backend создает запись
ArchivePeriod.objects.create(
    month=date(2024, 1, 1),  # 1 января 2024
    object=Object.objects.get(id=123),
    closed_by=request.user
)
```

### Шаг 3: Django Signal автоматически архивирует данные
```python
# Сигнал срабатывает автоматически
# Находит ВСЕ закупки за январь 2024 по объекту 123
purchases = Purchase.objects.filter(
    object_id=123,
    date__year=2024,
    date__month=1,
    is_archived=False
)

# Помечает их как заархивированные
purchases.update(is_archived=True)

# То же самое для складских снимков
snapshots = StockSnapshot.objects.filter(
    object_id=123,
    date__year=2024, 
    date__month=1,
    is_archived=False
)
snapshots.update(is_archived=True)
```

### Шаг 4: Результат архивирования
- ✅ Создан архивный период "2024-01 / Объект 123"
- ✅ Заархивировано X закупок за январь 2024
- ✅ Заархивировано Y складских снимков за январь 2024
- ✅ Все данные помечены `is_archived=True`

## 📊 **Пример архивирования**

### До архивирования:
```
Объект: "Жилой дом Комфорт - Блок А" (ID: 123)
Период: Январь 2024

Закупки:
- 2024-01-15: Цемент 50кг (is_archived=False)
- 2024-01-20: Арматура 100м (is_archived=False)  
- 2024-01-25: Кирпич 1000шт (is_archived=False)

Складские снимки:
- 2024-01-15: +50кг цемента (is_archived=False)
- 2024-01-20: +100м арматуры (is_archived=False)
- 2024-01-25: +1000шт кирпича (is_archived=False)
```

### После архивирования:
```
Архивный период: 2024-01 / Жилой дом Комфорт - Блок А

Закупки:
- 2024-01-15: Цемент 50кг (is_archived=True) ✅
- 2024-01-20: Арматура 100м (is_archived=True) ✅
- 2024-01-25: Кирпич 1000шт (is_archived=True) ✅

Складские снимки:
- 2024-01-15: +50кг цемента (is_archived=True) ✅
- 2024-01-20: +100м арматуры (is_archived=True) ✅
- 2024-01-25: +1000шт кирпича (is_archived=True) ✅
```

## 🛡️ **Что происходит с заархивированными данными?**

### 1. **Доступ только для чтения**
- ❌ Нельзя редактировать заархивированные закупки
- ❌ Нельзя добавлять новые материалы к заархивированным закупкам
- ❌ Нельзя изменять складские снимки
- ✅ Можно только просматривать

### 2. **Фильтрация в интерфейсе**
```javascript
// Frontend показывает только активные данные
const activePurchases = purchases.filter(p => !p.is_archived)
const archivedPurchases = purchases.filter(p => p.is_archived)
```

### 3. **Отдельные отчеты**
- Активные данные - для текущей работы
- Архивные данные - для отчетности и анализа

## 🔄 **Восстановление (открытие периода)**

### Что происходит при открытии:
```python
# Удаляется архивный период
ArchivePeriod.objects.filter(month=month, object=object).delete()

# Данные остаются заархивированными!
# Нужно вручную разархивировать:
purchases.update(is_archived=False)
snapshots.update(is_archived=False)
```

## 🎯 **Зачем нужно архивирование?**

### 1. **Производительность**
- Быстрая работа с текущими данными
- Медленные запросы только по архивным данным

### 2. **Безопасность данных**
- Защита от случайного изменения старых данных
- Аудит и контроль изменений

### 3. **Организация данных**
- Четкое разделение активных и архивных данных
- Удобная навигация по периодам

### 4. **Отчетность**
- Исторические данные для анализа
- Сравнение периодов
- Финансовая отчетность

## 📋 **Резюме**

**Архивируется:**
- ✅ Закупки за конкретный месяц по объекту
- ✅ Складские движения за конкретный месяц по объекту  
- ✅ Списания за конкретный месяц по объекту

**НЕ архивируется:**
- ❌ Справочники (материалы, объекты, пользователи)
- ❌ Данные за другие месяцы
- ❌ Данные по другим объектам

**Результат:**
- 📦 Все данные помечаются `is_archived=True`
- 🔒 Становятся доступны только для чтения
- 📊 Появляются в отдельных архивных отчетах
- ⚡ Ускоряется работа с текущими данными

