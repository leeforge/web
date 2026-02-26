export const AUTH_WHITELIST = [
  '/login',
  '/register',
  '/invitation/activate',
  '/invite/activate',
  '/password/reset',
  '/init',
] as const;

export function isAuthWhitelistedPath(pathname: string): boolean {
  return AUTH_WHITELIST.includes(pathname as (typeof AUTH_WHITELIST)[number]);
}
