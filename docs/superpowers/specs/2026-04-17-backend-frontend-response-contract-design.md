# Backend ↔ Frontend Response Contract Mapping Design

## Context

The backend currently exposes menu/order contracts through the gateway, while the frontend still uses local mock menu data and does not consume backend APIs.  
This design defines a contract-first rewrite so backend responses become the canonical data model consumed directly by frontend screens.

## Goals

1. Align backend response contracts with frontend data needs.
2. Replace frontend mock-driven flow with backend API + websocket integration.
3. Keep existing screen navigation flow, but drive it using real backend responses.

## Confirmed scope

- Approach: **Contract-first rewrite** (not gateway-only transforms, not versioned v2 endpoints).
- Compatibility: **No backward compatibility requirement**.
- Flows in scope:
  1. `GET /menu/list_items`
  2. `POST /order/create`
  3. `WS /order/status`
- Backend menu fields to add/use: `category`, `currency`, `popular`, `soldOut`, `imageUrl`.

## Proposed target contracts

### 1) Menu list

**Endpoint:** `GET /menu/list_items`

**Response:**

```json
[
  {
    "id": "1",
    "name": "Truffle Arancini",
    "description": "Crispy risotto balls...",
    "price": 125000,
    "category": "Appetizers",
    "currency": "VND",
    "popular": true,
    "soldOut": false,
    "imageUrl": "https://..."
  }
]
```

**Contract decisions:**

- Replace legacy fields (`type_name`, `image_base64`) with frontend-aligned fields.
- `id` is string for direct compatibility with frontend `MenuItem`.

### 2) Create order

**Endpoint:** `POST /order/create`

**Request:**

```json
[
  { "item_id": "1", "table_id": 0, "amount": 2 }
]
```

**Response:**

```json
[
  { "id": "uuid", "item_id": "1", "table_id": 0, "amount": 2 }
]
```

**Contract decisions:**

- Keep array request/response model.
- Response remains request-plus-generated-id.

### 3) Live status

**Endpoint:** `WS /order/status`

**Client message:**

```json
{ "order_id": "uuid" }
```

**Server event:**

```json
{ "order_id": "uuid", "status": "PROCESSING", "description": "PROCESSING" }
```

**Contract decisions:**

- Move status representation to named enum values: `IN_QUEUE | PROCESSING | DONE`.
- Every message includes `order_id` for explicit correlation.

## Architecture and component design

1. **Backend contract source of truth:** shared DTOs define canonical request/response schemas.
2. **Menu-service data shaping:** query/result mapping emits target fields (`category`, `imageUrl`, etc.) directly.
3. **Gateway contract ownership:** gateway remains public API surface while forwarding canonical service contracts.
4. **Frontend API layer:** add typed API client functions for menu/order/ws; UI consumes typed results.
5. **Frontend state flow:** existing `Screen` + `currentScreen` stays, but transition actions rely on API/ws outcomes.

## End-to-end data flow

1. Menu screen entry triggers `GET /menu/list_items`.
2. User builds cart using fetched items.
3. Confirmation submit triggers `POST /order/create`.
4. Success screen opens websocket and subscribes per created `order_id`.
5. UI updates on each status event until `DONE`.

## Error handling

### Backend

- Enforce DTO validation for required fields and enum constraints.
- Return explicit 4xx for contract violations.
- Maintain explicit 5xx behavior for internal failures.

### Frontend

- API layer surfaces typed success/error results.
- Menu load failure shows retry action.
- Order create failure preserves cart + supports retry.
- Websocket disconnect exposes reconnect path.

## Verification strategy

1. **Backend contract checks:** endpoint responses conform to DTO schema.
2. **Frontend compile-time checks:** TypeScript contract alignment in API layer and UI consumers.
3. **End-to-end smoke flow:** menu fetch -> order create -> websocket status to `DONE`.

## Out of scope

- Payment API integration beyond current frontend flow.
- Introducing route-based navigation.
- Maintaining legacy contract compatibility.
