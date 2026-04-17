from sqlalchemy import BigInteger, DateTime, Float, String, Text

import model


def test_all_model_tablenames_exist():
    expected = {
        "order_status",
        "payment_method",
        "delivery_service",
        "bill_status",
        "table_status",
        "item_type",
        "customer",
        "ingredient",
        "menu_item",
        "restaurant_table",
        "bill",
        "order",
        "order_item",
        "item_ingredient",
        "ingredient_amount",
    }

    mapped = {tbl.name for tbl in model.Base.metadata.tables.values()}
    assert expected.issubset(mapped)


def test_menu_item_columns_and_relationships():
    cols = model.MenuItem.__table__.columns

    assert isinstance(cols["id"].type, BigInteger)
    assert isinstance(cols["type_id"].type, BigInteger)
    assert cols["type_id"].nullable is False
    assert isinstance(cols["name"].type, String)
    assert isinstance(cols["description"].type, Text)
    assert isinstance(cols["price"].type, Float)
    assert isinstance(cols["image_base64"].type, Text)

    rels = model.MenuItem.__mapper__.relationships
    assert "item_type" in rels


def test_order_columns_and_relationships():
    cols = model.Order.__table__.columns

    assert isinstance(cols["id"].type, Text)
    assert isinstance(cols["bill_id"].type, Text)
    assert cols["bill_id"].nullable is False
    assert isinstance(cols["table_id"].type, BigInteger)
    assert cols["table_id"].nullable is False
    assert isinstance(cols["status_id"].type, BigInteger)
    assert cols["status_id"].nullable is False
    assert isinstance(cols["created_at"].type, DateTime)

    rels = model.Order.__mapper__.relationships
    assert "bill" in rels
    assert "table" in rels
    assert "status" in rels


def test_bill_columns_and_relationships():
    cols = model.Bill.__table__.columns

    assert isinstance(cols["id"].type, Text)
    assert isinstance(cols["payment_method_id"].type, BigInteger)
    assert cols["payment_method_id"].nullable is False
    assert isinstance(cols["delivery_service_id"].type, BigInteger)
    assert cols["delivery_service_id"].nullable is False
    assert isinstance(cols["customer_id"].type, BigInteger)
    assert cols["customer_id"].nullable is False
    assert isinstance(cols["status_id"].type, BigInteger)
    assert cols["status_id"].nullable is False
    assert isinstance(cols["created_at"].type, DateTime)
    assert isinstance(cols["total_payment"].type, Float)

    rels = model.Bill.__mapper__.relationships
    assert "customer" in rels
    assert "status" in rels


def test_composite_keys_for_association_models():
    order_item_pk = [c.name for c in model.OrderItem.__table__.primary_key.columns]
    item_ingredient_pk = [c.name for c in model.ItemIngredient.__table__.primary_key.columns]

    assert set(order_item_pk) == {"order_id", "item_id"}
    assert set(item_ingredient_pk) == {"item_id", "ingredient_id"}


def test_lookup_and_core_models_have_id_primary_key():
    entities = [
        model.OrderStatus,
        model.PaymentMethod,
        model.DeliveryService,
        model.BillStatus,
        model.TableStatus,
        model.ItemType,
        model.Customer,
        model.Ingredient,
        model.RestaurantTable,
        model.IngredientAmount,
    ]

    for entity in entities:
        cols = entity.__table__.columns
        assert "id" in cols
        assert cols["id"].primary_key is True
