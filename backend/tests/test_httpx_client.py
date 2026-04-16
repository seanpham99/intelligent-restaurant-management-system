import pytest

import httpx_client


@pytest.mark.asyncio
async def test_init_httpx_client_happy_path():
    await httpx_client.close_httpx_client()

    await httpx_client.init_httpx_client()

    assert httpx_client.client is not None

    await httpx_client.close_httpx_client()


@pytest.mark.asyncio
async def test_get_client_before_init_raises():
    await httpx_client.close_httpx_client()

    with pytest.raises(RuntimeWarning, match="HTTPX Client is not initialized"):
        agen = httpx_client.get_client()
        await agen.__anext__()


@pytest.mark.asyncio
async def test_close_httpx_client_sets_none():
    await httpx_client.init_httpx_client()
    assert httpx_client.client is not None

    await httpx_client.close_httpx_client()

    assert httpx_client.client is None
