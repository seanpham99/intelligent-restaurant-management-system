from uuid import uuid4
from time import sleep

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from mqtt_worker_handler import MQTTWokerHander
from model import Bill, Order, OrderItem, IngredientAmount, ItemIngredient
from logger import logger
from const import ORDER_STATUS
from mqtt_queue import publish

MOCK_PROCESSING_TIME = 5

class OrderInsertHandler(MQTTWokerHander):
    def set_db(self, db: Session):
        self.db = db
        return self
    
    def set_payload(self, payload):
        self.payload = payload
        return self
    
    def set_mqtt(self, mqtt):
        self.mqtt = mqtt
        return self
    
    def set_event_loop(self, loop):
        self.loop = loop
        return self

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
    
    def create_order(self, bill_id, order_info):
        order = Order(
            id = order_info['id'],
            bill_id = bill_id,
            table_id = order_info['table_id'],
            status_id = 0
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
            order_id = order_info['id'],
            item_id = order_info['item_id'],
            amount = order_info['amount']
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
    
    def mock_update_ingredient_amount(self, order_info):
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
                    ingredient_id = ingredient.ingredient_id,
                    amount = in_stock - ingredient.amount * int(order_info['amount'])
                )
                self.db.add(new_amount)
                self.db.commit()
                self.db.refresh(new_amount)
                results.append(new_amount)
        except Exception as e:
            self.db.rollback()
            raise e
        return results
    
    def handle(self):
        sleep(MOCK_PROCESSING_TIME)
        bill = self.create_bill()
        for order_info in self.payload:
            topic = f"order/status/{order_info['id']}"
            # topic = f'order/status/1'
            order = self.create_order(bill.id, order_info)
            self.update_order_status(order, ORDER_STATUS.IN_QUEUE.value)
            publish(
                self.mqtt,
                topic,
                {
                    "order_id": order_info["id"],
                    "status": ORDER_STATUS.IN_QUEUE.name,
                    "description": ORDER_STATUS.IN_QUEUE.name,
                },
                self.loop,
            )
            sleep(MOCK_PROCESSING_TIME)

            
            self.update_order_status(order, ORDER_STATUS.PROCESSING.value)
            publish(
                self.mqtt,
                topic,
                {
                    "order_id": order_info["id"],
                    "status": ORDER_STATUS.PROCESSING.name,
                    "description": ORDER_STATUS.PROCESSING.name,
                },
                self.loop,
            )
            
            sleep(MOCK_PROCESSING_TIME)
            order_item = self.create_order_item(order_info)
            results = self.mock_update_ingredient_amount(order_info)
            logger.info(f'Mock update ingredient amount: {results}')
        
            self.update_order_status(order, ORDER_STATUS.DONE.value)
            publish(
                self.mqtt,
                topic,
                {
                    "order_id": order_info["id"],
                    "status": ORDER_STATUS.DONE.name,
                    "description": ORDER_STATUS.DONE.name,
                },
                self.loop,
            )

        
