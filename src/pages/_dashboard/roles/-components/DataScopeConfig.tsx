import type { DefaultDataScope } from '@/api/endpoints/role.api';
import { SaveOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Radio, Spin, Tag } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { getRoleById, updateRole } from '@/api/endpoints/role.api';
import { useMsg } from '@/hooks/modules/useMsg';
import {
  buildGlobalDataScopeUpdate,
  GLOBAL_DATA_SCOPE_OPTIONS,
} from './data-scope-config.helpers';

interface DataScopeConfigProps {
  roleId: string;
  roleName: string;
  variant?: 'card' | 'plain';
}

/**
 * 角色全局数据范围配置
 */
export function DataScopeConfig({ roleId, roleName, variant = 'card' }: DataScopeConfigProps) {
  const { msgSuccess, msgError, msgInfo } = useMsg();
  const queryClient = useQueryClient();
  const [value, setValue] = useState<DefaultDataScope>('SELF');

  const roleQuery = useQuery({
    queryKey: ['roles', roleId, 'detail'],
    queryFn: () => getRoleById(roleId),
    enabled: !!roleId,
  });

  const updateMutation = useMutation({
    mutationFn: (nextScope: DefaultDataScope) => updateRole(
      roleId,
      buildGlobalDataScopeUpdate(nextScope),
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', roleId, 'detail'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      msgSuccess('保存成功');
    },
    onError: (error: any) => {
      msgError(error?.message || '保存失败');
    },
  });

  const serverValue = (roleQuery.data?.data?.defaultDataScope || 'SELF') as DefaultDataScope;

  useEffect(() => {
    if (roleQuery.data?.data) {
      setValue(serverValue);
    }
  }, [roleQuery.data?.data, serverValue]);

  const dirty = useMemo(() => value !== serverValue, [serverValue, value]);

  const handleSave = async () => {
    if (!dirty) {
      msgInfo('没有需要保存的更改');
      return;
    }
    await updateMutation.mutateAsync(value);
  };

  const content = roleQuery.isLoading
    ? (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      )
    : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-textSecondary">全局数据范围</span>
            <Tag color={dirty ? 'orange' : 'green'}>{dirty ? '未保存' : '已同步'}</Tag>
          </div>
          <Radio.Group
            value={value}
            onChange={event => setValue(event.target.value as DefaultDataScope)}
            className="flex w-full flex-col gap-2"
          >
            {GLOBAL_DATA_SCOPE_OPTIONS.map(option => (
              <Radio key={option.value} value={option.value}>
                {option.label}
              </Radio>
            ))}
          </Radio.Group>
          <div className="text-xs text-textSecondary">
            该配置对角色全局生效，不再区分资源维度。
          </div>
        </div>
      );

  const saveButton = (
    <Button
      type="primary"
      icon={<SaveOutlined />}
      onClick={handleSave}
      loading={updateMutation.isPending}
    >
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
    <Card title={`角色数据范围配置 - ${roleName}`} extra={saveButton}>
      {content}
    </Card>
  );
}
