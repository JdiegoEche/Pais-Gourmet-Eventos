// cdn.sanity.io acepta resize por query string; otras URLs (ej. picsum en modo mock) se devuelven sin cambios.
export function thumb(url: string, width: number): string {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith('sanity.io')) {
      parsed.searchParams.set('w', String(width));
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'max');
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
}
