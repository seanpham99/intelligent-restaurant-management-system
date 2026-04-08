# 3. Software Architecture
## 3.1 Architecture Characteristics
## 3.2 Architecture Style Selection
### 3.2.1 Candidate Architecture Styles
There are some architecture styles that are considered for the Intelligent Restaurant Management System (IRMS):
- **Monolithic**: combines all of an application's components into a single, inseparable unit
- **Microservices**: develops software applications as a collection of small, independent services that communicate with each other over a network.
- **Service-based**: a distributed macro layered structure consisting of a separately deployed user interface, separately deployed remote coarse-grained services, and a monolithic
database
- **Event-Driven**: system components communicate by producing and responding to events, such as user actions or system state changes. Components are loosely coupled, allowing them to operate independently while reacting to events in real time
- **Layered (N-Tier)**: The system is divided into layers such as presentation, business logic, persistence and database, each responsible for a certain communication component.

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


### 3.2.3 Analysis
_ Monolithic architecture performs poorly in elasticity and fault tolerance. It cannot efficiently handle peak order loads during busy hours, and a failure in one component can affect the entire system. It also lacks support for real-time processing and interoperability with IoT devices.

_ Layered architecture improves modularity and maintainability, but still suffers from limited elasticity and real-time processing capabilities. It is not ideal for systems requiring high responsiveness and distributed IoT integration.

_ Event-Driven architecture performs strongly in real-time processing and interoperability. It is highly suitable for handling IoT data streams such as sensor updates, order events, and alerts. It also supports elasticity by decoupling components. However, it introduces challenges in observability and debugging.

_ Microservices architecture provides excellent scalability, fault tolerance, and modularity. It supports independent scaling and deployment of services. However, it significantly increases system complexity, especially in terms of deployment, communication, and monitoring.

_ Service-Based architecture is the most suitable option. It provides sufficient modularity and scalability while maintaining manageable complexity. It also supports interoperability with IoT systems and can be combined with event-driven communication to handle real-time processing effectively.

### 3.2.4 Selected Architecture Style
Although Event-Driven architecture achieves the highest score because it supports for real-time processing and IoT integration, but it is not selected as the primary architecture style due to its complexity in system management and debugging. As a result, the IRMS adopts a Service-Based Architecture as the primary architectural style.

To meet the requirements of real-time processing and IoT integration, the system incorporates event-driven communication mechanisms between services and IoT components.

Each service is implemented as a modular monolith, allowing easier development, testing, and maintenance.

The codebase is managed using a monorepo strategy to ensure consistency and simplify collaboration.

**Conclusion**: Based on comparison, our team has selected a hybrid approach between service-based for overall architecture and Event-Driven mechanisms for real-time IoT communications.

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
### 3.2.6 Architecture Decison Record (ADR)
### ADR-001: Hybrid approach 
**Status:** Accepted
**Date:** 2025-04-08

#### Context
The IRMS IRMS must support real-time order processing, IoT device integration (e.g., smart menus, kitchen display systems, load-cell sensors, temperature sensors), and multiple business functions such as ordering, kitchen coordination, inventory tracking, notifications, and dashboards.
The system is expected to handle peak loads during busy hours, provide fast updates to dashboards, and ensure that critical components such as the Kitchen Display System remain operational even if other parts of the system fail.
At the same time, the system is developed by a student team, requiring a balance between scalability and implementation complexity.


#### Decision
- The system adopts a Service-Based Architecture as the overall architectural style.
- To support real-time processing and IoT integration, the system incorporates Event-Driven communication mechanisms between services and IoT components.
- Each service is implemented as a modular monolith.
- Use monorepo to manage codebase.

#### Consequences
**Positive:** 
- Improve modularity and separation of concerns  
- Support for real-time updates and IoT integration  
- Lower complexity compared to full microservices  
- Easier development and debugging for the team  
- Scalable at service level  

**Negative:**
- Less scalable than microservices
- Event-driven is difficult to debug and trace
- Potential coupling between services if not well designed
- Require event coordination and monitoring

**Risks:**
- **Risk: Event processing latency or message loss**  
  IoT events, such as order updates, sensor data may be delayed or lost due to network or messaging issues.  
  → *Mitigation:* Implement retry mechanisms, message acknowledgment, and persistent queues.

- **Risk: Difficulty in debugging asynchronous flows**  
  Event-driven communication makes it harder to trace down problems.  
  → *Mitigation:* Use centralized logging and monitoring tools.

- **Risk: Performance bottlenecks during peak hours**  
  High order volume may overload certain services, such as Order, Inventory, Kitchen and Dashboard Service.  
  → *Mitigation:* Apply load balancing and scale critical services.

- **Risk: Service coupling through poorly designed events**  
  Poorly defined event contracts may lead to tight coupling between services.  
  → *Mitigation:* Define clear event schemas and versioning strategies.

- **Risk: Single point of failure in shared infrastructure**  
  Message brokers or databases may become bottlenecks.  
  → *Mitigation:* Use redundancy and failover mechanisms.

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







