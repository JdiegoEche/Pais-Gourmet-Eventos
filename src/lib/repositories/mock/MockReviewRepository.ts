import type { ReviewRepository, CreateReviewInput } from '../ports';
import type { Review } from '../../../types';
import { mockReviewsSeed } from '../../mock/data';

// Reviews creadas en runtime durante esta sesión de dev. Viven en memoria del módulo: se pierden si el dev server se reinicia.
const sessionReviews: Review[] = [...mockReviewsSeed];

export class MockReviewRepository implements ReviewRepository {
  async getByRestaurant(restaurantSlug: string): Promise<Review[]> {
    return sessionReviews
      .filter((r) => r.restaurantSlug === restaurantSlug)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(input: CreateReviewInput): Promise<Review> {
    const review: Review = { ...input, createdAt: new Date().toISOString() };
    sessionReviews.push(review);
    return review;
  }
}
