import redis
from typing import Generator
import os
import json

from fastapi.encoders import jsonable_encoder

from handler import BaseDataHandler
from logger import logger

CACHE_HOST = os.getenv("CACHE_HOST", "localhost")
CACHE_PORT = int(os.getenv("CACHE_PORT", "6379"))

# 1. Initialize a global Connection Pool
# This stays alive for the duration of the application
cache_pool = redis.ConnectionPool(
    host=CACHE_HOST, 
    port=CACHE_PORT, 
    db=0, 
    decode_responses=True,
    max_connections=20
)

logger.info(f'cache pool id {id(cache_pool)}')

def get_cache() -> Generator[redis.Redis, None, None]:
    """
    Yields a Redis client instance from the global pool.
    """
    # Create a client using the existing pool
    client = redis.Redis(connection_pool=cache_pool)
    logger.debug('Cache connection opened!')
    try:
        yield client
    finally:
        # In redis-py, 'close()' returns the connection to the pool 
        # but does not disconnect the underlying socket.
        client.close()
        logger.debug('Cache connection closed!')

def get_cached_data(r: redis.Redis, key: str, handler: BaseDataHandler, ttl=10):
    logger.info(f'cache pool id {id(cache_pool)}')
    cached_data = r.get(key)
    if cached_data:
        cached_data = json.loads(cached_data)
        logger.debug(f'cached data": {cached_data}')
        return cached_data
    data = handler.handle()
    logger.debug(f'items {data}')
    r.set(key, json.dumps(jsonable_encoder(data)), ex=ttl)
    return data


def verify_cache_connection():
    """Checks if Redis is reachable."""
    client = redis.Redis(connection_pool=cache_pool)
    return client.ping()

def close_cache_pool():
    """Disconnects all connections in the pool."""
    cache_pool.disconnect()
    logger.info("Redis connection pool disconnected.")