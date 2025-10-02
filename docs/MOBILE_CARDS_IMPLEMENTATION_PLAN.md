# План реализации мобильных карточек для системы ELOM
**Дата**: 24 сентября 2025  
**Версия**: 1.0  
**Цель**: Адаптивные карточки для мобильных устройств с полным функционалом

---

## 📋 **АНАЛИЗ ТЕКУЩИХ ТАБЛИЦ**

### **Выявленные таблицы с данными:**

#### 📱 **Основные списки (требуют мобильных карточек):**
1. **Purchases/List.vue** - Закупки (9 колонок + действия)
2. **Materials/List.vue** - Материалы (8 колонок + действия)
3. **Objects/List.vue** - Объекты (6 колонок + действия)  
4. **Employees/List.vue** - Сотрудники (7 колонок + действия)
5. **Stocks/List.vue** - Остатки (10 колонок + действия)
6. **WriteOffs/List.vue** - Списания (8 колонок + действия)
7. **Units/List.vue** - Единицы измерения (3 колонки + действия)
8. **Archive/List.vue** - Архив

#### 📊 **Отчеты (требуют адаптивных таблиц):**
1. **Reports/ByMaterial.vue** - По материалам
2. **Reports/ByObject.vue** - По объектам
3. **Reports/ByResponsible.vue** - По ответственным
4. **Reports/ByPeriod.vue** - По периодам

---

## 🎨 **ДИЗАЙН МОБИЛЬНЫХ КАРТОЧЕК**

### **Принципы дизайна с DaisyUI:**
1. **Карточки**: `card`, `card-body`, `card-title`
2. **Бейджи**: `badge` для статусов и категорий
3. **Кнопки**: `btn-group`, `btn-sm` для действий
4. **Аватары**: `avatar` для изображений материалов
5. **Статистика**: `stat`, `stats` для числовых данных
6. **Цвета**: `badge-primary`, `badge-success`, `badge-error`

### **Структура универсальной карточки:**
```vue
<div class="card bg-base-100 shadow-sm border hover:shadow-md transition-shadow">
  <!-- Заголовок -->
  <div class="card-body p-4">
    <div class="flex items-start justify-between">
      <h3 class="card-title text-base">Название элемента</h3>
      <div class="badge badge-primary">Статус</div>
    </div>
    
    <!-- Основная информация -->
    <div class="grid grid-cols-2 gap-2 text-sm mt-3">
      <div class="space-y-2">
        <div>
          <span class="text-gray-500">Поле 1:</span>
          <span class="font-medium">Значение</span>
        </div>
      </div>
    </div>
    
    <!-- Действия -->
    <div class="card-actions justify-end mt-4">
      <div class="btn-group">
        <button class="btn btn-sm btn-outline">Редактировать</button>
        <button class="btn btn-sm btn-error">Удалить</button>
      </div>
    </div>
  </div>
</div>
```

---

## 🔧 **ТЕХНИЧЕСКИЙ ПЛАН РЕАЛИЗАЦИИ**

### **Этап 1: Создание базового компонента**

#### **1.1 Универсальный компонент `MobileCard.vue`**
```vue
<template>
  <div class="card bg-base-100 shadow-sm border hover:shadow-md transition-shadow">
    <div class="card-body p-4">
      <!-- Заголовок с бейджем -->
      <div class="flex items-start justify-between mb-3">
        <div>
          <h3 class="card-title text-base">{{ title }}</h3>
          <p v-if="subtitle" class="text-sm text-gray-500 mt-1">{{ subtitle }}</p>
        </div>
        <div v-if="badge" class="badge" :class="badgeClass">{{ badge }}</div>
      </div>
      
      <!-- Слот для основного контента -->
      <slot name="content" />
      
      <!-- Действия -->
      <div v-if="actions.length > 0" class="card-actions justify-end mt-4">
        <div class="btn-group">
          <button
            v-for="action in actions"
            :key="action.key"
            class="btn btn-sm"
            :class="action.class"
            :disabled="action.disabled"
            @click="$emit('action', action.key)"
          >
            <component :is="action.icon" v-if="action.icon" class="w-4 h-4" />
            {{ action.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
```

#### **1.2 Хук для адаптивности `useResponsiveTable.ts`**
```typescript
export function useResponsiveTable() {
  const isMobile = ref(false)
  
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768 // md breakpoint
  }
  
  onMounted(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
  })
  
  return { isMobile }
}
```

### **Этап 2: Специализированные карточки**

#### **2.1 PurchaseCard.vue (Карточка закупки)**
```vue
<template>
  <MobileCard
    :title="`Закупка ${purchase.purchase_no}`"
    :subtitle="formatDate(purchase.date)"
    :badge="getStatusLabel(purchase.status)"
    :badge-class="getStatusBadgeClass(purchase.status)"
    :actions="actions"
    @action="handleAction"
  >
    <template #content>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <!-- Левая колонка -->
        <div class="space-y-2">
          <div>
            <span class="text-gray-500">Объект:</span>
            <div class="font-medium">{{ purchase.object_name }}</div>
          </div>
          <div>
            <span class="text-gray-500">Поставщик:</span>
            <div class="font-medium">{{ purchase.supplier }}</div>
          </div>
          <div>
            <span class="text-gray-500">Ответственный:</span>
            <div class="font-medium">{{ purchase.responsible_name }}</div>
          </div>
        </div>
        
        <!-- Правая колонка -->
        <div class="space-y-2">
          <div>
            <span class="text-gray-500">Сумма:</span>
            <div class="font-bold text-primary">{{ formatAmount(purchase.total_amount) }}</div>
          </div>
          <div>
            <span class="text-gray-500">Позиций:</span>
            <div class="font-medium">{{ purchase.items?.length || 0 }}</div>
          </div>
          <div>
            <span class="text-gray-500">Фото:</span>
            <div class="font-medium">{{ purchase.photos?.length || 0 }}</div>
          </div>
        </div>
      </div>
      
      <!-- Комментарий (если есть) -->
      <div v-if="purchase.comment" class="mt-3 p-2 bg-base-200 rounded text-sm">
        <span class="text-gray-500">Комментарий:</span>
        <div class="mt-1">{{ purchase.comment }}</div>
      </div>
    </template>
  </MobileCard>
</template>
```

#### **2.2 MaterialCard.vue (Карточка материала)**
```vue
<template>
  <MobileCard
    :title="material.name"
    :subtitle="material.sku"
    :badge="material.category_name"
    badge-class="badge-secondary"
    :actions="actions"
    @action="handleAction"
  >
    <template #content>
      <div class="flex gap-3">
        <!-- Фото материала -->
        <div v-if="material.photo_url" class="avatar">
          <div class="w-16 h-16 rounded">
            <img :src="material.photo_url" :alt="material.name" />
          </div>
        </div>
        
        <!-- Информация -->
        <div class="flex-1 grid grid-cols-1 gap-2 text-sm">
          <div>
            <span class="text-gray-500">Единица:</span>
            <span class="font-medium">{{ material.default_unit_code }}</span>
          </div>
          <div>
            <span class="text-gray-500">Закупок:</span>
            <span class="font-medium">{{ material.purchases_count }}</span>
          </div>
          <div>
            <span class="text-gray-500">Остаток:</span>
            <span class="font-bold text-success">{{ material.current_stock }}</span>
          </div>
          <div>
            <span class="text-gray-500">Ср. цена:</span>
            <span class="font-medium">{{ formatAmount(material.average_price) }}</span>
          </div>
        </div>
      </div>
    </template>
  </MobileCard>
</template>
```

#### **2.3 ObjectCard.vue (Карточка объекта)**
```vue
<template>
  <MobileCard
    :title="object.name"
    :subtitle="object.address"
    :badge="object.is_active ? 'Активный' : 'Неактивный'"
    :badge-class="object.is_active ? 'badge-success' : 'badge-error'"
    :actions="actions"
    @action="handleAction"
  >
    <template #content>
      <div class="space-y-3">
        <!-- Даты -->
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-gray-500">Начало:</span>
            <div class="font-medium">{{ formatDate(object.date_start) }}</div>
          </div>
          <div>
            <span class="text-gray-500">Окончание:</span>
            <div class="font-medium">{{ formatDate(object.date_end) }}</div>
          </div>
        </div>
        
        <!-- Ответственный -->
        <div v-if="object.responsible_name">
          <span class="text-gray-500">Ответственный:</span>
          <div class="font-medium">{{ object.responsible_name }}</div>
        </div>
        
        <!-- Локация -->
        <div v-if="object.location_url" class="pt-2">
          <a 
            :href="object.location_url" 
            target="_blank"
            class="btn btn-sm btn-outline w-full"
          >
            📍 Открыть на карте
          </a>
        </div>
      </div>
    </template>
  </MobileCard>
</template>
```

### **Этап 3: Интеграция в существующие страницы**

#### **3.1 Обновление Purchases/List.vue**
```vue
<template>
  <div class="list-container">
    <!-- Существующий header и фильтры -->
    
    <!-- Адаптивное отображение -->
    <div class="list-content" :class="{ 'relative': loading }">
      <!-- Desktop: существующая таблица -->
      <div v-if="!isMobile" class="table-container">
        <table class="modern-table">
          <!-- Существующая таблица -->
        </table>
      </div>
      
      <!-- Mobile: карточки -->
      <div v-else class="mobile-cards-container">
        <div class="grid gap-4">
          <PurchaseCard
            v-for="purchase in rows"
            :key="purchase.id"
            :purchase="purchase"
            :actions="getActions(purchase)"
            @action="handleCardAction(purchase, $event)"
          />
        </div>
      </div>
      
      <!-- Общая пагинация -->
      <ModernPagination
        v-if="count > 0"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="count"
        @page-changed="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useResponsiveTable } from '@/composables/useResponsiveTable'
import PurchaseCard from '@/components/cards/PurchaseCard.vue'

const { isMobile } = useResponsiveTable()

// Действия для карточек
const getActions = (purchase: Purchase) => [
  {
    key: 'edit',
    label: 'Редактировать',
    class: 'btn-outline',
    disabled: purchase.is_archived
  },
  {
    key: 'delete',
    label: 'Удалить',
    class: 'btn-error',
    disabled: purchase.is_archived
  }
]

const handleCardAction = (purchase: Purchase, action: string) => {
  switch (action) {
    case 'edit':
      router.push(`/purchases/${purchase.id}/edit`)
      break
    case 'delete':
      handleDelete(purchase.id)
      break
  }
}
</script>
```

### **Этап 4: Стили и анимации**

#### **4.1 Обновление tailwind.css**
```css
/* Мобильные карточки */
@layer utilities {
  .mobile-cards-container {
    @apply p-4;
  }
  
  .mobile-cards-container .card {
    @apply transition-transform duration-200;
  }
  
  .mobile-cards-container .card:hover {
    @apply scale-[1.02];
  }
  
  /* Адаптивная сетка карточек */
  .cards-grid {
    @apply grid gap-4;
    @apply grid-cols-1; /* Mobile */
    @apply sm:grid-cols-2; /* Small tablet */
    @apply lg:grid-cols-3; /* Large tablet - если показываем карточки */
  }
  
  /* Скрытие таблиц на мобильных */
  @media (max-width: 767px) {
    .desktop-only {
      @apply hidden;
    }
  }
  
  /* Скрытие карточек на десктопе */
  @media (min-width: 768px) {
    .mobile-only {
      @apply hidden;
    }
  }
}
```

---

## 📱 **ДЕТАЛЬНЫЙ ПЛАН ПО КАЖДОЙ ТАБЛИЦЕ**

### **1. Purchases (Закупки)**
- **Поля**: ID, Дата, Объект, Поставщик, Ответственный, Статус, Сумма, Позиций, Фото
- **Бейджи**: Статус (new/completed/cancelled)
- **Действия**: Редактировать, Удалить, Дублировать, Фото
- **Особенности**: Показ фото превью, статистика по позициям

### **2. Materials (Материалы)**
- **Поля**: Фото, Название, SKU, Категория, Единица, Остаток, Закупок, Ср.цена
- **Бейджи**: Категория, Активность
- **Действия**: Редактировать, Удалить, История
- **Особенности**: Аватар с фото материала, цветовые индикаторы остатков

### **3. Objects (Объекты)**
- **Поля**: Название, Адрес, Даты (начало/окончание), Ответственный, Активность
- **Бейджи**: Активность, Статус проекта
- **Действия**: Редактировать, Удалить, Карта
- **Особенности**: Кнопка "Открыть на карте", прогресс по датам

### **4. Employees (Сотрудники)**
- **Поля**: Логин, Имя, Фамилия, Email, Роль, Объекты, Активность
- **Бейджи**: Роль (admin/buyer/brigadier), Активность
- **Действия**: Редактировать, Удалить, Пароль
- **Особенности**: Цветовая кодировка ролей, список объектов

### **5. Stocks (Остатки)**
- **Поля**: Дата, Объект, Материал, Количество, Этап, Источник, Ответственный
- **Бейджи**: Этап работ, Тип источника (приход/расход)
- **Действия**: Редактировать, Удалить
- **Особенности**: Цветовая индикация прихода/расхода

### **6. WriteOffs (Списания)**
- **Поля**: Дата, Объект, Материал, Количество, Этап, Остаток, Ответственный
- **Бейджи**: Этап работ
- **Действия**: Редактировать, Удалить
- **Особенности**: Индикатор доступного остатка

### **7. Units (Единицы)**
- **Поля**: Код, Название, Использований
- **Бейджи**: Активность
- **Действия**: Редактировать, Удалить
- **Особенности**: Простая карточка, статистика использований

### **8. Reports (Отчеты)**
- **Адаптивные таблицы**: Горизонтальный скролл + компактные ячейки
- **Особенности**: Сохранение всех колонок, но с улучшенной читаемостью

---

## 🎯 **ПЛАНИРУЕМЫЕ УЛУЧШЕНИЯ**

### **Пользовательский опыт:**
- ✅ **Свайп-действия**: Свайп влево для быстрых действий
- ✅ **Pull-to-refresh**: Потянуть для обновления списка
- ✅ **Бесконечная прокрутка**: Автозагрузка при достижении конца
- ✅ **Быстрые фильтры**: Чипы для быстрой фильтрации
- ✅ **Поиск**: Поиск по всем полям карточек

### **Производительность:**
- ✅ **Виртуализация**: Для больших списков (100+ элементов)
- ✅ **Ленивая загрузка**: Изображений в карточках
- ✅ **Кеширование**: Данных для быстрого переключения

### **Доступность:**
- ✅ **Screen reader**: Поддержка для людей с ограниченными возможностями
- ✅ **Клавиатурная навигация**: Фокус и Tab-навигация
- ✅ **Высокий контраст**: Автоматическая поддержка

---

## 📅 **КАЛЕНДАРНЫЙ ПЛАН**

### **День 1: Базовые компоненты (6-8 часов)**
- ✅ Создание `MobileCard.vue`
- ✅ Создание `useResponsiveTable.ts`
- ✅ Создание `PurchaseCard.vue`
- ✅ Тестирование базового функционала

### **День 2: Основные карточки (6-8 часов)**
- ✅ `MaterialCard.vue`
- ✅ `ObjectCard.vue`  
- ✅ `EmployeeCard.vue`
- ✅ Интеграция в `Purchases/List.vue`

### **День 3: Остальные карточки (6-8 часов)**
- ✅ `StockCard.vue`
- ✅ `WriteOffCard.vue`
- ✅ `UnitCard.vue`
- ✅ Интеграция во все списки

### **День 4: Полировка и тестирование (4-6 часов)**
- ✅ Улучшение анимаций и переходов
- ✅ Тестирование на разных устройствах
- ✅ Исправление найденных проблем
- ✅ Документация для разработчиков

**ОБЩИЙ СРОК**: 4 дня (22-30 часов работы)

---

## ✅ **КРИТЕРИИ ГОТОВНОСТИ**

### **Функциональные требования:**
- ✅ Все поля из десктопной таблицы отображаются в карточке
- ✅ Все действия доступны (редактировать, удалить, и т.д.)
- ✅ Фильтрация и сортировка работают
- ✅ Пагинация сохранена
- ✅ Поиск функционирует

### **Технические требования:**
- ✅ Автоматическое переключение desktop ↔ mobile при изменении размера
- ✅ Плавные анимации и переходы
- ✅ Производительность не хуже табличной версии
- ✅ Поддержка всех браузеров

### **UX требования:**
- ✅ Интуитивно понятный интерфейс
- ✅ Быстрый доступ к действиям
- ✅ Читаемость всей информации
- ✅ Соответствие дизайн-системе DaisyUI

---

## 🚀 **ГОТОВ К РЕАЛИЗАЦИИ!**

План детально проработан и готов к выполнению. Начинаем с создания базовых компонентов и постепенно расширяем функционал для всех таблиц системы.

*Документ создан: 24 сентября 2025*  
*Статус: 🟢 ГОТОВ К РЕАЛИЗАЦИИ*


