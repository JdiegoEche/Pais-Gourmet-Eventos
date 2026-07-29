import type { LeadSignupRepository, CreateLeadSignupInput } from '../ports';
import type { LeadSignup } from '../../../types';
import { getSanityWriteClient } from '../../sanity';

export class SanityLeadSignupRepository implements LeadSignupRepository {
  async create(input: CreateLeadSignupInput): Promise<LeadSignup> {
    const signup: LeadSignup = { ...input, createdAt: new Date().toISOString() };
    await getSanityWriteClient().create({ _type: 'leadSignup', ...signup });
    return signup;
  }
}
