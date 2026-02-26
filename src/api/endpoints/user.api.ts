import type { PaginatedResponse } from '../types';
import type { HttpRequestConfig } from '../client';
import { z } from 'zod';
import { http } from '../client';
import { BaseEntitySchema, PaginationParamsSchema } from '../types';

/**
 * 角色 Schema
 */
export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  description: z.string().optional(),
});
export type Role = z.infer<typeof RoleSchema>;

/**
 * 用户实体 Schema（完整版，匹配 Swagger）
 */
export const UserSchema = BaseEntitySchema.extend({
  username: z.string(),
  nickname: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  status: z.enum(['active', 'suspended', 'inactive']),
  tenantId: z.string().optional(),
  roles: z.array(RoleSchema).optional(),
  isSuperAdmin: z.boolean().optional(),
  settings: z.record(z.string(), z.any()).optional(),
});
export type User = z.infer<typeof UserSchema>;

/**
 * 用户列表查询参数 Schema（匹配 Swagger）
 */
export const UserListParamsSchema = PaginationParamsSchema.extend({
  q: z.string().optional(), // 搜索关键词
  status: z.enum(['active', 'suspended', 'inactive']).optional(),
  role_id: z.string().optional(), // 角色ID筛选
  include_deleted: z.boolean().optional(), // 包含软删除用户
});
export type UserListParams = z.infer<typeof UserListParamsSchema>;

/**
 * 创建用户参数 Schema
 */
export const CreateUserParamsSchema = z.object({
  username: z.string().min(2, '用户名长度不能少于2位'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码长度不能少于6位'),
  nickname: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  roleIds: z.array(z.string()).optional(),
});
export type CreateUserParams = z.infer<typeof CreateUserParamsSchema>;

/**
 * 更新用户参数 Schema
 */
export const UpdateUserParamsSchema = z.object({
  username: z.string().min(2).optional(),
  nickname: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  status: z.enum(['active', 'suspended', 'inactive']).optional(),
});
export type UpdateUserParams = z.infer<typeof UpdateUserParamsSchema>;

/**
 * 用户角色分配参数 Schema
 */
export const AssignRolesParamsSchema = z.object({
  roleIds: z.array(z.string()),
});
export type AssignRolesParams = z.infer<typeof AssignRolesParamsSchema>;

/**
 * 邀请用户参数 Schema
 */
export const InviteUserParamsSchema = z.object({
  username: z.string().min(2, '用户名长度不能少于2位'),
  email: z.string().email('邮箱格式不正确'),
  domainType: z.string().min(1, '域类型不能为空'),
  domainKey: z.string().min(1, '域标识不能为空'),
  roleIds: z.array(z.string()).min(1, '请至少选择一个角色'),
});
export type InviteUserParams = z.infer<typeof InviteUserParamsSchema>;

/**
 * 邀请响应 Schema
 */
export const InvitationResponseSchema = z.object({
  id: z.string(),
  inviteJwt: z.string(),
  username: z.string(),
  email: z.string().email(),
  expiresAt: z.string(),
});
export type InvitationResponse = z.infer<typeof InvitationResponseSchema>;

/**
 * 创建密码重置令牌响应 Schema
 */
export const CreatePasswordResetResponseSchema = z.object({
  id: z.string(),
  resetJwt: z.string(),
  email: z.string().email(),
  expiresAt: z.string(),
});
export type CreatePasswordResetResponse = z.infer<typeof CreatePasswordResetResponseSchema>;

/**
 * 邀请校验响应 Schema
 */
export const ValidateInvitationResponseSchema = z.object({
  valid: z.boolean(),
  username: z.string(),
  email: z.string().email(),
  domainType: z.string(),
  domainKey: z.string(),
  roleIds: z.array(z.string()),
  expiresAt: z.string(),
});
export type ValidateInvitationResponse = z.infer<typeof ValidateInvitationResponseSchema>;

/**
 * 激活用户参数 Schema
 */
export const ActivateUserParamsSchema = z.object({
  inviteJwt: z.string().min(1, '邀请令牌不能为空'),
  nickname: z.string().min(1, '昵称不能为空'),
  password: z.string().min(8, '密码长度不能少于8位').max(72, '密码长度不能超过72位'),
  confirmPassword: z.string().min(8, '确认密码长度不能少于8位').max(72, '确认密码长度不能超过72位'),
});
export type ActivateUserParams = z.infer<typeof ActivateUserParamsSchema>;

/**
 * 校验重置密码令牌响应 Schema
 */
export const ValidateResetPasswordTokenResponseSchema = z.object({
  valid: z.boolean(),
  userId: z.string().optional(),
  email: z.string().email().optional(),
  expiresAt: z.string().optional(),
});
export type ValidateResetPasswordTokenResponse = z.infer<typeof ValidateResetPasswordTokenResponseSchema>;

/**
 * 通过令牌重置密码参数 Schema
 */
export const ResetPasswordByTokenParamsSchema = z.object({
  resetJwt: z.string().min(1, '重置令牌不能为空'),
  password: z.string().min(8, '密码长度不能少于8位').max(72, '密码长度不能超过72位'),
  confirmPassword: z.string().min(8, '确认密码长度不能少于8位').max(72, '确认密码长度不能超过72位'),
}).refine(data => data.password === data.confirmPassword, {
  message: '两次密码输入不一致',
  path: ['confirmPassword'],
});
export type ResetPasswordByTokenParams = z.infer<typeof ResetPasswordByTokenParamsSchema>;

/**
 * 获取用户列表（分页）
 * 注意：http 客户端已配置自动解包，返回的是解包后的数据
 */
export function getUserList(params?: UserListParams) {
  return http.get<PaginatedResponse<User>>('/users', { params });
}

/**
 * 获取用户详情
 */
export function getUserById(id: string) {
  return http.get<User>(`/users/${id}`);
}

/**
 * 创建用户
 */
export function createUser(params: CreateUserParams) {
  return http.post<User>('/users', params);
}

/**
 * 更新用户
 */
export function updateUser(id: string, params: UpdateUserParams) {
  return http.put<User>(`/users/${id}`, params);
}

/**
 * 删除用户
 */
export function deleteUser(id: string) {
  return http.delete<void>(`/users/${id}`);
}

/**
 * 冻结用户
 */
export function freezeUser(id: string) {
  return http.post<User>(`/users/${id}/freeze`);
}

/**
 * 恢复用户
 */
export function restoreUser(id: string) {
  return http.post<User>(`/users/${id}/restore`);
}

/**
 * 分配用户角色
 */
export function assignUserRoles(id: string, params: AssignRolesParams, config?: HttpRequestConfig) {
  return http.post<User>(`/users/${id}/roles`, params, config);
}

/**
 * 邀请用户
 */
export function inviteUser(params: InviteUserParams) {
  return http.post<InvitationResponse>('/users/invitations', params);
}

/**
 * 校验邀请令牌
 */
export function validateInvitation(inviteJwt: string) {
  return http.get<ValidateInvitationResponse>('/users/invitations/validate', {
    params: { inviteJwt },
  });
}

/**
 * 激活用户
 */
export function activateUser(params: ActivateUserParams) {
  return http.post<{ user: User }>('/users/invitations/activate', params);
}

/**
 * 为指定用户创建密码重置令牌（管理端）
 */
export function createPasswordResetToken(userId: string) {
  return http.post<CreatePasswordResetResponse>(`/users/${userId}/password-resets`);
}

/**
 * 规范化公开 token 参数
 */
export function normalizePublicToken(token: string) {
  return token.trim();
}

/**
 * 校验重置密码令牌
 */
export function validateResetPasswordToken(resetJwt: string) {
  return http.get<ValidateResetPasswordTokenResponse>('/users/password-resets/validate', {
    params: { resetJwt: normalizePublicToken(resetJwt) },
    skipAuth: true,
  });
}

/**
 * 通过令牌重置密码
 */
export function resetPasswordByToken(params: ResetPasswordByTokenParams) {
  return http.post<void>('/users/password-resets/activate', params, {
    skipAuth: true,
  });
}
