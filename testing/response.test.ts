import { describe, expect, it } from 'vitest';

import { extractResponseText } from '../src/response';

describe('extractResponseText', () => {
  it('returns plain string responses directly', () => {
    expect(extractResponseText('hello')).toBe('hello');
  });

  it('handles object response field', () => {
    expect(extractResponseText({ response: 'ok' })).toBe('ok');
  });

  it('handles array response list', () => {
    expect(extractResponseText([{ response: 'first' }])).toBe('first');
  });

  it('falls back when no readable response exists', () => {
    expect(extractResponseText(null)).toBe('No response generated.');
  });
});
