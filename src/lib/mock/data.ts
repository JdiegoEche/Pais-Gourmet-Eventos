import type { EventData, Restaurant, Review } from '../../types';

type ReviewSeed = Omit<Review, 'id' | 'replies'>;

export const mockEvent: EventData = {
  slug: 'pais-gourmet-demo',
  name: 'País Gourmet Demo',
  startDate: '2026-08-01',
  endDate: '2026-08-31',
  whatIncludes:
    'Un mes de menús exclusivos a precio fijo en los mejores restaurantes del Eje Cafetero, pensados para compartir en pareja o en grupo.',
  whatIncludesImage: 'https://picsum.photos/seed/what-includes/900/500',
  priceRanges: ['$45.000 - $65.000', '$65.000 - $85.000', '$85.000 - $110.000'],
  zones: ['Armenia', 'Pereira', 'Manizales'],
  zoneShowcase: [
    { name: 'Armenia', imageUrl: 'https://picsum.photos/seed/zone-armenia/600/400' },
    { name: 'Pereira', imageUrl: 'https://picsum.photos/seed/zone-pereira/600/400' },
    { name: 'Manizales', imageUrl: 'https://picsum.photos/seed/zone-manizales/600/400' },
  ],
  featuredRestaurantSlugs: ['la-tulpa-fuego-y-cafe', 'umami-ramen-bar', 'el-fogon-criollo'],
  weeklyRecommendedEnabled: true,
  weeklyRecommendedRestaurantSlugs: ['trattoria-girasol', 'verde-oliva-bistro'],
  banners: [
    'https://picsum.photos/seed/banner-1/1600/500',
    'https://picsum.photos/seed/banner-2/1600/500',
    'https://picsum.photos/seed/banner-3/1600/500',
  ],
  sponsorLogos: [
    { name: 'Cámara de Comercio del Eje', imageUrl: 'https://picsum.photos/seed/sponsor-1/200/80' },
    { name: 'Turismo Eje Cafetero', imageUrl: 'https://picsum.photos/seed/sponsor-2/200/80' },
  ],
};

// Set curado a mano (verificadas una por una) de fotos de alta gastronomía y restaurantes en
// Unsplash — un servicio de fotos aleatorias por palabra clave (LoremFlickr, source.unsplash.com)
// devolvía resultados de mala calidad o directamente estaba caído.
const FOOD_PHOTO_IDS = [
  '1414235077428-338989a2e8c0', // plato servido en mesa de restaurante
  '1517248135467-4c7edcad34c4', // interior de restaurante elegante
  '1555396273-367ea4eb4db5', // interior de café/restaurante casual
  '1546069901-ba9599a7e63c', // bowl de comida saludable
  '1567620905732-2d1ec7ab7445', // panqueques con miel
  '1568901346375-23c9450c58cd', // hamburguesa gourmet
  '1621996346565-e3dbc646d9a9', // pasta
  '1580822184713-fc5400e7fe10', // sushi
];

function seedToIndex(seed: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

function foodPhoto(seed: string, width: number, height: number): string {
  const id = FOOD_PHOTO_IDS[seedToIndex(seed, FOOD_PHOTO_IDS.length)];
  return `https://images.unsplash.com/photo-${id}?w=${width}&h=${height}&fit=crop`;
}

function gallery(slug: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => foodPhoto(`${slug}-${i + 1}`, 800, 600));
}

export const mockRestaurants: Restaurant[] = [
  {
    slug: 'la-tulpa-fuego-y-cafe',
    eventSlug: 'pais-gourmet-demo',
    name: 'La Tulpa Fuego y Café',
    logo: foodPhoto('la-tulpa-fuego-y-cafe-logo', 200, 200),
    cuisineTypes: ['Colombiana', 'Fusión'],
    zone: 'Armenia',
    address: 'Calle 10 # 14-32, Armenia, Quindío',
    phone: '3104567890',
    whatsapp: '573104567890',
    instagram: 'latulpafuegoycafe',
    hours: '- Martes a viernes de 12:00 m a 9:00 pm\n\n- Sábado y domingo de 12:00 m a 11:00 pm',
    menus: [
      {
        name: 'Menú Tulpa',
        currentPrice: 85000,
        previousPrice: 105000,
        items: [
          { name: 'Patacón con hogao y queso', category: 'entrantes' },
          { name: 'Sancocho de gallina criolla', category: 'fuerte' },
          { name: 'Torta de natas', description: 'con café de la finca', category: 'postre' },
        ],
      },
    ],
    features: { parking: true, petFriendly: true, delivery: true, tableService: true, creditCard: true, paymentMethods: ['Efectivo', 'Tarjeta', 'Nequi'] },
    menuHighlights: [],
    vegetarianOption: false,
    gallery: gallery('la-tulpa-fuego-y-cafe', 5),
    relatedRestaurantSlugs: ['sazon-del-eje', 'el-fogon-criollo'],
  },
  {
    slug: 'trattoria-girasol',
    eventSlug: 'pais-gourmet-demo',
    name: 'Trattoria Girasol',
    logo: foodPhoto('trattoria-girasol-logo', 200, 200),
    cuisineTypes: ['Italiana'],
    zone: 'Pereira',
    address: 'Avenida Circunvalar # 5-21, Pereira, Risaralda',
    phone: '3117654321',
    whatsapp: 'https://wa.link/trattoriagirasol',
    instagram: 'trattoriagirasol',
    hours: '- Todos los días de 12:00 m a 10:00 pm\n\n- Viernes y sábado hasta las 11:30 pm',
    menus: [
      {
        name: 'Menú Toscana',
        currentPrice: 95000,
        previousPrice: 120000,
        items: [
          { name: 'Bruschetta de tomate y albahaca', category: 'entrantes' },
          { name: 'Risotto de hongos porcini', category: 'fuerte' },
          { name: 'Tiramisú de la casa', category: 'postre' },
        ],
      },
      {
        name: 'Menú Sorrento',
        currentPrice: 65000,
        items: [
          { name: 'Carpaccio de zucchini', category: 'entrantes' },
          { name: 'Pappardelle al pesto', category: 'fuerte' },
          { name: 'Panna cotta de maracuyá', category: 'postre' },
        ],
      },
    ],
    features: { parking: false, petFriendly: false, delivery: true, tableService: true, creditCard: true, paymentMethods: ['Tarjeta', 'Efectivo'] },
    menuHighlights: [],
    vegetarianOption: true,
    gallery: gallery('trattoria-girasol', 6),
    relatedRestaurantSlugs: ['verde-oliva-bistro'],
  },
  {
    slug: 'sazon-del-eje',
    eventSlug: 'pais-gourmet-demo',
    name: 'Sazón del Eje',
    logo: foodPhoto('sazon-del-eje-logo', 200, 200),
    cuisineTypes: ['Colombiana'],
    zone: 'Manizales',
    address: 'Carrera 23 # 62-18, Manizales, Caldas',
    phone: '3129988776',
    instagram: 'sazondeleje',
    hours: '- Lunes a viernes de 12:00 m a 8:00 pm\n\n- Sábado y domingo de 12:00 m a 8:00 pm',
    menus: [
      {
        name: 'Menú Cafetero',
        currentPrice: 65000,
        previousPrice: 78000,
        items: [
          { name: 'Arepa de choclo con quesillo', category: 'entrantes' },
          { name: 'Frijolada paisa', category: 'fuerte' },
          { name: 'Obleas con arequipe', category: 'postre' },
        ],
      },
    ],
    features: { parking: true, petFriendly: true, delivery: false, tableService: true, creditCard: false, paymentMethods: ['Efectivo'] },
    menuHighlights: [],
    vegetarianOption: false,
    gallery: gallery('sazon-del-eje', 4),
    relatedRestaurantSlugs: ['la-tulpa-fuego-y-cafe'],
  },
  {
    slug: 'umami-ramen-bar',
    eventSlug: 'pais-gourmet-demo',
    name: 'Umami Ramen Bar',
    logo: foodPhoto('umami-ramen-bar-logo', 200, 200),
    cuisineTypes: ['Asiática', 'Fusión'],
    zone: 'Armenia',
    address: 'Calle 21 # 18-45, Armenia, Quindío',
    phone: '3001122334',
    whatsapp: 'https://wa.link/umamiramenbar',
    instagram: 'umamiramenbar',
    hours: '- Martes a domingo de 12:00 m a 10:00 pm\n\n- Lunes cerrado',
    menus: [
      {
        name: 'Menú Umami',
        currentPrice: 89000,
        previousPrice: 110000,
        items: [
          { name: 'Gyozas de cerdo', category: 'entrantes' },
          { name: 'Ramen tonkotsu', category: 'fuerte' },
          { name: 'Mochi de té verde', category: 'postre' },
        ],
      },
    ],
    features: { parking: false, petFriendly: false, delivery: true, tableService: true, creditCard: true, paymentMethods: ['Tarjeta', 'Nequi'] },
    menuHighlights: [],
    vegetarianOption: true,
    gallery: gallery('umami-ramen-bar', 5),
    relatedRestaurantSlugs: ['trattoria-girasol', 'verde-oliva-bistro'],
  },
  {
    slug: 'el-fogon-criollo',
    eventSlug: 'pais-gourmet-demo',
    name: 'El Fogón Criollo',
    logo: foodPhoto('el-fogon-criollo-logo', 200, 200),
    cuisineTypes: ['Colombiana', 'Parrilla'],
    zone: 'Pereira',
    address: 'Calle 14 # 22-08, Pereira, Risaralda',
    phone: '3145566778',
    whatsapp: '573145566778',
    instagram: 'elfogoncriollo',
    hours: '- Todos los días de 12:00 m a 11:00 pm',
    menus: [
      {
        name: 'Menú Parrillero',
        currentPrice: 98000,
        previousPrice: 125000,
        items: [
          { name: 'Chicharrón con arepa', category: 'entrantes' },
          { name: 'Bandeja paisa completa', category: 'fuerte' },
          { name: 'Brevas con arequipe', category: 'postre' },
        ],
      },
    ],
    features: { parking: true, petFriendly: true, delivery: true, tableService: true, creditCard: true, paymentMethods: ['Efectivo', 'Tarjeta'] },
    menuHighlights: [],
    vegetarianOption: false,
    gallery: gallery('el-fogon-criollo', 6),
    relatedRestaurantSlugs: ['la-tulpa-fuego-y-cafe', 'sazon-del-eje'],
  },
  {
    slug: 'verde-oliva-bistro',
    eventSlug: 'pais-gourmet-demo',
    name: 'Verde Oliva Bistró',
    logo: foodPhoto('verde-oliva-bistro-logo', 200, 200),
    cuisineTypes: ['Mediterránea'],
    zone: 'Manizales',
    address: 'Carrera 19 # 27-40, Manizales, Caldas',
    phone: '3167788990',
    instagram: 'verdeolivabistro',
    hours: '- Martes a jueves de 12:00 m a 9:00 pm\n\n- Viernes y sábado de 12:00 m a 11:00 pm\n\n- Domingo de 12:00 m a 6:00 pm',
    menus: [
      {
        name: 'Menú Mediterráneo',
        currentPrice: 92000,
        previousPrice: 115000,
        items: [
          { name: 'Hummus con pan pita', category: 'entrantes' },
          { name: 'Cordero a la griega', category: 'fuerte' },
          { name: 'Baklava', category: 'postre' },
        ],
      },
    ],
    features: { parking: false, petFriendly: false, delivery: false, tableService: true, creditCard: true, paymentMethods: ['Tarjeta'] },
    menuHighlights: [],
    vegetarianOption: true,
    gallery: gallery('verde-oliva-bistro', 4),
    relatedRestaurantSlugs: ['trattoria-girasol', 'umami-ramen-bar'],
  },
];

export const mockReviewsSeed: ReviewSeed[] = [
  { restaurantSlug: 'la-tulpa-fuego-y-cafe', name: 'Camila R.', rating: 5, comment: 'El sancocho estaba espectacular, muy buena atención.', createdAt: '2026-07-10T18:30:00.000Z' },
  { restaurantSlug: 'la-tulpa-fuego-y-cafe', name: 'Julián M.', rating: 4, comment: 'Rico ambiente, aunque tardaron un poco con el postre.', createdAt: '2026-07-15T20:00:00.000Z' },
  { restaurantSlug: 'trattoria-girasol', name: 'Sofía T.', rating: 5, comment: 'El risotto de hongos es el mejor que probé en la ciudad.', createdAt: '2026-07-08T19:15:00.000Z' },
  { restaurantSlug: 'trattoria-girasol', name: 'Andrés P.', rating: 4, comment: 'Muy buena relación precio-calidad en el menú Sorrento.', createdAt: '2026-07-18T21:00:00.000Z' },
  { restaurantSlug: 'sazon-del-eje', name: 'Laura G.', rating: 5, comment: 'Sabor casero de verdad, se siente el cariño en la comida.', createdAt: '2026-07-05T13:00:00.000Z' },
  { restaurantSlug: 'sazon-del-eje', name: 'Diego F.', rating: 3, comment: 'Buena comida, el local es un poco pequeño para grupos grandes.', createdAt: '2026-07-20T14:30:00.000Z' },
  { restaurantSlug: 'umami-ramen-bar', name: 'Valentina S.', rating: 5, comment: 'El ramen tonkotsu tiene un caldo increíble.', createdAt: '2026-07-12T20:45:00.000Z' },
  { restaurantSlug: 'umami-ramen-bar', name: 'Mateo C.', rating: 4, comment: 'Porciones generosas y buen ambiente para ir en pareja.', createdAt: '2026-07-22T19:30:00.000Z' },
  { restaurantSlug: 'el-fogon-criollo', name: 'Isabella V.', rating: 5, comment: 'La bandeja paisa alcanza para dos personas fácil.', createdAt: '2026-07-09T13:45:00.000Z' },
  { restaurantSlug: 'el-fogon-criollo', name: 'Santiago L.', rating: 4, comment: 'Excelente parrilla, buena música los fines de semana.', createdAt: '2026-07-19T21:15:00.000Z' },
  { restaurantSlug: 'verde-oliva-bistro', name: 'Daniela H.', rating: 5, comment: 'El cordero estaba en su punto, servicio muy atento.', createdAt: '2026-07-11T20:00:00.000Z' },
  { restaurantSlug: 'verde-oliva-bistro', name: 'Nicolás A.', rating: 4, comment: 'Lindo lugar, ideal para una cena tranquila.', createdAt: '2026-07-21T20:30:00.000Z' },
];
