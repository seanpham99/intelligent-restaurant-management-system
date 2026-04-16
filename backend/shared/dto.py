from pydantic import BaseModel, ConfigDict, EmailStr
from typing import List, Optional

class BaseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class ItemResponse(BaseDTO):
    id: int
    name: str
    description: str
    price: float
    type_name: str
    image_base64: str

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