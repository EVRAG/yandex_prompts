# Настройка SSL сертификата через Certbot

## Вариант 1: Nginx на хосте как reverse proxy (Рекомендуется)

Этот вариант использует nginx на сервере (вне Docker) как reverse proxy для ваших контейнеров.

### 1. Установите Nginx и Certbot

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Остановите контейнеры (временно, чтобы освободить порты)

```bash
cd ~/yandex_prompts
docker compose down
```

### 3. Запустите контейнеры на внутренних портах

Измените порты в `docker-compose.yml` или создайте отдельный файл для продакшена. 

**Вариант A: Изменить docker-compose.yml временно**

Или лучше создать `.env.prod`:
```bash
nano .env.prod
```

Добавьте:
```env
# Внутренние порты (не публикуем наружу)
SERVER_HOST_PORT=4001
CLIENT_HOST_PORT=5174
REDIS_HOST_PORT=6379

# Остальные переменные из вашего .env
YANDEX_API_KEY=your-yandex-api-key-here
YANDEX_FOLDER_ID=your-folder-id-here
ADMIN_SECRET=secret123
VITE_SERVER_URL=https://your-domain.com/api
VITE_ADMIN_SECRET=secret123
SCORING_CONCURRENCY=10
SCORING_RATE_LIMIT=20
```

Запустите с другим env файлом:
```bash
docker compose --env-file .env.prod up -d --build
```

**Вариант B: Изменить docker-compose.yml напрямую**

Или просто измените порты в `docker-compose.yml`:
```yaml
ports:
  - "127.0.0.1:4001:4000"  # Только localhost
```

### 4. Создайте конфигурацию Nginx

```bash
sudo nano /etc/nginx/sites-available/yandexpromptnight
```

Добавьте конфигурацию (замените `your-domain.com` на ваш домен):

```nginx
# Редирект с HTTP на HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS конфигурация
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL сертификаты (будут добавлены certbot)
    # ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Клиент (React приложение)
    location / {
        proxy_pass http://localhost:5174;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API сервер
    location /api {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket для Socket.IO
    location /socket.io {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5. Активируйте конфигурацию

```bash
sudo ln -s /etc/nginx/sites-available/yandexpromptnight /etc/nginx/sites-enabled/
sudo nginx -t  # Проверка конфигурации
sudo systemctl reload nginx
```

### 6. Получите SSL сертификат

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot автоматически:
- Получит сертификат
- Настроит nginx для HTTPS
- Настроит автоматическое обновление

### 7. Проверьте автопродление

```bash
sudo certbot renew --dry-run
```

### 8. Обновите VITE_SERVER_URL в .env

```bash
nano .env
```

Измените:
```env
VITE_SERVER_URL=https://your-domain.com/api
```

Пересоберите клиент:
```bash
docker compose down
docker compose up -d --build
```

---

## Вариант 2: SSL внутри Docker контейнера (Альтернатива)

Если хотите оставить все в Docker, можно настроить nginx контейнер с SSL.

### 1. Создайте nginx конфигурацию с SSL

```bash
mkdir -p ~/yandex_prompts/nginx
nano ~/yandex_prompts/nginx/nginx.conf
```

### 2. Добавьте nginx сервис в docker-compose.yml

Но это сложнее, так как certbot нужно запускать отдельно и монтировать сертификаты.

**Рекомендую использовать Вариант 1** - он проще и надежнее.

---

## Настройка DNS

Перед получением сертификата убедитесь, что:

1. Домен указывает на IP сервера:
   ```
   A запись: your-domain.com → 158.160.34.44
   A запись: www.your-domain.com → 158.160.34.44
   ```

2. Проверьте, что домен резолвится:
   ```bash
   dig your-domain.com
   ping your-domain.com
   ```

---

## Полезные команды

### Проверить статус сертификата
```bash
sudo certbot certificates
```

### Обновить сертификат вручную
```bash
sudo certbot renew
```

### Проверить конфигурацию nginx
```bash
sudo nginx -t
sudo systemctl status nginx
```

### Посмотреть логи nginx
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## Настройка firewall

Убедитесь, что порты открыты:

```bash
sudo ufw allow 80/tcp   # HTTP (для certbot)
sudo ufw allow 443/tcp  # HTTPS
sudo ufw status
```

---

## Troubleshooting

### Certbot не может получить сертификат

1. Проверьте, что домен указывает на правильный IP
2. Проверьте, что порт 80 открыт
3. Проверьте, что nginx запущен и доступен на порту 80

### 502 Bad Gateway

1. Проверьте, что контейнеры запущены:
   ```bash
   docker compose ps
   ```

2. Проверьте, что порты правильные в nginx конфигурации

3. Проверьте логи:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   docker compose logs
   ```

### WebSocket не работает

Убедитесь, что в nginx конфигурации есть правильные заголовки для WebSocket (см. пример выше).
