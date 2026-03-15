# intelligent-restaurant-management-system

A full-stack **Intelligent Restaurant Management System (IRMS)** leveraging IoT devices to streamline customer ordering, real-time kitchen queue management, and inventory tracking.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        IRMS Architecture                            │
├──────────────┬─────────────────────────┬───────────────────────────┤
│   Frontend   │       Backend           │      Infrastructure       │
│  (Vite+React)│      (FastAPI)          │                           │
│              │                         │  Supabase (PostgreSQL)    │
│ Customer UI  │  Order Management API   │  Supabase Realtime        │
│ KDS          │  Menu API               │  Redis (cache + queue)    │
│ Manager Dash │  Inventory API          │  MQTT Broker              │
│              │  Analytics API          │  IoT Sensors              │
│              │  MQTT Worker            │                           │
└──────────────┴─────────────────────────┴───────────────────────────┘
```

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + TypeScript + React |
| Backend | FastAPI (Python 3.12) |
| Database | Supabase (PostgreSQL) |
| Real-time | Supabase Realtime (WebSockets) |
| Cache / Queue | Redis |
| IoT Ingestion | MQTT (Eclipse Mosquitto) |
| Deployment | Docker / Railway |

## Features

- **IoT-Based Ordering** – Smart menu UI for customers (QR/tablet)
- **Real-Time KDS** – Kitchen Display System with live order queue (3-second polling + Supabase Realtime)
- **Smart Queue Prioritization** – Priority score based on wait time, dish complexity, and station load
- **Inventory Tracking** – Load-cell and temperature sensor ingestion via MQTT
- **Manager Dashboard** – Order flow analytics, kitchen load, inventory summary, alert management
- **SOLID Architecture** – Abstract interfaces, dependency injection, single-responsibility services

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local frontend development)
- Python 3.12+ (for local backend development)

### Quick Start with Docker

```bash
cp .env.example .env
# Edit .env with your Supabase credentials

docker compose up --build
```

- **Frontend:** http://localhost
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

### Local Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Run tests:**
```bash
cd backend
python -m pytest tests/ -v
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Database

Run `supabase/schema.sql` in your Supabase SQL editor to create all tables and set up Row-Level Security policies.

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application + lifespan
│   │   ├── config.py            # Settings (pydantic-settings)
│   │   ├── models/              # Pydantic request/response models
│   │   ├── routers/             # API endpoints
│   │   ├── services/            # Business logic (SOLID)
│   │   ├── repositories/        # Data access layer
│   │   ├── iot/                 # MQTT worker
│   │   └── cache/               # Redis client
│   ├── tests/                   # pytest test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/               # CustomerMenuPage, KitchenDisplayPage, ManagerDashboardPage
│   │   ├── components/          # MenuItemCard, OrderCard, InventoryAlertCard
│   │   ├── hooks/               # usePolling, useRealtimeTable
│   │   ├── services/            # api.ts, supabase.ts
│   │   └── types/               # TypeScript interfaces
│   ├── Dockerfile
│   └── nginx.conf
├── supabase/
│   └── schema.sql               # Database schema + RLS policies
├── docker-compose.yml
├── mosquitto.conf
└── .env.example
```
