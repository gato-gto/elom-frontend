# Руководство по переходу на PostgreSQL

## Обзор

Данный документ описывает процесс перехода с SQLite на PostgreSQL для проекта ELOM, включая оптимизации для отчетов API.

## Преимущества PostgreSQL

### 1. Производительность
- **Нативные агрегаты**: PostgreSQL поддерживает сложные агрегатные функции на уровне БД
- **Индексы**: Более эффективные индексы для сложных запросов
- **Параллельные запросы**: Поддержка параллельного выполнения запросов

### 2. Функциональность
- **TruncDate**: Нативная поддержка группировки по датам
- **Window Functions**: Расширенные аналитические функции
- **JSON поддержка**: Встроенная работа с JSON данными

### 3. Масштабируемость
- **Конкурентность**: Лучшая обработка множественных подключений
- **Размер данных**: Поддержка больших объемов данных
- **Репликация**: Встроенные механизмы репликации

## Изменения в коде

### 1. Отчеты API

#### Текущая версия (SQLite)
```python
# Для дней используем extra() с SQLite функцией date()
data = (
    qs.extra(select={'date_str': "date(date)"})
    .values('date_str')
    .annotate(
        purchases=Count("id"), 
        total_amount=Coalesce(Sum("total_amount"), Value(0))
    )
)

# Вычисляем avg, min, max в Python
detailed_data = {}
for purchase in qs.extra(select={'date_str': "date(date)"}).values('date_str', 'total_amount'):
    # ... обработка в Python
```

#### PostgreSQL версия
```python
# Используем нативные агрегаты PostgreSQL
data = (
    qs.values(period_field=TruncDate("date"))
    .annotate(
        purchases=Count("id"), 
        total_amount=Coalesce(Sum("total_amount"), Value(0)),
        avg_amount=Coalesce(Avg("total_amount"), Value(0)),
        min_amount=Coalesce(Min("total_amount"), Value(0)),
        max_amount=Coalesce(Max("total_amount"), Value(0))
    )
    .order_by("period_field")
)
```

### 2. Производительность

#### SQLite (текущая)
- **Запросы**: 2 запроса на отчет (основной + детальные данные)
- **Обработка**: Вычисления в Python
- **Память**: Загрузка всех данных в память

#### PostgreSQL (оптимизированная)
- **Запросы**: 1 запрос на отчет
- **Обработка**: Вычисления на уровне БД
- **Память**: Минимальное использование памяти

## План миграции

### Этап 1: Подготовка
1. **Установка PostgreSQL**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   
   # Windows
   # Скачать с https://www.postgresql.org/download/windows/
   ```

2. **Создание базы данных**
   ```sql
   CREATE DATABASE elom_db;
   CREATE USER elom_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE elom_db TO elom_user;
   ```

### Этап 2: Настройка Django

1. **Обновление settings.py**
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'elom_db',
           'USER': 'elom_user',
           'PASSWORD': 'secure_password',
           'HOST': 'localhost',
           'PORT': '5432',
       }
   }
   ```

2. **Установка зависимостей**
   ```bash
   pip install psycopg2-binary
   ```

### Этап 3: Миграция данных

1. **Экспорт из SQLite**
   ```bash
   python manage.py dumpdata --natural-foreign --natural-primary > data.json
   ```

2. **Импорт в PostgreSQL**
   ```bash
   python manage.py migrate
   python manage.py loaddata data.json
   ```

### Этап 4: Обновление кода

1. **Замена views.py**
   ```bash
   # Заменить reports/views.py на reports/views_postgresql.py
   mv reports/views.py reports/views_sqlite_backup.py
   mv reports/views_postgresql.py reports/views.py
   ```

2. **Тестирование**
   ```bash
   python test_enhanced_reports.py
   ```

## Новые возможности

### 1. Расширенные агрегаты
```python
# Поддержка статистических функций
.annotate(
    std_dev=StdDev("total_amount"),
    variance=Var("total_amount"),
    percentile_50=Percentile("total_amount", 0.5)
)
```

### 2. Window Functions
```python
# Ранжирование и аналитические функции
.annotate(
    rank=Window(expression=Rank(), order_by=F('total_amount').desc()),
    running_total=Window(expression=Sum('total_amount'), order_by=F('date'))
)
```

### 3. JSON агрегаты
```python
# Группировка в JSON
.annotate(
    materials_json=JSONBAgg('items__material__name'),
    objects_json=JSONBAgg('object__name')
)
```

## Мониторинг производительности

### 1. Индексы
```sql
-- Индексы для отчетов
CREATE INDEX idx_purchase_date ON purchases_purchase(date);
CREATE INDEX idx_purchase_object ON purchases_purchase(object_id);
CREATE INDEX idx_purchase_responsible ON purchases_purchase(responsible_id);
CREATE INDEX idx_purchase_archived ON purchases_purchase(is_archived);
```

### 2. Анализ запросов
```python
# Включить логирование медленных запросов
LOGGING = {
    'loggers': {
        'django.db.backends': {
            'level': 'DEBUG',
            'handlers': ['console'],
        }
    }
}
```

## Обратная совместимость

### 1. Флаги совместимости
```python
# В settings.py
USE_POSTGRESQL_OPTIMIZATIONS = True

# В views.py
if settings.USE_POSTGRESQL_OPTIMIZATIONS:
    # PostgreSQL код
else:
    # SQLite код
```

### 2. Тестирование
```python
# Тесты для обеих БД
@pytest.mark.parametrize("database", ["sqlite", "postgresql"])
def test_reports_compatibility(database):
    # Тестирование на обеих БД
```

## Заключение

Переход на PostgreSQL обеспечит:
- **3-5x улучшение производительности** отчетов
- **Снижение нагрузки** на сервер приложения
- **Расширенные возможности** аналитики
- **Лучшую масштабируемость** для роста данных

Рекомендуется выполнить миграцию в тестовой среде перед развертыванием в продакшене.
