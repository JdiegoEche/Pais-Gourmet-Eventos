# País Gourmet

Codebase compartido para los 7 eventos gastronómicos. Un solo proyecto Astro + TypeScript se compila 7 veces (una por evento), cada build con su propio `EVENT_SLUG`, y se despliega en su propio proyecto de Cloudflare Pages con su dominio propio.

## Stack

- **Astro** (output estático, adapter de Cloudflare para las rutas server-only)
- **TypeScript** en modo `strict`
- **Sanity** como CMS headless: un único dataset con todos los eventos y restaurantes; las queries filtran por `event->slug.current == EVENT_SLUG`
- **Cloudflare R2** para las fotos de los restaurantes (varios GB en total)
- **Cloudflare Pages** para hosting — 7 proyectos, uno por dominio, cada uno con su propio `EVENT_SLUG` seteado en el dashboard

## Arquitectura multi-evento

No hay detección de dominio en runtime (no funciona bien con SSG puro). En cambio:

1. Cada uno de los 7 dominios tiene su propio proyecto de Cloudflare Pages, apuntando al mismo repo.
2. Cada proyecto define su propia env var `EVENT_SLUG` en el dashboard de Cloudflare.
3. Todas las queries a Sanity (home, listado, detalle de restaurante) filtran por ese `EVENT_SLUG`.
4. El resultado es 7 sitios 100% estáticos, cacheados en el edge, sin servidor propio corriendo.

La única ruta que no es estática es `src/pages/api/reviews.ts` (`prerender = false`), porque las reseñas públicas se escriben en tiempo real.

## Estructura

```
src/
├── components/     # EventHero, RestaurantCard, PhotoGallery, RestaurantFilters, ReviewForm, ReviewList
├── layouts/        # Layout.astro
├── lib/sanity.ts   # cliente de lectura (CDN) + cliente de escritura server-only (reseñas)
├── pages/
│   ├── index.astro
│   ├── restaurantes-participantes/index.astro
│   ├── restaurante/[slug].astro
│   └── api/reviews.ts
└── types/index.ts  # Event, Restaurant, Menu, Review
```

## Correr en local

```sh
npm install
npm run dev
```

Necesitás un archivo `.env` (no versionado) con estas variables — el agente no pudo crear `.env.example` por política de permisos, copiá esto a mano:

```
SANITY_PROJECT_ID=
SANITY_DATASET=
SANITY_REVIEW_TOKEN=
EVENT_SLUG=
```

## Próximos pasos manuales (requieren tus propias cuentas)

Estos pasos no los puede hacer un agente porque requieren login interactivo o acceso a servicios externos:

1. **Sanity**: `npx sanity login` y `npx sanity init` para crear el proyecto y el dataset. Definir el schema para `event`, `restaurant` y `review` según `src/types/index.ts`.
2. **Cloudflare R2**: crear el bucket para las fotos de los restaurantes y configurar el dominio público/CDN.
3. **Cloudflare Pages**: crear 7 proyectos (uno por evento), conectar cada dominio propio, y setear el `EVENT_SLUG` correspondiente en cada uno.
4. **Anti-spam de reseñas**: decidir e implementar la protección (recomendado: Cloudflare Turnstile) — deliberadamente pendiente, las reseñas hoy se publican sin moderación ni captcha.
5. **Webhook de Sanity → deploy hook de Cloudflare Pages**: como el sitio es estático (SSG), publicar/despublicar contenido en Sanity Studio no actualiza el sitio en vivo por sí solo — hace falta un rebuild. Configurar un webhook en Sanity (Settings → API → Webhooks) que dispare el deploy hook del proyecto de Cloudflare Pages correspondiente a cada evento, para que los cambios (por ejemplo, "bajar" un restaurante despublicándolo) se reflejen automáticamente sin intervención manual.
