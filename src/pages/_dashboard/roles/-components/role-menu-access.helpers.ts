import type { Menu } from '@/api/endpoints/menu.api';

type RoleLike = {
  menuIds?: string[];
  edges?: { menus?: Array<{ id?: string | null } | null> };
};

export function extractRoleMenuIds(role?: RoleLike | null): string[] {
  const ids = [
    ...(role?.menuIds || []),
    ...((role?.edges?.menus || []).map(item => item?.id).filter(Boolean) as string[]),
  ];
  return [...new Set(ids)];
}

export function toMenuTreeData(menus: Menu[]) {
  return menus.map(menu => ({
    key: menu.id,
    value: menu.id,
    title: `${menu.name} (${menu.path})`,
    children: menu.children?.length ? toMenuTreeData(menu.children) : undefined,
  }));
}
