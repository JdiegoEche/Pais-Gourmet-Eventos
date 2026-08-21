import type { EventRepository } from '../ports';
import type { EventData } from '../../../types';
import { sanity, eventSlug } from '../../sanity';

export class SanityEventRepository implements EventRepository {
  async getEvent(): Promise<EventData | null> {
    return sanity.fetch<EventData>(
      `*[_type == "event" && slug.current == $eventSlug][0]{
        "slug": slug.current,
        name,
        startDate,
        endDate,
        whatIncludes,
        "whatIncludesImage": whatIncludesImage.asset->url,
        "priceRanges": priceRanges[]{"range": range, "imageUrl": image.asset->url},
        zones,
        "zoneShowcase": zoneShowcase[]{name, "imageUrl": image.asset->url},
        "featuredRestaurantSlugs": featuredRestaurants[]->slug.current,
        heroRecommendedEnabled,
        "heroRecommendedRestaurantSlugs": heroRecommendedRestaurants[]->slug.current,
        "banners": banners[].asset->url,
        "sponsorLogos": sponsorLogos[]{name, "imageUrl": image.asset->url}
      }`,
      { eventSlug }
    );
  }
}
