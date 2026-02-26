import { describe, expect, it } from 'bun:test';
import {
  buildOuOrganizationsPath,
  requireDomainContextHeaders,
} from './organization.api';

describe('OU organization API contract', () => {
  it('uses /ou/organizations as base path', () => {
    expect(buildOuOrganizationsPath('/tree')).toBe('/ou/organizations/tree');
  });

  it('throws when domain context is missing', () => {
    expect(() => requireDomainContextHeaders(null)).toThrow('Missing domain context');
  });
});
