import { z } from 'zod';

/**
 * API 类型定义
 * 基于后端统一响应规范
 * 迁移说明: 核心类型已迁移至 Zod Schema，以支持运行时校验和自动化表单
 */

/**
 * 分页详情 Schema
 */
export const PaginationSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasMore: z.boolean(),
});
export type Pagination = z.infer<typeof PaginationSchema>;

/**
 * 元数据结构 Schema
 */
export const ApiMetaSchema = z.object({
  pagination: PaginationSchema.optional(),
  traceId: z.string().optional(),
  took: z.number().optional(),
}).catchall(z.any());
export type ApiMeta = z.infer<typeof ApiMetaSchema>;

/**
 * 错误对象结构 Schema
 */
export const ApiErrorSchema = z.object({
  code: z.number().optional(),
  status: z.number().optional(),
  name: z.string().optional(),
  message: z.string(),
  details: z.any().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * 基础响应结构 Schema 生成器
 * 用法: const UserResponseSchema = createApiResponseSchema(UserSchema);
 */
export function createApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    meta: ApiMetaSchema.optional(),
    error: ApiErrorSchema.nullable(),
  });
}

export interface ApiResponse<T = any> {
  data: T;
  meta?: ApiMeta;
  error: ApiError | null;
}

/**
 * 分页响应结构 Schema 生成器
 * 用法: const UserListResponseSchema = createPaginatedResponseSchema(UserSchema);
 */
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: z.array(dataSchema),
    meta: ApiMetaSchema.extend({
      pagination: PaginationSchema,
    }),
    error: z.null(),
  });
}

export interface PaginatedResponse<T = any> {
  data: T[];
  meta: ApiMeta & {
    pagination: Pagination;
  };
  error: null;
}

/**
 * 基础实体 Mixin Schema
 */
export const BaseEntitySchema = z.object({
  id: z.string(),
  createdAt: z.string().datetime().optional().or(z.string()), // 兼容 ISO 字符串
  updatedAt: z.string().datetime().optional().or(z.string()),
});
export type BaseEntity = z.infer<typeof BaseEntitySchema>;

/**
 * 分页请求参数 Schema
 */
export const PaginationParamsSchema = z.object({
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
});
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

/**
 * 业务错误类
 */
export class BusinessError extends Error {
  code?: number;
  status?: number;
  details?: any;

  constructor(error: ApiError) {
    super(error.message);
    this.name = error.name || 'BusinessError';
    this.code = error.code;
    this.status = error.status;
    this.details = error.details;
  }
}
