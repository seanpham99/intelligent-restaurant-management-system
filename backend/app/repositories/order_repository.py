"""
In-memory Order Repository.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional
from app.models.order import Order, OrderCreate, OrderStatus


class OrderRepository:
    def __init__(self) -> None:
        self._store: dict[str, Order] = {}

    async def get_all(self, status: Optional[OrderStatus] = None) -> list[Order]:
        orders = list(self._store.values())
        if status:
            orders = [o for o in orders if o.status == status]
        return orders

    async def get_by_id(self, order_id: str) -> Optional[Order]:
        return self._store.get(order_id)

    async def save(self, order: Order) -> Order:
        self._store[order.id] = order
        return order

    async def delete(self, order_id: str) -> bool:
        if order_id in self._store:
            del self._store[order_id]
            return True
        return False

    async def get_active_station_loads(self) -> dict[str, int]:
        """Count active (pending/in_progress) items per category/station."""
        loads: dict[str, int] = {}
        for order in self._store.values():
            if order.status in (OrderStatus.PENDING, OrderStatus.IN_PROGRESS):
                for item in order.items:
                    loads[item.category.value] = loads.get(item.category.value, 0) + 1
        return loads
