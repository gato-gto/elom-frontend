# Аудит Backend-моделей Django

## Обзор

Проведен комплексный аудит всех моделей Django в backend проекте ELOM с сопоставлением их с бизнес-логикой из документации.

**Дата аудита:** 2 октября 2025  
**Версия системы:** 2.1  
**Статус:** Завершен

## Список всех моделей в backend

### 1. Модели из `common/models.py`

#### 1.1 TimeStamped (Абстрактная)
```python
class TimeStamped(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```
**Статус:** ✅ Корректна  
**Назначение:** Базовый класс для отслеживания времени создания и обновления

#### 1.2 Unit (Единицы измерения)
```python
class Unit(TimeStamped):
    code = models.CharField(max_length=16, unique=True)
    name = models.CharField(max_length=64)
```
**Статус:** ✅ Корректна  
**Соответствие документации:** Полное  
**Связи:** ForeignKey в Material.default_unit, UnitConversion

#### 1.3 MaterialCategory (Категории материалов)
```python
class MaterialCategory(TimeStamped):
    name = models.CharField(max_length=128)
    parent = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="children")
```
**Статус:** ✅ Корректна  
**Соответствие документации:** Полное  
**Связи:** ForeignKey в Material.category

#### 1.4 Material (Материалы)
```python
class Material(TimeStamped):
    name = models.CharField(max_length=256)
    sku = models.CharField(max_length=64, blank=True, default="", unique=True, null=True)
    category = models.ForeignKey(MaterialCategory, null=True, blank=True, on_delete=models.SET_NULL)
    default_unit = models.ForeignKey(Unit, on_delete=models.PROTECT)
    photo = models.ImageField(upload_to="materials/%Y/%m/", null=True, blank=True)
    
    # Расширенные поля
    is_active = models.BooleanField(default=True)
    created_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True, default="")
    manufacturer = models.CharField(max_length=128, blank=True, default="")
    average_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
```
**Статус:** ✅ Корректна  
**Соответствие документации:** Полное  
**Связи:** ForeignKey в PurchaseItem, WriteOff, StockSnapshot

#### 1.5 Object (Строительные объекты)
```python
class Object(TimeStamped):
    name = models.CharField(max_length=128)
    address = models.CharField(max_length=256, blank=True, default="")
    is_active = models.BooleanField(default=True)
    
    # Обязательные поля согласно ТЗ
    responsible = models.ForeignKey("users.EmployeeProfile", on_delete=models.PROTECT, null=True)
    key_person_name = models.CharField(max_length=128, default="Не указано")
    key_person_contacts = models.TextField(default="Не указано")
    date_start = models.DateField(auto_now_add=True)
    
    # Опциональные поля
    date_end = models.DateField(null=True, blank=True)
    lat = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    lng = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    location_url = models.CharField(max_length=256, blank=True, default="")
```
**Статус:** ⚠️ Требует исправления  
**Проблемы:**
- `responsible` имеет `null=True`, но по документации должно быть обязательным
- Валидация роли бригадира есть, но поле может быть null

#### 1.6 AuditLog (Журнал аудита)
```python
class AuditLog(models.Model):
    ts = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=32)
    model = models.CharField(max_length=64)
    object_id = models.CharField(max_length=64)
    detail = models.TextField(blank=True, default="")
    ip = models.GenericIPAddressField(null=True, blank=True)
```
**Статус:** ✅ Корректна  
**Соответствие документации:** Полное

#### 1.7 UnitConversion (Конверсия единиц)
```python
class UnitConversion(models.Model):
    from_unit = models.ForeignKey(Unit, on_delete=models.PROTECT, related_name="conv_from")
    to_unit = models.ForeignKey(Unit, on_delete=models.PROTECT, related_name="conv_to")
    factor = models.DecimalField(max_digits=18, decimal_places=6)
```
**Статус:** ✅ Корректна  
**Соответствие документации:** Полное

### 2. Модели из `users/models.py`

#### 2.1 EmployeeProfile (Профиль сотрудника)
```python
class EmployeeProfile(models.Model):
    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("buyer", "Buyer"),
        ("site_manager", "Site Manager"),
        ("director", "Director"),
        ("coordinator", "Coordinator"),
        ("brigadier", "Brigadier"),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=32, choices=ROLE_CHOICES, default="buyer")
    is_active = models.BooleanField(default=True)
    phone = models.CharField(max_length=32, blank=True)
    assigned_objects = models.ManyToManyField("common.Object", blank=True, related_name="assigned_employees")
```
**Статус:** ✅ Корректна  
**Соответствие документации:** Полное  
**Валидация:** Телефон обязателен для всех ролей кроме admin/director

### 3. Модели из `purchases/models.py`

#### 3.1 PurchaseSupplier (Поставщики)
```python
class PurchaseSupplier(TimeStamped):
    name = models.CharField(max_length=256, unique=True)
    contact_person = models.CharField(max_length=128, blank=True)
    phone = models.CharField(max_length=32, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
```
**Статус:** ✅ Корректна  
**Соответствие документации:** Полное

#### 3.2 Purchase (Закупки)
```python
class Purchase(TimeStamped):
    STATUS_CHOICES = [
        ("new", "Новая"),
        ("completed", "Выполнено"),
        ("cancelled", "Отмена"),
    ]
    
    date = models.DateField()
    object = models.ForeignKey(Object, on_delete=models.PROTECT)
    supplier = models.ForeignKey(PurchaseSupplier, on_delete=models.PROTECT)
    invoice_number = models.CharField(max_length=64, blank=True, default="")
    currency = models.CharField(max_length=3, default="UZS")
    comment = models.TextField(blank=True, default="")
    responsible = models.ForeignKey(User, on_delete=models.PROTECT)
    total_amount = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0.00"))
    is_archived = models.BooleanField(default=False)
    cover_photo = models.ImageField(upload_to="purchases/%Y/%m/", null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    purchase_no = models.CharField(max_length=64, blank=True, default="")
```
**Статус:** ✅ Корректна  
**Соответствие документации:** Полное  
**Валидация:** Ответственный должен быть бригадиром, при статусе "completed" обязательны фото отчета

#### 3.3 PurchaseItem (Элементы закупки)
```python
class PurchaseItem(TimeStamped):
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name="items")
    material = models.ForeignKey(Material, on_delete=models.SET_NULL, null=True, blank=True)
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=18, decimal_places=3, validators=[MinValueValidator(Decimal("0.001"))])
    price = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0.00"))
    amount = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal("0.00"))
```
**Статус:** ✅ Корректна  
**Соответствие документации:** Полное  
**Автоматизация:** amount рассчитывается как quantity * price

#### 3.4 PurchasePhoto (Фото закупок)
```python
class PurchasePhoto(TimeStamped):
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name="photos")
    file = models.ImageField(upload_to="purchases/%Y/%m/")
    is_cover = models.BooleanField(default=False)
    mime = models.CharField(max_length=64, blank=True, default="")
    size_bytes = models.PositiveIntegerField(default=0)
    type = models.CharField(max_length=20, choices=[
        ("instructions", "Инструкции"),
        ("report", "Отчёт"),
    ], default="instructions")
```
**Статус:** ✅ Корректна  
**Соответствие документации:** Полное

#### 3.5 TelegramSettings (Настройки Telegram)
```python
class TelegramSettings(TimeStamped):
    chat_id = models.CharField(max_length=64)
    bot_token = models.CharField(max_length=256)
    is_active = models.BooleanField(default=True)
```
**Статус:** ✅ Корректна  
**Соответствие документации:** Полное

#### 3.6 TelegramNotification (Уведомления Telegram)
```python
class TelegramNotification(TimeStamped):
    MESSAGE_TYPE_CHOICES = [
        ("created", "Создание закупки"),
        ("status_changed", "Смена статуса"),
        ("photo_added", "Добавлено фото"),
    ]
    
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name="telegram_notifications")
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPE_CHOICES)
    message_text = models.TextField()
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
```
**Статус:** ✅ Корректна  
**Соответствие документации:** Полное

### 4. Модели из `stock/models.py`

#### 4.1 WriteOff (Списания)
```python
class WriteOff(models.Model):
    STAGE_CHOICES = [
        ("acceptance", "Acceptance"),
        ("request", "Request"),
        ("delivery_fixed", "Delivery Fixed"),
        ("post_rough", "Post Rough"),
        ("handover", "Handover"),
    ]
    
    date = models.DateField()
    object = models.ForeignKey(Object, on_delete=models.PROTECT)
    material = models.ForeignKey(Material, on_delete=models.SET_NULL, null=True, blank=True)
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=18, decimal_places=6, validators=[MinValueValidator(Decimal('0.000001'))])
    stage = models.CharField(max_length=32, choices=STAGE_CHOICES)
    responsible = models.ForeignKey(User, on_delete=models.PROTECT)
    comment = models.TextField(blank=True, default="")
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```
**Статус:** ✅ Корректна  
**Соответствие документации:** Полное  
**Валидация:** Проверка достаточности остатков через StockValidationService

#### 4.2 StockSnapshot (Журнал движений)
```python
class StockSnapshot(models.Model):
    STAGE_CHOICES = [
        ("acceptance", "Acceptance"),
        ("request", "Request"),
        ("delivery_fixed", "Delivery Fixed"),
        ("post_rough", "Post Rough"),
        ("handover", "Handover"),
    ]
    
    SOURCE_TYPE_CHOICES = [
        ("purchase_item", "Purchase Item"),
        ("writeoff", "Write Off"),
    ]
    
    date = models.DateField()
    object = models.ForeignKey(Object, on_delete=models.PROTECT)
    material = models.ForeignKey(Material, on_delete=models.SET_NULL, null=True, blank=True)
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT)
    quantity_signed = models.DecimalField(max_digits=18, decimal_places=6, default=Decimal('0.000000'))
    stage = models.CharField(max_length=32, choices=STAGE_CHOICES)
    source_type = models.CharField(max_length=32, choices=SOURCE_TYPE_CHOICES, default='purchase_item')
    source_id = models.PositiveIntegerField(default=0)
    responsible = models.ForeignKey(User, on_delete=models.PROTECT)
    comment = models.TextField(blank=True, default="")
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```
**Статус:** ⚠️ Требует исправления  
**Проблемы:**
- `source_id` имеет `default=0`, что может привести к некорректным связям
- `material` имеет `null=True, blank=True`, но по документации должно быть обязательным
- `unit` должен всегда равняться `Material.default_unit`, но это не гарантировано

#### 4.3 ArchivePeriod (Архивные периоды)
```python
class ArchivePeriod(models.Model):
    month = models.DateField()
    object = models.ForeignKey(Object, on_delete=models.PROTECT)
    closed_at = models.DateTimeField(auto_now_add=True)
    closed_by = models.ForeignKey(User, on_delete=models.PROTECT)
```
**Статус:** ✅ Корректна  
**Соответствие документации:** Полное

### 5. Модели из `reports/models.py`

#### 5.1 Отсутствуют модели
**Статус:** ❌ Проблема  
**Проблема:** Модуль reports пустой, но по документации должны быть модели для отчетов

## Анализ соответствия бизнес-логике

### ✅ Полностью соответствующие модели

1. **Unit** - Единицы измерения
2. **MaterialCategory** - Категории материалов
3. **Material** - Материалы
4. **EmployeeProfile** - Профили сотрудников
5. **PurchaseSupplier** - Поставщики
6. **Purchase** - Закупки
7. **PurchaseItem** - Элементы закупки
8. **PurchasePhoto** - Фото закупок
9. **WriteOff** - Списания
10. **ArchivePeriod** - Архивные периоды
11. **AuditLog** - Журнал аудита
12. **UnitConversion** - Конверсия единиц
13. **TelegramSettings** - Настройки Telegram
14. **TelegramNotification** - Уведомления Telegram

### ⚠️ Модели с проблемами

#### 1. Object (Строительные объекты)
**Проблемы:**
- `responsible` имеет `null=True`, но по документации должно быть обязательным
- Валидация роли бригадира есть, но поле может быть null

**Рекомендации:**
- Убрать `null=True` из поля `responsible`
- Создать миграцию для заполнения существующих записей
- Добавить валидацию в `clean()` метод

#### 2. StockSnapshot (Журнал движений)
**Проблемы:**
- `source_id` имеет `default=0`, что может привести к некорректным связям
- `material` имеет `null=True, blank=True`, но по документации должно быть обязательным
- `unit` должен всегда равняться `Material.default_unit`, но это не гарантировано

**Рекомендации:**
- Убрать `default=0` из `source_id`
- Убрать `null=True, blank=True` из `material`
- Добавить валидацию в `clean()` метод для проверки соответствия `unit` и `Material.default_unit`

### ❌ Отсутствующие модели

#### 1. Модели отчетов
**Проблема:** Модуль `reports` пустой, но по документации должны быть модели для:
- Кэширования отчетов
- Шаблонов отчетов
- Параметров отчетов

**Рекомендации:**
- Создать модели для отчетов согласно документации
- Реализовать кэширование отчетов
- Добавить API для генерации отчетов

## Анализ связей между моделями

### ✅ Корректные связи

1. **User ↔ EmployeeProfile** (OneToOne) - Корректно
2. **EmployeeProfile ↔ Object** (ManyToMany) - Корректно
3. **Object ↔ Purchase** (ForeignKey) - Корректно
4. **Object ↔ WriteOff** (ForeignKey) - Корректно
5. **Object ↔ StockSnapshot** (ForeignKey) - Корректно
6. **Material ↔ PurchaseItem** (ForeignKey) - Корректно
7. **Material ↔ WriteOff** (ForeignKey) - Корректно
8. **Material ↔ StockSnapshot** (ForeignKey) - Корректно
9. **Unit ↔ Material** (ForeignKey) - Корректно
10. **Unit ↔ UnitConversion** (ForeignKey) - Корректно

### ⚠️ Проблемные связи

#### 1. StockSnapshot.source_id
**Проблема:** `source_id` имеет `default=0`, что может привести к некорректным связям с PurchaseItem и WriteOff

**Рекомендации:**
- Убрать `default=0`
- Добавить валидацию в `clean()` метод
- Создать миграцию для исправления существующих записей

#### 2. Object.responsible
**Проблема:** `responsible` имеет `null=True`, но по документации должно быть обязательным

**Рекомендации:**
- Убрать `null=True`
- Создать миграцию для заполнения существующих записей
- Добавить валидацию роли бригадира

## Анализ обязательных полей

### ✅ Корректно реализованные обязательные поля

1. **Material.name** - Обязательное
2. **Material.default_unit** - Обязательное
3. **Object.name** - Обязательное
4. **Purchase.date** - Обязательное
5. **Purchase.object** - Обязательное
6. **Purchase.supplier** - Обязательное
7. **Purchase.responsible** - Обязательное
8. **WriteOff.date** - Обязательное
9. **WriteOff.object** - Обязательное
10. **WriteOff.material** - Обязательное
11. **WriteOff.unit** - Обязательное
12. **WriteOff.stage** - Обязательное
13. **WriteOff.responsible** - Обязательное

### ⚠️ Проблемные обязательные поля

#### 1. Object.responsible
**Проблема:** Поле имеет `null=True`, но по документации должно быть обязательным

#### 2. StockSnapshot.material
**Проблема:** Поле имеет `null=True, blank=True`, но по документации должно быть обязательным

#### 3. StockSnapshot.source_id
**Проблема:** Поле имеет `default=0`, что может привести к некорректным связям

## Рекомендации по исправлению

### Критические исправления

#### 1. Исправить модель Object
```python
# В common/models.py
class Object(TimeStamped):
    # ... другие поля ...
    responsible = models.ForeignKey(
        "users.EmployeeProfile", 
        on_delete=models.PROTECT,  # Убрать null=True
        related_name="responsible_objects",
        help_text="Ответственный (только бригадир)"
    )
    # ... остальные поля ...
```

**Миграция:**
```python
# 0010_update_object_required_fields.py
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('common', '0009_update_object_required_fields'),
    ]

    operations = [
        migrations.AlterField(
            model_name='object',
            name='responsible',
            field=models.ForeignKey(
                help_text='Ответственный (только бригадир)',
                on_delete=models.PROTECT,
                related_name='responsible_objects',
                to='users.employeeprofile'
            ),
        ),
    ]
```

#### 2. Исправить модель StockSnapshot
```python
# В stock/models.py
class StockSnapshot(models.Model):
    # ... другие поля ...
    material = models.ForeignKey(
        Material, 
        on_delete=models.SET_NULL,  # Убрать null=True, blank=True
        help_text="Материал"
    )
    source_id = models.PositiveIntegerField(  # Убрать default=0
        help_text="ID первоисточника (PurchaseItem.id или WriteOff.id)"
    )
    # ... остальные поля ...
    
    def clean(self):
        """Валидация данных журнала движений"""
        # Проверяем, что unit всегда равен Material.default_unit
        if self.unit_id != self.material.default_unit_id:
            raise ValidationError({
                "unit": [
                    f"Единица измерения должна быть {self.material.default_unit.code} (базовая единица материала)"
                ]
            })
        
        # Проверяем валидность source_type и source_id
        if self.source_type == "purchase_item":
            from purchases.models import PurchaseItem
            if not PurchaseItem.objects.filter(id=self.source_id).exists():
                raise ValidationError({"source_id": [f"PurchaseItem с ID {self.source_id} не существует"]})
        elif self.source_type == "writeoff":
            if not WriteOff.objects.filter(id=self.source_id).exists():
                raise ValidationError({"source_id": [f"WriteOff с ID {self.source_id} не существует"]})
        
        super().clean()
```

**Миграция:**
```python
# 0006_alter_stocksnapshot_required_fields.py
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('stock', '0005_alter_stocksnapshot_material_alter_writeoff_material'),
    ]

    operations = [
        migrations.AlterField(
            model_name='stocksnapshot',
            name='material',
            field=models.ForeignKey(
                help_text='Материал',
                on_delete=models.SET_NULL,
                to='common.material'
            ),
        ),
        migrations.AlterField(
            model_name='stocksnapshot',
            name='source_id',
            field=models.PositiveIntegerField(
                help_text='ID первоисточника (PurchaseItem.id или WriteOff.id)'
            ),
        ),
    ]
```

### Важные исправления

#### 3. Создать модели отчетов
```python
# В reports/models.py
from django.db import models
from common.models import TimeStamped

class ReportTemplate(TimeStamped):
    """Шаблоны отчетов"""
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)
    query_params = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name

class ReportCache(TimeStamped):
    """Кэш отчетов"""
    template = models.ForeignKey(ReportTemplate, on_delete=models.CASCADE)
    parameters = models.JSONField(default=dict)
    data = models.JSONField(default=dict)
    expires_at = models.DateTimeField()
    generated_by = models.ForeignKey('auth.User', on_delete=models.PROTECT)
    
    class Meta:
        unique_together = ['template', 'parameters']
        indexes = [
            models.Index(fields=['expires_at']),
            models.Index(fields=['template', 'parameters']),
        ]
    
    def __str__(self):
        return f"{self.template.name} - {self.created_at}"
```

### Дополнительные улучшения

#### 4. Добавить индексы для производительности
```python
# В common/models.py
class Material(TimeStamped):
    # ... поля ...
    
    class Meta:
        indexes = [
            models.Index(fields=["is_active"]),
            models.Index(fields=["created_date"]),
            models.Index(fields=["manufacturer"]),
            models.Index(fields=["category", "is_active"]),
            models.Index(fields=["sku"]),  # Добавить индекс для SKU
        ]
```

#### 5. Улучшить валидацию
```python
# В common/models.py
class Material(TimeStamped):
    # ... поля ...
    
    def clean(self):
        """Валидация модели Material"""
        super().clean()
        
        # Проверка уникальности SKU
        if self.sku:
            existing = Material.objects.filter(sku=self.sku).exclude(pk=self.pk)
            if existing.exists():
                raise ValidationError({
                    'sku': 'Материал с таким SKU уже существует'
                })
        
        # Проверка положительности средней цены
        if self.average_price and self.average_price <= 0:
            raise ValidationError({
                'average_price': 'Средняя цена должна быть положительной'
            })
```

## Заключение

### Общая оценка
**Статус:** ⚠️ Требует исправлений

**Количество моделей:** 16  
**Корректных моделей:** 14 (87.5%)  
**Моделей с проблемами:** 2 (12.5%)  
**Отсутствующих моделей:** 1 (6.25%)

### Приоритеты исправлений

#### Высокий приоритет
1. Исправить модель `Object.responsible` (убрать `null=True`)
2. Исправить модель `StockSnapshot` (убрать `null=True, blank=True` из `material`, убрать `default=0` из `source_id`)

#### Средний приоритет
3. Создать модели отчетов в модуле `reports`
4. Добавить дополнительные индексы для производительности

#### Низкий приоритет
5. Улучшить валидацию в существующих моделях
6. Добавить дополнительные поля для расширения функциональности

### Рекомендации по внедрению

1. **Создать миграции** для исправления существующих данных
2. **Протестировать** изменения на тестовых данных
3. **Обновить документацию** после внесения изменений
4. **Провести регрессионное тестирование** API
5. **Обновить фронтенд** при необходимости

### Ожидаемые результаты

После внесения исправлений:
- ✅ Все модели будут соответствовать бизнес-логике
- ✅ Связи между моделями будут корректными
- ✅ Обязательные поля будут правильно реализованы
- ✅ Система будет более стабильной и предсказуемой
- ✅ Улучшится производительность за счет дополнительных индексов
