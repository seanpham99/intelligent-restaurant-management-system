# ADR-001: Adopt Service-Based Architecture with Event-Driven Communication
**Status:** Accepted
**Date:** 2026-04-08

#### Context
The IRMS must support real-time order processing, IoT device integration (e.g., smart menus, kitchen display systems, load-cell sensors, temperature sensors), and multiple business functions such as ordering, kitchen coordination, inventory tracking, notifications, and dashboards.
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
- **Event processing latency or message loss**
IoT events, such as order updates, sensor data may be delayed or lost due to network or messaging issues.  

- **Difficulty in debugging asynchronous flows**  
Event-driven communication makes it harder to trace down problems.  

- **Performance bottlenecks during peak hours**  
High order volume may overload certain services, such as Order, Inventory, Kitchen and Dashboard Service.  

- **Service coupling through poorly designed events**  
Poorly defined event contracts may lead to tight coupling between services.  

- **Single point of failure in shared infrastructure**  
Message brokers or databases may become bottlenecks.



