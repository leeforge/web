import type { MenuProps } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Menu } from 'antd';
import { useMemo } from 'react';
import { getMenuTree } from '@/api/endpoints/menu.api';
import CustomIcon from '../CustomIcon/CustomIcon';
import {
  buildSiderMenuNodes,
  normalizeMenuTreePayload,
  resolveSiderState,
  type SiderMenuNode,
} from './sider-menu.helpers';

type MenuItem = Required<MenuProps>['items'][number];

function toAntdMenuItems(nodes: SiderMenuNode[]): MenuItem[] {
  return nodes.map(node => ({
    key: node.key,
    icon: node.icon ? <CustomIcon icon={node.icon} width={18} /> : undefined,
    label: node.title,
    children: node.children?.length ? toAntdMenuItems(node.children) : undefined,
  }));
}

function Sider() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const menuTreeQuery = useQuery({
    queryKey: ['menus', 'tree'],
    queryFn: () => getMenuTree(),
  });

  const siderNodes = useMemo(
    () => buildSiderMenuNodes(normalizeMenuTreePayload(menuTreeQuery.data)),
    [menuTreeQuery.data],
  );
  const menuItems = useMemo(() => toAntdMenuItems(siderNodes), [siderNodes]);
  const { selectedKeys, openKeys } = useMemo(
    () => resolveSiderState(siderNodes, currentPath),
    [siderNodes, currentPath],
  );

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (typeof key !== 'string' || !key.startsWith('/')) {
      return;
    }
    navigate({ to: key });
  };

  return (
    <div className="h-full bg-bgPrimary">
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        defaultOpenKeys={openKeys}
        items={menuItems}
        onClick={handleMenuClick}
        className="h-full border-r-0!"
      />
    </div>
  );
}

export { Sider };
