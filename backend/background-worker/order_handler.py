from uuid import uuid4
from time import sleep

from sqlalchemy import select
from sqlalchemy.orm import Session

from mqtt_worker_handler import MQTTWorkerHandler
from model import Bill, Order, OrderItem, IngredientAmount, ItemIngredient
from logger import logger
from const import ORDER_STATUS
from mqtt_queue import publish

MOCK_PROCESSING_TIME = 5


class BillRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_bill(self):
        new_bill = Bill(
            id=str(uuid4()),
            payment_method_id=0,
            delivery_service_id=0,
            customer_id=0,
            status_id=0,
            total_payment=None
        )
        try:
            self.db.add(new_bill)
            self.db.commit()
            self.db.refresh(new_bill)
        except Exception as e:
            self.db.rollback()
            raise e
        return new_bill


class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_order(self, bill_id, order_info):
        order = Order(
            id=order_info['id'],
            bill_id=bill_id,
            table_id=order_info['table_id'],
            status_id=0
        )
        try:
            self.db.add(order)
            self.db.commit()
            self.db.refresh(order)
        except Exception as e:
            self.db.rollback()
            raise e
        return order

    def create_order_item(self, order_info):
        order_item = OrderItem(
            order_id=order_info['id'],
            item_id=order_info['item_id'],
            amount=order_info['amount']
        )
        try:
            self.db.add(order_item)
            self.db.commit()
            self.db.refresh(order_item)
        except Exception as e:
            self.db.rollback()
            raise e
        return order_item

    def update_order_status(self, order, status_id):
        order.status_id = status_id
        try:
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise e
        return order


class InventoryService:
    def __init__(self, db: Session):
        self.db = db

    def update_ingredient_amount(self, order_info):
        results = []
        try:
            item_ingredients = (
                self.db.query(
                    ItemIngredient.ingredient_id,
                    ItemIngredient.amount
                ).filter(ItemIngredient.item_id == int(order_info['item_id']))
            )
            for ingredient in item_ingredients:
                stmt = (
                    select(IngredientAmount.amount)
                    .where(IngredientAmount.ingredient_id == ingredient.ingredient_id)
                    .order_by(IngredientAmount.id.desc())
                    .limit(1)
                )

                in_stock = self.db.execute(stmt).scalar_one_or_none()
                new_amount = IngredientAmount(
                    ingredient_id=ingredient.ingredient_id,
                    amount=in_stock - ingredient.amount * int(order_info['amount'])
                )
                self.db.add(new_amount)
                self.db.commit()
                self.db.refresh(new_amount)
                results.append(new_amount)
        except Exception as e:
            self.db.rollback()
            raise e
        return results


class OrderStatusPublisher:
    def __init__(self, mqtt, loop):
        self.mqtt = mqtt
        self.loop = loop

    def publish_status(self, topic, status):
        publish(self.mqtt, topic, {"status": status.value, "description": status.name}, self.loop)


class OrderInsertHandler(MQTTWorkerHandler):
    def configure(self, db=None, payload=None, mqtt=None, loop=None):
        if db is not None:
            self.db = db
            self.bill_repo = BillRepository(db)
            self.order_repo = OrderRepository(db)
            self.inventory_service = InventoryService(db)
        if payload is not None:
            self.payload = payload
        if mqtt is not None:
            self.mqtt = mqtt
        if loop is not None:
            self.loop = loop
        if hasattr(self, 'mqtt') and hasattr(self, 'loop'):
            self.status_publisher = OrderStatusPublisher(self.mqtt, self.loop)
        return self

    def publish_order_status(self, order, topic, status):
        self.order_repo.update_order_status(order, status.value)
        self.status_publisher.publish_status(topic, status)

    def process_order(self, bill_id, order_info):
        topic = f"order/status/{order_info['id']}"
        order = self.order_repo.create_order(bill_id, order_info)

        self.publish_order_status(order, topic, ORDER_STATUS.IN_QUEUE)
        sleep(MOCK_PROCESSING_TIME)

        self.publish_order_status(order, topic, ORDER_STATUS.PROCESSING)
        sleep(MOCK_PROCESSING_TIME)

        self.order_repo.create_order_item(order_info)
        results = self.inventory_service.update_ingredient_amount(order_info)
        logger.info(f'Mock update ingredient amount: {results}')

        self.publish_order_status(order, topic, ORDER_STATUS.DONE)

    def handle(self):
        sleep(MOCK_PROCESSING_TIME)
        bill = self.bill_repo.create_bill()
        for order_info in self.payload:
            self.process_order(bill.id, order_info)
