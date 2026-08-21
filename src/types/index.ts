export interface EventData {
  slug: string;
  name: string;
  startDate: string;
  endDate: string;
  whatIncludes: string;
  whatIncludesImage: string;
  priceRanges: PriceRangeItem[];
  zones: string[];
  zoneShowcase: ZoneShowcaseItem[];
  featuredRestaurantSlugs: string[];
  heroRecommendedEnabled: boolean;
  heroRecommendedRestaurantSlugs: string[];
  banners: string[];
  sponsorLogos: { name: string; imageUrl: string }[];
}

export interface ZoneShowcaseItem {
  name: string;
  imageUrl: string;
}

export interface PriceRangeItem {
  range: string;
  imageUrl: string;
}

export interface MenuItem {
  name: string;
  description?: string;
  category: 'entrantes' | 'fuerte' | 'postre';
}

export interface Menu {
  name: string;
  currentPrice: number;
  previousPrice?: number;
  items: MenuItem[];
}

export interface RestaurantFeatures {
  parking: boolean;
  petFriendly: boolean;
  delivery: boolean;
  tableService: boolean;
  creditCard: boolean;
  paymentMethods: string[];
}

export interface MenuHighlight {
  icon: string;
  label: string;
}

export interface Restaurant {
  slug: string;
  eventSlug: string;
  name: string;
  logo?: string;
  cuisineTypes: string[];
  zone: string;
  deliveryZones: string[];
  address: string;
  phone: string;
  whatsapp?: string;
  instagram?: string;
  // Texto libre tal cual lo escribe cada restaurante (ej. "Lunes a viernes de 3:30pm a 10pm").
  // No estructurado por día: los datos de origen (formulario de inscripción) vienen en formatos
  // demasiado variados para parsear de forma confiable.
  hours: string;
  menus: Menu[];
  menuHighlights: MenuHighlight[];
  youtubeVideoUrl?: string;
  vegetarianOption: boolean;
  features: RestaurantFeatures;
  gallery: string[];
  relatedRestaurantSlugs: string[];
}

export interface ReviewReply {
  name: string;
  // Mismo criterio de privacidad que en Review: se piden para poder contactar a quien dejó
  // la reseña original, pero nunca se exponen por la API pública ni se muestran en el sitio.
  phone?: string;
  email?: string;
  message: string;
  createdAt: string;
}

export interface Review {
  id: string;
  restaurantSlug: string;
  name: string;
  // Datos de contacto privados: se piden en el formulario para alimentar la base de datos
  // de leads, pero nunca se exponen por la API pública ni se muestran en el sitio.
  phone?: string;
  email?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  foodRating?: 1 | 2 | 3 | 4 | 5;
  serviceRating?: 1 | 2 | 3 | 4 | 5;
  ambianceRating?: 1 | 2 | 3 | 4 | 5;
  comment: string;
  createdAt: string;
  replies: ReviewReply[];
}

export interface LeadSignup {
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}
