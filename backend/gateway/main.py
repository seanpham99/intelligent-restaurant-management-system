from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import menu_service
from httpx_client import init_httpx_client, close_httpx_client
from logger import logger

@asynccontextmanager
async def lifespan(app: FastAPI): 
    try:
        await init_httpx_client()
    except Exception as e:
        logger.error(f'Fail to initiate httpx client: {e}')
    
    yield  # Application is running

    try:
        await close_httpx_client()
    except Exception as e:
        logger.error(f'Fail to close httpx client: {e}')

app = FastAPI(lifespan=lifespan)

app.include_router(menu_service.router)
'''
origins = [
    "http://192.168.1.96:*",
    "http://localhost",
    "http://localhost:*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
'''

