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