"""
Analytics router: order flow, table turnover, and predictive insights for managers.
"""
from collections import Counter
from fastapi import APIRouter, Depends
from app.models.order import OrderStatus
from app.repositories.order_repository import OrderRepository
from app.repositories.inventory_repository import InventoryRepository
from app.routers.orders import get_order_repo
from app.routers.inventory import get_inventory_repo

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/order-flow")
async def order_flow(order_repo: OrderRepository = Depends(get_order_repo)):
    """Aggregate counts of orders by status."""
    all_orders = await order_repo.get_all()
    counts = Counter(o.status.value for o in all_orders)
    total = len(all_orders)
    return {
        "total": total,
        "by_status": dict(counts),
        "pending": counts.get(OrderStatus.PENDING, 0),
        "in_progress": counts.get(OrderStatus.IN_PROGRESS, 0),
        "ready": counts.get(OrderStatus.READY, 0),
        "delivered": counts.get(OrderStatus.DELIVERED, 0),
        "cancelled": counts.get(OrderStatus.CANCELLED, 0),
    }


@router.get("/kitchen-load")
async def kitchen_load(order_repo: OrderRepository = Depends(get_order_repo)):
    """Current active item counts per kitchen station."""
    return await order_repo.get_active_station_loads()


@router.get("/inventory-summary")
async def inventory_summary(
    inventory_repo: InventoryRepository = Depends(get_inventory_repo),
):
    """Return ingredients with their stock status."""
    ingredients = await inventory_repo.get_all_ingredients()
    alerts = await inventory_repo.get_all_alerts(resolved=False)
    low_stock_ids = {a.ingredient_id for a in alerts}
    return {
        "total_ingredients": len(ingredients),
        "low_stock_count": len(low_stock_ids),
        "active_alerts": len(alerts),
        "ingredients": [
            {
                "id": i.id,
                "name": i.name,
                "quantity": i.current_quantity,
                "unit": i.unit,
                "low_stock": i.id in low_stock_ids,
            }
            for i in ingredients
        ],
    }
