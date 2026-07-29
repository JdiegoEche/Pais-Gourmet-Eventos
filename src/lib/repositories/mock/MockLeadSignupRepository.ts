import type { LeadSignupRepository, CreateLeadSignupInput } from '../ports';
import type { LeadSignup } from '../../../types';

const sessionSignups: LeadSignup[] = [];

export class MockLeadSignupRepository implements LeadSignupRepository {
  async create(input: CreateLeadSignupInput): Promise<LeadSignup> {
    const signup: LeadSignup = { ...input, createdAt: new Date().toISOString() };
    sessionSignups.push(signup);
    return signup;
  }
}
