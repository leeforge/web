import type { InternalAxiosRequestConfig } from 'axios';
import type { InternalHttpRequestConfig } from '../client';
import type { ApiResponse } from '../types';
import type { ImpersonationSession } from '@/stores';
import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { AuthStore, createPlatformDomainContext, createTenantDomainContext } from '@/stores';
import { setupAuthInterceptor } from './auth.interceptor';

function buildSession(expiresAt: string): ImpersonationSession {
  return {
    token: 'acting-token',
    targetTenantId: 'tenant-acting',
    expiresAt,
    reason: 'unit-test',
    durationMinutes: 30,
    sourceDomainType: 'platform',
    sourceDomainKey: 'root',
    startedAt: new Date().toISOString(),
  };
}

function buildSuccessResponse(config: InternalAxiosRequestConfig) {
  return {
    data: { data: { ok: true }, error: null } as ApiResponse<{ ok: true }>,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  };
}

describe('auth interceptor', () => {
  beforeEach(() => {
    AuthStore.setState({
      user: null,
      accessToken: 'base-token',
      refreshToken: 'refresh-token',
      actingDomain: createPlatformDomainContext('fallback'),
      selectedProjectId: null,
      impersonation: null,
    });
  });

  afterEach(() => {
    mock.restore();
  });

  it('injects web headers and prefers acting token when impersonation is active', async () => {
    AuthStore.setState({
      impersonation: buildSession(new Date(Date.now() + 10 * 60_000).toISOString()),
    });

    const instance = axios.create();
    setupAuthInterceptor(instance);

    let capturedConfig: InternalHttpRequestConfig | undefined;
    instance.defaults.adapter = async (config) => {
      capturedConfig = config as InternalHttpRequestConfig;
      return buildSuccessResponse(config);
    };

    await instance.get('/users');

    expect(capturedConfig?._actingSession).toBe(true);
    const headers = axios.AxiosHeaders.from(capturedConfig?.headers);
    expect(headers.get('Authorization')).toBe('Bearer acting-token');
    expect(headers.get('X-Domain-Type')).toBe('tenant');
    expect(headers.get('X-Domain-Key')).toBe('tenant-acting');
    expect(headers.get('X-Client-Type')).toBe('web');
    expect(headers.get('X-Trace-ID')).toBeTruthy();
    expect(headers.get('X-Project-ID')).toBeUndefined();
  });

  it('falls back to normal token when impersonation session is expired', async () => {
    AuthStore.setState({
      impersonation: buildSession(new Date(Date.now() - 60_000).toISOString()),
    });

    const instance = axios.create();
    setupAuthInterceptor(instance);

    let capturedConfig: InternalHttpRequestConfig | undefined;
    instance.defaults.adapter = async (config) => {
      capturedConfig = config as InternalHttpRequestConfig;
      return buildSuccessResponse(config);
    };

    await instance.get('/users');

    expect(capturedConfig?._actingSession).toBe(false);
    const headers = axios.AxiosHeaders.from(capturedConfig?.headers);
    expect(headers.get('Authorization')).toBe('Bearer base-token');
    expect(headers.get('X-Domain-Type')).toBe('platform');
    expect(headers.get('X-Domain-Key')).toBe('root');
    expect(headers.get('X-Project-ID')).toBeUndefined();
    expect(AuthStore.getState().impersonation).toBeNull();
  });

  it('injects project header when project context exists', async () => {
    AuthStore.setState({
      actingDomain: createTenantDomainContext('tenant-a', 'explicit'),
      selectedProjectId: 'proj-cms-core',
    });

    const instance = axios.create();
    setupAuthInterceptor(instance);

    let capturedConfig: InternalHttpRequestConfig | undefined;
    instance.defaults.adapter = async (config) => {
      capturedConfig = config as InternalHttpRequestConfig;
      return buildSuccessResponse(config);
    };

    await instance.get('/users');

    const headers = axios.AxiosHeaders.from(capturedConfig?.headers);
    expect(headers.get('X-Domain-Type')).toBe('tenant');
    expect(headers.get('X-Domain-Key')).toBe('tenant-a');
    expect(headers.get('X-Project-ID')).toBe('proj-cms-core');
  });

  it('injects domain headers in tenant scope', async () => {
    AuthStore.setState({
      actingDomain: createTenantDomainContext('tenant-abc-123', 'explicit'),
    });

    const instance = axios.create();
    setupAuthInterceptor(instance);

    let capturedConfig: InternalHttpRequestConfig | undefined;
    instance.defaults.adapter = async (config) => {
      capturedConfig = config as InternalHttpRequestConfig;
      return buildSuccessResponse(config);
    };

    await instance.get('/users');

    const headers = axios.AxiosHeaders.from(capturedConfig?.headers);
    expect(headers.get('X-Domain-Type')).toBe('tenant');
    expect(headers.get('X-Domain-Key')).toBe('tenant-abc-123');
    expect(headers.get('Authorization')).toBe('Bearer base-token');
  });

  it('injects domain headers in platform scope', async () => {
    AuthStore.setState({
      actingDomain: createPlatformDomainContext('explicit'),
    });

    const instance = axios.create();
    setupAuthInterceptor(instance);

    let capturedConfig: InternalHttpRequestConfig | undefined;
    instance.defaults.adapter = async (config) => {
      capturedConfig = config as InternalHttpRequestConfig;
      return buildSuccessResponse(config);
    };

    await instance.get('/users');

    const headers = axios.AxiosHeaders.from(capturedConfig?.headers);
    expect(headers.get('X-Domain-Type')).toBe('platform');
    expect(headers.get('X-Domain-Key')).toBe('root');
  });

  it('skips domain headers on auth login and register endpoints', async () => {
    AuthStore.setState({
      actingDomain: createTenantDomainContext('tenant-abc-123', 'explicit'),
    });

    const instance = axios.create();
    setupAuthInterceptor(instance);

    let capturedConfig: InternalHttpRequestConfig | undefined;
    instance.defaults.adapter = async (config) => {
      capturedConfig = config as InternalHttpRequestConfig;
      return buildSuccessResponse(config);
    };

    await instance.post('/auth/login', { username: 'test', password: 'test' });

    const headers = axios.AxiosHeaders.from(capturedConfig?.headers);
    expect(headers.get('X-Domain-Type')).toBeUndefined();
    expect(headers.get('X-Domain-Key')).toBeUndefined();
  });

  it('falls back to actingDomain when impersonation expires and tenant context exists', async () => {
    AuthStore.setState({
      actingDomain: createTenantDomainContext('tenant-previously-selected', 'explicit'),
      impersonation: buildSession(new Date(Date.now() - 60_000).toISOString()),
    });

    const instance = axios.create();
    setupAuthInterceptor(instance);

    let capturedConfig: InternalHttpRequestConfig | undefined;
    instance.defaults.adapter = async (config) => {
      capturedConfig = config as InternalHttpRequestConfig;
      return buildSuccessResponse(config);
    };

    await instance.get('/users');

    expect(capturedConfig?._actingSession).toBe(false);
    const headers = axios.AxiosHeaders.from(capturedConfig?.headers);
    expect(headers.get('Authorization')).toBe('Bearer base-token');
    expect(headers.get('X-Domain-Type')).toBe('tenant');
    expect(headers.get('X-Domain-Key')).toBe('tenant-previously-selected');
    expect(AuthStore.getState().impersonation).toBeNull();
  });

  it('keeps explicit domain headers when request sets them manually', async () => {
    const instance = axios.create();
    setupAuthInterceptor(instance);

    let capturedConfig: InternalHttpRequestConfig | undefined;
    instance.defaults.adapter = async (config) => {
      capturedConfig = config as InternalHttpRequestConfig;
      return buildSuccessResponse(config);
    };

    await instance.get('/users', {
      headers: {
        'X-Domain-Type': 'tenant',
        'X-Domain-Key': 'domain-uuid-001',
      },
    });

    const headers = axios.AxiosHeaders.from(capturedConfig?.headers);
    expect(headers.get('X-Domain-Type')).toBe('tenant');
    expect(headers.get('X-Domain-Key')).toBe('domain-uuid-001');
  });

  it('clears impersonation session on 401 and does not trigger refresh flow', async () => {
    AuthStore.setState({
      impersonation: buildSession(new Date(Date.now() + 10 * 60_000).toISOString()),
    });

    const refreshSpy = spyOn(axios, 'post');

    const instance = axios.create();
    setupAuthInterceptor(instance);
    instance.defaults.adapter = async (config) => {
      const response = {
        data: { error: { message: 'unauthorized' } },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      };
      throw new axios.AxiosError('Unauthorized', '401', config, undefined, response);
    };

    await expect(instance.get('/users')).rejects.toBeTruthy();

    expect(AuthStore.getState().impersonation).toBeNull();
    expect(refreshSpy).not.toHaveBeenCalled();
  });
});
