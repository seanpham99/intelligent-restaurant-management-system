import asyncio
from concurrent.futures import ThreadPoolExecutor

from mqtt_worker import run_multiple_workers
from order_handler import OrderInsertHandler
from database import get_db_context

def main():
    with ThreadPoolExecutor(max_workers=20) as global_executor:
        
        workers = [
            {
                "topic": "order/queue", 
                "handler": OrderInsertHandler(), 
            }
        ]

        try:
            # We pass the FUNCTION get_db_context, not the result of calling it.
            asyncio.run(run_multiple_workers(workers, global_executor, get_db_context))
        except KeyboardInterrupt:
            print("\nShutting down workers...")

if __name__ == "__main__":
    main()