import { z } from 'zod';
import { normalizePaginatedPayload } from '../adapters/paginated';
import { http } from '../client';
import { BaseEntitySchema, PaginationParamsSchema } from '../types';

export const OperationLogSchema = BaseEntitySchema.extend({
  method: z.string().optional(),
  status: z.number().int().optional(),
  path: z.string().optional(),
  requestId: z.string().optional(),
  userId: z.string().optional(),
  clientIp: z.string().optional(),
  userAgent: z.string().optional(),
  latency: z.number().int().optional(),
  errorMessage: z.string().optional(),
});
export type OperationLog = z.infer<typeof OperationLogSchema>;

export const SystemErrorSchema = BaseEntitySchema.extend({
  errorLevel: z.string().optional(),
  errorType: z.string().optional(),
  errorMsg: z.string().optional(),
  errorCode: z.string().optional(),
  requestId: z.string().optional(),
  requestMethod: z.string().optional(),
  requestPath: z.string().optional(),
  userId: z.string().optional(),
});
export type SystemError = z.infer<typeof SystemErrorSchema>;

export const AuditLogSchema = BaseEntitySchema.extend({
  action: z.string().optional(),
  resource: z.string().optional(),
  resourceId: z.string().optional(),
  resource_id: z.string().optional(),
  userId: z.string().optional(),
  user_id: z.string().optional(),
  createdById: z.string().optional(),
  ip: z.string().optional(),
  ipAddress: z.string().optional(),
  ip_address: z.string().optional(),
  userAgent: z.string().optional(),
  user_agent: z.string().optional(),
  before: z.record(z.string(), z.unknown()).nullable().optional(),
  after: z.record(z.string(), z.unknown()).nullable().optional(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

export const OperationLogListParamsSchema = PaginationParamsSchema.extend({
  method: z.string().optional(),
  status: z.number().int().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type OperationLogListParams = z.infer<typeof OperationLogListParamsSchema>;

export const SystemErrorListParamsSchema = PaginationParamsSchema.extend({
  level: z.string().optional(),
  type: z.string().optional(),
  request_id: z.string().optional(),
});
export type SystemErrorListParams = z.infer<typeof SystemErrorListParamsSchema>;

export const AuditLogListParamsSchema = PaginationParamsSchema.extend({
  action: z.string().optional(),
  resource: z.string().optional(),
  resource_id: z.string().optional(),
  user_id: z.string().optional(),
  ip: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type AuditLogListParams = z.infer<typeof AuditLogListParamsSchema>;

export function listOperationLogs(params?: OperationLogListParams) {
  return http.get<unknown>('/logs/operations', { params });
}

export function listSystemErrors(params?: SystemErrorListParams) {
  return http.get<unknown>('/logs/errors', { params });
}

export function listAuditLogs(params?: AuditLogListParams) {
  return http.get<unknown>('/logs/audits', { params });
}

export function deleteOperationLog(id: string) {
  return http.delete<unknown>(`/logs/operations/${id}`);
}

export function deleteSystemError(id: string) {
  return http.delete<unknown>(`/logs/errors/${id}`);
}

export function deleteAuditLog(id: string) {
  return http.delete<unknown>(`/logs/audits/${id}`);
}

export function clearOperationLogs(input: { retentionDays: number }) {
  return http.post<unknown>('/logs/operations/clear', input);
}

export function clearSystemErrors(input: { retentionDays: number }) {
  return http.post<unknown>('/logs/errors/clear', input);
}

export function clearAuditLogs(input: { retentionDays: number }) {
  return http.post<unknown>('/logs/audits/clear', input);
}

export function buildLogClearInput(retentionDays: number) {
  return { retentionDays };
}

export function normalizeOperationLogList(payload: unknown) {
  return normalizePaginatedPayload<OperationLog>(payload, {
    listKeys: ['items', 'operationLogs', 'operation_logs', 'list', 'records'],
  });
}

export function normalizeSystemErrorList(payload: unknown) {
  return normalizePaginatedPayload<SystemError>(payload, {
    listKeys: ['items', 'systemErrors', 'system_errors', 'list', 'records'],
  });
}

export function normalizeAuditLogList(payload: unknown) {
  return normalizePaginatedPayload<AuditLog>(payload, {
    listKeys: ['items', 'auditLogs', 'audit_logs', 'audits', 'list', 'records'],
  });
}
