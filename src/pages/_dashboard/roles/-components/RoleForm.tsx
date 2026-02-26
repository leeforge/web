import type { ModalOpenOptions, UISchema } from '@leeforge/react-ui';
import type { Ref } from 'react';
import type {
  CreateRoleParams,
  Role,
  UpdateRoleParams,
} from '@/api/endpoints/role.api';
import { Modal, SchemaFormRenderer, useModal, useSchemaForm } from '@leeforge/react-ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Spin } from 'antd';
import { useEffect, useImperativeHandle, useMemo, useState } from 'react';
import {
  createRole,
  CreateRoleParamsSchema,
  getRoleById,
  updateRole,
  UpdateRoleParamsSchema,
} from '@/api/endpoints/role.api';
import { useMsg } from '@/hooks/modules/useMsg';
import { buildCreateRolePayload, buildUpdateRolePayload } from './role-form.helpers';

export interface RoleFormRef {
  open: (data?: ModalOpenOptions<Role>) => void;
  close: () => void;
}

interface RoleFormProps {
  ref?: Ref<RoleFormRef>;
  onSuccess?: () => void;
}

// 创建角色的 UI Schema
const createRoleUISchema: UISchema<CreateRoleParams> = {
  name: {
    label: '角色名称',
    placeholder: '请输入角色名称',
    required: true,
  },
  code: {
    label: '角色编码',
    placeholder: '请输入角色编码（唯一标识）',
    required: true,
  },
  description: {
    label: '描述',
    widget: 'textarea',
    placeholder: '请输入角色描述',
    rows: 3,
  },
  defaultDataScope: {
    label: '默认数据范围',
    widget: 'select',
    required: true,
    options: [
      { label: '全部数据 (ALL)', value: 'ALL' },
      { label: '仅本人数据 (SELF)', value: 'SELF' },
      { label: '本组织数据 (OU_SELF)', value: 'OU_SELF' },
      { label: '本组织及子组织 (OU_SUBTREE)', value: 'OU_SUBTREE' },
    ],
  },
  sort: {
    label: '排序',
    widget: 'number',
    min: 0,
    placeholder: '数字越小越靠前',
  },
};

// 更新角色的 UI Schema
const updateRoleUISchema: UISchema<UpdateRoleParams> = {
  name: {
    label: '角色名称',
    placeholder: '请输入角色名称',
  },
  description: {
    label: '描述',
    widget: 'textarea',
    placeholder: '请输入角色描述',
    rows: 3,
  },
  defaultDataScope: {
    label: '默认数据范围',
    widget: 'select',
    options: [
      { label: '全部数据 (ALL)', value: 'ALL' },
      { label: '仅本人数据 (SELF)', value: 'SELF' },
      { label: '本组织数据 (OU_SELF)', value: 'OU_SELF' },
      { label: '本组织及子组织 (OU_SUBTREE)', value: 'OU_SUBTREE' },
    ],
  },
  sort: {
    label: '排序',
    widget: 'number',
    min: 0,
    placeholder: '数字越小越靠前',
  },
};

/**
 * 角色表单组件（创建/编辑）
 */
export function RoleForm({ ref, onSuccess }: RoleFormProps) {
  const queryClient = useQueryClient();
  const { msgSuccess, msgError } = useMsg();
  const [isEdit, setIsEdit] = useState(false);
  const [roleId, setRoleId] = useState<string>();
  const [roleData, setRoleData] = useState<Role>();

  const defaultValues = useMemo(() => ({
    name: '',
    code: '',
    description: '',
    sort: 0,
    defaultDataScope: 'SELF' as const,
  }), []);

  const roleDetailQuery = useQuery({
    queryKey: ['roles', roleId, 'detail'],
    queryFn: () => getRoleById(roleId || ''),
    enabled: isEdit && !!roleId,
    retry: false,
  });
  const resolvedRole = roleDetailQuery.data?.data ?? roleData;

  // 创建 mutation
  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      msgSuccess('角色创建成功');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
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
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleParams }) =>
      updateRole(id, data),
    onSuccess: () => {
      msgSuccess('角色更新成功');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      onSuccess?.();
      // eslint-disable-next-line ts/no-use-before-define
      close();
    },
    onError: (error: any) => {
      msgError(`更新失败: ${error.message}`);
    },
  });

  const form = useSchemaForm({
    schema: isEdit ? UpdateRoleParamsSchema : CreateRoleParamsSchema,
    uiSchema: isEdit ? updateRoleUISchema : createRoleUISchema,
    defaultValues,
    onSubmit: async (values) => {
      if (isEdit && roleId) {
        const updateData = buildUpdateRolePayload({
          name: values.name,
          description: values.description,
          sort: (values as UpdateRoleParams).sort,
          defaultDataScope: (values as UpdateRoleParams).defaultDataScope,
        });
        updateMutation.mutate({ id: roleId, data: updateData });
      }
      else {
        createMutation.mutate(buildCreateRolePayload(values as CreateRoleParams));
      }
    },
  });

  const { open, visible, close } = useModal<Role>({
    beforeOpen: (opts) => {
      if (!opts?.data?.id) {
        setIsEdit(false);
        setRoleId(void 0);
        setRoleData(void 0);
        form.reset();
        form.setValues(defaultValues);
        return;
      }

      setIsEdit(true);
      setRoleId(opts.data.id);
      setRoleData(opts.data);
      form.setValues({
        name: opts.data.name,
        description: opts.data.description || '',
        sort: opts.data.sort || 0,
        defaultDataScope: opts.data.defaultDataScope || 'SELF',
      });
    },
    afterClose: () => {
      setIsEdit(false);
      setRoleId(void 0);
      setRoleData(void 0);
      form.reset();
    },
  });

  useImperativeHandle(ref, () => ({
    open,
    close,
  }), [close, open]);

  useEffect(() => {
    if (visible && isEdit && resolvedRole) {
      form.setValues({
        name: resolvedRole.name,
        description: resolvedRole.description || '',
        sort: resolvedRole.sort || 0,
        defaultDataScope: resolvedRole.defaultDataScope || 'SELF',
      });
    }
  }, [form, isEdit, resolvedRole, visible]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isDetailLoading = visible && isEdit && roleDetailQuery.isLoading;

  return (
    <Modal
      title={isEdit ? '编辑角色' : '新建角色'}
      visible={visible}
      onClose={close}
      footer={null}
      width={500}
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
