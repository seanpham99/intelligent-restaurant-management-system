"""
Queue Service: Implements smart prioritization of orders.

Priority Score Formula:
  - Base score from elapsed waiting time (seconds since creation).
  - Penalty for high complexity (long cook time) reduces urgency slightly
    so simpler dishes can be completed faster for better table turnover.
  - Station load balancing adjusts score based on current category load.
"""
from datetime import datetime, timezone
from typing import Protocol
from app.models.order import Order, OrderCategory


class IQueueService(Protocol):
    def calculate_priority(self, order: Order, station_loads: dict[str, int]) -> float:
        ...


class QueueService:
    """
    Concrete implementation of smart queue prioritization.
    Open/Closed Principle: extend by subclassing, not modifying.
    """

    # Weights tunable via configuration
    WAIT_TIME_WEIGHT: float = 1.0
    COMPLEXITY_PENALTY_PER_SECOND: float = 0.005
    STATION_LOAD_PENALTY: float = 5.0

    def calculate_priority(
        self, order: Order, station_loads: dict[str, int]
    ) -> float:
        """
        Higher score → higher priority (served first).
        """
        now = datetime.now(timezone.utc)
        created_at = order.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        wait_seconds = (now - created_at).total_seconds()
        priority = wait_seconds * self.WAIT_TIME_WEIGHT

        # Complexity penalty: longer dishes reduce urgency slightly
        total_cook_time = sum(
            item.estimated_cook_time_seconds for item in order.items
        )
        priority -= total_cook_time * self.COMPLEXITY_PENALTY_PER_SECOND

        # Station load penalty: busier stations lower the score
        for item in order.items:
            station_key = item.category.value
            load = station_loads.get(station_key, 0)
            priority -= load * self.STATION_LOAD_PENALTY

        return round(priority, 4)

    def sort_orders(
        self, orders: list[Order], station_loads: dict[str, int]
    ) -> list[Order]:
        """Return orders sorted from highest to lowest priority."""
        for order in orders:
            order.priority_score = self.calculate_priority(order, station_loads)
        return sorted(orders, key=lambda o: o.priority_score, reverse=True)
