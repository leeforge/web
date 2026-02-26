import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Spin, Tag, Tree } from 'antd';
import type { Key } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { getPermissionList } from '@/api/endpoints/permission.api';
import { getRoleById, setRoleAPIs } from '@/api/endpoints/role.api';
import { useMsg } from '@/hooks/modules/useMsg';
import {
  buildSetRolePermissionsPayload,
  extractRolePermissionCodes,
  toPermissionTreeData,
} from './role-permission-binding.helpers';

interface RolePermissionBindingConfigProps {
  roleId: string;
  variant?: 'card' | 'plain';
}

function normalizeCheckedKeys(keys: Key[] | { checked: Key[] }): string[] {
  const nextKeys = Array.isArray(keys) ? keys : keys.checked;
  return nextKeys
    .map(key => String(key))
    .filter(key => !key.startsWith('group:'));
}

export function RolePermissionBindingConfig({
  roleId,
  variant = 'card',
}: RolePermissionBindingConfigProps) {
  const queryClient = useQueryClient();
  const { msgSuccess, msgError, msgInfo } = useMsg();
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);

  const roleQuery = useQuery({
    queryKey: ['roles', roleId, 'detail'],
    queryFn: () => getRoleById(roleId),
    enabled: !!roleId,
  });
  const permissionQuery = useQuery({
    queryKey: ['permissions', 'list'],
    queryFn: () => getPermissionList(),
    enabled: !!roleId,
  });

  useEffect(() => {
    setSelectedCodes(extractRolePermissionCodes(roleQuery.data?.data));
  }, [roleQuery.data]);

  const serverCodes = useMemo(
    () => extractRolePermissionCodes(roleQuery.data?.data),
    [roleQuery.data],
  );
  const permissionTreeData = useMemo(
    () => toPermissionTreeData(permissionQuery.data?.data),
    [permissionQuery.data],
  );
  const dirty = useMemo(() => {
    return JSON.stringify([...selectedCodes].sort()) !== JSON.stringify([...serverCodes].sort());
  }, [selectedCodes, serverCodes]);

  const saveMutation = useMutation({
    mutationFn: (codes: string[]) => setRoleAPIs(roleId, buildSetRolePermissionsPayload(codes)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', roleId, 'detail'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      msgSuccess('角色权限绑定已保存');
    },
    onError: (error: any) => {
      msgError(error?.message || '角色权限绑定保存失败');
    },
  });

  const handleSave = async () => {
    if (!dirty) {
      msgInfo('没有需要保存的更改');
      return;
    }
    await saveMutation.mutateAsync(selectedCodes);
  };

  if (roleQuery.isLoading || permissionQuery.isLoading) {
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

  const content = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-textSecondary">已绑定权限</span>
        <Tag color={dirty ? 'orange' : 'green'}>{dirty ? '未保存' : '已同步'}</Tag>
      </div>
      <Tree
        checkable
        checkedKeys={selectedCodes}
        treeData={permissionTreeData}
        onCheck={keys => setSelectedCodes(normalizeCheckedKeys(keys))}
        defaultExpandAll
        disabled={saveMutation.isPending}
      />
    </div>
  );

  const saveButton = (
    <Button type="primary" onClick={handleSave} loading={saveMutation.isPending}>
      保存
    </Button>
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
    <Card title={`角色权限绑定 - ${role.name}`} extra={saveButton}>
      {content}
    </Card>
  );
}
