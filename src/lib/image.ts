// Placeholder para restaurantes sin fotos cargadas todavía. Data URI embebida: nada que romper por red.
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 480 480'%3E%3Crect width='480' height='480' fill='%23e8dcc8'/%3E%3Cg fill='none' stroke='%236b5c4d' stroke-width='10' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M180 140v90a30 30 0 0 0 30 30v90'/%3E%3Cpath d='M180 140v170'/%3E%3Cpath d='M210 140v170'/%3E%3Cpath d='M300 140c-30 15-45 45-45 90s15 75 45 90v90'/%3E%3C/g%3E%3C/svg%3E";

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

// Arma un srcset con una variante por ancho (todas via thumb(), mismo CDN de Sanity resize).
// Para URLs que no son de Sanity, thumb() ya devuelve la url sin cambios para cada ancho, así
// que el srcset resultante repite la misma URL — inofensivo, el navegador igual usa "src".
export function thumbSrcSet(url: string, widths: number[]): string {
  return widths.map((width) => `${thumb(url, width)} ${width}w`).join(', ');
}
