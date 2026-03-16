from enum import Enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class OrderStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    READY = "ready"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class OrderCategory(str, Enum):
    DRINK = "drink"
    APPETIZER = "appetizer"
    MAIN = "main"
    DESSERT = "dessert"


class OrderItemBase(BaseModel):
    menu_item_id: str
    quantity: int = Field(ge=1)
    notes: Optional[str] = None


class OrderItemCreate(OrderItemBase):
    pass


class OrderItem(OrderItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_id: str
    menu_item_name: str
    category: OrderCategory
    unit_price: float
    estimated_cook_time_seconds: int


class OrderBase(BaseModel):
    table_number: int = Field(ge=1)


class OrderCreate(OrderBase):
    items: list[OrderItemCreate]


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    priority_score: Optional[float] = None


class Order(OrderBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: OrderStatus
    priority_score: float
    created_at: datetime
    updated_at: datetime
    items: list[OrderItem] = []
