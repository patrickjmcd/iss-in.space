# ISS Pass Predictions

**[https://iss-in.space](https://iss-in.space)** - A modern web interface and API serving accurate ISS pass predictions for both visual observation and amateur radio use.

Built in Python using [Skyfield](https://rhodesmill.org/skyfield/) and [FastAPI](https://fastapi.tiangolo.com/).

## API

### `GET /api/passes/{lat}/{lng}`

Returns ISS pass predictions for the given coordinates over the next 5 days.

```
GET /api/passes/37.7749/-122.4194
```

```json
[
  {
    "start": "2024-11-01T20:15:00Z",
    "peak": "2024-11-01T20:18:30Z",
    "end": "2024-11-01T20:22:00Z",
    "max_elevation": 45.2
  }
]
```

## Docker

```bash
docker pull ghcr.io/patrickjmcd/iss-in.space:latest
docker run -p 8000:8000 ghcr.io/patrickjmcd/iss-in.space:latest
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8000` | Port to listen on |
| `GEOIP_GEOLITE2_PATH` | — | Directory path to GeoLite2 database (enables IP geolocation on the home page) |
| `GEOIP_GEOLITE2_CITY_FILENAME` | `GeoLite2-City.mmdb` | GeoLite2 database filename |

To enable IP-based geolocation, mount your GeoLite2 database and set the path:

```bash
docker run -p 8000:8000 \
  -v /path/to/geoip:/geoip \
  -e GEOIP_GEOLITE2_PATH=/geoip/ \
  ghcr.io/patrickjmcd/iss-in.space:latest
```

## Development

```bash
uv sync
uv run uvicorn iss.server:app --reload
```

### Lint & Test

```bash
uv run ruff check .
uv run pytest
```

## Releases

Releases are managed by [release-please](https://github.com/googleapis/release-please). Merging a release PR to `master` creates a GitHub release and triggers a Docker image build tagged with the semver version and pushed to `ghcr.io/patrickjmcd/iss-in.space`.
