# Производительность ELOM

## Обзор производительности

ELOM спроектирован для обеспечения высокой производительности при работе с большими объемами данных. Система использует оптимизацию на уровне базы данных, кэширование, асинхронную обработку и оптимизацию фронтенда для обеспечения быстрого отклика.

## Оптимизация базы данных

### Индексы и запросы

#### Критические индексы
```python
# purchases/models.py
class Purchase(models.Model):
    # ... поля модели ...
    
    class Meta:
        indexes = [
            models.Index(fields=['object', 'status']),
            models.Index(fields=['responsible', 'created_at']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['object', 'responsible']),
        ]

# common/models.py
class Object(models.Model):
    # ... поля модели ...
    
    class Meta:
        indexes = [
            models.Index(fields=['is_active', 'created_at']),
            models.Index(fields=['responsible', 'is_active']),
        ]

# stock/models.py
class StockSnapshot(models.Model):
    # ... поля модели ...
    
    class Meta:
        indexes = [
            models.Index(fields=['material', 'object']),
            models.Index(fields=['object', 'material']),
            models.Index(fields=['created_at']),
            models.Index(fields=['material', 'created_at']),
        ]
        unique_together = [['material', 'object']]
```

#### Оптимизированные запросы
```python
# purchases/views.py
from django.db.models import Prefetch, F, Sum, Count
from django.db.models.functions import Coalesce

class PurchaseViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return Purchase.objects.select_related(
            'object',
            'responsible',
            'supplier'
        ).prefetch_related(
            Prefetch('items', queryset=PurchaseItem.objects.select_related('material')),
            'photos'
        ).annotate(
            total_items=Count('items'),
            total_amount_calculated=Sum('items__amount')
        )
    
    def list(self, request, *args, **kwargs):
        # Пагинация для больших списков
        page_size = min(int(request.query_params.get('page_size', 20)), 100)
        
        queryset = self.get_queryset()
        
        # Фильтрация с использованием индексов
        if 'object_id' in request.query_params:
            queryset = queryset.filter(object_id=request.query_params['object_id'])
        
        if 'status' in request.query_params:
            queryset = queryset.filter(status=request.query_params['status'])
        
        # Сортировка по индексированным полям
        queryset = queryset.order_by('-created_at')
        
        paginator = self.pagination_class(page_size=page_size)
        page = paginator.paginate_queryset(queryset, request)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
```

#### Агрегация данных
```python
# reports/views.py
from django.db.models import Sum, Count, Avg, F
from django.db.models.functions import TruncMonth, TruncYear

class PurchaseAnalyticsView(APIView):
    def get(self, request):
        # Агрегация по месяцам с использованием индексов
        monthly_stats = Purchase.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=365)
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            total_purchases=Count('id'),
            total_amount=Sum('total_amount'),
            avg_amount=Avg('total_amount')
        ).order_by('month')
        
        # Статистика по объектам
        object_stats = Purchase.objects.select_related('object').values(
            'object__name'
        ).annotate(
            purchase_count=Count('id'),
            total_amount=Sum('total_amount')
        ).order_by('-total_amount')[:10]
        
        return Response({
            'monthly_stats': monthly_stats,
            'top_objects': object_stats
        })
```

### Оптимизация запросов

#### Использование select_related и prefetch_related
```python
# Оптимизированные запросы для связанных объектов
def get_purchase_with_details(purchase_id):
    return Purchase.objects.select_related(
        'object',
        'responsible__profile',
        'supplier'
    ).prefetch_related(
        Prefetch(
            'items',
            queryset=PurchaseItem.objects.select_related('material__category')
        ),
        'photos'
    ).get(id=purchase_id)

# Батчевая загрузка для списков
def get_purchases_batch(purchase_ids):
    return Purchase.objects.select_related(
        'object', 'responsible', 'supplier'
    ).prefetch_related('items__material').filter(
        id__in=purchase_ids
    )
```

#### Избежание N+1 проблем
```python
# Плохой код (N+1 проблема)
def bad_get_purchases():
    purchases = Purchase.objects.all()
    for purchase in purchases:
        print(purchase.object.name)  # Дополнительный запрос для каждого объекта
        print(purchase.responsible.username)  # Еще один запрос

# Хороший код (оптимизированный)
def good_get_purchases():
    purchases = Purchase.objects.select_related('object', 'responsible').all()
    for purchase in purchases:
        print(purchase.object.name)  # Нет дополнительных запросов
        print(purchase.responsible.username)  # Нет дополнительных запросов
```

## Кэширование

### Redis кэширование

#### Настройка кэша
```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            }
        }
    }
}

# Настройки сессий
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'
SESSION_COOKIE_AGE = 3600  # 1 час
```

#### Кэширование запросов
```python
# common/cache.py
from django.core.cache import cache
from django.db.models import Q
import hashlib
import json

class QueryCache:
    @staticmethod
    def get_cache_key(model, filters=None, ordering=None):
        """Генерация ключа кэша для запроса"""
        key_data = {
            'model': model.__name__,
            'filters': filters or {},
            'ordering': ordering or []
        }
        key_string = json.dumps(key_data, sort_keys=True)
        return f"query_{hashlib.md5(key_string.encode()).hexdigest()}"
    
    @staticmethod
    def cache_queryset(queryset, timeout=300, filters=None, ordering=None):
        """Кэширование результата запроса"""
        cache_key = QueryCache.get_cache_key(
            queryset.model, filters, ordering
        )
        
        result = cache.get(cache_key)
        if result is None:
            result = list(queryset)
            cache.set(cache_key, result, timeout)
        
        return result

# Использование в views
class MaterialViewSet(viewsets.ModelViewSet):
    def list(self, request, *args, **kwargs):
        cache_key = f"materials_list_{request.query_params.get('page', 1)}"
        cached_result = cache.get(cache_key)
        
        if cached_result is None:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            cached_result = serializer.data
            cache.set(cache_key, cached_result, 300)  # 5 минут
        
        return Response(cached_result)
```

#### Кэширование агрегаций
```python
# reports/cache.py
from django.core.cache import cache
from django.db.models import Sum, Count

class ReportCache:
    @staticmethod
    def get_purchase_stats():
        cache_key = 'purchase_stats'
        stats = cache.get(cache_key)
        
        if stats is None:
            from purchases.models import Purchase
            stats = {
                'total_purchases': Purchase.objects.count(),
                'total_amount': Purchase.objects.aggregate(
                    total=Sum('total_amount')
                )['total'] or 0,
                'pending_purchases': Purchase.objects.filter(
                    status='new'
                ).count(),
            }
            cache.set(cache_key, stats, 600)  # 10 минут
        
        return stats
    
    @staticmethod
    def invalidate_purchase_cache():
        """Инвалидация кэша при изменении закупок"""
        cache.delete('purchase_stats')
        # Удаление связанных ключей кэша
        cache.delete_many([
            'materials_list_1',
            'materials_list_2',
            # ... другие ключи
        ])
```

### Кэширование на уровне модели

#### Сигналы для инвалидации кэша
```python
# purchases/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Purchase, PurchaseItem
from common.cache import ReportCache

@receiver(post_save, sender=Purchase)
def invalidate_purchase_cache(sender, instance, **kwargs):
    """Инвалидация кэша при изменении закупки"""
    ReportCache.invalidate_purchase_cache()
    
    # Инвалидация кэша конкретного объекта
    cache.delete(f"object_purchases_{instance.object_id}")

@receiver(post_delete, sender=Purchase)
def invalidate_purchase_cache_on_delete(sender, instance, **kwargs):
    """Инвалидация кэша при удалении закупки"""
    ReportCache.invalidate_purchase_cache()
    cache.delete(f"object_purchases_{instance.object_id}")

@receiver(post_save, sender=PurchaseItem)
@receiver(post_delete, sender=PurchaseItem)
def invalidate_purchase_item_cache(sender, instance, **kwargs):
    """Инвалидация кэша при изменении позиций закупки"""
    if instance.purchase:
        cache.delete(f"purchase_details_{instance.purchase_id}")
```

## Асинхронная обработка

### Celery задачи

#### Настройка Celery
```python
# elom/celery.py
from celery import Celery
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'elom.settings')

app = Celery('elom')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Настройки производительности
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 минут
    task_soft_time_limit=25 * 60,  # 25 минут
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)
```

#### Асинхронные задачи
```python
# purchases/tasks.py
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import requests

@shared_task(bind=True, max_retries=3)
def send_purchase_notification(self, purchase_id):
    """Асинхронная отправка уведомлений о закупке"""
    try:
        from .models import Purchase
        from .telegram_service import TelegramNotificationService
        
        purchase = Purchase.objects.get(id=purchase_id)
        service = TelegramNotificationService()
        
        # Отправка в Telegram
        service.send_purchase_notification(purchase)
        
        # Отправка email
        send_mail(
            subject=f'Новая закупка #{purchase.purchase_no}',
            message=f'Создана новая закупка для объекта {purchase.object.name}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[purchase.responsible.email],
            fail_silently=False,
        )
        
    except Exception as exc:
        # Повторная попытка при ошибке
        raise self.retry(exc=exc, countdown=60)

@shared_task
def generate_purchase_report(purchase_ids, user_id):
    """Асинхронная генерация отчетов"""
    try:
        from .models import Purchase
        from .reports import PurchaseReportGenerator
        
        purchases = Purchase.objects.filter(id__in=purchase_ids)
        generator = PurchaseReportGenerator()
        
        report_data = generator.generate_excel_report(purchases)
        
        # Сохранение отчета
        from django.core.files.base import ContentFile
        from common.models import ReportFile
        
        report_file = ReportFile.objects.create(
            user_id=user_id,
            file_type='purchase_report',
            file=ContentFile(report_data, name=f'purchase_report_{timezone.now().strftime("%Y%m%d_%H%M%S")}.xlsx')
        )
        
        return report_file.id
        
    except Exception as exc:
        # Логирование ошибки
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error generating report: {exc}")
        raise exc

@shared_task
def cleanup_old_files():
    """Очистка старых файлов"""
    from django.utils import timezone
    from datetime import timedelta
    from common.models import ReportFile
    
    cutoff_date = timezone.now() - timedelta(days=30)
    old_files = ReportFile.objects.filter(created_at__lt=cutoff_date)
    
    for file_obj in old_files:
        if file_obj.file:
            file_obj.file.delete()
        file_obj.delete()
    
    return f"Cleaned up {old_files.count()} old files"
```

#### Использование задач в views
```python
# purchases/views.py
from .tasks import send_purchase_notification, generate_purchase_report

class PurchaseViewSet(viewsets.ModelViewSet):
    def perform_create(self, serializer):
        purchase = serializer.save()
        
        # Асинхронная отправка уведомлений
        send_purchase_notification.delay(purchase.id)
    
    @action(detail=False, methods=['post'])
    def generate_report(self, request):
        purchase_ids = request.data.get('purchase_ids', [])
        user_id = request.user.id
        
        # Асинхронная генерация отчета
        task = generate_purchase_report.delay(purchase_ids, user_id)
        
        return Response({
            'task_id': task.id,
            'status': 'started'
        })
```

## Оптимизация фронтенда

### Vue.js оптимизация

#### Ленивая загрузка компонентов
```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/purchases',
      name: 'Purchases',
      component: () => import('../pages/Purchases/List.vue')
    },
    {
      path: '/materials',
      name: 'Materials',
      component: () => import('../pages/Materials/List.vue')
    },
    {
      path: '/reports',
      name: 'Reports',
      component: () => import('../pages/Reports/Index.vue')
    }
  ]
})

export default router
```

#### Виртуализация списков
```vue
<!-- src/components/VirtualList.vue -->
<template>
  <div class="virtual-list" ref="container" @scroll="handleScroll">
    <div :style="{ height: totalHeight + 'px' }" class="virtual-list-spacer">
      <div 
        v-for="item in visibleItems" 
        :key="item.id"
        :style="{ 
          position: 'absolute', 
          top: item.top + 'px',
          width: '100%'
        }"
        class="virtual-list-item"
      >
        <slot :item="item.data" :index="item.index"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  items: any[]
  itemHeight: number
  containerHeight: number
}

const props = defineProps<Props>()

const container = ref<HTMLElement>()
const scrollTop = ref(0)

const totalHeight = computed(() => props.items.length * props.itemHeight)

const visibleStart = computed(() => 
  Math.floor(scrollTop.value / props.itemHeight)
)

const visibleEnd = computed(() => 
  Math.min(
    visibleStart.value + Math.ceil(props.containerHeight / props.itemHeight) + 1,
    props.items.length
  )
)

const visibleItems = computed(() => {
  const items = []
  for (let i = visibleStart.value; i < visibleEnd.value; i++) {
    items.push({
      id: props.items[i].id,
      data: props.items[i],
      index: i,
      top: i * props.itemHeight
    })
  }
  return items
})

const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
}

onMounted(() => {
  if (container.value) {
    container.value.style.height = props.containerHeight + 'px'
    container.value.style.overflow = 'auto'
  }
})
</script>
```

#### Мемоизация вычислений
```typescript
// src/composables/useMemo.ts
import { ref, computed, watchEffect } from 'vue'

export function useMemo<T>(fn: () => T, deps: any[]): { value: T } {
  const result = ref<T>()
  const lastDeps = ref<any[]>([])
  
  const update = () => {
    const hasChanged = deps.some((dep, index) => dep !== lastDeps.value[index])
    if (hasChanged) {
      result.value = fn()
      lastDeps.value = [...deps]
    }
  }
  
  watchEffect(update)
  
  return result as { value: T }
}

// Использование
export function useExpensiveCalculation(data: any[]) {
  return useMemo(() => {
    // Дорогие вычисления
    return data.reduce((acc, item) => {
      // Сложная логика обработки
      return acc + item.value * item.multiplier
    }, 0)
  }, [data])
}
```

### Оптимизация API запросов

#### Дебаунсинг поиска
```typescript
// src/composables/useDebounce.ts
import { ref, watch } from 'vue'

export function useDebounce<T>(value: T, delay: number) {
  const debouncedValue = ref(value)
  
  watch(value, (newValue) => {
    const timer = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
    
    return () => clearTimeout(timer)
  })
  
  return debouncedValue
}

// Использование в компонентах
export function useSearch() {
  const searchQuery = ref('')
  const debouncedQuery = useDebounce(searchQuery, 300)
  
  const { data: searchResults, loading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => api.search(debouncedQuery.value),
    enabled: computed(() => debouncedQuery.value.length > 2)
  })
  
  return {
    searchQuery,
    searchResults,
    loading
  }
}
```

#### Кэширование запросов
```typescript
// src/api/client.ts
import axios from 'axios'
import { setupCache } from 'axios-cache-adapter'

const cache = setupCache({
  maxAge: 5 * 60 * 1000, // 5 минут
  exclude: {
    query: false,
    methods: ['post', 'put', 'delete']
  }
})

const api = axios.create({
  adapter: cache.adapter
})

// Настройка кэширования для разных типов запросов
export const apiClient = {
  // Кэшируемые GET запросы
  get: (url: string, config?: any) => api.get(url, config),
  
  // Некэшируемые запросы
  post: (url: string, data?: any, config?: any) => api.post(url, data, config),
  put: (url: string, data?: any, config?: any) => api.put(url, data, config),
  delete: (url: string, config?: any) => api.delete(url, config),
  
  // Очистка кэша
  clearCache: (pattern?: string) => {
    if (pattern) {
      cache.store.removeItem(pattern)
    } else {
      cache.store.clear()
    }
  }
}
```

#### Пагинация и бесконечная прокрутка
```typescript
// src/composables/useInfiniteScroll.ts
import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useInfiniteScroll<T>(
  fetchFn: (page: number) => Promise<{ data: T[], hasMore: boolean }>
) {
  const items = ref<T[]>([])
  const loading = ref(false)
  const hasMore = ref(true)
  const page = ref(1)
  
  const loadMore = async () => {
    if (loading.value || !hasMore.value) return
    
    loading.value = true
    try {
      const result = await fetchFn(page.value)
      items.value.push(...result.data)
      hasMore.value = result.hasMore
      page.value++
    } catch (error) {
      console.error('Error loading more items:', error)
    } finally {
      loading.value = false
    }
  }
  
  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadMore()
    }
  }
  
  onMounted(() => {
    window.addEventListener('scroll', handleScroll)
    loadMore() // Загрузка первой страницы
  })
  
  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })
  
  return {
    items,
    loading,
    hasMore,
    loadMore
  }
}
```

## Оптимизация изображений

### Сжатие и ресайзинг

#### Backend обработка изображений
```python
# common/image_processing.py
from PIL import Image
import io
from django.core.files.uploadedfile import InMemoryUploadedFile

class ImageProcessor:
    MAX_SIZE = (1920, 1080)
    THUMBNAIL_SIZE = (300, 300)
    QUALITY = 85
    
    @classmethod
    def process_image(cls, image_file):
        """Обработка загруженного изображения"""
        image = Image.open(image_file)
        
        # Конвертация в RGB если необходимо
        if image.mode in ('RGBA', 'LA', 'P'):
            image = image.convert('RGB')
        
        # Ресайзинг если изображение слишком большое
        if image.size[0] > cls.MAX_SIZE[0] or image.size[1] > cls.MAX_SIZE[1]:
            image.thumbnail(cls.MAX_SIZE, Image.Resampling.LANCZOS)
        
        # Сохранение в память
        output = io.BytesIO()
        image.save(output, format='JPEG', quality=cls.QUALITY, optimize=True)
        output.seek(0)
        
        return InMemoryUploadedFile(
            output,
            'ImageField',
            image_file.name,
            'image/jpeg',
            output.tell(),
            None
        )
    
    @classmethod
    def create_thumbnail(cls, image_file):
        """Создание миниатюры"""
        image = Image.open(image_file)
        
        if image.mode in ('RGBA', 'LA', 'P'):
            image = image.convert('RGB')
        
        image.thumbnail(cls.THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
        
        output = io.BytesIO()
        image.save(output, format='JPEG', quality=cls.QUALITY, optimize=True)
        output.seek(0)
        
        return InMemoryUploadedFile(
            output,
            'ImageField',
            f"thumb_{image_file.name}",
            'image/jpeg',
            output.tell(),
            None
        )
```

#### Frontend оптимизация изображений
```vue
<!-- src/components/OptimizedImage.vue -->
<template>
  <div class="optimized-image" :style="{ width, height }">
    <img
      v-if="!loading && !error"
      :src="optimizedSrc"
      :alt="alt"
      :style="{ width: '100%', height: '100%', objectFit: 'cover' }"
      @load="onLoad"
      @error="onError"
    />
    <div v-if="loading" class="image-placeholder">
      <div class="spinner"></div>
    </div>
    <div v-if="error" class="image-error">
      <span>Ошибка загрузки изображения</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  src: string
  alt: string
  width?: string
  height?: string
  lazy?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '200px',
  lazy: true
})

const loading = ref(true)
const error = ref(false)

const optimizedSrc = computed(() => {
  if (!props.src) return ''
  
  // Добавление параметров оптимизации
  const url = new URL(props.src)
  url.searchParams.set('w', '800') // Максимальная ширина
  url.searchParams.set('q', '85')  // Качество
  url.searchParams.set('f', 'webp') // Формат
  
  return url.toString()
})

const onLoad = () => {
  loading.value = false
  error.value = false
}

const onError = () => {
  loading.value = false
  error.value = true
}

// Ленивая загрузка
const observer = ref<IntersectionObserver>()

onMounted(() => {
  if (props.lazy) {
    observer.value = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loading.value = false
          observer.value?.disconnect()
        }
      })
    })
    
    observer.value.observe(document.querySelector('.optimized-image')!)
  }
})

onUnmounted(() => {
  observer.value?.disconnect()
})
</script>

<style scoped>
.optimized-image {
  position: relative;
  overflow: hidden;
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  width: 100%;
  height: 100%;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fef2f2;
  color: #dc2626;
  width: 100%;
  height: 100%;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
```

## Мониторинг производительности

### Метрики и мониторинг

#### Backend метрики
```python
# common/middleware.py
import time
import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('performance')

class PerformanceMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.start_time = time.time()
    
    def process_response(self, request, response):
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            
            # Логирование медленных запросов
            if duration > 1.0:  # Запросы дольше 1 секунды
                logger.warning(f"Slow request: {request.path} took {duration:.2f}s")
            
            # Добавление заголовка с временем выполнения
            response['X-Response-Time'] = f"{duration:.3f}s"
        
        return response
```

#### Frontend метрики
```typescript
// src/utils/performance.ts
export class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map()
  
  static startTiming(name: string): void {
    this.metrics.set(name, performance.now())
  }
  
  static endTiming(name: string): number {
    const startTime = this.metrics.get(name)
    if (!startTime) return 0
    
    const duration = performance.now() - startTime
    this.metrics.delete(name)
    
    // Логирование медленных операций
    if (duration > 100) { // Операции дольше 100ms
      console.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`)
    }
    
    return duration
  }
  
  static measurePageLoad(): void {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      const metrics = {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart
      }
      
      console.log('Page load metrics:', metrics)
      
      // Отправка метрик на сервер
      this.sendMetrics('page_load', metrics)
    })
  }
  
  private static sendMetrics(type: string, data: any): void {
    // Отправка метрик на сервер для анализа
    fetch('/api/metrics/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, data })
    }).catch(console.error)
  }
}

// Использование в компонентах
export function usePerformanceTracking(componentName: string) {
  onMounted(() => {
    PerformanceMonitor.startTiming(`${componentName}_mount`)
  })
  
  onUnmounted(() => {
    PerformanceMonitor.endTiming(`${componentName}_mount`)
  })
}
```

### Профилирование

#### Django Debug Toolbar
```python
# settings/development.py
if DEBUG:
    INSTALLED_APPS += [
        'debug_toolbar',
    ]
    
    MIDDLEWARE += [
        'debug_toolbar.middleware.DebugToolbarMiddleware',
    ]
    
    INTERNAL_IPS = [
        '127.0.0.1',
    ]
    
    DEBUG_TOOLBAR_CONFIG = {
        'SHOW_TEMPLATE_CONTEXT': True,
        'SHOW_TOOLBAR_CALLBACK': lambda request: DEBUG,
    }
```

#### Профилирование запросов
```python
# common/profiling.py
import cProfile
import pstats
from io import StringIO
from django.conf import settings

class QueryProfiler:
    def __init__(self):
        self.profiler = None
        self.stats = None
    
    def start(self):
        if settings.DEBUG:
            self.profiler = cProfile.Profile()
            self.profiler.enable()
    
    def stop(self):
        if self.profiler:
            self.profiler.disable()
            s = StringIO()
            self.stats = pstats.Stats(self.profiler, stream=s)
            self.stats.sort_stats('cumulative')
            self.stats.print_stats(20)  # Топ 20 функций
            return s.getvalue()
        return None

# Использование в views
class PurchaseViewSet(viewsets.ModelViewSet):
    def list(self, request, *args, **kwargs):
        profiler = QueryProfiler()
        profiler.start()
        
        try:
            response = super().list(request, *args, **kwargs)
            return response
        finally:
            profile_output = profiler.stop()
            if profile_output:
                logger.info(f"Purchase list profiling:\n{profile_output}")
```

## Оптимизация базы данных

### Партиционирование

#### Партиционирование по датам
```python
# stock/models.py
from django.db import models
from django.db.models import Q

class StockSnapshot(models.Model):
    # ... поля модели ...
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['created_at', 'material']),
        ]
    
    @classmethod
    def get_partitioned_queryset(cls, start_date, end_date):
        """Получение данных из определенной партиции"""
        return cls.objects.filter(
            created_at__gte=start_date,
            created_at__lt=end_date
        )

# Миграция для создания партиций
# migrations/0001_create_partitions.py
from django.db import migrations, connection

def create_partitions(apps, schema_editor):
    with connection.cursor() as cursor:
        # Создание партиций по месяцам
        for year in range(2023, 2025):
            for month in range(1, 13):
                partition_name = f"stock_snapshot_{year}_{month:02d}"
                cursor.execute(f"""
                    CREATE TABLE IF NOT EXISTS {partition_name} 
                    PARTITION OF stock_snapshot
                    FOR VALUES FROM ('{year}-{month:02d}-01') 
                    TO ('{year}-{month+1:02d}-01')
                """)

class Migration(migrations.Migration):
    dependencies = [
        ('stock', '0001_initial'),
    ]
    
    operations = [
        migrations.RunPython(create_partitions),
    ]
```

### Оптимизация индексов

#### Анализ использования индексов
```python
# management/commands/analyze_indexes.py
from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Анализ использования индексов'
    
    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Анализ использования индексов
            cursor.execute("""
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    idx_scan,
                    idx_tup_read,
                    idx_tup_fetch
                FROM pg_stat_user_indexes
                WHERE schemaname = 'public'
                ORDER BY idx_scan DESC;
            """)
            
            results = cursor.fetchall()
            
            self.stdout.write("Индексы по частоте использования:")
            for row in results:
                self.stdout.write(f"{row[2]}: {row[3]} scans, {row[4]} tuples read")
            
            # Поиск неиспользуемых индексов
            cursor.execute("""
                SELECT 
                    schemaname,
                    tablename,
                    indexname
                FROM pg_stat_user_indexes
                WHERE schemaname = 'public'
                AND idx_scan = 0
                AND indexname NOT LIKE '%_pkey';
            """)
            
            unused = cursor.fetchall()
            
            if unused:
                self.stdout.write("\nНеиспользуемые индексы:")
                for row in unused:
                    self.stdout.write(f"{row[1]}.{row[2]}")
```

## Заключение

Система ELOM оптимизирована для обеспечения высокой производительности на всех уровнях. Ключевые принципы оптимизации:

### Backend оптимизация:
1. **Индексы базы данных** - оптимизированные запросы
2. **Кэширование** - Redis для часто используемых данных
3. **Асинхронная обработка** - Celery для фоновых задач
4. **Оптимизация запросов** - select_related, prefetch_related

### Frontend оптимизация:
1. **Ленивая загрузка** - компоненты загружаются по требованию
2. **Виртуализация** - эффективная работа с большими списками
3. **Кэширование** - axios-cache-adapter для API запросов
4. **Дебаунсинг** - оптимизация поиска и фильтрации

### Мониторинг:
1. **Метрики производительности** - отслеживание медленных операций
2. **Профилирование** - анализ узких мест
3. **Анализ индексов** - оптимизация базы данных

### Рекомендации по поддержанию производительности:
1. Регулярно анализируйте медленные запросы
2. Мониторьте использование индексов
3. Оптимизируйте изображения и медиа файлы
4. Используйте кэширование для статических данных
5. Профилируйте код в production-подобной среде

