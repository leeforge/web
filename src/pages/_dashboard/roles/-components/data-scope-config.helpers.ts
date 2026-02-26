import type { DefaultDataScope, UpdateRoleParams } from '@/api/endpoints/role.api';

export const GLOBAL_DATA_SCOPE_OPTIONS: Array<{ label: string; value: DefaultDataScope }> = [
  { label: '全部数据 (ALL)', value: 'ALL' },
  { label: '仅本人数据 (SELF)', value: 'SELF' },
  { label: '本组织数据 (OU_SELF)', value: 'OU_SELF' },
  { label: '本组织及子组织 (OU_SUBTREE)', value: 'OU_SUBTREE' },
];

export function buildGlobalDataScopeUpdate(defaultDataScope: DefaultDataScope): UpdateRoleParams {
  return {
    defaultDataScope,
  };
}
