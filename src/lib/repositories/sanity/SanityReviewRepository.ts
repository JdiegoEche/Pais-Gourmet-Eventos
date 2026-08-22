import type { ReviewRepository, CreateReviewInput, CreateReviewReplyInput } from '../ports';
import type { Review, ReviewReply } from '../../../types';
import { sanity, getSanityWriteClient } from '../../sanity';

const REVIEWS_QUERY = `*[_type == "review" && restaurant->slug.current == $slug] | order(createdAt desc){
  "id": _id,
  "restaurantSlug": restaurant->slug.current,
  name,
  rating,
  foodRating,
  serviceRating,
  ambianceRating,
  comment,
  createdAt,
  "replies": coalesce(replies[]{ name, message, createdAt }, [])
}`;

export class SanityReviewRepository implements ReviewRepository {
  // Por defecto usa el cliente cacheado por CDN — lo que quiere el build estático (167
  // páginas de restaurante, no hace falta que estén al segundo). Solo cuando el caller
  // necesita ver su propia escritura reciente (ReviewList.astro, justo después de publicar
  // una reseña) pide `fresh: true`, que salta el CDN.
  async getByRestaurant(restaurantSlug: string, options?: { fresh?: boolean }): Promise<Review[]> {
    const client = options?.fresh ? getSanityWriteClient() : sanity;
    return client.fetch<Review[]>(REVIEWS_QUERY, { slug: restaurantSlug });
  }

  async create(input: CreateReviewInput): Promise<Review> {
    const createdAt = new Date().toISOString();
    const client = getSanityWriteClient();
    // Excluye borradores explícitamente: si un restaurante tiene una edición sin publicar,
    // "slug.current == $slug" matchea tanto el draft como el publicado, y sin este filtro el
    // orden no está garantizado — puede terminar guardando una referencia a "drafts.xxx", que
    // el resto del sitio (perspectiva "published") nunca puede resolver.
    const restaurantId = await client.fetch<string | null>(
      `*[_type == "restaurant" && slug.current == $slug && !(_id in path("drafts.**"))][0]._id`,
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
      replies: [],
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
