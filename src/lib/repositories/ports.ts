import type { EventData, Restaurant, Review, ReviewReply, LeadSignup } from '../../types';

export interface EventRepository {
  getEvent(): Promise<EventData | null>;
}

export interface RestaurantRepository {
  getAll(): Promise<Restaurant[]>;
  getBySlug(slug: string): Promise<Restaurant | null>;
  getFeatured(featuredSlugs: string[]): Promise<Restaurant[]>;
}

// menuPriceSnapshot queda fuera del input: es un precio forjable si viene del cliente/API.
// El repositorio lo resuelve él mismo contra el restaurante en vivo (ver SanityReviewRepository
// y MockReviewRepository) a partir del menuKey, así el precio siempre es el que el restaurante
// tenía publicado en el momento de la reseña, no lo que el request diga.
export type CreateReviewInput = Omit<Review, 'id' | 'createdAt' | 'replies' | 'menuPriceSnapshot'>;
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
