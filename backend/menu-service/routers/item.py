from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

router = APIRouter(
    prefix="/item",
    tags=["menu item"],
    responses={404: {"description": "Not found"}},
)

class Item(BaseModel):
    id: int
    name: str
    description: str
    price: float
    type_name: str

@router.get("/list")
async def list_items() -> list[Item]:
    fake_items_db = [
        Item(id=1, name='Test', description='this is a description', price=100, type_name='entree'),
        Item(id=1, name='Test', description='this is a description', price=100, type_name='entree'),
    ]
    return fake_items_db
