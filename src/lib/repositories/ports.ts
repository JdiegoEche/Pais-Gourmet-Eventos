import type { EventData, Restaurant, Review } from '../../types';

export interface EventRepository {
  getEvent(): Promise<EventData | null>;
}

export interface RestaurantRepository {
  getAll(): Promise<Restaurant[]>;
  getBySlug(slug: string): Promise<Restaurant | null>;
  getFeatured(featuredSlugs: string[]): Promise<Restaurant[]>;
}

export type CreateReviewInput = Omit<Review, 'createdAt'>;

export interface ReviewRepository {
  getByRestaurant(restaurantSlug: string): Promise<Review[]>;
  create(input: CreateReviewInput): Promise<Review>;
}
