import type { ReviewRepository, CreateReviewInput, CreateReviewReplyInput } from '../ports';
import type { Review, ReviewReply } from '../../../types';
import { sanity, getSanityWriteClient } from '../../sanity';

export class SanityReviewRepository implements ReviewRepository {
  async getByRestaurant(restaurantSlug: string): Promise<Review[]> {
    return sanity.fetch<Review[]>(
      `*[_type == "review" && restaurant->slug.current == $slug] | order(createdAt desc){
        "id": _id,
        "restaurantSlug": restaurant->slug.current,
        name,
        rating,
        foodRating,
        serviceRating,
        ambianceRating,
        comment,
        createdAt,
        "replies": replies[]{ name, message, createdAt }
      }`,
      { slug: restaurantSlug }
    );
  }

  async create(input: CreateReviewInput): Promise<Review> {
    const createdAt = new Date().toISOString();
    const client = getSanityWriteClient();
    const restaurantId = await client.fetch<string | null>(
      `*[_type == "restaurant" && slug.current == $slug][0]._id`,
      { slug: input.restaurantSlug }
    );
    if (!restaurantId) {
      throw new Error(`No existe el restaurante con slug "${input.restaurantSlug}"`);
    }
    const created = await client.create({
      _type: 'review',
      restaurant: { _type: 'reference', _ref: restaurantId },
      name: input.name,
      phone: input.phone,
      email: input.email,
      rating: input.rating,
      foodRating: input.foodRating,
      serviceRating: input.serviceRating,
      ambianceRating: input.ambianceRating,
      comment: input.comment,
      createdAt,
    });
    return { ...input, id: created._id, createdAt, replies: [] };
  }

  async addReply(reviewId: string, input: CreateReviewReplyInput): Promise<ReviewReply> {
    const reply: ReviewReply = { ...input, createdAt: new Date().toISOString() };
    const client = getSanityWriteClient();
    await client
      .patch(reviewId)
      .setIfMissing({ replies: [] })
      .append('replies', [{ _type: 'reviewReply', _key: crypto.randomUUID(), ...reply }])
      .commit();
    return reply;
  }
}
