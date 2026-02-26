import type { ModalOpenOptions, UISchema } from '@leeforge/react-ui';
import type { Ref } from 'react';
import type { CreateRoleBindingParams, RoleBinding, UpdateRoleBindingParams } from '@/api/endpoints/role-binding.api';
import { Modal, SchemaFormRenderer, useModal, useSchemaForm } from '@leeforge/react-ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useImperativeHandle, useMemo, useState } from 'react';
import { normalizePaginatedPayload } from '@/api/adapters/paginated';
import { CreateRoleBindingParamsSchema, UpdateRoleBindingParamsSchema, createRoleBinding, updateRoleBinding } from '@/api/endpoints/role-binding.api';
import { getRoleList } from '@/api/endpoints/role.api';
import { getTenantList } from '@/api/endpoints/tenant.api';
import { getUserList } from '@/api/endpoints/user.api';
import { useMsg } from '@/hooks';

export interface RoleBindingFormRef {
  open: (options?: ModalOpenOptions<RoleBinding>) => void;
  close: () => void;
}

interface RoleBindingFormProps {
  ref?: Ref<RoleBindingFormRef>;
  onSuccess?: () => void;
}

export function RoleBindingForm({ ref, onSuccess }: RoleBindingFormProps) {
  const queryClient = useQueryClient();
  const { msgSuccess, msgError } = useMsg();
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<string>();

  const rolesQuery = useQuery({
    queryKey: ['roles', 'binding-form-options'],
    queryFn: () => getRoleList({ page: 1, pageSize: 200 }),
  });

  const usersQuery = useQuery({
    queryKey: ['users', 'binding-form-options'],
    queryFn: () => getUserList({ page: 1, pageSize: 200 }),
  });

  const tenantsQuery = useQuery({
    queryKey: ['tenants', 'binding-form-options'],
    queryFn: () => getTenantList({ page: 1, pageSize: 200 }),
  });

  const roleOptions = useMemo(() => {
    const roles = rolesQuery.data?.data?.data || [];
    if (!roles.length) {
      return [
        { label: '项目管理员(project_admin)', value: 'role-project-admin' },
        { label: '项目成员(project_member)', value: 'role-project-member' },
      ];
    }
    return roles.map(role => ({ label: `${role.name} (${role.code})`, value: role.id }));
  }, [rolesQuery.data?.data?.data]);

  const subjectOptions = useMemo(() => {
    const users = usersQuery.data?.data?.data || [];
    if (!users.length) {
      return [{ label: 'admin (user-admin)', value: 'user-admin' }];
    }
    return users.map(user => ({ label: `${user.username} (${user.id})`, value: user.id }));
  }, [usersQuery.data?.data?.data]);

  const scopeIdOptions = useMemo(() => {
    const tenants = tenantsQuery.data?.data?.data || [];
    return [
      { label: 'platform:root', value: 'root' },
      ...tenants.map(tenant => ({
        label: `${tenant.name} (${tenant.id})`,
        value: tenant.id,
      })),
    ];
  }, [tenantsQuery.data?.data?.data]);

  const createUISchema = useMemo<UISchema<CreateRoleBindingParams>>(() => ({
    subjectType: {
      label: '主体类型',
      widget: 'select',
      options: [
        { label: 'user', value: 'user' },
        { label: 'group（待后端支持）', value: 'group' },
      ],
      required: true,
    },
    subjectId: {
      label: '主体',
      widget: 'select',
      options: subjectOptions,
      showSearch: true,
      required: true,
    },
    roleId: {
      label: '角色',
      widget: 'select',
      options: roleOptions,
      showSearch: true,
      required: true,
    },
    scopeDomain: {
      label: '范围域',
      widget: 'select',
      options: [
        { label: 'platform', value: 'platform' },
        { label: 'tenant', value: 'tenant' },
        { label: 'project', value: 'project' },
      ],
      required: true,
    },
    scopeId: {
      label: '范围 ID',
      widget: 'select',
      options: scopeIdOptions,
      showSearch: true,
      required: true,
    },
    scopeType: {
      label: '范围策略',
      widget: 'select',
      options: [
        { label: 'CURRENT', value: 'CURRENT' },
        { label: 'DESCENDANTS', value: 'DESCENDANTS' },
        { label: 'ASSIGNED_SET', value: 'ASSIGNED_SET' },
      ],
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
  }), [subjectOptions, roleOptions, scopeIdOptions]);

  const updateUISchema = useMemo<UISchema<UpdateRoleBindingParams>>(() => ({
    roleId: {
      label: '角色',
      widget: 'select',
      options: roleOptions,
      showSearch: true,
    },
    scopeType: {
      label: '范围策略',
      widget: 'select',
      options: [
        { label: 'CURRENT', value: 'CURRENT' },
        { label: 'DESCENDANTS', value: 'DESCENDANTS' },
        { label: 'ASSIGNED_SET', value: 'ASSIGNED_SET' },
      ],
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

  const createMutation = useMutation({
    mutationFn: (payload: CreateRoleBindingParams) => createRoleBinding(payload),
    onSuccess: () => {
      msgSuccess('角色绑定创建成功');
      queryClient.invalidateQueries({ queryKey: ['governance', 'role-bindings'] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      msgError(error.message || '角色绑定创建失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRoleBindingParams }) => updateRoleBinding(id, payload),
    onSuccess: () => {
      msgSuccess('角色绑定更新成功');
      queryClient.invalidateQueries({ queryKey: ['governance', 'role-bindings'] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      msgError(error.message || '角色绑定更新失败');
    },
  });

  const form = useSchemaForm({
    schema: isEdit ? UpdateRoleBindingParamsSchema : CreateRoleBindingParamsSchema,
    uiSchema: isEdit ? updateUISchema : createUISchema,
    defaultValues: {
      subjectType: 'user',
      subjectId: subjectOptions[0]?.value || '',
      roleId: roleOptions[0]?.value || '',
      scopeDomain: 'platform',
      scopeId: 'root',
      scopeType: 'CURRENT',
      status: 'active',
    },
    onSubmit: async (values) => {
      if (isEdit && editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          payload: values as UpdateRoleBindingParams,
        });
        close();
        return;
      }

      await createMutation.mutateAsync(values as CreateRoleBindingParams);
      close();
    },
  });

  const { open, visible, close } = useModal<RoleBinding>({
    beforeOpen: (options) => {
      if (options?.data?.id) {
        setIsEdit(true);
        setEditingId(options.data.id);
        form.reset();
        form.setValues({
          roleId: options.data.roleId,
          scopeType: options.data.scopeType,
          status: options.data.status || 'active',
        });
      }
      else {
        setIsEdit(false);
        setEditingId(undefined);
        form.reset();
        form.setValues({
          subjectType: 'user',
          subjectId: subjectOptions[0]?.value || '',
          roleId: roleOptions[0]?.value || '',
          scopeDomain: 'platform',
          scopeId: 'root',
          scopeType: 'CURRENT',
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

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      title={isEdit ? '编辑绑定' : '新建绑定'}
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
          loading={isPending}
          onCancel={close}
          submitText={isEdit ? '更新' : '创建'}
          cancelText="取消"
          showCancel
          buttonAlign="right"
        />
      </div>
    </Modal>
  );
}
