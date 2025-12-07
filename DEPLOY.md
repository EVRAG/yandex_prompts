# Инструкция по настройке автодеплоя

Есть два варианта настройки автодеплоя:

## Вариант 1: GitHub Actions (Рекомендуется)

### Настройка на сервере:

1. **Подготовьте сервер:**
   ```bash
   # Установите Docker и Docker Compose
   sudo apt update
   sudo apt install -y docker.io docker-compose
   sudo systemctl enable docker
   sudo systemctl start docker
   
   # Добавьте пользователя в группу docker (чтобы не использовать sudo)
   sudo usermod -aG docker $USER
   # Выйдите и войдите снова
   ```

2. **Клонируйте репозиторий на сервер:**
   ```bash
   cd ~
   git clone <ваш-репозиторий-url> yandexpromptnight
   cd yandexpromptnight
   ```

3. **Создайте .env файл:**
   ```bash
   cp .env.example .env  # или создайте вручную
   nano .env  # заполните необходимые переменные
   ```

4. **Сделайте deploy.sh исполняемым:**
   ```bash
   chmod +x deploy.sh
   ```

5. **Настройте SSH ключ для GitHub Actions:**
   ```bash
   # На сервере создайте SSH ключ (если его нет)
   ssh-keygen -t ed25519 -C "deploy@server"
   
   # Добавьте публичный ключ в authorized_keys
   cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
   ```

### Настройка в GitHub:

1. Перейдите в **Settings** → **Secrets and variables** → **Actions**

2. Добавьте следующие секреты:
   - `SERVER_HOST` - IP адрес или домен вашего сервера
   - `SERVER_USER` - имя пользователя для SSH (например, `root` или `ubuntu`)
   - `SERVER_SSH_KEY` - приватный SSH ключ для подключения к серверу
   - `SERVER_PORT` - порт SSH (обычно 22, можно не указывать)
   - `SERVER_DEPLOY_PATH` - путь к проекту на сервере (например, `~/yandexpromptnight`)

3. После каждого push в ветку `main` или `master` будет автоматически запускаться деплой.

## Вариант 2: Webhook сервер (Альтернатива)

### Настройка на сервере:

1. **Установите Node.js (если еще не установлен):**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Клонируйте репозиторий и настройте:**
   ```bash
   cd ~
   git clone <ваш-репозиторий-url> yandexpromptnight
   cd yandexpromptnight
   chmod +x deploy.sh
   ```

3. **Создайте .env файл для webhook сервера:**
   ```bash
   export WEBHOOK_SECRET="ваш-секретный-ключ-измените-это"
   export WEBHOOK_PORT=3001
   export DEPLOY_PATH="$(pwd)"
   export DEPLOY_BRANCH="main"
   ```

4. **Запустите webhook сервер:**
   ```bash
   # Вручную
   node webhook-server.js
   
   # Или через systemd (создайте /etc/systemd/system/webhook.service):
   ```

   Создайте файл `/etc/systemd/system/webhook.service`:
   ```ini
   [Unit]
   Description=GitHub Webhook Server
   After=network.target

   [Service]
   Type=simple
   User=ваш-пользователь
   WorkingDirectory=/home/ваш-пользователь/yandexpromptnight
   Environment="WEBHOOK_SECRET=ваш-секретный-ключ"
   Environment="WEBHOOK_PORT=3001"
   Environment="DEPLOY_PATH=/home/ваш-пользователь/yandexpromptnight"
   Environment="DEPLOY_BRANCH=main"
   ExecStart=/usr/bin/node webhook-server.js
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

   Затем:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable webhook
   sudo systemctl start webhook
   ```

5. **Настройте firewall (если используется):**
   ```bash
   sudo ufw allow 3001/tcp
   ```

### Настройка в GitHub:

1. Перейдите в **Settings** → **Webhooks** → **Add webhook**

2. Заполните:
   - **Payload URL**: `http://ваш-сервер:3001/webhook` (или `https://` если используете nginx с SSL)
   - **Content type**: `application/json`
   - **Secret**: тот же секрет, что вы указали в `WEBHOOK_SECRET`
   - **Events**: выберите "Just the push event"

3. Сохраните webhook.

### Настройка nginx (опционально, для HTTPS):

Если хотите использовать HTTPS, настройте nginx как reverse proxy:

```nginx
server {
    listen 80;
    server_name ваш-домен.com;

    location /webhook {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Затем используйте Let's Encrypt для SSL:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d ваш-домен.com
```

## Проверка работы

После настройки:

1. Сделайте тестовый коммит и push в ветку `main`:
   ```bash
   git commit --allow-empty -m "Test deployment"
   git push origin main
   ```

2. Проверьте логи:
   - **GitHub Actions**: вкладка "Actions" в репозитории
   - **Webhook**: `journalctl -u webhook -f` или логи в консоли

3. Проверьте статус контейнеров:
   ```bash
   docker compose ps
   ```

## Ручной деплой

Если нужно задеплоить вручную:

```bash
./deploy.sh
```

Или на сервере:
```bash
cd ~/yandexpromptnight
git pull
docker compose up -d --build
```

## Устранение проблем

- **Ошибка прав доступа**: убедитесь, что пользователь в группе `docker`
- **Ошибка SSH**: проверьте, что SSH ключ добавлен в GitHub Secrets
- **Webhook не работает**: проверьте firewall и доступность порта
- **Docker ошибки**: проверьте, что Docker и Docker Compose установлены и запущены
