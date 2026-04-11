from fastapi import APIRouter, Depends, HTTPException
import httpx

from httpx_client import get_client
from dto import ItemResponse
from logger import logger

MENU_SERVICE_URL = "http://irms-menu-service:8000"

router = APIRouter(
    prefix="/menu",
    tags=["menu item"],
    responses={404: {"description": "Not found"}},
)

@router.get("/list_items")
async def list_items(client: httpx.AsyncClient = Depends(get_client)) -> list[ItemResponse]:
    result = await client.get(MENU_SERVICE_URL + '/item/list')
    return result.json()
