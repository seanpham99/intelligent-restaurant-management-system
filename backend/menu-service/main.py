from fastapi import FastAPI
from routers import item

app = FastAPI()

app.include_router(item.router)

@app.get("/list")
async def root():
    return {"message": "Hello World"}
