"""
Inventory router: ingredient tracking and alerts.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.inventory import (
    Ingredient,
    IngredientCreate,
    IngredientUpdate,
    InventoryAlert,
    SensorReading,
)
from app.repositories.inventory_repository import InventoryRepository
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/inventory", tags=["inventory"])

_inventory_repo = InventoryRepository()
_inventory_service = InventoryService()


def get_inventory_repo() -> InventoryRepository:
    return _inventory_repo


@router.get("/ingredients", response_model=list[Ingredient])
async def list_ingredients(repo: InventoryRepository = Depends(get_inventory_repo)):
    return await repo.get_all_ingredients()


@router.get("/ingredients/{ingredient_id}", response_model=Ingredient)
async def get_ingredient(
    ingredient_id: str, repo: InventoryRepository = Depends(get_inventory_repo)
):
    ingredient = await repo.get_ingredient_by_id(ingredient_id)
    if not ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")
    return ingredient


@router.post("/ingredients", response_model=Ingredient, status_code=status.HTTP_201_CREATED)
async def create_ingredient(
    payload: IngredientCreate, repo: InventoryRepository = Depends(get_inventory_repo)
):
    return await repo.create_ingredient(payload)


@router.patch("/ingredients/{ingredient_id}", response_model=Ingredient)
async def update_ingredient(
    ingredient_id: str,
    payload: IngredientUpdate,
    repo: InventoryRepository = Depends(get_inventory_repo),
):
    ingredient = await repo.update_ingredient(ingredient_id, payload)
    if not ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")
    # Check for low stock after update
    alert = _inventory_service.check_low_stock(ingredient)
    if alert:
        await repo.save_alert(alert)
    return ingredient


@router.get("/alerts", response_model=list[InventoryAlert])
async def list_alerts(
    resolved: bool | None = None,
    repo: InventoryRepository = Depends(get_inventory_repo),
):
    return await repo.get_all_alerts(resolved=resolved)


@router.patch("/alerts/{alert_id}/resolve", response_model=InventoryAlert)
async def resolve_alert(
    alert_id: str, repo: InventoryRepository = Depends(get_inventory_repo)
):
    alert = await repo.resolve_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return alert


@router.post("/sensor-readings", status_code=status.HTTP_202_ACCEPTED)
async def ingest_sensor_reading(
    reading: SensorReading,
    repo: InventoryRepository = Depends(get_inventory_repo),
):
    """
    Endpoint for IoT sensor data ingestion (also used by the MQTT worker).
    Handles both load-cell and temperature sensor readings.
    """
    if reading.sensor_type == "temperature":
        alert = _inventory_service.check_temperature(reading)
        if alert:
            await repo.save_alert(alert)
        return {"status": "processed", "alert_generated": alert is not None}

    if reading.sensor_type == "load_cell":
        # Look up the ingredient by its stable sensor_id rather than its
        # internal UUID, so real topic names like "bin-salmon" work correctly.
        ingredient = await repo.get_ingredient_by_sensor_id(reading.sensor_id)
        if ingredient:
            updated = _inventory_service.apply_load_cell_reading(ingredient, reading)
            await repo.save_ingredient(updated)
            alert = _inventory_service.check_low_stock(updated)
            if alert:
                await repo.save_alert(alert)
            return {"status": "processed", "alert_generated": alert is not None}
        return {"status": "unknown_sensor"}

    return {"status": "unsupported_sensor_type"}
