import { describe, expect, it } from 'vitest';

import { buildFallbackPrompt, buildSurfContextPrompt } from '../src/prompts';
import type { SurfContextPayload } from '../src/types';

describe('prompts', () => {
  it('includes serialized surf data payload', () => {
    const payload: SurfContextPayload = {
      generatedAtUtc: '2024-01-01T00:00:00.000Z',
      forecastHorizonHours: 12,
      spots: [],
    };

    const prompt = buildSurfContextPrompt(payload);
    expect(prompt).toContain('You are Toura, an expert surf forecasting guide');
    const jsonPart = prompt.split('SURF_DATA=')[1];
    expect(JSON.parse(jsonPart)).toEqual(payload);
  });

  it('builds fallback prompt with reason included', () => {
    const prompt = buildFallbackPrompt('timeout');
    expect(prompt).toContain('Surf data is currently unavailable.');
    expect(prompt).toContain('timeout');
  });
});
