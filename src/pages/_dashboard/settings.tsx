import { createFileRoute } from '@tanstack/react-router';
import { Button, Card, Form, Input, Space, Switch, Typography } from 'antd';
import { useState } from 'react';
import CustomIcon from '@/components/CustomIcon/CustomIcon';

const { Title, Text } = Typography;

export const Route = createFileRoute('/_dashboard/settings')({
  component: RouteComponent,
});

function RouteComponent() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 模拟设置数据
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: false,
    darkMode: false,
    language: 'zh-CN',
  });

  const onFinish = (values: any) => {
    setLoading(true);
    // 模拟保存设置
    setTimeout(() => {
      console.log('保存设置:', values);
      setSettings({ ...settings, ...values });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="content-box-default">
      <div className="mb-6">
        <Title level={2} className="text-textBaseColor mb-2">
          <CustomIcon icon="line-md:settings" className="mr-2" />
          系统设置
        </Title>
        <Text type="secondary">管理您的系统偏好和通知设置</Text>
      </div>

      <Card className="shadow-sm">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={settings}
          autoComplete="off"
        >
          <Form.Item
            label="通知设置"
            name="notifications"
            valuePropName="checked"
          >
            <Switch
              unCheckedChildren={<CustomIcon icon="line-md:bell-off" />}
            />
          </Form.Item>

          <Form.Item
            label="邮件更新"
            name="emailUpdates"
            valuePropName="checked"
          >
            <Switch
              unCheckedChildren={<CustomIcon icon="line-md:email-off" />}
            />
          </Form.Item>

          <Form.Item
            label="语言"
            name="language"
            rules={[{ required: true, message: '请选择语言' }]}
          >
            <Input
              prefix={<CustomIcon icon="line-md:translate" />}
              placeholder="选择语言"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存设置
              </Button>
              <Button onClick={() => form.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 快捷操作 */}
      <div className="mt-6">
        <Title level={4} className="text-textBaseColor mb-4">
          快捷操作
        </Title>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => console.log('清除缓存')}
          >
            <div className="flex items-center gap-3">
              <CustomIcon
                icon="line-md:download"
                className="text-xl text-primary-6"
              />
              <div>
                <div className="font-medium text-textBaseColor">清除缓存</div>
                <div className="text-sm text-textSecondary">
                  清理本地存储数据
                </div>
              </div>
            </div>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => console.log('导出数据')}
          >
            <div className="flex items-center gap-3">
              <CustomIcon
                icon="line-md:export"
                className="text-xl text-primary-6"
              />
              <div>
                <div className="font-medium text-textBaseColor">导出数据</div>
                <div className="text-sm text-textSecondary">
                  导出您的个人数据
                </div>
              </div>
            </div>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => console.log('修改密码')}
          >
            <div className="flex items-center gap-3">
              <CustomIcon
                icon="line-md:key"
                className="text-xl text-primary-6"
              />
              <div>
                <div className="font-medium text-textBaseColor">修改密码</div>
                <div className="text-sm text-textSecondary">
                  更改您的账户密码
                </div>
              </div>
            </div>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => console.log('隐私设置')}
          >
            <div className="flex items-center gap-3">
              <CustomIcon
                icon="line-md:shield"
                className="text-xl text-primary-6"
              />
              <div>
                <div className="font-medium text-textBaseColor">隐私设置</div>
                <div className="text-sm text-textSecondary">
                  管理您的隐私偏好
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
