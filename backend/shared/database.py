from contextlib import contextmanager
from typing import Generator
from urllib.parse import quote_plus
import os

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session

from logger import logger

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_PASSWORD = quote_plus(os.getenv("DB_PASSWORD", "password"))
DB_USER = os.getenv("DB_USER", "postgres")
SQLALCHEMY_DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

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
    logger.debug('DB connection opened!')
    db = SessionLocal()
    try:
        yield db
    finally:
        # This part runs AFTER the API response is sent
        db.close()
        logger.debug('DB connection closed!')

def verify_connection():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return True

@contextmanager
def get_db_context():
    return get_db()