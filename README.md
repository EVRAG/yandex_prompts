# Prompt Night – Technical Overview

This monorepo contains a realtime game prototype with three roles:

1. **Player (mobile client)** – joins via QR, answers questions, sees timers and scoring feedback.
2. **Display** – large screen that shows QR/announcements/questions/leaderboard.
3. **Admin** – controls stages, sees players/submissions, manages scores.

The repo is split into workspaces:

- `server/` – Node.js + Express + Socket.IO backend.
- `client/` – Vite + React frontend (all three UIs are routed pages).
- `shared/` – TypeScript definitions + `gameConfig.json` with the scenario.

Below is a walkthrough of how state, sockets, scoring, and rendering fit together.

---

## 1. Configuration & Shared Types

- `shared/src/gameConfig.json` describes all stages (waiting/info/question/leaderboard).
- Each **question** now has:
  - `duration` (seconds) – client timer.
  - `answerKey` – canonical answer for LLM scoring.
- `scoring` – manual vs LLM metadata (currently LLM scoring via Yandex GPT).
- `shared/src/types/gameConfig.ts` defines the union types; compiled output is imported by both server and client.
- Before building server, `npm --prefix shared run build` runs (hooked via `prebuild`).

---

## 2. Backend Architecture (server/)

### 2.1 Express + Socket.IO bootstrap

`server/src/index.ts`:

- Loads `dotenv/config` so `.env` works (`YANDEX_API_KEY` + `YANDEX_FOLDER_ID` required for moderation/scoring).
- Creates HTTP + Socket.IO server (`/health`, `/config`, `/state`, `/admin/stage`, `/moderate/nickname` REST routes).

### 2.2 GameStateManager

`server/src/gameState.ts` keeps the source of truth:

- Tracks players (Map keyed by playerId) with score, online flag, socketId.
- Tracks submissions (array) storing answer + optional evaluation (score/notes/mode).
- Stores current stage IDs for clients & display.
- Provides snapshots:
  - `getAdminSnapshot()` – includes players, submissions, both stages.
  - `getPublicSnapshot(target)` – includes stage & leaderboard for clients/display.
- Methods:
  - `registerPlayer` – creates or rehydrates players.
  - `setStage(target, stageId)` – switches stage.
  - `incrementPlayerScore` – adds delta to player score (used after LLM scoring).
  - `recordSubmission` – stores answer & evaluation metadata.

### 2.3 WebSocket message flow

There are three socket roles selected via `auth.role`:

| Role     | Rooms joined | On connect emits…                                             |
|----------|--------------|----------------------------------------------------------------|
| `admin`  | `admin`      | `config:update`, `state:update` with full AdminSnapshot       |
| `display`| `display`    | `config:update`, `state:update` (public snapshot for display) |
| `client` | `client`     | `state:update` (public snapshot for clients)                  |

Common events:

- **Player registers**: client emits `player:register { name?, playerId? }`.
  - Server validates nickname via `/moderate/nickname` beforehand (client REST call).
  - Server registers/rehydrates, marks socket data `playerId`, returns `player:registered`.

- **Stage updates**:
  - Admin: `admin:set-stage { target: 'client'|'display', stageId }`.
  - Server updates GameStateManager and broadcasts fresh snapshots.
  - REST backup: `POST /admin/stage`.

- **Admin sync**: `admin:sync` re-sends config + snapshot to requesting admin.

- **Player answer**: `player:submit { stageId, answer }`.
  - Server validates:
    - Stage is question & currently active for clients.
    - Stage has `answerKey`.
  - Adds job to scoring queue (BullMQ, Redis) → worker calls `scoreAnswer(...)` (Yandex GPT via OpenAI-compatible Responses API with `answerScoringPrompt`).
  - Adds score via `incrementPlayerScore`.
  - Records submission with evaluation data.
  - Emits `player:submitted { id, stageId, createdAt, score, notes }` only to that socket.
  - Broadcasts updated snapshots (leaderboard, etc.).

- **Admin manual score updates**: `admin:update-score { playerId, score }` (overwrites).

- **Disconnect**: if client socket closes, mark player offline (used for admin view).

### 2.4 REST API quick list

| Endpoint               | Method | Description                                 |
|------------------------|--------|---------------------------------------------|
| `/health`              | GET    | redis + Yandex GPT reachability, status ok/degraded |
| `/config`              | GET    | returns `gameConfig`                        |
| `/state`               | GET    | admin snapshot                             |
| `/moderate/nickname`   | POST   | { nickname } → { allowed, reason? }        |
| `/admin/stage`         | POST   | body `{ target, stageId }`, same as socket |

### 2.5 Scoring services

- `server/src/prompts/nicknameModeration.ts` – prompt template for Accept/Reject.
- `server/src/services/nicknameModeration.ts` – wrapper around Yandex GPT Responses API.
- `server/src/prompts/answerScoring.ts` – JSON output prompt for 0-10 score.
- `server/src/services/answerScoring.ts` – calls Yandex GPT, parses JSON, returns `{ score, feedback }`.

Potential issue: Yandex GPT latency/failure will block scoring. We currently catch errors and send `player:error` if scoring fails.

---

## 3. Frontend Architecture (client/)

### 3.1 Build Stack

- Vite + React + TypeScript.
- Tailwind CSS v4 (CSS-first). Font `YS Display` served from `public/YS Display`.
- React Router routes: `/` player, `/admin`, `/display`.

### 3.2 State & sockets (hooks)

- `usePlayerRealtime.ts`
  - Manages Socket.IO connection with role `client`.
  - Persists player info in `localStorage`.
  - Keeps `submissionStatus` (`idle` → `scoring` → `success`).
  - Stores `lastSubmission` with score/notes (for UI message).
  - Maintains `questionRecords` in `localStorage` to lock timer/submission even after reload.
  - Exposes `register`, `submitAnswer`, `resetPlayer` (currently unused in UI).

- `useAdminRealtime.ts`
  - Connects as `admin`.
  - Receives config + snapshots, exposes `setStage`, `refresh`, `updateScore`.
  - Handles drag/drop reordering stored in `localStorage`.

- `useDisplayRealtime.ts`
  - Connects as `display`.
  - Adapts admin snapshot into public shape for big-screen rendering.

### 3.3 UI Highlights

- **PlayerPage**
  - Yellow theme, timers, answer form, scoring feedback, leaderboard (only when stage is leaderboard).
  - Timer persists per question via `localStorage` (key `prompt-night-question-progress`).
  - Submission flow:
    1. Click “Отправить ответ”.
    2. Button disabled → “Вычисляем ваш балл…”.
    3. After server response, shows `Ваш балл: X/10` and notes.
    4. Re-open page: timer + submission state restored; cannot re-answer.

- **AdminPage**
  - Scenario cards, drag-and-drop ordering, buttons for client/display/both.
  - Stats cards for top players and latest submissions, with online indicators.

- **DisplayPage**
  - Yellow background, white cards.
  - Shows QR column only during registration stage.
  - Leaderboard renders full-screen only when stage.kind === 'leaderboard'.

### 3.4 Messaging flow summary

```
Client POST /moderate/nickname ──> server (Yandex GPT check) ──> allowed?
Player socket connect ──> gets state snapshot
Answers -> socket 'player:submit' ──> server scoring ──> 'player:submitted' + state broadcast
Admin buttons -> 'admin:set-stage' -> state broadcast
Display sockets automatically refresh on every 'state:update'
```

---

## 4. Data Persistence

- **State** is persisted to Redis (`STATE_KEY`) with TTL (`STATE_TTL_SECONDS`). On restart, the game rehydrates players, submissions, and current stages from Redis.
- **Players & submissions** are still ephemeral beyond Redis TTL; no long-term DB yet.
- **Config** is static JSON; any changes require redeploy/restart (and client reload to fetch new config).
- **LocalStorage** on client stores:
  - Player ID/name (`prompt-night-player`).
  - Per-question timer/submission flags (`prompt-night-question-progress`).

---

## 5. Environment & Running

### Prerequisites

- Node.js 20+
- `YANDEX_API_KEY` and `YANDEX_FOLDER_ID` in `server/.env` (see `.env.example`).
- `REDIS_URL` (e.g. `redis://localhost:6379`) — Socket.IO adapter, state cache, scoring queue.
- `ADMIN_SECRET` — required for admin sockets and `/admin/stage` REST.
- Optional tuning:
  - `STATE_TTL_SECONDS` (default `86400`)
  - `STATE_KEY` (Redis key name, default `prompt-night:state:v1`)
  - `SUBMIT_THROTTLE_MS` (default `1000`)
  - `SCORE_QUEUE_NAME`, `SCORE_TIMEOUT_MS`, `SCORE_WORKERS`
- Install deps once: `npm install` at repo root (workspaces).

### Development

```
# terminal 1
cd server
npm run dev

# terminal 2
cd client
npm run dev
```

- Frontend Vite dev server defaults to `http://localhost:5173`.
- Backend listens on `http://localhost:4000`.
- Ensure `VITE_SERVER_URL` env (or default `http://localhost:4000`).

### Production build

```
npm run build --workspace shared
npm run build --workspace server
npm run build --workspace client
```

You can then serve `client/dist` behind any static server and run `node server/dist/index.js`.

---

## 6. Potential Issues / Next Steps

1. **No persistent database**  
   - All scores/players reset on server restart. Consider adding Redis or Postgres.

2. **LLM dependency (Yandex GPT)**  
   - Nickname moderation & scoring require `YANDEX_API_KEY` + `YANDEX_FOLDER_ID`. If rate-limited or offline, players cannot register or get scores. Should implement fallback/manual scoring or queue/retry.

3. **LLM latency**  
   - Scoring waits for Yandex GPT response per submission; multiple simultaneous answers might cause noticeable delay. Could queue in background and notify via separate event.

4. **Security**  
   - Admin role is unauthenticated; any socket can claim `role: 'admin'`. Need auth (token or secret).
   - REST endpoints also lack auth (e.g., `/admin/stage`).

5. **Stage coordination**  
   - If admin sets client/display to stages that don’t align (e.g., display leaderboard while clients on question), the UI will show exactly what was requested. This is intended, but scenario authors should avoid inconsistent states.

6. **Leaderboard ordering**  
   - Currently derived from players’ scores sorted descending. Manual updates/LLM scoring could produce ties; no tie-breaker indicator yet.

7. **LocalStorage locking**  
   - If a player answers but never receives `player:submitted` (network drop), they might stay in “scoring” state until reload. Need a timeout or server-confirmed receipt to clear.

8. **Media hosting**  
   - `gameConfig.json` references CDN URLs. Ensure CORS/https accessible to both display and player clients.

9. **Scaling**  
   - Socket.IO rooms are fine for small/medium audiences; for large events consider horizontal scaling with Redis adapter.

10. **Internationalization**  
   - Most UI text is in Russian; adapt as needed.

---

## 7. File Map (key files)

```
/
├── package.json (workspaces root)
├── README.md (this file)
├── client/
│   ├── src/routes/PlayerPage.tsx
│   ├── src/routes/AdminPage.tsx
│   ├── src/routes/DisplayPage.tsx
│   ├── src/hooks/usePlayerRealtime.ts
│   ├── src/index.css (Tailwind + theme)
│   └── public/YS Display/*.ttf
├── server/
│   ├── src/index.ts (Express + Socket.IO)
│   ├── src/gameState.ts
│   ├── src/services/{answerScoring,nicknameModeration}.ts
│   └── src/prompts/*.ts
└── shared/
    ├── src/gameConfig.json
    ├── src/types/gameConfig.ts
    └── src/index.ts
```

---

## 8. Load testing

- `loadtest/socketio.yml` — Artillery scenario for 250 concurrent Socket.IO clients (register + submit).
- Configure via env: `SERVER_URL` (API host) and `STAGE_ID` (question stage id).
- Run: `npx artillery run loadtest/socketio.yml`.

---

### Summary

- All stage definitions live in `shared/gameConfig.json`.
- `GameStateManager` is the single source of truth.
- Socket.IO keeps admin/display/player clients in sync in realtime.
- Player answers are moderated/scored via Yandex GPT before scores are applied.
- UI is now branded with Yandex-style yellow/black, with `YS Display` font.
- Known gaps: persistence, auth, Yandex GPT dependency, queueing, resiliency.

This document should give enough detail to maintain, extend, or containerize the system. Update it as architecture evolves.***

