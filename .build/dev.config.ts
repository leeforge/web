import type { ConfigEnv, UserConfig } from 'vite';
import type { ProxyItem } from './libs/proxy';
import { loadEnv } from 'vite';
import { parseEnvConfig } from './libs/env';
import { createProxy } from './libs/proxy';

export default ({ mode }: ConfigEnv) => {
  // eslint-disable-next-line node/prefer-global/process
  const env = loadEnv(mode, process.cwd());
  const config = parseEnvConfig(env);
  return {
    server: {
      open: false,
      host: '0.0.0.0',
      port: 6868,
      fs: {
        strict: true,
      },
      proxy: createProxy(config.VITE_PROXY as unknown as ProxyItem[] || []),
    },
  } satisfies UserConfig;
};
