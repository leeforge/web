import { TanStackDevtools } from '@tanstack/react-devtools';
import { FormDevtoolsPanel } from '@tanstack/react-form-devtools';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { theme as antdTheme, App, ConfigProvider } from 'antd';
import { StrictMode, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useThemeColor } from '@/hooks';
import { Empty } from './components';
import { routeTree } from './routeTree.gen';
import AntdContextSetter from './utils/modules/use-msg-modal-in-ts-file';
import 'virtual:uno.css';
import './styles/index.css';

const router = createRouter({ routeTree });

const queryClient = new QueryClient();

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
function ThemeSynchronizer() {
  const { antdThemeConfig, themeConfig } = useThemeColor();
  const { isDarkMode } = themeConfig;

  // 使用 useLayoutEffect 确保在浏览器绘制前同步设置主题
  // 避免页面闪烁和刷新后主题丢失
  useLayoutEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [isDarkMode]);

  return (
    <ConfigProvider
      theme={{
        ...antdThemeConfig,
        algorithm: isDarkMode
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
      }}
    >
      <App>
        <ConfigProvider renderEmpty={(componentName) => {
          if (componentName === 'Table') {
            return (
              <Empty />
            );
          }
          return <Empty />;
        }}
        >
          {/* 这里注册，才能使ts代码获取到 useApp 的 context */}
          <AntdContextSetter />
          <QueryClientProvider client={queryClient}>
            <TanStackDevtools
              plugins={[
                {
                  name: 'TanStack Query',
                  render: <ReactQueryDevtoolsPanel />,
                  defaultOpen: true,
                },
                {
                  name: 'Tanstack Router',
                  render: <TanStackRouterDevtoolsPanel router={router} />,
                },
                {
                  name: 'Tanstack Form',
                  render: <FormDevtoolsPanel />,
                },
              ]}
            />
            <RouterProvider router={router} />
          </QueryClientProvider>
        </ConfigProvider>
      </App>
    </ConfigProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeSynchronizer />
  </StrictMode>,
);
