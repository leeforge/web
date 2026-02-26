import { Drawer, Tabs } from 'antd';
import { DataScopeConfig } from './DataScopeConfig';
import { RoleMenuAccessConfig } from './RoleMenuAccessConfig';
import { RolePermissionBindingConfig } from './RolePermissionBindingConfig';
import {
  type RoleAccessDrawerState,
  type RoleAccessTabKey,
  getRoleAccessDrawerTitle,
} from './role-access-drawer.helpers';

interface RoleAccessConfigDrawerProps {
  state: RoleAccessDrawerState;
  onClose: () => void;
  onTabChange: (tab: RoleAccessTabKey) => void;
}

export function RoleAccessConfigDrawer({
  state,
  onClose,
  onTabChange,
}: RoleAccessConfigDrawerProps) {
  return (
    <Drawer
      open={state.open}
      onClose={onClose}
      width={960}
      destroyOnHidden
      title={state.role ? getRoleAccessDrawerTitle(state.role.name) : '角色权限配置'}
    >
      {state.role && (
        <Tabs
          activeKey={state.activeTab}
          onChange={key => onTabChange(key as RoleAccessTabKey)}
          items={[
            {
              key: 'menu',
              label: '菜单配置',
              children: <RoleMenuAccessConfig roleId={state.role.id} variant="plain" />,
            },
            {
              key: 'permission',
              label: '权限绑定',
              children: <RolePermissionBindingConfig roleId={state.role.id} variant="plain" />,
            },
            {
              key: 'data-scope',
              label: '数据范围',
              children: (
                <DataScopeConfig
                  roleId={state.role.id}
                  roleName={state.role.name}
                  variant="plain"
                />
              ),
            },
          ]}
        />
      )}
    </Drawer>
  );
}
