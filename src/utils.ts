export function safeText(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

export function safeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map(item => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }
  return [];
}

export function isTruthy<T>(value: T | null | undefined): value is T {
  return value != null;
}

export async function safeReadBody(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch (_error) {
    return '<body unreadable>';
  }
}

export function normalizeSanityVersion(version: string): string {
  if (version.startsWith('v')) {
    return version;
  }
  return `v${version}`;
}
