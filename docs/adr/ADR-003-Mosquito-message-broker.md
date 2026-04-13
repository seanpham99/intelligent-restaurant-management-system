# ADR-003: Use Eclipse Mosquitto as the Message Broker
**Status:** Accepted
**Date:** 2026-04-13

#### Context
The system requires a message broker to enable asynchronous communication between services and IoT components using MQTT

#### Decision
Use Eclipse Mosquito as the message broker to implement the event bus

#### Consequences
**Positive:**
- They are lightweight and easy to deploy
- Native support for MQTT
- Enable decoupled architecture
- It's suitable for IoT-based systems.

**Negative**
- Limited scalability
- Fewer advanced streaming features
- Require manual monitoring because popular MQTT brokers often don't come with built-in, sophisticated monitoring tools. You typically have to install third-party tools or write your own scripts to track whether the broker is overloaded and how many connections are active.

**Risks:**
- Single point of failure
- Performance degradation under heavy load
- Message delivery issues if broker crashes


