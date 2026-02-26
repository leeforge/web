import type { ActivateUserParams } from '@/api/endpoints/user.api';
import { LockOutlined } from '@ant-design/icons';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Alert, Button, Card, Form, Input, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { activateUser, validateInvitation } from '@/api/endpoints/user.api';
import { useMsg } from '@/hooks';

const { Title, Text } = Typography;

export const Route = createFileRoute('/invitation/activate')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      inviteJwt: (search.inviteJwt as string) || (search.token as string) || '',
    };
  },
});

interface ActivateFormValues {
  nickname: string;
  password: string;
  confirmPassword: string;
}

function RouteComponent() {
  const navigate = useNavigate();
  const { inviteJwt } = Route.useSearch();
  const [form] = Form.useForm<ActivateFormValues>();
  const { msgSuccess, msgError } = useMsg();

  const [activating, setActivating] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitedUsername, setInvitedUsername] = useState<string>('');
  const [invitedEmail, setInvitedEmail] = useState<string>('');

  useEffect(() => {
    if (!inviteJwt) {
      setError('邀请链接无效，缺少必要参数 inviteJwt');
      setValidating(false);
      return;
    }

    setValidating(true);
    validateInvitation(inviteJwt)
      .then((res) => {
        if (!res.data.valid) {
          setError('邀请链接无效或已失效');
          return;
        }
        setInvitedUsername(res.data.username);
        setInvitedEmail(res.data.email);
      })
      .catch((err: any) => {
        setError(err?.message || '邀请链接校验失败');
      })
      .finally(() => {
        setValidating(false);
      });
  }, [inviteJwt]);

  const handleSubmit = async (values: ActivateFormValues) => {
    if (!inviteJwt) {
      msgError('邀请链接无效');
      return;
    }

    try {
      setActivating(true);

      const params: ActivateUserParams = {
        inviteJwt,
        nickname: values.nickname,
        password: values.password,
        confirmPassword: values.confirmPassword,
      };

      await activateUser(params);

      msgSuccess({
        content: '账号激活成功，即将跳转到登录页...',
        duration: 2,
      });

      // 延迟跳转
      setTimeout(() => {
        navigate({ to: '/login' });
      }, 1500);
    }
    catch (error: any) {
      const errorMessage = error.message || '激活失败，请稍后重试';
      msgError(errorMessage);
      setActivating(false);
    }
  };

  // 加载中
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgPrimary">
        <Spin size="large" tip="验证邀请链接..." />
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgPrimary p-4">
        <Card className="w-full max-w-md shadow-xl rounded-2xl">
          <Alert
            message="邀请链接无效"
            description={error}
            type="error"
            showIcon
            className="mb-4"
          />
          <div className="text-center">
            <Link to="/login">
              <Button type="primary">返回登录</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bgPrimary p-4">
      <Card
        className="w-full max-w-md shadow-xl rounded-2xl"
        styles={{ body: { padding: '32px 24px' } }}
      >
        <div className="text-center mb-8">
          <Title level={2} className="!mb-2">
            激活账号
          </Title>
          <Text type="secondary">设置您的登录密码</Text>
        </div>

        <Alert
          message="欢迎加入"
          description={invitedEmail
            ? `受邀用户名：${invitedUsername || '-'}，受邀邮箱：${invitedEmail}`
            : '请完善账号信息并设置密码以激活账号'}
          type="info"
          showIcon
          className="mb-6"
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="nickname"
            label="昵称"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input size="large" placeholder="请输入昵称" />
          </Form.Item>

          <Form.Item
            name="password"
            label="设置密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 8, message: '密码长度不能少于8位' },
              { max: 72, message: '密码长度不能超过72位' },
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="请输入密码（8-72位）"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请再次输入密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次密码输入不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="请再次输入密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={activating}
              className="mt-4"
            >
              激活账号
            </Button>
          </Form.Item>

          <div className="text-center mt-4">
            <Text>
              已有账户？
              {' '}
              <Link to="/login" className="text-primary-9! hover:text-primary-6!">
                立即登录
              </Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
}
