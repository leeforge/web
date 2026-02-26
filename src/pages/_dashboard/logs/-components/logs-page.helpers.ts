import type {
  AuditLogListParams,
  OperationLogListParams,
  SystemErrorListParams,
} from '@/api/endpoints/logs.api';

type OperationFilters = {
  page?: number;
  pageSize?: number;
  method?: string;
  status?: number;
  startDate?: string;
  endDate?: string;
};

type ErrorFilters = {
  page?: number;
  pageSize?: number;
  level?: string;
  type?: string;
  request_id?: string;
};

type AuditFilters = {
  page?: number;
  pageSize?: number;
  action?: string;
  resource?: string;
  resource_id?: string;
  user_id?: string;
  ip?: string;
  startDate?: string;
  endDate?: string;
};

export function buildOperationLogListParams(input: OperationFilters): OperationLogListParams {
  return {
    page: input.page,
    pageSize: input.pageSize,
    method: input.method?.trim() || undefined,
    status: input.status,
    startDate: input.startDate,
    endDate: input.endDate,
  };
}

export function buildSystemErrorListParams(input: ErrorFilters): SystemErrorListParams {
  return {
    page: input.page,
    pageSize: input.pageSize,
    level: input.level?.trim() || undefined,
    type: input.type?.trim() || undefined,
    request_id: input.request_id?.trim() || undefined,
  };
}

export function buildAuditLogListParams(input: AuditFilters): AuditLogListParams {
  return {
    page: input.page,
    pageSize: input.pageSize,
    action: input.action?.trim() || undefined,
    resource: input.resource?.trim() || undefined,
    resource_id: input.resource_id?.trim() || undefined,
    user_id: input.user_id?.trim() || undefined,
    ip: input.ip?.trim() || undefined,
    startDate: input.startDate,
    endDate: input.endDate,
  };
}

export function formatLogDateTime(value?: string): string {
  if (!value) {
    return '-';
  }
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) {
    return value;
  }
  return new Date(ts).toLocaleString('zh-CN');
}

export function getErrorLevelTagColor(level?: string): string {
  if (level === 'critical') {
    return 'red';
  }
  if (level === 'error') {
    return 'volcano';
  }
  if (level === 'warning') {
    return 'orange';
  }
  if (level === 'info') {
    return 'blue';
  }
  return 'default';
}
