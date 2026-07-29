import type { EventData, Restaurant, Review } from '../types';
import { mockEvent, mockRestaurants, mockReviewsSeed } from './mock/data';

const useMock = !import.meta.env.SANITY_PROJECT_ID;

// Reviews creadas en runtime durante esta sesión de dev (modo mock).
// Viven en memoria del módulo: se pierden si el dev server se reinicia.
const sessionReviews: Review[] = [...mockReviewsSeed];

const restaurantProjection = `{
  "slug": slug.current,
  "eventSlug": event->slug.current,
  name,
  cuisineTypes,
  zone,
  address,
  phone,
  whatsapp,
  instagram,
  hours,
  menus,
  features,
  "gallery": gallery[].asset->url,
  "relatedRestaurantSlugs": relatedRestaurants[]->slug.current
}`;

export async function getEvent(): Promise<EventData | null> {
  if (useMock) return mockEvent;
  const { sanity, eventSlug } = await import('./sanity');
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

export async function getFeaturedRestaurants(): Promise<Restaurant[]> {
  const event = await getEvent();
  if (useMock) {
    return mockRestaurants.filter((r) => event?.featuredRestaurantSlugs.includes(r.slug));
  }
  const { sanity, eventSlug } = await import('./sanity');
  return sanity.fetch<Restaurant[]>(
    `*[_type == "restaurant" && event->slug.current == $eventSlug && slug.current in $featuredSlugs]${restaurantProjection}`,
    { eventSlug, featuredSlugs: event?.featuredRestaurantSlugs ?? [] }
  );
}

export async function getAllRestaurants(): Promise<Restaurant[]> {
  if (useMock) return mockRestaurants;
  const { sanity, eventSlug } = await import('./sanity');
  return sanity.fetch<Restaurant[]>(
    `*[_type == "restaurant" && event->slug.current == $eventSlug]${restaurantProjection}`,
    { eventSlug }
  );
}

export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  if (useMock) return mockRestaurants.find((r) => r.slug === slug) ?? null;
  const { sanity, eventSlug } = await import('./sanity');
  return sanity.fetch<Restaurant | null>(
    `*[_type == "restaurant" && event->slug.current == $eventSlug && slug.current == $slug][0]${restaurantProjection}`,
    { eventSlug, slug }
  );
}

export async function getReviews(restaurantSlug: string): Promise<Review[]> {
  if (useMock) {
    return sessionReviews
      .filter((r) => r.restaurantSlug === restaurantSlug)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const { sanity } = await import('./sanity');
  return sanity.fetch<Review[]>(
    `*[_type == "review" && restaurant->slug.current == $slug] | order(createdAt desc){
      "restaurantSlug": restaurant->slug.current,
      name,
      rating,
      comment,
      createdAt
    }`,
    { slug: restaurantSlug }
  );
}

export type CreateReviewInput = Omit<Review, 'createdAt'>;

export async function createReview(input: CreateReviewInput): Promise<Review> {
  const review: Review = { ...input, createdAt: new Date().toISOString() };
  if (useMock) {
    sessionReviews.push(review);
    return review;
  }
  const { getSanityWriteClient } = await import('./sanity');
  const client = getSanityWriteClient();
  const restaurantId = await client.fetch<string | null>(
    `*[_type == "restaurant" && slug.current == $slug][0]._id`,
    { slug: input.restaurantSlug }
  );
  if (!restaurantId) {
    throw new Error(`No existe el restaurante con slug "${input.restaurantSlug}"`);
  }
  await client.create({
    _type: 'review',
    restaurant: { _type: 'reference', _ref: restaurantId },
    name: review.name,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  });
  return review;
}
