/**
 * 认证插件
 * 双 Token 模式：
 * 1. 自动在请求头中注入 Access Token
 * 2. 401 时自动使用 Refresh Token 刷新（在 onError 中处理）
 * 3. 处理并发请求时的 Token 刷新队列
 */
import type { HookFetchPlugin, RequestConfig, ResponseError } from 'hook-fetch';
import type { AnyObject } from 'typescript-api-pro';
import { redirect } from '@tanstack/react-router';
import { message } from 'antd';
import EventEmitter from 'eventemitter3';
import hookFetch from 'hook-fetch';
import { AuthStore } from '@/stores';
import { API_BASE_URL } from '../config';

const CONTEXT_HEADER_EXCLUDED_PATHS = ['/auth/login', '/auth/register'];

function shouldSkipContextHeaders(url: string): boolean {
  return CONTEXT_HEADER_EXCLUDED_PATHS.some(path => url.includes(path));
}

/** Token 刷新事件类型 */
interface TokenRefresherEvents {
  /** Token 刷新成功 */
  refreshed: (token: string) => void;
  /** Token 刷新失败 */
  failed: () => void;
}

/**
 * Token 刷新器
 * 负责管理 Token 刷新流程，包括：
 * - 刷新状态管理
 * - 基于 EventEmitter 的事件订阅
 * - 请求重试
 */
class TokenRefresher extends EventEmitter<TokenRefresherEvents> {
  /** 是否正在刷新 Token */
  private isRefreshing = false;

  /** 公开接口路径（不需要认证） */
  private readonly publicPaths = [
    '/auth/login',
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
   * 从 config 构建完整 URL
   */
  buildUrl(config: RequestConfig<AnyObject>): string {
    return config.baseURL ? `${config.baseURL}${config.url || ''}` : (config.url || '');
  }

  /**
   * 执行 Token 刷新
   */
  private async doRefresh(): Promise<string | null> {
    try {
      const refreshToken = AuthStore.getState().refreshToken;
      if (!refreshToken) {
        return null;
      }

      const projectId = AuthStore.getState().selectedProjectId;
      const response = await hookFetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(projectId !== null ? { 'X-Project-ID': projectId } : {}),
        },
        body: JSON.stringify({ refreshToken }),
        withCredentials: true,
      });

      if (!response.ok) {
        if (response.status === 401) {
          return null;
        }
        message.error('Token 刷新失败，请重新登录');
        return null;
      }

      const result = await response.json();
      const newAccessToken = result.data?.accessToken;

      if (newAccessToken) {
        AuthStore.getState().updateAccessToken(newAccessToken);
        return newAccessToken;
      }

      return null;
    }
    catch {
      return null;
    }
  }

  /**
   * 重试请求
   */
  private async retryRequest(config: RequestConfig<unknown>, newToken: string): Promise<Response> {
    const headers = new Headers(config.headers);
    headers.set('Authorization', `Bearer ${newToken}`);
    const projectId = AuthStore.getState().selectedProjectId;
    if (projectId !== null && !headers.has('X-Project-ID')) {
      headers.set('X-Project-ID', projectId);
    }

    return fetch(this.buildUrl(config), {
      method: config.method || 'GET',
      headers,
      body: config.data ? JSON.stringify(config.data) : undefined,
    });
  }

  /**
   * 处理刷新失败
   */
  private handleRefreshFailure(): void {
    this.isRefreshing = false;
    this.emit('failed');
    AuthStore.getState().logout();
    redirect({ to: '/login' });
  }

  /**
   * 刷新 Token 并重试请求
   * @returns 重试成功返回响应数据，失败返回原错误
   */
  async refreshAndRetry(config: RequestConfig<AnyObject>, originalError: ResponseError): Promise<unknown> {
    // 第一个 401 请求触发刷新
    if (!this.isRefreshing) {
      this.isRefreshing = true;

      try {
        const newToken = await this.doRefresh();

        if (newToken) {
          this.isRefreshing = false;
          this.emit('refreshed', newToken);

          // 重试当前请求
          const response = await this.retryRequest(config, newToken);

          if (response.ok) {
            return response.json();
          }
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

    // 其他并发请求等待刷新完成
    return new Promise((resolve) => {
      // 使用 once 确保只监听一次
      this.once('refreshed', async (newToken) => {
        try {
          const response = await this.retryRequest(config, newToken);

          if (response.ok) {
            resolve(response.json());
          }
          else {
            resolve(originalError);
          }
        }
        catch {
          resolve(originalError);
        }
      });

      // 刷新失败时也需要处理
      this.once('failed', () => {
        resolve(originalError);
      });
    });
  }
}

// 单例实例
const tokenRefresher = new TokenRefresher();

/**
 * 认证插件
 */
export const authPlugin: HookFetchPlugin = {
  name: 'auth-plugin',
  priority: 100,

  /**
   * beforeRequest: 注入 Authorization header
   */
  async beforeRequest(config) {
    const token = AuthStore.getState().accessToken;
    const projectId = AuthStore.getState().selectedProjectId;
    const url = config.url || '';
    const skipContextHeader = shouldSkipContextHeaders(url);

    if (token) {
      config.headers = new Headers(config.headers);
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    if (!skipContextHeader) {
      config.headers = new Headers(config.headers);
      if (projectId !== null && !config.headers.has('X-Project-ID')) {
        config.headers.set('X-Project-ID', projectId);
      }
    }

    return config;
  },

  /**
   * onError: 处理 401 错误，自动刷新 Token 并重试
   */
  async onError(error, config) {
    const status = error.status || error.response?.status;

    // 非 401 或无 config，直接返回
    if (status !== 401 || !config) {
      return error;
    }

    const url = tokenRefresher.buildUrl(config as RequestConfig<AnyObject>);

    // 跳过公开接口和刷新请求
    if (tokenRefresher.isPublicEndpoint(url) || tokenRefresher.isRefreshRequest(url)) {
      return error;
    }
    // 刷新 Token 并重试
    try {
      const res = tokenRefresher.refreshAndRetry(config as RequestConfig<AnyObject>, error);
      return {
        resolve: async () => new Response(await res.json()),
      };
    }
    catch {
      return error;
    }
  },
};
