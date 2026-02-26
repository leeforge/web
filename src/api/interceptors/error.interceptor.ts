/**
 * 错误处理拦截器
 * 统一处理业务错误、HTTP 错误和网络错误
 * 同时负责数据解包
 *
 * 注意：401 错误由 auth.interceptor.ts 处理（自动刷新 Token）
 */
import type { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import type { InternalHttpRequestConfig } from '../client';
import type { ApiResponse } from '../types';
import { getMessage } from '@/utils';
import { BusinessError } from '../types';

function extractResponseMessage(data: unknown): string | null {
  if (typeof data === 'string') {
    const message = data.trim();
    return message ? message.slice(0, 120) : null;
  }

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if (typeof obj.message === 'string' && obj.message.trim()) {
      return obj.message;
    }
    if (typeof obj.error === 'string' && obj.error.trim()) {
      return obj.error;
    }
  }

  return null;
}

function mapErrorCodeToStatus(code?: number): number | undefined {
  switch (code) {
    case 4001:
    case 4002:
      return 400;
    case 4003:
      return 404;
    case 4005:
      return 403;
    case 4006:
      return 401;
    case 4008:
      return 429;
    case 5000:
      return 500;
    default:
      return undefined;
  }
}

/**
 * 设置错误处理拦截器
 */
export function setupErrorInterceptor(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const config = response.config as InternalHttpRequestConfig;

      // 跳过错误处理
      if (config.skipErrorHandler) {
        return response;
      }

      const body = response.data;
      const status = response.status;

      // 处理业务错误（error 字段不为 null）
      if (body && body.error) {
        const error = body.error;

        const mappedStatus = mapErrorCodeToStatus(error.code);
        const effectiveStatus = mappedStatus ?? status;

        // 401 由 auth.interceptor 处理，这里不处理
        if (effectiveStatus === 401) {
          throw new BusinessError(error);
        }

        // 403 权限不足
        if (effectiveStatus === 403) {
          getMessage().error(error.message || '权限不足');
          throw new BusinessError(error);
        }

        // 429 请求过于频繁
        if (effectiveStatus === 429) {
          getMessage().warning('请求过于频繁，请稍后重试');
          throw new BusinessError(error);
        }

        // 404 资源不存在
        if (effectiveStatus === 404) {
          getMessage().error(error.message || '资源不存在');
          throw new BusinessError(error);
        }

        // 500+ 服务端错误
        if (effectiveStatus >= 500) {
          getMessage().error('服务器错误，请稍后重试');
          throw new BusinessError(error);
        }

        // 其他业务错误
        getMessage().error(error.message || '操作失败');
        throw new BusinessError(error);
      }

      // 自动解包：提取 data 字段
      if (config.skipUnwrap) {
        return response;
      }

      // 检查是否符合 ApiResponse 结构并解包
      if (body && typeof body === 'object' && 'data' in body) {
        // 返回解包后的数据（包含 meta 信息用于分页）
        return body as unknown as AxiosResponse;
      }

      return response;
    },
    (error: AxiosError) => {
      const config = error.config as InternalHttpRequestConfig | undefined;

      // 跳过错误处理
      if (config?.skipErrorHandler) {
        return Promise.reject(error);
      }

      // 网络错误
      if (error.code === 'ERR_NETWORK') {
        getMessage().error('网络连接失败，请检查网络');
        return Promise.reject(error);
      }

      // 超时错误
      if (error.code === 'ECONNABORTED') {
        getMessage().error('请求超时，请稍后重试');
        return Promise.reject(error);
      }

      // BusinessError 已经被上面处理过提示了
      if (error instanceof BusinessError) {
        return Promise.reject(error);
      }

      // 401 由 auth.interceptor 处理，这里跳过
      const status = error.response?.status;
      if (status === 401) {
        return Promise.reject(error);
      }

      // HTTP 错误
      if (error.response) {
        const responseMessage = extractResponseMessage(error.response.data);
        if (status! >= 500) {
          getMessage().error(responseMessage || '服务器错误，请稍后重试');
        }
        else if (status === 403) {
          getMessage().error(responseMessage || '权限不足');
        }
        else if (status === 404) {
          getMessage().error(responseMessage || '资源不存在');
        }
        else if (status === 429) {
          getMessage().warning('请求过于频繁，请稍后重试');
        }
        else if (status! >= 400) {
          getMessage().error(responseMessage || '请求失败，请检查参数');
        }
      }

      return Promise.reject(error);
    },
  );
}
