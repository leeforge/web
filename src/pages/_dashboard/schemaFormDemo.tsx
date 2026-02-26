import type { UISchema } from '@leeforge/react-ui';
import { createFileRoute } from '@tanstack/react-router';
import { Alert, Card, Tabs, Typography } from 'antd';
import { useState } from 'react';
import { z } from 'zod';
import { SchemaForm, SchemaFormRenderer, useSchemaForm } from '@leeforge/react-ui';

export const Route = createFileRoute('/_dashboard/schemaFormDemo')({
  component: RouteComponent,
});

// ----------------------------------------------------------------------
// 1. 基础示例：登录表单
// ----------------------------------------------------------------------
const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(6, '密码至少6位'),
  agree: z.boolean().refine(v => v, '请同意协议'),
});

const loginUISchema: UISchema<z.infer<typeof loginSchema>> = {
  username: { label: '用户名', placeholder: 'admin' },
  password: { label: '密码', widget: 'password' },
  agree: { label: '同意用户协议', widget: 'checkbox', hiddenLabel: true },
};

function BasicDemo() {
  return (
    <SchemaForm
      schema={loginSchema}
      uiSchema={loginUISchema}
      onSubmit={values => console.log('Login:', values)}
      submitText="登录"
      layout={{ layout: 'vertical', size: 'middle' }}
    />
  );
}

// ----------------------------------------------------------------------
// 2. 布局示例：多列 + 响应式
// ----------------------------------------------------------------------
const profileSchema = z.object({
  fullName: z.string().min(1),
  email: z.email(),
  phone: z.string().optional(),
  department: z.string(),
  role: z.enum(['admin', 'user']),
  bio: z.string().optional(),
});

const profileUISchema: UISchema<z.infer<typeof profileSchema>> = {
  fullName: { label: '姓名', span: 12 },
  email: { label: '邮箱', span: 12 },
  phone: { label: '电话', span: 8 },
  department: { label: '部门', span: 8 },
  role: {
    label: '角色',
    widget: 'select',
    span: 8,
    options: [{ label: '管理员', value: 'admin' }, { label: '用户', value: 'user' }],
  },
  bio: { label: '简介', widget: 'textarea', span: 24, rows: 3 },
};

function LayoutDemo() {
  return (
    <SchemaForm
      schema={profileSchema}
      uiSchema={profileUISchema}
      layout={{ layout: 'vertical', columns: 3 }}
      initialValues={{ role: 'user' }}
      onSubmit={values => console.log('Profile:', values)}
      card
      cardTitle="用户信息 (响应式布局)"
      showCancel
    />
  );
}

// ----------------------------------------------------------------------
// 3. 联动示例：字段依赖
// ----------------------------------------------------------------------
const depSchema = z.object({
  type: z.enum(['email', 'sms']),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  sendTime: z.enum(['now', 'later']),
  schedule: z.string().optional(),
});

const depUISchema: UISchema<z.infer<typeof depSchema>> = {
  type: {
    label: '通知方式',
    widget: 'radio',
    options: [
      { label: '邮件', value: 'email' },
      { label: '短信', value: 'sms' },
    ],
  },
  email: {
    label: '邮箱地址',
    hidden: true,
    dependencies: [{ field: 'type', condition: 'equals', value: 'email', action: 'show' }],
  },
  phone: {
    label: '手机号码',
    hidden: true,
    dependencies: [{ field: 'type', condition: 'equals', value: 'sms', action: 'show' }],
  },
  sendTime: {
    label: '发送时间',
    widget: 'select',
    options: [{ label: '立即', value: 'now' }, { label: '定时', value: 'later' }],
  },
  schedule: {
    label: '计划时间',
    widget: 'datetime',
    hidden: true,
    dependencies: [{ field: 'sendTime', condition: 'equals', value: 'later', action: 'show' }],
  },
};

function DependencyDemo() {
  return (
    <SchemaForm
      schema={depSchema}
      uiSchema={depUISchema}
      initialValues={{ type: 'email', sendTime: 'now' }}
      onSubmit={values => console.log('Notification:', values)}
    />
  );
}

// ----------------------------------------------------------------------
// 4. Headless 模式示例：自定义 UI
// ----------------------------------------------------------------------
function HeadlessDemo() {
  // 直接使用 Hook
  const instance = useSchemaForm({
    schema: loginSchema,
    uiSchema: loginUISchema,
    onSubmit: values => alert(JSON.stringify(values)),
  });

  return (
    <div className="p-4 border rounded bg-gray-50">
      <div className="mb-4 font-bold">这是完全自定义的 UI (Headless 模式)</div>

      {/* 我们可以自由决定怎么渲染，比如不使用 Form 组件，而是使用原生 div */}
      <div className="flex flex-col gap-4">
        {instance.visibleFields.map(field => (
          <instance.formApi.Field key={field.name} name={field.name as never}>
            {fieldApi => (
              <div className="flex flex-col">
                <label className="text-sm font-medium">{field.config.label}</label>
                <input
                  className="border p-2 rounded mt-1"
                  value={fieldApi.state.value as string || ''}
                  onChange={e => fieldApi.handleChange(e.target.value)}
                  type={field.config.widget === 'password' ? 'password' : 'text'}
                />
                {fieldApi.state.meta.errors.length > 0 && (
                  <span className="text-red-500 text-xs">{fieldApi.state.meta.errors.join(', ')}</span>
                )}
              </div>
            )}
          </instance.formApi.Field>
        ))}
      </div>

      <button
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        onClick={instance.submit}
        disabled={!instance.canSubmit}
      >
        Headless 提交
      </button>

      <div className="mt-4 text-xs text-gray-500">
        实时数据:
        {' '}
        {JSON.stringify(instance.values)}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 5. 编辑模式测试：模拟弹窗编辑场景
// ----------------------------------------------------------------------
const editSchema = z.object({
  name: z.string().min(1, '请输入名称'),
  description: z.string().optional(),
  rateLimit: z.number().optional(),
});

const editUISchema: UISchema<z.infer<typeof editSchema>> = {
  name: { label: '名称', placeholder: '请输入名称' },
  description: { label: '描述', widget: 'textarea', rows: 3 },
  rateLimit: { label: '速率限制', widget: 'number' },
};

// 模拟后端数据
const mockData = {
  name: '测试 API Key',
  description: '这是一个测试描述',
  rateLimit: 100,
};

function EditModeDemo() {
  // 需要外部控制时，使用 useSchemaForm + SchemaFormRenderer
  const form = useSchemaForm({
    schema: editSchema,
    uiSchema: editUISchema,
    defaultValues: {
      name: '',
      description: '',
      rateLimit: 0,
    },
    onSubmit: values => console.log('Edit:', values),
  });

  const handleLoadData = () => {
    form.setValues(mockData);
  };

  const handleLoadDataWithFormApi = () => {
    form.formApi.setFieldValue('name', mockData.name);
    form.formApi.setFieldValue('description', mockData.description ?? '');
    form.formApi.setFieldValue('rateLimit', mockData.rateLimit ?? 0);
  };

  const handleReset = () => {
    form.reset();
  };

  return (
    <div>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <strong>使用方式：</strong>
        需要外部控制表单时，使用
        {' '}
        <code>useSchemaForm</code>
        {' + '}
        <code>SchemaFormRenderer</code>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleLoadData}
        >
          加载数据 (setValues)
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={handleLoadDataWithFormApi}
        >
          加载数据 (formApi.setFieldValue)
        </button>
        <button
          className="bg-gray-500 text-white px-4 py-2 rounded"
          onClick={handleReset}
        >
          重置
        </button>
      </div>

      <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
        <strong>实时 form.values:</strong>
        <pre>{JSON.stringify(form.values, null, 2)}</pre>
      </div>

      <SchemaFormRenderer
        form={form}
        submitText="保存"
      />
    </div>
  );
}

// ----------------------------------------------------------------------
// 主页面
// ----------------------------------------------------------------------
function RouteComponent() {
  const [activeKey, setActiveKey] = useState('1');

  const items = [
    {
      key: '1',
      label: '基础表单',
      children: <Card title="基础使用"><BasicDemo /></Card>,
    },
    {
      key: '2',
      label: '响应式布局',
      children: <LayoutDemo />,
    },
    {
      key: '3',
      label: '字段联动',
      children: <Card title="动态显示/隐藏"><DependencyDemo /></Card>,
    },
    {
      key: '4',
      label: 'Headless 模式',
      children: <Card title="Hook 自定义 UI"><HeadlessDemo /></Card>,
    },
    {
      key: '5',
      label: '编辑模式测试',
      children: <Card title="测试 setValues 回显"><EditModeDemo /></Card>,
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <Typography.Title level={2}>SchemaForm 2.0 Demo</Typography.Title>
      <Alert
        message="重构完成"
        description="新的 SchemaForm 采用了 Headless 架构，逻辑与 UI 分离，支持更灵活的布局和自定义渲染。"
        type="success"
        showIcon
        style={{ marginBottom: 24 }}
      />
      <Tabs activeKey={activeKey} onChange={setActiveKey} items={items} />
    </div>
  );
}
