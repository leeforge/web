import { describe, expect, it } from 'bun:test';
import {
  buildLogClearInput,
  normalizeAuditLogList,
  normalizeOperationLogList,
  normalizeSystemErrorList,
} from './logs.api';

describe('logs api contract', () => {
  it('normalizes operation logs from responder payload', () => {
    const payload = {
      data: {
        items: [
          {
            id: 'op-1',
            method: 'GET',
            status: 200,
            path: '/api/v1/users',
            requestId: 'req-1',
            createdAt: '2026-02-19T08:00:00Z',
          },
        ],
        page: 2,
        pageSize: 10,
        total: 21,
      },
      meta: {
        pagination: {
          page: 2,
          pageSize: 10,
          total: 21,
          totalPages: 3,
          hasMore: true,
        },
      },
      error: null,
    };

    expect(normalizeOperationLogList(payload)).toEqual({
      list: [expect.objectContaining({ id: 'op-1', method: 'GET' })],
      page: 2,
      pageSize: 10,
      total: 21,
    });
  });

  it('normalizes system errors from array payload fallback', () => {
    const payload = {
      data: [
        {
          id: 'err-1',
          errorLevel: 'critical',
          errorType: 'panic',
          errorMsg: 'boom',
          requestId: 'req-9',
        },
      ],
      error: null,
    };

    const normalized = normalizeSystemErrorList(payload);
    expect(normalized.total).toBe(1);
    expect(normalized.list[0]).toMatchObject({
      id: 'err-1',
      errorLevel: 'critical',
    });
  });

  it('normalizes audit logs from snake_case payload keys', () => {
    const payload = {
      data: {
        audit_logs: [
          {
            id: 'audit-1',
            action: 'update',
            resource: 'user',
            resource_id: 'user-1',
            user_id: 'admin-1',
            ip_address: '127.0.0.1',
            createdAt: '2026-02-19T08:00:00Z',
          },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
      },
      error: null,
    };

    const normalized = normalizeAuditLogList(payload);
    expect(normalized.total).toBe(1);
    expect(normalized.list[0]).toMatchObject({
      id: 'audit-1',
      action: 'update',
      resource_id: 'user-1',
    });
  });

  it('builds clear payload with retentionDays only', () => {
    expect(buildLogClearInput(30)).toEqual({ retentionDays: 30 });
  });
});
