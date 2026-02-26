import type { ModalOpenOptions } from '@leeforge/react-ui';
import type { Ref } from 'react';
import type {
  CreateTenantParams,
  Tenant,
  UpdateTenantParams,
} from '@/api/endpoints/tenant.api';
import type { UISchema } from '@leeforge/react-ui';
import { Modal, useModal } from '@leeforge/react-ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Spin } from 'antd';
import { useEffect, useImperativeHandle, useMemo, useState } from 'react';
import {
  createTenant,
  CreateTenantParamsSchema,
  getTenantById,
  updateTenant,
  UpdateTenantParamsSchema,
} from '@/api/endpoints/tenant.api';
import { SchemaFormRenderer, useSchemaForm } from '@leeforge/react-ui';
import { useMsg } from '@/hooks';

export interface TenantFormRef {
  open: (data?: ModalOpenOptions<Tenant>) => void;
  close: () => void;
}

interface TenantFormProps {
  ref?: Ref<TenantFormRef>;
  onSuccess?: () => void;
}

const createTenantUISchema: UISchema<CreateTenantParams> = {
  name: {
    label: '租户名称',
    placeholder: '请输入租户名称',
    required: true,
  },
  code: {
    label: '租户编码',
    placeholder: '请输入租户编码（唯一标识）',
    required: true,
  },
  status: {
    label: '状态',
    widget: 'select',
    options: [
      { label: '启用', value: 'active' },
      { label: '禁用', value: 'inactive' },
    ],
  },
  description: {
    label: '描述',
    widget: 'textarea',
    placeholder: '请输入租户描述',
    rows: 3,
  },
};

const updateTenantUISchema: UISchema<UpdateTenantParams> = {
  name: {
    label: '租户名称',
    placeholder: '请输入租户名称',
  },
  status: {
    label: '状态',
    widget: 'select',
    options: [
      { label: '启用', value: 'active' },
      { label: '禁用', value: 'inactive' },
    ],
  },
  description: {
    label: '描述',
    widget: 'textarea',
    placeholder: '请输入租户描述',
    rows: 3,
  },
};

/**
 * 租户表单组件（创建/编辑）
 */
export function TenantForm({ ref, onSuccess }: TenantFormProps) {
  const queryClient = useQueryClient();
  const { msgSuccess, msgError } = useMsg();
  const [isEdit, setIsEdit] = useState(false);
  const [tenantId, setTenantId] = useState<string>();
  const [tenantData, setTenantData] = useState<Tenant>();

  const tenantDetailQuery = useQuery({
    queryKey: ['tenants', tenantId, 'detail'],
    queryFn: () => getTenantById(tenantId || ''),
    enabled: isEdit && !!tenantId,
    retry: false,
  });

  const resolvedTenant = tenantDetailQuery.data?.data ?? tenantData;
  const defaultValues = useMemo(() => ({
    name: '',
    code: '',
    status: 'active',
    description: '',
  }), []);

  // 创建 mutation
  const createMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      msgSuccess('租户创建成功');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      onSuccess?.();
      // eslint-disable-next-line ts/no-use-before-define
      close();
    },
    onError: (error: any) => {
      msgError(`创建失败: ${error.message}`);
    },
  });

  // 更新 mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantParams }) =>
      updateTenant(id, data),
    onSuccess: () => {
      msgSuccess('租户更新成功');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      onSuccess?.();
      // eslint-disable-next-line ts/no-use-before-define
      close();
    },
    onError: (error: any) => {
      msgError(`更新失败: ${error.message}`);
    },
  });

  const form = useSchemaForm({
    schema: isEdit ? UpdateTenantParamsSchema : CreateTenantParamsSchema,
    uiSchema: isEdit ? updateTenantUISchema : createTenantUISchema,
    defaultValues,
    onSubmit: async (values) => {
      if (isEdit && tenantId) {
        const updateData: UpdateTenantParams = {
          name: values.name,
          status: values.status,
          description: values.description,
        };
        updateMutation.mutate({ id: tenantId, data: updateData });
      }
      else {
        createMutation.mutate(values as CreateTenantParams);
      }
    },
  });

  const { open, visible, close } = useModal<Tenant>({
    beforeOpen: (opts) => {
      if (!opts?.data?.id) {
        setIsEdit(false);
        setTenantId(void 0);
        setTenantData(void 0);
        form.reset();
        form.setValues(defaultValues);
        return;
      }

      setIsEdit(true);
      setTenantId(opts.data.id);
      setTenantData(opts.data);
      form.setValues({
        name: opts.data.name,
        status: opts.data.status ?? undefined,
        description: opts.data.description || '',
      });
    },
    afterClose: () => {
      setIsEdit(false);
      setTenantId(void 0);
      setTenantData(void 0);
      form.reset();
    },
  });

  useImperativeHandle(ref, () => ({
    open,
    close,
  }), [close, open]);

  useEffect(() => {
    if (visible && isEdit && resolvedTenant) {
      form.setValues({
        name: resolvedTenant.name,
        status: resolvedTenant.status ?? undefined,
        description: resolvedTenant.description || '',
      });
    }
  }, [form, isEdit, resolvedTenant, visible]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isDetailLoading = visible && isEdit && tenantDetailQuery.isLoading;

  return (
    <Modal
      title={isEdit ? '编辑租户' : '新建租户'}
      visible={visible}
      onClose={close}
      footer={null}
      width={600}
      destroyOnHidden
    >
      <div className="mt-4">
        {isDetailLoading
          ? (
              <div className="flex justify-center py-8">
                <Spin />
              </div>
            )
          : (
              <SchemaFormRenderer
                form={form}
                layout={{ layout: 'vertical' }}
                onCancel={close}
                submitText={isEdit ? '更新' : '创建'}
                cancelText="取消"
                showCancel
                loading={isPending}
                buttonAlign="right"
              />
            )}
      </div>
    </Modal>
  );
}
