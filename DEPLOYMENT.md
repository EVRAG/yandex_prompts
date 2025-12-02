# Deployment Guide

This document explains how to run the Yandex Prompt Night stack inside Docker and how to configure SSH keys so the server can pull the repository directly from GitHub.

## Prerequisites

- Docker Engine 25+ and Docker Compose v2.
- An OpenAI API key (set as `OPENAI_API_KEY` for the server).
- A domain or public IP to expose the client (optional but recommended).

## File Overview

- `Dockerfile.server` — builds and runs the Express + Socket.IO backend.
- `client/Dockerfile` — builds the Vite client and serves it via nginx with SPA routing.
- `docker-compose.yml` — orchestrates both services on a shared network.
- `server/.env.example` — reference for the server-side environment variables that must be provided.

## 1. Prepare Environment Variables

1. Copy `server/.env.example` to `server/.env`.
2. Fill in the secrets:
   - `OPENAI_API_KEY`: required for scoring answers.
   - `PORT`: optional (defaults to `4000`).

## 2. Build and Run with Docker Compose

```bash
docker compose build
docker compose up -d
```

Services:

- `server` exposed on `localhost:4000`.
- `client` (nginx) exposed on `localhost:5173`.

### Customizing the API endpoint for the client

Set the `VITE_SERVER_URL` build argument when building the client image (defaults to `http://localhost:4000`):

```bash
docker compose build \
  --build-arg VITE_SERVER_URL=https://api.example.com client
docker compose up -d client
```

The compose file already sets `VITE_SERVER_URL=http://server:4000` so the client talks to the containerized backend on the internal network.

### Useful commands

- `docker compose logs -f server`
- `docker compose logs -f client`
- `docker compose down` (stop containers)
- `docker compose down --volumes --rmi local` (clean all)

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
- Add monitoring/health checks by polling `server:4000/health` and `client`'s `/health`.
- Use a secrets manager (1Password, Doppler, AWS SSM, etc.) for `OPENAI_API_KEY` instead of storing it in `.env`.

