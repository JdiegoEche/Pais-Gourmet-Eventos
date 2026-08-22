import * as XLSX from 'xlsx';

// Puerto a TypeScript de migration/scripts/transform.py — mismas reglas, misma forma de reporte.
// A diferencia del script Python, las franjas de precio se detectan leyendo los headers en vez
// de asumir 4 franjas fijas: eventos futuros pueden tener menos franjas.

const COL_NAME = 0;
const COL_HOURS = 1;
const COL_ATENCION = 2;
const COL_PET = 3;
const COL_PHONE = 4;
const COL_WHATSAPP = 5;
const COL_ADDRESS = 7;
const COL_PARKING = 8;
const COL_CREDIT_CARD = 9;
const COL_DELIVERY_ZONES_TEXT = 10;
const COL_INSTAGRAM = 12;
const COL_CUISINE_1 = 17;
const COL_CUISINE_2 = 18;
const COL_CUISINE_3 = 19;
const COL_CATEGORY = 20;
const COL_VEGETARIAN = 38;
const ZONA_MESA_START = 45;
const ZONA_MESA_END = 56; // exclusive
const DOMICILIO_START = 56;
const DOMICILIO_END = 75; // exclusive

interface TierBlock {
  outside: number;
  entradas: number;
  fuertes: number;
  postres: number;
}

interface MenuItemDoc {
  _type: 'menuItem';
  _key: string;
  name: string;
  category: 'entrantes' | 'fuerte' | 'postre';
  description?: string;
}

interface MenuDoc {
  _type: 'menu';
  _key: string;
  name: string;
  currentPrice: number;
  previousPrice?: number;
  items: MenuItemDoc[];
}

export interface RestaurantDoc {
  _id: string;
  _type: 'restaurant';
  name: string;
  slug: { _type: 'slug'; current: string };
  event: { _type: 'reference'; _ref: string };
  zone: string[];
  address: string;
  hours: string | null;
  menus: MenuDoc[];
  features: {
    _type: 'features';
    parking: boolean;
    petFriendly: boolean;
    delivery: boolean;
    tableService: boolean;
    creditCard: boolean;
  };
  vegetarianOption: boolean;
  cuisineTypes: string[];
  deliveryZones: string[];
  menuHighlights: never[];
  gallery: never[];
  phone?: string;
  whatsapp?: string;
  instagram?: string;
}

export interface QualityReport {
  created: string[];
  skipped: { name: string; reason: string }[];
  warnings: Record<string, string[]>;
}

export interface ParseResult {
  documents: RestaurantDoc[];
  report: QualityReport;
}

function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function slugify(name: string): string {
  return stripAccents(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return '';
  let text = String(value).trim();
  text = text.replace(/^-\s*/, '');
  return text.trim();
}

function parsePrice(raw: unknown): number | undefined {
  if (!raw) return undefined;
  const digits = String(raw).replace(/[^\d]/g, '');
  return digits ? Number(digits) : undefined;
}

function parsePhone(raw: unknown): string | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined;
  if (typeof raw === 'number') return String(Math.trunc(raw));
  return String(raw).trim();
}

function parseMenuItems(raw: string, category: MenuItemDoc['category']): MenuItemDoc[] {
  if (!raw) return [];
  const chunks = raw.trim().split(/(?:^|\n+)-\s+/).filter(Boolean);
  return chunks.map((chunk) => {
    const flat = chunk.trim().replace(/\n/g, ' ');
    const colonIndex = flat.indexOf(':');
    const name = colonIndex >= 0 ? flat.slice(0, colonIndex).trim() : flat;
    const description = colonIndex >= 0 ? flat.slice(colonIndex + 1).trim() : '';
    const item: MenuItemDoc = {
      _type: 'menuItem',
      _key: (slugify(`${category}-${name}`) || category).slice(0, 60),
      name,
      category,
    };
    if (description) item.description = description;
    return item;
  });
}

// Detecta las franjas de precio escaneando los headers desde COL_CATEGORY+1: cada franja son
// 4 columnas consecutivas (fuera del evento / entradas / fuertes / postres); se detiene apenas
// una columna no matchea el patrón "Precio del menú fuera del evento".
function detectTierBlocks(headers: string[]): TierBlock[] {
  const blocks: TierBlock[] = [];
  let i = COL_CATEGORY + 1;
  while (i + 3 < headers.length) {
    const header = stripAccents(String(headers[i] ?? '')).toLowerCase();
    if (!header.includes('precio del menu fuera del evento')) break;
    blocks.push({ outside: i, entradas: i + 1, fuertes: i + 2, postres: i + 3 });
    i += 4;
  }
  return blocks;
}

function menuForTier(row: unknown[], tierLabel: string, block: TierBlock): MenuDoc | null {
  const items: MenuItemDoc[] = [
    ...parseMenuItems(cleanText(row[block.entradas]), 'entrantes'),
    ...parseMenuItems(cleanText(row[block.fuertes]), 'fuerte'),
    ...parseMenuItems(cleanText(row[block.postres]), 'postre'),
  ];
  if (items.length === 0) return null;
  const currentPrice = parsePrice(tierLabel);
  if (!currentPrice) return null;
  const menu: MenuDoc = {
    _type: 'menu',
    _key: slugify(tierLabel),
    name: `Menú ${tierLabel}`,
    currentPrice,
    items,
  };
  const previousPrice = parsePrice(row[block.outside]);
  if (previousPrice) menu.previousPrice = previousPrice;
  return menu;
}

function buildMenus(
  row: unknown[],
  tierBlocksByLabel: Map<string, TierBlock>,
  quality: string[]
): MenuDoc[] {
  const categoryRaw = cleanText(row[COL_CATEGORY]);
  if (!categoryRaw) return [];
  const tiers = categoryRaw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const menus: MenuDoc[] = [];
  for (const tier of tiers) {
    const block = tierBlocksByLabel.get(tier);
    if (!block) {
      quality.push(`categoria desconocida o sin franja detectada: ${JSON.stringify(tier)}`);
      continue;
    }
    const menu = menuForTier(row, tier, block);
    if (menu) {
      menus.push(menu);
    } else {
      quality.push(`tier ${tier} marcado pero sin items en su bloque de columnas`);
    }
  }

  if (menus.length === 0) {
    // La categoria marcada no tenia datos; puede que se haya llenado otro bloque por error.
    for (const [label, block] of tierBlocksByLabel) {
      const menu = menuForTier(row, label, block);
      if (menu) {
        quality.push(
          `categoria marcada (${JSON.stringify(categoryRaw)}) sin datos; se uso el menu encontrado en el bloque ${label} en su lugar`
        );
        menus.push(menu);
        break;
      }
    }
  }

  return menus;
}

export function parseRestaurantsExcel(buffer: ArrayBuffer, eventId: string): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets['Hoja 1'] ?? workbook.Sheets[workbook.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });

  const headers = (rows[0] ?? []).map((h) => String(h ?? ''));
  const tierBlocks = detectTierBlocks(headers);

  // Las franjas se mapean por orden ascendente de precio contra las categorias reales que
  // aparecen en los datos (misma cantidad y mismo orden que las franjas detectadas en headers).
  const distinctPrices = new Set<number>();
  for (const row of rows.slice(1)) {
    const raw = cleanText(row[COL_CATEGORY]);
    if (!raw) continue;
    for (const label of raw.split(',').map((t) => t.trim()).filter(Boolean)) {
      const price = parsePrice(label);
      if (price) distinctPrices.add(price);
    }
  }
  const sortedLabels = [...distinctPrices]
    .sort((a, b) => a - b)
    .map((price) => `$${price.toLocaleString('es-CO')}`);

  const tierBlocksByLabel = new Map<string, TierBlock>();
  sortedLabels.forEach((label, i) => {
    if (tierBlocks[i]) tierBlocksByLabel.set(label, tierBlocks[i]);
  });

  const report: QualityReport = { created: [], skipped: [], warnings: {} };
  const documents: RestaurantDoc[] = [];
  const usedSlugs = new Set<string>();

  for (const row of rows.slice(1)) {
    const name = cleanText(row[COL_NAME]);
    if (!name) continue;

    const quality: string[] = [];

    const phone = parsePhone(row[COL_PHONE]);
    if (!phone) quality.push('sin telefono');

    const cuisineTypes: string[] = [];
    for (const col of [COL_CUISINE_1, COL_CUISINE_2, COL_CUISINE_3]) {
      const v = cleanText(row[col]);
      if (v && !cuisineTypes.includes(v)) cuisineTypes.push(v);
    }
    if (cuisineTypes.length === 0) quality.push('sin tipo de cocina');

    const address = cleanText(row[COL_ADDRESS]);
    if (!address) {
      report.skipped.push({ name, reason: 'sin direccion (obligatoria)' });
      continue;
    }

    const zones: string[] = [];
    for (let col = ZONA_MESA_START; col < ZONA_MESA_END; col++) {
      const v = cleanText(row[col]);
      if (v && !zones.includes(v)) zones.push(v);
    }
    if (zones.length === 0) {
      report.skipped.push({ name, reason: 'sin zona (obligatoria)' });
      continue;
    }

    const menus = buildMenus(row, tierBlocksByLabel, quality);
    if (menus.length === 0) {
      report.skipped.push({ name, reason: 'sin menu (obligatorio)' });
      continue;
    }

    let deliveryZones: string[] = [];
    for (let col = DOMICILIO_START; col < DOMICILIO_END; col++) {
      const v = cleanText(row[col]);
      if (v && !deliveryZones.includes(v)) deliveryZones.push(v);
    }
    if (deliveryZones.length === 0) {
      const text = cleanText(row[COL_DELIVERY_ZONES_TEXT]);
      if (text) deliveryZones = text.split(',').map((z) => z.trim()).filter(Boolean);
    }

    const atencion = cleanText(row[COL_ATENCION]).toLowerCase();

    let slug = slugify(name);
    if (usedSlugs.has(slug)) slug = `${slug}-${usedSlugs.size}`;
    usedSlugs.add(slug);

    const doc: RestaurantDoc = {
      _id: `restaurant-${slug}`,
      _type: 'restaurant',
      name,
      slug: { _type: 'slug', current: slug },
      event: { _type: 'reference', _ref: eventId },
      zone: zones,
      address,
      hours: cleanText(row[COL_HOURS]) || null,
      menus,
      features: {
        _type: 'features',
        parking: Boolean(cleanText(row[COL_PARKING])),
        petFriendly: Boolean(cleanText(row[COL_PET])),
        delivery: atencion.includes('domicilio') || deliveryZones.length > 0,
        tableService: atencion.includes('mesa'),
        creditCard: Boolean(cleanText(row[COL_CREDIT_CARD])),
      },
      vegetarianOption: Boolean(cleanText(row[COL_VEGETARIAN])),
      cuisineTypes,
      deliveryZones,
      menuHighlights: [],
      gallery: [],
    };
    if (phone) doc.phone = phone;
    const whatsapp = cleanText(row[COL_WHATSAPP]);
    if (whatsapp) doc.whatsapp = whatsapp;
    const instagram = cleanText(row[COL_INSTAGRAM]);
    if (instagram) doc.instagram = instagram;

    documents.push(doc);
    report.created.push(slug);
    if (quality.length > 0) report.warnings[name] = quality;
  }

  return { documents, report };
}
