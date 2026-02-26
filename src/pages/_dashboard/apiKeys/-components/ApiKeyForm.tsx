import type { ModalOpenOptions } from '@leeforge/react-ui';
import type { Ref } from 'react';
import type { APIKey, CreateAPIKeyParams, UpdateAPIKeyParams } from '@/api/endpoints/api-key.api';
import type { UISchema } from '@leeforge/react-ui';
import { Modal, useModal } from '@leeforge/react-ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useImperativeHandle, useState } from 'react';
import {
  createAPIKey,
  CreateAPIKeyParamsSchema,
  updateAPIKey,
  UpdateAPIKeyParamsSchema,
} from '@/api/endpoints/api-key.api';
import { SchemaFormRenderer, useSchemaForm } from '@leeforge/react-ui';
import { useMsg } from '@/hooks';

export interface APIKeyFormRef {
  open: (data?: ModalOpenOptions<APIKey>) => void;
  close: () => void;
}

interface APIKeyFormProps {
  ref?: Ref<APIKeyFormRef>;
  onClose: () => void;
  onSuccess?: () => void;
  onCreateSuccess?: (secretKey: string, name: string) => void;
}

// 创建 API Key 的 UI Schema
const createAPIKeyUISchema: UISchema<CreateAPIKeyParams> = {
  name: {
    label: '名称',
    placeholder: '请输入 API Key 名称，例如：生产环境密钥',
    required: true,
  },
  description: {
    label: '描述',
    widget: 'textarea',
    placeholder: '请输入 API Key 用途说明',
    rows: 3,
  },
  environment: {
    label: '环境',
    widget: 'select',
    options: [
      { label: '生产环境 (pk_live_)', value: 'live' },
      { label: '测试环境 (pk_test_)', value: 'test' },
    ],
  },
  expiresAt: {
    label: '过期时间',
    widget: 'datetime',
    placeholder: '留空表示永不过期',
  },
  rateLimit: {
    label: '速率限制（次/分钟）',
    widget: 'number',
    min: 0,
    help: '0 表示无限制',
    placeholder: '每分钟最大请求次数',
  },
  dailyLimit: {
    label: '每日限额（次/天）',
    widget: 'number',
    min: 0,
    help: '0 表示无限制',
    placeholder: '每天最大请求次数',
  },
  roleId: {
    label: '绑定角色 ID',
    placeholder: '请输入角色 ID（最小权限角色）',
  },
  permissions: {
    label: '权限范围',
    widget: 'permission',
    placeholder: '请选择 API Key 权限（可选）',
    help: '若不设置，则使用角色默认权限',
    showSearch: true,
    allowClear: true,
  },
  projectId: {
    label: '项目范围',
    placeholder: '可选：限制到项目 ID',
  },
};

// 更新 API Key 的 UI Schema
const updateAPIKeyUISchema: UISchema<UpdateAPIKeyParams> = {
  name: {
    label: '名称',
    placeholder: '请输入 API Key 名称',
  },
  description: {
    label: '描述',
    widget: 'textarea',
    placeholder: '请输入 API Key 用途说明',
    rows: 3,
  },
  rateLimit: {
    label: '速率限制（次/分钟）',
    widget: 'number',
    min: 0,
    help: '0 表示无限制',
    placeholder: '每分钟最大请求次数',
  },
  dailyLimit: {
    label: '每日限额（次/天）',
    widget: 'number',
    min: 0,
    help: '0 表示无限制',
    placeholder: '每天最大请求次数',
  },
  roleId: {
    label: '绑定角色 ID',
    placeholder: '请输入角色 ID（最小权限角色）',
  },
  permissions: {
    label: '权限范围',
    widget: 'permission',
    placeholder: '请选择 API Key 权限（可选）',
    help: '若不设置，则使用角色默认权限',
    showSearch: true,
    allowClear: true,
  },
  projectId: {
    label: '项目范围',
    placeholder: '可选：限制到项目 ID',
  },
};

/**
 * API Key 表单组件（创建/编辑）
 */
export function APIKeyForm({ onSuccess, onCreateSuccess, ref }: APIKeyFormProps) {
  const queryClient = useQueryClient();
  const [isEdit, setIsEdit] = useState(false);
  const [apiKeyId, setApiKeyId] = useState<string>();
  const { msgSuccess, msgError } = useMsg();

  // 创建 mutation
  const createMutation = useMutation({
    mutationFn: createAPIKey,
    onSuccess: (data) => {
      msgSuccess('API Key 创建成功');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      onSuccess?.();
      onCreateSuccess?.(data.data.secretKey, data.data.apiKey.name);
      // eslint-disable-next-line ts/no-use-before-define
      close();
    },
    onError: (error: any) => {
      msgError(`创建失败: ${error.message}`);
    },
  });

  // 更新 mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAPIKeyParams }) => updateAPIKey(id, data),
    onSuccess: () => {
      msgSuccess('API Key 更新成功');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      onSuccess?.();
      // eslint-disable-next-line ts/no-use-before-define
      close();
    },
    onError: (error: any) => {
      msgError(`更新失败: ${error.message}`);
    },
  });

  const form = useSchemaForm({
    schema: isEdit ? UpdateAPIKeyParamsSchema : CreateAPIKeyParamsSchema,
    uiSchema: isEdit ? updateAPIKeyUISchema : createAPIKeyUISchema,
    defaultValues: {
      name: '',
      description: '',
      environment: 'live' as const,
      expiresAt: '',
      rateLimit: 0,
      dailyLimit: 0,
      roleId: '',
      permissions: [] as string[],
      projectId: '',
    },
    onSubmit: async (values) => {
      if (isEdit && apiKeyId) {
        const updateData: UpdateAPIKeyParams = {
          name: values.name,
          description: values.description,
          rateLimit: (values as UpdateAPIKeyParams).rateLimit,
          dailyLimit: (values as UpdateAPIKeyParams).dailyLimit,
          roleId: (values as UpdateAPIKeyParams).roleId || void 0,
          permissions: (values as UpdateAPIKeyParams).permissions?.length
            ? (values as UpdateAPIKeyParams).permissions
            : void 0,
          projectId: (values as UpdateAPIKeyParams).projectId || void 0,
        };
        updateMutation.mutate({ id: apiKeyId, data: updateData });
      }
      else {
        const createData = values as CreateAPIKeyParams;
        createMutation.mutate({
          ...createData,
          expiresAt: createData.expiresAt || void 0,
          roleId: createData.roleId || void 0,
          permissions: createData.permissions?.length ? createData.permissions : void 0,
          projectId: createData.projectId || void 0,
        });
      }
    },
  });

  const { open, visible, close } = useModal<APIKey>({
    beforeOpen: (opts) => {
      if (!opts?.data?.id) {
        setIsEdit(false);
        setApiKeyId(void 0);
        form.reset();
        return;
      }
      setIsEdit(true);
      setApiKeyId(opts.data.id);
      form.setValues({
        ...opts.data,
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

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      title={isEdit ? '编辑 API Key' : '创建 API Key'}
      visible={visible}
      onClose={close}
      footer={null}
      width={600}
      destroyOnHidden
    >
      <div className="mt-4">
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
      </div>
    </Modal>
  );
}
