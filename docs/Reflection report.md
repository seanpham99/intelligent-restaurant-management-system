# 5. Reflection Report

The system successfully achieved core functional objectives: order intake through an API gateway, asynchronous event processing through MQTT, and stock updates through background workers. 

During maintenance and extension tasks, however, multiple architectural limitations became visible. Order-processing logic contained concentrated responsibilities, worker-handler contracts were overly fragmented, gateway configuration relied on concrete endpoint assumptions, and utility functions were partially coupled to concrete implementation shapes. These conditions increased regression risk, reduced adaptation speed, and made change impact more difficult to predict.

To improve structural quality while preserving runtime behavior, a targeted refactoring process was conducted using SOLID principles as evaluation and design criteria.

---

## 5.1 Methodology

Refactoring was performed incrementally to minimize destabilization and preserve compatibility with the existing test suite. Three implementation rules guided each change:

1. Isolate responsibilities before introducing additional abstractions  
2. Replace concrete coupling with configuration-driven or behavioral abstractions  
3. Keep edits focused, testable, and aligned with existing execution paths  

The goal was practical architectural improvement rather than large-scale rewrite. This approach enabled measurable progress without disrupting production behavior.

---

## 5.2 Principle-by-Principle Analysis

### 5.2.1 Single Responsibility Principle (SRP)

**Problem:**  
Earlier order-processing implementation combined persistence, order status updates, MQTT publication, and inventory mutation logic within one tightly coupled workflow path. This created multiple reasons to change in a single class and increased cognitive load for maintenance.

**Method:**  
Responsibilities were decomposed into dedicated collaborators:

- BillRepository for bill persistence  
- OrderRepository for order and order-item persistence plus status updates  
- InventoryService for ingredient amount adjustments  
- OrderStatusPublisher for MQTT publication  

The handler now coordinates collaborators rather than embedding all operational logic.

```python
class OrderInsertHandler(MQTTWokerHander):
    def configure(self, db=None, payload=None, mqtt=None, loop=None):
        if db is not None:
            self.bill_repo = BillRepository(db)
            self.order_repo = OrderRepository(db)
            self.inventory_service = InventoryService(db)
        if payload is not None:
            self.payload = payload
        if mqtt is not None:
            self.mqtt = mqtt
        if loop is not None:
            self.loop = loop
        if hasattr(self, "mqtt") and hasattr(self, "loop"):
            self.status_publisher = OrderStatusPublisher(self.mqtt, self.loop)
        return self
```

**Result:**
SRP alignment improved substantially. Changes to persistence, inventory, or publication behavior can now be developed and reviewed independently, reducing risk and improving traceability.

---

### 5.2.2 O: Open/Closed Principle (OCP)

**Problem:**
Dense orchestration previously required direct modifications to core workflow logic for routine extensions, such as status-sequence adjustments or side-effect changes.

**Method:**
The handler was transformed into an orchestrator that composes behavior through collaborator methods with clearly defined responsibilities.

```python
def process_order(self, bill_id, order_info):
    topic = f"order/status/{order_info['id']}"
    order = self.order_repo.create_order(bill_id, order_info)

    self.publish_order_status(order, topic, ORDER_STATUS.IN_QUEUE)
    self.publish_order_status(order, topic, ORDER_STATUS.PROCESSING)
    self.order_repo.create_order_item(order_info)
    self.inventory_service.update_ingredient_amount(order_info)
    self.publish_order_status(order, topic, ORDER_STATUS.DONE)
```

**Result:**
The module is more open to incremental extension and less vulnerable to broad-impact edits. Typical workflow enhancements now require smaller, localized modifications.

---

### 5.2.3 Liskov Substitution Principle (LSP)

**Problem:**
Background worker infrastructure requires consistent handler behavior regardless of concrete implementation. Substitution can fail if setup assumptions are implicit or inconsistent.

**Method:**
A unified abstract configuration contract was used to enforce consistent setup semantics across handlers.

```python
class MQTTWokerHander(BaseDataHandler):
    @abstractmethod
    def configure(self, db=None, payload=None, mqtt=None, loop=None):
        pass
self.handler.configure(mqtt=self.client)
self.handler.configure(db=db, payload=payload).handle()
self.handler.configure(loop=loop)
```
**Result:**
Substitutability improved in operational terms. Worker logic now depends on stable behavioral expectations rather than implementation-specific setup patterns.

---

### 5.2.4 Interface Segregation Principle (ISP)

**Problem**
The previous worker-handler interface required multiple setter methods, creating an unnecessarily broad and fragmented contract.

**Method:**
Setter-based interaction was consolidated into one cohesive configuration method.

```python
class MQTTWokerHander(BaseDataHandler):
    @abstractmethod
    def configure(self, db=None, payload=None, mqtt=None, loop=None):
        pass
```

**Result:**
Interface surface area decreased and integration clarity improved. Contract evolution now occurs through a single interface entry point, reducing maintenance complexity.

--- 
### 5.2.5 Dependency Inversion Principle (DIP)

**Problem**
Concrete dependency patterns appeared in multiple layers: hardcoded service endpoint assumptions in gateway routing and concrete-shape dependence in cache access behavior.

**Method 1: Configuration abstraction**

```python
MENU_SERVICE_URL = os.getenv("MENU_SERVICE_URL", "http://irms-menu-service:8000")
ORDER_SERVICE_HOST = os.getenv("ORDER_SERVICE_HOST", "irms-order-service")
ORDER_SERVICE_URL = os.getenv("ORDER_SERVICE_URL", f"http://{ORDER_SERVICE_HOST}:8000")
```

**Method 2: Behavioral abstraction**

```python
def get_cached_data(r, key, data_provider, ttl=10):
    cached_data = r.get(key)
    if cached_data:
        return json.loads(cached_data)
    data = data_provider()
    r.set(key, json.dumps(jsonable_encoder(data)), ex=ttl)
    return data
```

**Method 3: Workflow-level decoupling**

High-level order workflow now delegates operational behavior to repository, service, and publisher collaborators rather than directly implementing all logic in a single class.

**Result**
Deployment portability improved, utility reuse increased, and coupling between orchestration and low-level implementation details was reduced.

---

## 5.3 Design Challenges
Three major constraints influenced the refactoring process:
- Regression sensitivity: The system was already functional, so large rewrites introduced unacceptable stability risk
- Over-abstraction risk: Additional abstraction layers were introduced only when they produced measurable gains
- Delivery pressure: Architectural improvements had to coexist with ongoing development needs

These constraints justified an incremental strategy focused on high-impact structural changes.

---

## 5.4 Impact Assessment

Refactoring produced improvements across three quality dimensions:

- Modularity: Responsibilities are distributed into smaller, purpose-specific components
- Maintainability: Control flow is clearer and dependencies are well-defined
- Extensibility: System can evolve without major modifications

These improvements were achieved while preserving system behavior and maintaining successful test results.




       
