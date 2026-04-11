from fastapi import APIRouter, Depends, HTTPException
# from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select, text
import redis

from database import get_db
from dto import ItemResponse
from cache import get_cache, get_cached_data
from model import MenuItem, ItemType
from handler import BaseDataHandler
from logger import logger

router = APIRouter(
    prefix="/item",
    tags=["menu item"],
    responses={404: {"description": "Not found"}},
)

class FetchListItemsHandler(BaseDataHandler):
    def __init__(self, db):
        self.db = db
    
    def handle(self):
        db = self.db
        try:
            stmt = (
                select(
                    MenuItem.id,
                    MenuItem.name,
                    MenuItem.description,
                    MenuItem.price,
                    ItemType.name.label("type_name")
                )
                .join(ItemType, MenuItem.type_id == ItemType.id)
            )
            logger.debug(f'stmt {stmt}')
            
            result = db.execute(stmt)
            logger.debug(f'result {result}')

            items = result.mappings().all()
            logger.debug(f'items {items}')
            
            return items

        except Exception as e:
            # In a real app, log the error here
            logger.error(f"An unexpected error occurred: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/list")
async def list_items(
    r: redis.Redis = Depends(get_cache),
    db: Session = Depends(get_db)
    ) -> list[ItemResponse]:
    
    CACHE_KEY = 'menu-service:list_items'
    handler = FetchListItemsHandler(db)
    data = get_cached_data(r, CACHE_KEY, handler, 300)
    return data