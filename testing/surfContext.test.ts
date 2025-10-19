import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Workflow } from 'cloudflare:workflows';

import type { Env, RawForecastRow, SanitySurfSpot, SurfWorkflowParams } from '../src/types';

const baseEnv: Env = {
  AI: {},
  SURF_WORKFLOW: {} as Workflow<SurfWorkflowParams>,
  SANITY_PROJECT_ID: 'project',
  SANITY_DATASET: 'dataset',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_KEY: 'service-key',
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('getSurfSystemPrompt', () => {
  it('builds a prompt containing surf spot context', async () => {
    const surfSpots: SanitySurfSpot[] = [
      {
        _id: 'spot-1',
        name: 'Anchor Point',
        region: 'Taghazout',
        description: 'Warm and consistent right-hand point break.',
      },
    ];
    const forecastRows: RawForecastRow[] = [
      {
        spot_id: 'spot-1',
        forecast_time: '2024-01-01T03:00:00Z',
        swell_height: 1.8,
        swell_period: 12,
        swell_direction: 180,
        wave_height: 1.2,
        wind_speed: 10,
        wind_direction: 45,
      },
    ];

    const surfData = await import('../src/surfData');
    vi.spyOn(surfData, 'fetchSurfSpots').mockResolvedValue(surfSpots);
    vi.spyOn(surfData, 'fetchForecastsForSpots').mockResolvedValue(forecastRows);

    const { getSurfSystemPrompt } = await import('../src/surfContext');
    const prompt = await getSurfSystemPrompt(baseEnv);
    expect(prompt).toContain('You are Toura, an expert surf forecasting guide');
    const jsonPart = prompt.split('SURF_DATA=')[1];
    const payload = JSON.parse(jsonPart);
    expect(payload.generatedAtUtc).toBe('2024-01-01T00:00:00.000Z');
    expect(payload.spots[0].name).toBe('Anchor Point');
    expect(payload.spots[0].forecastCount).toBe(1);
  });

  it('returns cached prompt within ttl without refetching data', async () => {
    const surfSpots: SanitySurfSpot[] = [
      {
        _id: 'spot-1',
      },
    ];
    const forecastRows: RawForecastRow[] = [
      {
        spot_id: 'spot-1',
        forecast_time: '2024-01-01T01:00:00Z',
      },
    ];

    const surfData = await import('../src/surfData');
    const fetchSurfSpots = vi
      .spyOn(surfData, 'fetchSurfSpots')
      .mockResolvedValue(surfSpots);
    const fetchForecasts = vi
      .spyOn(surfData, 'fetchForecastsForSpots')
      .mockResolvedValue(forecastRows);

    const { getSurfSystemPrompt } = await import('../src/surfContext');
    const prompt1 = await getSurfSystemPrompt(baseEnv);
    expect(prompt1).toBeTruthy();
    expect(fetchSurfSpots).toHaveBeenCalledTimes(1);
    expect(fetchForecasts).toHaveBeenCalledTimes(1);

    fetchSurfSpots.mockImplementation(() => {
      throw new Error('should not refetch');
    });
    fetchForecasts.mockImplementation(() => {
      throw new Error('should not refetch');
    });

    const prompt2 = await getSurfSystemPrompt(baseEnv);
    expect(prompt2).toBe(prompt1);
  });

  it('throws when no surf spots are returned', async () => {
    const surfData = await import('../src/surfData');
    vi.spyOn(surfData, 'fetchSurfSpots').mockResolvedValue([]);
    vi.spyOn(surfData, 'fetchForecastsForSpots').mockResolvedValue([]);

    const { getSurfSystemPrompt } = await import('../src/surfContext');
    await expect(getSurfSystemPrompt(baseEnv)).rejects.toThrow(
      'No surf spots returned from Sanity.',
    );
  });
});
