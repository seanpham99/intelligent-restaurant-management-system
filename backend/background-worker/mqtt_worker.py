import asyncio
import json
from concurrent.futures import ThreadPoolExecutor
from mqtt_worker_handler import MQTTWorkerHandler
from logger import logger
from mqtt_queue import create_standalone_mqtt 

class MQTTWorker:
    def __init__(
        self, 
        topic: str, 
        handler: MQTTWorkerHandler, 
        executor: ThreadPoolExecutor,
        db_context_manager
    ):
        self.topic = topic
        self.handler = handler
        self.executor = executor
        self.db_context_manager = db_context_manager
        
        prefix = f"worker@{topic}"
        self.client = create_standalone_mqtt(prefix=prefix)
        self.handler.configure(mqtt=self.client)

    def run_handler(self, payload: dict):
        """Executed inside the Global Thread Pool."""
        try:
            with self.db_context_manager() as db:
                self.handler.configure(db=db, payload=payload).handle()
                
        except Exception as e:
            logger.error(f"Handler Error on {self.topic}: {e}")
        # The 'with' block ensures db.close() runs here, returning the connection to the pool.

    async def start(self):
        """Main MQTT loop."""
        logger.info(f"Starting Worker for topic: {self.topic}")
        
        async with self.client as client:
            await client.subscribe(self.topic)
            async for message in client.messages:
                try:
                    payload = json.loads(message.payload.decode())
                    loop = asyncio.get_running_loop()
                    self.handler.configure(loop=loop)
                    
                    # Dispatch to the global executor
                    loop.run_in_executor(self.executor, self.run_handler, payload)
                    
                except Exception as e:
                    logger.error(f"Worker Loop Error on {self.topic}: {e}")

async def run_multiple_workers(worker_configs: list, executor: ThreadPoolExecutor, db_context_manager):
    tasks = [
        MQTTWorker(
            topic=cfg["topic"], 
            handler=cfg["handler"], 
            executor=executor,
            db_context_manager=db_context_manager
        ).start() 
        for cfg in worker_configs
    ]
    await asyncio.gather(*tasks)