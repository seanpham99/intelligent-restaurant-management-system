import asyncio
from mqtt_worker import run_multiple_workers
from order_handler import OrderInsertHandler
from database import get_db_context

if __name__ == "__main__":
    with get_db_context() as db:
        workers = [
            {
                "topic": "order/queue", 
                "handler": OrderInsertHandler().set_db(db), 
                "max_workers": 5
            }
        ]
        try:
            asyncio.run(run_multiple_workers(workers))
        except KeyboardInterrupt:
            print("Workers stopped.")