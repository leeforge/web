import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { AuthStore, createTenantDomainContext } from '@/stores';
import { normalizePaginatedPayload } from './adapters/paginated';
import { http, httpRaw } from './client';
import { login, refreshToken } from './endpoints/auth.api';
import { getUserList } from './endpoints/user.api';

const baseUser = {
  id: 'u-1',
  username: 'tester',
  email: 'tester@example.com',
  status: 'active' as const,
};

describe('runtime smoke checks', () => {
  let httpAdapter: AxiosAdapter | undefined;
  let httpRawAdapter: AxiosAdapter | undefined;

  beforeEach(() => {
    httpAdapter = http.instance.defaults.adapter;
    httpRawAdapter = httpRaw.instance.defaults.adapter;
  });

  afterEach(() => {
    http.instance.defaults.adapter = httpAdapter;
    httpRaw.instance.defaults.adapter = httpRawAdapter;
  });

  it('smoke: request carries project header when project context is selected', async () => {
    AuthStore.setState({
      actingDomain: createTenantDomainContext('test-tenant', 'explicit'),
      selectedProjectId: 'proj-cms-core',
      accessToken: 'token-ctx',
    });

    let capturedConfig: InternalAxiosRequestConfig | undefined;
    http.instance.defaults.adapter = async (config) => {
      capturedConfig = config;
      return {
        data: {
          data: [baseUser],
          meta: {
            pagination: {
              page: 1,
              pageSize: 20,
              total: 1,
              totalPages: 1,
              hasMore: false,
            },
          },
          error: null,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    await getUserList({ page: 1, pageSize: 20 });
    const headers = axios.AxiosHeaders.from(capturedConfig?.headers);
    expect(headers.get('X-Domain-Type')).toBe('tenant');
    expect(headers.get('X-Domain-Key')).toBe('test-tenant');
    expect(headers.get('X-Project-ID')).toBe('proj-cms-core');
  });

  it('smoke: login request keeps web context headers', async () => {
    let capturedConfig: InternalAxiosRequestConfig | undefined;
    http.instance.defaults.adapter = async (config) => {
      capturedConfig = config;
      return {
        data: {
          data: {
            accessToken: 'token-login',
            user: baseUser,
          },
          error: null,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    const result = await login({
      username: 'tester',
      password: 'password',
      captchaId: 'captcha-id',
      captchaAnswer: '1234',
    });

    expect(capturedConfig?.url).toBe('/auth/login');
    const headers = axios.AxiosHeaders.from(capturedConfig?.headers);
    expect(headers.get('X-Client-Type')).toBe('web');
    expect(headers.get('X-Trace-ID')).toBeTruthy();
    expect(result.data.accessToken).toBe('token-login');
  });

  it('smoke: refresh request uses raw client with credentials', async () => {
    let capturedConfig: InternalAxiosRequestConfig | undefined;
    httpRaw.instance.defaults.adapter = async (config) => {
      capturedConfig = config;
      return {
        data: {
          data: {
            accessToken: 'token-refreshed',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    const result = await refreshToken();

    expect(capturedConfig?.url).toBe('/auth/refresh');
    expect(capturedConfig?.withCredentials).toBe(true);
    expect(result.data.accessToken).toBe('token-refreshed');
  });

  it('smoke: list payload is compatible with embedded pagination shape', async () => {
    http.instance.defaults.adapter = async (config) => {
      return {
        data: {
          data: {
            users: [baseUser],
            page: 2,
            pageSize: 5,
            total: 11,
          },
          error: null,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    const response = await getUserList({ page: 2, pageSize: 5 });
    const normalized = normalizePaginatedPayload<typeof baseUser>(response, {
      listKeys: ['users'],
    });

    expect(normalized).toEqual({
      list: [baseUser],
      page: 2,
      pageSize: 5,
      total: 11,
    });
  });
});
