from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class MenuCategory(str, Enum):
    DRINK = "drink"
    APPETIZER = "appetizer"
    MAIN = "main"
    DESSERT = "dessert"


class MenuItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = Field(ge=0)
    category: MenuCategory
    estimated_cook_time_seconds: int = Field(ge=0)
    is_available: bool = True


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0)
    category: Optional[MenuCategory] = None
    estimated_cook_time_seconds: Optional[int] = Field(default=None, ge=0)
    is_available: Optional[bool] = None


class MenuItem(MenuItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
