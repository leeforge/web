import type { CreateRoleParams, UpdateRoleParams } from '@/api/endpoints/role.api';

export function buildCreateRolePayload(input: Partial<CreateRoleParams>): CreateRoleParams {
  return {
    name: input.name || '',
    code: input.code || '',
    description: input.description || '',
    sort: input.sort ?? 0,
    defaultDataScope: input.defaultDataScope || 'SELF',
  };
}

export function buildUpdateRolePayload(input: Partial<UpdateRoleParams>): UpdateRoleParams {
  return {
    name: input.name,
    description: input.description,
    sort: input.sort,
    defaultDataScope: input.defaultDataScope,
  };
}
