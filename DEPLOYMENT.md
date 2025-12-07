# Deployment Guide

This document explains how to deploy the single-round Railways voting game with Docker and how to configure SSH access for pulling the repository on a remote host.

## Prerequisites

- Docker Engine 25+ and Docker Compose v2.
- A domain or public IP to expose the client (optional but recommended).
- A Redis instance reachable by the server (`REDIS_URL`, e.g. `redis://redis:6379`).

## File Overview

- `Dockerfile.server` — builds and runs the Express + Socket.IO backend.
- `client/Dockerfile` — builds the Vite client and serves it via nginx with SPA routing.
- `docker-compose.yml` — orchestrates both services on a shared network.
- `.env.example` — compose-level overrides (host ports, public API URL for the client).
- `server/.env.example` — reference for the server-side environment variables that must be provided.

## 1. Prepare Environment Variables

1. Copy `server/.env.example` to `server/.env` and override `PORT` if you don’t want the default `4000`.
   - Required: `YANDEX_API_KEY`, `YANDEX_FOLDER_ID`, `REDIS_URL`, `ADMIN_SECRET`.
   - Optional tuning: `STATE_TTL_SECONDS`, `SUBMIT_THROTTLE_MS`, `SCORE_QUEUE_NAME`, `SCORE_TIMEOUT_MS`, `SCORE_WORKERS`, `YANDEX_OPENAI_BASE_URL`, `YANDEX_SCORING_MODEL`, `YANDEX_MODERATION_MODEL`.
2. Copy `.env.example` (repo root) to `.env` and set compose overrides:
   - `SERVER_HOST_PORT`: external port that exposes the API (default `4000`).
   - `CLIENT_HOST_PORT`: external port for the nginx SPA (set to `80` if you want the domain root to work without a port).
   - `CLIENT_PUBLIC_SERVER_URL`: public URL that browsers must use to reach the API/WebSocket endpoint (e.g. `https://gse-vote.ru` or `http://gse-vote.ru:4000`).

## 2. Build and Run with Docker Compose

```bash
docker compose build
docker compose up -d
```

Services (defaults unless you override them in `.env`):

- `server` exposed on `${SERVER_HOST_PORT:-4000}`.
- `client` (nginx) exposed on `${CLIENT_HOST_PORT:-5173}`.

To serve the client on your domain, set `CLIENT_HOST_PORT=80` and `CLIENT_PUBLIC_SERVER_URL=http://your-domain.tld:4000` (or `https://your-domain.tld` if you terminate TLS in front of Docker), then rebuild:

```bash
docker compose up -d --build client
```

### Customizing the API endpoint for the client

The compose file passes `CLIENT_PUBLIC_SERVER_URL` to the client build so that the generated bundle connects directly to the public API endpoint you specify. Update `.env` and rebuild the client whenever the public URL changes.

### Smoke test

After `docker compose up -d` you should see:

- `http://<host>:4000/health` → `{ "status": "ok", ... }`
- `http://<host>/` → player UI (“Игра скоро начнётся” by default)
- `http://<host>/admin` → admin dashboard with phase buttons
- `http://<host>/display` → stage layout

Switch the phase from the admin panel to ensure the other screens react in real time.

### Useful commands

- `docker compose logs -f server`
- `docker compose logs -f client`
- `docker compose down` (stop containers)
- `docker compose down --volumes --rmi local` (clean all)

### Load test (optional)

- Ensure server is running and `ADMIN_SECRET`/`REDIS_URL` are configured.
- Run from repo root: `npx artillery run loadtest/socketio.yml` (set `SERVER_URL` and `STAGE_ID` envs as needed) to simulate ~250 concurrent players registering and submitting answers.

## 3. Manual image builds (optional)

Backend:

```bash
docker build -f Dockerfile.server -t prompt-night-server .
docker run -p 4000:4000 --env-file server/.env prompt-night-server
```

Frontend:

```bash
docker build \
  -f client/Dockerfile \
  --build-arg VITE_SERVER_URL=https://api.example.com \
  -t prompt-night-client .
docker run -p 5173:80 prompt-night-client
```

## 4. SSH Key Setup for GitHub and the remote server

Use a dedicated deploy key rather than reusing personal keys.

### Step A — Generate a key pair locally

```bash
ssh-keygen -t ed25519 -C "deploy@prompt-night" -f ~/.ssh/prompt-night
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/prompt-night
```

The public key lives in `~/.ssh/prompt-night.pub`.

### Step B — Add the key to GitHub

1. Copy the public key: `pbcopy < ~/.ssh/prompt-night.pub` (macOS) or `cat ~/.ssh/prompt-night.pub`.
2. In GitHub: **Settings → SSH and GPG keys → New SSH key**.
3. Paste the key, give it a descriptive name (e.g. "Prompt Night Deploy"), and save.
4. Test from your machine: `ssh -T git@github.com`.

### Step C — Install the key on the remote server

1. Copy the private key to the server (or create a new pair directly on the server for better security). To copy the public key:
   ```bash
   ssh-copy-id -i ~/.ssh/prompt-night.pub username@your.server.ip
   ```
   or append manually:
   ```bash
   cat ~/.ssh/prompt-night.pub | ssh username@your.server.ip "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
   ```
2. On the server, ensure `~/.ssh/config` references the key when talking to GitHub:
   ```
   Host github.com
     HostName github.com
     User git
     IdentityFile ~/.ssh/prompt-night
     IdentitiesOnly yes
   ```
3. Test directly from the server:
   ```bash
   ssh -T git@github.com
   ```

### Step D — Clone or pull the repository on the server

```bash
git clone git@github.com:your-org/YandexPromptNight.git
cd YandexPromptNight
git pull
```

Ensure the SSH key is readable only by the current user (`chmod 600 ~/.ssh/prompt-night`).

## 5. Next Steps

- Configure a reverse proxy (e.g. Traefik, Caddy, or nginx) if you need HTTPS termination in front of the `client` container.
- Add monitoring/health checks by polling `server:4000/health`.
- Keep `.env` files out of version control and rotate SSH keys if the host changes.

