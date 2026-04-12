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
### 3.3.1 Overview

The Module View presents the structural decomposition of the Intelligent Restaurant Management System (IRMS) into its primary modules and sub-modules. This view answers the question: *what units make up the system, what is each unit responsible for, and how do they depend on each other?*

The IRMS is decomposed into **six top-level modules**, arranged in two tiers:

- **Domain Tier (top row):** Customer Ordering, Kitchen Management, Inventory Management
- **Platform Tier (bottom row):** Dashboard & Analytics, IoT Gateway, Infrastructure

Each top-level module contains three sub-modules, which exist as **Is-Part-Of** decompositions of their parent — they are internal components that together realize the module's full responsibility.

---

### 3.3.2 Module View Diagram

DrawIO: https://drive.google.com/file/d/1afl59XtYECn7Y1KYi-1PMilPNwUwaOC7/view?usp=sharing

### 3.3.3 Module Descriptions

#### Customer Ordering Module
Responsible for receiving and processing customer food orders placed through IoT-enabled devices such as QR menus and smart tablets. This module acts as the system's primary ingestion point for order data.

| Sub-module | Responsibility |
|---|---|
| QR Menu Service | Renders and serves the digital menu to customers via QR code or tablet interface |
| Order Validation Service | Validates submitted orders for completeness, item availability, and structural correctness before further processing |
| Order Categorization Service | Classifies each validated order item by type (e.g., drink, appetizer, main dish) and routes it to the appropriate kitchen station |

---

#### Kitchen Management Module
Manages the real-time flow of orders to kitchen stations, prioritizes the preparation queue, and ensures kitchen staff are informed of their workload and any issues requiring attention.

| Sub-module | Responsibility |
|---|---|
| Kitchen Display System (KDS) Service | Pushes order updates to IoT-connected KDS screens at each kitchen station in real time |
| Queue Prioritization Engine | Dynamically reorders the preparation queue based on dish complexity, station load, and customer service time commitments |
| Staff Notification Service | Emits alerts to kitchen staff when dishes require special attention or when a station becomes overloaded |

---

#### Inventory Management Module
Monitors ingredient levels and storage conditions using IoT sensor data, ensuring kitchen staff and managers are notified before stockouts occur or food safety thresholds are breached.

| Sub-module | Responsibility |
|---|---|
| Sensor Data Collector | Continuously collects weight readings from load-cell sensors and temperature readings from fridge/freezer sensors |
| Stock Alert Service | Compares real-time ingredient levels against configured thresholds and triggers low-stock notifications |
| Temperature Monitor Service | Evaluates temperature sensor readings against food safety standards and raises alerts on violations |

---

#### Dashboard & Analytics Module
Provides managers and staff with real-time operational visibility, business analytics, and predictive insights derived from system-wide data.

| Sub-module | Responsibility |
|---|---|
| Real-Time Dashboard Service | Aggregates and displays live order status, kitchen load, device health, and active alerts |
| Analytics & Reporting Service | Generates reports on order flow, table turnover, payment status, and operational KPIs |
| Predictive Insight Engine | Applies forecasting logic to support staffing decisions, menu optimization, and peak hour prediction |

---

#### Gateway Module
Acts as the single integration boundary between all physical IoT devices and the IRMS platform, normalizing device communication through a standard protocol layer.

| Sub-module | Responsibility |
|---|---|
| MQTT Broker Interface | Manages publish/subscribe messaging between all IoT devices and IRMS services using MQTT v3.1.1 or v5.0 |
| Device Registry | Maintains the registry of connected devices, their types, statuses, and assigned roles within the system |
| Protocol Adapter | Translates vendor-specific or non-standard device payloads into the canonical IRMS domain event format |

---

#### Infrastructure Module
Provides the foundational shared services that all other modules rely on for cross-cutting concerns including messaging, API routing, and identity management.

| Sub-module | Responsibility |
|---|---|
| Event Bus (Message Broker) | Delivers asynchronous events between modules to decouple producers from consumers |
| API Gateway | Acts as the single entry point for all external HTTP/S requests, handling routing, rate limiting, and load balancing |
| Auth Service | Manages authentication and role-based authorization for all system users and services |

---

### 3.3.4 Module Dependencies (Uses Relationships)

The following table documents all **«uses»** dependencies — relationships where one module depends on services provided by another at runtime.

| From | To | Relationship | Description |
|---|---|---|---|
| Customer Ordering | Kitchen Management | «uses» | Sends validated and categorized orders to kitchen stations |
| Customer Ordering | IoT Gateway | «uses» | Receives incoming order events from IoT ordering devices via MQTT |
| Kitchen Management | Inventory Management | «uses» | Triggers ingredient stock checks when orders are processed |
| Kitchen Management | IoT Gateway | «uses» | Pushes order updates to KDS screens via MQTT |
| Inventory Management | IoT Gateway | «uses» | Receives sensor data (weight and temperature) from IoT sensors |
| Dashboard & Analytics | Customer Ordering | «uses» | Reads real-time and historical order status data |
| Dashboard & Analytics | Kitchen Management | «uses» | Reads kitchen workload, queue state, and station performance |
| Dashboard & Analytics | Inventory Management | «uses» | Reads inventory levels and alert history for reporting |
| IoT Gateway | Infrastructure | «uses» | Publishes normalized device events onto the Event Bus |
| All domain modules | Infrastructure | «uses» | All domain modules depend on Auth Service and API Gateway for identity and routing |

---

### 3.3.5 Key Architectural Observations

1. **Infrastructure as a shared foundation.** The Infrastructure Module is the only module on which all other modules depend for cross-cutting services. This makes it the highest-stability module in the system — its interfaces must be backward-compatible and its components highly available.

2. **IoT Gateway as the integration boundary.** The IoT Gateway isolates all device-specific protocol and payload concerns from domain logic. Domain modules never communicate directly with physical devices; they only consume normalized events from the gateway.

3. **Dashboard as a read-only consumer.** The Dashboard & Analytics Module depends on three domain modules but does not write back to any of them. This unidirectional dependency supports independent evolution of the analytics module and avoids tight coupling with the operational core.

4. **Customer Ordering as the system entry point.** Module is the starting point of every customer-initiated workflow. Its dependency on both and reflects its role as the coordinator between the customer-facing interaction layer and the kitchen-facing execution layer.

---

## 3.4 Component-and-Connector View (C&C)
### 3.4.1 Overview
The Component-and-Conector (C&C) view shows elements that has some runtime presence, such as processes, objects, clients, servers, data stores and the communication patterns between clients, services, Iot devices and infrastuctures components.

This view is vital for IRMS as the system must support both synchronous (HTTP/ REST) and asynchronous (event-driven/ MQTT) processing for IoT data, kitchen operations, and staff and manager notifications.

---

### 3.4.2 C&C Components

| Component | Module | Main responsibility | Intances |
| :--- | :--- | :--- | :--- |
| `customerTablet : ClientApp` | Client Module | Allow customers to place orders through QR menus or tablet | 1..n |
| `apiGateway : APIGateway` | API Gateway Module | Entry point for all external client requests | 1..2 |
| `orderService : OrderService` | Ordering Module | Process and validate orders | 1..2 |
| `eventBus : MessageBroker` | Messaging Module | Handle asynchronous communication using publish-subscribe pattern | 1 |
| `kdsService` : `KDSService` | Kitchen Module | Update KDS with detailed order information | 1 |
| `staffDashboard` : `StaffDashboard` | UI Model |Display real-time operational data | 1 |
| `managerDashboard` : `ManagerDashboard` | UI Model | Display analytics, alerts, order status and kitchen load | 1 |
| `loadCellSensor` : `LoadCellSensor` | Iot Module | Iot device tracks ingredient levels | 1..n |
| `iotGateway` : `IotGateway` | Iot Module | Receive and forward sensor data | 1 |
| `sensorCollector` : `SensorCollectorService` | Inventory Module | Process raw sensor data | 1 |
| `stockAlertService` : `StockAlertService` | Inventory Module | Detect the low level of ingredients and send alert | 1 |
| `staffNotificationService` : `StaffNotificationService` | Notification Module | Send notifications and alerts to staff | 1 | 
| `kitchenDisplay` : `KitchenDisplay` | Kitchen Module | Display orders and notiofications in the kitchen | 1 |
| `postgreDb` : `PostgreSQL` | Data Module | Store data | 1 |

---

### 3.4.3 Connector and Communication Types
IRMS uses three main types of connectors: Synchronous, Asynchronous communication and database access.
#### 1. Synchronous Communication (HTTP/ REST)
Synchronous connectors are utilized for interactions where an immediate acknowledgement or data response.

- `customerTablet` → `apiGateway`: Submit orders and receive real-time validation.
- `managerDashboard` → `apiGateway`: Fetch analytics and manage menu configurations.
- `apiGateway` → `orderService`: Forward high-priority business logic requests.

**Role:**
- Client → Request Handler: Clients initiates requests, while backend provides Request Handlers to process and respond to these calls.
- Caller → Service Provider: The apiGateway serves as the Caller, orchestrating requests to the orderService, which acts as the Functional Service Provider.

#### 2. Asynchronous Communication (Event-driven/ MQTT)
Asynchronous connectors decouple the system components, allowing for background to process and handle Iot communication:

- `orderService` → `eventBus` : The `orderService` publishes a 'new order' event to `eventBus`.
- `eventBus` → `kdsService` : The `kdsService` subscribed to this topic, it updates instantly the Kitchen's view.
- `loadCellSensor`  →  `iotGateway` → `eventBus` : Data from `loadCellSensor` is routed through the `iotGateway` to the `eventBus`.
- `eventBus` → `sensorColector`
- `sensorCollector` → `stockAlertService`
- `stockAlertService` → `eventBus`
- `eventBus` → `staffNotificationService`
- `eventBus` → `kdsService`
  - The sensorCollector processes this stream, enabling the `stockAlertService` to trigger notifications for the `staffNotificationService`
without blocking the main order flow.

**Role:**
- Publisher → EventBus → Sunscriber: Sensors or Services act as Publishers, broadcasting messages to specific Topics. The eventBus manages the routing to Subscribers, ensuring resilient delivery even during network fluctuations or high traffic spikes.

#### 4. Database Access
- Communication between functional services and postgreDb through synchronous database connections.
- orderService ↔ postgreDb
- sensorCollector ↔ postgreDb
- Role: Reader/ Writer

--- 

### 3.4.4 Key Runtime flow
#### 1. Order Flow

Customer tablet → API Gateway → Order Service → Event Bus → KDS Service → Staff Dashboard

Description:
- Customers submit an order through tablet or QR menus
- API Gateway receives the request and delivers it to Order Service
- Order Service process the order and publishes an event to the Event Bus
- The KDS Service subscribes to the event and updates the kitchen display
- Staff Dashboard updates order status for staff monitoring.


#### 2. Inventory Flow

Load-cell Sensor → IoT Gateway → Sensor Collector → Stock Alert Service → Manager Dashboard

Description:
- Load-cell Sensors send ingredient level data.
- The IoT Gateway receives and forwards this data.
- The Sensor Collector processes raw data.
- The Stock Alert Service detects the low level of inventory
- The Manager Dashboard displays alerts and inventory status.

#### 3. Notification Flow

Event Bus → Staff Notification Service → Kitchen Display

Description:
- Events such as delays, overload, or alerts are published to the Event Bus.
- The Staff Notification Service manages these events.
- Notifications are sent to the Kitchen Display to process

---

### 3.4.5 Identify Ports and Roles
Component communicate by exposing ports that fulfill designated roles within each connector:

| Component | Port | Direction | Role |
| :--- | :--- | :--- | :--- |
| apiGateway | REST API | in | Request Handler |
| orderService | service API | in | provider |
| orderService | event-out | out | publisher |
| eventBus | MQTT topic | in/ out | broker |
| kdsService | event-in | in | subscriber |
| sensorCollector | event-in | in | subscriber |
| stockAlertService | event in/ out | in/out | subscriber/ publisher |
| staffNotificationService | event-in | in | subscriber | 
| postgreDb | DB Connection | in/out | storage provider | 

---

### 3.4.6 C&C Diagram
![alt text](<"C&C view.png">)

---

### 3.4.7 Consider Performance
The C&C view supports the evaluation of runtime quality attributes:

- Responsiveness: when customer submit order, the systems will receive an immediate HTTP response from API Gateway
- Scalability: By adopting asynchronous messaging, we can decouple producers from consumersto scale independently and more efficiently based on demand.
- Reliability: By integrating a message broker, we've successfully minimized the direct dependencies between internal services. This setup ensures that event delivery remains resilient, as messages can be queued and retried even if a specific service temporarily goes offline.
- Maintainability: Our architecture clearly divides the gateway, backend services, broker, and display clients into distinct layers. This separation makes it much easier to trace responsibilities and debug issues, as each component has a well-defined role within the restaurant system.
- IoT support: We chose MQTT specifically for its efficiency in handling lightweight sensor data. It allows our IoT devices to publish events frequently—such as table occupancy or temperature updates—without putting a heavy strain on the network or hardware resources.

---

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







