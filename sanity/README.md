# Sanity Studio — País Gourmet

Studio standalone (proyecto `xo45blck`, dataset `production`), con el schema de `schemaTypes/`.

Para correrlo local: `npm install && npm run dev` desde esta carpeta.

## Documentos

- `event` — un documento por cada uno de los 7 eventos.
- `restaurant` — hasta 180 por evento, referencia a su `event`.
- `review` — reseña pública, sin campo de moderación/aprobación (se publica directo).

## Objetos reutilizables

`menu`, `menuItem`, `menuHighlight`, `features`, `sponsorLogo` — usados como campos embebidos dentro de `event`/`restaurant`.

## Conexión con el frontend

El sitio Astro (raíz del repo) lee `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_WRITE_TOKEN` y `EVENT_SLUG` desde `.env` (ver `src/lib/sanity.ts`). `SANITY_WRITE_TOKEN` y `EVENT_SLUG` hay que completarlos a mano — no se generan con el init.

Los tipos en `src/types/index.ts` (consumidos por el frontend vía GROQ) ya están alineados campo a campo con este schema — si se agrega o renombra un campo acá, actualizar también ese archivo.
