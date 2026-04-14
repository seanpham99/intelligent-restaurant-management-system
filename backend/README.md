# Requirements
- Linux environment or using WSL.
- Docker & Docker Compose.
- GNU Make.

# Installation
- Ensure current directory is in `./backend`.
- For first time installation, simply use `make install`.

# Running services
- To run services, run `docker compose up -d` or `make services-up`.
- To stop services, run `docker compose down` or `make services-down`.
- Notes: change the environment variables in `env.template` to your likings or you can just
keep it as is.

# Frontend connection
- There are two ways to connect to the api:
    - Via localhost:8000 if the frontend is not built with docker.
    - Via joining `irms-frontend` network then change the api host to `irms-gateway:8000`.

# Currently available API endpoints
## Menu
### List items in menu
- Description: List the available items in the menu.
- Endpoint: `/menu/list_items`.
- Method: GET.
- No parameters required.
- Example request and result:
```
# Request:
curl --request GET \
  --url http://localhost:8000/menu/list_items

# Response:
[
  {
    "id": 1,
    "name": "Gỏi Ngó Sen Tôm Thịt",
    "description": "Gỏi thanh mát, tôm thịt đậm đà",
    "price": 115000.0,
    "type_name": "Khai vị",
    "image_base64": "utf-8 encoded base64 image"
  },
  ...
]
```

### Check item's remaining portions
- Description: Check the remaining portions of a specific item in the menu.
- Endpoint: `/menu/remaining_portions`.
- Method: GET.
- Parameters: `item_id`.
- Example request and result:
```
# Request
curl --request GET \
  --url 'http://localhost:8000/menu/remaining_portions?item_id=1' \
  --header 'content-type: application/json'

# Response
{
  "remaining_portions": 33
}
```

## Order
### Make orders
- Description: Make orders to the server -> Return the same orders information
but with additional order's id as `id` in the response.
- Endpoint: `/order/create`.
- Method: POST.
- Body: json.
- Example request and result:
```
# Request
curl --request POST \
  --url http://localhost:8000/order/create \
  --header 'content-type: application/json' \
  --data '[
  {
    "item_id": 1,
    "table_id": 0,
    "amount": 1
  }
]'

# Response
[
  {
    "item_id": 1,
    "table_id": 0,
    "amount": 1.0,
    "id": "15bdafa4-0203-4664-a9ab-2570ba1e25f3"
  }
]
```

### Get order's status
- Description: Open a websocket to the server to update the order's status.
- Endpoint: `/order/status`.
- Method: Websocket.
- Steps to use this endpoint:
    1. Open a normal websocket to the server via, for example, `ws://localhost:8000/order/status`.
    2. Send a json object as message: `{"order_id": "<id obtained from the /order/create endpoint>"}`
    3. The websocket should receive updating messages of the following format:
    `{"status": int, "description": str}`
    If the `status == 3`, that means the websocket ends and the order is completed.
