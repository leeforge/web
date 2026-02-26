import { describe, expect, it } from 'bun:test';
import { getLogsRowActionLabels } from './logs-row-actions';

describe('logs row actions', () => {
  it('returns operation-log actions', () => {
    expect(getLogsRowActionLabels('operations')).toEqual(['删除']);
  });

  it('returns system-error actions', () => {
    expect(getLogsRowActionLabels('errors')).toEqual(['删除']);
  });

  it('returns audit-log actions', () => {
    expect(getLogsRowActionLabels('audits')).toEqual(['删除']);
  });
});
