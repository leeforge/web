import type { ModalOpenOptions, UISchema } from '@leeforge/react-ui';
import type { Ref } from 'react';
import type { SwitchTenantParams } from '@/api/endpoints/platform.api';
import { Modal, SchemaFormRenderer, useModal, useSchemaForm } from '@leeforge/react-ui';
import { useQuery } from '@tanstack/react-query';
import { useImperativeHandle, useMemo } from 'react';
import { z } from 'zod';
import { normalizePaginatedPayload } from '@/api/adapters/paginated';
import { getTenantList } from '@/api/endpoints/tenant.api';

const durationOptions = [30, 60, 120, 240] as const;

const startImpersonationSchema = z.object({
  targetTenantId: z.string().min(1, '请选择目标租户域'),
  reason: z.string().trim().min(1, '请输入切换原因').max(500, '切换原因最多 500 字'),
  durationMinutes: z.number().int().min(1, '时长必须大于 0'),
});

type StartImpersonationFormValues = z.infer<typeof startImpersonationSchema>;

const uiSchema: UISchema<StartImpersonationFormValues> = {
  targetTenantId: {
    label: '目标域（tenant）',
    widget: 'select',
    options: [],
    showSearch: true,
    allowClear: true,
    required: true,
  },
  reason: {
    label: '切换原因',
    widget: 'textarea',
    rows: 4,
    placeholder: '请填写审计可追溯的切换原因（最多 500 字）',
    required: true,
  },
  durationMinutes: {
    label: '代管时长（分钟）',
    widget: 'select',
    options: durationOptions.map(value => ({ label: `${value} 分钟`, value })),
    required: true,
  },
};

export interface StartImpersonationFormRef {
  open: (options?: ModalOpenOptions<undefined>) => void;
  close: () => void;
}

interface StartImpersonationFormProps {
  ref?: Ref<StartImpersonationFormRef>;
  loading?: boolean;
  onSubmit: (values: SwitchTenantParams) => Promise<void> | void;
}

export function StartImpersonationForm({ ref, loading, onSubmit }: StartImpersonationFormProps) {
  const tenantsQuery = useQuery({
    queryKey: ['tenants', 'impersonation-options'],
    queryFn: async () => {
      const response = await getTenantList({ page: 1, pageSize: 200, status: 'active' });
      return normalizePaginatedPayload(response, {
        listKeys: ['items', 'data'],
        defaultPageSize: 200,
      });
    },
  });

  const resolvedUISchema = useMemo<UISchema<StartImpersonationFormValues>>(() => ({
    ...uiSchema,
    targetTenantId: {
      label: '目标域（tenant）',
      widget: 'select',
      options: (tenantsQuery.data?.list || []).map((tenant: any) => ({
        label: `${tenant.name} (tenant:${tenant.id})`,
        value: tenant.id,
      })),
      showSearch: true,
      allowClear: true,
      required: true,
    },
  }), [tenantsQuery.data?.list]);

  const form = useSchemaForm({
    schema: startImpersonationSchema,
    uiSchema: resolvedUISchema,
    defaultValues: {
      targetTenantId: '',
      reason: '',
      durationMinutes: 30,
    },
    onSubmit,
  });

  const { open, visible, close } = useModal<undefined>({
    beforeOpen: () => {
      form.reset();
      form.setValues({
        targetTenantId: '',
        reason: '',
        durationMinutes: 30,
      });
    },
    afterClose: () => {
      form.reset();
    },
  });

  useImperativeHandle(ref, () => ({
    open,
    close,
  }), [close, open]);

  return (
    <Modal
      title="切换到域（tenant）"
      visible={visible}
      onClose={close}
      footer={null}
      width={620}
      destroyOnHidden
    >
      <div className="mt-4">
        <SchemaFormRenderer
          form={form}
          layout={{ layout: 'vertical' }}
          loading={loading}
          onCancel={close}
          submitText="确认切换"
          cancelText="取消"
          showCancel
          buttonAlign="right"
        />
      </div>
    </Modal>
  );
}
