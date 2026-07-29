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
  petFriendly: boolean;
  delivery: boolean;
  tableService: boolean;
  paymentMethods: string[];
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
  features: RestaurantFeatures;
  gallery: string[];
  relatedRestaurantSlugs: string[];
}

export interface Review {
  restaurantSlug: string;
  name: string;
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
