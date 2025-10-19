import type { RawForecastRow, SimplifiedForecastPoint } from './types';

export function groupForecastsBySpot(rows: RawForecastRow[]): Map<string, RawForecastRow[]> {
  return rows.reduce<Map<string, RawForecastRow[]>>((map, row) => {
    if (!row?.spot_id) {
      return map;
    }
    const list = map.get(row.spot_id) ?? [];
    list.push(row);
    map.set(row.spot_id, list);
    return map;
  }, new Map());
}

export function simplifyForecastPoint(point: RawForecastRow): SimplifiedForecastPoint | null {
  const timestamp = Date.parse(point.forecast_time);
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  const swellHeightM = roundNumber(point.swell_height, 2);
  const swellPeriodS = roundNumber(point.swell_period, 1);
  const swellDirectionDeg = roundNumber(point.swell_direction, 0);
  const waveHeightM = roundNumber(point.wave_height, 2);
  const windSpeedKph = roundNumber(point.wind_speed, 1);
  const windDirectionDeg = roundNumber(point.wind_direction, 0);

  return {
    timeUtc: point.forecast_time,
    timeLocal: new Date(timestamp).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    }),
    timestamp,
    swellHeightM,
    swellPeriodS,
    swellDirectionDeg,
    swellDirectionText: bearingToCardinal(swellDirectionDeg),
    waveHeightM,
    windSpeedKph,
    windDirectionDeg,
    windDirectionText: bearingToCardinal(windDirectionDeg),
    quality: computeQualityLabel(swellHeightM, swellPeriodS),
  };
}

export function trimForecastPoints(
  points: SimplifiedForecastPoint[],
  maxPoints: number,
): SimplifiedForecastPoint[] {
  if (points.length <= maxPoints) {
    return points;
  }

  const stride = Math.ceil(points.length / maxPoints);
  const trimmed: SimplifiedForecastPoint[] = [];
  for (let i = 0; i < points.length; i += stride) {
    trimmed.push(points[i]);
  }

  const lastPoint = points[points.length - 1];
  if (trimmed[trimmed.length - 1]?.timestamp !== lastPoint.timestamp) {
    trimmed.push(lastPoint);
  }

  return trimmed;
}

function computeQualityLabel(
  swellHeightM: number | null,
  swellPeriodS: number | null,
): 'GOOD' | 'FAIR' | 'POOR' {
  if (swellHeightM != null && swellPeriodS != null) {
    if (swellHeightM >= 1.5 && swellPeriodS >= 10) {
      return 'GOOD';
    }
  }
  if (swellHeightM != null && swellHeightM >= 1.3) {
    return 'FAIR';
  }
  return 'POOR';
}

function bearingToCardinal(degrees: number | null): string | null {
  if (degrees == null || Number.isNaN(degrees)) {
    return null;
  }
  const normalized = ((degrees % 360) + 360) % 360;
  const directions = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ];
  const index = Math.round(normalized / 22.5) % directions.length;
  return directions[index];
}

function roundNumber(value: unknown, decimals: number): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
