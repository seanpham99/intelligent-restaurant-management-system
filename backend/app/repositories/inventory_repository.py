"""
In-memory Inventory Repository.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional
from app.models.inventory import Ingredient, IngredientCreate, IngredientUpdate, InventoryAlert


class InventoryRepository:
    def __init__(self) -> None:
        self._ingredients: dict[str, Ingredient] = {}
        self._alerts: dict[str, InventoryAlert] = {}
        self._seed()

    def _seed(self) -> None:
        samples = [
            IngredientCreate(name="Salmon fillet", unit="kg", current_quantity=5.0, low_stock_threshold=1.0),
            IngredientCreate(name="Romaine lettuce", unit="kg", current_quantity=3.0, low_stock_threshold=0.5),
            IngredientCreate(name="Lemon", unit="units", current_quantity=30, low_stock_threshold=5),
            IngredientCreate(name="Chocolate", unit="kg", current_quantity=2.0, low_stock_threshold=0.3),
            IngredientCreate(name="Pizza dough", unit="kg", current_quantity=8.0, low_stock_threshold=1.0),
        ]
        for s in samples:
            iid = str(uuid.uuid4())
            self._ingredients[iid] = Ingredient(
                id=iid, updated_at=datetime.now(timezone.utc), **s.model_dump()
            )

    async def get_all_ingredients(self) -> list[Ingredient]:
        return list(self._ingredients.values())

    async def get_ingredient_by_id(self, ingredient_id: str) -> Optional[Ingredient]:
        return self._ingredients.get(ingredient_id)

    async def save_ingredient(self, ingredient: Ingredient) -> Ingredient:
        self._ingredients[ingredient.id] = ingredient
        return ingredient

    async def create_ingredient(self, data: IngredientCreate) -> Ingredient:
        iid = str(uuid.uuid4())
        ingredient = Ingredient(id=iid, updated_at=datetime.now(timezone.utc), **data.model_dump())
        self._ingredients[iid] = ingredient
        return ingredient

    async def update_ingredient(self, ingredient_id: str, data: IngredientUpdate) -> Optional[Ingredient]:
        existing = self._ingredients.get(ingredient_id)
        if not existing:
            return None
        updated = existing.model_dump()
        for field, value in data.model_dump(exclude_none=True).items():
            updated[field] = value
        updated["updated_at"] = datetime.now(timezone.utc)
        self._ingredients[ingredient_id] = Ingredient(**updated)
        return self._ingredients[ingredient_id]

    async def get_all_alerts(self, resolved: Optional[bool] = None) -> list[InventoryAlert]:
        alerts = list(self._alerts.values())
        if resolved is not None:
            alerts = [a for a in alerts if a.resolved == resolved]
        return alerts

    async def save_alert(self, alert: InventoryAlert) -> InventoryAlert:
        self._alerts[alert.id] = alert
        return alert

    async def resolve_alert(self, alert_id: str) -> Optional[InventoryAlert]:
        alert = self._alerts.get(alert_id)
        if alert:
            alert.resolved = True
            self._alerts[alert_id] = alert
        return alert
