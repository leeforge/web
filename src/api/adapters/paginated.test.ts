import { describe, expect, it } from 'bun:test';
import { normalizePaginatedPayload } from './paginated';

interface Item {
  id: string;
}

describe('normalizePaginatedPayload', () => {
  it('uses meta.pagination and direct data array', () => {
    const result = normalizePaginatedPayload<Item>({
      data: [{ id: '1' }, { id: '2' }],
      meta: {
        pagination: {
          page: 2,
          pageSize: 10,
          total: 25,
        },
      },
    });

    expect(result).toEqual({
      list: [{ id: '1' }, { id: '2' }],
      page: 2,
      pageSize: 10,
      total: 25,
    });
  });

  it('falls back to embedded pagination and nested list keys', () => {
    const result = normalizePaginatedPayload<Item>({
      data: {
        users: [{ id: '10' }],
        page: 3,
        pageSize: 5,
        total: 12,
      },
    });

    expect(result).toEqual({
      list: [{ id: '10' }],
      page: 3,
      pageSize: 5,
      total: 12,
    });
  });

  it('returns defaults when payload shape is unknown', () => {
    const result = normalizePaginatedPayload<Item>({}, {
      defaultPage: 1,
      defaultPageSize: 20,
    });

    expect(result).toEqual({
      list: [],
      page: 1,
      pageSize: 20,
      total: 0,
    });
  });
});
