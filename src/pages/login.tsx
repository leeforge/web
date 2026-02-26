import type { UISchema } from '@leeforge/react-ui';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { SchemaForm } from '@leeforge/react-ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button, Card, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useStore } from 'zustand';
import { useCaptcha, useMsg } from '@/hooks';
import { AuthStore } from '@/stores';

const { Title, Text } = Typography;

interface LoginFormValues {
  username: string;
  password: string;
  captcha?: string;
  rememberMe: boolean;
}

export const Route = createFileRoute('/login')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const login = useStore(AuthStore, s => s.login);
  const [loginLoading, setLoginLoading] = useState(false);
  const { msgSuccess, msgError } = useMsg();
  const {
    captchaId,
    refreshCaptcha,
    widgetProps,
  } = useCaptcha({ queryKey: ['loginCaptcha'] });
  const isCaptchaDisabled = captchaId === 'disabled';

  const loginFormSchema = useMemo(() => z.object({
    username: z.string().min(1, '请输入用户名').min(3, '用户名至少3个字符'),
    password: z.string().min(1, '请输入密码').min(6, '密码至少6个字符'),
    captcha: isCaptchaDisabled
      ? z.string().optional()
      : z.string().min(1, '请输入验证码'),
    rememberMe: z.boolean().default(false),
  }), [isCaptchaDisabled]);

  const loginUISchema = useMemo<UISchema<LoginFormValues>>(() => ({
    username: {
      label: '用户名',
      prefix: <UserOutlined />,
      placeholder: '请输入用户名',
      required: true,
    },
    password: {
      label: '密码',
      widget: 'password',
      prefix: <LockOutlined />,
      placeholder: '请输入密码',
      required: true,
    },
    ...(isCaptchaDisabled ? {} : {
      captcha: {
        label: '验证码',
        widget: 'captcha',
        placeholder: '请输入验证码',
        required: true,
        widgetProps,
      },
    })
    // rememberMe: {
    //   label: '记住我',
    //   widget: 'switch',
    // },
  }), [isCaptchaDisabled, widgetProps]);

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      setLoginLoading(true);
      const { ok } = await login({
        username: values.username,
        password: values.password,
        rememberMe: values.rememberMe,
        ...(isCaptchaDisabled ? {} : {
          captchaId,
          captchaAnswer: values.captcha,
        }),
      });
      if (ok) {
        msgSuccess('登录成功');
        setTimeout(() => {
          navigate({ to: '/' });
          setLoginLoading(false);
        }, 800);
      }
      else {
        void refreshCaptcha();
        setTimeout(() => {
          setLoginLoading(false);
        }, 800);
      }
    }
    catch {
      setLoginLoading(false);
      void refreshCaptcha();
      msgError('登录失败，请检查用户名和密码');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bgPrimary">
      <Card
        className="w-full max-w-md shadow-xl rounded-2xl"
        styles={{ body: { padding: '32px 24px' } }}
      >
        <div className="text-center mb-8">
          <Title level={2} className="!mb-2">
            欢迎回来
          </Title>
          <Text type="secondary">请登录您的账户</Text>
        </div>

        <SchemaForm
          schema={loginFormSchema}
          uiSchema={loginUISchema}
          layout={{ layout: 'vertical', size: 'large' }}
          initialValues={{
            username: '',
            password: '',
            captcha: '',
            rememberMe: false,
          }}
          onSubmit={handleSubmit}
          loading={loginLoading}
          footer={(_, { isSubmitting, canSubmit }) => (
            <Button
              block
              type="primary"
              disabled={!canSubmit}
              loading={isSubmitting}
              htmlType="submit"
            >
              登录
            </Button>
          )}
        />
      </Card>
    </div>
  );
}
