from abc import ABC, abstractmethod
from typing import Optional
from app.models.menu import MenuItem, MenuItemCreate, MenuItemUpdate


class IMenuRepository(ABC):
    @abstractmethod
    async def get_all(self) -> list[MenuItem]:
        pass

    @abstractmethod
    async def get_by_id(self, item_id: str) -> Optional[MenuItem]:
        pass

    @abstractmethod
    async def create(self, item: MenuItemCreate) -> MenuItem:
        pass

    @abstractmethod
    async def update(self, item_id: str, data: MenuItemUpdate) -> Optional[MenuItem]:
        pass

    @abstractmethod
    async def delete(self, item_id: str) -> bool:
        pass
