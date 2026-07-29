import type { EventRepository } from '../ports';
import type { EventData } from '../../../types';
import { mockEvent } from '../../mock/data';

export class MockEventRepository implements EventRepository {
  async getEvent(): Promise<EventData | null> {
    return mockEvent;
  }
}
