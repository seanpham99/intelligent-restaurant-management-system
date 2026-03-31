**Classification of quality attributes**

To ensure the architecture of the restaurant management system meets actual operational requirements, clearly defining Non-Functional Requirements (NFRs) is mandatory. This report establishes at least 10 core NFRs, quantified by specific numbers to provide a solid basis for testing and acceptance. These criteria are categorized based on the international software quality standard ISO/IEC 25010.

The system's NFRs are divided into five main quality attribute groups, each with stringent measurement criteria as follows:

NFR-01 Performance: Time from order placement to display on the kitchen counter (KDS) is small or equal to 2 seconds at the 95th percentile (P95) during rush hour.

NFR-02 Scalability: The processing system runs smoothly. Greater than or equal to 50 IoT devicesSimultaneous connection across each restaurant; automatically scales to support up to 10 restaurants. 500 restaurants without violating NFR-01.

NFR-03 Availability: Uptime reached Greater than or equal to 99,9% during opening hours (maximum downtime ~43.8 minutes/month).

NFR-04 Security: 100% In-transit data is encrypted using TLS 1.3; at-rest data is encrypted using the AES-256 algorithm.

NFR-05 Reliability: The architecture has no single point of failure (No SPOF). The automatic failover process to the sub-cluster must be completed within≤ 30 seconds.

1.  **In-depth Criteria Analysis**

*   **NFR 01 (Performance)**

Efficiency is crucial for F&B systems. Committing to a latency of under 2 seconds from the moment the cashier clicks "Pay" until the kitchen receives the payment requires a system design that strictly manages time budget (Latency Budget).

*   To achieve a total time of 2000ms, the system allocates latency as follows:
*   Network and API Gateway (API Gateway/Load Balancer): ~150ms
*   Order Service Logic Processing: ~300ms
*   Database write: ~200ms
*   Message Broker and Network push to KDS: ~250ms
*   Rendering the KDS interface: ~100ms

Potential bottlenecks: Using synchronous queries when connecting to third parties (payment gateways) can consume 2-5 seconds, directly violating NFR-01. Additionally, kitchen appliance architecture (KDS) using a continuous API call (Polling) model instead of a data stream (Push) model will cause severe bandwidth congestion during peak hours.

### Proposed Architectural Solution:

*   Event-Driven Architecture: Utilizes a Message Broker (Kafka/RabbitMQ). As soon as an order is provisionally recorded, the system immediately returns the stream to the POS and triggers an event. Let KDS handle asynchronous operations.
*   WebSockets/SSE Communication: Replaces HTTP Polling with WebSockets to maintain a continuous connection from the server to the KDS, enabling data to be pushed to the kitchen display with millisecond latency.
*   **NFR 02 (Scalability)**

Scalability is vital for F&B systems to survive predictable peak hours (e.g., lunch and dinner rushes) and unpredictable traffic spikes (e.g., flash promotions, holiday seasons) without degrading user experience or violating your established latency budgets. Committing to a seamless experience under heavy load requires an elastic system design that scales resources dynamically and efficiently.

*   To handle both baseline operations and sudden 10x traffic spikes, the system targets the following scalability metrics:
*   Throughput (TPS - Transactions Per Second): Capable of scaling from a baseline of 500 TPS to 5,000+ TPS during peak events.
*   Auto-scaling Response Time: Provisioning new service instances and joining the load balancer pool in under 60 seconds.
*   Resource Utilization Buffer: CPU and Memory utilization maintained at ~70% across all active nodes to leave immediate breathing room for sudden surges before auto-scaling catches up.

Potential bottlenecks: Relying on a monolithic, single-node relational database for both reads and writes will inevitably lead to lock contention, query queuing, and exhausted connection pools during high loads. Additionally, deploying stateful backend services (e.g., storing POS session data locally in the application's memory) prevents seamless horizontal scaling and can cause localized node crashes when traffic surges.

*   Proposed Architectural Solution:
*   Microservices & Container Orchestration: Decompose the system into independent microservices (e.g., Order Service, Menu Service, Payment Service). By utilizing Kubernetes (K8s) with Horizontal Pod Autoscaling (HPA), the system can automatically spin up additional instances of highly stressed components (like the Order Service during a lunch rush) without wasting infrastructure budget on scaling idle components.
*   CQRS Pattern & Distributed Caching: Implement Command Query Responsibility Segregation (CQRS) to separate database read operations from write operations. Heavy, high-frequency read requests—such as customers constantly loading the menu or the POS syncing store configurations—are routed through an in-memory distributed cache (like Redis), deflecting up to 90% of traffic away from the primary database.
*   Database Partitioning & Connection Pooling: Distribute the database write load by sharding data across multiple instances, partitioned logically by Tenant ID (restaurant branch) or geographic region. Introduce a connection pooling layer (such as PgBouncer for PostgreSQL) to efficiently multiplex thousands of concurrent incoming connections into a manageable number of backend database connections.
*   **NFR 03 (Availability)**

In the F&B industry, system downtime directly translates to lost revenue, operational chaos, and severe reputational damage. Committing to a highly available system requires an architecture designed to anticipate and survive hardware failures, network outages, and third-party service degradation without dropping core transactional workflows (e.g., taking orders and sending them to the kitchen).

To guarantee continuous operations, the system targets the following reliability metrics:

*   Availability (Uptime SLA): 99.99% for core services (POS, Order Service, KDS), translating to less than 5 minutes of allowed downtime per month.
*   Recovery Time Objective (RTO): < 5 minutes to restore service functionality in the event of a catastrophic regional failure.
*   Recovery Point Objective (RPO): < 1 minute (aiming for near-zero data loss for financial transactions and order states).

Potential bottlenecks: The most common point of failure in an F&B environment is local ISP network instability at the physical restaurant, which can completely sever the POS and KDS from cloud-based backends. Additionally, in the cloud, having Single Points of Failure (SPOFs)—such as a single primary database instance or deploying all services within a single Availability Zone (AZ)—means a minor infrastructure hiccup can bring down the entire system. Relying on synchronous calls to non-essential third parties (like a loyalty rewards API) can also cause cascading failures if that external service goes down.

*   Proposed Architectural Solution:
*   Offline-First POS & Edge Computing: Design the POS applications to function in an "Offline Mode." By utilizing local storage (e.g., IndexedDB or SQLite on the POS client) and a local message queue, staff can continue to take orders and accept cash/offline-approved card payments even during an internet outage. Orders are routed locally to the KDS via the restaurant's LAN, and state changes are synced to the cloud asynchronously once connectivity is restored.
*   Multi-AZ Deployment & Automated Failover: Deploy all critical microservices and message brokers across at least three cloud Availability Zones (Multi-AZ). Implement a primary-replica database architecture with synchronous replication across AZs and automated failover mechanisms. If the primary database node fails, the system automatically promotes a read-replica to primary in seconds without human intervention.
*   Circuit Breaker Pattern & Graceful Degradation: Wrap all calls to external third-party APIs (payment gateways, SMS notifications, loyalty programs) and non-critical internal microservices with Circuit Breakers. If a downstream service fails or times out repeatedly, the circuit trips and returns a safe default or cached response. This prevents thread pool exhaustion and ensures the core order-taking flow degrades gracefully (e.g., skipping loyalty point accumulation temporarily) rather than crashing the POS.
*   **NFR 04 (Security)**

In an F&B system, security is non-negotiable. Handling high volumes of daily transactions means the system processes sensitive payment data (credit cards, e-wallets) and Personally Identifiable Information (PII) for loyalty programs. Committing to a secure architecture requires a proactive defense-in-depth strategy to prevent data breaches, insider threats, and malicious external attacks without slowing down the fast-paced restaurant operations.

To ensure robust protection, the system targets the following security metrics and compliance standards:

*   Authentication Latency: < 50ms per request at the API Gateway to ensure security checks do not consume the strict 2000ms latency budget established in NFR 01.
*   Compliance Standards: Strict adherence to PCI-DSS (Payment Card Industry Data Security Standard) for payment processing and local data privacy regulations (e.g., GDPR, PDPA) for customer data.
*   Data Encryption: 100% of data encrypted in transit (TLS 1.3) and at rest (AES-256 for databases and backups).

Potential bottlenecks: The most severe vulnerabilities in F&B environments often stem from weak physical and network security at the restaurant level, such as deploying POS terminals, KDS displays, and Guest Wi-Fi on the same unsegmented local network. At the software level, storing raw credit card numbers or plain-text customer passwords directly in the central database turns the system into a high-value target for attackers. Additionally, overly permissive internal APIs or using shared, static PINs for all staff members on the POS makes it impossible to audit malicious internal actions (like unauthorized voids or refunds).

*   Proposed Architectural Solution:
*   Tokenization & Offloaded PCI Scope: Never store or process raw Primary Account Numbers (PAN) within the F&B system's database or memory. Utilize a third-party payment gateway's tokenization service. The POS only handles secure tokens returned by the payment terminal, drastically reducing the system's PCI-DSS compliance scope and minimizing risk in the event of a database breach.
*   Zero Trust API Gateway & RBAC: Implement a Zero Trust architecture at the API Gateway level using OAuth 2.0/OpenID Connect. Every incoming request—whether from a POS, a KDS, or a third-party delivery app—must carry a short-lived, cryptographically signed JWT (JSON Web Token). Enforce strict Role-Based Access Control (RBAC) so that a cashier token cannot access back-office inventory APIs, and require multi-factor authentication (MFA) for store managers performing sensitive overrides.
*   Network Segmentation & WAF: Deploy a Web Application Firewall (WAF) in front of the cloud load balancer to actively filter and block common web exploits (like SQL Injection, XSS) and mitigate DDoS attacks. At the physical restaurant level, mandate strict VLAN segmentation to isolate the secure POS/Payment network from the KDS network and the public Guest Wi-Fi.
*   **NFR 05 (Reliability)**

Committing to a highly reliable system means guaranteeing that every financial transaction and kitchen order is processed accurately, regardless of user behavior (like a cashier frantically double-clicking "Pay") or partial system failures.

To guarantee transaction safety and data integrity, the system targets the following reliability metrics:

*   Transaction Error Rate: < 0.01% for all critical order and payment workflows.
*   Idempotency Guarantee: 100% prevention of duplicate transactions on network retries.
*   Message Delivery Semantics: "Exactly-once" processing for financial records and inventory deductions, and "At-least-once" delivery for KDS notifications.

Potential bottlenecks: In a distributed, event-driven architecture, the "dual-write" problem is a major risk. If the Order Service successfully saves an order to the database but crashes a millisecond before publishing the event to Kafka or RabbitMQ, the customer is charged, but the kitchen never receives the ticket. Additionally, mobile or web POS clients experiencing spotty Wi-Fi often automatically retry timed-out requests, which can easily lead to duplicate database entries and double-charging if the backend isn't prepared to handle redundant payloads.

Proposed Architectural Solution:

*   Idempotency Keys for API Endpoints: Mandate that the POS client application (such as a Flutter app) generates a unique, client-side UUID (Idempotency Key) for every order submission or payment attempt. The backend APIs (e.g., built in .NET) check this key against a fast distributed cache (like Redis). If a network timeout causes the POS to retry the exact same request, the backend detects the duplicate key, prevents the second database write, and simply returns the original success response.
*   Transactional Outbox Pattern: To solve the dual-write problem between the database and the message broker, implement an Outbox Pattern. Instead of trying to write to the database and publish to the broker in two separate steps, the Order Service writes the order data and an event payload to a local "Outbox" table within the same ACID database transaction. A separate, lightweight background process then continuously reads the Outbox table and reliably pushes those events to the message broker.
*   Dead Letter Queues (DLQ) & Exponential Backoff: When asynchronous events fail to process—for example, if the KDS service is temporarily overwhelmed—the system must not discard the event. Implement an automatic retry mechanism with exponential backoff. If the message fails after the maximum number of retries, route it to a Dead Letter Queue (DLQ). This ensures zero dropped orders and triggers an alert so an administrator can manually inspect, fix, and replay the failed transaction.

1.  **Architectural Trade-offs**

To meet the 10 NFR standards above, architects need to accept and balance the following core trade-offs:

*   Performance (NFR-01) versus Security (NFR-04):

Implementing AES-256 encryption for data and TLS 1.3 decryption for network I/O streams will increase CPU load and prolong API response times. The engineering team must optimize hardware or use hardware acceleration technologies to ensure that encryption does not eat into the 2-second budget of NFR-01.

*   Scalability (NFR-02) versus Data Consistency:

When a system collects data from tens of thousands of IoT devices across 500 restaurants, maintaining strong consistency (Strict/ACID Consistency) in a distributed database will cause write flow bottlenecks. The system must compromise by using an "Eventual Consistency" model based on the CAP theorem to maintain speed and serviceability.

*   Reliability & Availability (NFR-03, NFR-05) versus Operating Costs:

To achieve point-of-fault (SPOF) zero and 99.9% uptime, the system cannot run on a single server. Deploying redundant infrastructure across multiple availability zones (Multi-AZ) and an Active-Passive database system will double or triple the cost of cloud computing infrastructure.

NFR-06 Maintainability: Each of the five IRMS modules shall be packaged and deployable as an independent service or container unit. In ≥ 90% of standard change releases, modifying one module shall not require the redeployment of any unrelated module.

NFR-07 Usability: A new staff member, with no prior exposure to IRMS, shall be able to complete onboarding and successfully execute one assigned role-specific core task in under 30 minutes. At least 80% of participants in a structured usability evaluation shall meet this threshold.

NFR-08 Interoperability: All IoT device integration within IRMS shall use MQTT v3.1.1 or MQTT v5.0 as the messaging protocol. No proprietary device protocol shall be present in core platform service code, and at least 95% of supported integration scenarios shall operate through standard MQTT conventions.

NFR-09 Observability: 100% of production events related to order processing, device communication, and cross-service requests shall include a correlation ID. All logs shall be ingested and searchable within 60 seconds of emission, and critical failure alerts shall fire within 2 minutes.

NFR-10 Extensibility: Adding a new IoT device type to IRMS shall require only the development of a new adapter or plugin. The five core business modules shall remain unmodified, and integration effort for a standard-compliant device shall not exceed 2 person-days.

1. **In-depth Criteria Analysis**

* **NFR 06 (Maintainability)**

IRMS is composed of multiple functional modules, each with a distinct business responsibility, change cadence, and team ownership. A fundamental characteristic of well-structured software architecture is that change in one part of the system does not ripple unnecessarily into other parts. In a restaurant environment, software releases must be incremental and low-risk to avoid operational disruptions.

* To achieve independent deployability, the system targets the following criteria:
* Each module has its own independent build artifact, deployment pipeline, and version tag.
* Cross-module dependencies exist only through well-defined APIs, event contracts, or message interfaces.
* A deployment failure in one module shall be rollbackable in isolation.
* A module update that does not change its public contract shall require no changes in consuming modules.
* Deployment is accepted when the changed module passes isolated deployment tests, end-to-end integration tests, and contract tests without requiring other modules to rebuild.

Potential bottlenecks: A deployment that brings down all five modules simultaneously—even for a few minutes—is significantly more disruptive than a targeted hot-swap of a single module. Additionally, compile-time or runtime classpath sharing across module boundaries prevents independent deployability and increases deployment risks.

### Proposed Architectural Solution:

* Independent Deployable Units: Separate modules into independently deployable units with stable interface contracts between them.
* Decentralized Database Ownership: Align database ownership with module ownership where feasible to avoid shared dependencies.
* Isolated Pipelines and Runtimes: Avoid shared deployment pipelines, shared runtimes across modules, and circular dependencies.
* **NFR 07 (Usability)**

Restaurant environments are characterized by high staff turnover, intense time pressure, and a diverse user population. A system that is difficult to use is not merely inconvenient; it undermines the entire operational purpose of IRMS.

* To ensure high usability for all staff, the system targets the following metrics:
* High-frequency operational tasks shall be reachable within 3 navigation steps from the relevant role's home screen.
* Alert messages and system notifications shall use plain operational language without exposing technical error codes.
* Role-specific interfaces shall present only the data and actions relevant to that role's primary workflow.
* The interface shall degrade gracefully under poor network conditions and still allow basic operational actions to proceed.
* At least 80% of participants in a structured usability evaluation must successfully execute core tasks in under 30 minutes.

Potential bottlenecks: Kitchen staff who cannot quickly interpret order queues on the KDS, managers who struggle to read dashboard alerts, or administrators who need extensive technical knowledge to perform routine maintenance tasks are all critical failure modes. Generic catch-all screens increase cognitive load and decision fatigue.

### Proposed Architectural Solution:

* Role-Based Presentation Logic: Manage role-specific presentation logic separately from business logic to provide contextually relevant information.
* Consistent Design System: Implement consistent naming, icon usage, and navigation patterns across all five modules to reduce the learning curve.
* Graceful Degradation: Design interfaces to handle poor network conditions seamlessly without blocking basic operational workflows.
* **NFR 08 (Interoperability)**

IRMS operates through a network of diverse physical IoT devices, such as ordering tablets, KDS, and various sensors. These devices may be sourced from different vendors and operate on different firmware versions, requiring a standardized integration protocol.

* To ensure seamless communication across diverse devices, the system targets the following criteria:
* The MQTT broker shall validate that all connected clients use MQTT v3.1.1 or v5.0.
* Core business services shall not contain protocol-specific parsing logic for individual device vendors.
* Device message schemas shall be versioned and documented as part of the integration contract.
* Devices that cannot communicate via MQTT natively shall be supported through dedicated protocol translation adapters.

Potential bottlenecks: Without a standardized integration protocol, each device type may introduce a different communication mechanism, forcing core services to accommodate proprietary formats and vendor-specific behavior. This increases coupling and complexity within the core business logic.

### Proposed Architectural Solution:

* Event-Driven Broker Integration: Provide a managed MQTT broker as the message backbone for device communication, utilizing its publish/subscribe model and low overhead.
* Standardized Governance: Enforce topic naming conventions, payload schemas, and QoS levels through strict integration documentation.
* Translation Adapters: Connect non-standard devices through dedicated adapters rather than modifying core platform services.
* **NFR 09 (Observability)**

An IRMS transaction spans multiple services, message brokers, and IoT device interactions. When something goes wrong in this chain, operational teams must be able to identify precisely where the failure occurred and why using structured, correlated, and queryable diagnostic data.

* To guarantee comprehensive system visibility, the system targets the following metrics:
* All service-to-service calls and message-driven interactions shall propagate a correlation ID from origin to final consumer.
* Structured logs must include timestamp, correlation ID, service name, event type, severity, and business identifiers.
* Distributed traces shall span service and broker boundaries and be queryable as a single trace.
* Business-critical state transitions shall generate audit-grade log entries with defined retention policies.
* Service health and performance metrics must be continuously exposed, including request rates, error rates, and p95 latencies.

Potential bottlenecks: When a failure occurs, the lack of correlation across distributed services makes root-cause analysis nearly impossible. If each module implements observability differently, inconsistent logs and traces will severely hinder system-wide debugging.

### Proposed Architectural Solution:

* Centralized Logging and Tracing: Utilize centralized logging infrastructure and distributed tracing middleware across all services.
* Standardized Instrumentation: Implement shared libraries or middleware to handle context propagation, log formatting, and trace injection uniformly across modules.
* Platform-Level Alerting: Define alert rules and performance monitoring as part of the platform configuration rather than custom-building them per module.
* **NFR 10 (Extensibility)**

IRMS is designed for a dynamic environment where new device types will be introduced over time. The integration boundary between devices and the core domain must be defined clearly enough that new integrations can be added without breaking existing functionality.

* To support seamless future expansion, the system targets the following criteria:
* Adding a new IoT device type shall require only the development of a new adapter or plugin, with integration effort not exceeding 2 person-days.
* Device-specific message parsing and transformation logic shall reside entirely within the adapter.
* Adapters shall translate device-native events into the canonical domain event model used by core services.
* Introducing a new adapter must show no code changes in core modules and must pass all existing regression tests.

Potential bottlenecks: If the architecture requires modifications to core business modules every time a new device is added, the cost of evolution will compound with each iteration. This tight coupling continuously puts the stability of the core platform at risk and slows down the adoption of new restaurant technologies.

### Proposed Architectural Solution:

* Ports-and-Adapters Architecture: Isolate the core domain behind stable input and output ports to keep core logic unchanged.
* Canonical Domain Model: Use a shared canonical event model that adapters translate proprietary device data into.
* Adapter Governance: Establish standard templates and interface contracts to guide new adapter implementations consistently and maintain quality.

2. **Architectural Trade-offs**

To meet the 5 NFR standards above, architects need to accept and balance the following core trade-offs:

* Maintainability (NFR-06) versus Observability (NFR-09):
Independent deployability is strengthened by good observability, but allowing each module to implement its own instrumentation strategy makes consistent tracing difficult. The system must treat observability as a platform concern standardized through shared libraries, rather than a module-specific concern.
* Interoperability (NFR-08) versus Extensibility (NFR-10):
Standardizing on MQTT improves interoperability, but a rigidly enforced message schema could limit the ability of future devices to express richer capabilities. Adapters must be expressive enough to translate diverse device behaviors into the shared canonical model without forcing the canonical model to expand for every new device.
* Usability (NFR-07) versus Observability (NFR-09):
Staff-facing interfaces should remain clean and focused, as flooding user screens with system metrics would harm usability. This trade-off is resolved by maintaining a clear separation between operational interfaces and diagnostic interfaces using role-based visibility.
* Extensibility (NFR-10) versus Maintainability (NFR-06):
Adapter patterns improve extensibility but add layers of abstraction. Without explicit adapter governance, these extensibility mechanisms can accumulate technical debt and become a source of maintenance burden.
* Usability (NFR-07) versus Maintainability (NFR-06):
Role-specific interfaces across independently deployable modules must remain visually and functionally consistent. This tension is managed through centrally maintained component libraries that modules reference as versioned dependencies.
