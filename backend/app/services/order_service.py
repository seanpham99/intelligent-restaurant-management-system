"""
Order Service: business logic for order lifecycle.
Single Responsibility: only handles order-level operations.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional
from app.models.order import Order, OrderCreate, OrderItem, OrderStatus, OrderUpdate
from app.models.menu import MenuItem
from app.services.queue_service import QueueService
from app.cache.redis_client import cache_delete, enqueue_task


class OrderService:
    def __init__(self, queue_service: QueueService) -> None:
        self._queue = queue_service

    def build_order(
        self,
        payload: OrderCreate,
        menu_items: dict[str, MenuItem],
    ) -> Order:
        """
        Validate payload against menu and build a full Order object.
        Raises ValueError for unknown or unavailable menu items.
        """
        now = datetime.now(timezone.utc)
        order_id = str(uuid.uuid4())
        items: list[OrderItem] = []

        for raw in payload.items:
            menu_item = menu_items.get(raw.menu_item_id)
            if menu_item is None:
                raise ValueError(f"Menu item '{raw.menu_item_id}' not found.")
            if not menu_item.is_available:
                raise ValueError(f"Menu item '{menu_item.name}' is currently unavailable.")

            items.append(
                OrderItem(
                    id=str(uuid.uuid4()),
                    order_id=order_id,
                    menu_item_id=raw.menu_item_id,
                    menu_item_name=menu_item.name,
                    category=menu_item.category,
                    quantity=raw.quantity,
                    notes=raw.notes,
                    unit_price=menu_item.price,
                    estimated_cook_time_seconds=menu_item.estimated_cook_time_seconds,
                )
            )

        order = Order(
            id=order_id,
            table_number=payload.table_number,
            status=OrderStatus.PENDING,
            priority_score=0.0,
            created_at=now,
            updated_at=now,
            items=items,
        )
        return order

    def apply_update(self, order: Order, update: OrderUpdate) -> Order:
        if update.status is not None:
            order.status = update.status
        if update.priority_score is not None:
            order.priority_score = update.priority_score
        order.updated_at = datetime.now(timezone.utc)
        return order

    async def invalidate_queue_cache(self) -> None:
        await cache_delete("order_queue")

    async def schedule_reprioritization(self, order_id: str) -> None:
        await enqueue_task(
            "queue_reprioritization",
            {"order_id": order_id, "triggered_at": datetime.now(timezone.utc).isoformat()},
        )
