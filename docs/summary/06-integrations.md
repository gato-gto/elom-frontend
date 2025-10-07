# Интеграции ELOM

## Обзор интеграций

ELOM интегрируется с внешними сервисами для расширения функциональности и автоматизации бизнес-процессов. Основные интеграции включают Telegram уведомления, систему экспорта данных и планируемые интеграции с внешними системами.

## Telegram интеграция

### Настройка Telegram Bot

#### 1. Создание бота
```bash
# Создание бота через @BotFather
/newbot
# Введите имя бота: ELOM Notifications
# Введите username: elom_notifications_bot
# Получите токен: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

#### 2. Получение Chat ID
```bash
# Добавьте бота в группу
# Отправьте сообщение в группу
# Получите Chat ID через API:
curl "https://api.telegram.org/bot<TOKEN>/getUpdates"
```

#### 3. Настройка в системе
```python
# Создание настроек Telegram
TelegramSettings.objects.create(
    bot_token="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz",
    chat_id="-1001234567890",
    is_active=True
)
```

### TelegramNotificationService

#### Основной сервис
```python
class TelegramNotificationService:
    @staticmethod
    def send_message(message: str, parse_mode: str = "HTML") -> bool:
        """Отправка текстового сообщения"""
        try:
            settings = TelegramSettings.objects.filter(is_active=True).first()
            if not settings:
                return False
            
            url = f"https://api.telegram.org/bot{settings.bot_token}/sendMessage"
            data = {
                "chat_id": settings.chat_id,
                "text": message,
                "parse_mode": parse_mode
            }
            
            response = requests.post(url, json=data, timeout=10)
            return response.status_code == 200
            
        except Exception as e:
            logger.error(f"Telegram notification error: {e}")
            return False
    
    @staticmethod
    def send_photo(photo_path: str, caption: str = "") -> bool:
        """Отправка фото с подписью"""
        try:
            settings = TelegramSettings.objects.filter(is_active=True).first()
            if not settings:
                return False
            
            url = f"https://api.telegram.org/bot{settings.bot_token}/sendPhoto"
            
            with open(photo_path, 'rb') as photo:
                files = {'photo': photo}
                data = {
                    "chat_id": settings.chat_id,
                    "caption": caption
                }
                
                response = requests.post(url, files=files, data=data, timeout=30)
                return response.status_code == 200
                
        except Exception as e:
            logger.error(f"Telegram photo error: {e}")
            return False
    
    @staticmethod
    def send_media_group(photos: list, caption: str = "") -> bool:
        """Отправка группы фото"""
        try:
            settings = TelegramSettings.objects.filter(is_active=True).first()
            if not settings:
                return False
            
            url = f"https://api.telegram.org/bot{settings.bot_token}/sendMediaGroup"
            
            media = []
            for i, photo_path in enumerate(photos):
                with open(photo_path, 'rb') as photo:
                    media.append({
                        "type": "photo",
                        "media": f"attach://photo_{i}",
                        "caption": caption if i == 0 else ""
                    })
            
            files = {f"photo_{i}": open(photo_path, 'rb') for i, photo_path in enumerate(photos)}
            data = {
                "chat_id": settings.chat_id,
                "media": json.dumps(media)
            }
            
            response = requests.post(url, files=files, data=data, timeout=60)
            return response.status_code == 200
            
        except Exception as e:
            logger.error(f"Telegram media group error: {e}")
            return False
        finally:
            for file in files.values():
                file.close()
```

### Типы уведомлений

#### 1. Уведомления о закупках
```python
@receiver(post_save, sender=Purchase)
def send_purchase_telegram_notification(sender, instance, created, **kwargs):
    if created:
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
        
        TelegramNotificationService.send_message(message)
        
        # Логирование уведомления
        TelegramNotification.objects.create(
            purchase=instance,
            message=message,
            status='sent'
        )
```

#### 2. Уведомления об изменении статуса
```python
@receiver(post_save, sender=Purchase)
def send_status_change_notification(sender, instance, created, **kwargs):
    if not created and instance.status == 'completed':
        message = f"""
✅ <b>Закупка выполнена #{instance.purchase_no}</b>

🏗️ <b>Объект:</b> {instance.object.name}
📸 <b>Фото отчета:</b> {instance.photos.filter(type='report').count()} шт.
👤 <b>Ответственный:</b> {instance.responsible.profile.user.get_full_name()}
        """
        
        TelegramNotificationService.send_message(message)
        
        # Отправка фото отчета
        report_photos = instance.photos.filter(type='report')
        if report_photos.exists():
            photo_paths = [photo.photo.path for photo in report_photos]
            TelegramNotificationService.send_media_group(photo_paths, "Фото отчета")
```

#### 3. Уведомления о создании объектов
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

### Форматирование сообщений

#### HTML разметка
```python
def format_purchase_message(purchase: Purchase) -> str:
    """Форматирование сообщения о закупке"""
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

#### Эмодзи и символы
- 🛒 Закупки
- 🏗️ Объекты
- 📸 Фото
- 👤 Пользователи
- 💰 Деньги
- 📅 Даты
- ✅ Успех
- ❌ Ошибка
- ⚠️ Предупреждение

### Обработка ошибок
```python
class TelegramNotificationService:
    @staticmethod
    def send_message_with_retry(message: str, max_retries: int = 3) -> bool:
        """Отправка сообщения с повторными попытками"""
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

## Система экспорта данных

### Экспорт в Excel

#### Backend экспорт
```python
import pandas as pd
from django.http import HttpResponse
from io import BytesIO

def export_purchases_to_excel(queryset, filename="purchases.xlsx"):
    """Экспорт закупок в Excel"""
    
    # Подготовка данных
    data = []
    for purchase in queryset:
        data.append({
            'Номер закупки': purchase.purchase_no,
            'Дата': purchase.date,
            'Объект': purchase.object.name,
            'Поставщик': purchase.supplier.name,
            'Ответственный': purchase.responsible.profile.user.get_full_name(),
            'Сумма': float(purchase.total_amount),
            'Валюта': purchase.currency,
            'Статус': purchase.get_status_display(),
            'Комментарий': purchase.comment or '',
            'Дата создания': purchase.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    # Создание DataFrame
    df = pd.DataFrame(data)
    
    # Создание Excel файла
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Закупки', index=False)
        
        # Форматирование
        worksheet = writer.sheets['Закупки']
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            worksheet.column_dimensions[column_letter].width = adjusted_width
    
    output.seek(0)
    
    # Создание HTTP ответа
    response = HttpResponse(
        output.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    return response
```

#### Frontend экспорт
```typescript
// utils/export.ts
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: string[]
) {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
  
  // Форматирование заголовков
  if (headers) {
    const headerRow = XLSX.utils.aoa_to_sheet([headers])
    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' })
  }
  
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

// Использование в компонентах
function handleExport(format: 'csv' | 'excel' | 'pdf') {
  try {
    const data = rows.value
    const filename = `purchases_${new Date().toISOString().split('T')[0]}`

    switch (format) {
      case 'excel':
        exportToExcel(data, filename)
        break
      case 'csv':
        exportToCSV(data, filename)
        break
      case 'pdf':
        exportToPDF(data, filename)
        break
    }

    ui.toast({ type: 'success', text: `Экспорт в ${format.toUpperCase()} выполнен` })
  } catch (error) {
    ErrorHandlers.dataLoading(error)
  }
}
```

### Экспорт в PDF

#### Backend PDF генерация
```python
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

def export_purchases_to_pdf(queryset, filename="purchases.pdf"):
    """Экспорт закупок в PDF"""
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Заголовок
    title = Paragraph("Отчет по закупкам", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 12))
    
    # Подготовка данных таблицы
    data = [['Номер', 'Дата', 'Объект', 'Поставщик', 'Сумма', 'Статус']]
    
    for purchase in queryset:
        data.append([
            purchase.purchase_no,
            purchase.date.strftime('%d.%m.%Y'),
            purchase.object.name,
            purchase.supplier.name,
            f"{purchase.total_amount:,.2f} {purchase.currency}",
            purchase.get_status_display()
        ])
    
    # Создание таблицы
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(table)
    
    # Генерация PDF
    doc.build(story)
    buffer.seek(0)
    
    response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    return response
```

### Экспорт в CSV
```python
import csv
from django.http import HttpResponse

def export_to_csv(queryset, filename="data.csv"):
    """Универсальный экспорт в CSV"""
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    writer = csv.writer(response)
    
    # Заголовки
    if queryset.exists():
        first_obj = queryset.first()
        headers = [field.name for field in first_obj._meta.fields]
        writer.writerow(headers)
        
        # Данные
        for obj in queryset:
            row = [getattr(obj, field.name) for field in obj._meta.fields]
            writer.writerow(row)
    
    return response
```

## Планируемые интеграции

### Email уведомления

#### Настройка SMTP
```python
# settings.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'noreply@elom.com'
EMAIL_HOST_PASSWORD = 'your-app-password'
DEFAULT_FROM_EMAIL = 'ELOM System <noreply@elom.com>'
```

#### Email сервис
```python
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string

class EmailNotificationService:
    @staticmethod
    def send_purchase_notification(purchase: Purchase):
        """Отправка уведомления о закупке по email"""
        
        subject = f"Новая закупка #{purchase.purchase_no}"
        
        # HTML шаблон
        html_content = render_to_string('emails/purchase_notification.html', {
            'purchase': purchase,
            'object': purchase.object,
            'supplier': purchase.supplier
        })
        
        # Текстовый шаблон
        text_content = f"""
        Новая закупка #{purchase.purchase_no}
        
        Дата: {purchase.date}
        Объект: {purchase.object.name}
        Поставщик: {purchase.supplier.name}
        Ответственный: {purchase.responsible.profile.user.get_full_name()}
        Сумма: {purchase.total_amount} {purchase.currency}
        """
        
        # Получатели
        recipients = [
            purchase.responsible.email,
            purchase.object.responsible.user.email
        ]
        
        # Отправка
        msg = EmailMultiAlternatives(subject, text_content, None, recipients)
        msg.attach_alternative(html_content, "text/html")
        msg.send()
```

### SMS уведомления

#### Интеграция с SMS провайдером
```python
import requests

class SMSNotificationService:
    def __init__(self):
        self.api_key = settings.SMS_API_KEY
        self.api_url = settings.SMS_API_URL
    
    def send_sms(self, phone: str, message: str) -> bool:
        """Отправка SMS"""
        try:
            data = {
                'api_key': self.api_key,
                'to': phone,
                'message': message
            }
            
            response = requests.post(self.api_url, json=data, timeout=10)
            return response.status_code == 200
            
        except Exception as e:
            logger.error(f"SMS send error: {e}")
            return False
    
    def send_critical_notification(self, user: User, message: str):
        """Отправка критических уведомлений"""
        if user.profile.phone:
            return self.send_sms(user.profile.phone, message)
        return False
```

### Интеграция с ERP системами

#### SAP интеграция
```python
import requests
from zeep import Client

class SAPIntegrationService:
    def __init__(self):
        self.wsdl_url = settings.SAP_WSDL_URL
        self.client = Client(self.wsdl_url)
    
    def create_material(self, material_data: dict) -> dict:
        """Создание материала в SAP"""
        try:
            result = self.client.service.CreateMaterial(
                MaterialNumber=material_data['sku'],
                MaterialDescription=material_data['name'],
                MaterialGroup=material_data['category'],
                BaseUnit=material_data['unit']
            )
            return {'success': True, 'sap_id': result.MaterialNumber}
            
        except Exception as e:
            logger.error(f"SAP material creation error: {e}")
            return {'success': False, 'error': str(e)}
    
    def sync_purchase_order(self, purchase: Purchase) -> dict:
        """Синхронизация заказа с SAP"""
        try:
            order_data = {
                'PurchaseOrderNumber': purchase.purchase_no,
                'Vendor': purchase.supplier.sap_code,
                'OrderDate': purchase.date,
                'Items': []
            }
            
            for item in purchase.items.all():
                order_data['Items'].append({
                    'MaterialNumber': item.material.sku,
                    'Quantity': float(item.quantity),
                    'Unit': item.unit.code,
                    'Price': float(item.price) if item.price else 0
                })
            
            result = self.client.service.CreatePurchaseOrder(order_data)
            return {'success': True, 'sap_order_id': result.OrderNumber}
            
        except Exception as e:
            logger.error(f"SAP order sync error: {e}")
            return {'success': False, 'error': str(e)}
```

### Webhook интеграции

#### Webhook сервис
```python
import requests
import json
import hmac
import hashlib

class WebhookService:
    @staticmethod
    def send_webhook(url: str, data: dict, secret: str = None) -> bool:
        """Отправка webhook"""
        try:
            payload = json.dumps(data)
            headers = {'Content-Type': 'application/json'}
            
            if secret:
                signature = hmac.new(
                    secret.encode(),
                    payload.encode(),
                    hashlib.sha256
                ).hexdigest()
                headers['X-Webhook-Signature'] = f'sha256={signature}'
            
            response = requests.post(url, data=payload, headers=headers, timeout=10)
            return response.status_code in [200, 201, 202]
            
        except Exception as e:
            logger.error(f"Webhook send error: {e}")
            return False
    
    @staticmethod
    def send_purchase_webhook(purchase: Purchase):
        """Отправка webhook о закупке"""
        webhook_urls = WebhookSettings.objects.filter(
            event_type='purchase_created',
            is_active=True
        )
        
        data = {
            'event': 'purchase.created',
            'timestamp': purchase.created_at.isoformat(),
            'data': {
                'id': purchase.id,
                'purchase_no': purchase.purchase_no,
                'object': purchase.object.name,
                'supplier': purchase.supplier.name,
                'total_amount': str(purchase.total_amount),
                'currency': purchase.currency
            }
        }
        
        for webhook in webhook_urls:
            WebhookService.send_webhook(webhook.url, data, webhook.secret)
```

## Мониторинг интеграций

### Логирование интеграций
```python
import logging

logger = logging.getLogger('integrations')

class IntegrationLogger:
    @staticmethod
    def log_telegram_send(success: bool, message: str, error: str = None):
        """Логирование отправки Telegram"""
        if success:
            logger.info(f"Telegram message sent successfully: {message[:100]}...")
        else:
            logger.error(f"Telegram send failed: {error}")
    
    @staticmethod
    def log_export_activity(user: User, format: str, count: int):
        """Логирование экспорта данных"""
        logger.info(f"User {user.username} exported {count} records in {format} format")
    
    @staticmethod
    def log_webhook_call(url: str, success: bool, response_code: int = None):
        """Логирование webhook вызовов"""
        if success:
            logger.info(f"Webhook sent successfully to {url}")
        else:
            logger.error(f"Webhook failed to {url}, response code: {response_code}")
```

### Метрики интеграций
```python
from django.core.cache import cache

class IntegrationMetrics:
    @staticmethod
    def increment_telegram_sends():
        """Увеличение счетчика отправленных Telegram сообщений"""
        cache.incr('telegram_sends_count', 1)
    
    @staticmethod
    def increment_export_count(format: str):
        """Увеличение счетчика экспортов"""
        cache.incr(f'export_count_{format}', 1)
    
    @staticmethod
    def get_telegram_stats():
        """Получение статистики Telegram"""
        return {
            'total_sends': cache.get('telegram_sends_count', 0),
            'success_rate': cache.get('telegram_success_rate', 0)
        }
    
    @staticmethod
    def get_export_stats():
        """Получение статистики экспортов"""
        return {
            'excel': cache.get('export_count_excel', 0),
            'pdf': cache.get('export_count_pdf', 0),
            'csv': cache.get('export_count_csv', 0)
        }
```

## Безопасность интеграций

### Валидация webhook
```python
def verify_webhook_signature(request, secret: str) -> bool:
    """Проверка подписи webhook"""
    signature = request.headers.get('X-Webhook-Signature', '')
    if not signature.startswith('sha256='):
        return False
    
    expected_signature = hmac.new(
        secret.encode(),
        request.body,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature[7:], expected_signature)
```

### Ограничение частоты запросов
```python
from django.core.cache import cache
from django.http import HttpResponse

def rate_limit_decorator(max_requests: int = 100, window: int = 3600):
    """Декоратор для ограничения частоты запросов"""
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            client_ip = get_client_ip(request)
            key = f"rate_limit_{client_ip}"
            
            current_requests = cache.get(key, 0)
            if current_requests >= max_requests:
                return HttpResponse('Rate limit exceeded', status=429)
            
            cache.set(key, current_requests + 1, window)
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator
```

### Шифрование чувствительных данных
```python
from cryptography.fernet import Fernet
import base64

class EncryptionService:
    def __init__(self):
        self.key = settings.ENCRYPTION_KEY.encode()
        self.cipher = Fernet(self.key)
    
    def encrypt(self, data: str) -> str:
        """Шифрование данных"""
        encrypted = self.cipher.encrypt(data.encode())
        return base64.b64encode(encrypted).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """Расшифровка данных"""
        encrypted = base64.b64decode(encrypted_data.encode())
        decrypted = self.cipher.decrypt(encrypted)
        return decrypted.decode()
```

## Тестирование интеграций

### Unit тесты
```python
import unittest
from unittest.mock import patch, Mock

class TestTelegramIntegration(unittest.TestCase):
    @patch('requests.post')
    def test_send_message_success(self, mock_post):
        """Тест успешной отправки сообщения"""
        mock_post.return_value.status_code = 200
        
        result = TelegramNotificationService.send_message("Test message")
        
        self.assertTrue(result)
        mock_post.assert_called_once()
    
    @patch('requests.post')
    def test_send_message_failure(self, mock_post):
        """Тест неудачной отправки сообщения"""
        mock_post.side_effect = Exception("Network error")
        
        result = TelegramNotificationService.send_message("Test message")
        
        self.assertFalse(result)
```

### Integration тесты
```python
class TestExportIntegration(unittest.TestCase):
    def test_excel_export(self):
        """Тест экспорта в Excel"""
        purchases = Purchase.objects.all()[:5]
        
        response = export_purchases_to_excel(purchases)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
```

## Конфигурация интеграций

### Настройки Django
```python
# settings.py

# Telegram
TELEGRAM_BOT_TOKEN = env('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHAT_ID = env('TELEGRAM_CHAT_ID')

# Email
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST')
EMAIL_PORT = env('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env('EMAIL_USE_TLS', default=True)

# SMS
SMS_API_KEY = env('SMS_API_KEY')
SMS_API_URL = env('SMS_API_URL')

# Webhooks
WEBHOOK_SECRET = env('WEBHOOK_SECRET')

# SAP
SAP_WSDL_URL = env('SAP_WSDL_URL')
SAP_USERNAME = env('SAP_USERNAME')
SAP_PASSWORD = env('SAP_PASSWORD')
```

### Environment переменные
```bash
# .env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-1001234567890
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
SMS_API_KEY=your_sms_api_key
SMS_API_URL=https://api.sms-provider.com/send
WEBHOOK_SECRET=your_webhook_secret
SAP_WSDL_URL=https://sap-server.com/wsdl
SAP_USERNAME=sap_user
SAP_PASSWORD=sap_password
```

## Интеграция с системой пагинации

### Архитектура интеграции

ELOM использует единообразную систему пагинации через `createBaseStore`, которая интегрируется с различными компонентами системы:

#### Интеграция с API

```typescript
// Базовый store автоматически интегрируется с API
const fetchList = async (params?: any) => {
  const queryParams = {
    page: pagination.value.page,
    page_size: pagination.value.pageSize,
    search: filters.value.search,
    ordering: filters.value.ordering,
    ...params
  }

  const query = buildQuery(queryParams)
  const { data } = await api.get<PaginatedResponse<T>>(endpoint.list + query)
  
  // Обновление состояния
  items.value = data.results
  pagination.value = {
    count: data.count,
    page: queryParams.page,
    pageSize: pagination.value.pageSize,
    next: data.next || null,
    previous: data.previous || null
  }
}
```

#### Интеграция с компонентами

```vue
<!-- GenericList автоматически интегрируется с stores -->
<template>
  <GenericList
    :store="materialsStore"
    :config="listConfig"
    @export="handleExport"
  />
</template>

<script setup lang="ts">
// Store предоставляет все необходимые методы
const materialsStore = useMaterialsStore

// GenericList использует:
// - materialsStore.setPage() для пагинации
// - materialsStore.setFilters() для фильтрации
// - materialsStore.fetchList() для загрузки данных
</script>
```

#### Интеграция с ModernPagination

```vue
<!-- ModernPagination интегрируется с store через props -->
<template>
  <ModernPagination
    :current-page="store.pagination.page"
    :total-pages="totalPages"
    :total-items="store.pagination.count"
    :page-size="store.pagination.pageSize"
    @page-change="store.setPage"
    @page-size-change="store.setPageSize"
  />
</template>
```

### Преимущества интеграции

1. **Единообразность**: Все списки используют одинаковую логику пагинации
2. **Переиспользование**: Один код для всех stores
3. **Типобезопасность**: Строгая типизация TypeScript
4. **Производительность**: Оптимизированные запросы к API
5. **Поддерживаемость**: Легко добавлять новые stores

### Расширение функциональности

#### Кастомные фильтры

```typescript
// Materials store с расширенными фильтрами
const extendedFilters = {
  search: '',
  name: '',
  sku: '',
  category: '',
  ordering: 'name'
}

const setFilters = async (newFilters: Partial<typeof extendedFilters>) => {
  Object.assign(extendedFilters, newFilters)
  pagination.value.page = 1
  await fetchList()
}
```

#### Специализированная обработка данных

```typescript
// Balances store с flattening данных
const fetchList = async (params?: any) => {
  const response = await api.get(`${endpoints.stockSnapshots.byObjects}?${apiParams}`)
  
  // Flattening для табличного отображения
  const flattenedData: MaterialBalance[] = []
  if (response.data.objects) {
    response.data.objects.forEach((obj: any) => {
      obj.materials.forEach((material: any) => {
        flattenedData.push({
          material_id: material.material_id,
          material_name: material.material_name,
          object_name: obj.object_name,
          // ... другие поля
        } as MaterialBalance)
      })
    })
  }
  
  items.value = flattenedData
}
```

