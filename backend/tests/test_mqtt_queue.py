import pytest

import mqtt_queue


@pytest.mark.asyncio
async def test_create_standalone_mqtt_happy_path(monkeypatch):
    fake_client = object()

    class FakeFactory:
        def __init__(self, **kwargs):
            self.kwargs = kwargs

    created = {}

    def fake_aiomqtt_client(**kwargs):
        created.update(kwargs)
        return fake_client

    monkeypatch.setattr(mqtt_queue.aiomqtt, "Client", fake_aiomqtt_client)

    client = mqtt_queue.create_standalone_mqtt(prefix="order_track")

    assert client is fake_client
    assert created["hostname"] == mqtt_queue.MQTT_HOST
    assert created["port"] == mqtt_queue.MQTT_PORT
    assert created["identifier"].startswith("order_track_")


@pytest.mark.asyncio
async def test_get_global_mqtt_invalid_device_not_initialized():
    mqtt_queue._mqtt_client = None
    mqtt_queue._client_ready.clear()

    with pytest.raises(RuntimeWarning, match="MQTT Client is not ready"):
        agen = mqtt_queue.get_global_mqtt()
        await agen.__anext__()


@pytest.mark.asyncio
async def test_init_and_close_global_mqtt_happy_path(monkeypatch):
    class FakeClient:
        def __init__(self, **kwargs):
            self.kwargs = kwargs
            self.entered = False
            self.exited = False

        async def __aenter__(self):
            self.entered = True
            return self

        async def __aexit__(self, exc_type, exc, tb):
            self.exited = True

    fake_instance = FakeClient()

    def fake_factory(**kwargs):
        fake_instance.kwargs = kwargs
        return fake_instance

    monkeypatch.setattr(mqtt_queue.aiomqtt, "Client", fake_factory)

    await mqtt_queue.init_global_mqtt()

    assert mqtt_queue._mqtt_client is fake_instance
    assert mqtt_queue._client_ready.is_set()
    assert fake_instance.entered is True

    await mqtt_queue.close_global_mqtt()

    assert mqtt_queue._client_ready.is_set() is False
    assert fake_instance.exited is True
