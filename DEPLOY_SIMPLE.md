# Простая инструкция по деплою

## Шаги для запуска приложения на сервере

### 1. Подключитесь к серверу

```bash
ssh ubuntu@158.160.34.44
# или
ssh debian@158.160.34.44
```

### 2. Установите Docker и Docker Compose (если еще не установлены)

```bash
# Обновляем пакеты
sudo apt update

# Устанавливаем Docker
sudo apt install -y docker.io docker-compose

# Запускаем Docker
sudo systemctl enable docker
sudo systemctl start docker

# Добавляем текущего пользователя в группу docker (чтобы не использовать sudo)
sudo usermod -aG docker $USER

# Выйдите и войдите снова, чтобы изменения вступили в силу
exit
# Затем подключитесь снова
```

### 3. Клонируйте репозиторий

```bash
cd ~
git clone https://github.com/EVRAG/yandex_prompts.git yandexpromptnight
cd yandexpromptnight
```

### 4. Создайте файл .env

```bash
nano .env
```

Заполните необходимые переменные окружения. Пример:

```env
# Сервер
SERVER_HOST_PORT=4000
CLIENT_HOST_PORT=5173
REDIS_HOST_PORT=6379

# Клиент
CLIENT_PUBLIC_SERVER_URL=http://158.160.34.44:4000
VITE_ADMIN_SECRET=ваш-секретный-ключ

# Другие переменные, которые нужны вашему приложению
```

Сохраните файл (Ctrl+O, Enter, Ctrl+X в nano).

### 5. Запустите приложение

```bash
docker compose up -d --build
```

Эта команда:
- Соберет образы (`--build`)
- Запустит контейнеры в фоновом режиме (`-d`)
- Запустит все сервисы: server, client, redis

### 6. Проверьте статус

```bash
# Посмотреть статус контейнеров
docker compose ps

# Посмотреть логи
docker compose logs -f

# Посмотреть логи конкретного сервиса
docker compose logs -f server
docker compose logs -f client
```

### 7. Откройте приложение в браузере

- Клиент: `http://158.160.34.44:5173`
- Сервер API: `http://158.160.34.44:4000`

## Полезные команды

### Остановить приложение
```bash
docker compose down
```

### Перезапустить приложение
```bash
docker compose restart
```

### Обновить приложение (после изменений в коде)
```bash
cd ~/yandexpromptnight
git pull
docker compose up -d --build
```

### Посмотреть использование ресурсов
```bash
docker stats
```

### Очистить неиспользуемые образы
```bash
docker system prune -f
```

## Настройка firewall (если нужно)

Если порты не открыты, откройте их:

```bash
sudo ufw allow 4000/tcp  # Сервер
sudo ufw allow 5173/tcp  # Клиент
sudo ufw allow 6379/tcp  # Redis (опционально, только если нужен внешний доступ)
```

## Устранение проблем

### Ошибка "permission denied" при работе с Docker
```bash
# Убедитесь, что вы в группе docker
groups
# Если docker нет в списке:
sudo usermod -aG docker $USER
# Выйдите и войдите снова
```

### Порт уже занят
```bash
# Проверьте, что использует порт
sudo lsof -i :4000
# Или измените порт в .env файле
```

### Контейнеры не запускаются
```bash
# Посмотрите логи
docker compose logs
# Проверьте .env файл
cat .env
```
