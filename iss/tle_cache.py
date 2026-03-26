import asyncio
import time
from urllib.request import urlopen

from skyfield.api import EarthSatellite, load

from .config import REDIS_URL

STATIONS_URL = "https://celestrak.org/NORAD/elements/stations.txt"
_CACHE_KEY = "iss:tle"
_CACHE_TTL = 7200  # 2 hours

_ts = load.timescale(builtin=True)
_local: dict = {}
_redis = None


async def _get_redis():
    global _redis
    if REDIS_URL and _redis is None:
        import redis.asyncio as aioredis

        _redis = aioredis.from_url(REDIS_URL, decode_responses=True)
    return _redis


def _fetch_tle_text() -> str:
    with urlopen(STATIONS_URL) as resp:
        return resp.read().decode()


def _parse_satellites(text: str) -> dict:
    lines = [line.strip() for line in text.strip().splitlines() if line.strip()]
    satellites = {}
    for i in range(0, len(lines) - 2, 3):
        name = lines[i]
        line1 = lines[i + 1]
        line2 = lines[i + 2]
        if line1.startswith("1 ") and line2.startswith("2 "):
            satellites[name] = EarthSatellite(line1, line2, name, _ts)
    return satellites


async def get_satellites() -> dict:
    now = time.monotonic()

    if _local.get("satellites") and now - _local.get("fetched_at", 0) < _CACHE_TTL:
        return _local["satellites"]

    redis = await _get_redis()
    if redis:
        cached = await redis.get(_CACHE_KEY)
        if cached:
            satellites = _parse_satellites(cached)
            _local.update({"satellites": satellites, "fetched_at": now})
            return satellites

    loop = asyncio.get_running_loop()
    try:
        text = await loop.run_in_executor(None, _fetch_tle_text)
    except Exception:
        if _local.get("satellites"):
            return _local["satellites"]
        raise

    if redis:
        await redis.setex(_CACHE_KEY, _CACHE_TTL, text)

    satellites = _parse_satellites(text)
    _local.update({"satellites": satellites, "fetched_at": now})
    return satellites
