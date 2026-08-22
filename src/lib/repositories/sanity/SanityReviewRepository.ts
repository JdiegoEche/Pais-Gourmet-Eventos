import type { ReviewRepository, CreateReviewInput, CreateReviewReplyInput } from '../ports';
import type { Review, ReviewReply } from '../../../types';
import { getSanityWriteClient } from '../../sanity';

export class SanityReviewRepository implements ReviewRepository {
  async getByRestaurant(restaurantSlug: string): Promise<Review[]> {
    // useCdn: false a propósito (mismo cliente que las escrituras, no el "sanity" cacheado en
    // CDN): justo después de publicar una reseña, ReviewList.astro vuelve a pedir esta lista
    // de inmediato — con el cliente de CDN esa lectura llegaba antes de que la escritura se
    // propagara (hasta ~60s), así que la reseña recién creada no aparecía hasta el próximo
    // refresh (ej. al publicar una segunda).
    return getSanityWriteClient().fetch<Review[]>(
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
        "replies": coalesce(replies[]{ name, message, createdAt }, [])
      }`,
      { slug: restaurantSlug }
    );
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
