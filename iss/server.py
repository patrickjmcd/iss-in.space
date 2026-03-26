import json
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Request, Header
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from .geo import get_location
from .predictions import ISS, Predictions
from .tle_cache import get_satellites
from .utils import display_lat_lng

BASE_DIR = Path(__file__).parent

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

templates = Jinja2Templates(directory=BASE_DIR / "templates")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def home(request: Request, cf_connecting_ip: Optional[str] = Header(None)):
    client_ip = cf_connecting_ip or request.client.host
    location = get_location(client_ip)
    return templates.TemplateResponse(
        "index.html", {"request": request, "location": location}
    )


@app.get("/passes/{lat}/{lng}")
@limiter.limit("30/minute")
async def passes(request: Request, lat: float, lng: float):
    satellites = await get_satellites()
    preds = Predictions(lat, lng, altitude=0, days=5, satellite_obj=satellites[ISS]).get_predictions()
    dlat, dlng = display_lat_lng(lat, lng)
    return templates.TemplateResponse(
        "passes.html",
        {
            "request": request,
            "predictions_json": json.dumps(preds),
            "location": {"lat": lat, "lng": lng, "dlat": dlat, "dlng": dlng},
        },
    )


@app.get("/api/passes/{lat}/{lng}")
@limiter.limit("30/minute")
async def passes_api(request: Request, lat: float, lng: float):
    satellites = await get_satellites()
    return Predictions(lat, lng, altitude=0, days=5, satellite_obj=satellites[ISS]).get_predictions()
