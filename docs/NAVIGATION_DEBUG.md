# Отладка: Почему не отображается раздел "Администрирование"

## Проблема

Раздел "Администрирование" не отображается в навигации, хотя маршруты настроены правильно.

## Возможные причины

### 1. ❌ У пользователя нет нужных разрешений

Раздел "Администрирование" содержит маршруты, которые требуют разрешений:
- **Сотрудники** (`/employees`) - требует `employees.view`
- **Управление ролями** (`/rbac/roles`) - требует `rbac.manage_roles`

Если у пользователя нет хотя бы одного из этих разрешений, раздел не отобразится.

### 2. ❌ Разрешения не загружены

Разрешения загружаются асинхронно в `AppSidebar.vue`:
```typescript
onMounted(() => {
  permissionsStore.fetchPermissions()
})
```

Но навигация генерируется синхронно через `computed`:
```typescript
const navigation = computed(() => {
  return generateNavigation(router.getRoutes())
})
```

Если разрешения еще не загружены, маршруты могут быть отфильтрованы неправильно.

### 3. ❌ Проблема с кэшированием разрешений

Разрешения кэшируются на 5 минут. Если кэш устарел или поврежден, разрешения могут не загрузиться.

## Решение

### Шаг 1: Проверить разрешения пользователя

Откройте консоль браузера (F12) и выполните:

```javascript
// Проверить загруженные разрешения
const permissionsStore = usePermissionsStore()
console.log('Разрешения:', permissionsStore.permissions.map(p => p.codename))
console.log('Есть employees.view:', permissionsStore.hasPermission('employees.view'))
console.log('Есть rbac.manage_roles:', permissionsStore.hasPermission('rbac.manage_roles'))
```

### Шаг 2: Проверить навигацию

```javascript
// Проверить маршруты в навигации
const { navigation } = useAppRouter()
console.log('Все маршруты:', navigation.value)
console.log('Маршруты administration:', navigation.value.filter(i => i.category === 'administration'))
```

### Шаг 3: Принудительно обновить разрешения

```javascript
// Принудительно обновить разрешения
const permissionsStore = usePermissionsStore()
await permissionsStore.fetchPermissions(true) // force = true
```

### Шаг 4: Проверить на backend

Убедитесь, что у пользователя есть нужные разрешения:

1. Проверьте роль пользователя:
   ```bash
   python manage.py shell
   ```
   ```python
   from django.contrib.auth import get_user_model
   from rbac.models import UserRole
   User = get_user_model()
   user = User.objects.get(username='ваш_username')
   user_roles = UserRole.objects.filter(user=user)
   for ur in user_roles:
       print(f"Роль: {ur.role.name}, Разрешения: {ur.role.permissions.count()}")
   ```

2. Проверьте разрешения роли admin:
   ```python
   from rbac.models import Role, Permission
   admin_role = Role.objects.get(name='admin')
   print(f"Разрешений у admin: {admin_role.permissions.count()}")
   print(f"Есть rbac.manage_roles: {admin_role.permissions.filter(codename='rbac.manage_roles').exists()}")
   print(f"Есть employees.view: {admin_role.permissions.filter(codename='employees.view').exists()}")
   ```

3. Если разрешений нет, выполните инициализацию RBAC:
   ```bash
   python manage.py init_rbac
   ```

## Временное решение для отладки

Добавьте временный отладочный блок в `AppSidebar.vue`:

```vue
<!-- Временно для отладки -->
<div v-if="administration.length === 0" class="mb-6 p-2 bg-yellow-100 dark:bg-yellow-900 rounded text-xs">
  <p class="font-semibold">Debug: Раздел "Администрирование" пуст</p>
  <p>Всего маршрутов в навигации: {{ navigation.length }}</p>
  <p>Маршруты с категорией administration: {{ navigation.filter(i => i.category === 'administration').length }}</p>
  <p>Разрешения пользователя: {{ permissionsStore.permissions.map(p => p.codename).join(', ') || 'не загружены' }}</p>
  <p>Есть employees.view: {{ permissionsStore.hasPermission('employees.view') }}</p>
  <p>Есть rbac.manage_roles: {{ permissionsStore.hasPermission('rbac.manage_roles') }}</p>
</div>
```

Это поможет увидеть, почему раздел не отображается.

## Проверка на backend

### 1. Проверить, что роль admin имеет все разрешения

```bash
python manage.py shell
```

```python
from rbac.models import Role, Permission

# Проверить роль admin
admin_role = Role.objects.get(name='admin')
print(f"Роль: {admin_role.display_name}")
print(f"Всего разрешений: {admin_role.permissions.count()}")

# Проверить конкретные разрешения
manage_roles = Permission.objects.filter(codename='rbac.manage_roles').first()
employees_view = Permission.objects.filter(codename='employees.view').first()

print(f"rbac.manage_roles существует: {manage_roles is not None}")
print(f"employees.view существует: {employees_view is not None}")

if manage_roles:
    print(f"admin имеет rbac.manage_roles: {admin_role.permissions.filter(id=manage_roles.id).exists()}")
if employees_view:
    print(f"admin имеет employees.view: {admin_role.permissions.filter(id=employees_view.id).exists()}")
```

### 2. Если разрешений нет, выполнить инициализацию

```bash
python manage.py init_rbac
```

### 3. Проверить пользователя

```python
from django.contrib.auth import get_user_model
from rbac.models import UserRole
from rbac.services import PermissionChecker

User = get_user_model()
user = User.objects.get(username='ваш_username')

# Проверить роли пользователя
user_roles = UserRole.objects.filter(user=user)
print(f"Роли пользователя: {[ur.role.name for ur in user_roles]}")

# Проверить разрешения через PermissionChecker
permissions = PermissionChecker.get_user_permissions(user)
print(f"Всего разрешений: {len(permissions)}")
print(f"Есть rbac.manage_roles: {any(p.codename == 'rbac.manage_roles' for p in permissions)}")
print(f"Есть employees.view: {any(p.codename == 'employees.view' for p in permissions)}")
```

## Ожидаемый результат

После проверки и исправления:

1. ✅ Роль `admin` должна иметь все разрешения (включая `rbac.manage_roles` и `employees.view`)
2. ✅ Пользователь должен иметь роль `admin`
3. ✅ Разрешения должны загружаться при входе в систему
4. ✅ Раздел "Администрирование" должен отображаться с пунктами:
   - Сотрудники (если есть `employees.view`)
   - Управление ролями (если есть `rbac.manage_roles`)

---

*Документ создан: 2025-01-19*
