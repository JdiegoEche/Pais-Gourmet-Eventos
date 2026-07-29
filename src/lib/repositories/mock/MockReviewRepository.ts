import type { ReviewRepository, CreateReviewInput, CreateReviewReplyInput } from '../ports';
import type { Review, ReviewReply } from '../../../types';
import { mockReviewsSeed } from '../../mock/data';

// Reviews creadas en runtime durante esta sesión de dev. Viven en memoria del módulo: se pierden si el dev server se reinicia.
const sessionReviews: Review[] = mockReviewsSeed.map((review) => ({
  ...review,
  id: crypto.randomUUID(),
  replies: [],
}));

export class MockReviewRepository implements ReviewRepository {
  async getByRestaurant(restaurantSlug: string): Promise<Review[]> {
    return sessionReviews
      .filter((r) => r.restaurantSlug === restaurantSlug)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(input: CreateReviewInput): Promise<Review> {
    const review: Review = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString(), replies: [] };
    sessionReviews.push(review);
    return review;
  }

  async addReply(reviewId: string, input: CreateReviewReplyInput): Promise<ReviewReply> {
    const review = sessionReviews.find((r) => r.id === reviewId);
    if (!review) {
      throw new Error(`No existe la reseña con id "${reviewId}"`);
    }
    const reply: ReviewReply = { ...input, createdAt: new Date().toISOString() };
    review.replies.push(reply);
    return reply;
  }
}
