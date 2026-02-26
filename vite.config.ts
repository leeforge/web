import type { ConfigEnv, PluginOption, UserConfig } from 'vite';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react-swc';
import envTyped from 'meta-env-typed/vite';
import UnoCSS from 'unocss/vite';
import { defineConfig, mergeConfig } from 'vite';
import devConfig from './.build/dev.config';
import VitePluginIconify from './.build/plugins/iconify-vite';
import prodConfig from './.build/prod.config';

// 手动定义 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const srcDir = resolve(__dirname, './src');

// https://vitejs.dev/config/
export default defineConfig((cnf: ConfigEnv) => {
  const { mode } = cnf;
  const baseConfig: UserConfig = {
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
        routesDirectory: join(srcDir, './pages'),
        quoteStyle: 'single',
      }),
      devtools({
        removeDevtoolsOnBuild: true,
      }),
      react(),
      UnoCSS(),
      VitePluginIconify({
        collections: ['line-md', 'material-symbols', 'vscode-icons'], // 需要支持的图标集
      }),
      envTyped({
        envPrefix: ['VITE_'],
        semi: true,
        envMode: mode,
      }) as PluginOption,
    ],
    resolve: {
      alias: [
        {
          find: '@',
          replacement: srcDir,
        },
      ],
    },
    worker: {
      format: 'es',
    },
    optimizeDeps: {
      include: [],
    },
  };

  if (mode === 'development') {
    return mergeConfig(baseConfig, devConfig(cnf));
  }

  return mergeConfig(baseConfig, prodConfig);
});
