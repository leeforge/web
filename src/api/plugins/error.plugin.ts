/**
 * 错误处理插件
 * 统一处理业务错误、HTTP 错误和网络错误
 *
 * 注意：401 错误由 auth.plugin.ts 处理（自动刷新 Token）
 */
import type { HookFetchPlugin } from 'hook-fetch';
import type { ApiResponse } from '../types';
import { getMessage } from '@/utils/modules/antd-static';
import { BusinessError } from '../types';

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

export const errorPlugin: HookFetchPlugin = {
  name: 'error-plugin',
  priority: 50,

  afterResponse: async (context) => {
    const { response } = context;

    // 检查是否是 JSON 响应
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return context;
    }

    // 获取已解析的结果
    const body = context.result as ApiResponse;
    const status = response.status;

    // 处理业务错误（error 字段不为 null）
    if (body && body.error) {
      const error = body.error;

      const mappedStatus = mapErrorCodeToStatus(error.code);
      const effectiveStatus = mappedStatus ?? status;

      // 401 由 auth.plugin 的 onError 处理，这里不处理
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

    return context;
  },

  onError: async (error) => {
    // 网络错误
    if (error instanceof TypeError && error.message.includes('fetch')) {
      getMessage().error('网络连接失败，请检查网络');
      return error;
    }

    // BusinessError 已经被 afterResponse 处理过提示了
    if (error instanceof BusinessError) {
      return error;
    }

    // 401 由 auth.plugin 处理，这里跳过
    const status = error.status || error.response?.status;
    if (status === 401) {
      return error;
    }

    // hook-fetch 的 ResponseError
    if (error.response) {
      if (status! >= 500) {
        getMessage().error('服务器错误，请稍后重试');
      }
      else if (status === 403) {
        getMessage().error('权限不足');
      }
      else if (status === 404) {
        getMessage().error('资源不存在');
      }
      else if (status === 429) {
        getMessage().warning('请求过于频繁，请稍后重试');
      }
      else if (status! >= 400) {
        getMessage().error('请求失败，请检查参数');
      }
    }

    return error;
  },
};
