from uuid import uuid4

from sqlalchemy.orm import Session

from handler import DBInsertHandler
from model import Bill, Order


class OrderInsertHandler(DBInsertHandler):
    def set_db(self, db: Session):
        self.db = db
        return self
    
    def set_payload(self, payload):
        self.payload = payload
        return self

    def create_bill(self):
        new_bill = Bill(
            id=str(uuid4()), 
            payment_method_id=0,      # Replace with actual logic/input
            delivery_service_id=0,    # Replace with actual logic/input
            customer_id=0,
            status_id=0,              # Usually 'Pending' or 'Created'
            total_payment=None
        )

        try:
            # 2. Add the object to the session (Stage the changes)
            self.db.add(new_bill)
            
            # 3. Commit the transaction (Write to DB)
            self.db.commit()
            
            # 4. Refresh the object (Fetch generated fields like created_at)
            self.db.refresh(new_bill)
            
            return new_bill
            
        except Exception as e:
            # If something goes wrong (e.g., foreign key violation), roll back
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
            return order
        except Exception as e:
            self.db.rollback()
            raise e
        return order
    
    def handle(self):
        bill = self.create_bill()
        for order_info in self.payload:
            order = self.create_order(bill.id, order_info)

