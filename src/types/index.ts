export interface EventData {
  slug: string;
  name: string;
  startDate: string;
  endDate: string;
  whatIncludes: string;
  whatIncludesImage: string;
  priceRanges: string[];
  zones: string[];
  zoneShowcase: ZoneShowcaseItem[];
  featuredRestaurantSlugs: string[];
  weeklyRecommendedEnabled: boolean;
  weeklyRecommendedRestaurantSlugs: string[];
  banners: string[];
  sponsorLogos: { name: string; imageUrl: string }[];
}

export interface ZoneShowcaseItem {
  name: string;
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

export interface WeeklyHours {
  day: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
  opens: string;
  closes: string;
}

export interface Restaurant {
  slug: string;
  eventSlug: string;
  name: string;
  logo?: string;
  cuisineTypes: string[];
  zone: string;
  address: string;
  phone: string;
  whatsapp?: string;
  instagram?: string;
  hours: WeeklyHours[];
  menus: Menu[];
  menuHighlights: MenuHighlight[];
  youtubeVideoUrl?: string;
  vegetarianOption: boolean;
  features: RestaurantFeatures;
  gallery: string[];
  relatedRestaurantSlugs: string[];
}

export interface Review {
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
}

export interface LeadSignup {
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}
