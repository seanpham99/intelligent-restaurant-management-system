from sqlalchemy import Column, BigInteger, String, Float, DateTime, ForeignKey, Text, MetaData, Boolean
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

metadata = MetaData(schema="public")
Base = declarative_base(metadata=metadata)

# --- Lookup / Status Tables ---

class OrderStatus(Base):
    __tablename__ = 'order_status'
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String)
    description = Column(Text)

class PaymentMethod(Base):
    __tablename__ = 'payment_method'
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String)
    description = Column(Text)

class DeliveryService(Base):
    __tablename__ = 'delivery_service'
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String)
    description = Column(Text)

class BillStatus(Base):
    __tablename__ = 'bill_status'
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String)
    description = Column(Text)

class TableStatus(Base):
    __tablename__ = 'table_status'
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String)
    description = Column(Text)

class ItemType(Base):
    __tablename__ = 'item_type'
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String)
    description = Column(Text)

# --- Core Entities ---

class Customer(Base):
    __tablename__ = 'customer'
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String)
    email = Column(String)
    phone = Column(String)

class Ingredient(Base):
    __tablename__ = 'ingredient'
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String)
    description = Column(Text)
    unit = Column(String)

class MenuItem(Base):
    __tablename__ = 'menu_item'
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    type_id = Column(BigInteger, ForeignKey('item_type.id'), nullable=False)
    name = Column(String)
    description = Column(Text)
    price = Column(Float)
    image_base64 = Column(Text)
    image_url = Column(Text)
    currency = Column(String)
    popular = Column(Boolean, default=False)
    sold_out = Column(Boolean, default=False)
    
    item_type = relationship("ItemType")

class RestaurantTable(Base):
    __tablename__ = 'restaurant_table'
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    status_id = Column(BigInteger, ForeignKey('table_status.id'), nullable=False)
    num_sits = Column(BigInteger)
    description = Column(Text)
    
    status = relationship("TableStatus")

# --- Transactional Tables ---

class Bill(Base):
    __tablename__ = 'bill'
    id = Column(Text, primary_key=True)
    payment_method_id = Column(BigInteger, ForeignKey('payment_method.id'), nullable=False)
    delivery_service_id = Column(BigInteger, ForeignKey('delivery_service.id'), nullable=False)
    customer_id = Column(BigInteger, ForeignKey('customer.id'), nullable=False)
    status_id = Column(BigInteger, ForeignKey('bill_status.id'), nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now())
    total_payment = Column(Float)

    customer = relationship("Customer")
    status = relationship("BillStatus")

class Order(Base):
    __tablename__ = 'order'
    id = Column(Text, primary_key=True)
    bill_id = Column(Text, ForeignKey('bill.id'), nullable=False)
    table_id = Column(BigInteger, ForeignKey('restaurant_table.id'), nullable=False)
    status_id = Column(BigInteger, ForeignKey('order_status.id'), nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now())

    bill = relationship("Bill")
    table = relationship("RestaurantTable")
    status = relationship("OrderStatus")

# --- Junction / Association Tables ---

class OrderItem(Base):
    __tablename__ = 'order_item'
    order_id = Column(Text, ForeignKey('order.id'), primary_key=True)
    item_id = Column(BigInteger, ForeignKey('menu_item.id'), primary_key=True)
    amount = Column(Float)
    customer_note = Column(Text)

class ItemIngredient(Base):
    __tablename__ = 'item_ingredient'
    item_id = Column(BigInteger, ForeignKey('menu_item.id'), primary_key=True)
    ingredient_id = Column(BigInteger, ForeignKey('ingredient.id'), primary_key=True)
    amount = Column(Float)

class IngredientAmount(Base):
    __tablename__ = 'ingredient_amount'
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    ingredient_id = Column(BigInteger, ForeignKey('ingredient.id'), nullable=False)
    amount = Column(Float)
    created_at = Column(DateTime(timezone=True), default=func.now())
