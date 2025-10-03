# Исправления расчета остатков при списании материалов

## 🐛 **Найденные проблемы**

### 1. **Неправильный расчет остатков при создании списания**

**Проблема:** В `stock/models.py` метод `get_current_balance` использует `date__lte=date`, что включает записи на дату списания в расчет остатка.

**Локация:** `stock/models.py:218`
```python
# НЕПРАВИЛЬНО:
queryset = queryset.filter(date__lte=date)

# ПРАВИЛЬНО:
queryset = queryset.filter(date__lt=date)
```

**Последствия:**
- При списании 2м из 12м показывается остаток -2м вместо 10м
- Списание учитывается дважды в расчете остатка

### 2. **Отсутствие пересчета остатков при обновлении списания**

**Проблема:** Сигнал `post_save` для `WriteOff` срабатывает только при создании (`if created:`), но не при обновлении.

**Локация:** `stock/models.py:249-260`
```python
@receiver(post_save, sender=WriteOff)
def create_ledger_entry_for_writeoff(sender, instance, created, **kwargs):
    if created:  # ← Проблема: только при создании
        # ...
```

**Последствия:**
- При изменении количества списания не обновляется соответствующая запись в `StockSnapshot`
- Остатки рассчитываются неверно после обновления списания

## 🔧 **Предлагаемые исправления**

### 1. **Исправить расчет остатков**

**Файл:** `stock/models.py`
```python
@classmethod
def get_current_balance(cls, object_id, material_id, date=None):
    """
    Получить текущий остаток на дату
    
    Args:
        object_id: ID объекта
        material_id: ID материала  
        date: Дата (если None, то на текущий момент)
        
    Returns:
        Decimal: Текущий остаток
    """
    queryset = cls.objects.filter(
        object_id=object_id,
        material_id=material_id
    )
    
    if date:
        queryset = queryset.filter(date__lt=date)  # ← ИСПРАВЛЕНО: date__lt вместо date__lte
    
    balance = queryset.aggregate(
        total=models.Sum('quantity_signed')
    )['total'] or Decimal('0.000000')
    
    return max(balance, Decimal('0.000000'))
```

### 2. **Добавить пересчет при обновлении списания**

**Файл:** `stock/models.py`
```python
@receiver(post_save, sender=WriteOff)
def create_ledger_entry_for_writeoff(sender, instance, created, **kwargs):
    """Создать или обновить запись в журнале движений при создании/обновлении WriteOff"""
    from .services import BalanceCalculationService
    try:
        with transaction.atomic():
            if created:
                # Создаем новую запись
                BalanceCalculationService.create_ledger_entry_for_writeoff(instance)
            else:
                # Обновляем существующую запись
                BalanceCalculationService.update_ledger_entry_for_writeoff(instance)
    except Exception as e:
        if created:
            # Если не удалось создать запись журнала, удаляем WriteOff
            instance.delete()
        raise e
```

### 3. **Добавить метод обновления записи журнала**

**Файл:** `stock/services.py`
```python
@staticmethod
def update_ledger_entry_for_writeoff(writeoff):
    """
    Обновить запись в журнале движений для WriteOff
    
    Args:
        writeoff: Экземпляр WriteOff
    """
    # Находим существующую запись
    existing_entry = StockSnapshot.objects.filter(
        source_type='writeoff',
        source_id=writeoff.id
    ).first()
    
    if existing_entry:
        # Конвертируем количество в базовую единицу материала
        converted_quantity = convert(
            writeoff.quantity,
            writeoff.unit_id,
            writeoff.material.default_unit_id
        )
        if converted_quantity is None:
            raise DjangoValidationError({
                "unit": [
                    f"Невозможно конвертировать {writeoff.unit.code} в {writeoff.material.default_unit.code}. "
                    f"Добавьте запись в UnitConversion."
                ]
            })
        
        # Обновляем запись
        existing_entry.date = writeoff.date
        existing_entry.object = writeoff.object
        existing_entry.material = writeoff.material
        existing_entry.unit = writeoff.material.default_unit
        existing_entry.quantity_signed = -converted_quantity  # Расход < 0
        existing_entry.stage = writeoff.stage
        existing_entry.responsible = writeoff.responsible
        existing_entry.comment = writeoff.comment
        existing_entry.save()
    else:
        # Если записи нет, создаем новую
        BalanceCalculationService.create_ledger_entry_for_writeoff(writeoff)
```

### 4. **Аналогично для PurchaseItem**

**Файл:** `purchases/models.py`
```python
@receiver(post_save, sender=PurchaseItem)
def create_ledger_entry_for_purchase_item(sender, instance, created, **kwargs):
    """Создать или обновить запись в журнале движений при создании/обновлении PurchaseItem"""
    from stock.services import BalanceCalculationService
    try:
        with transaction.atomic():
            if created:
                # Создаем новую запись
                BalanceCalculationService.create_ledger_entry_for_purchase_item(instance)
            else:
                # Обновляем существующую запись
                BalanceCalculationService.update_ledger_entry_for_purchase_item(instance)
    except Exception as e:
        if created:
            # Если не удалось создать запись журнала, удаляем PurchaseItem
            instance.delete()
        raise e
```

**Файл:** `stock/services.py`
```python
@staticmethod
def update_ledger_entry_for_purchase_item(purchase_item):
    """
    Обновить запись в журнале движений для PurchaseItem
    
    Args:
        purchase_item: Экземпляр PurchaseItem
    """
    # Находим существующую запись
    existing_entry = StockSnapshot.objects.filter(
        source_type='purchase_item',
        source_id=purchase_item.id
    ).first()
    
    if existing_entry:
        # Конвертируем количество в базовую единицу материала
        converted_quantity = convert(
            purchase_item.quantity, 
            purchase_item.unit_id, 
            purchase_item.material.default_unit_id
        )
        if converted_quantity is None:
            raise DjangoValidationError({
                "unit": [
                    f"Невозможно конвертировать {purchase_item.unit.code} в {purchase_item.material.default_unit.code}. "
                    f"Добавьте запись в UnitConversion."
                ]
            })
        
        # Обновляем запись
        existing_entry.date = purchase_item.purchase.date
        existing_entry.object = purchase_item.purchase.object
        existing_entry.material = purchase_item.material
        existing_entry.unit = purchase_item.material.default_unit
        existing_entry.quantity_signed = converted_quantity  # Приход > 0
        existing_entry.stage = 'delivery_fixed'
        existing_entry.responsible = purchase_item.purchase.responsible
        existing_entry.comment = f"Закупка: {purchase_item.purchase.supplier}"
        existing_entry.save()
    else:
        # Если записи нет, создаем новую
        BalanceCalculationService.create_ledger_entry_for_purchase_item(purchase_item)
```

## 🧪 **Тестирование**

### 1. **Тест расчета остатков**
```python
# Создать закупку 12м кабеля
# Создать списание 2м кабеля
# Проверить, что остаток = 10м (не -2м)
```

### 2. **Тест обновления списания**
```python
# Создать списание 2м кабеля
# Обновить списание на 3м кабеля
# Проверить, что остаток = 9м (12 - 3)
```

### 3. **Тест обновления закупки**
```python
# Создать закупку 10м кабеля
# Обновить закупку на 15м кабеля
# Проверить, что остаток = 15м
```

## 📋 **План внедрения**

1. **Исправить `get_current_balance`** - заменить `date__lte` на `date__lt`
2. **Добавить методы обновления** в `BalanceCalculationService`
3. **Обновить сигналы** для обработки обновлений
4. **Протестировать** на тестовых данных
5. **Проверить** корректность расчетов в production

## ⚠️ **Важные замечания**

- Изменения затронут расчет остатков для всех материалов
- Необходимо протестировать на различных сценариях
- Возможно потребуется пересчет существующих данных
- Изменения должны быть внесены атомарно (в одной транзакции)
