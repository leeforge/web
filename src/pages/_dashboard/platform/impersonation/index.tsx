import type { StartImpersonationFormRef } from './-components/StartImpersonationForm';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Button, Card, Result } from 'antd';
import { useRef } from 'react';
import { useStore } from 'zustand';
import { startImpersonation } from '@/api/endpoints/platform.api';
import { AuthStore } from '@/stores';
import { checkSuperAdmin } from '@/utils';
import { StartImpersonationForm } from './-components/StartImpersonationForm';

export const Route = createFileRoute('/_dashboard/platform/impersonation/')({
  component: RouteComponent,
});

function RouteComponent() {
  const formRef = useRef<StartImpersonationFormRef>(null);
  const user = useStore(AuthStore, state => state.user);
  const authStartImpersonation = useStore(AuthStore, state => state.startImpersonation);

  const isSuperAdmin = checkSuperAdmin(user);

  const mutation = useMutation({
    mutationFn: startImpersonation,
    onSuccess: (response, payload) => {
      const data = response.data;
      authStartImpersonation({
        token: data.token,
        targetTenantId: data.targetTenantId,
        expiresAt: data.expiresAt,
        reason: payload.reason,
        durationMinutes: data.durationMinutes,
      });
      window.location.reload();
    },
  });

  if (!isSuperAdmin) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="仅 super_admin 可执行租户代管。"
      />
    );
  }

  return (
    <Card title="平台域代管">
      <p className="mb-4 text-textSecondary">
        平台超级管理员可从该页面发起租户域代管会话。提交后将生成短期代管 Token，并立即刷新页面进入代管态。
      </p>
      <Button type="primary" onClick={() => formRef.current?.open()}>
        切换到租户域
      </Button>

      <StartImpersonationForm
        ref={formRef}
        loading={mutation.isPending}
        onSubmit={async (values) => {
          await mutation.mutateAsync(values);
        }}
      />
    </Card>
  );
}
