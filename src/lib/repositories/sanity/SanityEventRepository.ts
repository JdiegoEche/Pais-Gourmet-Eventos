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
        priceRanges,
        zones,
        "featuredRestaurantSlugs": featuredRestaurants[]->slug.current,
        "sponsorLogos": sponsorLogos[]{name, "imageUrl": image.asset->url}
      }`,
      { eventSlug }
    );
  }
}
