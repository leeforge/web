import type { ModalOpenOptions, UISchema } from '@leeforge/react-ui';
import type { Ref } from 'react';
import type { CreateProjectParams, Project, UpdateProjectParams } from '@/api/endpoints/project.api';
import { Modal, SchemaFormRenderer, useModal, useSchemaForm } from '@leeforge/react-ui';
import { useImperativeHandle, useState } from 'react';
import { CreateProjectParamsSchema, UpdateProjectParamsSchema } from '@/api/endpoints/project.api';
import { useMsg } from '@/hooks';

export interface ProjectFormRef {
  open: (options?: ModalOpenOptions<Project>) => void;
  close: () => void;
}

interface ProjectFormProps {
  ref?: Ref<ProjectFormRef>;
  onSubmit: (values: CreateProjectParams | UpdateProjectParams, isEdit: boolean, editingId?: string) => Promise<void> | void;
  loading?: boolean;
}

const createUISchema: UISchema<CreateProjectParams> = {
  code: {
    label: '项目编码',
    placeholder: '请输入项目编码',
    required: true,
  },
  name: {
    label: '项目名称',
    placeholder: '请输入项目名称',
    required: true,
  },
  status: {
    label: '状态',
    widget: 'select',
    options: [
      { label: '启用', value: 'active' },
      { label: '停用', value: 'inactive' },
    ],
    required: true,
  },
  description: {
    label: '描述',
    widget: 'textarea',
    rows: 3,
    placeholder: '请输入项目描述',
  },
};

const updateUISchema: UISchema<UpdateProjectParams> = {
  name: {
    label: '项目名称',
    placeholder: '请输入项目名称',
    required: true,
  },
  status: {
    label: '状态',
    widget: 'select',
    options: [
      { label: '启用', value: 'active' },
      { label: '停用', value: 'inactive' },
    ],
    required: true,
  },
  description: {
    label: '描述',
    widget: 'textarea',
    rows: 3,
    placeholder: '请输入项目描述',
  },
};

export function ProjectForm({ ref, onSubmit, loading }: ProjectFormProps) {
  const { msgError } = useMsg();
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<string>();

  const form = useSchemaForm({
    schema: isEdit ? UpdateProjectParamsSchema : CreateProjectParamsSchema,
    uiSchema: isEdit ? updateUISchema : createUISchema,
    defaultValues: {
      code: '',
      name: '',
      status: 'active',
      description: '',
    },
    onSubmit: async (values) => {
      try {
        await onSubmit(values, isEdit, editingId);
        close();
      }
      catch (error: unknown) {
        const message = error instanceof Error ? error.message : '操作失败';
        msgError(message);
      }
    },
  });

  const { open, visible, close } = useModal<Project>({
    beforeOpen: (options) => {
      if (options?.data?.id) {
        setIsEdit(true);
        setEditingId(options.data.id);
        form.reset();
        form.setValues({
          name: options.data.name,
          status: options.data.status,
          description: options.data.description || '',
        });
      }
      else {
        setIsEdit(false);
        setEditingId(undefined);
        form.reset();
        form.setValues({
          code: '',
          name: '',
          status: 'active',
          description: '',
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
      title={isEdit ? '编辑项目' : '新建项目'}
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
