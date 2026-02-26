import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Space, Switch } from 'antd';
import { useState } from 'react';
import { addOrganizationMember } from '@/api/endpoints/organization.api';
import { useMsg } from '@/hooks/modules/useMsg';
import { buildAddMemberPayload } from './organization-member.helpers';

interface OrganizationMemberQuickAddProps {
  organizationId?: string;
}

function mapAddMemberError(error: any) {
  const status = error?.response?.status;
  if (status === 400) {
    return '成员添加失败：请求参数无效';
  }
  if (status === 404) {
    return '成员添加失败：组织或用户不存在';
  }
  if (status === 409) {
    return '成员添加失败：成员已存在';
  }
  return `成员添加失败：${error?.message || '未知错误'}`;
}

export function OrganizationMemberQuickAdd({ organizationId }: OrganizationMemberQuickAddProps) {
  const queryClient = useQueryClient();
  const { msgSuccess, msgError, msgWarning } = useMsg();
  const [userId, setUserId] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const addMutation = useMutation({
    mutationFn: (payload: { organizationId: string; userId: string; isPrimary: boolean }) =>
      addOrganizationMember(
        payload.organizationId,
        buildAddMemberPayload(payload.userId, payload.isPrimary),
      ),
    onSuccess: () => {
      msgSuccess('成员添加成功');
      setUserId('');
      setIsPrimary(false);
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: (error: any) => {
      msgError(mapAddMemberError(error));
    },
  });

  const handleSubmit = () => {
    if (!organizationId) {
      msgWarning('请先选择组织');
      return;
    }

    if (!userId.trim()) {
      msgWarning('请输入用户 ID');
      return;
    }

    addMutation.mutate({
      organizationId,
      userId,
      isPrimary,
    });
  };

  return (
    <div className="mt-6 border-t border-borderColor pt-4">
      <div className="mb-3 text-sm font-medium">成员操作</div>
      <Space direction="vertical" className="w-full" size={12}>
        <Input
          value={userId}
          onChange={event => setUserId(event.target.value)}
          placeholder="请输入用户 ID"
          allowClear
        />
        <div className="flex items-center justify-between">
          <span className="text-sm text-textSecondary">设为主组织成员</span>
          <Switch checked={isPrimary} onChange={setIsPrimary} />
        </div>
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={addMutation.isPending}
          block
        >
          添加成员
        </Button>
      </Space>
    </div>
  );
}
