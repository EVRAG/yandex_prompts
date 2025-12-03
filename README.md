# Prompt Night – Railways Voting Game

This monorepo now powers a single timed voting experience that runs across three surfaces:

1. **Player (`/`)** – mobile-friendly UI where guests pick exactly one concept image.
2. **Admin (`/admin`)** – control room used to start/stop the round, monitor the countdown and see vote totals.
3. **Display (`/display`)** – stage screen that mirrors the current phase for the audience.

The experience has only three phases:

| Phase       | What players see                         | Admin control                         |
|-------------|------------------------------------------|---------------------------------------|
| `waiting`   | “Игра скоро начнётся”                    | Prep state, votes reset               |
| `voting`    | Image grid with “Выбрать” buttons        | 3‑minute timer starts automatically   |
| `collecting`| “Спасибо, собираем данные”               | Votes locked; totals visible in admin |

The repository is split into workspaces:

- `server/` – Node 20 + Express + Socket.IO backend.
- `client/` – Vite + React + Tailwind UI bundle.
- `shared/` – TypeScript definitions and the single voting task definition.

---

## 1. Shared Voting Data (`shared/`)

- `shared/src/voteOptions.ts` defines:
  - `votingTask`: id, title, instructions, duration (3 minutes) and the list of concept images.
  - `VotingPhase`, `VoteResult`, `VotingSnapshot`, `AdminVotingSnapshot` types.
- `shared/src/index.ts` re-exports these symbols for both server and client workspaces.
- `npm run build --workspace shared` compiles the package into `dist/`. The server build automatically runs this step via `prebuild`.

To change the game, edit the options array (ids, titles, descriptions, image URLs) or metadata in `votingTask`.

---

## 2. Backend (`server/`)

### 2.1 Runtime

- `server/src/index.ts`
  - Sets up Express (`/health`, `/config`, `/state`, `/admin/phase`).
  - Boots Socket.IO with three logical rooms (`client`, `display`, `admin`).
  - Broadcasts snapshots whenever votes or phases change.

### 2.2 VotingStateManager

- `server/src/gameState.ts` exports `VotingStateManager`.
- Responsibilities:
  - Holds the current `phase`, running timer (`votingEndsAt`), per-socket votes and aggregate counts.
  - `startVoting()` resets counts, clears previous socket selections, starts a 3‑minute timeout and exposes `timeLeftSeconds`.
  - `setPhase()` handles manual overrides; switching back to `waiting` clears previous votes.
  - `castVote(socketId, optionId)` enforces one vote per socket while phase is `voting`.
  - `getPublicSnapshot()` returns `VotingSnapshot` for players/display.
  - `getAdminSnapshot()` extends it with `results` and `totalVotes`.
  - Notifies the server via `onAutoCollect` when the timer expires so that the phase flips to `collecting` and new snapshots are pushed automatically.

### 2.3 Socket events

| Event              | Emitted by | Payload                                 |
|--------------------|------------|-----------------------------------------|
| `config:update`    | server     | `VotingTask` (sent to every role)       |
| `state:update`     | server     | `VotingSnapshot` or `AdminVotingSnapshot`|
| `player:vote`      | client     | `{ optionId }`                          |
| `player:voted`     | server     | `{ optionId }` (echo back on success)   |
| `player:error`     | server     | `{ message }`                           |
| `admin:set-phase`  | admin      | `{ phase: 'waiting'|'voting'|'collecting' }` |
| `admin:error`      | server     | `{ message }`                           |
| `admin:sync`       | admin      | request fresh snapshots/config          |

### 2.4 REST API

| Endpoint         | Method | Description                                        |
|------------------|--------|----------------------------------------------------|
| `/health`        | GET    | `{ status: 'ok', updatedAt }`                      |
| `/config`        | GET    | `VotingTask` (public)                              |
| `/state`         | GET    | `AdminVotingSnapshot` (used for initial hydration) |
| `/admin/phase`   | POST   | `{ phase }` – same validation as the socket event  |

There is intentionally no registration, scoring, or OpenAI dependency anymore.

---

## 3. Frontend (`client/`)

### 3.1 Hooks

- `usePlayerRealtime`
  - Connects as `client`.
  - Prefetches task/state via REST, subscribes to socket events, tracks the user’s local selection (stored in `localStorage` under `prompt-night-vote-{taskId}`).
- `useAdminRealtime`
  - Connects as `admin`.
  - Provides `setPhase` and `refresh` helpers plus live `AdminVotingSnapshot`.
- `useDisplayRealtime`
  - Connects as `display`.
  - Only needs `VotingSnapshot` for presentation.

### 3.2 Routes

- `PlayerPage.tsx`
  - Shows a simple status header, countdown (during voting), image cards with “Выбрать”, and state-specific messages.
  - Buttons disable after a vote is accepted (`player:voted`).
- `AdminPage.tsx`
  - Buttons for phase switching, timer indicator, live total votes, per-option counts with progress bars.
- `DisplayPage.tsx`
  - Large-format layout with messaging per phase and a gallery of the current concepts during voting.

Tailwind v4 + Yandex-style palette are used throughout; no registration form or leaderboard remains.

---

## 4. Running Locally

```
npm install               # installs all workspaces

# build shared types once (server build does this automatically)
npm run build --workspace shared

# dev servers (in separate terminals)
npm run dev --workspace server   # http://localhost:4000
npm run dev --workspace client   # http://localhost:5173
```

`client` relies on `VITE_SERVER_URL` (defaults to `http://localhost:4000`). The Docker setup described in `DEPLOYMENT.md` builds both services and wires the env vars automatically.

---

## 5. Deployment Highlights

- `.env.example` in the repo root controls published ports and the public API URL for the client build.
- `Dockerfile.server` and `client/Dockerfile` produce minimal runtime images.
- `docker-compose.yml` starts both services; set `CLIENT_HOST_PORT=80` and `CLIENT_PUBLIC_SERVER_URL=https://your-domain` to serve through nginx/Caddy with TLS.
- `DEPLOYMENT.md` contains a step-by-step guide (SSH keys, Docker Compose, HTTPS hardening).

---

## 6. Known Limitations & Next Steps

1. **Ephemeral memory store** – restarting the server clears votes. Persisting to Redis/Postgres would allow history and auditing.
2. **No authentication** – anyone connecting with `role: 'admin'` gains control. Protect via a secret, token, or proxy that gates the socket.
3. **One vote per socket** – refreshing the page creates a new socket id, so determined users could double vote. Mitigate via device fingerprinting or short-lived session tokens.
4. **Single round** – the timer always resets to 3 minutes. If multiple rounds are needed, extend `VotingTask` to carry scenarios or allow reloading different option arrays.
5. **Display-only results** – aggregated counts are only emitted to admins by design. If you want the stage screen to show leaders, broadcast `AdminVotingSnapshot` to `display` as well.

---

## 7. File Map

```
/
├── package.json
├── README.md
├── DEPLOYMENT.md
├── shared/
│   └── src/voteOptions.ts
├── server/
│   ├── src/index.ts
│   └── src/gameState.ts
└── client/
    ├── src/hooks/usePlayerRealtime.ts
    ├── src/hooks/useAdminRealtime.ts
    ├── src/hooks/useDisplayRealtime.ts
    ├── src/routes/PlayerPage.tsx
    ├── src/routes/AdminPage.tsx
    └── src/routes/DisplayPage.tsx
```

This setup should give you all the context you need to extend or rebrand the Railways voting experience. Update the shared voting options, tweak the UI, or add persistence/auth as your next iteration. Refer to `DEPLOYMENT.md` for Docker/HTTPS instructions.***

