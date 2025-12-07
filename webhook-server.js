#!/usr/bin/env node

/**
 * Простой webhook сервер для автодеплоя
 * Запуск: node webhook-server.js
 * 
 * Настройте webhook в GitHub:
 * Settings -> Webhooks -> Add webhook
 * Payload URL: http://your-server:3001/webhook
 * Content type: application/json
 * Secret: ваш секретный ключ (установите в WEBHOOK_SECRET)
 */

const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');
const path = require('path');

const PORT = process.env.WEBHOOK_PORT || 3001;
const SECRET = process.env.WEBHOOK_SECRET || 'your-secret-key-change-me';
const DEPLOY_PATH = process.env.DEPLOY_PATH || process.cwd();
const BRANCH = process.env.DEPLOY_BRANCH || 'main';

function verifySignature(payload, signature) {
  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

function deploy() {
  return new Promise((resolve, reject) => {
    console.log(`[${new Date().toISOString()}] 🚀 Начинаем деплой...`);
    
    const deployScript = path.join(DEPLOY_PATH, 'deploy.sh');
    const command = `cd ${DEPLOY_PATH} && bash ${deployScript}`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`[${new Date().toISOString()}] ❌ Ошибка деплоя:`, error);
        reject(error);
        return;
      }
      
      console.log(`[${new Date().toISOString()}] ✅ Деплой завершен`);
      console.log(stdout);
      if (stderr) console.error(stderr);
      resolve(stdout);
    });
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      const signature = req.headers['x-hub-signature-256'];
      
      if (!signature) {
        console.log(`[${new Date().toISOString()}] ⚠️  Запрос без подписи`);
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing signature' }));
        return;
      }
      
      if (!verifySignature(body, signature)) {
        console.log(`[${new Date().toISOString()}] ⚠️  Неверная подпись`);
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid signature' }));
        return;
      }
      
      try {
        const payload = JSON.parse(body);
        
        // Проверяем, что это push в нужную ветку
        if (payload.ref === `refs/heads/${BRANCH}`) {
          console.log(`[${new Date().toISOString()}] 📥 Получен push в ${BRANCH}`);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Deployment started' }));
          
          // Запускаем деплой асинхронно
          deploy().catch(err => {
            console.error(`[${new Date().toISOString()}] ❌ Ошибка:`, err);
          });
        } else {
          console.log(`[${new Date().toISOString()}] ⏭️  Пропускаем push в ${payload.ref}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Skipped - not target branch' }));
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] ❌ Ошибка парсинга:`, error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Webhook сервер запущен на порту ${PORT}`);
  console.log(`📁 Путь деплоя: ${DEPLOY_PATH}`);
  console.log(`🌿 Ветка: ${BRANCH}`);
  console.log(`🔐 Используйте секрет: ${SECRET}`);
});
