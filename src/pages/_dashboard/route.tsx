import type { MenuProps } from 'antd';
import type { StartImpersonationFormRef } from './platform/impersonation/-components/StartImpersonationForm';
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { App, Avatar, Button, Dropdown, Layout, Space } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import {
  ImpersonationBanner,
  ImpersonationIndicator,
  ScopeSelector,
  Sider as SiderComponent,
} from '@/components';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import ThemeSettings from '@/components/ThemeSettings';
import { useDarkMode } from '@/hooks';
import { AuthStore } from '@/stores';
import { checkPlatformAdmin, checkSuperAdmin } from '@/utils';
import { useSwitchTenant } from './platform/-hooks/useSwitchTenant';
import { StartImpersonationForm } from './platform/impersonation/-components/StartImpersonationForm';

const { Header, Footer, Sider, Content } = Layout;

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export const Route = createFileRoute('/_dashboard')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const user = useStore(AuthStore, state => state.user);
  const logout = useStore(AuthStore, state => state.logout);
  const impersonation = useStore(AuthStore, state => state.impersonation);
  const startImpersonation = useStore(AuthStore, state => state.startImpersonation);
  const stopImpersonation = useStore(AuthStore, state => state.stopImpersonation);
  const startFormRef = useRef<StartImpersonationFormRef>(null);
  const [collapsed, setCollapsed] = useState(false);
  const { isDarkMode } = useDarkMode();
  const isPlatformAdmin = checkPlatformAdmin(user);
  const isSuperAdmin = checkSuperAdmin(user);
  const switchTenantMutation = useSwitchTenant();

  const handleLogout = () => {
    logout();
    navigate({
      to: '/login',
      replace: true,
    });
  };

  const handleStopImpersonation = () => {
    stopImpersonation();
    message.success('已退出代管模式');
  };

  const handleOpenSwitchTenant = () => {
    startFormRef.current?.open();
  };

  useEffect(() => {
    if (!impersonation) {
      return;
    }

    const expiresAt = Date.parse(impersonation.expiresAt);
    if (Number.isNaN(expiresAt)) {
      stopImpersonation();
      message.warning('代管会话时间格式无效，请重新执行切租户');
      return;
    }

    const expireCheckTimer = window.setInterval(() => {
      if (Date.now() >= expiresAt) {
        stopImpersonation();
        message.warning('代管会话已过期，请重新执行切租户');
      }
    }, 10000);

    return () => {
      window.clearInterval(expireCheckTimer);
    };
  }, [impersonation, message, stopImpersonation]);

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <CustomIcon icon="line-md:account" width={16} />,
      label: '个人信息',
      onClick: () => navigate({ to: '/profile' }),
    },
    {
      key: 'settings',
      icon: <CustomIcon icon="line-md:cog-loop" width={16} />,
      label: '系统设置',
      onClick: () => navigate({ to: '/settings' }),
    },
    ...(isPlatformAdmin
      ? [
        ...(isSuperAdmin
          ? [{
            key: 'switch-tenant',
            icon: <CustomIcon icon="line-md:switch" width={16} />,
            label: impersonation ? '重新切换租户' : '切换租户',
            onClick: handleOpenSwitchTenant,
          }]
          : []),
        ...(impersonation
          ? [{
            key: 'exit-impersonation',
            icon: <CustomIcon icon="line-md:rotate-270" width={16} />,
            label: '退出代管',
            onClick: handleStopImpersonation,
          }]
          : []),
      ]
      : []),
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <CustomIcon icon="line-md:logout" width={16} />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  // Sider 宽度
  const siderWidth = collapsed ? 80 : 200;

  // if (!token) {
  //   return null; // 避免闪烁
  // }

  return (
    <div className="bg-bgPrimary">
      <Layout className="h-screen">
        {/* 固定侧边栏 - 独立滚动 */}
        <Sider
          className="bg-bgPrimary!"
          style={{
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            overflow: 'hidden',
          }}
          theme={isDarkMode ? 'dark' : 'light'}
          trigger={null}
          collapsible
          collapsed={collapsed}
        >
          <div className="w-100% h-64px flex items-center justify-center p-[5px_0] overflow-hidden">
            <Space>
              <CustomIcon
                icon="line-md:github"
                width={35}
                hasDefaultClass={false}
                className="text-textBaseColor"
              />
              {!collapsed && (
                <span className="text-20px font-bold text-textBaseColor w-100% text-nowrap">
                  后台管理系统
                </span>
              )}
            </Space>
          </div>

          <div
            className="overflow-y-auto overflow-x-hidden"
            style={{
              height: 'calc(100vh - 64px)',
            }}
          >
            <SiderComponent />
          </div>
        </Sider>

        <Layout style={{ marginLeft: siderWidth }}>
          <Header className="h-64px dark:bg-bgPrimary! b-l b-l-gray-200 dark:b-l-[#000] p-[0_16px]!">
            <div className="h-full flex items-center justify-between">
              <Space>
                <Button
                  type="text"
                  icon={(
                    <CustomIcon
                      icon={
                        collapsed
                          ? 'line-md:menu-unfold-left'
                          : 'line-md:menu-unfold-right'
                      }
                      width={16}
                    />
                  )}
                  onClick={() => setCollapsed(!collapsed)}
                />
              </Space>

              <Space size="middle">
                <ScopeSelector />

                {/* 主题设置 */}
                <ThemeSettings />

                {/* 用户菜单 */}
                <Dropdown
                  menu={{ items: userMenuItems }}
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <div className="cursor-pointer flex items-center gap-2 p-2 rounded-lg transition-colors">
                    <ImpersonationIndicator />
                    <Avatar size="small" src={user?.avatar}>
                      {user?.username?.charAt(0).toUpperCase()}
                    </Avatar>
                    <span className="text-textBaseColor">
                      {user?.nickname || user?.username}
                    </span>
                  </div>
                </Dropdown>
              </Space>
            </div>
          </Header>

          <Content className="flex-1 min-h-0 overflow-hidden">
            <div className="min-h-0 h-full overflow-x-hidden overflow-y-auto box-border p-4 pb-0">
              <ImpersonationBanner onExit={handleStopImpersonation} />
              <div className="min-h-0 h-full">
                <Outlet />
              </div>
            </div>
          </Content>
          <Footer className="h-64px bg-[rgb(245,245,245)] dark:bg-[#000]">
            <div className="h-full text-align-center">
              ©
              {new Date().getFullYear()}
              {' '}
              Created by Leeforge
            </div>
          </Footer>
        </Layout>
      </Layout>

      <StartImpersonationForm
        ref={startFormRef}
        loading={switchTenantMutation.isPending}
        onSubmit={async (values) => {
          await switchTenantMutation.mutateAsync(values, {
            onSuccess: (response) => {
              const data = response.data;
              startImpersonation({
                token: data.token,
                targetTenantId: data.targetTenantId,
                expiresAt: data.expiresAt,
                durationMinutes: data.durationMinutes,
                reason: values.reason,
              });
              message.success(`已切换到租户域 tenant:${data.targetTenantId}`);
              window.location.reload();
            },
            onError: (error: unknown) => {
              message.error(getErrorMessage(error, '切换租户域失败'));
            },
          });
        }}
      />
    </div>
  );
}
