# Schema de Sanity — País Gourmet

Esta carpeta contiene las definiciones de schema (`schemaTypes/`) listas para conectar a un Sanity Studio real. Todavía no existe `sanity.config.ts` en el proyecto: falta correr `sanity init`, paso manual pendiente que requiere login del usuario.

## Documentos

- `event` — un documento por cada uno de los 7 eventos.
- `restaurant` — hasta 180 por evento, referencia a su `event`.
- `review` — reseña pública, sin campo de moderación/aprobación (se publica directo).

## Objetos reutilizables

`menu`, `menuItem`, `weeklyHours`, `features`, `sponsorLogo` — usados como campos embebidos dentro de `event`/`restaurant`.

## Cómo conectarlo cuando se haga `sanity init`

1. Desde la raíz del proyecto: `npm create sanity@latest` (o `npx sanity init` si ya tenés cuenta) — esto genera `sanity.config.ts` y su propia carpeta de schema.
2. Reemplazar el `schemaTypes` generado por defecto por el de esta carpeta (o copiar los archivos de `sanity/schemaTypes/` a donde el init los haya puesto).
3. En `sanity.config.ts`, importar y usar:

   ```ts
   import {schemaTypes} from './sanity/schemaTypes'

   export default defineConfig({
     // ...
     schema: {types: schemaTypes},
   })
   ```

4. Los tipos en `src/types/index.ts` (consumidos por el frontend vía GROQ) ya están alineados campo a campo con este schema — si se agrega o renombra un campo acá, actualizar también ese archivo.
