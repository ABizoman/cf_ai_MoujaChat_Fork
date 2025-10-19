export function extractResponseText(result: unknown): string {
  if (typeof result === 'string') {
    return result;
  }
  if (
    result &&
    typeof result === 'object' &&
    'response' in result &&
    typeof (result as { response: unknown }).response === 'string'
  ) {
    return (result as { response: string }).response;
  }
  if (
    Array.isArray(result) &&
    result.length > 0 &&
    typeof result[0] === 'object' &&
    result[0] !== null &&
    'response' in (result[0] as Record<string, unknown>)
  ) {
    return String((result[0] as Record<string, unknown>).response ?? '');
  }
  return 'No response generated.';
}
