from collections import namedtuple
import geoip2.database
import geoip2.errors

from .config import GEOIP_GEOLITE2_CITY_PATH

DEFAULT_LOCATION = {
    "latitude": 28.3922,
    "longitude": -80.6077,
    "time_zone": "America/New_York",
}

default_location = namedtuple("Location", DEFAULT_LOCATION.keys())(
    *DEFAULT_LOCATION.values()
)


def get_location(ip):
    if not GEOIP_GEOLITE2_CITY_PATH:
        return default_location
    with geoip2.database.Reader(GEOIP_GEOLITE2_CITY_PATH) as reader:
        try:
            res = reader.city(ip)
            return res.location
        except geoip2.errors.AddressNotFoundError:
            return default_location
