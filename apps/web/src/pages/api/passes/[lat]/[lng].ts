import type { APIRoute } from 'astro';
import { fetchTLE, parseTLE, getPasses } from '../../../../lib/predictions';

export const GET: APIRoute = async ({ params }) => {
  const lat = parseFloat(params.lat!);
  const lng = parseFloat(params.lng!);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return new Response(JSON.stringify({ error: 'Invalid coordinates' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const tleText = await fetchTLE();
    const { tle1, tle2 } = parseTLE(tleText);
    const passes = getPasses(tle1, tle2, lat, lng);

    return new Response(JSON.stringify(passes), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'Failed to compute passes' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
