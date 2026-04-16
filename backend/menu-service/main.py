from contextlib import asynccontextmanager

from fastapi import FastAPI

from database import engine, verify_connection
from cache import verify_cache_connection, close_cache_pool
from routers import item
from logger import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    # check database
    try:
        verify_connection()
        logger.info("Database connected.")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        # raise SystemExit(1) # Optional: Stop app if DB is critical

    # check cache connection
    try:
        verify_cache_connection()
        logger.info("Cache connected.")
    except Exception as e:
        logger.error(f"Cache connection failed: {e}")

    yield

    # close db pool
    engine.dispose()
    logger.info("Cleaned up Database pool.")

    # close cache pool
    close_cache_pool()
    logger.info("Cleaned up Redis pool.")


app = FastAPI(lifespan=lifespan)

app.include_router(item.router)