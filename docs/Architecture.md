# 3. Software Architecture
## 3.1 Architecture Characteristics
### 3.1.1 Architectural Features
To ensure that the IRMS system meets the success criteria of an IoT-integrated restaurant platform, the following are the architecture characteristics defined based on the Richards & Ford (2020) standard. 

| Characteristics | Justification | NFR Link |
| :--- | :--- | :--- |
| **1. Real-Time Processing (Performance)** | Data from IoT sensors, ordering devices, and the kitchen's KDS system needs to be synchronized instantly to avoid service delays. | NFR-01 (Latency is less than or equal to 2 seconds for P95)|
| **2. Elasticity** | Restaurant order volumes are often cyclical (spiking during lunch/dinner hours). The system needs to automatically scale to handle the load without crashing. | NFR-02 (Processing from 500 TPS to 5,000+ TPS) |
| **3. Fault Tolerance** | In a high-speed kitchen environment, if a service (e.g., Payment) malfunctions, the Kitchen Display System (KDS) must continue to function normally so that chefs can continue working. | NFR-03, NFR-05 (No SPOF, Failover less than or equal to 30 seconds) |
| **4. Interoperability** | IRMS must connect with a wide range of diverse IoT devices (smart tablets, load-cell sensors, KDS) from various vendors via standard protocols. | NFR-08 (Using MQTT v3.1.1/v5.0 standard) |
| **5. Modularity** | Independent business processes (Ordering, Kitchen, Inventory) need to be developed and implemented separately to reduce risks when upgrading the system. | NFR-06 (Changing one module doesn't require redeploying the entire system.) |
| **6. Security** | Payment card data processing systems (PCI-DSS) and restaurant information require robust protection against cyberattacks. | NFR-04 (TLS 1.3 and AES-256 encryption) |
| **7. Observability** | With the asynchronous (Event-Driven) communication of IoT, monitoring message flows and detecting errors in real time is essential for quick bug fixes. | NFR-09 (100% event có Correlation ID) |

-----

## 3.1.2 Classification of Implicit & Explicit

According to Neal Ford & Mark Richards (2020), characteristics are categorized based on whether they are explicitly required by the Business or are default technical specifications: 

### Explicit Characteristics (Business-Driven/PRD-driven)

  * **Real-Time Processing**: It's mandatory because the restaurant needs to see the order immediately. 
  * **Elasticity**: We need support to expand to 500 restaurant branches. 
  * **Interoperability**: Clearly state this in the requirements for multi-device IoT integration. 

### Implicit Characteristics (Driven by Technical/Architectural Factors)

  * **Fault Tolerance**: The business didn't explicitly require "the system must have a circuit breaker," but the architect knew that network outages were inevitable in restaurants. 
  * **Modularity & Observability**: It is essential for the student team (and future developers) to be able to maintain and debug the system easily. 
  * **Security**: This is a default setting to prevent data leaks in the payment system.

-----

## 3.1.3 Architecture Characteristics Star Diagram

![alt text](<Architecture Characteristics Star Diagram - Define Architecture Characteristics-1.png>)

Looking at the chart, we can see an accurate reflection of the fierce competition in the F\&B (Food & Beverage) industry.  During peak hours, it is better to make a small sacrifice regarding the speed of error log retrieval (**Observability**) or accepting the reduction of redundant internal security encryption layers (**Security**).  It is absolutely **not allowed** to fail to allow the kitchen to stop accepting orders (**Fault Tolerance**) or making customers wait more than 2 seconds after pressing the order button (**Real-Time**). 

-----

## 3.1.4 Synergy and Trade-off Analysis

This diagram helps us clearly see the conflicts between characteristics, thereby enabling us to make sound design decisions. 

### 1\. The Synergy: Fault Tolerance and Modularity

  * **Analysis**: To achieve a perfect fault tolerance score (5.0), the system cannot be monolith.  We must have a high degree of modularity (4.0). 
  * **Architectural Decision**: If the Payment module connected to Momo/VNPay crashes due to a network error, the Kitchen Management module and the Ordering module must continue to function normally via the internal LAN. The modules must be physically deployed independently. 

### 2\. The Trade-off: Real-Time Processing vs. Security

  * **Analysis**: This score difference shows that we prioritize the fastest possible data flow. If every packet communicating between internal services had to be encrypted with AES-256 before decryption, the CPU would be overloaded and break the 2-second time budget (NFR-01). 
  * **Architectural Decision**: Security will be set up at the **Outermost boundary layer (API Gateway)** via TLS 1.3 and a token mechanism.  Within the internal network between microservices, data will be transmitted using gRPC or unencrypted WebSockets to ensure real-time speeds.

### 3\. Extension Dynamics: Elasticity and Interoperability

  * **Analysis**: The system needs to expand not only in terms of the number of transactions (from 500 to 5000+ TPS) but also in terms of the types of devices (integrating new temperature sensors, new receipt printers). 
  * **Architectural Decision**: Forced to use a **Message Broker** (such as Kafka or RabbitMQ) and **MQTT protocol**.  MQTT is extremely lightweight, allowing thousands of IoT devices to send data simultaneously without clogging core system bandwidth. 

-----

## 3.1.5 Analysis of the Trade-offs of the Top 3 Leading Characteristics

The three most influential characteristics in our decision to choose a **Hybrid Service-Based + Event-Driven architecture** were: Real-Time Processing, Elasticity, and Fault Tolerance.

**Trade-off 1: Real-Time Processing vs. Security**
> * To achieve extremely low latency (\< 2s), we use WebSockets and MQTT.
> * Continuous encryption (TLS 1.3 / AES-256) of every internal stream consumes too much CPU. 
> * **Decision**: Security is limited to the Gateway level; internal communication uses unencrypted gRPC/Event streams. 

**Trade-off 2: Elasticity vs. Data Consistency**
> * When load spikes, synchronous writes to a single database for ACID consistency create a bottleneck. 
> * **Decision**: Accept **"Eventual Consistency"**. The system returns a success result immediately and uses a Message Broker to update the kitchen. This allows scaling to thousands of TPS despite a millisecond delay in kitchen receipt. 

**Trade-off 3: Fault Tolerance vs. Cost & System Complexity**
> * Ensuring fault tolerance requires complex patterns like Circuit Breaker, Transactional Outbox, and Multi-AZ. 
> * This increases code complexity and infrastructure costs. 
> * **Decision**: Accept increased complexity and cost. Higher cloud costs are justified compared to the risk of losing customers if the restaurant closes for even an hour due to failure. 

-----

## 3.2 Architecture Style Selection
### 3.2.1 Candidate Architecture Styles
There are some architecture styles that are considered for the Intelligent Restaurant Management System (IRMS):
- **Monolithic**: combines all of an application's components into a single, inseparable unit
- **Microservices**: develops software applications as a collection of small, independent services that communicate with each other over a network.
- **Service-based**: a distributed macro layered structure consisting of a separately deployed user interface, separately deployed remote coarse-grained services, and a monolithic
database
- **Event-Driven**: system components communicate by producing and responding to events, such as user actions or system state changes. Components are loosely coupled, allowing them to operate independently while reacting to events in real time
- **Layered (N-Tier)**: The system is divided into layers such as presentation, business logic, persistence and database, each responsible for a certain communication component.

-----

### 3.2.2 Comparison of architecture styles

| Criterion | Monolithic | Layered | Event-driven | Service-based | Microservices |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Scalability | Low | Medium | High | High | High
| IoT Integration | Low | Medium | Excellent | Good | Good
| Fault Isolation | Poor | Medium | Good | Good | Excellent
| Team Complexity | High | High | Medium | Good | Low
| Real-time Support | Low | Low | Excellent | Good | Good 
| **Score** | 12 | 16 | 22 | 21 | 20

**Note:** 
Poor: 1
Low: 2
Medium: 3
Good: 4
High: 5
Excellent: 5

The architecture styles are evaluated based on the following criteria:
- Scalability: Ability to handle increasing number of users and IoT devices.
- IoT Integration: Ability to integrate with sensors, smart menus, and kitchen display systems.
- Fault Isolation: Ability to prevent failure in one component from affecting others.
- Team Complexity: Development and maintenance complexity for the team.
- Real-time Support: Ability to process real-time data and events.

-----

### 3.2.3 Analysis
_ Monolithic architecture performs poorly in elasticity and fault tolerance. It cannot efficiently handle peak order loads during busy hours, and a failure in one component can affect the entire system. It also lacks support for real-time processing and interoperability with IoT devices.

_ Layered architecture improves modularity and maintainability, but still suffers from limited elasticity and real-time processing capabilities. It is not ideal for systems requiring high responsiveness and distributed IoT integration.

_ Event-Driven architecture performs strongly in real-time processing and interoperability. It is highly suitable for handling IoT data streams such as sensor updates, order events, and alerts. It also supports elasticity by decoupling components. However, it introduces challenges in observability and debugging.

_ Microservices architecture provides excellent scalability, fault tolerance, and modularity. It supports independent scaling and deployment of services. However, it significantly increases system complexity, especially in terms of deployment, communication, and monitoring.

_ Service-Based architecture is the most suitable option. It provides sufficient modularity and scalability while maintaining manageable complexity. It also supports interoperability with IoT systems and can be combined with event-driven communication to handle real-time processing effectively.

-----

### 3.2.4 Selected Architecture Style
Although Event-Driven architecture achieves the highest score because it supports for real-time processing and IoT integration, but it is not selected as the primary architecture style due to its complexity in system management and debugging. As a result, the IRMS adopts a Service-Based Architecture as the primary architectural style.

To meet the requirements of real-time processing and IoT integration, the system incorporates event-driven communication mechanisms between services and IoT components.

Each service is implemented as a modular monolith, allowing easier development, testing, and maintenance.

The codebase is managed using a monorepo strategy to ensure consistency and simplify collaboration.

**Conclusion**: Based on comparison, our team has selected a hybrid approach between service-based for overall architecture and Event-Driven mechanisms for real-time IoT communications.

-----

### 3.2.5 Justification
The selected architecture satisfies the key architectural characteristics defined in Section 3.1:

- **Elasticity**: Service-based architecture allows scaling of individual services during peak hours such as lunch and dinner.
- **Fault Tolerance**: Failures can be isolated within services, ensuring critical components like the Kitchen Display System remain operational.
- **Real-Time Processing**: Event-driven communication enables real-time updates from IoT devices and order systems.
- **Modularity**: The system is divided into independent services such as ordering, kitchen, and inventory.
- **Interoperability**: The architecture supports integration with IoT protocols such as MQTT, HTTP, and WebSocket.
- **Security**: Service boundaries help enforce security controls for sensitive data such as payments and operational data.
- **Observability**: The architecture supports monitoring and logging across services, enabling visibility into system health and order flow.

This hybrid approach ensures a balance between performance, scalability, and implementation feasibility.
### 3.2.6 Architecture Decison Summary
### ADR-001: Adopt Service-Based Architecture with Event-Driven Communication
The architectural decision for IRMS is to adopt a Service-Based Architecture combined with Event-Driven communication mechanism.

The detailed architectural decision is documented in detail in ADR-001 (see Appendix A).

-----

## 3.3 Module View
### IRMS Class Diagram

#### 1. High-level structure

The diagram is organized into the following namespaces:

- **Infrastructure**: cross-cutting technical capabilities (eventing, authentication, logging, caching).
- **IoTGateway**: device integration concerns (protocol adaptation, device registry, connection monitoring).
- **CustomerOrdering**: menu access and order lifecycle (validation, persistence, notification).
- **KitchenManagement**: kitchen operations (queue prioritization, station load management, KDS display, alert dispatch).
- **InventoryManagement**: sensor integration and inventory oversight (readings, stock level management, safety monitoring, alerts).
- **DashboardAnalytics**: reporting and operational visibility (analytics generation, exporting, real-time aggregation).

---

#### 2. Namespace summary

#### Infrastructure
The Infrastructure namespace supplies technical services used across domains:
- Eventing: `IEventBus` (`MosquittoEventBus`) 
- Authentication: `IAuthService` → `JWTAuthService`
- Logging: `ILogger` → `ConsoleLogger`
- Caching: `ICache` → `ValkeyCache`

#### IoT Gateway
This namespace encapsulates device communication and management:
- Protocol transformation: `IProtocolAdapter` → `MQTTAdapter` / `HTTPAdapter` / `WebSocketAdapter`
- Device lifecycle: `IDeviceRegistry` → `DeviceRegistry`
- Connectivity: `IConnectionMonitor` → `ConnectionMonitor`
- Coordination: `DeviceGateway` composes these abstractions and integrates with `IEventBus`

#### Customer Ordering
This namespace captures order intake and menu retrieval:
- Validation: `IOrderValidator` → `OrderValidator` (dependent on `IMenuReader`)
- Persistence: `IOrderReader` + `IOrderWriter` → `OrderRepository`
- Menu access: `IMenuReader` → `MenuRepository`
- Notification: `IOrderNotifier` → `EventOrderNotifier` (dependent on `IEventBus`)
- Coordination: `OrderService` composes validator/reader/writer/notifier and event bus

#### Kitchen Management
This namespace models kitchen operations and decision logic:
- Queue ordering: `IPrioritizationStrategy` → `ComplexityStrategy` / `ServiceTimeStrategy` / `CapacityStrategy`
- Station data: `IKitchenStationRepo` → KitchenStationRepo
- Alerting: `IAlertDispatcher` → `StationAlertDispatcher` (dependent on `IEventBus`)
- Display: `IKDSDisplay` → `KDSService` (dependent on `IKitchenStationRepository`, `IEventBus`)
- Coordination: `KitchenEngine` composes strategy, bus, alert dispatcher, and display

#### Inventory Management
This namespace consolidates sensing and inventory governance:
- Sensors: `ISensor` → `WeightSensor` / `TemperatureSensor` / `HumiditySensor`
- Persistence: `IInventoryRepository` (interface)
- Alerts: `IStockAlertService` → `StockAlertService` (dependent on repository + `IEventBus`)
- Safety: `ITemperatureMonitor` → `TemperatureMonitor`
- Coordination: `InventoryService` composes `List<ISensor>` with repository and monitoring/alert services

#### DashboardAnalytics
This namespace provides analytical and real-time reporting capabilities:
- Analytics: `IAnalyticsEngine` → `OrderAnalyticsEngine`, `PredictiveEngine`
- Real-time: `IRealtimeDataProvider` → `RealtimeDataAggregator` (dependent on `IEventBus`, `ICache`)
- Export: `IReportExporter` → `PDFReportExporter`, `CSVReportExporter`
- Coordination/UI boundary: `DashboardController` depends on analytics, real-time provider, exporter, and logger

---

#### 3. SOLID analysis

#### S — Single Responsibility Principle (SRP)
**Conceptual statement:** SRP requires that a module exhibit high cohesion with respect to a single primary responsibility; consequently, it should have a limited and well-defined set of reasons to change. In object-oriented design, SRP is often realized by distinguishing *coordination* from *domain rules* and from *technical details*.

**Evidence in the diagram:**

1) **Separation of orchestration from validation and persistence**
- `OrderService` coordinates the ordering workflow (place/cancel/status) but delegates validation to `IOrderValidator` (`OrderValidator`) and data access to `IOrderReader`/`IOrderWriter` (`OrderRepository`).
- This separation constrains the impact of change: modifications to validation policy (e.g., menu constraints) need not affect the transaction workflow, and changes in persistence (schema, storage technology) need not alter business coordination.

2) **Decomposition of kitchen concerns into strategy, alerting, and presentation**
- Queue decision logic is encapsulated in `IPrioritizationStrategy` implementations; alert emission is externalized to `IAlertDispatcher`; display operations are represented by `IKDSDisplay`.
- `KitchenEngine` thus functions as an orchestrator that composes specialized collaborators, reducing the probability that unrelated changes (e.g., KDS integration changes) propagate into queue policy code.

3) **Inventory responsibilities partitioned by function**
- `StockAlertService` addresses stock threshold detection and alert emission, while `TemperatureMonitor` addresses safety-range evaluation.
- `InventoryService` aggregates these concerns at the coordination level rather than conflating threshold logic, safety logic, and sensor IO into a monolithic class.

---

#### O — Open/Closed Principle (OCP)
**Conceptual statement:** OCP prescribes that stable components should remain closed to modification while allowing system behavior to be extended. The usual mechanism is to express variability through abstractions and to select concrete behavior through composition (e.g., Strategy, Adapter, Decorator).

**Evidence in the diagram:**

1) **Strategy-based extensibility in kitchen prioritization**
- `KitchenEngine` depends on `IPrioritizationStrategy`; hence, new prioritization policies can be introduced via additional implementations without editing `KitchenEngine`.
- This arrangement reduces regression risk in the orchestration logic, concentrating change into newly introduced classes.

2) **Adapter-based extensibility in IoT protocols**
- `DeviceGateway` depends on `IProtocolAdapter`; additional protocols are introduced by adding new adapter implementations.
- The gateway thus remains insulated from protocol-specific parsing/serialization details.

3) **Exporter-based extensibility in reporting**
- `DashboardController` relies on `IReportExporter`, enabling new output formats by adding exporter implementations rather than by expanding conditional logic within the controller.

4) **Pluggable infrastructure implementations**
- The event bus (`IEventBus`) and cache (`ICache`) are abstracted.

---

#### L — Liskov Substitution Principle (LSP)
**Conceptual statement:** LSP requires that objects of a subtype (or implementation) be substitutable for objects of a supertype (interface) without compromising correctness. While the diagram indicates substitutability structurally (via interfaces), behavioral substitutability depends on consistent semantics across implementations.

**Evidence in the diagram:**

1) **Event bus substitutability (`IEventBus`)**
- Numerous clients depend on `IEventBus` (e.g., `EventOrderNotifier`, `StationAlertDispatcher`, `StockAlertService`, `DeviceGateway`).
- For LSP compliance, these implementations must agree on semantic expectations: publication guarantees, subscription lifecycle semantics, ordering guarantees (if required), and failure handling behavior.

2) **Protocol adapter substitutability (`IProtocolAdapter`)**
- `DeviceGateway` should be able to process device messages using any adapter implementation.
- LSP requires that adapters maintain consistent pre/postconditions (e.g., parse errors are reported uniformly; serialization is reversible within the domain constraints).

3) **Exporter substitutability (`IReportExporter`)**
- Exporters should accept the same report object and produce a valid file without requiring controller-side conditional logic beyond selecting an exporter.

---

#### I — Interface Segregation Principle (ISP)
**Conceptual statement:** ISP advocates that interfaces be client-specific and minimal, avoiding “fat” interfaces that force implementers and consumers to depend on irrelevant operations. ISP reduces coupling and tends to improve testability and composability.

**Evidence in the diagram:**

1) **Explicit read/write segregation for orders**
- `IOrderReader` and `IOrderWriter` separate query responsibilities from command responsibilities.
- This enables read-only clients (notably `OrderAnalyticsEngine`) to depend solely on `IOrderReader`, thereby reducing accidental coupling to mutation operations.

2) **Decomposition of device management responsibilities**
- `IDeviceRegistry` (device metadata and status) is distinct from `IConnectionMonitor` (liveness/last-seen).
- Clients can adopt only the needed dependency set; for example, a monitoring component need not depend on registration operations.

3) **Separation between analytics and real-time feeds**
- `IAnalyticsEngine` is distinct from `IRealtimeDataProvider`, which reflects different data lifecycles (batch/report generation vs near-real-time operational snapshots).

---

#### D — Dependency Inversion Principle (DIP)
**Conceptual statement:** DIP states that high-level policy modules should not depend on low-level details; rather, both should depend on abstractions. Additionally, abstractions should not depend on details; details should depend on abstractions. This principle is closely associated with inversion of control and dependency injection.

**Evidence in the diagram:**

1) **High-level modules depend on interfaces**
- `OrderService` depends on `IOrderValidator`, `IOrderReader`, `IOrderWriter`, `IOrderNotifier`, and `IEventBus`.
- `KitchenEngine` depends on `IPrioritizationStrategy`, `IEventBus`, `IAlertDispatcher`, and `IKDSDisplay`.
- `InventoryService` depends on `ISensor`, `IInventoryRepository`, `IStockAlertService`, and `ITemperatureMonitor`.
- `DashboardController` depends on `IAnalyticsEngine`, `IRealtimeDataProvider`, `IReportExporter`, and `ILogger`.
- `DeviceGateway` depends on `IProtocolAdapter`, `IDeviceRegistry`, `IConnectionMonitor`, and `IEventBus`.

2) **Low-level details are positioned behind those interfaces**
- Concrete infrastructure (e.g., `ValkeyCache`) is a detail hidden behind `ICache`.
- Concrete data access (e.g., `MenuRepository`, `OrderRepository`) is a detail hidden behind domain-facing interfaces (`IMenuReader`, `IOrderReader`, `IOrderWriter`).

---

## 3.4 Component-and-Connector View (C&C)
### 3.4.1 Overview
The Component-and-Conector (C&C) view shows elements that has some runtime presence, such as processes, objects, clients, servers, data stores and the communication patterns between clients, services, Iot devices and infrastuctures components.

This view is vital for IRMS as the system must support both synchronous (HTTP/ REST) and asynchronous (event-driven/ MQTT) processing for IoT data, kitchen operations, and staff and manager notifications.

---

### 3.4.2 C&C diagram

![alt text](<"C&C view.png">)

---

### 3.4.3 Main components
The system consists of the following runtime components:

**External and Gateway Layer**

- IoT devices: It shows external clients, such as customer tablets and load-sensors.
- API Gateway: It acts the entry point for extrenal clients, routing requests to internal services through HTTP/ REST
- Device Gateway (IoT Gateway): It handles communication with IoT devices, such as load-cell sensors and forwards data to backend services.

**Core services**

- Menu Service: Provide menu data and interacts with cache for performance optimization.
- Order Service: Handle order creation and processing. Publishes order events to the event bus.
- Kitchen Engine: Process orders, prioritize tasks and coordinate kitchen workflow
- KDS Service: Display real-time order status for kitchen staff
- Dashboard Controller: provide monitoring and analytics dashboards for managers.
- Stock Alert Service: Monitor inventory level and trigger alerts when the stock runs low.

**Infrastructure Component**
- Event Bus (Mosquito MQTT): A message broker enables asynchronous communication using the publish–subscribe pattern.
- Cache (Valkey): Store frequently accessed data such as menu information to reduce latency.
- Logger (Console Logger): Capture system logs for monitoring and debugging.
--- 

### 3.4.4 Connectors
The system uses two types of connectors:

**1. Asynchronous Communication (Event-Driven)**

- Implemented using Mosquitto MQTT Event Bus
- Services communicate via publish–subscribe pattern
- Enables loose coupling and real-time updates

**Examples**

- Order Service → publishes order events
- Kitchen Engine → subscribes to process orders
- KDS Service & Dashboard → subscribe to update UI

**2. Synchronous Communication**

- It's used for direct interactions between components
- It's implemented via HTTP/REST or direct method calls

**Examples**

- API Gateway → Order Service (HTTP request)
- Menu Service ↔ Cache (get/set data)
- Dashboard → Logger (write logs)

### 3.4.5 Key Runtime flow
#### 1. Order Flow

Customer tablet → API Gateway → Order Service → Event Bus → KDS Service → Dashboard

**Description:**

Customers place orders via tablets. The API Gateway forwards requests to the Order Service, which processes and publishes events. These events are consumed by the KDS Service and Dashboard for real-time updates.


#### 2. Inventory Flow

Load-cell Sensor → Device Gateway → Sensor Processing → Stock Alert Service → Manager Dashboard

**Description:**

IoT sensors monitor ingredient levels. Data is transmitted through the Device Gateway and processed to detect low stock conditions, triggering alerts for managers.

#### 3. Notification Flow

Kitchen Engine → Event Bus → Notification/Alert Service → Kitchen Display

**Description:**

When delays or overloads occur, the Kitchen Engine publishes events that trigger notifications for kitchen staff.

---

### 3.4.6 Design Rationale
- Support real-time processing using event-driven communication
- Ensure loose coupling between services via the event bus
- Enable scalability, allowing independent deployment and scaling of services
- Improve performance using caching mechanisms
- Facilitate IoT integration through a dedicated Device Gateway

---

### 3.4.7 Trade-offs
While the architecture provides flexibility and scalability, it introduces several trade-offs:

- Increased complexity in debugging due to asynchronous communication
- Eventual consistency instead of strong consistency
- Dependency on message broker availability (Mosquitto)
- Additional infrastructure overhead for managing event bus and IoT integration

## 3.5 Allocation View
### 3.5.1 Overview
The Allocation View (or Deployment View) illustrates how the software components of the IRMS system are packaged and deployed in a real-world environment. According to the latest design decisions, the system is streamlined and centrally deployed on a Docker platform, making it easy to manage, install, and optimize resources for restaurant environments without the complexity of large-scale orchestration systems.
![alt text](<Technology choices noted on the diagram.png>)

---

### 3.5.2 Deployment Components
The system is divided into two main areas: the physical environment (containing IoT devices) and the Docker environment (containing all the system's logic and data).

| **Deployment Zone**   | **Ingredients as requested**           | **Mapping to the actual Docker architecture**                                                                                                                                                                                                           | **Protocol**     |
| :-------------------: | :------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------------: |
| **Customer Zone**     | Smart tablets, QR code scanners        | Customers use mobile devices to access the container. **Web UI** Use your browser to view the menu and place your order.                                                                                                                                | HTTP/HTTPS       |
| **Kitchen Zone**      | KDS displays, staff alert devices      | Kitchen access screen **Web UI** To display the queue. Alarm devices receive signals from the system via API Gateway or WebSockets.                                                                                                                     | HTTP, WebSockets |
| **Sensor Layer**      | Load-cell sensors, temperature sensors | These are **Sensors** The physicists, who continuously measure the weight and temperature of the materials, act as publishers, pushing the data up to the system.                                                                                       | MQTT             |
| **Edge/Local Server** | IoT Gateway, local MQTT broker         | Handled by containers **Mosquitto** It acts as an MQTT Broker. It receives all high-speed IoT data from the Sensor Layer before sending it to the Services for processing.                                                                              | MQTT, TCP        |
| **Cloud/Backend**     | Microservices, Event Bus, Databases    | Includes a core container processing unit: **API Gateway** Request navigation. **Services** Contains business logic. **Valkey**: Acts as an in-memory cache and Pub/Sub mechanism (replacing Kafka/Event Bus). **PostgreSQL**: Persistent data storage. | REST, TCP/IP     |
| **Manager Zone**      | Dashboard web app, analytics           | Manage personal PC/Laptop access **Web UI** (via API Gateway) to view sales, inventory, and kitchen performance reports.                                                                                                                                | HTTPS / REST     |

--- 

### 3.5.3 Technology Stack Decisions
**Containerization Technology (Docker):** The entire backend, UI, database, and broker are packaged into containers running in a Docker environment (managed via Docker Compose). This decision makes it easy to deploy the entire system to a single server (such as a powerful local server in a restaurant or a cloud VM) while ensuring isolation between services.

**Replacing Caching/Pub-Sub Systems with Valkey:** Valkey is used to optimize performance and reduce the load on the database. Fast-access data (such as temporary menus, user sessions) or events requiring internal processing between services will pass through it.

**IoT Communication via Mosquitto:** Eclipse Mosquitto is chosen as a robust bridge (MQTT broker) between a range of physical sensors and the services block. The MQTT protocol ensures minimal bandwidth usage, suitable for IoT environments.

---

## 3.6 Architecture Decisions (ADRs)
The architectural design of IRMS is documented decisions in the repository under `docs/adr/`. These ADRs capture design choices, context and consequences.
ADRs are documented specifically in Appendix A. Each ADR follow a standard format including Title, Context, Decision and Consequences.

A summary of key decisions is presented as the below:
- ADR-001: Adopt Service-Based Architecture with Event-Driven Communication
- ADR-002:  Use MQTT as the IoT Communication Protocol
- ADR-003: Use Eclipse Mosquitto as the Message Broker.
- ADR-004: Use API Gateway Pattern for External Client Access
- ADR-005: Use Docker for deployment.

## 3.7 Design Principles

**Overview** To ensure consistent code implementation and strict adherence to the established system architecture, the IRMS development team applies core design principles. These principles serve as a guide for all decisions at the service and module levels, helping the system achieve non-functional requirements (NFRs) such as maintainability, fault tolerance, and real-time performance.

**Core design principles in IRMS**

**1. Separation of Concerns**
* **Applications in IRMS:** Each microservice (or module) owns and manages a completely independent business boundary (bounded context). For example, Ordering, Kitchen, and Inventory operate separately.
* **Architectural Links:** This principle directly supports the decision to use Service-Based Architecture, meeting the NFR-06 (Maintainability) criteria, which allows for easy partial updates without affecting the entire system.

**2. Single Responsibility**
* **Applications in IRMS:** Each software component performs only one task. Specifically, the Order Validation Service only checks the validity of the order; it is absolutely not involved in sorting or routing orders to the kitchen.
* **Architectural Links:** Ensuring high modularity in the Module View structure makes the code easy to read and maintain.

**3. Loose Coupling**
* **Applications in IRMS:** The services communicate with each other primarily through events, rather than relying on direct API calls.
* **Architectural Links:** Adhering to the decision to use Event-Driven Communication, by using Valkey and Mosquitto as intermediaries, the ordering system continues to function normally even if the kitchen system is overloaded, ensuring NFR-03 availability.

**4. High Cohesion**
* **Applications in IRMS:** All the logic related to arranging and managing kitchen queues (kitchen queue logic) is entirely centralized within the Kitchen Management module.
* **Architectural Links:** Minimize unnecessary network calls between services, supporting faster real-time processing speeds with NFR-01 (Performance).

**5. Fail Fast**
* **Applications in IRMS:** Any invalid orders (incorrect format, missing information) will be rejected immediately at the API Gateway, instead of being allowed to pass through the internal processing pipelines.
* **Architectural Links:** This helps protect the system from junk data and aligns with the decision to adopt the API Gateway template.

**6. Design for Failure**
* **Applications in IRMS:** The system acknowledges that network connections or devices can fail at any time. Therefore, each service is designed with built-in circuit breakers and fallback behaviors.
* **Architectural Links:** Directly address NFR-05 (Reliability) and enhance Fault Tolerance characteristics for the entire system.

**7. Observability by Design**
* **Applications in IRMS:** All services must generate structured logs, performance metrics, and distribution traces from the very beginning of development.
* **Architectural Links:** This helps compensate for the difficulty in tracking data flow inherent in event-driven mechanisms, ensuring the system achieves NFR-09 (Observability).














