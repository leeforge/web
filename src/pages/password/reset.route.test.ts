import { describe, expect, it } from 'bun:test';
import { Route } from './reset';

describe('password reset route', () => {
  it('normalizes reset token aliases in validateSearch', () => {
    const validateSearch = Route.options.validateSearch as (search: Record<string, unknown>) => { resetJwt: string };
    expect(validateSearch({ resetJwt: '  t-1  ' })).toEqual({ resetJwt: 't-1' });
    expect(validateSearch({ token: 't-2' })).toEqual({ resetJwt: 't-2' });
  });
});
