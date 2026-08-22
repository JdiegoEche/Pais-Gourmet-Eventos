import type { EventData, Restaurant, Review, ReviewReply, LeadSignup } from '../../types';

export interface EventRepository {
  getEvent(): Promise<EventData | null>;
}

export interface RestaurantRepository {
  getAll(): Promise<Restaurant[]>;
  getBySlug(slug: string): Promise<Restaurant | null>;
  getFeatured(featuredSlugs: string[]): Promise<Restaurant[]>;
}

export type CreateReviewInput = Omit<Review, 'id' | 'createdAt' | 'replies'>;
export type CreateReviewReplyInput = Omit<ReviewReply, 'createdAt'>;

export interface ReviewRepository {
  // fresh: true salta cualquier caché (ej. CDN) para ver una escritura recién hecha; sin él,
  // el caller acepta la lectura más barata/cacheada disponible.
  getByRestaurant(restaurantSlug: string, options?: { fresh?: boolean }): Promise<Review[]>;
  create(input: CreateReviewInput): Promise<Review>;
  addReply(reviewId: string, input: CreateReviewReplyInput): Promise<ReviewReply>;
}

export type CreateLeadSignupInput = Omit<LeadSignup, 'createdAt'>;

export interface LeadSignupRepository {
  create(input: CreateLeadSignupInput): Promise<LeadSignup>;
}
