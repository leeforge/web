export type RoleRowActionKey =
  | 'edit'
  | 'access-config'
  | 'copy'
  | 'delete'
  | 'blocked';

export function getRoleRowActionKeys(roleCode: string): RoleRowActionKey[] {
  if (roleCode === 'super_admin') {
    return ['blocked'];
  }

  return ['edit', 'access-config', 'copy', 'delete'];
}
