from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from urllib.parse import quote_plus
import os

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_PASSWORD = quote_plus(os.getenv("DB_PASSWORD", "password"))
DB_USER = os.getenv("DB_USER", "postgres")
SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # pool_size defines how many persistent connections to keep open
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """
    Creates a new SQLAlchemy session for a single request.
    Ensures the connection is closed after the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        # This part runs AFTER the API response is sent
        db.close()