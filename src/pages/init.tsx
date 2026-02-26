import type { UISchema } from '@leeforge/react-ui';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { SchemaForm } from '@leeforge/react-ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button, Card, Typography } from 'antd';
import { z } from 'zod';
import { useStore } from 'zustand';
import { InitializeParamsSchema } from '@/api/endpoints/init.api';
import { useModal } from '@/hooks/modules/useModal';
import { InitStore } from '@/stores';

const { Title, Text } = Typography;

export const Route = createFileRoute('/init')({
  component: InitPage,
});

// 初始化表单 Zod Schema
const initFormSchema = InitializeParamsSchema.extend({
  confirmPassword: z.string().min(6, '密码长度至少为6位'),
}).refine(data => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

type InitFormValues = z.infer<typeof initFormSchema>;

// UI Schema
const initUISchema: UISchema<InitFormValues> = {
  username: {
    label: '管理员用户名',
    prefix: <UserOutlined />,
    placeholder: '设置管理员用户名',
    required: true,
    span: 12,
  },
  nickname: {
    label: '管理员昵称',
    prefix: <UserOutlined />,
    placeholder: '设置管理员昵称',
    required: true,
    span: 12,
  },
  email: {
    label: '管理员邮箱',
    prefix: <MailOutlined />,
    placeholder: '设置管理员邮箱',
    required: true,
    span: 24,
  },
  password: {
    label: '管理员密码',
    widget: 'password',
    prefix: <LockOutlined />,
    placeholder: '设置管理员密码',
    required: true,
    span: 24,
  },
  confirmPassword: {
    label: '确认密码',
    widget: 'password',
    prefix: <LockOutlined />,
    placeholder: '请再次输入密码',
    required: true,
    span: 24,
  },
  initKey: {
    label: '系统秘钥',
    widget: 'password',
    prefix: <LockOutlined />,
    placeholder: '请输入系统秘钥',
    required: true,
    span: 24,
  },
};

function InitPage() {
  const navigate = useNavigate();
  const init = useStore(InitStore, s => s.init);
  const { modalSuccess } = useModal();

  const handleSubmit = async (values: InitFormValues) => {
    try {
      // 1. Initialize the system
      const { ok } = await init({
        username: values.username,
        nickname: values.nickname,
        email: values.email,
        password: values.password,
        initKey: values.initKey,
      });
      if (ok) {
        modalSuccess({
          title: '初始化成功',
          content: '系统初始化已完成，请点击确认前往登录。',
          okText: '去登录',
          onOk: () => navigate({ to: '/login' }),
        });
      }

      // msgSuccess('系统初始化成功');
    }
    catch (error) {
      console.error(error);
      // msgError('初始化失败，请重试');
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-bgPrimary p-4">
        <Card
          className="w-full max-w-lg shadow-xl rounded-2xl"
          styles={{ body: { padding: '32px 24px' } }}
        >
          <div className="text-center mb-8">
            <Title level={2} className="!mb-2">
              系统初始化
            </Title>
            <Text type="secondary">设置管理员账户以开始使用</Text>
          </div>

          <SchemaForm
            schema={initFormSchema}
            uiSchema={initUISchema}
            initialValues={{
              username: '',
              nickname: '',
              email: '',
              password: '',
              confirmPassword: '',
              initKey: '',
            }}
            layout={{
              layout: 'horizontal',
              labelCol: { span: 8 },
              size: 'large',
              hiddenLabel: true,
            }}
            onSubmit={handleSubmit}
            footer={(_, { isSubmitting, canSubmit }) => (
              <Button
                block
                type="primary"
                disabled={!canSubmit}
                loading={isSubmitting}
                htmlType="submit"
              >
                完成初始化
              </Button>
            )}
            className="flex flex-col gap-4"
          />
        </Card>
      </div>
    </>
  );
}
