from enum import Enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class AlertType(str, Enum):
    LOW_STOCK = "low_stock"
    TEMPERATURE_BREACH = "temperature_breach"


class IngredientBase(BaseModel):
    name: str
    unit: str
    current_quantity: float = Field(ge=0)
    low_stock_threshold: float = Field(ge=0)
    # Optional stable identifier published by the physical load-cell sensor.
    # Allows the system to route MQTT readings to the correct ingredient
    # without relying on the internal UUID.
    sensor_id: Optional[str] = None


class IngredientCreate(IngredientBase):
    pass


class IngredientUpdate(BaseModel):
    current_quantity: Optional[float] = Field(default=None, ge=0)
    low_stock_threshold: Optional[float] = Field(default=None, ge=0)


class Ingredient(IngredientBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    updated_at: datetime


class SensorReading(BaseModel):
    sensor_id: str
    sensor_type: str  # "load_cell" | "temperature"
    value: float
    unit: str
    timestamp: datetime


class InventoryAlert(BaseModel):
    id: str
    alert_type: AlertType
    message: str
    ingredient_id: Optional[str] = None
    sensor_id: Optional[str] = None
    resolved: bool = False
    created_at: datetime
