import { UploadOutlined } from '@ant-design/icons';
import { createFileRoute } from '@tanstack/react-router';
import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Space,
  Typography,
  Upload,
} from 'antd';
import { useState } from 'react';
import { useStore } from 'zustand';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import { AuthStore } from '@/stores';

const { Title, Text } = Typography;

export const Route = createFileRoute('/_dashboard/profile')({
  component: RouteComponent,
});

function RouteComponent() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const user = useStore(AuthStore, state => state.user);
  const requestUserInfo = useStore(AuthStore, state => state.requestUserInfo);

  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
    bio: user?.bio || '',
  });

  const onFinish = (values: any) => {
    setLoading(true);
    // 模拟更新用户信息
    setTimeout(() => {
      console.log('更新用户信息:', values);
      // 在更新后进行调用下面request进行更新
      requestUserInfo();
      setProfileData({ ...profileData, ...values });
      setLoading(false);
    }, 1000);
  };

  const handleAvatarUpload = (file: any) => {
    // 模拟头像上传
    const reader = new FileReader();
    reader.onload = (e) => {
      const avatarUrl = e.target?.result as string;
      setProfileData({ ...profileData, avatar: avatarUrl });
      requestUserInfo();
    };
    reader.readAsDataURL(file);
    return false; // 阻止默认上传
  };

  return (
    <div className="content-box-default">
      <div className="mb-6">
        <Title level={2} className="text-textBaseColor mb-2">
          <CustomIcon icon="line-md:account" className="mr-2" />
          个人信息
        </Title>
        <Text type="secondary">管理您的个人资料和账户信息</Text>
      </div>

      {/* 头像和基本信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-1 shadow-sm">
          <div className="text-center">
            <div className="mb-4">
              <Avatar
                size={100}
                src={profileData.avatar}
                className="border-4 border-primary-3"
              >
                {profileData.username?.charAt(0).toUpperCase()}
              </Avatar>
            </div>
            <Title level={4} className="mb-1 text-textBaseColor">
              {profileData.username}
            </Title>
            <Text type="secondary" className="mb-4 block">
              {profileData.email}
            </Text>

            <Upload
              beforeUpload={handleAvatarUpload}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} block>
                更换头像
              </Button>
            </Upload>
          </div>
        </Card>

        {/* 详细信息 */}
        <Card className="md:col-span-2 shadow-sm">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="用户名">
              {profileData.username}
            </Descriptions.Item>
            <Descriptions.Item label="邮箱">
              {profileData.email}
            </Descriptions.Item>
            <Descriptions.Item label="手机号">
              {profileData.phone || '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="个人简介">
              {profileData.bio || '暂无简介'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>

      {/* 编辑表单 */}
      <Card className="shadow-sm">
        <Title level={3} className="text-textBaseColor mb-4">
          编辑资料
        </Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={profileData}
          autoComplete="off"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="用户名"
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
              ]}
            >
              <Input
                prefix={<CustomIcon icon="line-md:account" />}
                placeholder="请输入用户名"
              />
            </Form.Item>

            <Form.Item
              label="邮箱"
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input
                prefix={<CustomIcon icon="line-md:email" />}
                placeholder="请输入邮箱"
              />
            </Form.Item>

            <Form.Item
              label="手机号"
              name="phone"
              rules={[
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
              ]}
            >
              <Input
                prefix={<CustomIcon icon="line-md:phone" />}
                placeholder="请输入手机号"
              />
            </Form.Item>

            <Form.Item
              label="个人简介"
              name="bio"
              rules={[{ max: 200, message: '简介不能超过200个字符' }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="介绍一下自己..."
                maxLength={200}
                showCount
              />
            </Form.Item>
          </div>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存更改
              </Button>
              <Button onClick={() => form.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 账户安全信息 */}
      <div className="mt-6">
        <Title level={4} className="text-textBaseColor mb-4">
          账户安全
        </Title>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  定期更新密码以保护账户安全
                </div>
              </div>
            </div>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => console.log('登录历史')}
          >
            <div className="flex items-center gap-3">
              <CustomIcon
                icon="line-md:history"
                className="text-xl text-primary-6"
              />
              <div>
                <div className="font-medium text-textBaseColor">登录历史</div>
                <div className="text-sm text-textSecondary">
                  查看最近的登录活动
                </div>
              </div>
            </div>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => console.log('两步验证')}
          >
            <div className="flex items-center gap-3">
              <CustomIcon
                icon="line-md:shield"
                className="text-xl text-primary-6"
              />
              <div>
                <div className="font-medium text-textBaseColor">两步验证</div>
                <div className="text-sm text-textSecondary">
                  启用额外的安全保护
                </div>
              </div>
            </div>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => console.log('设备管理')}
          >
            <div className="flex items-center gap-3">
              <CustomIcon
                icon="line-md:devices"
                className="text-xl text-primary-6"
              />
              <div>
                <div className="font-medium text-textBaseColor">设备管理</div>
                <div className="text-sm text-textSecondary">
                  管理已登录的设备
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
