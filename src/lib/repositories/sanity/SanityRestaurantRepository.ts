import type { RestaurantRepository } from '../ports';
import type { Restaurant } from '../../../types';
import { sanity, eventSlug } from '../../sanity';

const restaurantProjection = `{
  "slug": slug.current,
  "eventSlug": event->slug.current,
  name,
  "logo": logo.asset->url,
  cuisineTypes,
  zone,
  deliveryZones,
  address,
  phone,
  whatsapp,
  instagram,
  hours,
  menus,
  "menuHighlights": menuHighlights[]{ "icon": icon.asset->url, label },
  youtubeVideoUrl,
  vegetarianOption,
  features,
  "gallery": gallery[].asset->url
}`;

export class SanityRestaurantRepository implements RestaurantRepository {
  async getAll(): Promise<Restaurant[]> {
    return sanity.fetch<Restaurant[]>(
      `*[_type == "restaurant" && event->slug.current == $eventSlug]${restaurantProjection}`,
      { eventSlug }
    );
  }

  async getBySlug(slug: string): Promise<Restaurant | null> {
    return sanity.fetch<Restaurant | null>(
      `*[_type == "restaurant" && event->slug.current == $eventSlug && slug.current == $slug][0]${restaurantProjection}`,
      { eventSlug, slug }
    );
  }

  async getFeatured(featuredSlugs: string[]): Promise<Restaurant[]> {
    return sanity.fetch<Restaurant[]>(
      `*[_type == "restaurant" && event->slug.current == $eventSlug && slug.current in $featuredSlugs]${restaurantProjection}`,
      { eventSlug, featuredSlugs }
    );
  }
}
