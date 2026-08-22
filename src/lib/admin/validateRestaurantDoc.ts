import type { RestaurantDoc } from './parseRestaurantsExcel';

// Valida que un documento recibido por la API de import tenga exactamente la forma que
// produce parseRestaurantsExcel.ts, antes de escribirlo en Sanity. El endpoint recibe el
// resultado de /preview de vuelta desde el navegador (no confiable): un script podría
// mandar cualquier cosa directo a /import.

const FEATURE_KEYS = ['parking', 'petFriendly', 'delivery', 'tableService', 'creditCard'] as const;
const MENU_ITEM_CATEGORIES = new Set(['entrantes', 'fuerte', 'postre']);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isValidMenuItem(item: unknown): boolean {
  if (typeof item !== 'object' || item === null) return false;
  const i = item as Record<string, unknown>;
  if (i._type !== 'menuItem') return false;
  if (!isNonEmptyString(i._key)) return false;
  if (!isNonEmptyString(i.name)) return false;
  if (typeof i.category !== 'string' || !MENU_ITEM_CATEGORIES.has(i.category)) return false;
  if (i.description !== undefined && typeof i.description !== 'string') return false;
  return true;
}

function isValidMenu(menu: unknown): boolean {
  if (typeof menu !== 'object' || menu === null) return false;
  const m = menu as Record<string, unknown>;
  if (m._type !== 'menu') return false;
  if (!isNonEmptyString(m._key)) return false;
  if (!isNonEmptyString(m.name)) return false;
  if (typeof m.currentPrice !== 'number' || !Number.isFinite(m.currentPrice) || m.currentPrice <= 0) return false;
  if (m.previousPrice !== undefined && (typeof m.previousPrice !== 'number' || !Number.isFinite(m.previousPrice))) {
    return false;
  }
  if (!Array.isArray(m.items) || m.items.length === 0 || !m.items.every(isValidMenuItem)) return false;
  return true;
}

export function validateRestaurantDoc(doc: unknown): doc is RestaurantDoc {
  if (typeof doc !== 'object' || doc === null) return false;
  const d = doc as Record<string, unknown>;

  if (!isNonEmptyString(d._id)) return false;
  if (d._type !== 'restaurant') return false;
  if (!isNonEmptyString(d.name)) return false;

  const slug = d.slug as Record<string, unknown> | undefined;
  if (typeof slug !== 'object' || slug === null || slug._type !== 'slug' || !isNonEmptyString(slug.current)) {
    return false;
  }

  const event = d.event as Record<string, unknown> | undefined;
  if (typeof event !== 'object' || event === null || event._type !== 'reference' || !isNonEmptyString(event._ref)) {
    return false;
  }

  if (!isStringArray(d.zone) || d.zone.length === 0) return false;
  if (!isNonEmptyString(d.address)) return false;
  if (d.hours !== null && typeof d.hours !== 'string') return false;

  if (!Array.isArray(d.menus) || d.menus.length === 0 || !d.menus.every(isValidMenu)) return false;

  const features = d.features as Record<string, unknown> | undefined;
  if (typeof features !== 'object' || features === null || features._type !== 'features') return false;
  for (const key of FEATURE_KEYS) {
    if (typeof features[key] !== 'boolean') return false;
  }

  if (typeof d.vegetarianOption !== 'boolean') return false;
  if (!isStringArray(d.cuisineTypes)) return false;
  if (!isStringArray(d.deliveryZones)) return false;
  if (!Array.isArray(d.menuHighlights)) return false;
  if (!Array.isArray(d.gallery)) return false;

  if (d.phone !== undefined && typeof d.phone !== 'string') return false;
  if (d.whatsapp !== undefined && typeof d.whatsapp !== 'string') return false;
  if (d.instagram !== undefined && typeof d.instagram !== 'string') return false;

  return true;
}
