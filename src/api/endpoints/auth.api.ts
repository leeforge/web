import { z } from 'zod';
import { http, httpRaw } from '../client';
import { UserSchema } from './user.api';

/**
 * 认证相关 API
 * 双 Token 模式：Access Token + Refresh Token（有效期由后端控制）
 */

/**
 * 登录请求参数 Schema
 */
export const LoginParamsSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
  captchaId: z.string().optional(),
  captchaAnswer: z.string().optional(),
  rememberMe: z.boolean().optional(),
});
export type LoginParams = z.infer<typeof LoginParamsSchema>;

/**
 * 登录响应数据 Schema
 * 包含双 Token
 */
export const LoginDataSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresIn: z.number().optional(), // 秒（示例：900）
  user: z.lazy(() => UserSchema),
});
export type LoginData = z.infer<typeof LoginDataSchema>;

/**
 * 刷新 Token 请求参数 Schema
 */
export const RefreshTokenParamsSchema = z.object({
  refreshToken: z.string().optional(),
});
export type RefreshTokenParams = z.infer<typeof RefreshTokenParamsSchema>;

/**
 * 刷新 Token 响应数据 Schema
 */
export const RefreshTokenDataSchema = z.object({
  accessToken: z.string(),
});
export type RefreshTokenData = z.infer<typeof RefreshTokenDataSchema>;

/**
 * 登录
 * @returns 包含 accessToken, refreshToken, user 的响应
 */
export function login(params: LoginParams) {
  return http.post<LoginData>('/auth/login', params, { skipAuth: true });
}

/**
 * 登出
 * 后端会将 Token 加入黑名单
 */
export function logout() {
  return http.post<void>('/auth/logout', undefined, { skipImpersonation: true });
}

/**
 * 刷新 Access Token
 * 使用 Refresh Token 获取新的 Access Token
 *
 * 注意：使用 httpRaw 避免触发自动刷新逻辑导致循环
 */
export async function refreshToken(params: RefreshTokenParams = {}) {
  const response = await httpRaw.post<{ data: RefreshTokenData }>('/auth/refresh', params);
  return response.data;
}

/**
 * 获取当前用户信息
 */
export function getUserInfo() {
  return http.get<z.infer<typeof UserSchema>>('/profile');
}

/**
 * 修改密码
 */
export function changePassword(params: { oldPassword: string; newPassword: string }) {
  return http.post<void>('/auth/change-password', params);
}

export const RegisterSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  email: z.email('邮箱格式不正确'),
  nickName: z.string().min(1, '昵称不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

export type RegisterParams = z.infer<typeof RegisterSchema>;
