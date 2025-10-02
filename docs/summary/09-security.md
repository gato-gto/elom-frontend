# Безопасность ELOM

## Обзор безопасности

ELOM реализует многоуровневую систему безопасности, включающую аутентификацию, авторизацию, защиту данных, валидацию входных данных и аудит действий пользователей. Система построена на принципах defense in depth и следует лучшим практикам безопасности.

## Аутентификация

### JWT токены

#### Структура токенов
```python
# settings.py
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'JTI_CLAIM': 'jti',
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}
```

#### Безопасное хранение токенов
```typescript
// src/api/client.ts
class TokenManager {
  private static ACCESS_TOKEN_KEY = 'elom_access_token'
  private static REFRESH_TOKEN_KEY = 'elom_refresh_token'
  
  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY)
  }
  
  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY)
  }
  
  static setTokens(access: string, refresh: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, access)
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refresh)
  }
  
  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY)
    localStorage.removeItem(this.REFRESH_TOKEN_KEY)
  }
  
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Date.now() / 1000
      return payload.exp < currentTime
    } catch {
      return true
    }
  }
}
```

#### Автоматическое обновление токенов
```typescript
// src/api/client.ts
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refreshToken = TokenManager.getRefreshToken()
      if (refreshToken && !TokenManager.isTokenExpired(refreshToken)) {
        try {
          const response = await axios.post('/auth/token/refresh/', {
            refresh: refreshToken
          })
          
          const { access } = response.data
          TokenManager.setTokens(access, refreshToken)
          
          // Повторный запрос с новым токеном
          originalRequest.headers.Authorization = `Bearer ${access}`
          return axios(originalRequest)
        } catch (refreshError) {
          // Очистка токенов и перенаправление на логин
          TokenManager.clearTokens()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }
    }
    
    return Promise.reject(error)
  }
)
```

### Политики паролей

#### Backend валидация
```python
# settings.py
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
    {
        'NAME': 'users.validators.CustomPasswordValidator',
    },
]

# users/validators.py
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import BasePasswordValidator

class CustomPasswordValidator(BasePasswordValidator):
    def validate(self, password, user=None):
        if not any(c.isupper() for c in password):
            raise ValidationError("Пароль должен содержать хотя бы одну заглавную букву.")
        
        if not any(c.islower() for c in password):
            raise ValidationError("Пароль должен содержать хотя бы одну строчную букву.")
        
        if not any(c.isdigit() for c in password):
            raise ValidationError("Пароль должен содержать хотя бы одну цифру.")
        
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            raise ValidationError("Пароль должен содержать хотя бы один специальный символ.")
    
    def get_help_text(self):
        return "Пароль должен содержать заглавные и строчные буквы, цифры и специальные символы."
```

#### Frontend валидация
```typescript
// src/utils/passwordValidation.ts
export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Пароль должен содержать минимум 8 символов')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну заглавную букву')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну строчную букву')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну цифру')
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы один специальный символ')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
```

## Авторизация

### Ролевая модель доступа

#### Определение ролей и разрешений
```python
# users/permissions.py
from rest_framework.permissions import BasePermission

class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.profile.role == 'admin'

class IsBrigadierOrAdmin(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        user_role = request.user.profile.role
        return user_role in ['admin', 'brigadier']

class ObjectScopePermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        user_role = request.user.profile.role
        
        # Admin и Director имеют доступ ко всем объектам
        if user_role in ['admin', 'director']:
            return True
        
        # Остальные роли ограничены назначенными объектами
        return True
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        user_role = request.user.profile.role
        
        # Admin и Director имеют доступ ко всем объектам
        if user_role in ['admin', 'director']:
            return True
        
        # Проверка доступа к конкретному объекту
        if hasattr(obj, 'object'):
            # Для закупок, списаний и т.д.
            return obj.object in request.user.profile.get_accessible_objects()
        elif hasattr(obj, 'assigned_objects'):
            # Для объектов
            return obj in request.user.profile.get_accessible_objects()
        
        return False
```

#### Применение разрешений в ViewSets
```python
# purchases/views.py
from rest_framework import viewsets, permissions
from .permissions import IsBrigadierOrAdmin, ObjectScopePermission

class PurchaseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsBrigadierOrAdmin, ObjectScopePermission]
    
    def get_queryset(self):
        user = self.request.user
        user_role = user.profile.role
        
        if user_role in ['admin', 'director']:
            return Purchase.objects.all()
        
        # Ограничение по назначенным объектам
        accessible_objects = user.profile.get_accessible_objects()
        return Purchase.objects.filter(object__in=accessible_objects)
    
    def perform_create(self, serializer):
        # Проверка, что ответственный - бригадир
        if self.request.user.profile.role != 'brigadier':
            raise PermissionDenied("Только бригадиры могут создавать закупки")
        
        serializer.save(responsible=self.request.user)
```

### Object-Scope ограничения

#### Реализация ограничений доступа
```python
# users/models.py
class EmployeeProfile(models.Model):
    def get_accessible_objects(self):
        """Получить объекты, к которым есть доступ"""
        if self.role in ("director", "admin", "coordinator"):
            # Полный доступ ко всем объектам
            from common.models import Object
            return Object.objects.filter(is_active=True)
        else:
            # Доступ только к закрепленным объектам
            return self.assigned_objects.filter(is_active=True)
    
    def can_access_object(self, obj):
        """Проверить доступ к конкретному объекту"""
        if self.role in ("director", "admin", "coordinator"):
            return True
        return obj in self.assigned_objects.filter(is_active=True)
```

#### Middleware для проверки доступа
```python
# common/middleware.py
from django.http import JsonResponse
from django.core.exceptions import PermissionDenied

class ObjectScopeMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        return response
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        # Проверка доступа к объектам для API запросов
        if request.path.startswith('/api/') and request.user.is_authenticated:
            # Логика проверки доступа к объектам
            pass
```

## Защита данных

### Шифрование чувствительных данных

#### Шифрование в базе данных
```python
# common/encryption.py
from cryptography.fernet import Fernet
from django.conf import settings
import base64

class EncryptionService:
    def __init__(self):
        self.key = settings.ENCRYPTION_KEY.encode()
        self.cipher = Fernet(self.key)
    
    def encrypt(self, data: str) -> str:
        """Шифрование данных"""
        if not data:
            return data
        
        encrypted = self.cipher.encrypt(data.encode())
        return base64.b64encode(encrypted).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """Расшифровка данных"""
        if not encrypted_data:
            return encrypted_data
        
        try:
            encrypted = base64.b64decode(encrypted_data.encode())
            decrypted = self.cipher.decrypt(encrypted)
            return decrypted.decode()
        except Exception:
            return encrypted_data  # Возвращаем исходные данные в случае ошибки

# Использование в моделях
class SensitiveDataModel(models.Model):
    encrypted_field = models.TextField()
    
    def set_encrypted_data(self, data):
        encryption_service = EncryptionService()
        self.encrypted_field = encryption_service.encrypt(data)
    
    def get_encrypted_data(self):
        encryption_service = EncryptionService()
        return encryption_service.decrypt(self.encrypted_field)
```

#### Хеширование паролей
```python
# settings.py
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    'django.contrib.auth.hashers.ScryptPasswordHasher',
]

# Дополнительные настройки для Argon2
ARGON2_DEFAULT_MEMORY_COST = 102400  # 100 MB
ARGON2_DEFAULT_TIME_COST = 2
ARGON2_DEFAULT_PARALLELISM = 8
```

### Защита от SQL инъекций

#### Использование Django ORM
```python
# Безопасные запросы
def get_user_purchases(user_id):
    # Использование параметризованных запросов
    return Purchase.objects.filter(responsible_id=user_id)

def search_materials(search_term):
    # Безопасный поиск
    return Material.objects.filter(name__icontains=search_term)

# Небезопасный код (НЕ ИСПОЛЬЗОВАТЬ)
def unsafe_query(user_input):
    # ОПАСНО! Уязвимо к SQL инъекциям
    return Purchase.objects.raw(f"SELECT * FROM purchases WHERE name = '{user_input}'")
```

#### Валидация входных данных
```python
# purchases/serializers.py
from rest_framework import serializers
from django.core.exceptions import ValidationError

class PurchaseSerializer(serializers.ModelSerializer):
    def validate_purchase_no(self, value):
        """Валидация номера закупки"""
        if not value:
            raise serializers.ValidationError("Номер закупки обязателен")
        
        # Проверка на SQL инъекции
        dangerous_chars = ["'", '"', ';', '--', '/*', '*/', 'xp_', 'sp_']
        if any(char in value.lower() for char in dangerous_chars):
            raise serializers.ValidationError("Недопустимые символы в номере закупки")
        
        return value
    
    def validate(self, data):
        """Общая валидация данных"""
        # Проверка бизнес-правил
        if data.get('status') == 'completed':
            if not self.instance or not self.instance.photos.filter(type='report').exists():
                raise serializers.ValidationError({
                    'status': 'При статусе "Выполнено" обязательны фото отчета'
                })
        
        return data
```

## Защита от XSS

### Backend защита

#### Экранирование HTML
```python
# common/utils.py
import html
from django.utils.safestring import mark_safe

def escape_html(text):
    """Экранирование HTML символов"""
    if not text:
        return text
    return html.escape(text)

def safe_html(text):
    """Безопасный HTML (только для доверенного контента)"""
    if not text:
        return text
    return mark_safe(html.escape(text))
```

#### Настройки безопасности
```python
# settings.py
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# CSP заголовки
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'")
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_IMG_SRC = ("'self'", "data:", "https:")
CSP_FONT_SRC = ("'self'",)
CSP_CONNECT_SRC = ("'self'",)
CSP_FRAME_ANCESTORS = ("'none'",)
```

### Frontend защита

#### Санитизация пользовательского ввода
```typescript
// src/utils/sanitization.ts
import DOMPurify from 'dompurify'

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  })
}

export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Vue директива для безопасного рендеринга
export const vSafeHtml = {
  mounted(el: HTMLElement, binding: any) {
    el.innerHTML = sanitizeHtml(binding.value)
  },
  updated(el: HTMLElement, binding: any) {
    el.innerHTML = sanitizeHtml(binding.value)
  }
}
```

#### Валидация на клиенте
```typescript
// src/utils/validation.ts
export function validateInput(input: string, type: 'text' | 'email' | 'number'): boolean {
  switch (type) {
    case 'text':
      // Проверка на XSS
      const xssPattern = /<script|javascript:|on\w+\s*=/i
      return !xssPattern.test(input)
    
    case 'email':
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailPattern.test(input)
    
    case 'number':
      return !isNaN(Number(input)) && isFinite(Number(input))
    
    default:
      return true
  }
}
```

## CSRF защита

### Backend настройки
```python
# settings.py
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'
CSRF_TRUSTED_ORIGINS = [
    'https://your-domain.com',
    'https://api.your-domain.com'
]

# Middleware
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    # ... другие middleware
]
```

### Frontend интеграция
```typescript
// src/api/client.ts
import axios from 'axios'

// Получение CSRF токена
const getCsrfToken = (): string | null => {
  const token = document.querySelector('[name=csrfmiddlewaretoken]') as HTMLInputElement
  return token ? token.value : null
}

// Добавление CSRF токена к запросам
axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'

// Interceptor для добавления CSRF токена
axios.interceptors.request.use((config) => {
  if (config.method === 'post' || config.method === 'put' || config.method === 'delete') {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken
    }
  }
  return config
})
```

## Защита от атак

### Rate Limiting

#### Backend ограничения
```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'login': '5/min',
        'password_reset': '3/min'
    }
}

# Кастомные throttling классы
from rest_framework.throttling import UserRateThrottle

class LoginRateThrottle(UserRateThrottle):
    scope = 'login'

class PasswordResetRateThrottle(UserRateThrottle):
    scope = 'password_reset'
```

#### Применение в ViewSets
```python
# users/views.py
from rest_framework.throttling import AnonRateThrottle

class LoginView(APIView):
    throttle_classes = [LoginRateThrottle]
    
    def post(self, request):
        # Логика аутентификации
        pass

class PasswordResetView(APIView):
    throttle_classes = [PasswordResetRateThrottle]
    
    def post(self, request):
        # Логика сброса пароля
        pass
```

### Защита от брутфорса

#### Middleware для отслеживания попыток
```python
# common/middleware.py
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

class BruteForceProtectionMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.path == '/api/v1/auth/token/':
            client_ip = self.get_client_ip(request)
            attempts_key = f'login_attempts_{client_ip}'
            
            attempts = cache.get(attempts_key, 0)
            if attempts >= 5:  # Максимум 5 попыток
                return JsonResponse({
                    'error': 'Слишком много попыток входа. Попробуйте позже.'
                }, status=429)
        
        return None
    
    def process_response(self, request, response):
        if (request.path == '/api/v1/auth/token/' and 
            response.status_code == 401):
            
            client_ip = self.get_client_ip(request)
            attempts_key = f'login_attempts_{client_ip}'
            
            attempts = cache.get(attempts_key, 0)
            cache.set(attempts_key, attempts + 1, 300)  # 5 минут
        
        return response
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
```

## Аудит и мониторинг

### Логирование безопасности

#### Настройка логирования
```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'security': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'security_file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/elom/security.log',
            'formatter': 'security',
        },
    },
    'loggers': {
        'security': {
            'handlers': ['security_file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

#### Аудит действий пользователей
```python
# common/audit.py
import logging
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()
security_logger = logging.getLogger('security')

class SecurityAudit:
    @staticmethod
    def log_login_success(user, ip_address):
        security_logger.info(f"Login success: user={user.username}, ip={ip_address}")
    
    @staticmethod
    def log_login_failure(username, ip_address, reason):
        security_logger.warning(f"Login failure: username={username}, ip={ip_address}, reason={reason}")
    
    @staticmethod
    def log_permission_denied(user, action, resource, ip_address):
        security_logger.warning(f"Permission denied: user={user.username}, action={action}, resource={resource}, ip={ip_address}")
    
    @staticmethod
    def log_sensitive_operation(user, operation, details, ip_address):
        security_logger.info(f"Sensitive operation: user={user.username}, operation={operation}, details={details}, ip={ip_address}")
    
    @staticmethod
    def log_data_access(user, model, object_id, action, ip_address):
        security_logger.info(f"Data access: user={user.username}, model={model}, object_id={object_id}, action={action}, ip={ip_address}")

# Использование в views
class PurchaseViewSet(viewsets.ModelViewSet):
    def perform_create(self, serializer):
        SecurityAudit.log_sensitive_operation(
            user=self.request.user,
            operation='purchase_create',
            details=f"Object: {serializer.validated_data.get('object')}",
            ip_address=self.get_client_ip()
        )
        serializer.save()
    
    def get_client_ip(self):
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = self.request.META.get('REMOTE_ADDR')
        return ip
```

### Мониторинг безопасности

#### Алерты безопасности
```python
# common/security_monitor.py
from django.core.mail import send_mail
from django.conf import settings
import requests

class SecurityMonitor:
    @staticmethod
    def send_security_alert(alert_type, details):
        """Отправка алерта о безопасности"""
        
        # Email уведомление
        send_mail(
            subject=f'ELOM Security Alert: {alert_type}',
            message=f'Security alert details:\n{details}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=settings.SECURITY_ALERT_EMAILS,
            fail_silently=False,
        )
        
        # Telegram уведомление
        if hasattr(settings, 'TELEGRAM_BOT_TOKEN'):
            message = f"🚨 Security Alert: {alert_type}\n\n{details}"
            requests.post(
                f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage",
                data={
                    'chat_id': settings.TELEGRAM_CHAT_ID,
                    'text': message
                }
            )
    
    @staticmethod
    def check_suspicious_activity(user, action, ip_address):
        """Проверка подозрительной активности"""
        suspicious_patterns = [
            'multiple_failed_logins',
            'unusual_data_access',
            'privilege_escalation_attempts'
        ]
        
        # Логика проверки подозрительной активности
        if action in suspicious_patterns:
            SecurityMonitor.send_security_alert(
                alert_type='Suspicious Activity',
                details=f"User: {user.username}, Action: {action}, IP: {ip_address}"
            )
```

## Безопасность API

### Валидация входных данных

#### Строгая валидация
```python
# purchases/serializers.py
from rest_framework import serializers
from django.core.validators import RegexValidator

class PurchaseSerializer(serializers.ModelSerializer):
    purchase_no = serializers.CharField(
        validators=[
            RegexValidator(
                regex=r'^[A-Z0-9\-_]+$',
                message='Номер закупки может содержать только заглавные буквы, цифры, дефисы и подчеркивания'
            )
        ]
    )
    
    def validate(self, data):
        """Дополнительная валидация"""
        # Проверка на SQL инъекции
        for field, value in data.items():
            if isinstance(value, str):
                dangerous_patterns = [
                    r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)",
                    r"(--|#|\/\*|\*\/)",
                    r"(\b(OR|AND)\s+\d+\s*=\s*\d+)",
                ]
                
                for pattern in dangerous_patterns:
                    if re.search(pattern, value, re.IGNORECASE):
                        raise serializers.ValidationError({
                            field: 'Обнаружены потенциально опасные символы'
                        })
        
        return data
```

### Защита от DoS атак

#### Ограничение размера запросов
```python
# settings.py
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024   # 5 MB
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000

# Middleware для ограничения размера
class RequestSizeLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        if request.method == 'POST':
            content_length = request.META.get('CONTENT_LENGTH')
            if content_length and int(content_length) > 10 * 1024 * 1024:  # 10 MB
                return JsonResponse({'error': 'Request too large'}, status=413)
        
        return self.get_response(request)
```

## Безопасность файлов

### Валидация загружаемых файлов

#### Проверка типов файлов
```python
# common/file_validation.py
import magic
from django.core.exceptions import ValidationError

class FileValidator:
    ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
    
    @classmethod
    def validate_image(cls, file):
        """Валидация изображений"""
        # Проверка размера
        if file.size > cls.MAX_FILE_SIZE:
            raise ValidationError(f'Размер файла не должен превышать {cls.MAX_FILE_SIZE // (1024*1024)} MB')
        
        # Проверка MIME типа
        file_type = magic.from_buffer(file.read(1024), mime=True)
        file.seek(0)  # Возврат к началу файла
        
        if file_type not in cls.ALLOWED_IMAGE_TYPES:
            raise ValidationError('Недопустимый тип файла. Разрешены только изображения.')
        
        return True
    
    @classmethod
    def validate_document(cls, file):
        """Валидация документов"""
        if file.size > cls.MAX_FILE_SIZE:
            raise ValidationError(f'Размер файла не должен превышать {cls.MAX_FILE_SIZE // (1024*1024)} MB')
        
        file_type = magic.from_buffer(file.read(1024), mime=True)
        file.seek(0)
        
        if file_type not in cls.ALLOWED_DOCUMENT_TYPES:
            raise ValidationError('Недопустимый тип файла. Разрешены только PDF и Word документы.')
        
        return True
```

#### Безопасное хранение файлов
```python
# settings.py
MEDIA_ROOT = '/var/www/elom/media/'
MEDIA_URL = '/media/'

# Настройки безопасности для файлов
FILE_UPLOAD_PERMISSIONS = 0o644
FILE_UPLOAD_DIRECTORY_PERMISSIONS = 0o755

# Ограничение доступа к медиа файлам
MEDIA_SERVE_SECURE = True
```

## Конфигурация безопасности

### Production настройки
```python
# settings/production.py
import os

# Базовые настройки безопасности
DEBUG = False
SECRET_KEY = os.environ.get('SECRET_KEY')

# HTTPS настройки
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# Cookie настройки
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'

# Дополнительные настройки
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
SECURE_CROSS_ORIGIN_OPENER_POLICY = 'same-origin'

# Настройки базы данных
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT'),
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}

# Настройки кэширования
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'ssl_cert_reqs': None,
            }
        }
    }
}
```

## Заключение

Система безопасности ELOM обеспечивает комплексную защиту на всех уровнях приложения. Многоуровневый подход включает аутентификацию, авторизацию, защиту данных, валидацию входных данных и мониторинг безопасности.

### Ключевые принципы безопасности:
1. **Defense in Depth**: Многоуровневая защита
2. **Least Privilege**: Минимальные необходимые права
3. **Zero Trust**: Проверка всех запросов
4. **Audit Everything**: Логирование всех действий
5. **Regular Updates**: Регулярные обновления безопасности

### Рекомендации по поддержанию безопасности:
1. Регулярно обновляйте зависимости
2. Мониторьте логи безопасности
3. Проводите регулярные аудиты
4. Обучайте пользователей основам безопасности
5. Тестируйте систему на уязвимости

