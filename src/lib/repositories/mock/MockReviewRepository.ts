import type { ReviewRepository, CreateReviewInput, CreateReviewReplyInput } from '../ports';
import type { Review, ReviewReply } from '../../../types';
import { mockReviewsSeed, mockRestaurants } from '../../mock/data';

// Reviews creadas en runtime durante esta sesión de dev. Viven en memoria del módulo: se pierden si el dev server se reinicia.
// crypto.randomUUID() no puede correr en scope de módulo bajo el runtime de Cloudflare Workers
// (https://developers.cloudflare.com/workers/runtime-apis/handlers/), por eso la inicialización es perezosa.
let sessionReviews: Review[] | null = null;

function getSessionReviews(): Review[] {
  if (!sessionReviews) {
    sessionReviews = mockReviewsSeed.map((review) => ({
      ...review,
      id: crypto.randomUUID(),
      replies: [],
    }));
  }
  return sessionReviews;
}

export class MockReviewRepository implements ReviewRepository {
  async getByRestaurant(restaurantSlug: string): Promise<Review[]> {
    return getSessionReviews()
      .filter((r) => r.restaurantSlug === restaurantSlug)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(input: CreateReviewInput): Promise<Review> {
    // Misma resolución que SanityReviewRepository: el precio nunca se acepta del cliente,
    // se resuelve acá contra el menú vigente del restaurante mock. Ambos-o-ninguno: un
    // menuKey que no matchea ningún menú falla fuerte en vez de guardarse a medias.
    let menuPriceSnapshot: number | undefined;
    let resolvedMenuKey = input.menuKey;
    const restaurant = mockRestaurants.find((r) => r.slug === input.restaurantSlug);
    if (input.menuKey !== undefined) {
      const matchedMenu = restaurant?.menus.find((m) => m._key === input.menuKey);
      if (!matchedMenu) {
        throw new Error(
          `El menú "${input.menuKey}" no existe en el restaurante "${input.restaurantSlug}"`
        );
      }
      menuPriceSnapshot = matchedMenu.currentPrice;
    } else if (restaurant?.menus.length === 1) {
      // ReviewForm.astro oculta el <select> cuando el restaurante tiene un solo menú (no hay
      // nada que elegir), así que el visitante nunca manda menuKey en ese caso. Eso no es lo
      // mismo que "sin menú": hay exactamente un valor/precio posible, así que se atribuye acá
      // como si lo hubiera elegido, para que la reseña siga contando en el desglose por menú
      // del ranking en vez de caer solo en el acumulado general "Todos los menús".
      const onlyMenu = restaurant.menus[0];
      resolvedMenuKey = onlyMenu._key;
      menuPriceSnapshot = onlyMenu.currentPrice;
    }
    const review: Review = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      replies: [],
      menuKey: resolvedMenuKey,
      menuPriceSnapshot,
    };
    getSessionReviews().push(review);
    return review;
  }

  async addReply(reviewId: string, input: CreateReviewReplyInput): Promise<ReviewReply> {
    const review = getSessionReviews().find((r) => r.id === reviewId);
    if (!review) {
      throw new Error(`No existe la reseña con id "${reviewId}"`);
    }
    const reply: ReviewReply = { ...input, createdAt: new Date().toISOString() };
    review.replies.push(reply);
    return reply;
  }
}
