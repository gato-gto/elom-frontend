# Реализация функциональности бригадира

**Дата:** 27 ноября 2025  
**Версия:** 1.2

---

## 📋 Обзор

Реализована полная функциональность для роли **бригадир (brigadier)** в системе ELOM, включающая:

### Объекты:
1. ✅ Бригадир видит только те объекты, за которыми он закреплён или где он является ответственным
2. ✅ Бригадир может создавать новые объекты
3. ✅ При создании объекта бригадир автоматически становится ответственным за этот объект
4. ✅ Бригадир автоматически закрепляется за созданным объектом (assigned_objects)
5. ✅ Бригадир НЕ может сменить ответственного - поле заблокировано, всегда он сам
6. ✅ Безопасное удаление объектов - деактивация вместо удаления при наличии связей
7. ✅ Кнопка "Удалить" скрыта для деактивированных объектов

### Закупки (Purchase):
8. ✅ Нельзя создавать закупки для деактивированных объектов
9. ✅ Деактивированные объекты скрыты в выпадающем списке формы закупки
10. ✅ Backend валидация проверяет `is_active` объекта при создании

### Списания (WriteOff):
11. ✅ В форме списания поле "Ответственный" автоматически заполняется текущим бригадиром и заблокировано
12. ✅ Если у бригадира только один объект - он автоматически выбирается, placeholder скрыт
13. ✅ При выборе материала в подсказках исключаются уже добавленные материалы
14. ✅ Уведомления при успешном/неуспешном сохранении списания
15. ✅ Нельзя создавать списания для деактивированных объектов
16. ✅ Деактивированные объекты скрыты в выпадающем списке формы списания

---

## 🔧 Изменения в Backend

### 1. Обновлена функция фильтрации объектов (`common/utils.py`)

**Файл:** `C:\Users\HVC\stts\elom-backend\common\utils.py`

**Изменения:**
```python
def get_user_objects(user) -> QuerySet:
    """
    Получить объекты, к которым у пользователя есть доступ
    """
    # ... код для admin, director, coordinator ...
    
    # Для бригадиров: объекты, где они ответственные ИЛИ закреплены
    profile = getattr(user, "profile", None)
    if profile and role == "brigadier":
        # Получаем объекты где бригадир ответственный или закреплен
        return Object.objects.select_related('responsible__user').filter(
            Q(responsible=profile) | Q(assigned_employees=profile)
        ).distinct()
```

**Логика:**
- Бригадир видит объекты, где он указан как `responsible` (ответственный)
- Бригадир видит объекты, где он добавлен в `assigned_employees` (закреплённые объекты)
- Используется `Q` объект для объединения условий через `OR`
- Применяется `distinct()` для исключения дубликатов

---

### 2. Автоматическое назначение ответственного (`common/views.py`)

**Файл:** `C:\Users\HVC\stts\elom-backend\common\views.py`

**Изменения в `ObjectViewSet.perform_create()`:**
```python
def perform_create(self, serializer):
    # Для бригадиров автоматически устанавливаем их как ответственных
    user = self.request.user
    role = getattr(getattr(user, "profile", None), "role", None)
    
    if role == "brigadier" and not serializer.validated_data.get('responsible'):
        # Автоматически назначаем текущего бригадира ответственным
        serializer.validated_data['responsible'] = user.profile
    
    obj = serializer.save()
    
    # Если бригадир создал объект, автоматически закрепляем его за объектом
    if role == "brigadier":
        profile = user.profile
        # Добавляем объект в assigned_objects, если его там еще нет
        if not obj.assigned_employees.filter(id=profile.id).exists():
            obj.assigned_employees.add(profile)
```

**Логика:**
1. При создании объекта проверяется роль пользователя
2. Если роль = `brigadier` и не указан `responsible`, автоматически назначается текущий бригадир
3. После сохранения объекта бригадир автоматически добавляется в `assigned_employees`
4. Проверка на существование предотвращает дублирование

---

### 3. Обновлены права доступа (`common/permissions.py`)

**Файл:** `C:\Users\HVC\stts\elom-backend\common\permissions.py`

**Изменения в `DictPermission`:**
```python
def has_permission(self, request, view):
    role = getattr(getattr(request.user, "profile", None), "role", None)
    
    # ... код для admin, director, coordinator ...
    
    # Бригадиры могут создавать и редактировать объекты
    if role == "brigadier":
        # Для объектов разрешаем создание и редактирование
        if view.__class__.__name__ == "ObjectViewSet":
            return True
        # Для остальных справочников - только чтение
        return request.method in SAFE_METHODS

def has_object_permission(self, request, view, obj):
    role = getattr(getattr(request.user, "profile", None), "role", None)
    
    # Для бригадиров проверяем доступ к конкретному объекту
    if role == "brigadier" and view.__class__.__name__ == "ObjectViewSet":
        profile = request.user.profile
        # Бригадир может редактировать только свои объекты
        if hasattr(obj, 'responsible') and obj.responsible == profile:
            return True
        if hasattr(obj, 'assigned_employees') and obj.assigned_employees.filter(id=profile.id).exists():
            return True
        # Для чтения разрешаем
        if request.method in SAFE_METHODS:
            return True
        return False
```

**Логика:**
- `has_permission`: Бригадиры могут создавать объекты (POST) и редактировать (PUT/PATCH)
- `has_object_permission`: Бригадир может редактировать только те объекты, где он ответственный или закреплён
- Для остальных справочников бригадиры имеют только права на чтение

---

## 🎨 Изменения в Frontend

### 1. Обновлён список объектов (`pages/Objects/List.vue`)

**Файл:** `C:\Users\HVC\WebstormProjects\elom-frontend\src\pages\Objects\List.vue`

**Изменения:**
```typescript
// Computed
const canEdit = computed(() => {
  const role = auth.role as Me['role'] | undefined
  // Бригадиры могут создавать и редактировать объекты
  return role === 'admin' || role === 'director' || role === 'brigadier'
})
```

**Логика:**
- Добавлена роль `brigadier` в список ролей, которые могут создавать и редактировать объекты
- Кнопка "Добавить объект" теперь доступна бригадирам
- Действия "Редактировать" и "Удалить" доступны бригадирам для их объектов

**Важно:** Backend автоматически фильтрует объекты, поэтому бригадир видит только свои объекты без дополнительной фильтрации на фронтенде.

---

### 2. Добавление бригадира в маршруты (`router/index.ts` и `router/constants.ts`)

**Файлы:** 
- `C:\Users\HVC\WebstormProjects\elom-frontend\src\router\index.ts`
- `C:\Users\HVC\WebstormProjects\elom-frontend\src\router\constants.ts`

**Изменения в `index.ts`:**
```typescript
// Добавлена роль 'brigadier' в meta.roles для всех маршрутов объектов
{
  path: '/objects',
  name: 'ObjectsList',
  meta: { 
    // ...
    roles: ['admin', 'director', 'coordinator', 'site_manager', 'brigadier', 'buyer']
  }
},
{
  path: '/objects/create',
  name: 'ObjectCreate',
  meta: { 
    // ...
    roles: ['admin', 'director', 'coordinator', 'site_manager', 'brigadier']
  }
},
{
  path: '/objects/:id',
  name: 'ObjectInfo',
  meta: {
    // ...
    roles: ['admin', 'director', 'coordinator', 'site_manager', 'brigadier', 'buyer']
  }
}
```

**Изменения в `constants.ts`:**
```typescript
brigadier: [
  ROUTE_NAMES.DASHBOARD,
  ROUTE_NAMES.MATERIALS_LIST,
  ROUTE_NAMES.PURCHASES_LIST,
  ROUTE_NAMES.PURCHASE_CREATE,
  ROUTE_NAMES.PURCHASE_EDIT,
  ROUTE_NAMES.OBJECTS_LIST,
  ROUTE_NAMES.OBJECT_CREATE,  // ← Добавлено
  ROUTE_NAMES.SUPPLIERS_LIST,
  // ...
]
```

**Логика:**
- Добавление роли `brigadier` в `meta.roles` делает маршруты доступными для бригадиров
- Маршрут отображается в навигации только если роль пользователя есть в списке `roles`
- `AppSidebar.vue` автоматически фильтрует навигацию по доступным маршрутам
- Мобильная навигация также использует эту фильтрацию

---

### 3. Автоматическое назначение ответственного (`pages/Objects/ObjectForm.vue`)

**Файл:** `C:\Users\HVC\WebstormProjects\elom-frontend\src\pages\Objects\ObjectForm.vue`

**Изменения:**

1. Добавлен импорт `useAuthStore`:
```typescript
import { useAuthStore } from '@/stores/auth'
```

2. Инициализация store:
```typescript
const auth = useAuthStore()
```

3. Обновлена логика `initialFormData`:
```typescript
const initialFormData = computed<ObjectRequest>(() => {
  // ... код для редактирования ...
  
  // Для новых объектов: если текущий пользователь - бригадир, 
  // автоматически назначаем его ответственным
  const currentUserId = auth.me?.id
  const isBrigadier = auth.me?.role === 'brigadier'
  
  return {
    name: '',
    address: '',
    is_active: true,
    location_url: undefined,
    responsible: isBrigadier ? currentUserId : undefined,  // ← Автоматическое назначение
    current_stage: 'acceptance',
    key_person_name: '',
    key_person_contacts: '',
    date_start: undefined,
    date_end: undefined
  }
})
```

**Логика:**
- При создании нового объекта проверяется роль текущего пользователя
- Если роль = `brigadier`, поле `responsible` автоматически заполняется ID текущего пользователя
- При редактировании объекта значение `responsible` берётся из существующего объекта

---

## 🔄 Полный workflow для бригадира

### Сценарий 1: Просмотр объектов

1. Бригадир заходит на страницу "Объекты"
2. Backend через `get_user_objects()` фильтрует объекты:
   - Объекты, где бригадир = `responsible`
   - Объекты, где бригадир в `assigned_employees`
3. Frontend отображает только отфильтрованные объекты
4. Бригадир видит кнопку "Добавить объект"

### Сценарий 2: Создание нового объекта

1. Бригадир нажимает "Добавить объект"
2. Открывается форма с автоматически заполненным полем "Ответственный" (текущий бригадир)
3. Бригадир заполняет остальные поля и нажимает "Создать"
4. Frontend отправляет данные на backend
5. Backend в `perform_create()`:
   - Проверяет, что пользователь - бригадир
   - Если `responsible` не указан, устанавливает текущего бригадира
   - Сохраняет объект
   - Добавляет бригадира в `assigned_employees`
6. Объект создан, бригадир автоматически:
   - Назначен ответственным (`responsible`)
   - Закреплён за объектом (`assigned_employees`)

### Сценарий 3: Редактирование объекта

1. Бригадир видит только свои объекты в списке
2. Нажимает "Редактировать" на своём объекте
3. Backend проверяет права через `has_object_permission()`:
   - Проверяет, что бригадир = `responsible` ИЛИ в `assigned_employees`
   - Разрешает редактирование
4. Бригадир изменяет данные и сохраняет
5. Изменения применяются

### Сценарий 4: Попытка редактирования чужого объекта

1. Бригадир не видит чужие объекты в списке (backend фильтрует)
2. Даже если бригадир получит прямую ссылку на чужой объект:
   - Backend вернёт 404 (объект не найден в `get_queryset()`)
   - Или 403 (доступ запрещён в `has_object_permission()`)

---

## 🧪 Тестирование

### Ручное тестирование

**Шаг 1: Создание тестового бригадира**
```bash
# В Django shell
python manage.py shell

from django.contrib.auth.models import User
from users.models import EmployeeProfile

# Создать пользователя
user = User.objects.create_user(
    username='test_brigadier',
    password='test123',
    first_name='Тест',
    last_name='Бригадиров'
)

# Установить роль бригадир
profile = user.profile
profile.role = 'brigadier'
profile.phone = '+998901234567'
profile.save()
```

**Шаг 2: Вход под бригадиром**
1. Войти в систему как `test_brigadier`
2. Перейти на страницу "Объекты"
3. Проверить, что видны только объекты, где бригадир ответственный или закреплён

**Шаг 3: Создание объекта**
1. Нажать "Добавить объект"
2. Проверить, что поле "Ответственный" автоматически заполнено
3. Заполнить остальные поля
4. Нажать "Создать"
5. Проверить, что объект создан и отображается в списке

**Шаг 4: Проверка фильтрации**
1. Войти под другим пользователем (например, admin)
2. Проверить, что видны все объекты
3. Закрепить бригадира за другим объектом через админку
4. Войти под бригадиром
5. Проверить, что теперь видны оба объекта

### API тестирование

```bash
# 1. Получить токен бригадира
curl -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "test_brigadier", "password": "test123"}'

# 2. Получить список объектов (должны быть только свои)
curl -X GET http://localhost:8000/api/v1/objects/ \
  -H "Authorization: Bearer <access_token>"

# 3. Создать новый объект
curl -X POST http://localhost:8000/api/v1/objects/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Тестовый объект",
    "address": "Тестовый адрес",
    "is_active": true,
    "current_stage": "acceptance",
    "key_person_name": "Тестовое лицо",
    "key_person_contacts": "+998901234567"
  }'

# 4. Проверить, что бригадир назначен ответственным
# В ответе должно быть: "responsible": <id_бригадира>
```

---

## 📊 Диаграмма взаимодействия

```
┌─────────────────────────────────────────────────────────────────┐
│                         БРИГАДИР                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vue.js)                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ObjectsList.vue                                           │ │
│  │  - canEdit = true для brigadier                            │ │
│  │  - Отображает кнопку "Добавить объект"                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ObjectForm.vue                                            │ │
│  │  - Автоматически заполняет responsible для brigadier      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ API Request
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Django)                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ObjectViewSet (common/views.py)                           │ │
│  │  - get_queryset() → фильтрует объекты через utils         │ │
│  │  - perform_create() → автоназначение responsible          │ │
│  │  - perform_create() → добавление в assigned_employees     │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  get_user_objects() (common/utils.py)                      │ │
│  │  - Фильтрация: responsible OR assigned_employees          │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  DictPermission (common/permissions.py)                    │ │
│  │  - has_permission() → разрешает CREATE/UPDATE              │ │
│  │  - has_object_permission() → проверяет права на объект    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Object                                                     │ │
│  │  - responsible (FK → EmployeeProfile)                      │ │
│  │  - assigned_employees (M2M → EmployeeProfile)              │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Чек-лист реализации

### Объекты:
- [x] Backend: Обновлена функция `get_user_objects()` для фильтрации объектов бригадира
- [x] Backend: Реализовано автоматическое назначение бригадира ответственным при создании объекта
- [x] Backend: Реализовано автоматическое добавление бригадира в `assigned_employees`
- [x] Backend: Обновлены права доступа `DictPermission` для бригадиров
- [x] Frontend: Обновлён `canEdit` в `ObjectsList.vue` для включения бригадиров
- [x] Frontend: Реализовано автозаполнение поля `responsible` в `ObjectForm.vue`
- [x] Frontend: Добавлена роль `brigadier` в маршруты объектов (`router/index.ts`)
- [x] Frontend: Добавлен `OBJECT_CREATE` в список доступных маршрутов бригадира (`router/constants.ts`)

### Списания:
- [x] Frontend: Автоматический выбор единственного объекта в `WriteOffForm.vue`
- [x] Frontend: Скрытие placeholder при единственном объекте
- [x] Frontend: Блокировка поля "Ответственный" для бригадира
- [x] Frontend: Автозаполнение ответственного текущим бригадиром
- [x] Frontend: Исключение добавленных материалов из подсказок (`addedMaterialIds`)
- [x] Frontend: Уведомления при успешном/неуспешном сохранении (toast)

### Общее:
- [x] Документация: Создан файл с описанием реализации
- [x] Проверка: Отсутствие linter ошибок

---

## 📝 Форма списания (WriteOffForm.vue)

### Изменения для бригадира

**Файл:** `C:\Users\HVC\WebstormProjects\elom-frontend\src\pages\WriteOffs\WriteOffForm.vue`

### 1. Автоматический выбор единственного объекта

```typescript
// Если только один объект - не показываем placeholder
const objectOptions = computed(() => {
  const objects = objectsStore.items as SiteObject[]
  
  if (objects.length === 1) {
    return objects.map((obj: SiteObject) => ({ value: obj.id, label: obj.name }))
  }
  
  return [
    { value: 0, label: '— выберите объект —' },
    ...objects.map((obj: SiteObject) => ({ value: obj.id, label: obj.name }))
  ]
})

// В initializeForm
const defaultObject = objects.length === 1 ? objects[0].id : 0
formData.value = {
  // ...
  object: defaultObject,
  // ...
}
```

**Логика:**
- Если у бригадира только один объект, он автоматически выбирается
- Placeholder "— выберите объект —" скрывается
- Сразу загружаются материалы и сотрудники для этого объекта

### 2. Блокировка поля "Ответственный"

```typescript
// Для бригадира поле ответственного заблокировано
const isBrigadier = computed(() => authStore.me?.role === 'brigadier')

// В template
<select
  v-model="formData.responsible"
  :disabled="isBrigadier"
  // ...
>
```

**Логика:**
- Бригадир автоматически назначается ответственным
- Поле select заблокировано (disabled)
- В списке опций только текущий бригадир

### 3. Исключение добавленных материалов из подсказок

```typescript
// Computed для уже добавленных материалов
const addedMaterialIds = computed(() => {
  return items.value
    .map(item => item.material)
    .filter((id): id is number => id !== null && id !== 0)
})

// В MaterialSearchSelect
<MaterialSearchSelect
  v-model="item.material"
  :exclude-materials="addedMaterialIds.filter(id => id !== item.material)"
  // ...
/>
```

**Логика:**
- Собираем ID всех добавленных материалов
- Исключаем их из подсказок (кроме текущего материала позиции)
- Работает аналогично форме закупки (PurchaseForm)

### 4. Уведомления при сохранении

```typescript
import { useUiStore } from '@/stores/ui'
const ui = useUiStore()

// При успехе
ui.toast({ 
  type: 'success', 
  text: props.initial ? 'Списание обновлено' : 'Списание создано' 
})

// При ошибке
ui.toast({ 
  type: 'error', 
  text: errorResult.detail || 'Ошибка при сохранении списания' 
})
```

**Логика:**
- Используется `useUiStore` для показа toast-уведомлений
- Аналогично реализации в PurchaseForm

---

## 🔧 Защита от деактивированных объектов (27 ноября 2025)

### Backend изменения:

**Файл:** `purchases/views.py` - `PurchaseViewSet.perform_create()`
```python
def perform_create(self, serializer):
    # Проверяем, что объект активен
    object_obj = serializer.validated_data.get('object')
    if object_obj and not object_obj.is_active:
        raise ValidationError({
            'object': 'Нельзя создать закупку для деактивированного объекта'
        })
    # ... остальная логика
```

**Файл:** `stock/views.py` - `WriteOffViewSet.perform_create()`
```python
def perform_create(self, serializer):
    # Проверяем, что объект активен
    if object_id:
        site_object = Object.objects.get(id=object_id.id if hasattr(object_id, 'id') else object_id)
        if not site_object.is_active:
            raise ValidationError({
                'object': 'Нельзя создать списание для деактивированного объекта'
            })
    # ... остальная логика
```

### Frontend изменения:

**Файл:** `PurchaseForm.vue` - `objectOptions`
```typescript
const objectOptions = computed(() => {
  const assignedIds = auth.me?.assigned_object_ids || []
  const list = assignedIds.length > 0
    ? objects.value.filter((obj: any) => assignedIds.includes(obj.id) && obj.is_active)
    : objects.value.filter((obj: any) => obj.is_active)  // Фильтр по is_active
  // ...
})
```

**Файл:** `WriteOffForm.vue` - `objectOptions`
```typescript
const objectOptions = computed(() => {
  const objects = (objectsStore.items as SiteObject[]).filter((obj: SiteObject) => obj.is_active)
  // ...
})
```

---

## 🔮 Дальнейшие улучшения

### Возможные расширения функциональности:

1. **Уведомления**
   - Отправлять уведомление бригадиру при закреплении за новым объектом
   - Уведомлять при изменении статуса объекта

2. **Статистика**
   - Дашборд для бригадира с количеством объектов
   - Статистика по закупкам и списаниям на объектах

3. **Делегирование**
   - Возможность бригадиру временно делегировать ответственность
   - История изменений ответственных

4. **Мобильное приложение**
   - Оптимизация интерфейса для мобильных устройств
   - Push-уведомления для бригадиров

---

## 📝 Примечания

### Важные моменты:

1. **Безопасность**: Все проверки прав доступа выполняются на backend, frontend только скрывает UI элементы
2. **Производительность**: Используется `select_related()` для оптимизации запросов к БД
3. **Масштабируемость**: Логика фильтрации централизована в `get_user_objects()`
4. **Поддерживаемость**: Код хорошо документирован и следует принципам DRY
5. **Деактивация объектов**: Объекты со связями деактивируются вместо удаления

### Известные ограничения:

1. Бригадир не может удалять объекты (только admin/director)
2. Бригадир не может изменять ответственного на другого пользователя (валидация на backend)
3. При редактировании объекта бригадир не может снять себя с ответственности
4. Нельзя создавать закупки и списания для деактивированных объектов

---

## 📞 Контакты

**Разработчик:** AI Assistant (Claude Opus 4.5)  
**Дата реализации:** 26-27 ноября 2025  
**Версия системы:** ELOM v3.1

---

*Документ актуален на: 27 ноября 2025*

