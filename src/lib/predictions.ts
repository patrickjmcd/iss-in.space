import {
  twoline2satrec,
  propagate,
  gstime,
  eciToEcf,
  ecfToLookAngles,
  degreesToRadians,
  radiansToDegrees,
} from 'satellite.js';

const TLE_URL = 'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE';
const SCAN_STEP_MS = 30 * 1000;   // 30-second coarse scan
const DAYS = 5;

export interface PassEvent {
  time: string;
  degrees: number;
  azimuth: number;
  direction: string;
  distance: number;
}

export interface Pass {
  length: number;
  length_mins: string;
  rise: PassEvent;
  culminate: PassEvent;
  set: PassEvent;
}

function degToCardinal(deg: number): string {
  const c = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return c[Math.round((deg % 360) / 22.5) % 16];
}

function secondsToMinutes(secs: number): string {
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

type ObserverGd = { latitude: number; longitude: number; height: number };
type SatRec = ReturnType<typeof twoline2satrec>;

function getElevationDeg(satrec: SatRec, observerGd: ObserverGd, date: Date): number {
  const pv = propagate(satrec, date);
  if (!pv.position || typeof pv.position === 'boolean') return -90;
  const gmst = gstime(date);
  const ecf = eciToEcf(pv.position as any, gmst);
  const look = ecfToLookAngles(observerGd, ecf);
  return radiansToDegrees(look.elevation as number);
}

function getPassEvent(satrec: SatRec, observerGd: ObserverGd, date: Date): PassEvent {
  const pv = propagate(satrec, date);
  const gmst = gstime(date);
  const ecf = eciToEcf(pv.position as any, gmst);
  const look = ecfToLookAngles(observerGd, ecf);
  const az = ((radiansToDegrees(look.azimuth as number)) + 360) % 360;
  return {
    time: date.toISOString(),
    degrees: Math.round(radiansToDegrees(look.elevation as number)),
    azimuth: Math.round(az),
    direction: degToCardinal(az),
    distance: Math.round(look.rangeSat as number),
  };
}

function binarySearchCrossing(satrec: SatRec, observerGd: ObserverGd, t1: number, t2: number, ascending: boolean): number {
  let lo = t1, hi = t2;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    const elev = getElevationDeg(satrec, observerGd, new Date(mid));
    if (ascending ? elev < 0 : elev > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function goldenSectionMax(satrec: SatRec, observerGd: ObserverGd, t1: number, t2: number): number {
  const gr = (Math.sqrt(5) + 1) / 2;
  let lo = t1, hi = t2;
  for (let i = 0; i < 30; i++) {
    const c1 = hi - (hi - lo) / gr;
    const c2 = lo + (hi - lo) / gr;
    const e1 = getElevationDeg(satrec, observerGd, new Date(c1));
    const e2 = getElevationDeg(satrec, observerGd, new Date(c2));
    if (e1 < e2) lo = c1;
    else hi = c2;
  }
  return (lo + hi) / 2;
}

export async function fetchTLE(): Promise<string> {
  // Use Cache API when available (Cloudflare Workers runtime)
  const cacheKey = new Request(TLE_URL);
  let cache: Cache | null = null;
  try {
    cache = await caches.open('tle-cache');
    const cached = await cache.match(cacheKey);
    if (cached) return cached.text();
  } catch {}

  const res = await fetch(TLE_URL);
  if (!res.ok) throw new Error(`Celestrak returned ${res.status}`);
  const text = await res.text();

  // Cache for 2 hours
  if (cache) {
    const response = new Response(text, {
      headers: { 'Cache-Control': 'public, max-age=7200' },
    });
    cache.put(cacheKey, response);
  }

  return text;
}

export function parseTLE(tleText: string): { tle1: string; tle2: string } {
  const lines = tleText.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 3) throw new Error('Invalid TLE data');
  return { tle1: lines[1], tle2: lines[2] };
}

export function getPasses(tle1: string, tle2: string, lat: number, lng: number, altM = 0): Pass[] {
  const satrec = twoline2satrec(tle1, tle2);
  const observerGd: ObserverGd = {
    latitude: degreesToRadians(lat),
    longitude: degreesToRadians(lng),
    height: altM / 1000,
  };

  const now = Date.now();
  const end = now + DAYS * 24 * 60 * 60 * 1000;

  const passes: Pass[] = [];
  let prevElev = getElevationDeg(satrec, observerGd, new Date(now));
  let riseMs: number | null = null;
  let peakElev = -90;
  let peakMs = now;

  for (let t = now + SCAN_STEP_MS; t <= end; t += SCAN_STEP_MS) {
    const elev = getElevationDeg(satrec, observerGd, new Date(t));

    if (prevElev <= 0 && elev > 0) {
      // Rising
      riseMs = binarySearchCrossing(satrec, observerGd, t - SCAN_STEP_MS, t, true);
      peakElev = elev;
      peakMs = t;
    } else if (riseMs !== null && elev > peakElev) {
      peakElev = elev;
      peakMs = t;
    } else if (riseMs !== null && prevElev > 0 && elev <= 0) {
      // Setting
      const setMs = binarySearchCrossing(satrec, observerGd, t - SCAN_STEP_MS, t, false);
      const culminateMs = goldenSectionMax(satrec, observerGd, riseMs, setMs);

      const lengthSecs = Math.round((setMs - riseMs) / 1000);
      passes.push({
        length: lengthSecs,
        length_mins: secondsToMinutes(lengthSecs),
        rise: getPassEvent(satrec, observerGd, new Date(riseMs)),
        culminate: getPassEvent(satrec, observerGd, new Date(culminateMs)),
        set: getPassEvent(satrec, observerGd, new Date(setMs)),
      });

      riseMs = null;
      peakElev = -90;
    }

    prevElev = elev;
  }

  return passes;
}
