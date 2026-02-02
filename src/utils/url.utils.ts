export function isValidUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol == 'https:';
  } catch {
    return false;
  }
}
