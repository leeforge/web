import type { Menu } from '@/api/endpoints/menu.api';
import type { Key } from 'react';
import { Button, Card, Spin, Tree } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useMsg } from '@/hooks/modules/useMsg';
import { useRoleMenuAccess } from '../-hooks/useRoleMenuAccess';
import { extractRoleMenuIds, toMenuTreeData } from './role-menu-access.helpers';

interface RoleMenuAccessConfigProps {
  roleId: string;
  variant?: 'card' | 'plain';
}

function normalizeMenuTree(payload: unknown): Menu[] {
  if (Array.isArray(payload)) {
    return payload as Menu[];
  }
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) {
      return data as Menu[];
    }
  }
  return [];
}

function normalizeCheckedKeys(keys: Key[] | { checked: Key[] }): string[] {
  const nextKeys = Array.isArray(keys) ? keys : keys.checked;
  return nextKeys.map(key => String(key));
}

export function RoleMenuAccessConfig({ roleId, variant = 'card' }: RoleMenuAccessConfigProps) {
  const { msgSuccess, msgError } = useMsg();
  const { roleQuery, menuTreeQuery, saveMutation } = useRoleMenuAccess(roleId);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);

  useEffect(() => {
    setCheckedKeys(extractRoleMenuIds(roleQuery.data?.data));
  }, [roleQuery.data]);

  const menuTreeData = useMemo(() => {
    return toMenuTreeData(normalizeMenuTree(menuTreeQuery.data?.data));
  }, [menuTreeQuery.data]);

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync(checkedKeys);
      msgSuccess('角色菜单配置已保存');
    }
    catch (error: any) {
      msgError(error?.message || '角色菜单配置保存失败');
    }
  };

  if (roleQuery.isLoading || menuTreeQuery.isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spin />
      </div>
    );
  }

  const role = roleQuery.data?.data;
  if (!role) {
    return <div>角色不存在</div>;
  }

  const saveButton = (
    <Button type="primary" onClick={handleSave} loading={saveMutation.isPending}>
      保存
    </Button>
  );

  const content = (
    <Tree
      checkable
      checkedKeys={checkedKeys}
      onCheck={keys => setCheckedKeys(normalizeCheckedKeys(keys))}
      treeData={menuTreeData}
    />
  );

  if (variant === 'plain') {
    return (
      <div>
        <div className="mb-4 flex justify-end">{saveButton}</div>
        {content}
      </div>
    );
  }

  return (
    <Card
      title={`角色菜单配置 - ${role.name}`}
      extra={saveButton}
    >
      {content}
    </Card>
  );
}
