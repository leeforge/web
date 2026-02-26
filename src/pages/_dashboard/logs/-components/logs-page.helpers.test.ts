import { describe, expect, it } from 'bun:test';
import {
  buildAuditLogListParams,
  buildOperationLogListParams,
  buildSystemErrorListParams,
  formatLogDateTime,
  getErrorLevelTagColor,
} from './logs-page.helpers';

describe('logs page helpers', () => {
  it('maps operation filters to backend params', () => {
    const params = buildOperationLogListParams({
      page: 3,
      pageSize: 50,
      method: ' GET ',
      status: 500,
      startDate: '2026-02-18T00:00:00Z',
      endDate: '2026-02-19T00:00:00Z',
    });

    expect(params).toEqual({
      page: 3,
      pageSize: 50,
      method: 'GET',
      status: 500,
      startDate: '2026-02-18T00:00:00Z',
      endDate: '2026-02-19T00:00:00Z',
    });
  });

  it('maps system-error filters and trims request_id', () => {
    const params = buildSystemErrorListParams({
      page: 1,
      pageSize: 20,
      level: 'critical',
      type: 'panic',
      request_id: ' req-1 ',
    });

    expect(params).toEqual({
      page: 1,
      pageSize: 20,
      level: 'critical',
      type: 'panic',
      request_id: 'req-1',
    });
  });

  it('maps audit filters and trims snake_case fields', () => {
    const params = buildAuditLogListParams({
      page: 2,
      pageSize: 20,
      action: ' update ',
      resource: ' user ',
      resource_id: ' user-1 ',
      user_id: ' admin-1 ',
      ip: ' 127.0.0.1 ',
      startDate: '2026-02-18T00:00:00Z',
      endDate: '2026-02-19T00:00:00Z',
    });

    expect(params).toEqual({
      page: 2,
      pageSize: 20,
      action: 'update',
      resource: 'user',
      resource_id: 'user-1',
      user_id: 'admin-1',
      ip: '127.0.0.1',
      startDate: '2026-02-18T00:00:00Z',
      endDate: '2026-02-19T00:00:00Z',
    });
  });

  it('formats time and maps level colors', () => {
    expect(formatLogDateTime('2026-02-19T08:00:00Z')).toContain('2026');
    expect(getErrorLevelTagColor('critical')).toBe('red');
    expect(getErrorLevelTagColor('warning')).toBe('orange');
    expect(getErrorLevelTagColor('unknown')).toBe('default');
  });
});
