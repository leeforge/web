import { LockOutlined } from '@ant-design/icons';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Alert, Button, Card, Form, Input, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { resetPasswordByToken, validateResetPasswordToken } from '@/api/endpoints/user.api';
import { useMsg } from '@/hooks';
import {
  buildResetIdentityText,
  buildResetPasswordPayload,
  extractResetTokenFromSearch,
} from './reset.helpers';

const { Title, Text } = Typography;

interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

export const Route = createFileRoute('/password/reset')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => ({
    resetJwt: extractResetTokenFromSearch(search),
  }),
});

function RouteComponent() {
  const navigate = useNavigate();
  const { resetJwt } = Route.useSearch();
  const [form] = Form.useForm<ResetPasswordFormValues>();
  const { msgSuccess, msgError } = useMsg();

  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!resetJwt) {
      setError('重置链接无效，缺少必要参数 resetJwt');
      setValidating(false);
      return;
    }

    setValidating(true);
    validateResetPasswordToken(resetJwt)
      .then((res) => {
        if (!res.data.valid) {
          setError('重置链接无效或已失效');
          return;
        }
        setUserId(res.data.userId || '');
        setEmail(res.data.email || '');
      })
      .catch((err: any) => {
        setError(err?.message || '重置链接校验失败');
      })
      .finally(() => {
        setValidating(false);
      });
  }, [resetJwt]);

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    if (!resetJwt) {
      msgError('重置链接无效');
      return;
    }

    try {
      setSubmitting(true);
      await resetPasswordByToken(buildResetPasswordPayload(resetJwt, values));

      msgSuccess({
        content: '密码重置成功，即将跳转到登录页...',
        duration: 2,
      });

      setTimeout(() => {
        navigate({ to: '/login' });
      }, 1500);
    }
    catch (err: any) {
      msgError(err?.message || '重置失败，请稍后重试');
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgPrimary">
        <Spin size="large" tip="验证重置链接..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgPrimary p-4">
        <Card className="w-full max-w-md shadow-xl rounded-2xl">
          <Alert message="重置链接无效" description={error} type="error" showIcon className="mb-4" />
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
      <Card className="w-full max-w-md shadow-xl rounded-2xl" styles={{ body: { padding: '32px 24px' } }}>
        <div className="text-center mb-8">
          <Title level={2} className="!mb-2">重置密码</Title>
          <Text type="secondary">请输入您的新登录密码</Text>
        </div>

        <Alert
          message="账号信息"
          description={buildResetIdentityText(userId, email)}
          type="info"
          showIcon
          className="mb-6"
        />

        <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
          <Form.Item
            name="password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码长度不能少于8位' },
              { max: 72, message: '密码长度不能超过72位' },
            ]}
          >
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="请输入新密码（8-72位）" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请再次输入新密码' },
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
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="请再次输入新密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={submitting} className="mt-4">
              重置密码
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
