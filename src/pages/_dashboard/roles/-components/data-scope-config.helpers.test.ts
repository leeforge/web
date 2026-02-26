import { describe, expect, it } from 'bun:test';
import { buildGlobalDataScopeUpdate } from './data-scope-config.helpers';

describe('global role data-scope helper', () => {
  it('builds role update payload with OU scope', () => {
    expect(buildGlobalDataScopeUpdate('OU_SUBTREE')).toEqual({
      defaultDataScope: 'OU_SUBTREE',
    });
  });
});
