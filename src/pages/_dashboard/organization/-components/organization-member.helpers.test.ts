import { describe, expect, it } from 'bun:test';
import { buildAddMemberPayload } from './organization-member.helpers';

describe('organization member payload', () => {
  it('trims userId and keeps isPrimary flag', () => {
    expect(buildAddMemberPayload('  user-1  ', true)).toEqual({
      userId: 'user-1',
      isPrimary: true,
    });
  });
});
