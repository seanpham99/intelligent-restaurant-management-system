import json

from unittest.mock import patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from routers.order import router, get_global_mqtt


class DummyMQTT:
    def __init__(self, should_fail=False, messages=None):
        self.should_fail = should_fail
        self.calls = []
        self.subscriptions = []
        self.unsubscriptions = []
        self.messages = AsyncMessageIterator(messages or [])

    async def publish(self, topic, payload, qos):
        self.calls.append((topic, payload, qos))
        if self.should_fail:
            raise RuntimeError("publish failed")

    async def subscribe(self, topic):
        self.subscriptions.append(topic)

    async def unsubscribe(self, topic):
        self.unsubscriptions.append(topic)


class AsyncMessageIterator:
    def __init__(self, payloads):
        self.payloads = payloads

    def __aiter__(self):
        self._iter = iter(self.payloads)
        return self

    async def __anext__(self):
        try:
            payload = next(self._iter)
        except StopIteration:
            raise StopAsyncIteration
        return type("MQTTMessage", (), {"payload": payload})()


class DummyStandaloneMQTT:
    def __init__(self, payloads):
        self.messages = AsyncMessageIterator(payloads)
        self.subscriptions = []
        self.entered = False
        self.exited = False

    async def __aenter__(self):
        self.entered = True
        return self

    async def __aexit__(self, exc_type, exc, tb):
        self.exited = True

    async def subscribe(self, topic):
        self.subscriptions.append(topic)


@pytest.fixture
def app_factory():
    def _factory(dummy_mqtt):
        async def fake_get_global_mqtt():
            yield dummy_mqtt

        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[get_global_mqtt] = fake_get_global_mqtt
        return app

    return _factory


def test_create_order_happy_path(app_factory):
    mqtt = DummyMQTT()
    app = app_factory(mqtt)
    client = TestClient(app)

    payload = [{"item_id": 1, "table_id": 5, "amount": 2.0}]
    response = client.post("/order/create", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["item_id"] == 1
    assert body[0]["table_id"] == 5
    assert body[0]["amount"] == 2.0
    assert isinstance(body[0]["id"], str) and body[0]["id"]

    assert len(mqtt.calls) == 1
    topic, published_payload, qos = mqtt.calls[0]
    assert topic == "order/queue"
    assert qos == 1
    decoded = json.loads(published_payload.decode("utf-8"))
    assert decoded[0]["item_id"] == 1


def test_create_order_empty_order_list(app_factory):
    mqtt = DummyMQTT()
    app = app_factory(mqtt)
    client = TestClient(app)

    response = client.post("/order/create", json=[])

    assert response.status_code == 200
    assert response.json() == []
    assert len(mqtt.calls) == 1
    _, published_payload, _ = mqtt.calls[0]
    assert json.loads(published_payload.decode("utf-8")) == []


def test_create_order_null_value_rejected(app_factory):
    mqtt = DummyMQTT()
    app = app_factory(mqtt)
    client = TestClient(app)

    payload = [{"item_id": None, "table_id": 1, "amount": 1.0}]
    response = client.post("/order/create", json=payload)

    assert response.status_code == 422


def test_order_status_websocket_happy_path(app_factory):
    done_payload = json.dumps({"status": 3, "description": "done"}).encode("utf-8")
    mqtt = DummyMQTT(messages=[done_payload])
    app = app_factory(mqtt)
    client = TestClient(app)

    with client.websocket_connect("/order/status") as ws:
        ws.send_json({"order_id": "abc-123"})
        msg = ws.receive_json()

    assert msg["status"] == 3
    assert mqtt.subscriptions == ["order/status/abc-123"]
    assert mqtt.unsubscriptions == ["order/status/abc-123"]


def test_order_status_websocket_empty_order_id_closes(app_factory):
    mqtt = DummyMQTT()
    app = app_factory(mqtt)
    client = TestClient(app)

    with client.websocket_connect("/order/status") as ws:
        ws.send_json({"order_id": ""})

    assert mqtt.subscriptions == []


def test_order_status2_websocket_happy_path(app_factory):
    mqtt = DummyMQTT()
    app = app_factory(mqtt)
    done_payload = json.dumps({"status": 3, "description": "done"}).encode("utf-8")
    standalone = DummyStandaloneMQTT([done_payload])

    with patch("routers.order.create_standalone_mqtt", return_value=standalone):
        client = TestClient(app)
        with client.websocket_connect("/order/status2") as ws:
            ws.send_json({"order_id": "xyz-9"})
            msg = ws.receive_json()

    assert msg["status"] == 3
    assert standalone.entered is True
    assert standalone.exited is True
    assert standalone.subscriptions == ["order/status/xyz-9"]


def test_create_order_invalid_device_mqtt_publish_failure(app_factory):
    mqtt = DummyMQTT(should_fail=True)
    app = app_factory(mqtt)
    client = TestClient(app)

    payload = [{"item_id": 10, "table_id": 2, "amount": 1.0}]
    response = client.post("/order/create", json=payload)

    assert response.status_code == 500
    assert response.json()["detail"] == "Could not queue order"
