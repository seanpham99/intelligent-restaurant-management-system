# ADR-002: Use MQTT as the IoT Communication Protocol
**Status:** Accepted
**Date:** 2026-04-13

#### Context
The IRMS incorporates IoT devices like load-sensor that require lightweight and efficient communication with backend services under limited bandwidth conditions.

#### Decision

Use MQTT as the communication protocol for IoT devices. It supports publish-subscribe messaging and low-latency communication.

#### Consequences
**Positive**
- They are lightweight and efficient to connect to remote devices with low network bandwidth.
- It is suitable for IoT environments.
- It supports asynchronous communication

**Negative**
- Require MQTT broket infrastructure, so it increases the complexity of system due to its complete reliance on the intermediary Message Broker infrastructure.
- Limited built-in security features because it requires additional configuration effort (such as TLS/SSL) because the default protocol has very limited security features and is vulnerable to attacks if only basic configuration is used.

**Risks**
- Unsecured MQTT topics may lead to data leakage
- Message loss of QoS is not properly configured
- Broker overload under high sensor traffic

