# Требования к Telegram уведомлениям в ELOM

**Дата анализа**: 20 ноября 2025  
**Источник**: Вся документация проекта (docs/)

---

## 📋 Общие требования

### Назначение
**Автоматическая отправка уведомлений в Telegram чат (группу/личные сообщения/канал) о ключевых событиях в системе ELOM.**

### Управление настройками
- ✅ **Django Admin** - управление настройками через админ-панель (достаточно)
- ❌ **Frontend интерфейс** - не требуется (по требованию пользователя)

---

## 🔔 Типы уведомлений (из документации)

### 1. Уведомления о закупках ✅ (Реализовано)

#### 1.1. Создание закупки (`created`)
**Источник**: `docs/summary/05-business-logic.md:471-487`, `docs/manuals/USER_MANUAL.md:392-401`

**Когда отправляется**: При создании новой закупки (`Purchase`)

**Содержание сообщения**:
```
🛒 Новая закупка #{purchase_no}

📅 Дата: {date}
🏗️ Объект: {object.name}
🏢 Поставщик: {supplier.name}
👤 Ответственный: {responsible.user.get_full_name()}
💰 Сумма: {total_amount} {currency}
📝 Комментарий: {comment or 'Нет'}
```

**Дополнительно**:
- ✅ Прикрепление фотоинструкций (если есть)
- ✅ Ссылка на карту (если `object.location_url` есть)
- ✅ Форматирование HTML (`<b>`, `<a>`)

**Формат из документации** (`docs/summary/06-integrations.md:132-144`):
```python
message = f"""
🛒 <b>Новая закупка #{instance.purchase_no}</b>

📅 <b>Дата:</b> {instance.date}
🏗️ <b>Объект:</b> {instance.object.name}
🏢 <b>Поставщик:</b> {instance.supplier.name}
👤 <b>Ответственный:</b> {instance.responsible.profile.user.get_full_name()}
💰 <b>Сумма:</b> {instance.total_amount:,.2f} {instance.currency}

📝 <b>Комментарий:</b> {instance.comment or 'Нет'}

🔗 <a href="{instance.object.location_url}">Открыть на карте</a>
"""
```

**Статус**: ✅ Реализовано

---

#### 1.2. Изменение статуса закупки (`status_changed`)
**Источник**: `docs/summary/05-business-logic.md:489-501`, `docs/manuals/USER_MANUAL.md:403-404`

**Когда отправляется**: При изменении статуса закупки, особенно при статусе "completed"

**Содержание сообщения** (для статуса "completed"):
```
✅ Закупка выполнена #{purchase_no}

🏗️ Объект: {object.name}
📸 Фото отчета: {count} шт.
👤 Ответственный: {responsible.user.get_full_name()}
```

**Дополнительно**:
- ✅ Прикрепление фото отчета (тип `report`) при статусе "completed"
- ✅ Отправка через `send_media_group` для нескольких фото

**Формат из документации** (`docs/summary/06-integrations.md:161-175`):
```python
message = f"""
✅ <b>Закупка выполнена #{instance.purchase_no}</b>

🏗️ <b>Объект:</b> {instance.object.name}
📸 <b>Фото отчета:</b> {instance.photos.filter(type='report').count()} шт.
👤 <b>Ответственный:</b> {instance.responsible.profile.user.get_full_name()}
"""

# Отправка фото отчета
report_photos = instance.photos.filter(type='report')
if report_photos.exists():
    photo_paths = [photo.photo.path for photo in report_photos]
    TelegramNotificationService.send_media_group(photo_paths, "Фото отчета")
```

**Статус**: ✅ Реализовано

---

#### 1.3. Добавление фото (`photo_added`)
**Источник**: `docs/summary/05-business-logic.md:711`

**Когда отправляется**: При добавлении `PurchasePhoto`

**Содержание**:
- ✅ Уведомление о добавлении фото
- ✅ Прикрепление добавленного фото

**Статус**: ✅ Реализовано

---

### 2. Уведомления о создании объектов ❌ (Не реализовано)

**Источник**: 
- `docs/summary/05-business-logic.md:503-516`
- `docs/summary/06-integrations.md:178-202`
- `docs/manuals/USER_GUIDE_FORMS.md:164`
- `docs/manuals/USER_MANUAL.md:164`

**Когда отправляется**: При создании нового объекта (`Object`)

**Содержание сообщения**:
```
🏗️ Новый объект: {object.name}

📍 Адрес: {address}
👤 Ответственный: {responsible.user.get_full_name()}
📞 Ключевое лицо: {key_person_name}
📱 Контакты: {key_person_contacts}
📅 Дата начала: {date_start}

🔗 <a href="{location_url}">Открыть на карте</a>
```

**Дополнительно**:
- ✅ Прикрепление фото инструкций (если есть)
- ✅ Отправка через `send_media_group` для нескольких фото

**Формат из документации** (`docs/summary/06-integrations.md:183-201`):
```python
@receiver(post_save, sender=Object)
def send_object_creation_notification(sender, instance, created, **kwargs):
    if created:
        message = f"""
🏗️ <b>Новый объект: {instance.name}</b>

📍 <b>Адрес:</b> {instance.address}
👤 <b>Ответственный:</b> {instance.responsible.user.get_full_name()}
📞 <b>Ключевое лицо:</b> {instance.key_person_name}
📱 <b>Контакты:</b> {instance.key_person_contacts}
📅 <b>Дата начала:</b> {instance.date_start}

🔗 <a href="{instance.location_url}">Открыть на карте</a>
        """
        
        TelegramNotificationService.send_message(message)
        
        # Отправка фото инструкций
        instruction_photos = instance.photos.filter(type='instructions')
        if instruction_photos.exists():
            photo_paths = [photo.photo.path for photo in instruction_photos]
            TelegramNotificationService.send_media_group(photo_paths, "Фото инструкций")
```

**Статус**: ❌ Не реализовано (описано в документации, но нет сигнала в коде)

---

### 3. Уведомления о списаниях ❌ (Не описано явно, но логично)

**Источник**: Логика системы (списания - важное событие)

**Когда отправляется**: При создании списания (`WriteOff`)

**Предполагаемое содержание**:
```
📉 Списание материалов

🏗️ Объект: {object.name}
📦 Материал: {material.name}
📊 Количество: {quantity} {unit_code}
👤 Ответственный: {responsible.user.get_full_name()}
📅 Дата: {date}
💬 Комментарий: {comment or 'Нет'}
```

**Дополнительно**:
- Информация о текущем остатке после списания
- Предупреждение при отрицательном остатке

**Статус**: ❌ Не реализовано (не описано в документации, но логично добавить)

---

## 🎨 Форматирование сообщений

### HTML разметка
**Источник**: `docs/summary/06-integrations.md:204-223`

**Поддерживаемые теги**:
- `<b>текст</b>` - жирный текст
- `<a href="url">текст</a>` - ссылки
- Поддержка `parse_mode='HTML'` или `parse_mode='Markdown'`

**Пример** (`docs/summary/06-integrations.md:207-223`):
```python
def format_purchase_message(purchase: Purchase) -> str:
    return f"""
🛒 <b>Закупка #{purchase.purchase_no}</b>

📅 <b>Дата:</b> {purchase.date}
🏗️ <b>Объект:</b> {purchase.object.name}
🏢 <b>Поставщик:</b> {purchase.supplier.name}
👤 <b>Ответственный:</b> {purchase.responsible.profile.user.get_full_name()}
💰 <b>Сумма:</b> {purchase.total_amount:,.2f} {purchase.currency}

📝 <b>Комментарий:</b> {purchase.comment or 'Нет'}

🔗 <a href="{purchase.object.location_url}">Открыть на карте</a>
    """
```

**Статус**: ✅ Реализовано (используется Markdown, но можно переключить на HTML)

---

### Эмодзи и символы
**Источник**: `docs/summary/06-integrations.md:225-234`

**Используемые эмодзи**:
- 🛒 Закупки
- 🏗️ Объекты
- 📸 Фото
- 👤 Пользователи
- 💰 Деньги
- 📅 Даты
- ✅ Успех
- ❌ Ошибка
- ⚠️ Предупреждение
- 📉 Списания (предполагается)
- 📍 Локация
- 🔗 Ссылки

**Статус**: ✅ Реализовано

---

## 🔘 Интерактивные кнопки

**Источник**: `docs/summary/05-business-logic.md:731-733`

**Требования**:
- **📍 Открыть на карте** - кнопка с URL для перехода к локации объекта
- **📋 Детали закупки** - кнопка для получения дополнительной информации (опционально)

**Реализация**:
- Использование `InlineKeyboardMarkup` в Telegram Bot API
- Кнопка "Открыть на карте" с `location_url` из объекта

**Статус**: ❌ Не реализовано (описано в документации, но не реализовано в коде)

---

## 📸 Работа с фотографиями

### Типы фото
**Источник**: `docs/summary/05-business-logic.md:738`

- `instructions` - инструкции (для объектов и закупок)
- `report` - отчет (для закупок со статусом "completed")

### Ограничения
**Источник**: `docs/summary/05-business-logic.md:739`

- **Максимум фото**: 5 на уведомление
- **Отправка**: Через `sendPhoto` для отдельных фото или `sendMediaGroup` для группы

**Статус**: ✅ Реализовано (до 5 фото)

---

## ⚙️ Настройка системы

### Требования к настройкам
**Источник**: `docs/summary/05-business-logic.md:741-746`

1. **Создание бота** через @BotFather
2. **Получение токена** (`bot_token`)
3. **Получение Chat ID** (`chat_id`) - для группы/канала/личных сообщений
4. **Настройка в Django Admin** - создание записи `TelegramSettings`
5. **Активация** через `is_active = True`

### Модель настроек
```python
class TelegramSettings(TimeStamped):
    bot_token = models.CharField(max_length=256)
    chat_id = models.CharField(max_length=64)  # Может быть для группы, канала или ЛС
    is_active = models.BooleanField(default=True)
```

**Статус**: ✅ Реализовано

---

## 📝 Логирование уведомлений

### Модель для логирования
**Источник**: `docs/summary/02-data-models.md:310-324`

```python
class TelegramNotification(TimeStamped):
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, null=True, blank=True)
    object = models.ForeignKey(Object, on_delete=models.CASCADE, null=True, blank=True)
    message_type = models.CharField(choices=MESSAGE_TYPE_CHOICES)
    message_text = models.TextField()
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
```

**Требования**:
- ✅ Логирование всех попыток отправки
- ✅ Сохранение текста сообщения
- ✅ Отметка статуса отправки (`is_sent`)
- ✅ Сохранение времени отправки (`sent_at`)
- ✅ Сохранение ошибок (`error_message`)

**Статус**: ✅ Реализовано

---

## 🔄 Автоматические процессы

**Источник**: `docs/summary/05-business-logic.md:725-729`

### Триггеры уведомлений:
1. ✅ При создании закупки → уведомление о создании
2. ✅ При изменении статуса → уведомление о смене статуса
3. ✅ При статусе "completed" → прикрепляются фото отчета
4. ✅ При добавлении фото → уведомление с фото
5. ❌ При создании объекта → уведомление о создании объекта (не реализовано)
6. ❌ При создании списания → уведомление о списании (не реализовано)

**Статус**: Частично реализовано (3 из 6)

---

## 🛡️ Валидация и обработка ошибок

### Повторные попытки
**Источник**: `docs/summary/06-integrations.md:237-253`

**Требования**:
- ✅ Повторные попытки отправки (до 3 раз)
- ✅ Exponential backoff (задержка между попытками)
- ✅ Логирование всех ошибок

**Пример из документации**:
```python
def send_message_with_retry(message: str, max_retries: int = 3) -> bool:
    for attempt in range(max_retries):
        try:
            if TelegramNotificationService.send_message(message):
                return True
        except Exception as e:
            logger.warning(f"Telegram send attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
    
    logger.error(f"Failed to send Telegram message after {max_retries} attempts")
    return False
```

**Статус**: ❌ Не реализовано (описано в документации, но не реализовано в коде)

---

## 📊 Сводка требований

### ✅ Реализовано
1. ✅ Уведомления о создании закупки
2. ✅ Уведомления об изменении статуса закупки
3. ✅ Уведомления о добавлении фото
4. ✅ Отправка фотографий (до 5 шт.)
5. ✅ Форматирование сообщений (Markdown)
6. ✅ Логирование уведомлений
7. ✅ Управление настройками через Django Admin

### ❌ Не реализовано (но требуется)
1. ❌ Уведомления о создании объектов
2. ❌ Уведомления о списаниях
3. ❌ Интерактивные кнопки в сообщениях
4. ❌ Повторные попытки отправки с exponential backoff
5. ❌ Поддержка HTML разметки (сейчас только Markdown)

---

## 🎯 Что нужно реализовать

### Приоритет 1: Критично
1. **Уведомления о создании объектов**
   - Сигнал на `post_save` для модели `Object`
   - Форматирование сообщения согласно документации
   - Отправка фото инструкций

2. **Уведомления о списаниях**
   - Сигнал на `post_save` для модели `WriteOff`
   - Форматирование сообщения о списании
   - Информация: объект, материал, количество, единица, ответственный

### Приоритет 2: Важно
3. **Интерактивные кнопки**
   - Кнопка "Открыть на карте" с `location_url`
   - Использование `InlineKeyboardMarkup` в Telegram Bot API

4. **Повторные попытки отправки**
   - Метод `send_message_with_retry` с exponential backoff
   - Логирование всех попыток

### Приоритет 3: Желательно
5. **Поддержка HTML разметки**
   - Переключение с Markdown на HTML (или поддержка обоих)
   - Более богатое форматирование сообщений

---

## 📝 Примечания

### Текущая реализация
- Используется `parse_mode='Markdown'` (в коде)
- В документации описан HTML формат
- Нужно привести к единообразию

### Chat ID
- Может быть для группы (начинается с `-`)
- Может быть для канала (начинается с `-100`)
- Может быть для личных сообщений (положительное число)
- Система должна поддерживать все варианты

### Фото
- Максимум 5 фото на уведомление (реализовано)
- Отправка через `sendPhoto` для отдельных фото
- Отправка через `sendMediaGroup` для группы фото

---

**Последнее обновление**: 20 ноября 2025  
**Статус**: Частично реализовано (7 из 12 требований)

---

## 📋 Итоговый список задач по уведомлениям

### ✅ Реализовано (7 задач)
1. ✅ Уведомления о создании закупки
2. ✅ Уведомления об изменении статуса закупки
3. ✅ Уведомления о добавлении фото
4. ✅ Отправка фотографий (до 5 шт.)
5. ✅ Форматирование сообщений (Markdown)
6. ✅ Логирование уведомлений
7. ✅ Управление настройками через Django Admin

### ❌ Требуется реализовать (5 задач)

#### Критично (для полноты функциональности)
1. **Уведомления о создании объектов**
   - Сигнал на `post_save` для модели `Object`
   - Форматирование согласно документации
   - Отправка фото инструкций
   - **Источник**: `docs/summary/05-business-logic.md:503-516`, `docs/summary/06-integrations.md:178-202`

2. **Уведомления о списаниях**
   - Сигнал на `post_save` для модели `WriteOff`
   - Информация: объект, материал, количество, единица, ответственный
   - **Источник**: Логика системы (списания - важное событие)

#### Важно (для улучшения UX)
3. **Интерактивные кнопки в сообщениях**
   - Кнопка "Открыть на карте" с `location_url`
   - Использование `InlineKeyboardMarkup`
   - **Источник**: `docs/summary/05-business-logic.md:731-733`

4. **Повторные попытки отправки**
   - Метод `send_message_with_retry` с exponential backoff
   - Логирование всех попыток
   - **Источник**: `docs/summary/06-integrations.md:237-253`

#### Желательно (опционально)
5. **Поддержка HTML разметки**
   - Переключение с Markdown на HTML (или поддержка обоих)
   - Более богатое форматирование
   - **Источник**: `docs/summary/06-integrations.md:204-223` (описан HTML формат)

---

## 🎯 Приоритеты реализации

### Этап 1: Критично (4-6 часов)
1. Уведомления о создании объектов
2. Уведомления о списаниях

**Результат**: Полное покрытие основных событий системы

### Этап 2: Важно (4-6 часов)
3. Интерактивные кнопки в сообщениях
4. Повторные попытки отправки с exponential backoff

**Результат**: Более удобные и надежные уведомления

### Этап 3: Желательно (2-3 часа)
5. Поддержка HTML разметки

**Результат**: Более богатое форматирование сообщений

