"""
Transforma el export crudo de Google Forms (Excel) en NDJSON de documentos
`restaurant` para importar a Sanity con `sanity dataset import`.

Uso:
    python migration/scripts/transform.py "<ruta al excel>"

Genera:
    migration/transformed/restaurants.ndjson
    migration/reports/quality.json
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

import openpyxl

EVENT_ID = "event-medellin-gourmet-2026-1"
PHOTOS_DIR = Path(r"C:\Users\Juan\Documents\fotos mg")

# carpeta de fotos -> nombre exacto del restaurante en el Excel (confirmado a mano, no es 1:1 automático)
PHOTO_FOLDER_TO_NAME = {
    "gabo": "Gabo",
    "mombasa-supper-club": "Mombasa",
    "roll-up-cocina-asiatica-creativa": "Roll Up Sushiburrito",
    "sushi-world": "Sushi World",
}

TIER_COLUMNS = {
    "$89.000": {"outside": 21, "entradas": 22, "fuertes": 23, "postres": 24},
    "$119.000": {"outside": 25, "entradas": 26, "fuertes": 27, "postres": 28},
    "$159.000": {"outside": 29, "entradas": 30, "fuertes": 31, "postres": 32},
    "$209.000": {"outside": 33, "entradas": 34, "fuertes": 35, "postres": 36},
}

COL_NAME = 0
COL_HOURS = 1
COL_ATENCION = 2
COL_PET = 3
COL_PHONE = 4
COL_WHATSAPP = 5
COL_ADDRESS = 7
COL_PARKING = 8
COL_CREDIT_CARD = 9
COL_DELIVERY_ZONES_TEXT = 10
COL_INSTAGRAM = 12
COL_CUISINE_1, COL_CUISINE_2, COL_CUISINE_3 = 17, 18, 19
COL_CATEGORY = 20
COL_VEGETARIAN = 38
COLS_ZONA_MESA = range(45, 56)  # Zona Atencion Mesa 1..11
COLS_DOMICILIO = range(56, 75)  # Domicilio 1..19


def strip_accents(text: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn")


def slugify(name: str) -> str:
    s = strip_accents(name).lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def clean_text(value) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    text = re.sub(r"^-\s*", "", text)  # el form suele anteponer "- " a las respuestas
    return text.strip()


def parse_price(raw) -> int | None:
    if not raw:
        return None
    digits = re.sub(r"[^\d]", "", str(raw))
    return int(digits) if digits else None


def parse_phone(raw) -> str | None:
    if raw is None or raw == "":
        return None
    if isinstance(raw, float):
        raw = int(raw)
    return str(raw).strip()


def parse_menu_items(raw: str, category: str) -> list[dict]:
    if not raw:
        return []
    chunks = re.split(r"(?:^|\n+)-\s+", raw.strip())
    items = []
    for chunk in chunks:
        chunk = chunk.strip().replace("\n", " ")
        if not chunk:
            continue
        if ":" in chunk:
            name, desc = chunk.split(":", 1)
            name, desc = name.strip(), desc.strip()
        else:
            name, desc = chunk, ""
        item = {"_type": "menuItem", "_key": slugify(f"{category}-{name}")[:60] or category, "name": name, "category": category}
        if desc:
            item["description"] = desc
        items.append(item)
    return items


def _menu_for_tier(row, tier: str) -> dict | None:
    cols = TIER_COLUMNS[tier]
    items = []
    items += parse_menu_items(clean_text(row[cols["entradas"]]), "entrantes")
    items += parse_menu_items(clean_text(row[cols["fuertes"]]), "fuerte")
    items += parse_menu_items(clean_text(row[cols["postres"]]), "postre")
    if not items:
        return None
    menu = {
        "_type": "menu",
        "_key": slugify(tier),
        "name": f"Menú {tier}",
        "currentPrice": parse_price(tier),
        "items": items,
    }
    previous_price = parse_price(row[cols["outside"]])
    if previous_price:
        menu["previousPrice"] = previous_price
    return menu


def build_menus(row, quality: list[str]) -> list[dict]:
    category_raw = clean_text(row[COL_CATEGORY])
    if not category_raw:
        return []
    tiers = [t.strip() for t in category_raw.split(",") if t.strip()]
    menus = []
    for tier in tiers:
        if tier not in TIER_COLUMNS:
            quality.append(f"categoria desconocida: {tier!r}")
            continue
        menu = _menu_for_tier(row, tier)
        if menu:
            menus.append(menu)
        else:
            quality.append(f"tier {tier} marcado pero sin items en su bloque de columnas")

    if not menus:
        # La categoría marcada no tiene datos, pero puede que el restaurante haya llenado
        # el menú bajo OTRO bloque de precio por error de formulario. Se usa ese en su lugar.
        for tier, cols in TIER_COLUMNS.items():
            menu = _menu_for_tier(row, tier)
            if menu:
                quality.append(
                    f"categoria marcada ({category_raw!r}) sin datos; se uso el menu encontrado en el bloque {tier} en su lugar"
                )
                menus.append(menu)
                break

    return menus


def build_gallery(slug_folder: str) -> list[dict]:
    folder = PHOTOS_DIR / slug_folder
    if not folder.is_dir():
        return []
    files = sorted(
        [f for f in folder.iterdir() if f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")],
        key=lambda f: f.name.lower(),
    )
    gallery = []
    for f in files:
        uri = f.resolve().as_uri()  # file:///C:/... con espacios ya percent-encoded
        gallery.append({"_type": "image", "_key": slugify(f.stem)[:60], "_sanityAsset": f"image@{uri}"})
    return gallery


def main():
    if len(sys.argv) < 2:
        print("Uso: python transform.py <ruta al excel>")
        sys.exit(1)

    xlsx_path = Path(sys.argv[1])
    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    ws = wb["Hoja 1"]

    photo_name_to_folder = {v: k for k, v in PHOTO_FOLDER_TO_NAME.items()}

    out_dir = Path(__file__).resolve().parents[1] / "transformed"
    reports_dir = Path(__file__).resolve().parents[1] / "reports"
    out_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)

    ndjson_path = out_dir / "restaurants.ndjson"
    report = {"created": [], "skipped": [], "warnings": {}}

    used_slugs: set[str] = set()

    with ndjson_path.open("w", encoding="utf-8") as out:
        for row in ws.iter_rows(min_row=2, values_only=True):
            name = clean_text(row[COL_NAME])
            if not name:
                continue  # fila vacía del export

            quality: list[str] = []

            phone = parse_phone(row[COL_PHONE])
            if not phone:
                quality.append("sin telefono")

            cuisine_types = []
            for col in (COL_CUISINE_1, COL_CUISINE_2, COL_CUISINE_3):
                v = clean_text(row[col])
                if v and v not in cuisine_types:
                    cuisine_types.append(v)
            if not cuisine_types:
                quality.append("sin tipo de cocina")

            address = clean_text(row[COL_ADDRESS])
            if not address:
                quality.append("sin direccion")
                report["skipped"].append({"name": name, "reason": "sin direccion (obligatoria)"})
                continue

            zones = []
            for col in COLS_ZONA_MESA:
                v = clean_text(row[col])
                if v and v not in zones:
                    zones.append(v)
            if not zones:
                quality.append("sin zona de atencion en mesa")
                report["skipped"].append({"name": name, "reason": "sin zona (obligatoria)"})
                continue

            menus = build_menus(row, quality)
            if not menus:
                quality.append("sin menu valido")
                report["skipped"].append({"name": name, "reason": "sin menu (obligatorio)"})
                continue

            delivery_zones = []
            for col in COLS_DOMICILIO:
                v = clean_text(row[col])
                if v and v not in delivery_zones:
                    delivery_zones.append(v)
            if not delivery_zones:
                text = clean_text(row[COL_DELIVERY_ZONES_TEXT])
                if text:
                    delivery_zones = [z.strip() for z in text.split(",") if z.strip()]

            atencion = clean_text(row[COL_ATENCION]).lower()

            slug = slugify(name)
            if slug in used_slugs:
                slug = f"{slug}-{len(used_slugs)}"
            used_slugs.add(slug)

            doc = {
                "_id": f"restaurant-{slug}",
                "_type": "restaurant",
                "name": name,
                "slug": {"_type": "slug", "current": slug},
                "event": {"_type": "reference", "_ref": EVENT_ID},
                "zone": zones,
                "address": address,
                "hours": clean_text(row[COL_HOURS]) or None,
                "menus": menus,
                "features": {
                    "_type": "features",
                    "parking": bool(clean_text(row[COL_PARKING])),
                    "petFriendly": bool(clean_text(row[COL_PET])),
                    "delivery": "domicilio" in atencion or bool(delivery_zones),
                    "tableService": "mesa" in atencion,
                    "creditCard": bool(clean_text(row[COL_CREDIT_CARD])),
                },
                "vegetarianOption": bool(clean_text(row[COL_VEGETARIAN])),
                # el frontend trata estos arrays como siempre presentes (.join/.map sin chequeo
                # null), asi que se setean explicitos aunque esten vacios en vez de omitirlos
                "cuisineTypes": cuisine_types,
                "deliveryZones": delivery_zones,
                "menuHighlights": [],
            }
            if phone:
                doc["phone"] = phone
            whatsapp = clean_text(row[COL_WHATSAPP])
            if whatsapp:
                doc["whatsapp"] = whatsapp
            instagram = clean_text(row[COL_INSTAGRAM])
            if instagram:
                doc["instagram"] = instagram

            photo_folder = photo_name_to_folder.get(name)
            gallery = build_gallery(photo_folder) if photo_folder else []
            doc["gallery"] = gallery  # siempre presente (array), el frontend hace .map sin chequeo null
            if not gallery:
                quality.append("sin fotos todavia")

            out.write(json.dumps(doc, ensure_ascii=False) + "\n")
            report["created"].append(slug)
            if quality:
                report["warnings"][name] = quality

    reports_dir.joinpath("quality.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Documentos generados: {len(report['created'])}")
    print(f"Omitidos: {len(report['skipped'])}")
    print(f"Con advertencias (no bloqueantes): {len(report['warnings'])}")
    print(f"NDJSON: {ndjson_path}")
    print(f"Reporte: {reports_dir / 'quality.json'}")


if __name__ == "__main__":
    main()
