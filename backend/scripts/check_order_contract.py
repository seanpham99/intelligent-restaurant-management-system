import json
import urllib.request

payload = json.dumps([{"item_id": "1", "table_id": 5, "amount": 1}]).encode()
req = urllib.request.Request(
    "http://localhost:8000/order/create",
    data=payload,
    headers={"Content-Type": "application/json"},
    method="POST",
)
resp = urllib.request.urlopen(req)
data = json.loads(resp.read().decode("utf-8"))
assert isinstance(data, list) and data, "order response must be non-empty array"
required = {"id", "item_id", "table_id", "amount"}
missing = required - set(data[0].keys())
assert not missing, f"missing keys: {missing}"
assert isinstance(data[0]["item_id"], str), "item_id must be string"
