import type { ActionItem, ProTableSearchField } from '@leeforge/react-ui';
import type { ColumnsType } from 'antd/es/table';
import type { QuotaFormRef, QuotaFormValues } from './QuotaForm';
import type { Quota } from '@/api/endpoints/quota.api';
import { ProTable, RowActionBar } from '@leeforge/react-ui';
import { Button, Tag, Typography } from 'antd';
import { useMemo, useRef, useState } from 'react';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import { QuotaForm } from './QuotaForm';

interface QuotaPageProps {
  scopeType: 'tenant' | 'project';
  title: string;
}

interface QuotaSearchParams {
  q?: string;
}

const INITIAL_TENANT_QUOTAS: Quota[] = [
  {
    id: 'quota-tenant-root',
    scopeType: 'tenant',
    scopeId: 'root',
    maxUsers: 500,
    maxProjects: 20,
    maxStorageBytes: 53687091200,
    maxApiPerDay: 200000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_PROJECT_QUOTAS: Quota[] = [
  {
    id: 'quota-project-cms-core',
    scopeType: 'project',
    scopeId: 'proj-cms-core',
    maxUsers: 120,
    maxProjects: 0,
    maxStorageBytes: 21474836480,
    maxApiPerDay: 50000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function formatStorage(bytes?: number) {
  if (!bytes || bytes <= 0) {
    return '-';
  }
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

export function QuotaPage({ scopeType, title }: QuotaPageProps) {
  const formRef = useRef<QuotaFormRef>(null);
  const [searchValues, setSearchValues] = useState<QuotaSearchParams>({});
  const [quotas, setQuotas] = useState<Quota[]>(
    scopeType === 'tenant' ? INITIAL_TENANT_QUOTAS : INITIAL_PROJECT_QUOTAS,
  );

  const filteredQuotas = useMemo(() => {
    if (!searchValues.q) {
      return quotas;
    }
    return quotas.filter(quota => quota.scopeId.toLowerCase().includes(searchValues.q!.toLowerCase()));
  }, [searchValues.q, quotas]);

  const handleSubmit = async (values: QuotaFormValues, isEdit: boolean, editingId?: string) => {
    const now = new Date().toISOString();
    if (isEdit && editingId) {
      setQuotas(prev => prev.map(quota => quota.id === editingId
        ? { ...quota, ...values, updatedAt: now }
        : quota));
    }
    else {
      setQuotas(prev => [
        {
          id: `${scopeType}-quota-${Date.now()}`,
          scopeType,
          scopeId: values.scopeId,
          maxUsers: values.maxUsers,
          maxProjects: values.maxProjects,
          maxStorageBytes: values.maxStorageBytes,
          maxApiPerDay: values.maxApiPerDay,
          createdAt: now,
          updatedAt: now,
        },
        ...prev,
      ]);
    }
  };

  const columns: ColumnsType<Quota> = [
    {
      title: scopeType === 'tenant' ? '租户 ID' : '项目 ID',
      dataIndex: 'scopeId',
      key: 'scopeId',
      render: value => <Typography.Text code>{value}</Typography.Text>,
    },
    {
      title: '用户上限',
      dataIndex: 'maxUsers',
      key: 'maxUsers',
      render: value => value ?? '-',
    },
    {
      title: '项目上限',
      dataIndex: 'maxProjects',
      key: 'maxProjects',
      render: value => value ?? '-',
    },
    {
      title: '存储上限',
      dataIndex: 'maxStorageBytes',
      key: 'maxStorageBytes',
      render: value => formatStorage(value),
    },
    {
      title: 'API 日限额',
      dataIndex: 'maxApiPerDay',
      key: 'maxApiPerDay',
      render: value => value ?? '-',
    },
    {
      title: '有效限额',
      key: 'effective',
      render: (_, quota) => (
        <Tag color="purple">
          {`min(tenant, project) · ${quota.scopeId}`}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => {
        const actionItems: ActionItem<Quota>[] = [
          {
            key: 'edit',
            label: '编辑',
            onClick: () => formRef.current?.open({ data: record }),
          },
        ];

        return (
          <RowActionBar
            items={actionItems}
            context={record}
          />
        );
      },
    },
  ];

  const searchFields: ProTableSearchField<QuotaSearchParams>[] = [
    {
      name: 'q',
      label: '关键词',
      placeholder: scopeType === 'tenant' ? '按租户 ID 搜索' : '按项目 ID 搜索',
    },
  ];

  return (
    <div className="h-full min-h-0">
      <ProTable<Quota, QuotaSearchParams>
        rowKey="id"
        columns={columns}
        data={filteredQuotas}
        pagination={{
          current: 1,
          pageSize: 10,
          total: filteredQuotas.length,
        }}
        search={{
          fields: searchFields,
          values: searchValues,
          onChange: setSearchValues,
          onSubmit: () => {},
          onReset: () => setSearchValues({}),
        }}
        actions={(
          <Button
            type="primary"
            icon={<CustomIcon icon="line-md:plus" width={16} />}
            onClick={() => formRef.current?.open()}
          >
            新建配额
          </Button>
        )}
      />

      <QuotaForm
        ref={formRef}
        scopeType={scopeType}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
