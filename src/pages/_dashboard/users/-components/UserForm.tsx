import type { ModalOpenOptions } from '@leeforge/react-ui';
import type { Ref } from 'react';
import type {
  CreateUserParams,
  UpdateUserParams,
  User,
} from '@/api/endpoints/user.api';
import type { UISchema } from '@leeforge/react-ui';
import { Modal, useModal } from '@leeforge/react-ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useImperativeHandle, useMemo, useState } from 'react';
import {
  createUser,
  CreateUserParamsSchema,
  updateUser,
  UpdateUserParamsSchema,
} from '@/api/endpoints/user.api';
import { SchemaFormRenderer, useSchemaForm } from '@leeforge/react-ui';
import { useMsg } from '@/hooks/modules/useMsg';

export interface UserFormRef {
  open: (data?: ModalOpenOptions<User>) => void;
  close: () => void;
}

interface UserFormProps {
  ref?: Ref<UserFormRef>;
  onSuccess?: () => void;
}

// 创建用户的 UI Schema
const createUserUISchema: UISchema<CreateUserParams> = {
  username: {
    label: '用户名',
    placeholder: '请输入用户名（至少2个字符）',
    required: true,
  },
  nickname: {
    label: '昵称',
    placeholder: '请输入昵称',
  },
  email: {
    label: '邮箱',
    placeholder: '请输入邮箱地址',
    required: true,
  },
  phone: {
    label: '手机号',
    placeholder: '请输入手机号',
  },
  password: {
    label: '密码',
    widget: 'password',
    placeholder: '请输入密码（至少6个字符）',
    required: true,
  },
  avatar: {
    label: '头像 URL',
    placeholder: '请输入头像图片 URL',
  },
};

// 更新用户的 UI Schema
const updateUserUISchema: UISchema<UpdateUserParams> = {
  username: {
    label: '用户名',
    placeholder: '请输入用户名',
    disabled: true,
  },
  nickname: {
    label: '昵称',
    placeholder: '请输入昵称',
  },
  email: {
    label: '邮箱',
    placeholder: '请输入邮箱地址',
  },
  phone: {
    label: '手机号',
    placeholder: '请输入手机号',
  },
  avatar: {
    label: '头像 URL',
    placeholder: '请输入头像图片 URL',
  },
};

/**
 * 用户表单组件（创建/编辑）
 */
export function UserForm({ ref, onSuccess }: UserFormProps) {
  const queryClient = useQueryClient();
  const { msgSuccess, msgError } = useMsg();
  const [isEdit, setIsEdit] = useState(false);
  const [userId, setUserId] = useState<string>();

  const defaultValues = useMemo(() => ({
    username: '',
    nickname: '',
    email: '',
    phone: '',
    password: '',
    avatar: '',
  }), []);

  // 创建 mutation
  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      msgSuccess('用户创建成功');
      queryClient.invalidateQueries({ queryKey: ['users'] });
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
    mutationFn: ({ id, data }: { id: string; data: UpdateUserParams }) =>
      updateUser(id, data),
    onSuccess: () => {
      msgSuccess('用户更新成功');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess?.();
      // eslint-disable-next-line ts/no-use-before-define
      close();
    },
    onError: (error: any) => {
      msgError(`更新失败: ${error.message}`);
    },
  });

  const form = useSchemaForm({
    schema: isEdit ? UpdateUserParamsSchema : CreateUserParamsSchema,
    uiSchema: isEdit ? updateUserUISchema : createUserUISchema,
    defaultValues,
    onSubmit: async (values) => {
      if (isEdit && userId) {
        const updateData: UpdateUserParams = {
          username: (values as UpdateUserParams).username,
          nickname: values.nickname,
          email: values.email,
          phone: values.phone,
          avatar: values.avatar,
        };
        updateMutation.mutate({ id: userId, data: updateData });
      }
      else {
        createMutation.mutate(values as CreateUserParams);
      }
    },
  });

  const { open, visible, close } = useModal<User>({
    beforeOpen: (opts) => {
      if (!opts?.data?.id) {
        setIsEdit(false);
        setUserId(void 0);
        form.reset();
        form.setValues(defaultValues);
        return;
      }

      setIsEdit(true);
      setUserId(opts.data.id);
      form.setValues({
        username: opts.data.username,
        nickname: opts.data.nickname || '',
        email: opts.data.email,
        phone: opts.data.phone || '',
        avatar: opts.data.avatar || '',
      });
    },
    afterClose: () => {
      setIsEdit(false);
      setUserId(void 0);
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
      title={isEdit ? '编辑用户' : '新建用户'}
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
