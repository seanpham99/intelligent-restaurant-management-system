# Copilot instructions for intelligent-restaurant-management-system

## Build, test, and lint commands

### Backend (`backend/`)
- Prerequisites (from `backend/README.md`): Linux/WSL, Docker + Docker Compose, GNU Make.
- First-time bootstrap: `cd backend && make install`
- Build images: `cd backend && make build`
- Start services: `cd backend && make services-up` (or `cd backend && docker compose up -d`)
- Stop services: `cd backend && make services-down` (or `cd backend && docker compose down`)
- Recreate services: `cd backend && make services-recreate`
- Tests: No automated backend test command is currently defined in this repository.
- Lint: No automated backend lint command is currently defined in this repository.

### Frontend (`frontend/`)
- Install dependencies: `cd frontend && npm install`
- Run locally: `cd frontend && npm run dev`
- Build: `cd frontend && npm run build`
- Lint/type-check: `cd frontend && npm run lint`
- Tests: No `test` script is configured in `frontend/package.json`, so there is currently no full-suite or single-test command.

## High-level architecture

- The backend is a Docker Compose microservice stack (`backend/compose.yml`) with:
  - **gateway** (public API on `:8000`)
  - **menu-service** (menu read APIs + Valkey cache)
  - **order-service** (order creation + websocket status bridge)
  - **background-worker** (queue consumer that writes DB records and pushes status updates)
  - infra services: **Postgres**, **Valkey**, **Mosquitto MQTT**, **pgAdmin**
- `backend/Dockerfile` builds four Python service targets from one base image and injects shared code from `backend/shared`.
- Gateway is the external entry point:
  - HTTP `/menu/*` proxies to menu-service (`gateway/routers/menu_service.py`)
  - HTTP `/order/create` and websocket `/order/status` proxy to order-service (`gateway/routers/order_service.py`, `gateway/ws_proxy.py`)
- Order lifecycle is event-driven through MQTT:
  1. `order-service /order/create` generates UUIDs and publishes orders to topic `order/queue`.
  2. `background-worker` consumes `order/queue`, creates `bill/order/order_item`, updates ingredient amounts, and publishes status events to `order/status/{order_id}`.
  3. Websocket status streaming ends when status reaches `DONE` (`status == 3`).
- `menu-service` serves `/item/list` and `/item/remaining_portions`; `/item/list` is cached in Valkey.
- The frontend is a Vite + React SPA currently driven by local mock menu data (`frontend/src/constants.ts`) and in-memory screen state transitions in `App.tsx` (not route-based navigation).

## Key conventions specific to this codebase

- Shared backend modules are imported as top-level modules (e.g., `from database import ...`, `from dto import ...`) because containers set `PYTHONPATH=/app:/shared`. Preserve this import style unless packaging is changed globally.
- Service resources are initialized/closed in FastAPI lifespan hooks (`main.py` in each service). Access shared resources via dependency providers (`Depends(get_db)`, `Depends(get_client)`, `Depends(get_global_mqtt)`), not ad-hoc per-endpoint clients.
- Public API shape is owned by gateway while internal services keep their own prefixes (`/menu/*` externally maps to `/item/*` internally). Keep this boundary when adding endpoints.
- MQTT topic contract is part of system behavior:
  - queue topic: `order/queue`
  - per-order status topic: `order/status/{order_id}`
  - status enum values (`shared/const.py`): `IN_QUEUE=1`, `PROCESSING=2`, `DONE=3`
- Menu-service cache pattern uses a `BaseDataHandler` implementation plus `get_cached_data(...)` with explicit key + TTL.
- Frontend navigation convention is a central `Screen` union + `currentScreen` state (`frontend/src/types.ts`, `frontend/src/App.tsx`) rather than URL routing.
- Frontend environment variables are loaded with Vite `loadEnv`, and `GEMINI_API_KEY` is injected in `vite.config.ts` (also documented in `frontend/README.md`).
