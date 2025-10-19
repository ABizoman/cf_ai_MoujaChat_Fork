import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CHAT_MODEL,
  DEFAULT_FORECAST_LOOKAHEAD_HOURS,
  DEFAULT_SANITY_API_VERSION,
  DEFAULT_SURF_CONTEXT_TTL_MINUTES,
  MAX_POINTS_PER_SPOT,
} from '../src/constants';

describe('constants', () => {
  it('exposes default chat model identifier', () => {
    expect(DEFAULT_CHAT_MODEL).toBe('@cf/meta/llama-3.3-70b-instruct-fp8-fast');
  });

  it('exposes default Sanity API version', () => {
    expect(DEFAULT_SANITY_API_VERSION).toBe('2023-06-06');
  });

  it('defines default forecast horizon in hours', () => {
    expect(DEFAULT_FORECAST_LOOKAHEAD_HOURS).toBe(168);
  });

  it('sets surf context cache ttl in minutes', () => {
    expect(DEFAULT_SURF_CONTEXT_TTL_MINUTES).toBe(30);
  });

  it('limits forecast points per spot', () => {
    expect(MAX_POINTS_PER_SPOT).toBe(20);
  });
});
