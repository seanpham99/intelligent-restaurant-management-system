from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://192.168.1.96:*",
    "http://localhost",
    "http://localhost:*",
]
'''
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
'''

@app.get("/root")
async def root():
    return {"message": "Hello World"}
