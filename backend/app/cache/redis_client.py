import json
import redis.asyncio as aioredis
from typing import Optional, Any
from app.config import get_settings


_redis_client: Optional[aioredis.Redis] = None


async def get_redis() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        settings = get_settings()
        _redis_client = aioredis.from_url(
            settings.redis_url, encoding="utf-8", decode_responses=True
        )
    return _redis_client


async def cache_get(key: str) -> Optional[Any]:
    redis = await get_redis()
    value = await redis.get(key)
    if value:
        return json.loads(value)
    return None


async def cache_set(key: str, value: Any, ttl: int = 300) -> None:
    redis = await get_redis()
    await redis.setex(key, ttl, json.dumps(value, default=str))


async def cache_delete(key: str) -> None:
    redis = await get_redis()
    await redis.delete(key)


async def enqueue_task(queue_name: str, task_data: dict) -> None:
    redis = await get_redis()
    await redis.lpush(queue_name, json.dumps(task_data, default=str))


async def dequeue_task(queue_name: str) -> Optional[dict]:
    redis = await get_redis()
    value = await redis.rpop(queue_name)
    if value:
        return json.loads(value)
    return None
