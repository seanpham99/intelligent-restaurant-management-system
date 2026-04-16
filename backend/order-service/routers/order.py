from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder
import aiomqtt
import json

from dto import OrderInput, OrderResponse
from logger import logger
from mqtt_queue import get_global_mqtt, create_standalone_mqtt
from const import ORDER_STATUS

router = APIRouter(
    prefix="/order",
    tags=["order item"],
    responses={404: {"description": "Not found"}},
)

@router.post('/create')
async def create_order(
    orders: list[OrderInput], 
    mqtt: aiomqtt.Client = Depends(get_global_mqtt)
) -> list[OrderResponse]:
    """
    Receives a new order and pushes it to the MQTT message queue.
    """
    try:
        # 1. Convert the Pydantic model to a JSON-serializable dictionary
        # This handles the string/int/float types correctly
        order_outputs = []
        order_ids = []
        for order in orders:
            order_output = order.model_dump()
            order_output['id'] = str(uuid4())
            order_ids.append({'id': order_output['id']})
            order_outputs.append(order_output)
        
        # 2. Convert dictionary to JSON string
        payload = json.dumps(order_outputs).encode('utf-8')
        
        # 3. Publish to MQTT
        # We use qos=1 (At Least Once) to ensure the message hits the broker
        await mqtt.publish(
            topic="order/queue",
            payload=payload,
            qos=1
        )
        
        return order_outputs

    except Exception as e:
        # Log the error using your logger
        logger.error(f"Failed to publish order: {e}")
        raise HTTPException(status_code=500, detail="Could not queue order")


@router.websocket("/status")
async def order_status_websocket(
    websocket: WebSocket, 
    mqtt: aiomqtt.Client = Depends(get_global_mqtt)
):
    # 1. Accept the WebSocket connection
    await websocket.accept()
    
    topic = None
    try:
        # 2. Receive the initial order_id from the client
        # Expected format: {"order_id": "12345"}
        data = await websocket.receive_json()
        order_id = data.get("order_id")
        logger.info(f'data from websocket: {data}')
        
        if not order_id:
            await websocket.close(code=1003) # Unsupported Data
            return

        topic = f"order/status/{order_id}"
        logger.info(f"WebSocket client tracking order: {order_id}")

        # 3. Subscribe to the MQTT topic
        await mqtt.subscribe(topic)
        
        # 4. Listen for MQTT messages and relay them to WebSocket
        async for message in mqtt.messages:
            payload_str = message.payload.decode()
            payload_data = json.loads(payload_str)
            
            # Send data to the frontend
            await websocket.send_json(payload_data)
            logger.debug(f"Relayed MQTT status for {order_id}: {payload_data}")

            # 5. Check for the termination condition {"status": 3}
            if payload_data.get("status") == 3:
                logger.info(f"Order {order_id} reached final status. Closing connection.")
                break

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected.")
    except Exception as e:
        logger.error(f"Error in order status bridge: {e}")
    finally:
        if topic:
            await mqtt.unsubscribe(topic)
        # 6. Ensure the WebSocket is closed if the loop breaks
        try:
            await websocket.close()
        except:
            pass

@router.websocket("/status2")
async def order_status_websocket(websocket: WebSocket):
    await websocket.accept()
    
    # 1. Create the isolated client using our factory
    client = create_standalone_mqtt(prefix="order_track")
    
    try:
        # Receive setup data from client
        data = await websocket.receive_json()
        order_id = data.get("order_id")
        topic = f"order/status/{order_id}"

        # 2. Use 'async with' to manage the unique connection
        async with client:
            await client.subscribe(topic)
            
            async for message in client.messages:
                payload = json.loads(message.payload.decode())
                await websocket.send_json(payload)

                if payload.get("status") == ORDER_STATUS.DONE.value:
                    break

    except WebSocketDisconnect:
        pass 
    finally:
        # Client automatically disconnects thanks to 'async with'
        try:
            await websocket.close()
        except:
            pass