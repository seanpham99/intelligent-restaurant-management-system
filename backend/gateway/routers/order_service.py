import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from fastapi.encoders import jsonable_encoder
from websockets import connect as ws_connect

from logger import logger
from ws_proxy import start_proxy
from dto import OrderInput, OrderResponse
from httpx_client import get_client

router = APIRouter(
    prefix="/order",
    tags=["menu item"],
    responses={404: {"description": "Not found"}}
)

# The internal URL of your Order Service (accessible via your private network)
ORDER_SERVICE_HOST = ""
ORDER_SERVICE_WS_URL = f"ws://{ORDER_SERVICE_HOST}:8000"
ORDER_SERVICE_URL = f"http://{ORDER_SERVICE_HOST}:8000"


@router.websocket("/status")
async def gateway_order_proxy(websocket: WebSocket):
    await start_proxy(websocket, ORDER_SERVICE_WS_URL + '/order/status2')

@router.post('/create')
async def create_order(
    orders: list[OrderInput], 
    client: httpx.AsyncClient = Depends(get_client)
) -> list[OrderResponse]:
    result = await client.post(ORDER_SERVICE_URL + '/order/create', json=jsonable_encoder(orders))
    return result.json()
