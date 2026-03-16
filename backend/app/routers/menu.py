"""
Menu router: CRUD endpoints for menu items.
Menu items are cached in Redis with a 5-minute TTL.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.menu import MenuItem, MenuItemCreate, MenuItemUpdate
from app.repositories.menu_repository import InMemoryMenuRepository
from app.cache.redis_client import cache_get, cache_set, cache_delete

router = APIRouter(prefix="/menu", tags=["menu"])

# Singleton repository (DI-friendly; swap for Supabase repo via dependency override)
_menu_repo = InMemoryMenuRepository()


def get_menu_repo() -> InMemoryMenuRepository:
    return _menu_repo


@router.get("/", response_model=list[MenuItem])
async def list_menu_items(repo: InMemoryMenuRepository = Depends(get_menu_repo)):
    cached = await cache_get("menu:all")
    if cached:
        return [MenuItem(**item) for item in cached]
    items = await repo.get_all()
    await cache_set("menu:all", [item.model_dump() for item in items], ttl=300)
    return items


@router.get("/{item_id}", response_model=MenuItem)
async def get_menu_item(
    item_id: str, repo: InMemoryMenuRepository = Depends(get_menu_repo)
):
    item = await repo.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
    return item


@router.post("/", response_model=MenuItem, status_code=status.HTTP_201_CREATED)
async def create_menu_item(
    payload: MenuItemCreate,
    repo: InMemoryMenuRepository = Depends(get_menu_repo),
):
    item = await repo.create(payload)
    await cache_delete("menu:all")
    return item


@router.patch("/{item_id}", response_model=MenuItem)
async def update_menu_item(
    item_id: str,
    payload: MenuItemUpdate,
    repo: InMemoryMenuRepository = Depends(get_menu_repo),
):
    item = await repo.update(item_id, payload)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
    await cache_delete("menu:all")
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_item(
    item_id: str,
    repo: InMemoryMenuRepository = Depends(get_menu_repo),
):
    deleted = await repo.delete(item_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
    await cache_delete("menu:all")
