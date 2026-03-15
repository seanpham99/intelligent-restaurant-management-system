"""
Integration tests for the FastAPI routes using TestClient.
Redis calls are patched to avoid needing a running Redis instance.
"""
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def mock_redis():
    """Patch Redis cache calls so tests don't need a Redis server."""
    with (
        patch("app.routers.menu.cache_get", new_callable=AsyncMock, return_value=None),
        patch("app.routers.menu.cache_set", new_callable=AsyncMock),
        patch("app.routers.menu.cache_delete", new_callable=AsyncMock),
        patch("app.routers.orders.cache_get", new_callable=AsyncMock, return_value=None),
        patch("app.routers.orders.cache_set", new_callable=AsyncMock),
        patch("app.services.order_service.cache_delete", new_callable=AsyncMock),
        patch("app.services.order_service.enqueue_task", new_callable=AsyncMock),
    ):
        yield


class TestHealthEndpoint:
    def test_health_ok(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


class TestMenuEndpoints:
    def test_list_menu_items(self):
        resp = client.get("/api/v1/menu/")
        assert resp.status_code == 200
        items = resp.json()
        assert isinstance(items, list)
        assert len(items) > 0

    def test_create_and_get_menu_item(self):
        payload = {
            "name": "Test Burger",
            "description": "Juicy burger",
            "price": 12.5,
            "category": "main",
            "estimated_cook_time_seconds": 600,
            "is_available": True,
        }
        create_resp = client.post("/api/v1/menu/", json=payload)
        assert create_resp.status_code == 201
        item_id = create_resp.json()["id"]

        get_resp = client.get(f"/api/v1/menu/{item_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["name"] == "Test Burger"

    def test_get_nonexistent_menu_item_404(self):
        resp = client.get("/api/v1/menu/nonexistent-id")
        assert resp.status_code == 404


class TestOrderEndpoints:
    def test_create_order_success(self):
        # Get a valid menu item id first
        items_resp = client.get("/api/v1/menu/")
        assert items_resp.status_code == 200
        menu_item_id = items_resp.json()[0]["id"]

        order_payload = {
            "table_number": 5,
            "items": [{"menu_item_id": menu_item_id, "quantity": 1}],
        }
        resp = client.post("/api/v1/orders/", json=order_payload)
        assert resp.status_code == 201
        order = resp.json()
        assert order["table_number"] == 5
        assert order["status"] == "pending"

    def test_create_order_unknown_menu_item_422(self):
        order_payload = {
            "table_number": 1,
            "items": [{"menu_item_id": "bad-id", "quantity": 1}],
        }
        resp = client.post("/api/v1/orders/", json=order_payload)
        assert resp.status_code == 422

    def test_update_order_status(self):
        items_resp = client.get("/api/v1/menu/")
        menu_item_id = items_resp.json()[0]["id"]

        create_resp = client.post(
            "/api/v1/orders/",
            json={"table_number": 2, "items": [{"menu_item_id": menu_item_id, "quantity": 1}]},
        )
        order_id = create_resp.json()["id"]

        update_resp = client.patch(f"/api/v1/orders/{order_id}", json={"status": "in_progress"})
        assert update_resp.status_code == 200
        assert update_resp.json()["status"] == "in_progress"

    def test_order_queue_endpoint(self):
        resp = client.get("/api/v1/orders/queue")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


class TestInventoryEndpoints:
    def test_list_ingredients(self):
        resp = client.get("/api/v1/inventory/ingredients")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_sensor_reading_temperature(self):
        from datetime import datetime, timezone

        payload = {
            "sensor_id": "fridge-1",
            "sensor_type": "temperature",
            "value": 15.0,
            "unit": "C",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        resp = client.post("/api/v1/inventory/sensor-readings", json=payload)
        assert resp.status_code == 202
        assert resp.json()["alert_generated"] is True

    def test_alerts_endpoint(self):
        resp = client.get("/api/v1/inventory/alerts")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


class TestAnalyticsEndpoints:
    def test_order_flow(self):
        resp = client.get("/api/v1/analytics/order-flow")
        assert resp.status_code == 200
        data = resp.json()
        assert "total" in data

    def test_kitchen_load(self):
        resp = client.get("/api/v1/analytics/kitchen-load")
        assert resp.status_code == 200

    def test_inventory_summary(self):
        resp = client.get("/api/v1/analytics/inventory-summary")
        assert resp.status_code == 200
        data = resp.json()
        assert "total_ingredients" in data
