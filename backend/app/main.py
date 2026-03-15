"""
Intelligent Restaurant Management System – FastAPI Backend
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import menu, orders, inventory, analytics

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("Starting %s", settings.app_name)

    # Start MQTT worker (non-blocking – connects only if broker is available)
    from app.iot.mqtt_worker import start_mqtt_worker
    from app.routers.inventory import _inventory_repo
    from app.services.inventory_service import InventoryService

    start_mqtt_worker(_inventory_repo, InventoryService())
    logger.info("MQTT worker started (will connect when broker is available)")

    yield

    logger.info("Shutting down %s", settings.app_name)


app = FastAPI(
    title="Intelligent Restaurant Management System",
    description=(
        "Backend API for the IRMS – manages orders, menu items, "
        "inventory tracking, IoT sensor ingestion, and real-time queue prioritization."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api/v1
API_PREFIX = "/api/v1"
app.include_router(menu.router, prefix=API_PREFIX)
app.include_router(orders.router, prefix=API_PREFIX)
app.include_router(inventory.router, prefix=API_PREFIX)
app.include_router(analytics.router, prefix=API_PREFIX)


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "service": get_settings().app_name}
