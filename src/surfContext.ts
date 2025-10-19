import {
  DEFAULT_FORECAST_LOOKAHEAD_HOURS,
  DEFAULT_SURF_CONTEXT_TTL_MINUTES,
  MAX_POINTS_PER_SPOT,
} from './constants';
import { buildSurfContextPrompt } from './prompts';
import { fetchForecastsForSpots, fetchSurfSpots } from './surfData';
import {
  groupForecastsBySpot,
  simplifyForecastPoint,
  trimForecastPoints,
} from './forecast';
import type { Env, SurfContextPayload, SurfSpotContext } from './types';
import { isTruthy, safeStringArray, safeText } from './utils';

let cachedSurfPrompt: { prompt: string; expiresAt: number } | null = null;

export async function getSurfSystemPrompt(env: Env): Promise<string> {
  const ttlMinutes = parseInt(env.SURF_CONTEXT_TTL_MINUTES ?? '', 10);
  const ttl =
    Number.isFinite(ttlMinutes) && ttlMinutes > 0
      ? ttlMinutes
      : DEFAULT_SURF_CONTEXT_TTL_MINUTES;

  if (cachedSurfPrompt && cachedSurfPrompt.expiresAt > Date.now()) {
    return cachedSurfPrompt.prompt;
  }

  const forecastHorizon = parseInt(env.SURF_FORECAST_LOOKAHEAD_HOURS ?? '', 10);
  const lookahead =
    Number.isFinite(forecastHorizon) && forecastHorizon > 0
      ? forecastHorizon
      : DEFAULT_FORECAST_LOOKAHEAD_HOURS;

  const spots = await fetchSurfSpots(env);
  if (spots.length === 0) {
    throw new Error('No surf spots returned from Sanity.');
  }

  const now = new Date();
  const windowStartIso = now.toISOString();
  const windowEndIso = new Date(now.getTime() + lookahead * 60 * 60 * 1000).toISOString();

  const spotIds = spots.map(spot => spot._id);
  const forecastRows = await fetchForecastsForSpots(env, spotIds, windowStartIso, windowEndIso);
  const groupedForecast = groupForecastsBySpot(forecastRows);

  const surfSpots: SurfSpotContext[] = spots.map(spot => {
    const rawForecast = groupedForecast.get(spot._id) ?? [];
    const simplified = rawForecast
      .map(simplifyForecastPoint)
      .filter(isTruthy)
      .sort((a, b) => a.timestamp - b.timestamp);
    const trimmed = trimForecastPoints(simplified, MAX_POINTS_PER_SPOT);

    return {
      id: spot._id,
      name: safeText(spot.name, 'Unnamed spot'),
      region: safeText(spot.region, 'Unknown region'),
      description: safeText(spot.description, 'No description provided.'),
      difficulty: safeText(spot.difficulty, 'Not rated'),
      crowd: safeText(spot.crowd, 'No crowd data'),
      typeOfBreak: safeStringArray(spot.typeOfBreak),
      idealWind: safeStringArray(spot.idealWind),
      idealSwellDirection: safeStringArray(spot.idealSwellDirection),
      swellSize: safeStringArray(spot.swellSize),
      tideGuide: safeText(spot.tideGuide, 'No tide preference recorded'),
      hazards: safeStringArray(spot.hazards),
      seabed: safeStringArray(spot.seabed),
      idealWaterQuality: safeText(spot.waterQuality, 'Not specified'),
      forecast: trimmed,
      forecastCount: trimmed.length,
      forecastStartUtc: trimmed[0]?.timeUtc ?? null,
      forecastEndUtc: trimmed[trimmed.length - 1]?.timeUtc ?? null,
    };
  });

  const payload: SurfContextPayload = {
    generatedAtUtc: now.toISOString(),
    forecastHorizonHours: lookahead,
    spots: surfSpots,
  };

  const prompt = buildSurfContextPrompt(payload);
  cachedSurfPrompt = {
    prompt,
    expiresAt: Date.now() + ttl * 60 * 1000,
  };

  return prompt;
}
