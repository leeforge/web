/**
 * 认证拦截器
 * 双 Token 模式：
 * 1. 自动在请求头中注入 Access Token
 * 2. 401 时自动使用 Refresh Token 刷新
 * 3. 处理并发请求时的 Token 刷新队列
 */
import type { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import type { InternalHttpRequestConfig } from '../client';
import type { ApiResponse } from '../types';
import axios from 'axios';
import { AuthStore } from '@/stores';
import { getMessage } from '@/utils';
import { API_BASE_URL } from '../config';

const WEB_CLIENT_TYPE = 'web';
const CONTEXT_HEADER_EXCLUDED_PATHS = ['/auth/login', '/auth/register'];

function createTraceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function shouldSkipContextHeaders(url: string): boolean {
  return CONTEXT_HEADER_EXCLUDED_PATHS.some(path => url.includes(path));
}

function notifyImpersonationExpired(): void {
  try {
    getMessage().warning('代管会话已过期，请重新执行切租户');
  }
  catch {
    // 忽略 message 上下文尚未初始化的场景
  }
}

/**
 * Token 刷新器
 * 负责管理 Token 刷新流程
 */
class TokenRefresher {
  /** 是否正在刷新 Token */
  private isRefreshing = false;

  /** 待重试的请求队列 */
  private pendingRequests: Array<{
    config: InternalHttpRequestConfig;
    resolve: (value: AxiosResponse) => void;
    reject: (error: AxiosError) => void;
  }> = [];

  /** 公开接口路径（不需要认证） */
  private readonly publicPaths = [
    '/auth/login',
    '/captcha',
    '/auth/register',
    '/auth/refresh',
    '/init/',
  ];

  /**
   * 检查 URL 是否是公开接口
   */
  isPublicEndpoint(url: string): boolean {
    return this.publicPaths.some(path => url.includes(path));
  }

  /**
   * 检查 URL 是否是刷新 Token 的请求
   */
  isRefreshRequest(url: string): boolean {
    return url.includes('/auth/refresh');
  }

  /**
   * 执行 Token 刷新
   */
  async doRefresh(): Promise<string | null> {
    try {
      const refreshToken = AuthStore.getState().refreshToken;
      const selectedProjectId = AuthStore.getState().selectedProjectId;
      const refreshPayload = refreshToken ? { refreshToken } : {};

      const refreshHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Client-Type': WEB_CLIENT_TYPE,
        'X-Trace-ID': createTraceId(),
      };
      if (selectedProjectId !== null) {
        refreshHeaders['X-Project-ID'] = selectedProjectId;
      }

      const response = await axios.post<ApiResponse<{ accessToken: string }>>(
        `${API_BASE_URL}/auth/refresh`,
        refreshPayload,
        {
          headers: refreshHeaders,
          withCredentials: true,
        },
      );

      const responseData = response.data as ApiResponse<{ accessToken?: string }> & {
        accessToken?: string;
      };
      const newAccessToken = responseData?.data?.accessToken ?? responseData?.accessToken;

      if (newAccessToken) {
        AuthStore.getState().updateAccessToken(newAccessToken);
        return newAccessToken;
      }

      return null;
    }
    catch (error) {
      console.error('[TokenRefresher] 刷新请求失败:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Refresh Token 也过期了
        return null;
      }
      return null;
    }
  }

  /**
   * 处理刷新失败
   */
  handleRefreshFailure(): void {
    this.isRefreshing = false;

    // 拒绝所有待处理的请求
    this.pendingRequests.forEach(({ reject }) => {
      reject(new axios.AxiosError('Token refresh failed', '401'));
    });
    this.pendingRequests = [];

    AuthStore.getState().logout();

    // 跳转到登录页
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  /**
   * 刷新 Token 并重试请求
   */
  async refreshAndRetry(
    axiosInstance: AxiosInstance,
    config: InternalHttpRequestConfig,
    originalError: AxiosError,
  ): Promise<AxiosResponse> {
    // 第一个 401 请求触发刷新
    if (!this.isRefreshing) {
      this.isRefreshing = true;

      try {
        const newToken = await this.doRefresh();

        if (newToken) {
          this.isRefreshing = false;

          // 更新当前请求 header
          const retryHeaders = axios.AxiosHeaders.from(config.headers);
          retryHeaders.set('Authorization', `Bearer ${newToken}`);
          config.headers = retryHeaders;
          config._retryCount = (config._retryCount || 0) + 1;

          // 处理所有待处理的请求
          const pendingPromises = this.pendingRequests.map(async ({ config: pendingConfig, resolve, reject }) => {
            try {
              const pendingHeaders = axios.AxiosHeaders.from(pendingConfig.headers);
              pendingHeaders.set('Authorization', `Bearer ${newToken}`);
              pendingConfig.headers = pendingHeaders;
              const response = await axiosInstance.request(pendingConfig);
              resolve(response);
            }
            catch (err) {
              reject(err as AxiosError);
            }
          });

          this.pendingRequests = [];

          // 等待所有待处理请求完成
          await Promise.allSettled(pendingPromises);

          // 重试当前请求
          return axiosInstance.request(config);
        }

        // 刷新失败
        this.handleRefreshFailure();
        throw originalError;
      }
      catch {
        this.handleRefreshFailure();
        throw originalError;
      }
    }

    // 其他并发请求加入队列等待刷新完成
    return new Promise((resolve, reject) => {
      this.pendingRequests.push({ config, resolve, reject });
    });
  }
}

// 单例实例
const tokenRefresher = new TokenRefresher();

/**
 * 设置认证拦截器
 */
export function setupAuthInterceptor(instance: AxiosInstance): void {
  // 请求拦截器：注入 Authorization header
  instance.interceptors.request.use(
    (config: InternalHttpRequestConfig) => {
      const store = AuthStore.getState();
      const fallbackToken = store.accessToken;
      const selectedProjectId = store.selectedProjectId;
      const impersonation = config.skipImpersonation
        ? null
        : store.getImpersonationSession();
      const domainContext = impersonation
        ? { type: 'tenant', key: impersonation.targetTenantId }
        : store.actingDomain;
      const token = impersonation?.token || fallbackToken;
      const url = config.url || '';
      const skipContextHeader = shouldSkipContextHeaders(url);
      const headers = axios.AxiosHeaders.from(config.headers);
      const traceId = headers.get('X-Trace-ID') || createTraceId();
      config._actingSession = Boolean(impersonation);

      if (!config.skipImpersonation && !impersonation && store.impersonation) {
        notifyImpersonationExpired();
      }

      if (!config.skipAuth && token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      if (!skipContextHeader && domainContext?.type && domainContext?.key) {
        const explicitDomainType = headers.get('X-Domain-Type');
        const explicitDomainKey = headers.get('X-Domain-Key');
        const hasExplicitDomainPair = Boolean(explicitDomainType && explicitDomainKey);

        if (!hasExplicitDomainPair) {
          headers.set('X-Domain-Type', domainContext.type);
          headers.set('X-Domain-Key', domainContext.key);
        }
      }

      if (!skipContextHeader && selectedProjectId !== null) {
        const existingProjectId = headers.get('X-Project-ID');
        headers.set('X-Project-ID', existingProjectId || selectedProjectId);
      }

      headers.set('X-Client-Type', WEB_CLIENT_TYPE);
      headers.set('X-Trace-ID', String(traceId));
      config.headers = headers;

      return config;
    },
    error => Promise.reject(error),
  );

  // 响应拦截器：处理 401 错误，自动刷新 Token 并重试
  instance.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
      const config = error.config as InternalHttpRequestConfig | undefined;
      const status = error.response?.status;

      // 非 401 或无 config，直接返回
      if (status !== 401 || !config) {
        return Promise.reject(error);
      }

      const url = config.url || '';
      if (config._actingSession) {
        AuthStore.getState().stopImpersonation();
        notifyImpersonationExpired();
        return Promise.reject(error);
      }

      // 跳过公开接口和刷新请求
      if (tokenRefresher.isPublicEndpoint(url) || tokenRefresher.isRefreshRequest(url)) {
        return Promise.reject(error);
      }

      // 防止无限重试
      if ((config._retryCount || 0) >= 1) {
        tokenRefresher.handleRefreshFailure();
        return Promise.reject(error);
      }

      // 刷新 Token 并重试
      try {
        return await tokenRefresher.refreshAndRetry(instance, config, error);
      }
      catch (refreshError) {
        return Promise.reject(refreshError);
      }
    },
  );
}

export { tokenRefresher };
