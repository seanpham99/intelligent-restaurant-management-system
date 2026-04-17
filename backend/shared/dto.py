from pydantic import BaseModel, ConfigDict, EmailStr
from typing import List, Optional

class BaseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class ItemResponse(BaseDTO):
    id: str
    name: str
    description: str
    price: float
    category: str
    currency: str
    popular: bool
    soldOut: bool
    imageUrl: Optional[str] = None

class PortionResponse(BaseDTO):
    remaining_portions: int

class OrderInput(BaseDTO):
    item_id: int
    table_id: int
    amount: float  

class OrderResponse(OrderInput):
    id: Optional[str] = None

class OrderIdResponse(BaseDTO):
    id: str
