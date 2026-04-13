from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
import aiomqtt

from database import engine, verify_connection
# from cache import close_cache_pool
from mqtt_queue import init_global_mqtt, close_global_mqtt, get_global_mqtt
from routers import order

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP ---
    verify_connection() # DB
    await init_global_mqtt()   # MQTT
    
    yield
    
    # --- SHUTDOWN ---
    engine.dispose()
    # close_cache_pool()
    await close_global_mqtt()

app = FastAPI(lifespan=lifespan)
app.include_router(order.router)

# Example usage: Notify a kitchen display system via MQTT
@app.post("/order/{item_id}")
async def place_order(item_id: int, mqtt: aiomqtt.Client = Depends(get_global_mqtt)):
    await mqtt.publish("kitchen/orders", payload=f"New order: {item_id}".encode('utf-8'), qos=1)
    return {"status": "Order sent to kitchen"}