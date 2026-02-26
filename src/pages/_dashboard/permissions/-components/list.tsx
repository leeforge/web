import type { ProTableQueryResult, ProTableSearchField } from '@leeforge/react-ui';
import type { ColumnsType } from 'antd/es/table';
import type { PermissionListParams, PermissionListResponse, PermissionSyncResponse } from '@/api/endpoints/permission.api';
import { ProTable, useProTableQuery } from '@leeforge/react-ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message, Modal, Tag } from 'antd';
import { getPermissionList, syncPermissions } from '@/api/endpoints/permission.api';

interface PermissionRow {
  key: string;
  code: string;
  name?: string;
  description?: string;
  method?: string;
  path?: string;
  module?: string;
}

type PermissionRecord = Record<string, unknown>;

function extractPermissionArray(input: PermissionListResponse | undefined): unknown[] {
  if (!input)
    return [];

  if (Array.isArray(input))
    return input;

  if (Array.isArray(input.permissions))
    return input.permissions;

  if (Array.isArray(input.items))
    return input.items;

  if (Array.isArray(input.list))
    return input.list;

  if (Array.isArray(input.data))
    return input.data;

  if (input.data && typeof input.data === 'object') {
    const nested = input.data as Record<string, unknown>;
    if (Array.isArray(nested.permissions))
      return nested.permissions;
    if (Array.isArray(nested.items))
      return nested.items;
    if (Array.isArray(nested.list))
      return nested.list;
  }

  return [];
}

function toPermissionRow(item: unknown): PermissionRow | null {
  if (item === null || item === undefined)
    return null;

  if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
    const code = String(item).trim();
    if (!code)
      return null;
    return { key: code, code };
  }

  if (typeof item !== 'object')
    return null;

  const record = item as PermissionRecord;
  const rawCode = record.code
    ?? record.permission
    ?? record.value
    ?? record.key
    ?? record.name
    ?? record.path
    ?? record.id;

  if (rawCode === undefined || rawCode === null)
    return null;

  const code = String(rawCode).trim();
  if (!code)
    return null;

  const description = record.description ?? record.label ?? record.title ?? record.remark;
  const name = record.name ?? record.label ?? record.title;
  const method = record.method ?? record.httpMethod;
  const path = record.path ?? record.route;
  const module = record.module ?? record.group ?? record.category;

  return {
    key: code,
    code,
    name: name ? String(name).trim() : undefined,
    description: description ? String(description).trim() : undefined,
    method: method ? String(method).trim() : undefined,
    path: path ? String(path).trim() : undefined,
    module: module ? String(module).trim() : undefined,
  };
}

function normalizePermissions(input: PermissionListResponse | undefined): PermissionRow[] {
  const list = extractPermissionArray(input);
  const rows = list.map(toPermissionRow).filter(Boolean) as PermissionRow[];
  const map = new Map<string, PermissionRow>();
  rows.forEach((row) => {
    if (!map.has(row.key))
      map.set(row.key, row);
  });
  return Array.from(map.values());
}

function transformResult(
  response: PermissionListResponse | { data?: PermissionListResponse } | undefined,
): ProTableQueryResult<PermissionRow> {
  const rawPayload = (response as { data?: PermissionListResponse })?.data ?? response;
  const list = normalizePermissions(rawPayload as PermissionListResponse | undefined);
  return {
    list,
    total: list.length,
  };
}

function buildSyncMessage(payload: PermissionSyncResponse | { data?: PermissionSyncResponse } | undefined) {
  if (!payload)
    return null;

  const body = (payload as { data?: PermissionSyncResponse }).data ?? payload;
  if (typeof body === 'string')
    return body;

  const stats: string[] = [];
  if (typeof body?.created === 'number')
    stats.push(`新增 ${body.created}`);
  if (typeof body?.updated === 'number')
    stats.push(`更新 ${body.updated}`);
  if (typeof body?.deleted === 'number')
    stats.push(`删除 ${body.deleted}`);

  if (body?.message)
    return String(body.message);

  if (stats.length > 0)
    return `权限同步成功（${stats.join('，')}）`;

  return null;
}

/**
 * 权限列表页面
 */
export function PermissionsListPage() {
  const queryClient = useQueryClient();

  const tableQuery = useProTableQuery<
    PermissionRow,
    PermissionListParams,
    PermissionListResponse
  >({
    useQuery,
    queryKey: ['permissions', 'list'],
    queryFn: params => getPermissionList(params as PermissionListParams),
    resultTransform: transformResult,
    syncPaginationFromResult: false,
  });

  const syncMutation = useMutation({
    mutationFn: syncPermissions,
    onSuccess: (data) => {
      message.success(buildSyncMessage(data) ?? '权限同步成功');
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
    onError: (error: any) => {
      message.error(`同步失败: ${error.message}`);
    },
  });

  const columns: ColumnsType<PermissionRow> = [
    {
      title: '权限标识',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (_: string, row: PermissionRow) => row.description || row.name || '-',
    },
    {
      title: '资源',
      key: 'resource',
      render: (_: unknown, row: PermissionRow) => {
        if (!row.method && !row.path)
          return '-';
        return (
          <Tag color="geekblue">
            {row.method ? row.method.toUpperCase() : ''}
            {row.method && row.path ? ' ' : ''}
            {row.path ?? ''}
          </Tag>
        );
      },
    },
  ];

  const searchFields: ProTableSearchField<PermissionListParams>[] = [
    {
      name: 'q',
      label: '权限标识',
      placeholder: '请输入权限标识',
    },
  ];

  const handleSync = () => {
    Modal.confirm({
      title: '确认同步',
      content: '确定要同步权限吗？这将根据后端配置刷新权限列表。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => syncMutation.mutate(),
    });
  };

  return (
    <div className="h-full min-h-0">
      <ProTable<PermissionRow, PermissionListParams>
        columns={columns}
        data={tableQuery.data}
        loading={tableQuery.loading}
        rowKey="key"
        pagination={false}
        search={{
          fields: searchFields,
          values: tableQuery.search.values,
          onChange: tableQuery.search.onChange,
          onSubmit: tableQuery.search.onSubmit,
          onReset: tableQuery.search.onReset,
        }}
        onRefresh={tableQuery.onRefresh}
      />
    </div>
  );
}
