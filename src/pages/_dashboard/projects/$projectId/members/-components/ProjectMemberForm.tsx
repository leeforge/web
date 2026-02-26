import type { ModalOpenOptions, UISchema } from '@leeforge/react-ui';
import type { Ref } from 'react';
import type { AddProjectMemberParams, ProjectMember, UpdateProjectMemberParams } from '@/api/endpoints/project.api';
import { Modal, SchemaFormRenderer, useModal, useSchemaForm } from '@leeforge/react-ui';
import { useQuery } from '@tanstack/react-query';
import { useImperativeHandle, useMemo, useState } from 'react';
import { AddProjectMemberParamsSchema, UpdateProjectMemberParamsSchema } from '@/api/endpoints/project.api';
import { getRoleList } from '@/api/endpoints/role.api';
import { useMsg } from '@/hooks';

export interface ProjectMemberFormRef {
  open: (options?: ModalOpenOptions<ProjectMember>) => void;
  close: () => void;
}

interface ProjectMemberFormProps {
  ref?: Ref<ProjectMemberFormRef>;
  onSubmit: (values: AddProjectMemberParams | UpdateProjectMemberParams, isEdit: boolean, editingId?: string) => Promise<void> | void;
  loading?: boolean;
}

export function ProjectMemberForm({ ref, onSubmit, loading }: ProjectMemberFormProps) {
  const { msgError } = useMsg();
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<string>();

  const roleListQuery = useQuery({
    queryKey: ['roles', 'member-form-options'],
    queryFn: () => getRoleList({ page: 1, pageSize: 200 }),
  });

  const roleOptions = useMemo(() => {
    const rows = roleListQuery.data?.data?.data || [];
    if (!rows.length) {
      return [
        { label: '项目管理员', value: 'role-project-admin' },
        { label: '项目成员', value: 'role-project-member' },
      ];
    }
    return rows.map(role => ({ label: `${role.name} (${role.code})`, value: role.id }));
  }, [roleListQuery.data?.data?.data]);

  const createUISchema = useMemo<UISchema<AddProjectMemberParams>>(() => ({
    userId: {
      label: '用户 ID',
      placeholder: '请输入用户 ID',
      required: true,
    },
    roleId: {
      label: '角色',
      widget: 'select',
      options: roleOptions,
      required: true,
    },
    status: {
      label: '状态',
      widget: 'select',
      options: [
        { label: '启用', value: 'active' },
        { label: '停用', value: 'inactive' },
      ],
    },
  }), [roleOptions]);

  const updateUISchema = useMemo<UISchema<UpdateProjectMemberParams>>(() => ({
    roleId: {
      label: '角色',
      widget: 'select',
      options: roleOptions,
    },
    status: {
      label: '状态',
      widget: 'select',
      options: [
        { label: '启用', value: 'active' },
        { label: '停用', value: 'inactive' },
      ],
    },
  }), [roleOptions]);

  const form = useSchemaForm({
    schema: isEdit ? UpdateProjectMemberParamsSchema : AddProjectMemberParamsSchema,
    uiSchema: isEdit ? updateUISchema : createUISchema,
    defaultValues: {
      userId: '',
      roleId: roleOptions[0]?.value || '',
      status: 'active',
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

  const { open, visible, close } = useModal<ProjectMember>({
    beforeOpen: (options) => {
      if (options?.data?.id) {
        setIsEdit(true);
        setEditingId(options.data.id);
        form.reset();
        form.setValues({
          roleId: options.data.roleId || roleOptions[0]?.value || '',
          status: options.data.status,
        });
      }
      else {
        setIsEdit(false);
        setEditingId(undefined);
        form.reset();
        form.setValues({
          userId: '',
          roleId: roleOptions[0]?.value || '',
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
      title={isEdit ? '编辑项目成员' : '添加项目成员'}
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
          submitText={isEdit ? '保存' : '添加'}
          cancelText="取消"
          showCancel
          buttonAlign="right"
        />
      </div>
    </Modal>
  );
}
