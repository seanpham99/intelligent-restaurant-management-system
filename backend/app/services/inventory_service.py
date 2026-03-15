"""
Inventory Service: handles ingredient tracking and alert generation.
"""
from typing import Optional
from datetime import datetime, timezone
import uuid
from app.models.inventory import Ingredient, InventoryAlert, AlertType, SensorReading


class InventoryService:
    LOW_TEMPERATURE_THRESHOLD = -30.0  # °C – freezer
    HIGH_TEMPERATURE_THRESHOLD = 8.0   # °C – fridge upper safe limit

    def check_low_stock(self, ingredient: Ingredient) -> Optional[InventoryAlert]:
        if ingredient.current_quantity <= ingredient.low_stock_threshold:
            return InventoryAlert(
                id=str(uuid.uuid4()),
                alert_type=AlertType.LOW_STOCK,
                message=(
                    f"'{ingredient.name}' is low: "
                    f"{ingredient.current_quantity} {ingredient.unit} remaining "
                    f"(threshold: {ingredient.low_stock_threshold} {ingredient.unit})."
                ),
                ingredient_id=ingredient.id,
                resolved=False,
                created_at=datetime.now(timezone.utc),
            )
        return None

    def check_temperature(self, reading: SensorReading) -> Optional[InventoryAlert]:
        if reading.value > self.HIGH_TEMPERATURE_THRESHOLD or reading.value < self.LOW_TEMPERATURE_THRESHOLD:
            return InventoryAlert(
                id=str(uuid.uuid4()),
                alert_type=AlertType.TEMPERATURE_BREACH,
                message=(
                    f"Temperature sensor '{reading.sensor_id}' reported "
                    f"{reading.value}{reading.unit}, which is outside safe range."
                ),
                sensor_id=reading.sensor_id,
                resolved=False,
                created_at=datetime.now(timezone.utc),
            )
        return None

    def apply_load_cell_reading(
        self, ingredient: Ingredient, reading: SensorReading
    ) -> Ingredient:
        """Update ingredient quantity from load-cell sensor reading (value in kg/g)."""
        ingredient.current_quantity = max(0.0, reading.value)
        ingredient.updated_at = datetime.now(timezone.utc)
        return ingredient
