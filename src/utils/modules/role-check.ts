/**
 * 判断用户是否为平台管理员（super_admin 或 platform_admin）
 *
 * 需要兼容两种 API 返回格式：
 * - Login（/auth/login）返回 roles: string[]（角色 code 字符串数组）
 * - Profile（/profile）返回 roles: RoleDTO[]（对象数组，无 code 字段）+ isSuperAdmin: boolean
 */
export function checkPlatformAdmin(
  user: { isSuperAdmin?: boolean; roles?: Array<unknown> } | null | undefined,
): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  return Boolean(
    user.roles?.some((role) => {
      const code = typeof role === 'string'
        ? role
        : (role as Record<string, unknown>)?.code;
      return code === 'super_admin' || code === 'platform_admin';
    }),
  );
}

/**
 * 判断用户是否为超级管理员（仅 super_admin）
 */
export function checkSuperAdmin(
  user: { isSuperAdmin?: boolean; roles?: Array<unknown> } | null | undefined,
): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  return Boolean(
    user.roles?.some((role) => {
      const code = typeof role === 'string'
        ? role
        : (role as Record<string, unknown>)?.code;
      return code === 'super_admin';
    }),
  );
}
