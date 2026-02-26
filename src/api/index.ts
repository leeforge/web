/**
 * API 层统一导出
 */

// 导出 HTTP 客户端
export { http, httpRaw } from './client';
export type { HttpRequestConfig, InternalHttpRequestConfig } from './client';

// 导出所有 API 端点
export * from './endpoints';

// 导出拦截器（供高级用户自定义）
export {
  setupAuthInterceptor,
  setupErrorInterceptor,
  setupLoggerInterceptor,
} from './interceptors';

// 导出类型
export type {
  ApiError,
  ApiMeta,
  ApiResponse,
  BaseEntity,
  PaginatedResponse,
  Pagination,
  PaginationParams,
} from './types';

export { BusinessError } from './types';
