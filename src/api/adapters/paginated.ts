interface NormalizePaginatedPayloadOptions {
  listKeys?: string[];
  defaultPage?: number;
  defaultPageSize?: number;
}

export interface NormalizedPaginatedPayload<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_LIST_KEYS = ['items', 'users', 'tenants', 'list', 'records'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toPositiveNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  return fallback;
}

function toNonNegativeNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }
  return fallback;
}

function pickList<T>(source: Record<string, unknown>, keys: string[]): T[] {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) {
      return value as T[];
    }
  }
  return [];
}

export function normalizePaginatedPayload<T>(
  payload: unknown,
  options: NormalizePaginatedPayloadOptions = {},
): NormalizedPaginatedPayload<T> {
  const {
    listKeys = DEFAULT_LIST_KEYS,
    defaultPage = 1,
    defaultPageSize = 20,
  } = options;

  const baseRecord = isRecord(payload) ? payload : {};
  const dataNode = 'data' in baseRecord ? baseRecord.data : payload;
  const dataRecord = isRecord(dataNode) ? dataNode : {};
  const paginationNode = isRecord(baseRecord.meta) && isRecord(baseRecord.meta.pagination)
    ? baseRecord.meta.pagination
    : undefined;

  const list = Array.isArray(dataNode)
    ? (dataNode as T[])
    : pickList<T>(dataRecord, listKeys);

  const total = toNonNegativeNumber(
    paginationNode?.total ?? dataRecord.total,
    list.length,
  );
  const page = toPositiveNumber(
    paginationNode?.page ?? dataRecord.page,
    defaultPage,
  );
  const pageSize = toPositiveNumber(
    paginationNode?.pageSize ?? dataRecord.pageSize,
    list.length > 0 ? list.length : defaultPageSize,
  );

  return {
    list,
    total,
    page,
    pageSize,
  };
}
