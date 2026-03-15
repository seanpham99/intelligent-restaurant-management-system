"""
Tests for OrderService business logic.
"""
import pytest
from app.models.order import OrderCreate, OrderItemCreate, OrderStatus
from app.models.menu import MenuItem, MenuCategory
from app.services.order_service import OrderService
from app.services.queue_service import QueueService


def _make_menu_map():
    item = MenuItem(
        id="menu-1",
        name="Grilled Salmon",
        price=24.0,
        category=MenuCategory.MAIN,
        estimated_cook_time_seconds=900,
        is_available=True,
    )
    unavailable = MenuItem(
        id="menu-2",
        name="Sold Out Dish",
        price=10.0,
        category=MenuCategory.MAIN,
        estimated_cook_time_seconds=300,
        is_available=False,
    )
    return {item.id: item, unavailable.id: unavailable}


class TestOrderService:
    def setup_method(self):
        self.service = OrderService(QueueService())
        self.menu_map = _make_menu_map()

    def test_build_order_success(self):
        payload = OrderCreate(
            table_number=3,
            items=[OrderItemCreate(menu_item_id="menu-1", quantity=2)],
        )
        order = self.service.build_order(payload, self.menu_map)
        assert order.table_number == 3
        assert len(order.items) == 1
        assert order.items[0].unit_price == 24.0
        assert order.status == OrderStatus.PENDING

    def test_build_order_unknown_item_raises(self):
        payload = OrderCreate(
            table_number=1,
            items=[OrderItemCreate(menu_item_id="unknown-id", quantity=1)],
        )
        with pytest.raises(ValueError, match="not found"):
            self.service.build_order(payload, self.menu_map)

    def test_build_order_unavailable_item_raises(self):
        payload = OrderCreate(
            table_number=1,
            items=[OrderItemCreate(menu_item_id="menu-2", quantity=1)],
        )
        with pytest.raises(ValueError, match="unavailable"):
            self.service.build_order(payload, self.menu_map)
