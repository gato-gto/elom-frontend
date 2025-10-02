# Развертывание ELOM

## Обзор развертывания

ELOM состоит из двух основных компонентов: Django backend и Vue.js frontend. Система поддерживает развертывание как в development, так и в production окружениях с различными конфигурациями.

## Требования к системе

### Минимальные требования

#### Backend (Django)
- **Python**: 3.9+
- **RAM**: 2GB (минимум), 4GB (рекомендуется)
- **CPU**: 2 ядра (минимум), 4 ядра (рекомендуется)
- **Диск**: 10GB свободного места
- **ОС**: Linux (Ubuntu 20.04+), macOS, Windows

#### Frontend (Vue.js)
- **Node.js**: 16+
- **RAM**: 1GB (минимум), 2GB (рекомендуется)
- **CPU**: 1 ядро (минимум), 2 ядра (рекомендуется)
- **Диск**: 5GB свободного места

#### База данных
- **PostgreSQL**: 12+ (рекомендуется)
- **SQLite**: 3.8+ (для development)
- **MySQL**: 8.0+ (альтернатива)

### Рекомендуемые требования для production

#### Backend сервер
- **CPU**: 4+ ядер
- **RAM**: 8GB+
- **Диск**: 50GB+ SSD
- **Сеть**: 100 Mbps+

#### Frontend сервер
- **CPU**: 2+ ядер
- **RAM**: 4GB+
- **Диск**: 20GB+ SSD
- **CDN**: Рекомендуется

## Development развертывание

### Backend setup

#### 1. Клонирование репозитория
```bash
git clone https://github.com/your-org/elom-backend.git
cd elom-backend
```

#### 2. Создание виртуального окружения
```bash
# Python 3.9+
python -m venv venv

# Активация
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

#### 3. Установка зависимостей
```bash
pip install -r requirements.txt
```

#### 4. Настройка переменных окружения
```bash
# Создание .env файла
cp .env.example .env

# Редактирование .env
nano .env
```

```bash
# .env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1

# Telegram (опционально)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# Email (опционально)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

#### 5. Настройка базы данных
```bash
# Применение миграций
python manage.py migrate

# Создание суперпользователя
python manage.py createsuperuser

# Загрузка тестовых данных (опционально)
python manage.py loaddata fixtures/initial_data.json
```

#### 6. Запуск сервера
```bash
python manage.py runserver 0.0.0.0:8000
```

### Frontend setup

#### 1. Клонирование репозитория
```bash
git clone https://github.com/your-org/elom-frontend.git
cd elom-frontend
```

#### 2. Установка зависимостей
```bash
npm install
```

#### 3. Настройка переменных окружения
```bash
# Создание .env файла
cp .env.example .env.local

# Редактирование .env.local
nano .env.local
```

```bash
# .env.local
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_TITLE=ELOM Development
VITE_APP_VERSION=1.0.0
```

#### 4. Запуск dev сервера
```bash
npm run dev
```

### Проверка установки

#### Backend проверка
```bash
# Проверка API
curl http://localhost:8000/api/v1/

# Проверка документации
open http://localhost:8000/api/docs/
```

#### Frontend проверка
```bash
# Открытие в браузере
open http://localhost:5173
```

## Production развертывание

### Backend (Django) на сервере

#### 1. Подготовка сервера
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Python и зависимостей
sudo apt install python3.9 python3.9-venv python3.9-dev python3-pip nginx postgresql postgresql-contrib -y

# Создание пользователя для приложения
sudo useradd -m -s /bin/bash elom
sudo usermod -aG sudo elom
```

#### 2. Настройка PostgreSQL
```bash
# Переключение на пользователя postgres
sudo -u postgres psql

# Создание базы данных и пользователя
CREATE DATABASE elom_db;
CREATE USER elom_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE elom_db TO elom_user;
\q
```

#### 3. Развертывание приложения
```bash
# Переключение на пользователя elom
sudo su - elom

# Клонирование репозитория
git clone https://github.com/your-org/elom-backend.git
cd elom-backend

# Создание виртуального окружения
python3.9 -m venv venv
source venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt
pip install gunicorn psycopg2-binary
```

#### 4. Настройка production конфигурации
```bash
# Создание .env файла
nano .env
```

```bash
# .env
DEBUG=False
SECRET_KEY=your-production-secret-key
DATABASE_URL=postgresql://elom_user:secure_password@localhost/elom_db
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# Static files
STATIC_ROOT=/home/elom/elom-backend/staticfiles
MEDIA_ROOT=/home/elom/elom-backend/media

# Security
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
SECURE_CONTENT_TYPE_NOSNIFF=True
SECURE_BROWSER_XSS_FILTER=True
X_FRAME_OPTIONS=DENY

# Telegram
TELEGRAM_BOT_TOKEN=your-production-bot-token
TELEGRAM_CHAT_ID=your-production-chat-id

# Email
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=noreply@your-domain.com
EMAIL_HOST_PASSWORD=your-email-password
```

#### 5. Настройка статических файлов
```bash
# Сбор статических файлов
python manage.py collectstatic --noinput

# Создание директорий для медиа
mkdir -p media
```

#### 6. Настройка Gunicorn
```bash
# Создание конфигурации Gunicorn
nano gunicorn.conf.py
```

```python
# gunicorn.conf.py
bind = "127.0.0.1:8000"
workers = 4
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
preload_app = True
```

#### 7. Создание systemd сервиса
```bash
# Создание сервиса
sudo nano /etc/systemd/system/elom-backend.service
```

```ini
[Unit]
Description=ELOM Backend
After=network.target

[Service]
Type=exec
User=elom
Group=elom
WorkingDirectory=/home/elom/elom-backend
Environment=PATH=/home/elom/elom-backend/venv/bin
ExecStart=/home/elom/elom-backend/venv/bin/gunicorn --config gunicorn.conf.py elom.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Запуск сервиса
sudo systemctl daemon-reload
sudo systemctl enable elom-backend
sudo systemctl start elom-backend
sudo systemctl status elom-backend
```

#### 8. Настройка Nginx
```bash
# Создание конфигурации Nginx
sudo nano /etc/nginx/sites-available/elom-backend
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # API endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
    
    # Admin interface
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
    
    # Static files
    location /static/ {
        alias /home/elom/elom-backend/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        alias /home/elom/elom-backend/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # Health check
    location /health/ {
        proxy_pass http://127.0.0.1:8000;
        access_log off;
    }
}
```

```bash
# Активация конфигурации
sudo ln -s /etc/nginx/sites-available/elom-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Frontend (Vue.js) на сервере

#### 1. Подготовка сервера
```bash
# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PM2
sudo npm install -g pm2
```

#### 2. Развертывание приложения
```bash
# Переключение на пользователя elom
sudo su - elom

# Клонирование репозитория
git clone https://github.com/your-org/elom-frontend.git
cd elom-frontend

# Установка зависимостей
npm install

# Сборка для production
npm run build
```

#### 3. Настройка production конфигурации
```bash
# Создание .env файла
nano .env.production
```

```bash
# .env.production
VITE_API_URL=https://api.your-domain.com/api/v1
VITE_APP_TITLE=ELOM
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
```

#### 4. Настройка Nginx для frontend
```bash
# Создание конфигурации Nginx
sudo nano /etc/nginx/sites-available/elom-frontend
```

```nginx
server {
    listen 80;
    server_name app.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/app.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Root directory
    root /home/elom/elom-frontend/dist;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # API proxy
    location /api/ {
        proxy_pass https://api.your-domain.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security
    location ~ /\. {
        deny all;
    }
}
```

```bash
# Активация конфигурации
sudo ln -s /etc/nginx/sites-available/elom-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL сертификаты

### Let's Encrypt
```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение сертификата для backend
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Получение сертификата для frontend
sudo certbot --nginx -d app.your-domain.com

# Автоматическое обновление
sudo crontab -e
# Добавить строку:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## Мониторинг и логирование

### Настройка логирования

#### Backend логирование
```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/elom/backend.log',
            'formatter': 'verbose',
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': '/var/log/elom/backend_error.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'elom': {
            'handlers': ['file', 'error_file', 'console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

#### Создание директорий для логов
```bash
sudo mkdir -p /var/log/elom
sudo chown elom:elom /var/log/elom
```

### Мониторинг системы

#### Установка мониторинга
```bash
# Установка htop для мониторинга процессов
sudo apt install htop iotop nethogs -y

# Установка Prometheus (опционально)
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xvfz prometheus-2.40.0.linux-amd64.tar.gz
sudo mv prometheus-2.40.0.linux-amd64 /opt/prometheus
```

#### Настройка алертов
```bash
# Создание скрипта мониторинга
sudo nano /usr/local/bin/elom-monitor.sh
```

```bash
#!/bin/bash
# elom-monitor.sh

# Проверка статуса сервисов
check_service() {
    if systemctl is-active --quiet $1; then
        echo "✅ $1 is running"
    else
        echo "❌ $1 is not running"
        # Отправка уведомления
        curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
             -d "chat_id=$TELEGRAM_CHAT_ID" \
             -d "text=🚨 Service $1 is down on $(hostname)"
    fi
}

# Проверка сервисов
check_service "elom-backend"
check_service "nginx"
check_service "postgresql"

# Проверка дискового пространства
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
         -d "chat_id=$TELEGRAM_CHAT_ID" \
         -d "text=⚠️ Disk usage is ${DISK_USAGE}% on $(hostname)"
fi

# Проверка памяти
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEMORY_USAGE -gt 90 ]; then
    curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
         -d "chat_id=$TELEGRAM_CHAT_ID" \
         -d "text=⚠️ Memory usage is ${MEMORY_USAGE}% on $(hostname)"
fi
```

```bash
# Сделать скрипт исполняемым
sudo chmod +x /usr/local/bin/elom-monitor.sh

# Добавить в crontab
sudo crontab -e
# Добавить строку:
# */5 * * * * /usr/local/bin/elom-monitor.sh
```

## Резервное копирование

### Автоматическое резервное копирование
```bash
# Создание скрипта резервного копирования
sudo nano /usr/local/bin/elom-backup.sh
```

```bash
#!/bin/bash
# elom-backup.sh

BACKUP_DIR="/var/backups/elom"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="elom_db"
DB_USER="elom_user"

# Создание директории для бэкапов
mkdir -p $BACKUP_DIR

# Резервное копирование базы данных
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Резервное копирование медиа файлов
tar -czf $BACKUP_DIR/media_backup_$DATE.tar.gz /home/elom/elom-backend/media/

# Резервное копирование конфигурации
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz /home/elom/elom-backend/.env /etc/nginx/sites-available/elom-*

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

# Отправка уведомления об успешном бэкапе
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
     -d "chat_id=$TELEGRAM_CHAT_ID" \
     -d "text=✅ Backup completed successfully on $(hostname)"
```

```bash
# Сделать скрипт исполняемым
sudo chmod +x /usr/local/bin/elom-backup.sh

# Добавить в crontab (ежедневно в 2:00)
sudo crontab -e
# Добавить строку:
# 0 2 * * * /usr/local/bin/elom-backup.sh
```

## Обновление системы

### Скрипт обновления
```bash
# Создание скрипта обновления
sudo nano /usr/local/bin/elom-update.sh
```

```bash
#!/bin/bash
# elom-update.sh

BACKEND_DIR="/home/elom/elom-backend"
FRONTEND_DIR="/home/elom/elom-frontend"

echo "🔄 Starting ELOM update..."

# Остановка сервисов
sudo systemctl stop elom-backend

# Обновление backend
cd $BACKEND_DIR
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

# Обновление frontend
cd $FRONTEND_DIR
git pull origin main
npm install
npm run build

# Перезапуск сервисов
sudo systemctl start elom-backend
sudo systemctl reload nginx

echo "✅ ELOM update completed successfully"

# Отправка уведомления
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
     -d "chat_id=$TELEGRAM_CHAT_ID" \
     -d "text=✅ ELOM updated successfully on $(hostname)"
```

```bash
# Сделать скрипт исполняемым
sudo chmod +x /usr/local/bin/elom-update.sh
```

## Troubleshooting

### Частые проблемы

#### 1. Ошибка подключения к базе данных
```bash
# Проверка статуса PostgreSQL
sudo systemctl status postgresql

# Проверка подключения
sudo -u postgres psql -c "SELECT version();"

# Проверка пользователя и базы данных
sudo -u postgres psql -c "\l"
sudo -u postgres psql -c "\du"
```

#### 2. Ошибки статических файлов
```bash
# Пересбор статических файлов
cd /home/elom/elom-backend
source venv/bin/activate
python manage.py collectstatic --noinput

# Проверка прав доступа
sudo chown -R elom:elom /home/elom/elom-backend/staticfiles
```

#### 3. Ошибки Nginx
```bash
# Проверка конфигурации
sudo nginx -t

# Просмотр логов
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Перезапуск Nginx
sudo systemctl reload nginx
```

#### 4. Ошибки Gunicorn
```bash
# Проверка статуса
sudo systemctl status elom-backend

# Просмотр логов
sudo journalctl -u elom-backend -f

# Перезапуск сервиса
sudo systemctl restart elom-backend
```

### Полезные команды

#### Мониторинг системы
```bash
# Статус сервисов
sudo systemctl status elom-backend nginx postgresql

# Использование ресурсов
htop
df -h
free -h

# Сетевые соединения
netstat -tlnp | grep :8000
netstat -tlnp | grep :80
netstat -tlnp | grep :443
```

#### Логи
```bash
# Логи приложения
tail -f /var/log/elom/backend.log
tail -f /var/log/elom/backend_error.log

# Логи Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Логи системы
sudo journalctl -u elom-backend -f
sudo journalctl -u nginx -f
```

## Безопасность

### Настройка файрвола
```bash
# Установка UFW
sudo apt install ufw -y

# Настройка правил
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Включение файрвола
sudo ufw enable
```

### Обновление системы
```bash
# Регулярные обновления
sudo apt update && sudo apt upgrade -y

# Автоматические обновления безопасности
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Мониторинг безопасности
```bash
# Установка fail2ban
sudo apt install fail2ban -y

# Настройка fail2ban
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
```

## Масштабирование

### Горизонтальное масштабирование

#### Load Balancer
```nginx
# nginx.conf
upstream elom_backend {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
}

server {
    location /api/ {
        proxy_pass http://elom_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Docker контейнеризация
```dockerfile
# Dockerfile.backend
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "elom.wsgi:application"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: elom_db
      POSTGRES_USER: elom_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://elom_user:secure_password@db:5432/elom_db
    depends_on:
      - db

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend

volumes:
  postgres_data:
```

## Заключение

Данное руководство покрывает полный цикл развертывания ELOM от development до production окружения. Система спроектирована для надежности, безопасности и масштабируемости.

### Ключевые принципы развертывания:
1. **Безопасность**: SSL, файрвол, регулярные обновления
2. **Мониторинг**: Логирование, алерты, метрики
3. **Резервное копирование**: Автоматические бэкапы
4. **Масштабируемость**: Горизонтальное масштабирование
5. **Надежность**: Отказоустойчивость, восстановление

