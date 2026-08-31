import type { ReviewRepository, CreateReviewInput, CreateReviewReplyInput } from '../ports';
import type { Review, ReviewReply } from '../../../types';
import { sanity, getSanityWriteClient, getLeadsWriteClient } from '../../sanity';

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
    // La reseña pública va a `production` SIN datos de contacto.
    const created = await client.create({
      _type: 'review',
      restaurant: { _type: 'reference', _ref: restaurantId },
      name: input.name,
      rating: input.rating,
      foodRating: input.foodRating,
      serviceRating: input.serviceRating,
      ambianceRating: input.ambianceRating,
      comment: input.comment,
      createdAt,
      replies: [],
    });

    // El contacto va a un doc aparte en el dataset privado `leads`. Si esta escritura falla,
    // la reseña pública ya se publicó (la acción visible del visitante tuvo éxito): se
    // registra el error y se sigue — perder un lead de forma esporádica es preferible a
    // devolverle un error al visitante o dejar la reseña sin publicar.
    try {
      await getLeadsWriteClient().create({
        _type: 'reviewContact',
        reviewId: created._id,
        restaurantSlug: input.restaurantSlug,
        name: input.name,
        phone: input.phone ?? '',
        email: input.email ?? '',
        createdAt,
        replies: [],
      });
    } catch (error) {
      console.error(`No se pudo guardar el contacto de la reseña ${created._id} en "leads":`, error);
    }

    const { phone: _phone, email: _email, ...publicInput } = input;
    return { ...publicInput, id: created._id, createdAt, replies: [] };
  }

  async addReply(reviewId: string, input: CreateReviewReplyInput): Promise<ReviewReply> {
    const createdAt = new Date().toISOString();
    const key = crypto.randomUUID();

    // Parte pública -> production, sin datos de contacto.
    await getSanityWriteClient()
      .patch(reviewId)
      .setIfMissing({ replies: [] })
      .append('replies', [
        { _type: 'reviewReply', _key: key, name: input.name, message: input.message, createdAt },
      ])
      .commit();

    // Contacto de la respuesta -> reviewContact en `leads`, correlacionado por el mismo _key.
    // Si falla, se registra y se sigue (la respuesta pública ya se publicó).
    try {
      const leads = getLeadsWriteClient();
      const replyContact = {
        _key: key,
        name: input.name,
        phone: input.phone ?? '',
        email: input.email ?? '',
        createdAt,
      };
      const contactId = await leads.fetch<string | null>(
        `*[_type == "reviewContact" && reviewId == $reviewId][0]._id`,
        { reviewId }
      );
      if (contactId) {
        await leads
          .patch(contactId)
          .setIfMissing({ replies: [] })
          .append('replies', [replyContact])
          .commit();
      } else {
        // Reseña previa a la migración (o cuyo reviewContact no llegó a crearse): lo creamos
        // ahora con lo que se puede recuperar de la reseña pública.
        const meta = await sanity.fetch<{ restaurantSlug: string | null; createdAt: string } | null>(
          `*[_type == "review" && _id == $reviewId][0]{ "restaurantSlug": restaurant->slug.current, createdAt }`,
          { reviewId }
        );
        await leads.create({
          _type: 'reviewContact',
          reviewId,
          restaurantSlug: meta?.restaurantSlug ?? '',
          name: '',
          phone: '',
          email: '',
          createdAt: meta?.createdAt ?? createdAt,
          replies: [replyContact],
        });
      }
    } catch (error) {
      console.error(
        `No se pudo guardar el contacto de la respuesta a la reseña ${reviewId} en "leads":`,
        error
      );
    }

    return { name: input.name, message: input.message, createdAt };
  }
}
