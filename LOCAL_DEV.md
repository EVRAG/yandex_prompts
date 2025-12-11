# Локальная разработка

## Предварительные требования

- Node.js 20+
- Redis (запущен в Docker или локально)
- npm или yarn

## Быстрый старт

### 1. Установите зависимости

```bash
npm install
```

### 2. Соберите shared модуль

```bash
npm run build --workspace @prompt-night/shared
```

### 3. Настройте переменные окружения

Создайте файл `.env` в корне проекта (если его еще нет):

```bash
# Redis (если Redis в Docker на стандартном порту)
REDIS_URL=redis://localhost:6379

# Yandex GPT API
YANDEX_API_KEY=your-api-key
YANDEX_FOLDER_ID=your-folder-id

# Admin секрет для админки
ADMIN_SECRET=your-admin-secret

# Порт сервера (опционально, по умолчанию 4000)
PORT=4000
```

Для клиента создайте файл `.env.local` в папке `client/` или используйте переменные окружения:

```bash
# URL сервера для клиента
VITE_SERVER_URL=http://localhost:4000

# Admin секрет (опционально)
VITE_ADMIN_SECRET=your-admin-secret
```

### 4. Запустите сервер

В одном терминале:

```bash
cd server
npm run dev
```

Сервер запустится на `http://localhost:4000`

### 5. Запустите клиент

В другом терминале:

```bash
cd client
npm run dev
```

Клиент запустится на `http://localhost:5173` (или другом порту, который укажет Vite)

## Проверка работы

- Клиент: откройте `http://localhost:5173`
- Админка: откройте `http://localhost:5173/admin` (потребуется ввести ADMIN_SECRET)
- Сервер API: `http://localhost:4000/health` должен вернуть `{"status":"ok"}`

## Структура проекта

- `shared/` - общие типы и конфигурация
- `server/` - Node.js сервер с Socket.IO
- `client/` - React клиент с Vite

## Hot Reload

- **Клиент**: автоматический hot reload при изменении файлов
- **Сервер**: автоматическая перезагрузка через `ts-node-dev` при изменении файлов
- **Shared**: нужно пересобрать вручную при изменении: `npm run build --workspace @prompt-night/shared`

## Troubleshooting

### Redis не подключается

Убедитесь, что Redis доступен на `localhost:6379`:
```bash
redis-cli ping
# Должен вернуть: PONG
```

Если Redis в Docker, проверьте, что порт проброшен:
```bash
docker ps | grep redis
```

### Проблемы с зависимостями

```bash
# Очистите node_modules и переустановите
rm -rf node_modules */node_modules
npm install
```

### Проблемы с shared модулем

```bash
# Пересоберите shared
npm run build --workspace @prompt-night/shared
```
