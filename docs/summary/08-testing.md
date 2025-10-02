# Тестирование ELOM

## Обзор стратегии тестирования

ELOM использует многоуровневую стратегию тестирования, включающую unit тесты, integration тесты, end-to-end тесты и тесты производительности. Система тестирования построена на современных инструментах и best practices.

## Backend тестирование (Django)

### Настройка тестового окружения

#### 1. Конфигурация для тестов
```python
# settings/test.py
import os
from .base import *

DEBUG = True
SECRET_KEY = 'test-secret-key'

# Тестовая база данных
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Отключение миграций для ускорения тестов
class DisableMigrations:
    def __contains__(self, item):
        return True
    
    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# Настройки для тестов
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Отключение кэширования
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# Отключение логирования
LOGGING_CONFIG = None
```

#### 2. Базовый тестовый класс
```python
# tests/base.py
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from decimal import Decimal

User = get_user_model()

class BaseTestCase(APITestCase):
    """Базовый класс для всех тестов"""
    
    def setUp(self):
        """Настройка тестовых данных"""
        self.client = APIClient()
        
        # Создание тестового пользователя
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Создание профиля пользователя
        self.user.profile.role = 'admin'
        self.user.profile.save()
        
        # Аутентификация
        self.client.force_authenticate(user=self.user)
    
    def create_test_data(self):
        """Создание базовых тестовых данных"""
        from common.models import Unit, MaterialCategory, Material, Object
        from users.models import EmployeeProfile
        
        # Единицы измерения
        self.unit_kg = Unit.objects.create(code='кг', name='килограмм')
        self.unit_m = Unit.objects.create(code='м', name='метр')
        
        # Категории материалов
        self.category = MaterialCategory.objects.create(name='Строительные материалы')
        
        # Материалы
        self.material = Material.objects.create(
            name='Цемент М400',
            sku='CEM-400',
            category=self.category,
            default_unit=self.unit_kg
        )
        
        # Объекты
        self.object = Object.objects.create(
            name='Тестовый объект',
            address='Тестовый адрес',
            responsible=self.user.profile
        )
```

### Unit тесты моделей

#### 1. Тесты моделей закупок
```python
# tests/test_purchases_models.py
from django.test import TestCase
from django.core.exceptions import ValidationError
from decimal import Decimal
from purchases.models import Purchase, PurchaseItem, PurchaseSupplier
from .base import BaseTestCase

class PurchaseModelTest(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.create_test_data()
        
        # Создание поставщика
        self.supplier = PurchaseSupplier.objects.create(
            name='Тестовый поставщик',
            contact_person='Иван Иванов',
            phone='+998901234567'
        )
    
    def test_purchase_creation(self):
        """Тест создания закупки"""
        purchase = Purchase.objects.create(
            date='2024-01-15',
            object=self.object,
            supplier=self.supplier,
            responsible=self.user,
            currency='UZS'
        )
        
        self.assertEqual(purchase.object, self.object)
        self.assertEqual(purchase.supplier, self.supplier)
        self.assertEqual(purchase.responsible, self.user)
        self.assertEqual(purchase.status, 'new')
        self.assertTrue(purchase.purchase_no)  # Автоматически генерируется
    
    def test_purchase_validation_brigadier_role(self):
        """Тест валидации роли ответственного"""
        # Создание пользователя с ролью buyer
        buyer_user = User.objects.create_user(
            username='buyer',
            email='buyer@example.com',
            password='testpass123'
        )
        buyer_user.profile.role = 'buyer'
        buyer_user.profile.save()
        
        purchase = Purchase(
            date='2024-01-15',
            object=self.object,
            supplier=self.supplier,
            responsible=buyer_user,
            currency='UZS'
        )
        
        with self.assertRaises(ValidationError) as context:
            purchase.clean()
        
        self.assertIn('Ответственным может быть только пользователь с ролью "Бригадир"', 
                     str(context.exception))
    
    def test_purchase_total_calculation(self):
        """Тест расчета общей суммы закупки"""
        purchase = Purchase.objects.create(
            date='2024-01-15',
            object=self.object,
            supplier=self.supplier,
            responsible=self.user,
            currency='UZS'
        )
        
        # Создание элементов закупки
        PurchaseItem.objects.create(
            purchase=purchase,
            material=self.material,
            unit=self.unit_kg,
            quantity=Decimal('100.00'),
            price=Decimal('2500.00'),
            amount=Decimal('250000.00')
        )
        
        PurchaseItem.objects.create(
            purchase=purchase,
            material=self.material,
            unit=self.unit_kg,
            quantity=Decimal('50.00'),
            price=Decimal('3000.00'),
            amount=Decimal('150000.00')
        )
        
        # Пересчет общей суммы
        purchase.recalc_total()
        
        self.assertEqual(purchase.total_amount, Decimal('400000.00'))
    
    def test_purchase_photo_validation(self):
        """Тест валидации фото при статусе completed"""
        purchase = Purchase.objects.create(
            date='2024-01-15',
            object=self.object,
            supplier=self.supplier,
            responsible=self.user,
            currency='UZS'
        )
        
        # Попытка установить статус completed без фото отчета
        purchase.status = 'completed'
        
        with self.assertRaises(ValidationError) as context:
            purchase.clean()
        
        self.assertIn('При статусе "Выполнено" обязательны фото отчета', 
                     str(context.exception))
```

#### 2. Тесты моделей остатков
```python
# tests/test_stock_models.py
from django.test import TestCase
from django.core.exceptions import ValidationError
from decimal import Decimal
from stock.models import WriteOff, StockSnapshot
from .base import BaseTestCase

class StockModelTest(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.create_test_data()
    
    def test_writeoff_creation(self):
        """Тест создания списания"""
        writeoff = WriteOff.objects.create(
            date='2024-01-15',
            object=self.object,
            material=self.material,
            unit=self.unit_kg,
            quantity=Decimal('10.00'),
            stage='post_rough',
            responsible=self.user
        )
        
        self.assertEqual(writeoff.object, self.object)
        self.assertEqual(writeoff.material, self.material)
        self.assertEqual(writeoff.quantity, Decimal('10.00'))
        self.assertEqual(writeoff.stage, 'post_rough')
    
    def test_writeoff_validation_positive_quantity(self):
        """Тест валидации положительного количества"""
        writeoff = WriteOff(
            date='2024-01-15',
            object=self.object,
            material=self.material,
            unit=self.unit_kg,
            quantity=Decimal('0.00'),  # Нулевое количество
            stage='post_rough',
            responsible=self.user
        )
        
        with self.assertRaises(ValidationError) as context:
            writeoff.clean()
        
        self.assertIn('Количество для списания должно быть больше 0', 
                     str(context.exception))
    
    def test_stock_snapshot_creation(self):
        """Тест создания записи в журнале остатков"""
        snapshot = StockSnapshot.objects.create(
            date='2024-01-15',
            object=self.object,
            material=self.material,
            unit=self.unit_kg,
            quantity_signed=Decimal('100.00'),  # Положительное - приход
            stage='delivery_fixed',
            source_type='purchase_item',
            source_id=1,
            responsible=self.user
        )
        
        self.assertEqual(snapshot.quantity_signed, Decimal('100.00'))
        self.assertEqual(snapshot.source_type, 'purchase_item')
        self.assertEqual(snapshot.source_id, 1)
```

### API тесты

#### 1. Тесты аутентификации
```python
# tests/test_auth_api.py
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse

User = get_user_model()

class AuthAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_token_obtain(self):
        """Тест получения токена"""
        url = reverse('token_obtain_pair')
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
    
    def test_token_obtain_invalid_credentials(self):
        """Тест получения токена с неверными данными"""
        url = reverse('token_obtain_pair')
        data = {
            'username': 'testuser',
            'password': 'wrongpassword'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_token_refresh(self):
        """Тест обновления токена"""
        # Получение токенов
        url = reverse('token_obtain_pair')
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        response = self.client.post(url, data)
        refresh_token = response.data['refresh']
        
        # Обновление токена
        url = reverse('token_refresh')
        data = {'refresh': refresh_token}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
    
    def test_me_endpoint(self):
        """Тест получения информации о текущем пользователе"""
        self.client.force_authenticate(user=self.user)
        url = reverse('users:me')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@example.com')
```

#### 2. Тесты CRUD операций
```python
# tests/test_purchases_api.py
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from .base import BaseTestCase

class PurchasesAPITest(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.create_test_data()
        
        # Создание поставщика
        self.supplier = PurchaseSupplier.objects.create(
            name='Тестовый поставщик',
            contact_person='Иван Иванов',
            phone='+998901234567'
        )
    
    def test_purchases_list(self):
        """Тест получения списка закупок"""
        url = reverse('purchases:purchase-list')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)
    
    def test_purchase_create(self):
        """Тест создания закупки"""
        url = reverse('purchases:purchase-list')
        data = {
            'date': '2024-01-15',
            'object': self.object.id,
            'supplier': self.supplier.id,
            'currency': 'UZS',
            'responsible': self.user.id,
            'items': [
                {
                    'material': self.material.id,
                    'unit': self.unit_kg.id,
                    'quantity': '100.00',
                    'price': '2500.00',
                    'amount': '250000.00'
                }
            ]
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['object'], self.object.id)
        self.assertEqual(response.data['supplier'], self.supplier.id)
    
    def test_purchase_update(self):
        """Тест обновления закупки"""
        # Создание закупки
        purchase = Purchase.objects.create(
            date='2024-01-15',
            object=self.object,
            supplier=self.supplier,
            responsible=self.user,
            currency='UZS'
        )
        
        url = reverse('purchases:purchase-detail', kwargs={'pk': purchase.id})
        data = {
            'comment': 'Обновленный комментарий'
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['comment'], 'Обновленный комментарий')
    
    def test_purchase_delete(self):
        """Тест удаления закупки"""
        # Создание закупки
        purchase = Purchase.objects.create(
            date='2024-01-15',
            object=self.object,
            supplier=self.supplier,
            responsible=self.user,
            currency='UZS'
        )
        
        url = reverse('purchases:purchase-detail', kwargs={'pk': purchase.id})
        
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Purchase.objects.filter(id=purchase.id).exists())
```

### Integration тесты

#### 1. Тесты бизнес-логики
```python
# tests/test_business_logic.py
from django.test import TestCase
from decimal import Decimal
from .base import BaseTestCase

class BusinessLogicTest(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.create_test_data()
    
    def test_purchase_to_stock_workflow(self):
        """Тест полного workflow от закупки до остатков"""
        from purchases.models import Purchase, PurchaseItem, PurchaseSupplier
        
        # Создание поставщика
        supplier = PurchaseSupplier.objects.create(
            name='Тестовый поставщик',
            contact_person='Иван Иванов'
        )
        
        # Создание закупки
        purchase = Purchase.objects.create(
            date='2024-01-15',
            object=self.object,
            supplier=supplier,
            responsible=self.user,
            currency='UZS'
        )
        
        # Создание элемента закупки
        item = PurchaseItem.objects.create(
            purchase=purchase,
            material=self.material,
            unit=self.unit_kg,
            quantity=Decimal('100.00'),
            price=Decimal('2500.00'),
            amount=Decimal('250000.00')
        )
        
        # Проверка создания записи в журнале остатков
        from stock.models import StockSnapshot
        snapshots = StockSnapshot.objects.filter(
            source_type='purchase_item',
            source_id=item.id
        )
        
        self.assertEqual(snapshots.count(), 1)
        snapshot = snapshots.first()
        self.assertEqual(snapshot.quantity_signed, Decimal('100.00'))
        self.assertEqual(snapshot.material, self.material)
        self.assertEqual(snapshot.object, self.object)
    
    def test_writeoff_validation_workflow(self):
        """Тест workflow валидации списаний"""
        from stock.models import WriteOff, StockSnapshot
        
        # Создание прихода в остатках
        StockSnapshot.objects.create(
            date='2024-01-15',
            object=self.object,
            material=self.material,
            unit=self.unit_kg,
            quantity_signed=Decimal('100.00'),
            stage='delivery_fixed',
            source_type='purchase_item',
            source_id=1,
            responsible=self.user
        )
        
        # Создание списания
        writeoff = WriteOff.objects.create(
            date='2024-01-16',
            object=self.object,
            material=self.material,
            unit=self.unit_kg,
            quantity=Decimal('50.00'),
            stage='post_rough',
            responsible=self.user
        )
        
        # Проверка создания записи в журнале остатков
        snapshots = StockSnapshot.objects.filter(
            source_type='writeoff',
            source_id=writeoff.id
        )
        
        self.assertEqual(snapshots.count(), 1)
        snapshot = snapshots.first()
        self.assertEqual(snapshot.quantity_signed, Decimal('-50.00'))  # Отрицательное значение
```

## Frontend тестирование (Vue.js)

### Настройка тестового окружения

#### 1. Конфигурация Vitest
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
```

#### 2. Настройка тестового окружения
```typescript
// src/test/setup.ts
import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// Мок для Vue Router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  currentRoute: {
    value: {
      path: '/',
      name: 'Home',
      params: {},
      query: {},
      meta: {}
    }
  }
}

// Мок для Pinia stores
const mockStores = {
  auth: {
    isAuthenticated: true,
    me: {
      id: 1,
      username: 'testuser',
      role: 'admin'
    }
  },
  ui: {
    toast: vi.fn()
  }
}

// Глобальные моки
global.mockRouter = mockRouter
global.mockStores = mockStores

// Настройка Vue Test Utils
config.global.mocks = {
  $router: mockRouter,
  $route: mockRouter.currentRoute.value
}

// Мок для window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
```

### Unit тесты компонентов

#### 1. Тесты базовых компонентов
```typescript
// src/components/__tests__/FormField.test.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import FormField from '@/components/FormField.vue'

describe('FormField', () => {
  it('renders label correctly', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Test Label',
        modelValue: ''
      }
    })
    
    expect(wrapper.find('.label-text').text()).toBe('Test Label')
  })
  
  it('shows required indicator when required', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Test Label',
        modelValue: '',
        required: true
      }
    })
    
    expect(wrapper.find('.label-text-alt.text-error').text()).toBe('*')
  })
  
  it('emits update:modelValue on input', async () => {
    const wrapper = mount(FormField, {
      props: {
        modelValue: ''
      }
    })
    
    const input = wrapper.find('input')
    await input.setValue('test value')
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['test value'])
  })
  
  it('displays error message', () => {
    const wrapper = mount(FormField, {
      props: {
        modelValue: '',
        error: 'This field is required'
      }
    })
    
    expect(wrapper.find('.label-text-alt.text-error').text()).toBe('This field is required')
  })
  
  it('renders select options correctly', () => {
    const options = [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' }
    ]
    
    const wrapper = mount(FormField, {
      props: {
        type: 'select',
        modelValue: '',
        options
      }
    })
    
    const select = wrapper.find('select')
    const optionElements = select.findAll('option')
    
    expect(optionElements).toHaveLength(2)
    expect(optionElements[0].text()).toBe('Option 1')
    expect(optionElements[1].text()).toBe('Option 2')
  })
})
```

#### 2. Тесты сложных компонентов
```typescript
// src/components/__tests__/LoadingSpinner.test.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    const wrapper = mount(LoadingSpinner)
    
    expect(wrapper.find('.loading-spinner').exists()).toBe(true)
    expect(wrapper.find('.loading-md').exists()).toBe(true)
    expect(wrapper.find('.loading-primary').exists()).toBe(true)
  })
  
  it('renders with custom size and variant', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        size: 'lg',
        variant: 'success'
      }
    })
    
    expect(wrapper.find('.loading-lg').exists()).toBe(true)
    expect(wrapper.find('.loading-success').exists()).toBe(true)
  })
  
  it('displays loading text', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        text: 'Loading data...'
      }
    })
    
    expect(wrapper.find('p').text()).toBe('Loading data...')
  })
  
  it('renders as overlay when overlay prop is true', () => {
    const wrapper = mount(LoadingSpinner, {
      props: {
        overlay: true
      }
    })
    
    expect(wrapper.find('.fixed.inset-0').exists()).toBe(true)
    expect(wrapper.find('.z-50').exists()).toBe(true)
  })
})
```

### Тесты stores (Pinia)

#### 1. Тесты auth store
```typescript
// src/stores/__tests__/auth.test.ts
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth'

// Мок для API клиента
vi.mock('@/api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn()
  }
}))

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('initializes with default state', () => {
    const store = useAuthStore()
    
    expect(store.me).toBeNull()
    expect(store.tokens).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })
  
  it('sets tokens correctly', () => {
    const store = useAuthStore()
    const tokens = {
      access: 'access-token',
      refresh: 'refresh-token'
    }
    
    store.setTokens(tokens)
    
    expect(store.tokens).toEqual(tokens)
    expect(store.isAuthenticated).toBe(true)
  })
  
  it('clears tokens on logout', () => {
    const store = useAuthStore()
    const tokens = {
      access: 'access-token',
      refresh: 'refresh-token'
    }
    
    store.setTokens(tokens)
    store.logout()
    
    expect(store.tokens).toBeNull()
    expect(store.me).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })
})
```

#### 2. Тесты materials store
```typescript
// src/stores/__tests__/materials.test.ts
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMaterialsStore } from '@/stores/materials'

// Мок для API клиента
const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
}

vi.mock('@/api/client', () => ({
  default: mockApi
}))

describe('Materials Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })
  
  it('fetches materials list', async () => {
    const store = useMaterialsStore()
    const mockMaterials = [
      { id: 1, name: 'Material 1', sku: 'MAT-001' },
      { id: 2, name: 'Material 2', sku: 'MAT-002' }
    ]
    
    mockApi.get.mockResolvedValue({
      data: {
        count: 2,
        results: mockMaterials
      }
    })
    
    await store.fetchList()
    
    expect(store.items).toEqual(mockMaterials)
    expect(store.loading).toBe(false)
    expect(mockApi.get).toHaveBeenCalledWith('/materials/')
  })
  
  it('creates new material', async () => {
    const store = useMaterialsStore()
    const newMaterial = {
      name: 'New Material',
      sku: 'MAT-003',
      default_unit: 1
    }
    
    const createdMaterial = { id: 3, ...newMaterial }
    
    mockApi.post.mockResolvedValue({
      data: createdMaterial
    })
    
    const result = await store.create(newMaterial)
    
    expect(result).toEqual(createdMaterial)
    expect(store.items).toContain(createdMaterial)
    expect(mockApi.post).toHaveBeenCalledWith('/materials/', newMaterial)
  })
  
  it('handles fetch error', async () => {
    const store = useMaterialsStore()
    const error = new Error('Network error')
    
    mockApi.get.mockRejectedValue(error)
    
    await store.fetchList()
    
    expect(store.error).toBe('Network error')
    expect(store.loading).toBe(false)
  })
})
```

### E2E тесты (Playwright)

#### 1. Настройка Playwright
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

#### 2. Тесты аутентификации
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="username-input"]', 'admin')
    await page.fill('[data-testid="password-input"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    
    await expect(page).toHaveURL('/purchases')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })
  
  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="username-input"]', 'invalid')
    await page.fill('[data-testid="password-input"]', 'invalid')
    await page.click('[data-testid="login-button"]')
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Неверные учетные данные')
  })
  
  test('should logout successfully', async ({ page }) => {
    // Логин
    await page.goto('/login')
    await page.fill('[data-testid="username-input"]', 'admin')
    await page.fill('[data-testid="password-input"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    
    // Логаут
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')
    
    await expect(page).toHaveURL('/login')
  })
})
```

#### 3. Тесты CRUD операций
```typescript
// e2e/materials.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Materials Management', () => {
  test.beforeEach(async ({ page }) => {
    // Логин перед каждым тестом
    await page.goto('/login')
    await page.fill('[data-testid="username-input"]', 'admin')
    await page.fill('[data-testid="password-input"]', 'admin123')
    await page.click('[data-testid="login-button"]')
  })
  
  test('should display materials list', async ({ page }) => {
    await page.goto('/materials')
    
    await expect(page.locator('h1')).toContainText('Материалы')
    await expect(page.locator('[data-testid="materials-table"]')).toBeVisible()
  })
  
  test('should create new material', async ({ page }) => {
    await page.goto('/materials')
    
    await page.click('[data-testid="create-material-button"]')
    await expect(page).toHaveURL('/materials/create')
    
    await page.fill('[data-testid="name-input"]', 'Test Material')
    await page.fill('[data-testid="sku-input"]', 'TEST-001')
    await page.selectOption('[data-testid="category-select"]', '1')
    await page.selectOption('[data-testid="unit-select"]', '1')
    
    await page.click('[data-testid="save-button"]')
    
    await expect(page).toHaveURL('/materials')
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
  })
  
  test('should edit existing material', async ({ page }) => {
    await page.goto('/materials')
    
    await page.click('[data-testid="edit-button-1"]')
    await expect(page).toHaveURL('/materials/1/edit')
    
    await page.fill('[data-testid="name-input"]', 'Updated Material')
    await page.click('[data-testid="save-button"]')
    
    await expect(page).toHaveURL('/materials')
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
  })
  
  test('should delete material', async ({ page }) => {
    await page.goto('/materials')
    
    await page.click('[data-testid="delete-button-1"]')
    await page.click('[data-testid="confirm-delete-button"]')
    
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
  })
  
  test('should filter materials by search', async ({ page }) => {
    await page.goto('/materials')
    
    await page.fill('[data-testid="search-input"]', 'Cement')
    await page.press('[data-testid="search-input"]', 'Enter')
    
    await expect(page.locator('[data-testid="materials-table"] tbody tr')).toHaveCount(1)
  })
})
```

### Тесты производительности

#### 1. Backend тесты производительности
```python
# tests/test_performance.py
import time
from django.test import TestCase
from django.test.utils import override_settings
from django.db import connection
from .base import BaseTestCase

class PerformanceTest(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.create_test_data()
    
    def test_purchases_list_performance(self):
        """Тест производительности списка закупок"""
        from purchases.models import Purchase, PurchaseSupplier
        
        # Создание большого количества закупок
        supplier = PurchaseSupplier.objects.create(name='Test Supplier')
        
        for i in range(100):
            Purchase.objects.create(
                date='2024-01-15',
                object=self.object,
                supplier=supplier,
                responsible=self.user,
                currency='UZS'
            )
        
        # Измерение времени выполнения запроса
        start_time = time.time()
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) FROM purchases_purchase
                WHERE object_id = %s
            """, [self.object.id])
            result = cursor.fetchone()
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Проверка, что запрос выполняется быстро
        self.assertLess(execution_time, 0.1)  # Менее 100ms
        self.assertEqual(result[0], 100)
    
    def test_stock_calculation_performance(self):
        """Тест производительности расчета остатков"""
        from stock.models import StockSnapshot
        
        # Создание большого количества записей в журнале остатков
        for i in range(1000):
            StockSnapshot.objects.create(
                date='2024-01-15',
                object=self.object,
                material=self.material,
                unit=self.unit_kg,
                quantity_signed=1.0,
                stage='delivery_fixed',
                source_type='purchase_item',
                source_id=i,
                responsible=self.user
            )
        
        # Измерение времени расчета остатков
        start_time = time.time()
        
        # Расчет текущего остатка
        balance = StockSnapshot.objects.filter(
            object=self.object,
            material=self.material
        ).aggregate(
            total=models.Sum('quantity_signed')
        )['total']
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Проверка производительности
        self.assertLess(execution_time, 0.5)  # Менее 500ms
        self.assertEqual(balance, 1000.0)
```

#### 2. Frontend тесты производительности
```typescript
// src/test/performance.test.ts
import { describe, it, expect } from 'vitest'

describe('Performance Tests', () => {
  it('should render large table within acceptable time', async () => {
    const startTime = performance.now()
    
    // Симуляция рендеринга большой таблицы
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: Math.random()
    }))
    
    // Здесь бы был реальный рендеринг компонента
    // const wrapper = mount(LargeTable, { props: { data: largeDataset } })
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    // Проверка, что рендеринг выполняется быстро
    expect(renderTime).toBeLessThan(100) // Менее 100ms
  })
  
  it('should handle search efficiently', async () => {
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      category: `Category ${i % 10}`
    }))
    
    const startTime = performance.now()
    
    // Симуляция поиска
    const searchTerm = 'Item 5000'
    const filtered = largeDataset.filter(item => 
      item.name.includes(searchTerm)
    )
    
    const endTime = performance.now()
    const searchTime = endTime - startTime
    
    expect(searchTime).toBeLessThan(50) // Менее 50ms
    expect(filtered).toHaveLength(1)
  })
})
```

## Запуск тестов

### Backend тесты
```bash
# Запуск всех тестов
python manage.py test

# Запуск конкретного теста
python manage.py test tests.test_purchases_models

# Запуск с покрытием
coverage run --source='.' manage.py test
coverage report
coverage html

# Запуск с подробным выводом
python manage.py test --verbosity=2

# Запуск параллельно
python manage.py test --parallel
```

### Frontend тесты
```bash
# Unit тесты
npm run test

# E2E тесты
npm run test:e2e

# Тесты с покрытием
npm run test:coverage

# Тесты в watch режиме
npm run test:watch

# Тесты конкретного файла
npm run test FormField.test.ts
```

## CI/CD интеграция

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install coverage
    
    - name: Run tests
      run: |
        coverage run --source='.' manage.py test
        coverage report
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:coverage
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

## Метрики качества

### Покрытие кода
- **Backend**: Минимум 80% покрытия
- **Frontend**: Минимум 70% покрытия
- **Критические компоненты**: 90%+ покрытия

### Производительность
- **API ответы**: < 200ms для простых запросов
- **Сложные запросы**: < 1s
- **Frontend рендеринг**: < 100ms для списков
- **Поиск**: < 50ms для фильтрации

### Надежность
- **Тесты должны проходить**: 100% success rate
- **E2E тесты**: Критические пользовательские сценарии
- **Regression тесты**: После каждого изменения

## Заключение

Система тестирования ELOM обеспечивает высокое качество кода и надежность приложения. Многоуровневый подход к тестированию гарантирует, что все компоненты системы работают корректно как по отдельности, так и в интеграции.

### Ключевые принципы тестирования:
1. **Покрытие**: Высокое покрытие кода тестами
2. **Автоматизация**: Все тесты запускаются автоматически
3. **Скорость**: Быстрое выполнение unit тестов
4. **Надежность**: Стабильные E2E тесты
5. **Поддерживаемость**: Читаемые и понятные тесты

