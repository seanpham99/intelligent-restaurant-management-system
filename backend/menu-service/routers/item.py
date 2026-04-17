from fastapi import APIRouter, Depends, HTTPException
# from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select, text, func, and_, cast, BigInteger, case, String
import redis

from database import get_db
from dto import ItemResponse, PortionResponse
from cache import get_cache, get_cached_data
from model import MenuItem, ItemType, IngredientAmount, Ingredient, ItemIngredient
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
            category_expr = case(
                (ItemType.name == "Khai vị", "Appetizers"),
                (ItemType.name == "Chính", "Main Course"),
                (ItemType.name == "Đồ uống", "Drinks"),
                (ItemType.name == "Tráng miệng", "Desserts"),
                else_="Appetizers",
            ).label("category")

            stmt = (
                select(
                    cast(MenuItem.id, String).label("id"),
                    MenuItem.name,
                    MenuItem.description,
                    MenuItem.price,
                    category_expr,
                    MenuItem.currency,
                    MenuItem.popular,
                    MenuItem.sold_out.label("soldOut"),
                    MenuItem.image_url.label("imageUrl"),
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

@router.get('/remaining_portions')
def get_remaining_portions(item_id: int, db: Session = Depends(get_db)) -> PortionResponse:
    # latest Stock Ranking ---
    rank_window = func.rank().over(
        partition_by=IngredientAmount.ingredient_id,
        order_by=IngredientAmount.created_at.desc()
    ).label("rank_number")

    stage1 = (
        select(
            IngredientAmount.ingredient_id,
            IngredientAmount.amount.label("stock_amount"),
            rank_window
        )
        .cte("stage1")
    )
    # retrive recipe
    stage2 = (
        select(
            Ingredient.id.label("ingredient_id"),
            ItemIngredient.amount.label("needed_amount")
        )
        .join(Ingredient, Ingredient.id == ItemIngredient.ingredient_id)
        .where(ItemIngredient.item_id == item_id)
        .cte("stage2")
    )
    # calcuation remaining portions
    portions_calc = cast(stage1.c.stock_amount / stage2.c.needed_amount, BigInteger)
    
    stmt = (
        select(
            func.min(portions_calc).label("remaining_portions")
        )
        .select_from(stage2)
        .join(stage1, stage2.c.ingredient_id == stage1.c.ingredient_id)
        .where(stage1.c.rank_number == 1)
    )

    result = db.execute(stmt).mappings().one()
    logger.info(f'portions: {result}')
    
    return result
