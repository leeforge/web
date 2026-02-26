/**
 * Axios HTTP 客户端实例
 *
 * 配置说明：
 * - 响应拦截器会自动从 ApiResponse<T> 解包 data 字段
 * - 请求拦截器自动注入 Authorization 与基础上下文 header（X-Client-Type/X-Trace-ID）
 * - 错误拦截器处理业务错误和 401 自动刷新
 */
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from './types';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { setupAuthInterceptor } from './interceptors/auth.interceptor';
import { setupErrorInterceptor } from './interceptors/error.interceptor';
import { setupLoggerInterceptor } from './interceptors/logger.interceptor';

/**
 * 创建 HTTP 客户端实例
 */
function createHttpClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });

  // 注册拦截器（顺序很重要）
  // 请求拦截器：后注册的先执行
  // 响应拦截器：先注册的先执行
  setupLoggerInterceptor(instance); // 日志（请求最后、响应最先）
  setupErrorInterceptor(instance); // 错误处理
  setupAuthInterceptor(instance); // 认证（请求最先、响应最后）

  return instance;
}

/**
 * 创建原始 HTTP 客户端（不自动解包，用于特殊场景如 Token 刷新）
 */
function createRawHttpClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });

  // 只注册日志和认证拦截器，不解包
  setupLoggerInterceptor(instance);
  setupAuthInterceptor(instance);

  return instance;
}

const httpInstance = createHttpClient();
const httpRawInstance = createRawHttpClient();

/**
 * 扩展请求配置类型
 */
export interface HttpRequestConfig extends AxiosRequestConfig {
  /** 跳过自动解包 */
  skipUnwrap?: boolean;
  /** 跳过错误处理 */
  skipErrorHandler?: boolean;
  /** 跳过认证 */
  skipAuth?: boolean;
  /** 跳过代管态 Token（强制使用普通会话 Token） */
  skipImpersonation?: boolean;
  /** 重试次数（内部使用） */
  _retryCount?: number;
}

/**
 * 扩展内部请求配置
 */
export interface InternalHttpRequestConfig extends InternalAxiosRequestConfig {
  skipUnwrap?: boolean;
  skipErrorHandler?: boolean;
  skipAuth?: boolean;
  skipImpersonation?: boolean;
  _retryCount?: number;
  _actingSession?: boolean;
}

/**
 * HTTP 客户端封装
 * 提供类型安全的请求方法，自动解包响应数据
 */
export const http = {
  /**
   * GET 请求
   */
  get<T>(url: string, config?: HttpRequestConfig): Promise<ApiResponse<T>> {
    return httpInstance.get(url, config);
  },

  /**
   * POST 请求
   */
  post<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<ApiResponse<T>> {
    return httpInstance.post(url, data, config);
  },

  /**
   * PUT 请求
   */
  put<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<ApiResponse<T>> {
    return httpInstance.put(url, data, config);
  },

  /**
   * PATCH 请求
   */
  patch<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<ApiResponse<T>> {
    return httpInstance.patch(url, data, config);
  },

  /**
   * DELETE 请求
   */
  delete<T>(url: string, config?: HttpRequestConfig): Promise<ApiResponse<T>> {
    return httpInstance.delete(url, config);
  },

  /**
   * 获取原始 axios 实例（高级用法）
   */
  instance: httpInstance,
};

/**
 * 原始 HTTP 客户端（不自动解包）
 * 用于特殊场景，如 Token 刷新
 */
export const httpRaw = {
  get<T>(url: string, config?: HttpRequestConfig): Promise<AxiosResponse<T>> {
    return httpRawInstance.get(url, config);
  },

  post<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<AxiosResponse<T>> {
    return httpRawInstance.post(url, data, config);
  },

  put<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<AxiosResponse<T>> {
    return httpRawInstance.put(url, data, config);
  },

  patch<T>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<AxiosResponse<T>> {
    return httpRawInstance.patch(url, data, config);
  },

  delete<T>(url: string, config?: HttpRequestConfig): Promise<AxiosResponse<T>> {
    return httpRawInstance.delete(url, config);
  },

  instance: httpRawInstance,
};

export type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig };
