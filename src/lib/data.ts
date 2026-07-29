import type { EventData, Restaurant, Review } from '../types';
import type { CreateReviewInput, CreateLeadSignupInput } from './repositories/ports';

const useMock = !import.meta.env.SANITY_PROJECT_ID;

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

export async function getFeaturedRestaurants(): Promise<Restaurant[]> {
  const event = await getEvent();
  return (await restaurantRepository()).getFeatured(event?.featuredRestaurantSlugs ?? []);
}

export async function getAllRestaurants(): Promise<Restaurant[]> {
  return (await restaurantRepository()).getAll();
}

export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  return (await restaurantRepository()).getBySlug(slug);
}

export async function getReviews(restaurantSlug: string): Promise<Review[]> {
  return (await reviewRepository()).getByRestaurant(restaurantSlug);
}

export type { CreateReviewInput, CreateLeadSignupInput };

export async function createReview(input: CreateReviewInput): Promise<Review> {
  return (await reviewRepository()).create(input);
}

export async function createLeadSignup(input: CreateLeadSignupInput) {
  return (await leadSignupRepository()).create(input);
}
