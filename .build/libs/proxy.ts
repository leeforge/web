import type { ProxyOptions } from 'vite';

export type ProxyItem = [string, string];

export function createProxy(proxies: ProxyItem[]): Record<string, ProxyOptions> {
  if (!proxies)
    return {};
  const res: Record<string, ProxyOptions> = {};
  const httpsREG = /^https:\/\//;
  for (const [p, t] of proxies) {
    const isHttps = httpsREG.test(t);
    res[p] = {
      target: t,
      changeOrigin: true,
      ws: true,
      rewrite: path => path.replace(new RegExp(`^${p}`), ''),
      ...(isHttps ? { secure: false } : {}),
    };
  }
  return res;
}
