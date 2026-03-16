"""
Tests for InventoryService logic.
"""
import pytest
from datetime import datetime, timezone
from app.models.inventory import Ingredient, SensorReading
from app.services.inventory_service import InventoryService


def _make_ingredient(qty: float = 1.0, threshold: float = 0.5) -> Ingredient:
    return Ingredient(
        id="ing-1",
        name="Test Ingredient",
        unit="kg",
        current_quantity=qty,
        low_stock_threshold=threshold,
        updated_at=datetime.now(timezone.utc),
    )


def _make_reading(sensor_type: str, value: float) -> SensorReading:
    return SensorReading(
        sensor_id="s-1",
        sensor_type=sensor_type,
        value=value,
        unit="C" if sensor_type == "temperature" else "kg",
        timestamp=datetime.now(timezone.utc),
    )


class TestInventoryService:
    def setup_method(self):
        self.service = InventoryService()

    def test_no_alert_when_stock_ok(self):
        ing = _make_ingredient(qty=2.0, threshold=0.5)
        assert self.service.check_low_stock(ing) is None

    def test_alert_when_stock_below_threshold(self):
        ing = _make_ingredient(qty=0.3, threshold=0.5)
        alert = self.service.check_low_stock(ing)
        assert alert is not None
        assert alert.alert_type.value == "low_stock"

    def test_alert_when_stock_at_threshold(self):
        ing = _make_ingredient(qty=0.5, threshold=0.5)
        alert = self.service.check_low_stock(ing)
        assert alert is not None

    def test_no_temperature_alert_within_range(self):
        reading = _make_reading("temperature", 5.0)
        assert self.service.check_temperature(reading) is None

    def test_temperature_alert_too_high(self):
        reading = _make_reading("temperature", 15.0)
        alert = self.service.check_temperature(reading)
        assert alert is not None
        assert alert.alert_type.value == "temperature_breach"

    def test_temperature_alert_too_low(self):
        reading = _make_reading("temperature", -35.0)
        alert = self.service.check_temperature(reading)
        assert alert is not None

    def test_load_cell_updates_quantity(self):
        ing = _make_ingredient(qty=5.0)
        reading = _make_reading("load_cell", 3.2)
        updated = self.service.apply_load_cell_reading(ing, reading)
        assert updated.current_quantity == 3.2

    def test_load_cell_negative_clamps_to_zero(self):
        ing = _make_ingredient(qty=5.0)
        reading = _make_reading("load_cell", -1.0)
        updated = self.service.apply_load_cell_reading(ing, reading)
        assert updated.current_quantity == 0.0
