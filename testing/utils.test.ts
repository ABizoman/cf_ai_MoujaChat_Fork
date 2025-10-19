import { describe, expect, it } from 'vitest';

import { isTruthy, normalizeSanityVersion, safeReadBody, safeStringArray, safeText } from '../src/utils';

describe('utils', () => {
  it('returns trimmed text when available', () => {
    expect(safeText('  hello  ', 'fallback')).toBe('hello');
  });

  it('falls back when value is not usable text', () => {
    expect(safeText('   ', 'fallback')).toBe('fallback');
    expect(safeText(undefined, 'fallback')).toBe('fallback');
  });

  it('filters and trims valid string array values', () => {
    const result = safeStringArray([' one ', 2, null, 'two']);
    expect(result).toEqual(['one', 'two']);
  });

  it('returns empty array when input is not iterable', () => {
    expect(safeStringArray('nope')).toEqual([]);
  });

  it('identifies truthy values excluding nullish', () => {
    expect(isTruthy(0)).toBe(true);
    expect(isTruthy(null)).toBe(false);
    expect(isTruthy(undefined)).toBe(false);
  });

  it('normalizes Sanity versions by prefixing v when missing', () => {
    expect(normalizeSanityVersion('2023-06-06')).toBe('v2023-06-06');
    expect(normalizeSanityVersion('v2023-06-06')).toBe('v2023-06-06');
  });

  it('reads response body safely even on errors', async () => {
    const response = new Response('ok');
    await expect(safeReadBody(response)).resolves.toBe('ok');
  });
});
