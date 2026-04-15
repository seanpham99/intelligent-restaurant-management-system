import asyncio
import json
from concurrent.futures import ThreadPoolExecutor

# Import your handler and the new factory function
from handler import DBInsertHandler
from logger import logger
from mqtt_queue import create_standalone_mqtt 

class MQTTWorker:
    def __init__(
        self, 
        topic: str, 
        handler: DBInsertHandler, 
        max_workers: int = 5
    ):
        self.topic = topic
        self.handler = handler
        # This executor runs the 'complicated' handle() in separate threads
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        
        # Use our factory to create the isolated client
        # We pass the topic name as a prefix for easy identification in logs
        prefix = f"worker@{topic}"
        self.client = create_standalone_mqtt(prefix=prefix)

    def run_handler(self, payload: dict):
        """Instantiates the handler and executes its logic in a thread."""
        try:
            # Dependency Injection: Pass payload to the handler constructor
            self.handler.set_payload(payload)
            self.handler.handle()
        except Exception as e:
            logger.error(f"Handler Error on topic {self.topic}: {e}")

    async def start(self):
        """Main loop using the standalone client factory."""
        logger.info(f"Starting Worker for topic: {self.topic}")
        
        # The 'async with' handles the CONNECT and DISCONNECT using the factory-created client
        async with self.client as client:
            await client.subscribe(self.topic)
            
            async for message in client.messages:
                try:
                    payload = json.loads(message.payload.decode())
                    
                    # Dispatch the blocking work to the ThreadPool
                    loop = asyncio.get_running_loop()
                    loop.run_in_executor(
                        self.executor, 
                        self.run_handler, 
                        payload
                    )
                    logger.debug(f"Dispatched task for {self.topic} to thread pool")
                    
                except json.JSONDecodeError:
                    logger.error(f"Malformed JSON on {self.topic}")
                except Exception as e:
                    logger.error(f"Worker Loop Error on {self.topic}: {e}")

async def run_multiple_workers(worker_configs: list):
    """
    Runs multiple standalone workers concurrently.
    Each has its own unique Client ID via the factory.
    """
    tasks = [MQTTWorker(**config).start() for config in worker_configs]
    await asyncio.gather(*tasks)