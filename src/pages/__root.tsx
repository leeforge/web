import { SchemaFormProvider } from '@leeforge/react-ui';
import { createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import { Fragment } from 'react/jsx-runtime';
import { CaptchaWidget, PermissionSelectWidget } from '@/components';
import { RouterProgress } from '@/components/Progress/RouterProgress';
import { isAuthWhitelistedPath } from '@/config/auth-whitelist';
import { AuthStore, InitStore } from '@/stores';

const INIT_WHITELIST = ['/init'];
const INIT_PATH = '/init';

export const Route = createRootRoute({
  component: RootComponent,
  beforeLoad: async (ctx) => {
    // 开发模式下跳过后端检查
    if (import.meta.env.VITE_FRONTEND_HEADLESS)
      return;

    const { pathname } = ctx.location;

    // 初始化检查白名单

    // 检查系统是否初始化
    const { ok } = await InitStore.getState().check();
    if (!ok) {
      if (INIT_WHITELIST.includes(pathname)) {
        return;
      }
      // 未初始化，跳转初始化页面
      return redirect({ to: '/init' });
    }
    else if (pathname === INIT_PATH) {
      return redirect({ to: '/' });
    }

    // 已初始化，检查登录状态
    if (!isAuthWhitelistedPath(pathname)) {
      const { ok } = await AuthStore.getState().check();
      if (!ok) {
        return redirect({ to: '/login' });
      }
    }
  },
});

function RootComponent() {
  return (
    <Fragment>
      <SchemaFormProvider config={{
        widgets: {
          captcha: CaptchaWidget,
          permission: PermissionSelectWidget,
        },
      }}
      >
        <RouterProgress />
        <Outlet />
      </SchemaFormProvider>
    </Fragment>
  );
}
