"""
In-memory Menu Repository.
Implements IMenuRepository – swap for a Supabase-backed implementation
without touching service or router code (Dependency Inversion Principle).
"""
import uuid
from typing import Optional
from app.core.interfaces import IMenuRepository
from app.models.menu import MenuItem, MenuItemCreate, MenuItemUpdate


class InMemoryMenuRepository(IMenuRepository):
    def __init__(self) -> None:
        self._store: dict[str, MenuItem] = {}
        self._seed()

    def _seed(self) -> None:
        """Seed with sample menu items."""
        samples = [
            MenuItemCreate(
                name="Caesar Salad",
                description="Crisp romaine with caesar dressing",
                price=8.50,
                category="appetizer",
                estimated_cook_time_seconds=120,
            ),
            MenuItemCreate(
                name="Grilled Salmon",
                description="Atlantic salmon with seasonal vegetables",
                price=24.00,
                category="main",
                estimated_cook_time_seconds=900,
            ),
            MenuItemCreate(
                name="Lemonade",
                description="Freshly squeezed lemonade",
                price=3.50,
                category="drink",
                estimated_cook_time_seconds=30,
            ),
            MenuItemCreate(
                name="Chocolate Lava Cake",
                description="Warm chocolate cake with vanilla ice cream",
                price=7.00,
                category="dessert",
                estimated_cook_time_seconds=600,
            ),
            MenuItemCreate(
                name="Margherita Pizza",
                description="Tomato, mozzarella, basil",
                price=14.00,
                category="main",
                estimated_cook_time_seconds=720,
            ),
        ]
        for s in samples:
            item_id = str(uuid.uuid4())
            self._store[item_id] = MenuItem(id=item_id, **s.model_dump())

    async def get_all(self) -> list[MenuItem]:
        return list(self._store.values())

    async def get_by_id(self, item_id: str) -> Optional[MenuItem]:
        return self._store.get(item_id)

    async def create(self, item: MenuItemCreate) -> MenuItem:
        item_id = str(uuid.uuid4())
        new_item = MenuItem(id=item_id, **item.model_dump())
        self._store[item_id] = new_item
        return new_item

    async def update(self, item_id: str, data: MenuItemUpdate) -> Optional[MenuItem]:
        existing = self._store.get(item_id)
        if not existing:
            return None
        updated_data = existing.model_dump()
        for field, value in data.model_dump(exclude_none=True).items():
            updated_data[field] = value
        self._store[item_id] = MenuItem(**updated_data)
        return self._store[item_id]

    async def delete(self, item_id: str) -> bool:
        if item_id in self._store:
            del self._store[item_id]
            return True
        return False
