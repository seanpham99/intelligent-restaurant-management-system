import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from websockets import connect as ws_connect
from logger import logger

async def start_proxy(websocket: WebSocket, url):
    await websocket.accept()
    
    try:
        async with ws_connect(url) as target_ws:
            
            # Define the two relay tasks
            upstream_task = asyncio.create_task(forward_upstream(websocket, target_ws))
            downstream_task = asyncio.create_task(forward_downstream(websocket, target_ws))

            # THE FIX: Wait until EITHER task finishes
            done, pending = await asyncio.wait(
                [upstream_task, downstream_task],
                return_when=asyncio.FIRST_COMPLETED
            )

            # Clean up: Cancel whichever task is still running
            for task in pending:
                task.cancel()
                
    except Exception as e:
        logger.error(f"Gateway connection error: {e}")
    finally:
        # This will now definitely run as soon as the Order Service drops
        await websocket.close()
        logger.info("Gateway proxy connection closed.")

async def forward_upstream(client_ws: WebSocket, service_ws):
    """Client -> Order Service"""
    try:
        while True:
            data = await client_ws.receive_text()
            await service_ws.send(data)
    except Exception:
        # If client disconnects or service is unreachable, exit loop
        return

async def forward_downstream(client_ws: WebSocket, service_ws):
    """Order Service -> Client"""
    try:
        async for message in service_ws:
            await client_ws.send_text(message)
    except Exception:
        # If service disconnects, this loop exits immediately
        return