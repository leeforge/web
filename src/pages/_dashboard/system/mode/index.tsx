import { SchemaFormRenderer, useSchemaForm } from '@leeforge/react-ui';
import { createFileRoute } from '@tanstack/react-router';
import { Alert, Modal, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useMsg } from '@/hooks';
import { GovernanceContractAlert } from '../../-components/GovernanceContractAlert';

const DOMAIN_MODE_STORAGE_KEY = 'cms-domain-mode-config';

type DomainType = 'platform' | 'tenant';

interface DomainModeConfig {
  multiTenancyEnabled: boolean;
  defaultDomainType: DomainType;
  defaultDomainKey: string;
  updatedAt: string;
}

const DEFAULT_MODE_CONFIG: DomainModeConfig = {
  multiTenancyEnabled: false,
  defaultDomainType: 'platform',
  defaultDomainKey: 'root',
  updatedAt: new Date().toISOString(),
};

const domainModeSchema = z.object({
  mode: z.enum(['single', 'multi']),
  defaultDomainType: z.enum(['platform', 'tenant']),
  defaultDomainKey: z.string().min(1, '请输入默认域 Key'),
});

type DomainModeFormValues = z.infer<typeof domainModeSchema>;

export const Route = createFileRoute('/_dashboard/system/mode/')({
  component: RouteComponent,
});

function readDomainModeConfig(): DomainModeConfig {
  try {
    const raw = localStorage.getItem(DOMAIN_MODE_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_MODE_CONFIG;
    }

    const parsed = JSON.parse(raw) as {
      multiTenancyEnabled?: unknown;
      defaultDomainType?: unknown;
      defaultDomainKey?: unknown;
      updatedAt?: unknown;
    };

    if (typeof parsed.multiTenancyEnabled !== 'boolean') {
      return DEFAULT_MODE_CONFIG;
    }

    const updatedAt = typeof parsed.updatedAt === 'string'
      ? parsed.updatedAt
      : new Date().toISOString();

    if (typeof parsed.defaultDomainType === 'string' && typeof parsed.defaultDomainKey === 'string') {
      const defaultDomainType = parsed.defaultDomainType === 'tenant' ? 'tenant' : 'platform';
      const defaultDomainKey = parsed.defaultDomainKey.trim() || 'root';
      return {
        multiTenancyEnabled: parsed.multiTenancyEnabled,
        defaultDomainType,
        defaultDomainKey,
        updatedAt,
      };
    }

    return {
      multiTenancyEnabled: parsed.multiTenancyEnabled,
      defaultDomainType: 'platform',
      defaultDomainKey: 'root',
      updatedAt,
    };
  }
  catch {
    return DEFAULT_MODE_CONFIG;
  }
}

function writeDomainModeConfig(config: DomainModeConfig) {
  localStorage.setItem(DOMAIN_MODE_STORAGE_KEY, JSON.stringify(config));
}

function RouteComponent() {
  const { msgSuccess } = useMsg();
  const [config, setConfig] = useState<DomainModeConfig>(DEFAULT_MODE_CONFIG);

  const form = useSchemaForm({
    schema: domainModeSchema,
    uiSchema: {
      mode: {
        label: '运行模式',
        widget: 'select',
        options: [
          { label: '单租户模式', value: 'single' },
          { label: '多租户模式', value: 'multi' },
        ],
        required: true,
      },
      defaultDomainType: {
        label: '默认域类型',
        widget: 'select',
        options: [
          { label: '平台域（platform）', value: 'platform' },
          { label: '租户域（tenant）', value: 'tenant' },
        ],
        required: true,
      },
      defaultDomainKey: {
        label: '默认域 Key',
        placeholder: '例如 root 或 tenant-school-a',
        required: true,
      },
    },
    defaultValues: {
      mode: 'single',
      defaultDomainType: 'platform',
      defaultDomainKey: 'root',
    },
    onSubmit: async (values) => {
      const nextConfig: DomainModeConfig = {
        multiTenancyEnabled: values.mode === 'multi',
        defaultDomainType: values.defaultDomainType,
        defaultDomainKey: values.defaultDomainKey.trim(),
        updatedAt: new Date().toISOString(),
      };

      Modal.confirm({
        title: '确认更新域模式配置',
        content: (
          <div>
            <p>
              即将切换为
              {' '}
              <strong>{nextConfig.multiTenancyEnabled ? '多租户模式' : '单租户模式'}</strong>
              。
            </p>
            <p>
              默认作用域将更新为
              {' '}
              <strong>
                {nextConfig.defaultDomainType}
                /
                {nextConfig.defaultDomainKey}
              </strong>
              。
            </p>
            <p>配置仅保存于前端本地，用于治理流程预演。</p>
          </div>
        ),
        onOk: () => {
          writeDomainModeConfig(nextConfig);
          setConfig(nextConfig);
          msgSuccess('域模式配置已更新');
        },
      });
    },
  });

  useEffect(() => {
    const next = readDomainModeConfig();
    setConfig(next);
    form.setValues({
      mode: next.multiTenancyEnabled ? 'multi' : 'single',
      defaultDomainType: next.defaultDomainType,
      defaultDomainKey: next.defaultDomainKey || 'root',
    });
  }, []);

  return (
    <div className="h-full min-h-0">
      <div className="mb-4 space-y-3">
        <GovernanceContractAlert capability="tenant-mode" />

        <Alert
          type="info"
          showIcon
          message="当前为前端本地治理配置模式"
          description="后端系统模式接口尚未文档化，当前页面用于流程对齐与配置演练。"
        />
      </div>

      <SchemaFormRenderer
        form={form}
        layout={{ layout: 'vertical' }}
        submitText="保存配置"
      />

      <div className="mt-4 space-y-1">
        <Typography.Paragraph type="secondary">
          当前默认域：
          {' '}
          <Typography.Text code>
            {config.defaultDomainType}
            /
            {config.defaultDomainKey}
          </Typography.Text>
        </Typography.Paragraph>

        <Typography.Paragraph type="secondary">
          最近更新时间：
          {new Date(config.updatedAt).toLocaleString('zh-CN')}
        </Typography.Paragraph>
      </div>
    </div>
  );
}
