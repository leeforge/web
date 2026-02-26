export type LogsTabKey = 'operations' | 'errors' | 'audits';

export function getLogsRowActionLabels(_tab: LogsTabKey): string[] {
  return ['删除'];
}
