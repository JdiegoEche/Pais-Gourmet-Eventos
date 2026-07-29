import type { RestaurantRepository } from '../ports';
import type { Restaurant } from '../../../types';
import { mockRestaurants } from '../../mock/data';

export class MockRestaurantRepository implements RestaurantRepository {
  async getAll(): Promise<Restaurant[]> {
    return mockRestaurants;
  }

  async getBySlug(slug: string): Promise<Restaurant | null> {
    return mockRestaurants.find((r) => r.slug === slug) ?? null;
  }

  async getFeatured(featuredSlugs: string[]): Promise<Restaurant[]> {
    return mockRestaurants.filter((r) => featuredSlugs.includes(r.slug));
  }
}
