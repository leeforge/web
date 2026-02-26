import type { ActionItem } from '@leeforge/react-ui';
import type { MenuFormRef } from './MenuForm';
import type { Menu } from '@/api/endpoints/menu.api';
import { ProTable, RowActionBar } from '@leeforge/react-ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  message,
  Space,
  Tag,
} from 'antd';
import { useRef, useState } from 'react';
import {
  deleteMenu,
  getMenuTree,
  syncMenus,
} from '@/api/endpoints/menu.api';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import { useModal } from '@/hooks';
import { MenuForm } from './MenuForm';

/**
 * 菜单列表页面（树形展示）
 */
export function MenusListPage() {
  const queryClient = useQueryClient();
  const { modalConfirm } = useModal();

  // 表单状态
  const formRef = useRef<MenuFormRef>(null);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  // 获取菜单树
  const {
    data: menuTreeResponse,
    isLoading,
  } = useQuery({
    queryKey: ['menus', 'tree'],
    queryFn: () => getMenuTree(),
  });

  // 删除菜单 mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMenu,
    onSuccess: () => {
      message.success('菜单删除成功');
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
    onError: (error: any) => {
      message.error(`删除失败: ${error.message}`);
    },
  });

  // 同步菜单 mutation
  const syncMutation = useMutation({
    mutationFn: syncMenus,
    onSuccess: () => {
      message.success('菜单同步成功');
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
    onError: (error: any) => {
      message.error(`同步失败: ${error.message}`);
    },
  });

  // 同步菜单确认
  const handleSync = () => {
    modalConfirm({
      title: '确认同步',
      content: '确定要同步菜单吗？这将从路由配置中更新菜单数据。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => syncMutation.mutate(),
    });
  };

  // 删除确认
  const handleDelete = (menu: Menu) => {
    const hasChildren = menu.children && menu.children.length > 0;
    modalConfirm({
      title: '确认删除',
      content: hasChildren
        ? `确定要删除菜单 "${menu.name}" 及其所有子菜单吗？`
        : `确定要删除菜单 "${menu.name}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutate(menu.id),
    });
  };

  // 打开新建表单
  const handleCreate = () => {
    formRef.current?.open();
  };

  // 打开编辑表单
  const handleEdit = (menu: Menu) => {
    formRef.current?.open({ data: menu });
  };

  // 展开/收起所有
  const handleExpandAll = () => {
    if (!menuTreeResponse?.data)
      return;

    const getAllKeys = (menus: Menu[]): string[] => {
      const keys: string[] = [];
      menus.forEach((menu) => {
        keys.push(menu.id);
        if (menu.children) {
          keys.push(...getAllKeys(menu.children));
        }
      });
      return keys;
    };

    if (expandedKeys.length > 0) {
      setExpandedKeys([]);
    }
    else {
      setExpandedKeys(getAllKeys(menuTreeResponse.data));
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '菜单名称',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (name: string, menu: Menu) => (
        <Space>
          {menu.icon && <CustomIcon icon={menu.icon} width={16} />}
          <span className="font-medium">{name}</span>
        </Space>
      ),
    },
    {
      title: '路由路径',
      dataIndex: 'path',
      key: 'path',
      width: 200,
      render: (path: string) => (
        <Tag color="blue">{path}</Tag>
      ),
    },
    {
      title: '组件',
      dataIndex: 'component',
      key: 'component',
      ellipsis: true,
      render: (component: string) => component || '-',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 80,
      render: (sort: number) => sort ?? 0,
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_: unknown, menu: Menu) => (
        <Space>
          {menu.hidden && <Tag color="orange">隐藏</Tag>}
          {menu.affix && <Tag color="green">固定</Tag>}
          {!menu.hidden && !menu.affix && <Tag color="default">正常</Tag>}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: unknown, menu: Menu) => {
        const actionItems: ActionItem<Menu>[] = [
          {
            key: 'edit',
            label: '编辑',
            onClick: () => handleEdit(menu),
          },
          {
            key: 'delete',
            label: '删除',
            danger: true,
            disabled: deleteMutation.isPending,
            onClick: () => handleDelete(menu),
          },
        ];

        return (
          <RowActionBar
            items={actionItems}
            context={menu}
          />
        );
      },
    },
  ];

  return (
    <div className="h-full min-h-0">
      <ProTable<Menu, Record<string, never>>
        columns={columns}
        data={menuTreeResponse?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={false}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['menus', 'tree'] })}
        actions={(
          <Space>
            <Button onClick={handleExpandAll}>
              {expandedKeys.length > 0 ? '收起全部' : '展开全部'}
            </Button>
            <Button
              icon={<CustomIcon icon="line-md:downloading-loop" width={16} />}
              onClick={handleSync}
              loading={syncMutation.isPending}
            >
              同步菜单
            </Button>
            <Button
              type="primary"
              icon={<CustomIcon icon="line-md:plus" width={16} />}
              onClick={handleCreate}
            >
              新建菜单
            </Button>
          </Space>
        )}
        tableProps={{
          expandable: {
            expandedRowKeys: expandedKeys,
            onExpandedRowsChange: keys => setExpandedKeys(keys as string[]),
            childrenColumnName: 'children',
          },
        }}
      />

      {/* 菜单表单弹窗 */}
      <MenuForm ref={formRef} />
    </div>
  );
}
