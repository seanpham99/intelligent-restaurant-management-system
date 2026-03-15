"""
Tests for QueueService prioritization logic.
"""
import time
from datetime import datetime, timezone, timedelta

import pytest
from app.models.order import Order, OrderItem, OrderStatus, OrderCategory
from app.services.queue_service import QueueService


def _make_order(
    order_id: str,
    table: int = 1,
    created_seconds_ago: float = 60.0,
    cook_time: int = 300,
    category: str = "main",
) -> Order:
    now = datetime.now(timezone.utc)
    created = now - timedelta(seconds=created_seconds_ago)
    item = OrderItem(
        id="item-1",
        order_id=order_id,
        menu_item_id="menu-1",
        menu_item_name="Test Dish",
        category=category,
        quantity=1,
        unit_price=10.0,
        estimated_cook_time_seconds=cook_time,
    )
    return Order(
        id=order_id,
        table_number=table,
        status=OrderStatus.PENDING,
        priority_score=0.0,
        created_at=created,
        updated_at=created,
        items=[item],
    )


class TestQueueService:
    def setup_method(self):
        self.service = QueueService()

    def test_older_order_has_higher_priority(self):
        old_order = _make_order("old", created_seconds_ago=120.0)
        new_order = _make_order("new", created_seconds_ago=10.0)
        old_score = self.service.calculate_priority(old_order, {})
        new_score = self.service.calculate_priority(new_order, {})
        assert old_score > new_score

    def test_high_complexity_reduces_priority(self):
        simple = _make_order("simple", cook_time=60)
        complex_ = _make_order("complex", cook_time=1800)
        simple_score = self.service.calculate_priority(simple, {})
        complex_score = self.service.calculate_priority(complex_, {})
        assert simple_score > complex_score

    def test_station_load_reduces_priority(self):
        order = _make_order("order", category="main")
        no_load_score = self.service.calculate_priority(order, {})
        loaded_score = self.service.calculate_priority(order, {"main": 5})
        assert no_load_score > loaded_score

    def test_sort_orders_highest_first(self):
        orders = [
            _make_order("a", created_seconds_ago=10.0),
            _make_order("b", created_seconds_ago=300.0),
            _make_order("c", created_seconds_ago=60.0),
        ]
        sorted_orders = self.service.sort_orders(orders, {})
        ids = [o.id for o in sorted_orders]
        assert ids == ["b", "c", "a"]
