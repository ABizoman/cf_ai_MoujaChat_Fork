import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Workflow } from 'cloudflare:workflows';

import { fetchForecastsForSpots, fetchSurfSpots } from '../src/surfData';
import type { Env, SurfWorkflowParams } from '../src/types';

const baseEnv: Env = {
  AI: {},
  SURF_WORKFLOW: {} as Workflow<SurfWorkflowParams>,
  SANITY_PROJECT_ID: 'project',
  SANITY_DATASET: 'dataset',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_KEY: 'service-key',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchSurfSpots', () => {
  it('requests surf spot data from Sanity', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            result: [
              {
                _id: 'spot-1',
                name: 'Anchor Point',
              },
            ],
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const spots = await fetchSurfSpots(baseEnv);

    expect(spots).toHaveLength(1);
    expect(spots[0]?._id).toBe('spot-1');
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain('apicdn.sanity.io');
  });

  it('throws when Sanity configuration is missing', async () => {
    await expect(
      fetchSurfSpots({
        AI: {},
        SURF_WORKFLOW: {} as Workflow<SurfWorkflowParams>,
      } as Env),
    ).rejects.toThrow('Missing Sanity configuration.');
  });

  it('throws when Sanity request fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('bad', { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchSurfSpots(baseEnv)).rejects.toThrow('Failed to fetch surf spots');
  });
});

describe('fetchForecastsForSpots', () => {
  it('returns empty array when no spot ids provided', async () => {
    await expect(
      fetchForecastsForSpots(baseEnv, [], 'start', 'end'),
    ).resolves.toEqual([]);
  });

  it('fetches forecast rows from Supabase', async () => {
    const responsePayload = [
      {
        spot_id: 'spot-1',
        forecast_time: '2024-01-01T00:00:00Z',
      },
    ];

    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(responsePayload), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const rows = await fetchForecastsForSpots(baseEnv, ['spot-1'], 'start', 'end');
    expect(rows).toEqual(responsePayload);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain('/rest/v1/forecast_points');
  });

  it('throws when Supabase config missing', async () => {
    await expect(
      fetchForecastsForSpots(
        {
          AI: {},
          SURF_WORKFLOW: {} as Workflow<SurfWorkflowParams>,
        } as Env,
        ['spot'],
        'start',
        'end',
      ),
    ).rejects.toThrow('Missing Supabase configuration.');
  });

  it('throws when Supabase request fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('bad', { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchForecastsForSpots(baseEnv, ['spot-1'], 'start', 'end'),
    ).rejects.toThrow('Failed to fetch forecasts');
  });
});
