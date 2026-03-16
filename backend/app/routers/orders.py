"""
Orders router: create, list, and update orders.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.order import Order, OrderCreate, OrderUpdate, OrderStatus
from app.repositories.order_repository import OrderRepository
from app.repositories.menu_repository import InMemoryMenuRepository
from app.services.order_service import OrderService
from app.services.queue_service import QueueService
from app.cache.redis_client import cache_get, cache_set
from app.routers.menu import get_menu_repo

router = APIRouter(prefix="/orders", tags=["orders"])

_order_repo = OrderRepository()
_queue_service = QueueService()
_order_service = OrderService(_queue_service)


def get_order_repo() -> OrderRepository:
    return _order_repo


@router.get("/queue", response_model=list[Order])
async def get_order_queue(
    order_repo: OrderRepository = Depends(get_order_repo),
):
    """Return active orders sorted by priority (highest first)."""
    cached = await cache_get("order_queue")
    if cached:
        return [Order(**o) for o in cached]

    active_orders = await order_repo.get_all(status=None)
    active_orders = [
        o for o in active_orders if o.status in (OrderStatus.PENDING, OrderStatus.IN_PROGRESS)
    ]
    station_loads = await order_repo.get_active_station_loads()
    sorted_orders = _queue_service.sort_orders(active_orders, station_loads)

    await cache_set("order_queue", [o.model_dump() for o in sorted_orders], ttl=10)
    return sorted_orders


@router.get("/", response_model=list[Order])
async def list_orders(
    order_status: OrderStatus | None = None,
    order_repo: OrderRepository = Depends(get_order_repo),
):
    return await order_repo.get_all(status=order_status)


@router.get("/{order_id}", response_model=Order)
async def get_order(
    order_id: str,
    order_repo: OrderRepository = Depends(get_order_repo),
):
    order = await order_repo.get_by_id(order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.post("/", response_model=Order, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    order_repo: OrderRepository = Depends(get_order_repo),
    menu_repo: InMemoryMenuRepository = Depends(get_menu_repo),
):
    all_items = await menu_repo.get_all()
    menu_map = {item.id: item for item in all_items}

    try:
        order = _order_service.build_order(payload, menu_map)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    saved = await order_repo.save(order)
    await _order_service.invalidate_queue_cache()
    await _order_service.schedule_reprioritization(saved.id)
    return saved


@router.patch("/{order_id}", response_model=Order)
async def update_order(
    order_id: str,
    payload: OrderUpdate,
    order_repo: OrderRepository = Depends(get_order_repo),
):
    order = await order_repo.get_by_id(order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    updated = _order_service.apply_update(order, payload)
    saved = await order_repo.save(updated)
    await _order_service.invalidate_queue_cache()
    return saved
