# ADR-005: Use Docker for deployment
**Status:** Accepted
**Date:** 2026-04-13

#### Context
The system includes multiple components such as services, API Gateway, Mosquitto, and database, requiring consistent deployment across environments.

#### Decision
Use Docker to deploy the entire system to a single server (such as a powerful local server in a restaurant or a cloud VM) while ensuring isolation between services.

#### Consequences
**Positive:**
- It's easy to deploy and setup
- It has environment consistency
- Service isolation to increase security and stability
- Support scalability

**Negative**
- Require container management knowledge
- Add operational complexity
- Need orchestration for large-scale systems

**Risks:**
- Container misconfiguration may cause system failures
- Resource contention between containers
- Security vulnerabilities in container images


