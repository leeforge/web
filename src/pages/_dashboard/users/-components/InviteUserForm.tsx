import type { ModalOpenOptions } from '@leeforge/react-ui';
import type { Ref } from 'react';
import type {
  InvitationResponse,
  InviteUserParams,
} from '@/api/endpoints/user.api';
import { Modal, useModal } from '@leeforge/react-ui';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Form, Input, Select } from 'antd';
import { useMemo, useImperativeHandle } from 'react';
import { useStore } from 'zustand';
import { normalizePaginatedPayload } from '@/api/adapters/paginated';
import { getRoleList } from '@/api/endpoints/role.api';
import { getTenantList } from '@/api/endpoints/tenant.api';
import { inviteUser, InviteUserParamsSchema } from '@/api/endpoints/user.api';
import { useMsg } from '@/hooks/modules/useMsg';
import { AuthStore } from '@/stores';
import { DomainTypeSelectField } from './DomainTypeSelectField';
import { TenantSelectField } from './TenantSelectField';

export interface InviteUserFormRef {
  open: (data?: ModalOpenOptions<InviteUserParams>) => void;
  close: () => void;
}

interface InviteUserFormProps {
  ref?: Ref<InviteUserFormRef>;
  onSuccess: (invitationData: InvitationResponse) => void;
}

/**
 * 邀请用户表单组件
 */
export function InviteUserForm({
  ref,
  onSuccess,
}: InviteUserFormProps) {
  const { msgSuccess, msgError } = useMsg();
  const actingDomain = useStore(AuthStore, state => state.actingDomain);
  const [form] = Form.useForm<InviteUserParams>();
  const selectedDomainType = Form.useWatch('domainType', form);

  const initialValues: InviteUserParams = {
    username: '',
    email: '',
    domainType: 'platform',
    domainKey: 'root',
    roleIds: [],
  };

  const rolesQuery = useQuery({
    queryKey: ['roles', 'invite-form-options'],
    queryFn: () => getRoleList({ page: 1, pageSize: 200 }).then(res => normalizePaginatedPayload(res, { defaultPageSize: 200 })),
  });
  const tenantsQuery = useQuery({
    queryKey: ['tenants', 'invite-form-options'],
    queryFn: () => getTenantList({ page: 1, pageSize: 200 }).then(res => normalizePaginatedPayload(res, { defaultPageSize: 200 })),
  });

  const roleOptions = useMemo(() => (
    rolesQuery.data?.list || []
  ).map(role => ({
    label: `${role.name} (${role.code})`,
    value: role.id,
  })), [rolesQuery.data?.list]);

  const tenantOptions = useMemo(() => (
    tenantsQuery.data?.list || []
  ).map(tenant => ({
    label: `${tenant.name} (${tenant.id})`,
    value: tenant.id,
  })), [tenantsQuery.data?.list]);

  const inviteMutation = useMutation({
    mutationFn: inviteUser,
    onSuccess: (data) => {
      msgSuccess('邀请创建成功');
      onSuccess(data);
      // eslint-disable-next-line ts/no-use-before-define
      close();
    },
    onError: (error: any) => {
      msgError(`邀请失败: ${error.message}`);
    },
  });

  const handleSubmit = (values: InviteUserParams) => {
    const payload: InviteUserParams = {
      ...values,
      domainKey: values.domainType === 'platform' ? 'root' : values.domainKey,
    };

    const parsed = InviteUserParamsSchema.safeParse(payload);
    if (!parsed.success) {
      msgError(parsed.error.issues[0]?.message || '邀请参数不正确');
      return;
    }

    inviteMutation.mutate(parsed.data);
  };

  const handleDomainTypeChange = (value: 'platform' | 'tenant') => {
    if (value === 'platform') {
      form.setFieldValue('domainKey', 'root');
      return;
    }

    const defaultTenantId = actingDomain?.type === 'tenant'
      ? actingDomain.key
      : (tenantOptions[0]?.value || '');
    form.setFieldValue('domainKey', defaultTenantId);
  };

  const { open, visible, close } = useModal<InviteUserParams>({
    beforeOpen: (opts) => {
      const domainType = actingDomain?.type === 'tenant' ? 'tenant' : 'platform';
      const domainKey = domainType === 'tenant'
        ? (actingDomain?.key || tenantOptions[0]?.value || '')
        : 'root';
      form.resetFields();
      form.setFieldsValue({
        ...initialValues,
        domainType,
        domainKey,
        ...opts?.data,
      });
    },
    afterClose: () => {
      form.resetFields();
    },
  });

  useImperativeHandle(ref, () => ({
    open,
    close,
  }), [close, open]);

  return (
    <Modal
      title="邀请用户"
      visible={visible}
      onClose={close}
      footer={null}
      width={600}
      destroyOnHidden
    >
      <div className="mt-4">
        <Form<InviteUserParams>
          form={form}
          layout="vertical"
          initialValues={initialValues}
          onFinish={handleSubmit}
        >
          <DomainTypeSelectField onChange={handleDomainTypeChange} />

          <TenantSelectField
            visible={selectedDomainType === 'tenant'}
            loading={tenantsQuery.isFetching}
            options={tenantOptions}
          />

          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, message: '用户名长度不能少于2位' },
            ]}
          >
            <Input placeholder="请输入用户名（至少2位）" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input placeholder="请输入邮箱地址" />
          </Form.Item>

          <Form.Item
            name="roleIds"
            label="角色"
            rules={[{ required: true, message: '请至少选择一个角色' }]}
          >
            <Select
              mode="multiple"
              showSearch
              optionFilterProp="label"
              placeholder="请选择角色"
              options={roleOptions}
              loading={rolesQuery.isFetching}
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={close}>取消</Button>
            <Button type="primary" htmlType="submit" loading={inviteMutation.isPending}>
              创建邀请
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
