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

Las únicas rutas que no son estáticas son las de `src/pages/api/` (`prerender = false`), porque escriben datos en tiempo real.

## Modelo de datos

Los tipos completos están en `src/types/index.ts`. Resumen de las entidades y sus reglas no obvias:

- **`EventData`** — un evento (uno de los 7). Nombre, fechas, textos del home, rangos de precio/zonas para los filtros, banners rotativos, logos de sponsors, y los slugs de restaurantes destacados/recomendados de la semana.
- **`Restaurant`** — pertenece a un evento (`eventSlug`). Notas importantes:
  - `hours` es **texto libre**, no estructurado por día — los datos reales de inscripción vienen en formatos demasiado variados para parsear de forma confiable (ver sección de API abajo).
  - `whatsapp` puede venir como número plano o como link completo (`https://wa.link/...`); la UI arma el link correcto para ambos casos.
  - `menuHighlights` (íconos que resumen qué incluye el menú) es un array libre, no una lista fija — todavía no hay artes definidas.
  - `youtubeVideoUrl` es opcional; si no está, no se muestra nada (no hay placeholder).
  - `features` incluye `parking`, `petFriendly`, `delivery`, `tableService`, `creditCard` y `paymentMethods` (texto libre, tags).
  - Pendiente de agregar (datos que ya trae el Excel de inscripción pero el schema no tiene todavía): geolocalización por zona y zonas de cobertura de domicilio.
- **`Menu` / `MenuItem`** — un restaurante puede tener varios menús (distintos niveles de precio). `currentPrice` es el precio del evento, `previousPrice` es el precio normal fuera del evento (opcional). Cada ítem tiene una `category`: `entrantes` | `fuerte` | `postre`.
- **`Review`** — reseña pública de un restaurante. `phone` y `email` son **privados**: se piden para alimentar la base de leads pero la API pública nunca los devuelve. `rating` es el promedio redondeado de `foodRating`/`serviceRating`/`ambianceRating` (reseñas viejas solo tienen `rating`, sin desglose). `replies` es un array de `ReviewReply`.
- **`ReviewReply`** — respuesta pública a una reseña, hoy sin autenticación (ver por qué en la sección de API). Mismo criterio de privacidad que `Review`: `phone`/`email` nunca se exponen.
- **`LeadSignup`** — inscripción del formulario del home (nombre, email, celular).

## API

Todas las rutas están en `src/pages/api/`, corren server-side (`prerender = false`), y validan que el `Origin` del request coincida con el propio sitio.

| Ruta | Método | Qué hace |
|---|---|---|
| `/api/reviews` | `GET ?restaurant=<slug>` | Lista las reseñas públicas de un restaurante (nunca incluye `phone`/`email`, ni de la reseña ni de sus respuestas). |
| `/api/reviews` | `POST` | Crea una reseña. Body: `restaurantSlug`, `name` (3-30 caracteres), `phone`, `email`, `foodRating`/`serviceRating`/`ambianceRating` (1-5), `comment` (máx. 300). El `rating` general se calcula en el servidor como el promedio redondeado — no se confía en un valor que mande el cliente. |
| `/api/review-replies` | `POST` | Responde a una reseña existente. Body: `reviewId`, `name` (3-30), `phone`, `email`, `message` (máx. 300). Sin calificaciones. Público, sin login — es la solución provisoria mientras cada restaurante no tenga su propio acceso: los permisos de Sanity por documento son función exclusiva del plan Enterprise, así que darle a un restaurante acceso directo al Studio hoy le mostraría los datos de todos los demás. |
| `/api/signup` | `POST` | Inscripción del formulario del home. Body: `name` (máx. 100), `email`, `phone`. |

`name`/`phone`/`email` se validan con los mismos patrones en los tres endpoints (`PHONE_PATTERN`/`EMAIL_PATTERN`), duplicados en cada archivo a propósito — son rutas chicas y autocontenidas, no vale la pena compartir un módulo para esto todavía.

## Estructura

```
src/
├── components/     # EventHero, RestaurantCard, PhotoGallery, RestaurantFilters,
│                   # ReviewForm, ReviewList, ShareButtons, SignupForm, RotatingBanner,
│                   # WhatIncludesShowcase, ZoneMosaic, PriceMosaic, WeeklyRecommended,
│                   # RestaurantLogoStrip, SponsorsSection
├── layouts/        # Layout.astro
├── lib/
│   ├── sanity.ts   # cliente de lectura (CDN) + cliente de escritura server-only
│   ├── data.ts     # capa de acceso a datos (elige repositorio mock o Sanity)
│   └── repositories/  # ports.ts (interfaces) + implementaciones mock/ y sanity/
├── pages/
│   ├── index.astro
│   ├── restaurantes-participantes/index.astro
│   ├── restaurante/[slug].astro
│   └── api/reviews.ts, review-replies.ts, signup.ts
└── types/index.ts  # EventData, Restaurant, Menu, MenuItem, Review, ReviewReply, LeadSignup
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
SANITY_WRITE_TOKEN=
EVENT_SLUG=
```

## Próximos pasos manuales (requieren tus propias cuentas)

Estos pasos no los puede hacer un agente porque requieren login interactivo o acceso a servicios externos:

1. **Sanity**: `npx sanity login` y `npx sanity init` para crear el proyecto y el dataset. Definir el schema para `event`, `restaurant` y `review` según `src/types/index.ts`.
2. **Cloudflare R2** (elegido en vez del asset CDN nativo de Sanity: con el tráfico esperado del evento más grande, el egress de Sanity sale mucho más caro que R2, que no cobra egress):
   - Crear el bucket (ej. `pais-gourmet-fotos`) en el dashboard de Cloudflare → R2.
   - Activar el dominio público del bucket (o conectar un subdominio propio) para poder servir las fotos.
   - Crear un API token con permiso de lectura/escritura sobre ese bucket (R2 → Manage API tokens).
   - Guardar y pasar: Account ID, Access Key ID, Secret Access Key, nombre del bucket y URL pública del bucket.
   - Con esto y con Sanity ya inicializado (paso 1), falta construir un "custom asset source" en el Studio que suba las fotos directo a este bucket. Sanity soporta esto sin cambiar el tipo `image` de los campos existentes (`gallery`, `logo`, íconos de menú, banners): el asset source devuelve `kind: 'url'` en vez de subir el archivo al storage propio de Sanity.
3. **Cloudflare Pages**: crear 7 proyectos (uno por evento), conectar cada dominio propio, y setear el `EVENT_SLUG` correspondiente en cada uno.
4. **Anti-spam de reseñas**: el código ya está listo (Cloudflare Turnstile en `ReviewForm.astro` + verificación server-side en `src/lib/turnstile.ts`/`src/pages/api/reviews.ts`) pero queda inerte hasta crear la cuenta de Cloudflare y el sitio de Turnstile — falta: (a) crear el "widget" en el dashboard de Turnstile y pegar la site key como `PUBLIC_TURNSTILE_SITE_KEY` en cada uno de los 7 proyectos, (b) pegar la secret key como variable de entorno `TURNSTILE_SECRET_KEY` en cada proyecto. Sin esas dos variables configuradas, las reseñas se siguen publicando sin captcha (fallback intencional, igual que el rate limiting). El rate limiting por IP en `src/pages/api/*` ya está implementado en código (`src/lib/rateLimit.ts`, binding `RATE_LIMITER` en `wrangler.toml`); falta confirmar que cada uno de los 7 proyectos de Cloudflare tenga ese binding activo (se define en `wrangler.toml`, verificar que el proyecto lo lea o crearlo manualmente en el dashboard si el deploy es vía Git de Pages).
5. **Webhook de Sanity → deploy hook de Cloudflare Pages**: como el sitio es estático (SSG), publicar/despublicar contenido en Sanity Studio no actualiza el sitio en vivo por sí solo — hace falta un rebuild. Configurar un webhook en Sanity (Settings → API → Webhooks) que dispare el deploy hook del proyecto de Cloudflare Pages correspondiente a cada evento, para que los cambios (por ejemplo, "bajar" un restaurante despublicándolo) se reflejen automáticamente sin intervención manual.
6. **Carga masiva de restaurantes vía Excel**: herramienta de autoservicio (para alguien fuera del equipo de desarrollo) dentro del Studio que suba un Excel y cree/actualice los restaurantes. Depende de que exista el Studio (paso 1). Campos que el Excel de inscripción trae pero el schema todavía no tiene, quedan pendientes para una futura iteración: geolocalización por zona (lat/long) y zonas de cobertura de domicilio (se usará como filtro).
