import {
  DEFAULT_SANITY_API_VERSION,
} from './constants';
import type { Env, RawForecastRow, SanitySurfSpot } from './types';
import { normalizeSanityVersion, safeReadBody } from './utils';

export async function fetchSurfSpots(env: Env): Promise<SanitySurfSpot[]> {
  if (!env.SANITY_PROJECT_ID || !env.SANITY_DATASET) {
    throw new Error('Missing Sanity configuration.');
  }

  const apiVersion = normalizeSanityVersion(
    env.SANITY_API_VERSION?.trim() || DEFAULT_SANITY_API_VERSION,
  );
  const baseUrl = `https://${env.SANITY_PROJECT_ID}.apicdn.sanity.io/${apiVersion}/data/query/${env.SANITY_DATASET}`;
  const groqQuery = `
*[_type == "surfSpot"]{
  _id,
  name,
  description,
  region,
  difficulty,
  crowd,
  typeOfBreak,
  idealWind,
  idealSwellDirection,
  swellSize,
  tideGuide,
  hazards,
  seabed,
  waterQuality
}`;
  const queryParam = encodeURIComponent(groqQuery.trim());
  const url = `${baseUrl}?query=${queryParam}`;

  const headers: Record<string, string> = {};
  const sanityToken = env.SANITY_TOKEN ?? env.SANITY_API_TOKEN;
  if (sanityToken) {
    headers.Authorization = `Bearer ${sanityToken}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const text = await safeReadBody(response);
    throw new Error(`Failed to fetch surf spots: ${response.status} ${text}`);
  }

  const json = (await response.json()) as { result?: SanitySurfSpot[] };
  return Array.isArray(json.result) ? json.result : [];
}

export async function fetchForecastsForSpots(
  env: Env,
  spotIds: string[],
  startIso: string,
  endIso: string,
): Promise<RawForecastRow[]> {
  const supabaseKey = env.SUPABASE_KEY ?? env.SUPABASE_ANON_KEY;
  if (!env.SUPABASE_URL || !supabaseKey) {
    throw new Error('Missing Supabase configuration.');
  }
  if (spotIds.length === 0) {
    return [];
  }

  const base = env.SUPABASE_URL.replace(/\/+$/, '');
  const url = new URL(`${base}/rest/v1/forecast_points`);

  url.searchParams.set(
    'select',
    [
      'spot_id',
      'forecast_time',
      'swell_height',
      'swell_period',
      'swell_direction',
      'wave_height',
      'wind_speed',
      'wind_direction',
    ].join(','),
  );

  const quotedIds = spotIds.map(id => `"${id}"`).join(',');
  url.searchParams.set('spot_id', `in.(${quotedIds})`);
  url.searchParams.append('forecast_time', `gte.${startIso}`);
  url.searchParams.append('forecast_time', `lte.${endIso}`);
  url.searchParams.set('order', 'forecast_time');

  const response = await fetch(url.toString(), {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const text = await safeReadBody(response);
    throw new Error(`Failed to fetch forecasts: ${response.status} ${text}`);
  }

  const data = (await response.json()) as RawForecastRow[];
  return Array.isArray(data) ? data : [];
}
