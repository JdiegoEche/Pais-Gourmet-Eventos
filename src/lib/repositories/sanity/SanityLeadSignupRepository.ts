import type { LeadSignupRepository, CreateLeadSignupInput } from '../ports';
import type { LeadSignup } from '../../../types';
import { getLeadsWriteClient } from '../../sanity';

export class SanityLeadSignupRepository implements LeadSignupRepository {
  async create(input: CreateLeadSignupInput): Promise<LeadSignup> {
    const signup: LeadSignup = { ...input, createdAt: new Date().toISOString() };
    // Va al dataset privado `leads`: son datos personales que no se muestran en el sitio.
    await getLeadsWriteClient().create({ _type: 'leadSignup', ...signup });
    return signup;
  }
}
