import aiomqtt
import os
import asyncio
from typing import AsyncGenerator, Optional
from logger import logger
import uuid
import json

MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USER = os.getenv("MQTT_USER", None)
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", None)

# Global client reference
_mqtt_client: Optional[aiomqtt.Client] = None
# Future to signal that the client is connected and ready
_client_ready = asyncio.Event()

async def init_global_mqtt():
    """
    Initializes the MQTT client and starts the background loop.
    To be called in the FastAPI lifespan startup.
    """
    global _mqtt_client
    
    logger.info(f"Connecting to MQTT Broker at {MQTT_HOST}:{MQTT_PORT}...")
    
    _mqtt_client = aiomqtt.Client(
        hostname=MQTT_HOST,
        port=MQTT_PORT,
        username=MQTT_USER,
        password=MQTT_PASSWORD,
    )
    
    # We enter the context manager to establish the connection
    await _mqtt_client.__aenter__()
    _client_ready.set()
    logger.info("MQTT Client initialized and connected.")

async def close_global_mqtt():
    """
    Closes the MQTT connection.
    To be called in the FastAPI lifespan shutdown.
    """
    global _mqtt_client
    if _mqtt_client:
        _client_ready.clear()
        await _mqtt_client.__aexit__(None, None, None)
        logger.info("MQTT Client connection closed.")

async def get_global_mqtt() -> AsyncGenerator[aiomqtt.Client, None]:
    """
    FastAPI dependency that yields the connected MQTT client.
    """
    if _mqtt_client is None or not _client_ready.is_set():
        logger.error("Attempted to use MQTT before initialization.")
        raise RuntimeWarning("MQTT Client is not ready.")
    yield _mqtt_client

def create_standalone_mqtt(prefix: str = "ws_client") -> aiomqtt.Client:
    """
    Factory function to create a brand new, uniquely identified MQTT client.
    """
    unique_id = f"{prefix}_{uuid.uuid4().hex[:8]}"
    
    return aiomqtt.Client(
        hostname=MQTT_HOST,
        port=MQTT_PORT,
        username=MQTT_USER,
        password=MQTT_PASSWORD,
        identifier=unique_id
    )

def publish(client: aiomqtt.Client, topic: str, payload: dict, loop):
    asyncio.run_coroutine_threadsafe(
        client.publish(topic, payload=json.dumps(payload), qos=1), 
        loop
    )
