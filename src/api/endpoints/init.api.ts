import { z } from 'zod';
import { http } from '../client';

/**
 * 初始化状态 DTO Schema
 */
export const InitializeStatusDTOSchema = z.object({
  initialized: z.boolean(),
  hasAdmin: z.boolean(),
  hasRoles: z.literal(false),
  version: z.string(),
});
export type InitializeStatusDTO = z.infer<typeof InitializeStatusDTOSchema>;

/**
 * 初始化参数 Schema
 */
export const InitializeParamsSchema = z.object({
  username: z.string().min(3, '用户名至少3位').max(50, '用户名最多50个字符'),
  nickname: z.string().min(2, '昵称至少2位'),
  email: z.email('邮箱格式不正确'),
  password: z.string().min(6, '密码长度至少6位'),
  initKey: z.string().min(6, '秘钥长度至少6位'),
});
export type InitializeParams = z.infer<typeof InitializeParamsSchema>;

export function checkInitStatus() {
  return http.get<InitializeStatusDTO>('/init/status');
}

export function initialize({ initKey, ...adminData }: InitializeParams) {
  return http.post<void>('/init/setup', {
    initKey,
    admin: adminData,
  });
}
