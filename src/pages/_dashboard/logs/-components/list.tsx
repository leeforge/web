import type { ActionItem, ProTableSearchField } from '@leeforge/react-ui';
import type { ColumnsType } from 'antd/es/table';
import type {
  AuditLog,
  AuditLogListParams,
  OperationLog,
  OperationLogListParams,
  SystemError,
  SystemErrorListParams,
} from '@/api/endpoints/logs.api';
import { ProTable, RowActionBar, useProTableQuery } from '@leeforge/react-ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, InputNumber, Modal, Segmented, Space, Tag } from 'antd';
import { useMemo, useState } from 'react';
import {
  buildLogClearInput,
  clearAuditLogs,
  clearOperationLogs,
  clearSystemErrors,
  deleteAuditLog,
  deleteOperationLog,
  deleteSystemError,
  listAuditLogs,
  listOperationLogs,
  listSystemErrors,
  normalizeAuditLogList,
  normalizeOperationLogList,
  normalizeSystemErrorList,
} from '@/api/endpoints/logs.api';
import {
  buildAuditLogListParams,
  buildOperationLogListParams,
  buildSystemErrorListParams,
  formatLogDateTime,
  getErrorLevelTagColor,
} from './logs-page.helpers';
import { getLogsRowActionLabels, type LogsTabKey } from './logs-row-actions';

const operationSearchFields: ProTableSearchField<OperationLogListParams>[] = [
  { name: 'method', label: '方法', placeholder: 'GET/POST/PUT/DELETE' },
  { name: 'status', label: '状态码', type: 'number' },
  { name: 'startDate', label: '开始时间', placeholder: '2026-02-19T08:00:00Z' },
  { name: 'endDate', label: '结束时间', placeholder: '2026-02-20T08:00:00Z' },
];

const errorSearchFields: ProTableSearchField<SystemErrorListParams>[] = [
  { name: 'level', label: '级别', placeholder: 'critical/error/warning/info' },
  { name: 'type', label: '类型', placeholder: 'panic/validation/...' },
  { name: 'request_id', label: '请求ID' },
];

const auditSearchFields: ProTableSearchField<AuditLogListParams>[] = [
  { name: 'action', label: '动作', placeholder: 'create/update/delete' },
  { name: 'resource', label: '资源', placeholder: 'user/role/post' },
  { name: 'resource_id', label: '资源ID' },
  { name: 'user_id', label: '用户ID' },
  { name: 'ip', label: 'IP 地址' },
  { name: 'startDate', label: '开始时间', placeholder: '2026-02-19T08:00:00Z' },
  { name: 'endDate', label: '结束时间', placeholder: '2026-02-20T08:00:00Z' },
];

export function LogsListPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<LogsTabKey>('operations');

  const operationTable = useProTableQuery<OperationLog, OperationLogListParams, unknown>({
    useQuery,
    queryKey: ['logs', 'operations'],
    queryFn: params => listOperationLogs(buildOperationLogListParams(params)),
    resultTransform: payload => normalizeOperationLogList(payload),
    keepPreviousData: true,
    initialPagination: { pageSize: 20 },
  });

  const errorTable = useProTableQuery<SystemError, SystemErrorListParams, unknown>({
    useQuery,
    queryKey: ['logs', 'errors'],
    queryFn: params => listSystemErrors(buildSystemErrorListParams(params)),
    resultTransform: payload => normalizeSystemErrorList(payload),
    keepPreviousData: true,
    initialPagination: { pageSize: 20 },
  });

  const auditTable = useProTableQuery<AuditLog, AuditLogListParams, unknown>({
    useQuery,
    queryKey: ['logs', 'audits'],
    queryFn: params => listAuditLogs(buildAuditLogListParams(params)),
    resultTransform: payload => normalizeAuditLogList(payload),
    keepPreviousData: true,
    initialPagination: { pageSize: 20 },
  });

  const deleteOperationMutation = useMutation({
    mutationFn: (id: string) => deleteOperationLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs', 'operations'] });
    },
  });

  const deleteErrorMutation = useMutation({
    mutationFn: (id: string) => deleteSystemError(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs', 'errors'] });
    },
  });

  const deleteAuditMutation = useMutation({
    mutationFn: (id: string) => deleteAuditLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs', 'audits'] });
    },
  });

  const clearOperationMutation = useMutation({
    mutationFn: (days: number) => clearOperationLogs(buildLogClearInput(days)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs', 'operations'] });
    },
  });

  const clearErrorMutation = useMutation({
    mutationFn: (days: number) => clearSystemErrors(buildLogClearInput(days)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs', 'errors'] });
    },
  });

  const clearAuditMutation = useMutation({
    mutationFn: (days: number) => clearAuditLogs(buildLogClearInput(days)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs', 'audits'] });
    },
  });

  const operationDeleteLabel = getLogsRowActionLabels('operations')[0] ?? '删除';
  const errorDeleteLabel = getLogsRowActionLabels('errors')[0] ?? '删除';
  const auditDeleteLabel = getLogsRowActionLabels('audits')[0] ?? '删除';

  const handleDeleteOperation = (row: OperationLog) => {
    Modal.confirm({
      title: '确认删除日志',
      content: `确定要删除请求 ${row.requestId || row.id} 的操作日志吗？`,
      okText: operationDeleteLabel,
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteOperationMutation.mutateAsync(row.id);
      },
    });
  };

  const handleDeleteError = (row: SystemError) => {
    Modal.confirm({
      title: '确认删除日志',
      content: `确定要删除请求 ${row.requestId || row.id} 的系统错误日志吗？`,
      okText: errorDeleteLabel,
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteErrorMutation.mutateAsync(row.id);
      },
    });
  };

  const handleDeleteAudit = (row: AuditLog) => {
    const resource = row.resource || '未知资源';
    const resourceId = row.resourceId || row.resource_id || row.id;
    Modal.confirm({
      title: '确认删除日志',
      content: `确定要删除 ${resource}(${resourceId}) 的审计日志吗？`,
      okText: auditDeleteLabel,
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteAuditMutation.mutateAsync(row.id);
      },
    });
  };

  const handleClear = () => {
    let retentionDays = 30;
    Modal.confirm({
      title: activeTab === 'operations'
        ? '清理操作日志'
        : activeTab === 'errors'
          ? '清理系统错误日志'
          : '清理审计日志',
      content: (
        <Space>
          保留最近
          <InputNumber
            min={1}
            defaultValue={30}
            onChange={(next) => {
              const parsed = Number(next ?? 30);
              retentionDays = Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
            }}
          />
          天
        </Space>
      ),
      okText: '确认清理',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        if (activeTab === 'operations') {
          await clearOperationMutation.mutateAsync(retentionDays);
          return;
        }
        if (activeTab === 'errors') {
          await clearErrorMutation.mutateAsync(retentionDays);
          return;
        }
        await clearAuditMutation.mutateAsync(retentionDays);
      },
    });
  };

  const operationColumns = useMemo<ColumnsType<OperationLog>>(() => {
    return [
      {
        title: '方法',
        dataIndex: 'method',
        key: 'method',
        width: 100,
        render: method => <Tag>{method || '-'}</Tag>,
      },
      {
        title: '状态码',
        dataIndex: 'status',
        key: 'status',
        width: 100,
      },
      {
        title: '路径',
        dataIndex: 'path',
        key: 'path',
        ellipsis: true,
      },
      {
        title: '请求ID',
        dataIndex: 'requestId',
        key: 'requestId',
        width: 220,
      },
      {
        title: '时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 200,
        render: createdAt => formatLogDateTime(createdAt),
      },
      {
        title: '操作',
        key: 'actions',
        width: 120,
        fixed: 'right',
        render: (_, row) => {
          const items: ActionItem<OperationLog>[] = [
            {
              key: 'delete',
              label: operationDeleteLabel,
              danger: true,
              disabled: deleteOperationMutation.isPending,
              onClick: () => handleDeleteOperation(row),
            },
          ];
          return <RowActionBar items={items} context={row} />;
        },
      },
    ];
  }, [deleteOperationMutation.isPending, operationDeleteLabel]);

  const errorColumns = useMemo<ColumnsType<SystemError>>(() => {
    return [
      {
        title: '级别',
        dataIndex: 'errorLevel',
        key: 'errorLevel',
        width: 120,
        render: level => <Tag color={getErrorLevelTagColor(level)}>{level || '-'}</Tag>,
      },
      {
        title: '类型',
        dataIndex: 'errorType',
        key: 'errorType',
        width: 160,
      },
      {
        title: '错误信息',
        dataIndex: 'errorMsg',
        key: 'errorMsg',
        ellipsis: true,
      },
      {
        title: '请求ID',
        dataIndex: 'requestId',
        key: 'requestId',
        width: 220,
      },
      {
        title: '时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 200,
        render: createdAt => formatLogDateTime(createdAt),
      },
      {
        title: '操作',
        key: 'actions',
        width: 120,
        fixed: 'right',
        render: (_, row) => {
          const items: ActionItem<SystemError>[] = [
            {
              key: 'delete',
              label: errorDeleteLabel,
              danger: true,
              disabled: deleteErrorMutation.isPending,
              onClick: () => handleDeleteError(row),
            },
          ];
          return <RowActionBar items={items} context={row} />;
        },
      },
    ];
  }, [deleteErrorMutation.isPending, errorDeleteLabel]);

  const auditColumns = useMemo<ColumnsType<AuditLog>>(() => {
    return [
      {
        title: '动作',
        dataIndex: 'action',
        key: 'action',
        width: 140,
        render: action => <Tag color="geekblue">{action || '-'}</Tag>,
      },
      {
        title: '资源',
        dataIndex: 'resource',
        key: 'resource',
        width: 180,
      },
      {
        title: '资源ID',
        key: 'resource_id',
        width: 220,
        render: (_, row) => row.resourceId || row.resource_id || '-',
      },
      {
        title: '用户ID',
        key: 'user_id',
        width: 220,
        render: (_, row) => row.userId || row.user_id || row.createdById || '-',
      },
      {
        title: 'IP地址',
        key: 'ip_address',
        width: 180,
        render: (_, row) => row.ip || row.ipAddress || row.ip_address || '-',
      },
      {
        title: '时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 200,
        render: createdAt => formatLogDateTime(createdAt),
      },
      {
        title: '操作',
        key: 'actions',
        width: 120,
        fixed: 'right',
        render: (_, row) => {
          const items: ActionItem<AuditLog>[] = [
            {
              key: 'delete',
              label: auditDeleteLabel,
              danger: true,
              disabled: deleteAuditMutation.isPending,
              onClick: () => handleDeleteAudit(row),
            },
          ];
          return <RowActionBar items={items} context={row} />;
        },
      },
    ];
  }, [auditDeleteLabel, deleteAuditMutation.isPending]);

  const actions = (
    <Space>
      <Segmented
        value={activeTab}
        onChange={value => setActiveTab(value as LogsTabKey)}
        options={[
          { label: '操作日志', value: 'operations' },
          { label: '系统错误', value: 'errors' },
          { label: '审计日志', value: 'audits' },
        ]}
      />
      <Button
        danger
        onClick={handleClear}
        loading={activeTab === 'operations'
          ? clearOperationMutation.isPending
          : activeTab === 'errors'
            ? clearErrorMutation.isPending
            : clearAuditMutation.isPending}
      >
        批量清理
      </Button>
    </Space>
  );

  return (
    <div className="h-full min-h-0">
      {activeTab === 'operations' ? (
        <ProTable<OperationLog, OperationLogListParams>
          rowKey="id"
          columns={operationColumns}
          data={operationTable.data}
          loading={[
            operationTable.loading,
            deleteOperationMutation.isPending,
            clearOperationMutation.isPending,
          ]}
          pagination={operationTable.pagination}
          onPaginationChange={operationTable.onPaginationChange}
          search={{
            fields: operationSearchFields,
            values: operationTable.search.values,
            onChange: operationTable.search.onChange,
            onSubmit: operationTable.search.onSubmit,
            onReset: operationTable.search.onReset,
          }}
          onRefresh={operationTable.onRefresh}
          actions={actions}
        />
      ) : activeTab === 'errors' ? (
        <ProTable<SystemError, SystemErrorListParams>
          rowKey="id"
          columns={errorColumns}
          data={errorTable.data}
          loading={[
            errorTable.loading,
            deleteErrorMutation.isPending,
            clearErrorMutation.isPending,
          ]}
          pagination={errorTable.pagination}
          onPaginationChange={errorTable.onPaginationChange}
          search={{
            fields: errorSearchFields,
            values: errorTable.search.values,
            onChange: errorTable.search.onChange,
            onSubmit: errorTable.search.onSubmit,
            onReset: errorTable.search.onReset,
          }}
          onRefresh={errorTable.onRefresh}
          actions={actions}
        />
      ) : (
        <ProTable<AuditLog, AuditLogListParams>
          rowKey="id"
          columns={auditColumns}
          data={auditTable.data}
          loading={[
            auditTable.loading,
            deleteAuditMutation.isPending,
            clearAuditMutation.isPending,
          ]}
          pagination={auditTable.pagination}
          onPaginationChange={auditTable.onPaginationChange}
          search={{
            fields: auditSearchFields,
            values: auditTable.search.values,
            onChange: auditTable.search.onChange,
            onSubmit: auditTable.search.onSubmit,
            onReset: auditTable.search.onReset,
          }}
          onRefresh={auditTable.onRefresh}
          actions={actions}
        />
      )}
    </div>
  );
}
