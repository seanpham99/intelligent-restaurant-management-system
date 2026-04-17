import json
import subprocess
import urllib.request


def check_create_contract() -> str:
    payload = json.dumps([{"item_id": "1", "table_id": 0, "amount": 1}]).encode()
    req = urllib.request.Request(
        "http://localhost:8000/order/create",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    assert isinstance(data, list) and data, "order response must be non-empty array"
    required = {"id", "item_id", "table_id", "amount"}
    missing = required - set(data[0].keys())
    assert not missing, f"missing keys: {missing}"
    assert isinstance(data[0]["item_id"], str), "item_id must be string"
    return data[0]["id"]


def get_ws_event(order_id: str) -> dict:
    script = f"""
import asyncio
import json
import aiomqtt
import websockets

async def publish_status():
    payload = {{
        "order_id": "{order_id}",
        "status": "IN_QUEUE",
        "description": "IN_QUEUE",
    }}
    async with aiomqtt.Client("irms-mqtt", 1883) as mqtt:
        await mqtt.publish(
            topic="order/status/{order_id}",
            payload=json.dumps(payload).encode("utf-8"),
            qos=1,
        )

async def main():
    async with websockets.connect("ws://irms-gateway:8000/order/status") as ws:
        await ws.send(json.dumps({{"order_id": "{order_id}"}}))
        await asyncio.sleep(0.5)
        await publish_status()
        raw = await asyncio.wait_for(ws.recv(), timeout=30)
        print(raw.strip())

asyncio.run(main())
"""
    result = subprocess.run(
        ["docker", "exec", "-i", "irms-gateway", "python", "-"],
        input=script,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        raise AssertionError(
            "failed websocket check execution in gateway container: "
            + result.stderr.strip()
        )

    for line in reversed(result.stdout.splitlines()):
        line = line.strip()
        if line:
            return json.loads(line)
    raise AssertionError("no websocket event received")


def check_ws_contract(order_id: str) -> None:
    event = get_ws_event(order_id)
    required = {"order_id", "status", "description"}
    missing = required - set(event.keys())
    assert not missing, f"ws missing keys: {missing}"
    assert isinstance(event["order_id"], str), "ws order_id must be string"
    assert isinstance(event["status"], str), "ws status must be string enum name"
    assert event["status"] in {"IN_QUEUE", "PROCESSING", "DONE"}, "ws status invalid"
    assert isinstance(event["description"], str), "ws description must be string"


if __name__ == "__main__":
    created_order_id = check_create_contract()
    check_ws_contract(created_order_id)
