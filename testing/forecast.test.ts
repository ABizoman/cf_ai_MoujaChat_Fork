import { describe, expect, it } from 'vitest';

import { groupForecastsBySpot, simplifyForecastPoint, trimForecastPoints } from '../src/forecast';
import type { RawForecastRow } from '../src/types';

describe('forecast helpers', () => {
  it('groups forecast rows by spot id', () => {
    const rows: RawForecastRow[] = [
      { spot_id: 'a', forecast_time: '2024-01-01T00:00:00Z' },
      { spot_id: 'b', forecast_time: '2024-01-01T01:00:00Z' },
      { spot_id: 'a', forecast_time: '2024-01-01T02:00:00Z' },
    ];

    const grouped = groupForecastsBySpot(rows);
    expect(grouped.get('a')?.length).toBe(2);
    expect(grouped.get('b')?.length).toBe(1);
  });

  it('returns null when forecast timestamp is invalid', () => {
    const point = simplifyForecastPoint({
      spot_id: 'a',
      forecast_time: 'not-a-date',
    });
    expect(point).toBeNull();
  });

  it('simplifies forecast numbers with rounding', () => {
    const point = simplifyForecastPoint({
      spot_id: 'a',
      forecast_time: '2024-01-01T00:00:00Z',
      swell_height: 1.543,
      swell_period: 10.44,
      swell_direction: 202.7,
      wave_height: 1.876,
      wind_speed: 12.345,
      wind_direction: 45.2,
    });

    expect(point).not.toBeNull();
    expect(point?.swellHeightM).toBe(1.54);
    expect(point?.swellPeriodS).toBe(10.4);
    expect(point?.swellDirectionDeg).toBe(203);
    expect(point?.windDirectionText).toBe('NE');
    expect(point?.quality).toBe('GOOD');
  });

  it('trims forecast points evenly when exceeding limit', () => {
    const points = Array.from({ length: 10 }, (_, index) => ({
      timeUtc: `2024-01-01T0${index}:00:00Z`,
      timeLocal: `local-${index}`,
      timestamp: Date.parse(`2024-01-01T0${index}:00:00Z`),
      swellHeightM: 1,
      swellPeriodS: 10,
      swellDirectionDeg: 180,
      swellDirectionText: 'S',
      waveHeightM: 1,
      windSpeedKph: 10,
      windDirectionDeg: 90,
      windDirectionText: 'E',
      quality: 'GOOD' as const,
    }));

    const trimmed = trimForecastPoints(points, 5);
    expect(trimmed.length).toBeLessThanOrEqual(6); // includes forced last data point
    const lastTrimmed = trimmed[trimmed.length - 1];
    const lastOriginal = points[points.length - 1];
    expect(lastTrimmed?.timeUtc).toBe(lastOriginal?.timeUtc);
  });
});
