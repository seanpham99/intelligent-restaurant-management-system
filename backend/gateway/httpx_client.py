import httpx
from typing import AsyncGenerator
from logger import logger

# Global client variable initialized as None
# It will be assigned a real AsyncClient instance during startup
client: httpx.AsyncClient = None

async def init_httpx_client():
    """
    Initializes the global AsyncClient.
    To be called within the FastAPI lifespan startup.
    """
    global client
    if client is None:
        # Define pooling limits and timeouts centrally
        client = httpx.AsyncClient(
            timeout=httpx.Timeout(10.0), 
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=20)
        )
        logger.info("HTTPX AsyncClient initialized.")

async def close_httpx_client():
    """
    Closes the global AsyncClient.
    To be called within the FastAPI lifespan shutdown.
    """
    global client
    if client:
        await client.aclose()
        client = None
        logger.info("HTTPX AsyncClient closed.")

async def get_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    """
    FastAPI dependency that yields the shared HTTPX client.
    """
    if client is None:
        logger.error("Attempted to access HTTPX client before initialization.")
        raise RuntimeWarning("HTTPX Client is not initialized. Ensure lifespan is configured.")
    yield client