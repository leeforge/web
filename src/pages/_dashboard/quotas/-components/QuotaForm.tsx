import type { ModalOpenOptions, UISchema } from '@leeforge/react-ui';
import type { Ref } from 'react';
import type { Quota } from '@/api/endpoints/quota.api';
import { Modal, SchemaFormRenderer, useModal, useSchemaForm } from '@leeforge/react-ui';
import { useImperativeHandle, useState } from 'react';
import { z } from 'zod';
import { useMsg } from '@/hooks';

export interface QuotaFormRef {
  open: (options?: ModalOpenOptions<Quota>) => void;
  close: () => void;
}

interface QuotaFormProps {
  ref?: Ref<QuotaFormRef>;
  scopeType: 'tenant' | 'project';
  onSubmit: (values: QuotaFormValues, isEdit: boolean, editingId?: string) => Promise<void> | void;
  loading?: boolean;
}

const createQuotaSchema = z.object({
  scopeId: z.string().min(1, '请输入范围 ID'),
  maxUsers: z.number().int().min(0).optional(),
  maxProjects: z.number().int().min(0).optional(),
  maxStorageBytes: z.number().int().min(0).optional(),
  maxApiPerDay: z.number().int().min(0).optional(),
});

const updateQuotaSchema = z.object({
  maxUsers: z.number().int().min(0).optional(),
  maxProjects: z.number().int().min(0).optional(),
  maxStorageBytes: z.number().int().min(0).optional(),
  maxApiPerDay: z.number().int().min(0).optional(),
});

export type QuotaFormValues = z.infer<typeof createQuotaSchema>;

export function QuotaForm({ ref, scopeType, onSubmit, loading }: QuotaFormProps) {
  const { msgError } = useMsg();
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<string>();

  const scopeLabel = scopeType === 'tenant' ? '租户 ID' : '项目 ID';

  const createUISchema: UISchema<QuotaFormValues> = {
    scopeId: {
      label: scopeLabel,
      placeholder: `请输入${scopeLabel}`,
      required: true,
    },
    maxUsers: {
      label: '用户上限',
      widget: 'number',
      min: 0,
    },
    maxProjects: {
      label: '项目上限',
      widget: 'number',
      min: 0,
    },
    maxStorageBytes: {
      label: '存储上限（Bytes）',
      widget: 'number',
      min: 0,
    },
    maxApiPerDay: {
      label: 'API 日限额',
      widget: 'number',
      min: 0,
    },
  };

  const updateUISchema: UISchema<z.infer<typeof updateQuotaSchema>> = {
    maxUsers: {
      label: '用户上限',
      widget: 'number',
      min: 0,
    },
    maxProjects: {
      label: '项目上限',
      widget: 'number',
      min: 0,
    },
    maxStorageBytes: {
      label: '存储上限（Bytes）',
      widget: 'number',
      min: 0,
    },
    maxApiPerDay: {
      label: 'API 日限额',
      widget: 'number',
      min: 0,
    },
  };

  const form = useSchemaForm({
    schema: isEdit ? updateQuotaSchema : createQuotaSchema,
    uiSchema: isEdit ? updateUISchema : createUISchema,
    defaultValues: {
      scopeId: '',
      maxUsers: undefined,
      maxProjects: undefined,
      maxStorageBytes: undefined,
      maxApiPerDay: undefined,
    },
    onSubmit: async (values) => {
      try {
        await onSubmit(values as QuotaFormValues, isEdit, editingId);
        close();
      }
      catch (error: unknown) {
        const message = error instanceof Error ? error.message : '操作失败';
        msgError(message);
      }
    },
  });

  const { open, visible, close } = useModal<Quota>({
    beforeOpen: (options) => {
      if (options?.data?.id) {
        setIsEdit(true);
        setEditingId(options.data.id);
        form.reset();
        form.setValues({
          maxUsers: options.data.maxUsers,
          maxProjects: options.data.maxProjects,
          maxStorageBytes: options.data.maxStorageBytes,
          maxApiPerDay: options.data.maxApiPerDay,
        });
      }
      else {
        setIsEdit(false);
        setEditingId(undefined);
        form.reset();
      }
    },
    afterClose: () => {
      setIsEdit(false);
      setEditingId(undefined);
      form.reset();
    },
  });

  useImperativeHandle(ref, () => ({
    open,
    close,
  }), [close, open]);

  return (
    <Modal
      title={isEdit ? '编辑配额' : '新建配额'}
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
          submitText={isEdit ? '保存' : '创建'}
          cancelText="取消"
          showCancel
          buttonAlign="right"
        />
      </div>
    </Modal>
  );
}
