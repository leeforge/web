import type { ActionItem, ProTableSearchField } from '@leeforge/react-ui';
import type { ColumnsType } from 'antd/es/table';
import type { ShareGrantFormRef, ShareGrantFormValues } from './-components/ShareGrantForm';
import type { ShareGrant } from '@/api/endpoints/share-grant.api';
import { ProTable, RowActionBar } from '@leeforge/react-ui';
import { createFileRoute } from '@tanstack/react-router';
import { Button, Modal, Space, Tag } from 'antd';
import { useMemo, useRef, useState } from 'react';
import { useStore } from 'zustand';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import { AuthStore } from '@/stores';
import { ShareGrantForm } from './-components/ShareGrantForm';

interface ShareSearchParams {
  q?: string;
}

const INITIAL_GRANTS: ShareGrant[] = [
  {
    id: 'grant-1',
    sourceDomainType: 'platform',
    sourceDomainKey: 'root',
    sourceProjectId: 'proj-cms-core',
    targetDomainType: 'tenant',
    targetDomainKey: 'root',
    targetProjectId: 'proj-portal',
    resourceType: 'cms.media',
    resourceId: 'media-1024',
    accessLevel: 'read',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const Route = createFileRoute('/_dashboard/shares/')({
  component: RouteComponent,
});

function RouteComponent() {
  const formRef = useRef<ShareGrantFormRef>(null);
  const [grants, setGrants] = useState<ShareGrant[]>(INITIAL_GRANTS);
  const [searchValues, setSearchValues] = useState<ShareSearchParams>({});
  const actingDomain = useStore(AuthStore, state => state.actingDomain);
  const currentDomainType = actingDomain?.type || 'platform';
  const currentDomainKey = actingDomain?.key || 'root';

  const filteredGrants = useMemo(() => {
    if (!searchValues.q) {
      return grants;
    }
    const lowerKeyword = searchValues.q.toLowerCase();
    return grants.filter((grant) => {
      const sourceDomain = `${grant.sourceDomainType || 'platform'}:${grant.sourceDomainKey || 'root'}`;
      const targetDomain = `${grant.targetDomainType || 'platform'}:${grant.targetDomainKey || 'root'}`;
      const text = `${grant.resourceType} ${grant.resourceId} ${sourceDomain} ${targetDomain}`.toLowerCase();
      return text.includes(lowerKeyword);
    });
  }, [grants, searchValues.q]);

  const handleSubmit = async (values: ShareGrantFormValues, isEdit: boolean, editingId?: string) => {
    const now = new Date().toISOString();
    if (isEdit && editingId) {
      setGrants(prev => prev.map(grant => grant.id === editingId
        ? {
            ...grant,
            ...values,
            sourceProjectId: values.sourceProjectId || null,
            targetProjectId: values.targetProjectId || null,
            updatedAt: now,
          }
        : grant));
    }
    else {
      setGrants(prev => [
        {
          id: `grant-${Date.now()}`,
          ...values,
          sourceProjectId: values.sourceProjectId || null,
          targetProjectId: values.targetProjectId || null,
          createdAt: now,
          updatedAt: now,
        },
        ...prev,
      ]);
    }
  };

  const handleRevoke = (grant: ShareGrant) => {
    Modal.confirm({
      title: '确认回收共享授权',
      content: `确定回收资源 "${grant.resourceType}:${grant.resourceId}" 的共享授权吗？`,
      okText: '确认回收',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => setGrants(prev => prev.map(item => item.id === grant.id
        ? { ...item, status: 'inactive', updatedAt: new Date().toISOString() }
        : item)),
    });
  };

  const columns: ColumnsType<ShareGrant> = [
    {
      title: '资源',
      key: 'resource',
      render: (_, record) => (
        <div>
          <Tag color="blue">{record.resourceType}</Tag>
          <span>{record.resourceId}</span>
        </div>
      ),
    },
    {
      title: '来源',
      key: 'source',
      render: (_, record) => {
        const sourceDomain = `${record.sourceDomainType || 'platform'}:${record.sourceDomainKey || 'root'}`;
        return `${sourceDomain} / ${record.sourceProjectId || '-'}`;
      },
    },
    {
      title: '目标',
      key: 'target',
      render: (_, record) => {
        const targetDomain = `${record.targetDomainType || 'platform'}:${record.targetDomainKey || 'root'}`;
        return `${targetDomain} / ${record.targetProjectId || '-'}`;
      },
    },
    {
      title: '级别',
      dataIndex: 'accessLevel',
      key: 'accessLevel',
      render: value => <Tag color="purple">{value}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: value => (
        <Tag color={value === 'active' ? 'green' : 'default'}>
          {value === 'active' ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const actionItems: ActionItem<ShareGrant>[] = [
          {
            key: 'edit',
            label: '编辑',
            onClick: () => formRef.current?.open({ data: record }),
          },
          {
            key: 'revoke',
            label: '回收',
            danger: true,
            onClick: () => handleRevoke(record),
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

  const searchFields: ProTableSearchField<ShareSearchParams>[] = [
    {
      name: 'q',
      label: '关键词',
      placeholder: '搜索资源类型、资源 ID 或域',
    },
  ];

  return (
    <div className="h-full min-h-0">
      <ProTable<ShareGrant, ShareSearchParams>
        rowKey="id"
        columns={columns}
        data={filteredGrants}
        pagination={{
          current: 1,
          pageSize: 10,
          total: filteredGrants.length,
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
            新建共享授权
          </Button>
        )}
      />

      <ShareGrantForm
        ref={formRef}
        defaultDomainType={currentDomainType}
        defaultDomainKey={currentDomainKey}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
