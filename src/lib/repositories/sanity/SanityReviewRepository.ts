import type { ReviewRepository, CreateReviewInput } from '../ports';
import type { Review } from '../../../types';
import { sanity, getSanityWriteClient } from '../../sanity';

export class SanityReviewRepository implements ReviewRepository {
  async getByRestaurant(restaurantSlug: string): Promise<Review[]> {
    return sanity.fetch<Review[]>(
      `*[_type == "review" && restaurant->slug.current == $slug] | order(createdAt desc){
        "restaurantSlug": restaurant->slug.current,
        name,
        rating,
        foodRating,
        serviceRating,
        ambianceRating,
        comment,
        createdAt
      }`,
      { slug: restaurantSlug }
    );
  }

  async create(input: CreateReviewInput): Promise<Review> {
    const review: Review = { ...input, createdAt: new Date().toISOString() };
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
      foodRating: review.foodRating,
      serviceRating: review.serviceRating,
      ambianceRating: review.ambianceRating,
      comment: review.comment,
      createdAt: review.createdAt,
    });
    return review;
  }
}
