import json
import urllib.request

REQUIRED = {
    "id",
    "name",
    "description",
    "price",
    "category",
    "currency",
    "popular",
    "soldOut",
    "imageUrl",
}


def main() -> None:
    with urllib.request.urlopen("http://localhost:8000/menu/list_items") as resp:
        data = json.loads(resp.read().decode("utf-8"))

    assert isinstance(data, list) and data, "menu list must be a non-empty array"
    missing = REQUIRED - set(data[0].keys())
    assert not missing, f"missing keys: {sorted(missing)}"


if __name__ == "__main__":
    main()
