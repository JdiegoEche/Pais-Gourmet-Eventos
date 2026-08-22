import type { EventData, Restaurant, Review, ReviewReply } from '../types';
import type { CreateReviewInput, CreateReviewReplyInput, CreateLeadSignupInput } from './repositories/ports';

const useMock = !import.meta.env.SANITY_PROJECT_ID;

const MAX_WEEKLY_RECOMMENDED = 4;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function eventRepository() {
  if (useMock) {
    const { MockEventRepository } = await import('./repositories/mock/MockEventRepository');
    return new MockEventRepository();
  }
  const { SanityEventRepository } = await import('./repositories/sanity/SanityEventRepository');
  return new SanityEventRepository();
}

async function restaurantRepository() {
  if (useMock) {
    const { MockRestaurantRepository } = await import('./repositories/mock/MockRestaurantRepository');
    return new MockRestaurantRepository();
  }
  const { SanityRestaurantRepository } = await import('./repositories/sanity/SanityRestaurantRepository');
  return new SanityRestaurantRepository();
}

async function reviewRepository() {
  if (useMock) {
    const { MockReviewRepository } = await import('./repositories/mock/MockReviewRepository');
    return new MockReviewRepository();
  }
  const { SanityReviewRepository } = await import('./repositories/sanity/SanityReviewRepository');
  return new SanityReviewRepository();
}

async function leadSignupRepository() {
  if (useMock) {
    const { MockLeadSignupRepository } = await import('./repositories/mock/MockLeadSignupRepository');
    return new MockLeadSignupRepository();
  }
  const { SanityLeadSignupRepository } = await import('./repositories/sanity/SanityLeadSignupRepository');
  return new SanityLeadSignupRepository();
}

export async function getEvent(): Promise<EventData | null> {
  return (await eventRepository()).getEvent();
}

// Reciben el event ya resuelto en vez de volver a pedirlo: el home (único caller) ya lo tiene
// del getEvent() de su propio frontmatter — sin esto, cada una repetía el mismo fetch.
export async function getFeaturedRestaurants(event: EventData | null): Promise<Restaurant[]> {
  return (await restaurantRepository()).getFeatured(event?.featuredRestaurantSlugs ?? []);
}

export async function getHeroRecommendedRestaurants(event: EventData | null): Promise<Restaurant[]> {
  if (!event?.heroRecommendedEnabled) return [];
  return (await restaurantRepository()).getFeatured(event.heroRecommendedRestaurantSlugs ?? []);
}

export async function getAllRestaurants(): Promise<Restaurant[]> {
  return (await restaurantRepository()).getAll();
}

export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  return (await restaurantRepository()).getBySlug(slug);
}

// Recibe la lista de restaurantes en vez de volver a pedirla: quien llama (la página de
// restaurante) ya la tiene completa de getStaticPaths() — sin esto, cada una de las ~167
// páginas repetía un fetch completo de los 167 restaurantes solo para elegir 4 al azar.
export async function getWeeklyRecommendedRestaurants(
  allRestaurants: Restaurant[],
  excludeSlug: string
): Promise<Restaurant[]> {
  const event = await getEvent();
  if (!event?.weeklyRecommendedEnabled) return [];
  const candidates = allRestaurants.filter((restaurant) => restaurant.slug !== excludeSlug);
  return shuffle(candidates).slice(0, MAX_WEEKLY_RECOMMENDED);
}

export async function getReviews(restaurantSlug: string): Promise<Review[]> {
  return (await reviewRepository()).getByRestaurant(restaurantSlug);
}

export type { CreateReviewInput, CreateReviewReplyInput, CreateLeadSignupInput };

export async function createReview(input: CreateReviewInput): Promise<Review> {
  return (await reviewRepository()).create(input);
}

export async function addReviewReply(reviewId: string, input: CreateReviewReplyInput): Promise<ReviewReply> {
  return (await reviewRepository()).addReply(reviewId, input);
}

export async function createLeadSignup(input: CreateLeadSignupInput) {
  return (await leadSignupRepository()).create(input);
}
