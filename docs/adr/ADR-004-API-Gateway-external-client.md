# ADR-004: Use API Gateway Pattern for External Client Access
**Status:** Accepted
**Date:** 2026-04-13

#### Context
External clients, such as customer tablets and dashboard require a unified and secure entry point to access backend services

#### Decision
Implement an API Gateway to handle all incoming client requests. It manages routing, communication and protocol handling (HTTP/ WebSocket).

#### Consequences
**Positive**
- Centralized access point
- Simplify client communication
- Improve security control
- Support multiple client types

**Negative**
- Add an extra layer in the system
- Potential bottleneck if not scaled properly
- Require additional configuration 

**Risks**
- API Gateway failure may disrupt the entire system
- High traffic may cause latency if not load-balanced
- Misconfiguration may expose security vulnerabilities


