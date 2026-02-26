import type { ModalOpenOptions, UISchema } from '@leeforge/react-ui';
import type { Ref } from 'react';
import type { ShareGrant } from '@/api/endpoints/share-grant.api';
import { Modal, SchemaFormRenderer, useModal, useSchemaForm } from '@leeforge/react-ui';
import { useImperativeHandle, useMemo, useState } from 'react';
import { z } from 'zod';
import { useMsg } from '@/hooks';

export interface ShareGrantFormRef {
  open: (options?: ModalOpenOptions<ShareGrant>) => void;
  close: () => void;
}

export interface ShareGrantFormValues {
  sourceDomainType: string;
  sourceDomainKey: string;
  sourceProjectId?: string;
  targetDomainType: string;
  targetDomainKey: string;
  targetProjectId?: string;
  resourceType: string;
  resourceId: string;
  accessLevel: 'read' | 'fork' | 'sync';
  status: 'active' | 'inactive';
}

interface ShareGrantFormProps {
  ref?: Ref<ShareGrantFormRef>;
  defaultDomainType?: string;
  defaultDomainKey?: string;
  onSubmit: (values: ShareGrantFormValues, isEdit: boolean, editingId?: string) => Promise<void> | void;
}

const createShareGrantSchema = z.object({
  sourceDomainType: z.string().min(1, '来源域类型不能为空'),
  sourceDomainKey: z.string().min(1, '来源域标识不能为空'),
  sourceProjectId: z.string().optional(),
  targetDomainType: z.string().min(1, '目标域类型不能为空'),
  targetDomainKey: z.string().min(1, '目标域标识不能为空'),
  targetProjectId: z.string().optional(),
  resourceType: z.string().min(1, '资源类型不能为空'),
  resourceId: z.string().min(1, '资源 ID 不能为空'),
  accessLevel: z.enum(['read', 'fork', 'sync']),
  status: z.enum(['active', 'inactive']),
});

const updateShareGrantSchema = z.object({
  sourceDomainType: z.string().min(1, '来源域类型不能为空'),
  sourceDomainKey: z.string().min(1, '来源域标识不能为空'),
  sourceProjectId: z.string().optional(),
  targetDomainType: z.string().min(1, '目标域类型不能为空'),
  targetDomainKey: z.string().min(1, '目标域标识不能为空'),
  targetProjectId: z.string().optional(),
  resourceType: z.string().min(1, '资源类型不能为空'),
  resourceId: z.string().min(1, '资源 ID 不能为空'),
  accessLevel: z.enum(['read', 'fork', 'sync']),
  status: z.enum(['active', 'inactive']),
});

const domainTypeOptions = [
  { label: 'platform', value: 'platform' },
  { label: 'tenant', value: 'tenant' },
  { label: 'project', value: 'project' },
];

const accessLevelOptions = [
  { label: 'read', value: 'read' },
  { label: 'fork', value: 'fork' },
  { label: 'sync', value: 'sync' },
];

const statusOptions = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
];

export function ShareGrantForm({ ref, defaultDomainType = 'platform', defaultDomainKey = 'root', onSubmit }: ShareGrantFormProps) {
  const { msgError } = useMsg();
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<string>();

  const uiSchema = useMemo<UISchema<ShareGrantFormValues>>(() => ({
    sourceDomainType: {
      label: '来源域类型',
      widget: 'select',
      options: domainTypeOptions,
      required: true,
    },
    sourceDomainKey: {
      label: '来源域 Key',
      required: true,
    },
    sourceProjectId: {
      label: '来源项目',
      placeholder: '可选',
    },
    targetDomainType: {
      label: '目标域类型',
      widget: 'select',
      options: domainTypeOptions,
      required: true,
    },
    targetDomainKey: {
      label: '目标域 Key',
      required: true,
    },
    targetProjectId: {
      label: '目标项目',
      placeholder: '可选',
    },
    resourceType: {
      label: '资源类型',
      placeholder: '例如 cms.media',
      required: true,
    },
    resourceId: {
      label: '资源 ID',
      required: true,
    },
    accessLevel: {
      label: '访问级别',
      widget: 'select',
      options: accessLevelOptions,
      required: true,
    },
    status: {
      label: '状态',
      widget: 'select',
      options: statusOptions,
      required: true,
    },
  }), []);

  const form = useSchemaForm({
    schema: isEdit ? updateShareGrantSchema : createShareGrantSchema,
    uiSchema,
    defaultValues: {
      sourceDomainType: defaultDomainType,
      sourceDomainKey: defaultDomainKey,
      targetDomainType: defaultDomainType,
      targetDomainKey: defaultDomainKey,
      accessLevel: 'read',
      status: 'active',
    },
    onSubmit: async (values) => {
      try {
        await onSubmit(values as ShareGrantFormValues, isEdit, editingId);
        close();
      }
      catch (error: unknown) {
        const message = error instanceof Error ? error.message : '操作失败';
        msgError(message);
      }
    },
  });

  const { open, visible, close } = useModal<ShareGrant>({
    beforeOpen: (options) => {
      if (options?.data?.id) {
        setIsEdit(true);
        setEditingId(options.data.id);
        form.reset();
        form.setValues({
          sourceDomainType: options.data.sourceDomainType || 'platform',
          sourceDomainKey: options.data.sourceDomainKey || 'root',
          sourceProjectId: options.data.sourceProjectId || '',
          targetDomainType: options.data.targetDomainType || 'platform',
          targetDomainKey: options.data.targetDomainKey || 'root',
          targetProjectId: options.data.targetProjectId || '',
          resourceType: options.data.resourceType,
          resourceId: options.data.resourceId,
          accessLevel: options.data.accessLevel,
          status: options.data.status,
        });
      }
      else {
        setIsEdit(false);
        setEditingId(undefined);
        form.reset();
        form.setValues({
          sourceDomainType: defaultDomainType,
          sourceDomainKey: defaultDomainKey,
          targetDomainType: defaultDomainType,
          targetDomainKey: defaultDomainKey,
          accessLevel: 'read',
          status: 'active',
        });
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
      title={isEdit ? '编辑共享授权' : '新建共享授权'}
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
