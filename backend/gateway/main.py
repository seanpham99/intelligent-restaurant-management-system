from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import menu_service, order_service
from httpx_client import init_httpx_client, close_httpx_client
from logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await init_httpx_client()
    except Exception as e:
        logger.error(f"Fail to initiate httpx client: {e}")

    yield  # Application is running

    try:
        await close_httpx_client()
    except Exception as e:
        logger.error(f"Fail to close httpx client: {e}")


app = FastAPI(lifespan=lifespan)

# CORS configuration to allow frontend dev server access
origins = [
    "http://localhost:3000",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(menu_service.router)
app.include_router(order_service.router)
