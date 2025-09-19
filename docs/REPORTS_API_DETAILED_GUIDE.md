# 📊 ПОЛНОЕ РУКОВОДСТВО ПО API ОТЧЕТОВ - ELOM

## 🎯 **ОБЗОР СИСТЕМЫ**

API отчетов ELOM предоставляет 4 типа отчетов с детальной аналитикой закупок, умной конвертацией единиц измерения и экспортом в Excel/PDF форматы.

**Базовый URL:** `http://127.0.0.1:8000/api/v1/`  
**Аутентификация:** JWT Bearer Token  
**Формат ответа:** JSON (по умолчанию) или Excel/PDF файл

---

## 🔐 **АУТЕНТИФИКАЦИЯ И ДОСТУП**

### **Требования:**
- ✅ JWT токен в заголовке `Authorization: Bearer {token}`
- ✅ Ролевая фильтрация данных по доступу пользователя

### **Роли и доступ:**
- **Директор/Админ/Координатор** - видят все данные
- **Бригадир/Закупщик/Ответственный** - только свои объекты
- **Руководитель** - только отчеты и архив (read-only)

---

## 📋 **1. ОТЧЕТ ПО ПЕРИОДАМ**

### **Endpoint:** `GET /reports/purchases/by-period/`

**Описание:** Группировка сумм и количества закупок по дню или месяцу с возможностью детальной фильтрации.

### **Параметры запроса:**

| Параметр | Тип | Обязательный | Описание | Пример |
|----------|-----|--------------|----------|---------|
| `period` | string | Нет | Тип группировки: `"day"` или `"month"` (по умолчанию: `"month"`) | `?period=day` |
| `date_from` | string | Нет | Дата начала (YYYY-MM-DD) | `?date_from=2025-01-01` |
| `date_to` | string | Нет | Дата окончания (YYYY-MM-DD) | `?date_to=2025-12-31` |
| `object` | int[] | Нет | Массив ID объектов (множественный) | `?object=1&object=2` |
| `responsible` | int | Нет | ID ответственного | `?responsible=5` |
| `is_archived` | boolean | Нет | Фильтр по архивным данным | `?is_archived=false` |
| `export` | string | Нет | Формат экспорта: `"xlsx"` или `"pdf"` | `?export=xlsx` |

### **Примеры запросов:**

#### **1.1. Базовый запрос (по месяцам)**
```http
GET /api/v1/reports/purchases/by-period/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Ответ:**
```json
{
  "rows": [
    {
      "period": "2025-01",
      "purchases": 15,
      "total_amount": 2500000.0
    },
    {
      "period": "2025-02", 
      "purchases": 12,
      "total_amount": 1800000.0
    },
    {
      "period": "2025-03",
      "purchases": 8,
      "total_amount": 1200000.0
    }
  ]
}
```

#### **1.2. Детальный отчет по дням**
```http
GET /api/v1/reports/purchases/by-period/?period=day&date_from=2025-01-01&date_to=2025-01-07
Authorization: Bearer {token}
```

**Ответ:**
```json
{
  "rows": [
    {
      "period": "2025-01-01",
      "purchases": 3,
      "total_amount": 450000.0
    },
    {
      "period": "2025-01-02",
      "purchases": 0,
      "total_amount": 0.0
    },
    {
      "period": "2025-01-03",
      "purchases": 2,
      "total_amount": 320000.0
    }
  ]
}
```

#### **1.3. Фильтрация по объектам и ответственным**
```http
GET /api/v1/reports/purchases/by-period/?object=1&object=3&responsible=5&is_archived=false
Authorization: Bearer {token}
```

#### **1.4. Экспорт в Excel**
```http
GET /api/v1/reports/purchases/by-period/?export=xlsx&date_from=2025-01-01&date_to=2025-03-31
Authorization: Bearer {token}
```

**Ответ:** Excel файл `purchases_by_month.xlsx` с данными:
- Заголовки: `period`, `purchases`, `total_amount`
- Метаданные фильтров в начале файла
- Автоматическое скачивание

### **Структура ответа:**
```typescript
interface PeriodReportRow {
  period: string;        // "2025-01" или "2025-01-15"
  purchases: number;     // Количество закупок
  total_amount: number;  // Общая сумма в UZS
}
```

---

## 🏢 **2. ОТЧЕТ ПО ОБЪЕКТАМ**

### **Endpoint:** `GET /reports/purchases/by-object/`

**Описание:** Агрегация закупок по объектам строительства с детальной статистикой.

### **Параметры запроса:**

| Параметр | Тип | Обязательный | Описание | Пример |
|----------|-----|--------------|----------|---------|
| `date_from` | string | Нет | Дата начала (YYYY-MM-DD) | `?date_from=2025-01-01` |
| `date_to` | string | Нет | Дата окончания (YYYY-MM-DD) | `?date_to=2025-12-31` |
| `object` | int[] | Нет | Массив ID объектов (множественный) | `?object=1&object=2` |
| `responsible` | int | Нет | ID ответственного | `?responsible=5` |
| `is_archived` | boolean | Нет | Фильтр по архивным данным | `?is_archived=false` |
| `export` | string | Нет | Формат экспорта: `"xlsx"` или `"pdf"` | `?export=xlsx` |

### **Примеры запросов:**

#### **2.1. Полный отчет по всем объектам**
```http
GET /api/v1/reports/purchases/by-object/
Authorization: Bearer {token}
```

**Ответ:**
```json
{
  "rows": [
    {
      "object_id": 1,
      "object_name": "Жилой комплекс 'Солнечный'",
      "purchases": 25,
      "total_amount": 4500000.0
    },
    {
      "object_id": 2,
      "object_name": "Офисное здание 'Бизнес-центр'",
      "purchases": 18,
      "total_amount": 3200000.0
    },
    {
      "object_id": 3,
      "object_name": "Торговый центр 'Мега'",
      "purchases": 12,
      "total_amount": 2800000.0
    }
  ]
}
```

#### **2.2. Отчет за конкретный период**
```http
GET /api/v1/reports/purchases/by-object/?date_from=2025-01-01&date_to=2025-03-31
Authorization: Bearer {token}
```

#### **2.3. Фильтрация по конкретным объектам**
```http
GET /api/v1/reports/purchases/by-object/?object=1&object=3&is_archived=false
Authorization: Bearer {token}
```

#### **2.4. Экспорт в Excel**
```http
GET /api/v1/reports/purchases/by-object/?export=xlsx&responsible=5
Authorization: Bearer {token}
```

**Ответ:** Excel файл `purchases_by_object.xlsx` с данными:
- Заголовки: `object_id`, `object_name`, `purchases`, `total_amount`
- Сортировка по названию объекта
- Метаданные фильтров

### **Структура ответа:**
```typescript
interface ObjectReportRow {
  object_id: number;     // ID объекта
  object_name: string;   // Название объекта
  purchases: number;     // Количество закупок
  total_amount: number;  // Общая сумма в UZS
}
```

---

## 👥 **3. ОТЧЕТ ПО ОТВЕТСТВЕННЫМ**

### **Endpoint:** `GET /reports/purchases/by-responsible/`

**Описание:** Агрегация закупок по пользователям-ответственным с детальной статистикой.

### **Параметры запроса:**

| Параметр | Тип | Обязательный | Описание | Пример |
|----------|-----|--------------|----------|---------|
| `date_from` | string | Нет | Дата начала (YYYY-MM-DD) | `?date_from=2025-01-01` |
| `date_to` | string | Нет | Дата окончания (YYYY-MM-DD) | `?date_to=2025-12-31` |
| `object` | int[] | Нет | Массив ID объектов (множественный) | `?object=1&object=2` |
| `responsible` | int | Нет | ID ответственного | `?responsible=5` |
| `is_archived` | boolean | Нет | Фильтр по архивным данным | `?is_archived=false` |
| `export` | string | Нет | Формат экспорта: `"xlsx"` или `"pdf"` | `?export=xlsx` |

### **Примеры запросов:**

#### **3.1. Полный отчет по всем ответственным**
```http
GET /api/v1/reports/purchases/by-responsible/
Authorization: Bearer {token}
```

**Ответ:**
```json
{
  "rows": [
    {
      "responsible_id": 3,
      "responsible_name": "Азиз Ибрагимов",
      "purchases": 28,
      "total_amount": 5200000.0
    },
    {
      "responsible_id": 7,
      "responsible_name": "Жавлон Рахимов",
      "purchases": 22,
      "total_amount": 3800000.0
    },
    {
      "responsible_id": 12,
      "responsible_name": "admin",
      "purchases": 15,
      "total_amount": 2900000.0
    }
  ]
}
```

#### **3.2. Отчет за конкретный период**
```http
GET /api/v1/reports/purchases/by-responsible/?date_from=2025-01-01&date_to=2025-02-28
Authorization: Bearer {token}
```

#### **3.3. Фильтрация по объектам**
```http
GET /api/v1/reports/purchases/by-responsible/?object=1&object=2&is_archived=false
Authorization: Bearer {token}
```

#### **3.4. Экспорт в Excel**
```http
GET /api/v1/reports/purchases/by-responsible/?export=xlsx&date_from=2025-01-01
Authorization: Bearer {token}
```

**Ответ:** Excel файл `purchases_by_responsible.xlsx` с данными:
- Заголовки: `responsible_id`, `responsible_name`, `purchases`, `total_amount`
- Сортировка по username
- Формирование имени из first_name + last_name или username

### **Структура ответа:**
```typescript
interface ResponsibleReportRow {
  responsible_id: number;    // ID пользователя
  responsible_name: string;  // Имя пользователя (first_name + last_name или username)
  purchases: number;         // Количество закупок
  total_amount: number;      // Общая сумма в UZS
}
```

---

## 📦 **4. ОТЧЕТ ПО МАТЕРИАЛАМ**

### **Endpoint:** `GET /reports/purchases/by-material/`

**Описание:** Агрегация по материалам с умной конвертацией количества к базовой единице измерения.

### **Параметры запроса:**

| Параметр | Тип | Обязательный | Описание | Пример |
|----------|-----|--------------|----------|---------|
| `date_from` | string | Нет | Дата начала (YYYY-MM-DD) | `?date_from=2025-01-01` |
| `date_to` | string | Нет | Дата окончания (YYYY-MM-DD) | `?date_to=2025-12-31` |
| `object` | int[] | Нет | Массив ID объектов (множественный) | `?object=1&object=2` |
| `responsible` | int | Нет | ID ответственного | `?responsible=5` |
| `material` | int | Нет | ID конкретного материала | `?material=10` |
| `is_archived` | boolean | Нет | Фильтр по архивным данным | `?is_archived=false` |
| `export` | string | Нет | Формат экспорта: `"xlsx"` или `"pdf"` | `?export=xlsx` |

### **Примеры запросов:**

#### **4.1. Полный отчет по всем материалам**
```http
GET /api/v1/reports/purchases/by-material/
Authorization: Bearer {token}
```

**Ответ:**
```json
{
  "rows": [
    {
      "material_id": 5,
      "material_name": "Кабель ВВГ 3x2.5",
      "unit": "м",
      "qty_total": 150.0,
      "amount_total": 3750000.0,
      "rows": 12
    },
    {
      "material_id": 9,
      "material_name": "Автомат 16A",
      "unit": "шт",
      "qty_total": null,
      "amount_total": 820000.0,
      "rows": 7
    },
    {
      "material_id": 15,
      "material_name": "Цемент М400",
      "unit": "кг",
      "qty_total": 2500.0,
      "amount_total": 1800000.0,
      "rows": 8
    }
  ]
}
```

#### **4.2. Отчет по конкретному материалу**
```http
GET /api/v1/reports/purchases/by-material/?material=5&date_from=2025-01-01
Authorization: Bearer {token}
```

#### **4.3. Фильтрация по объектам и ответственным**
```http
GET /api/v1/reports/purchases/by-material/?object=1&responsible=3&is_archived=false
Authorization: Bearer {token}
```

#### **4.4. Экспорт в Excel**
```http
GET /api/v1/reports/purchases/by-material/?export=xlsx&date_from=2025-01-01&date_to=2025-03-31
Authorization: Bearer {token}
```

**Ответ:** Excel файл `purchases_by_material.xlsx` с данными:
- Заголовки: `material_id`, `material_name`, `unit`, `qty_total`, `amount_total`, `rows`
- Сортировка по названию материала
- Умная конвертация единиц измерения

### **Структура ответа:**
```typescript
interface MaterialReportRow {
  material_id: number;     // ID материала
  material_name: string;   // Название материала
  unit: string;           // Базовая единица измерения
  qty_total: number | null; // Общее количество (с конвертацией) или null
  amount_total: number;   // Общая сумма в UZS
  rows: number;           // Количество строк закупок
}
```

---

## 🔧 **УМНАЯ КОНВЕРТАЦИЯ ЕДИНИЦ**

### **Принципы работы:**

1. **Автоматическое определение** - система сама решает, стоит ли конвертировать
2. **Красивые числа** - конвертация только когда результат "красивый"
3. **Сохранение точности** - если конвертация невозможна, остается оригинальное значение
4. **Категории единиц** - конвертация только внутри одной категории

### **Примеры конвертации:**

```javascript
// ✅ Конвертируется (красивые числа)
1000г → 1кг
100мм → 10см
1000мл → 1л

// ❌ Не конвертируется (некрасивые числа)
1123г → 1123г (остается)
213мм → 213мм (остается)
50.5кг → 50.5кг (остается)

// ❌ Не конвертируется (разные категории)
100г → 100м (масса в длину)
50шт → 50кг (штуки в массу)
```

### **Категории единиц:**
- **Масса:** г, кг, т
- **Длина:** мм, см, м, км
- **Площадь:** см², м², га
- **Объем:** см³, м³, л, мл
- **Штуки:** шт, упак, компл

---

## 📤 **ЭКСПОРТ В EXCEL**

### **Особенности Excel экспорта:**

1. **Автоматическое скачивание** - файл скачивается сразу
2. **Метаданные фильтров** - информация о примененных фильтрах в начале файла
3. **Структурированные данные** - четкие заголовки и форматирование
4. **Оптимизация** - эффективная работа с большими объемами данных

### **Пример Excel файла:**

```
Filters
date_from: 2025-01-01
date_to: 2025-03-31
object: [1, 2, 3]
responsible: 5

period          purchases    total_amount
2025-01         15           2500000.0
2025-02         12           1800000.0
2025-03         8            1200000.0
```

---

## 🚨 **ОБРАБОТКА ОШИБОК**

### **Коды ответов:**

| Код | Описание | Пример |
|-----|----------|---------|
| 200 | Успешный запрос | JSON данные или Excel файл |
| 401 | Не авторизован | `{"detail": "Authentication credentials were not provided."}` |
| 403 | Доступ запрещен | `{"detail": "You do not have permission to perform this action."}` |
| 501 | PDF не реализован | `{"detail": "PDF export is not enabled in MVP"}` |

### **Примеры ошибок:**

#### **401 Unauthorized**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

#### **403 Forbidden**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

#### **501 Not Implemented (PDF)**
```json
{
  "detail": "PDF export is not enabled in MVP"
}
```

---

## 🎯 **ПРАКТИЧЕСКИЕ ПРИМЕРЫ**

### **JavaScript/Fetch API:**

```javascript
// Получение отчета по периодам
async function getPeriodReport(token, filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/v1/reports/purchases/by-period/?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}

// Экспорт в Excel
async function exportToExcel(token, reportType, filters = {}) {
  const params = new URLSearchParams({...filters, export: 'xlsx'});
  const response = await fetch(`/api/v1/reports/purchases/${reportType}/?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${reportType}_report.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Использование
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...';

// Получить отчет по периодам за январь
getPeriodReport(token, {
  date_from: '2025-01-01',
  date_to: '2025-01-31',
  period: 'day'
}).then(data => {
  console.log('Отчет по периодам:', data.rows);
});

// Экспортировать отчет по объектам в Excel
exportToExcel(token, 'by-object', {
  date_from: '2025-01-01',
  date_to: '2025-03-31'
});
```

### **Python/Requests:**

```python
import requests
import json

# Настройки
BASE_URL = "http://127.0.0.1:8000/api/v1"
TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Получение отчета по материалам
def get_material_report(filters=None):
    url = f"{BASE_URL}/reports/purchases/by-material/"
    params = filters or {}
    
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    
    return response.json()

# Экспорт в Excel
def export_to_excel(report_type, filters=None):
    url = f"{BASE_URL}/reports/purchases/{report_type}/"
    params = {**(filters or {}), "export": "xlsx"}
    
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    
    filename = f"{report_type}_report.xlsx"
    with open(filename, 'wb') as f:
        f.write(response.content)
    
    return filename

# Использование
try:
    # Получить отчет по материалам
    report = get_material_report({
        "date_from": "2025-01-01",
        "date_to": "2025-03-31",
        "object": [1, 2, 3]
    })
    
    print(f"Найдено материалов: {len(report['rows'])}")
    for row in report['rows']:
        print(f"{row['material_name']}: {row['qty_total']} {row['unit']}")
    
    # Экспортировать в Excel
    excel_file = export_to_excel("by-material", {
        "date_from": "2025-01-01",
        "date_to": "2025-03-31"
    })
    print(f"Excel файл сохранен: {excel_file}")
    
except requests.exceptions.RequestException as e:
    print(f"Ошибка запроса: {e}")
```

---

## 🚀 **ПРОИЗВОДИТЕЛЬНОСТЬ И ОПТИМИЗАЦИЯ**

### **Оптимизации backend:**

1. **SQL оптимизация:**
   - `select_related()` для связанных объектов
   - `values()` и `annotate()` для агрегации
   - `iterator()` для больших объемов данных

2. **Кэширование:**
   - Кэш конвертаций единиц измерения
   - Оптимизированные запросы к базе данных

3. **Пагинация:**
   - Поддержка больших объемов данных
   - Эффективная работа с памятью

### **Рекомендации по использованию:**

1. **Используйте фильтры** - всегда применяйте `date_from`/`date_to` для больших периодов
2. **Ограничивайте объекты** - используйте `object` параметр для конкретных объектов
3. **Кэшируйте результаты** - для часто запрашиваемых отчетов
4. **Мониторьте производительность** - следите за временем ответа API

---

## 🎯 **ЗАКЛЮЧЕНИЕ**

### **✅ Готовые возможности:**
- **4 типа отчетов** с детальной аналитикой
- **Excel экспорт** для всех отчетов
- **Умная конвертация** единиц измерения
- **Гибкая фильтрация** по всем параметрам
- **Ролевая безопасность** данных
- **Оптимизированная производительность**

### **🔄 В разработке:**
- **PDF экспорт** - планируется в следующих версиях
- **Дополнительные отчеты** - по остаткам, поставщикам, срокам
- **Диаграммы и визуализация** - интеграция с Chart.js

### **🚀 Готовность:**
**API отчетов полностью готов к использованию в продакшене!** 🎉

---

*Документация создана: 15.01.2025*  
*Версия API: 2.0.0*  
*Статус: Готово к продакшену*
