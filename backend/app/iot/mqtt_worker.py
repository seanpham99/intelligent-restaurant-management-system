"""
MQTT Worker: subscribes to IoT sensor topics and forwards readings
to the inventory service via the internal sensor-readings endpoint.

Topics:
  sensors/load_cell/<sensor_id>  → payload: {"value": <float>, "unit": "kg"}
  sensors/temperature/<sensor_id> → payload: {"value": <float>, "unit": "C"}
"""
import asyncio
import json
import logging
import threading
from datetime import datetime, timezone
from typing import Optional

import paho.mqtt.client as mqtt

from app.config import get_settings
from app.models.inventory import SensorReading
from app.repositories.inventory_repository import InventoryRepository
from app.services.inventory_service import InventoryService

logger = logging.getLogger(__name__)

_inventory_repo: Optional[InventoryRepository] = None
_inventory_service: Optional[InventoryService] = None

# A single long-lived event loop shared by all message handlers.
# Created once when the worker starts so we never create/destroy a loop
# per MQTT message (which blocks the MQTT network thread and limits throughput).
_async_loop: Optional[asyncio.AbstractEventLoop] = None


def set_dependencies(repo: InventoryRepository, service: InventoryService) -> None:
    global _inventory_repo, _inventory_service
    _inventory_repo = repo
    _inventory_service = service


def _on_connect(client: mqtt.Client, userdata, flags, rc, properties=None):
    if rc == 0:
        logger.info("MQTT worker connected.")
        settings = get_settings()
        client.subscribe(settings.mqtt_topic_sensors)
        logger.info("Subscribed to %s", settings.mqtt_topic_sensors)
    else:
        logger.error("MQTT connection failed with code %d", rc)


def _on_message(client: mqtt.Client, userdata, msg: mqtt.MQTTMessage):
    if _inventory_repo is None or _inventory_service is None:
        return
    if _async_loop is None or _async_loop.is_closed():
        return
    try:
        parts = msg.topic.split("/")
        # Expected: sensors/<sensor_type>/<sensor_id>
        if len(parts) < 3:
            return
        sensor_type = parts[1]
        sensor_id = parts[2]
        payload = json.loads(msg.payload.decode())
        reading = SensorReading(
            sensor_id=sensor_id,
            sensor_type=sensor_type,
            value=float(payload["value"]),
            unit=payload.get("unit", ""),
            timestamp=datetime.now(timezone.utc),
        )
        # Schedule the async handler on the shared event loop without
        # blocking the MQTT network thread.
        future = asyncio.run_coroutine_threadsafe(_process_reading(reading), _async_loop)
        # Log any exception raised inside _process_reading without blocking.
        future.add_done_callback(
            lambda f: logger.exception("Sensor processing error: %s", f.exception())
            if not f.cancelled() and f.exception() is not None
            else None
        )
    except Exception as exc:  # pylint: disable=broad-except
        logger.exception("Error processing MQTT message: %s", exc)


async def _process_reading(reading: SensorReading) -> None:
    if reading.sensor_type == "temperature":
        alert = _inventory_service.check_temperature(reading)
        if alert:
            await _inventory_repo.save_alert(alert)
    elif reading.sensor_type == "load_cell":
        ingredient = await _inventory_repo.get_ingredient_by_sensor_id(reading.sensor_id)
        if ingredient:
            updated = _inventory_service.apply_load_cell_reading(ingredient, reading)
            await _inventory_repo.save_ingredient(updated)
            alert = _inventory_service.check_low_stock(updated)
            if alert:
                await _inventory_repo.save_alert(alert)


def _run_event_loop(loop: asyncio.AbstractEventLoop) -> None:
    """Entry-point for the dedicated async worker thread.

    Both the event-loop thread and the MQTT network thread are started as
    daemon threads, so the Python interpreter will forcibly terminate them
    when the main process exits.  No explicit ``loop.stop()`` call is needed
    for normal shutdown.
    """
    asyncio.set_event_loop(loop)
    loop.run_forever()


def start_mqtt_worker(
    repo: InventoryRepository, service: InventoryService
) -> threading.Thread:
    global _async_loop

    set_dependencies(repo, service)

    # Create and start the shared event loop in its own daemon thread.
    _async_loop = asyncio.new_event_loop()
    loop_thread = threading.Thread(
        target=_run_event_loop,
        args=(_async_loop,),
        daemon=True,
        name="mqtt-event-loop",
    )
    loop_thread.start()

    settings = get_settings()
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = _on_connect
    client.on_message = _on_message

    def _run():
        try:
            client.connect(settings.mqtt_broker_host, settings.mqtt_broker_port, keepalive=60)
            client.loop_forever()
        except Exception as exc:  # pylint: disable=broad-except
            logger.warning("MQTT worker could not connect: %s", exc)

    thread = threading.Thread(target=_run, daemon=True, name="mqtt-worker")
    thread.start()
    return thread
