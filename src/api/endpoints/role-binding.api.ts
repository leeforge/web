import type { ApiResponse, PaginatedResponse } from '../types';
import type { User } from './user.api';
import { z } from 'zod';
import { normalizePaginatedPayload } from '../adapters/paginated';
import { BusinessError, PaginationParamsSchema } from '../types';
import { assignUserRoles, getUserById, getUserList } from './user.api';

export const RoleBindingSchema = z.object({
  id: z.string(),
  subjectType: z.enum(['user', 'group']),
  subjectId: z.string(),
  roleId: z.string(),
  roleCode: z.string().optional(),
  scopeDomain: z.string(),
  scopeId: z.string(),
  scopeType: z.enum(['CURRENT', 'DESCENDANTS', 'ASSIGNED_SET']),
  status: z.enum(['active', 'inactive']).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type RoleBinding = z.infer<typeof RoleBindingSchema>;

export const RoleBindingListParamsSchema = PaginationParamsSchema.extend({
  subjectId: z.string().optional(),
  roleId: z.string().optional(),
  scopeDomain: z.string().optional(),
  scopeId: z.string().optional(),
});
export type RoleBindingListParams = z.infer<typeof RoleBindingListParamsSchema>;

export const CreateRoleBindingParamsSchema = z.object({
  subjectType: z.enum(['user', 'group']),
  subjectId: z.string().min(1, '主体 ID 不能为空'),
  roleId: z.string().min(1, '角色 ID 不能为空'),
  scopeDomain: z.string().min(1, '范围域类型不能为空'),
  scopeId: z.string().min(1, '范围 ID 不能为空'),
  scopeType: z.enum(['CURRENT', 'DESCENDANTS', 'ASSIGNED_SET']),
  status: z.enum(['active', 'inactive']).optional(),
});
export type CreateRoleBindingParams = z.infer<typeof CreateRoleBindingParamsSchema>;

export const UpdateRoleBindingParamsSchema = z.object({
  roleId: z.string().min(1).optional(),
  scopeType: z.enum(['CURRENT', 'DESCENDANTS', 'ASSIGNED_SET']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});
export type UpdateRoleBindingParams = z.infer<typeof UpdateRoleBindingParamsSchema>;

const DEFAULT_SCOPE_TYPE: RoleBinding['scopeType'] = 'CURRENT';
const DEFAULT_SCOPE_DOMAIN: RoleBinding['scopeDomain'] = 'tenant';
const PLATFORM_SCOPE_DOMAIN = 'platform';
const PLATFORM_SCOPE_KEY = 'root';

function parseRoleBindingId(id: string) {
  const separatorIndex = id.indexOf(':');
  if (separatorIndex <= 0 || separatorIndex >= id.length - 1) {
    throw new BusinessError({
      code: 400,
      status: 400,
      name: 'InvalidRoleBindingId',
      message: '角色绑定 ID 格式无效',
    });
  }

  return {
    userId: id.slice(0, separatorIndex),
    roleId: id.slice(separatorIndex + 1),
  };
}

function toRoleBindingId(userId: string, roleId: string) {
  return `${userId}:${roleId}`;
}

function ensureUserSubject(subjectType: RoleBinding['subjectType']) {
  if (subjectType !== 'user') {
    throw new BusinessError({
      code: 400,
      status: 400,
      name: 'UnsupportedSubjectType',
      message: '当前后端仅支持 user 类型角色绑定',
    });
  }
}

function dedupeRoleIds(roleIds: string[]) {
  return Array.from(new Set(roleIds.filter(Boolean)));
}

function normalizeScope(scopeDomain?: string, scopeId?: string): { scopeDomain: string; scopeId: string } {
  const normalizedDomain = scopeDomain?.trim();
  const normalizedScopeId = scopeId?.trim();

  if (normalizedScopeId) {
    const separatorIndex = normalizedScopeId.indexOf(':');
    if (separatorIndex > 0 && separatorIndex < normalizedScopeId.length - 1) {
      const parsedDomain = normalizedScopeId.slice(0, separatorIndex);
      const parsedKey = normalizedScopeId.slice(separatorIndex + 1);
      if (!normalizedDomain || normalizedDomain === parsedDomain) {
        return {
          scopeDomain: parsedDomain,
          scopeId: parsedKey,
        };
      }
    }
  }

  if (normalizedDomain) {
    return {
      scopeDomain: normalizedDomain,
      scopeId: normalizedScopeId || PLATFORM_SCOPE_KEY,
    };
  }

  if (normalizedScopeId) {
    return {
      scopeDomain: DEFAULT_SCOPE_DOMAIN,
      scopeId: normalizedScopeId,
    };
  }

  return {
    scopeDomain: PLATFORM_SCOPE_DOMAIN,
    scopeId: PLATFORM_SCOPE_KEY,
  };
}

function mapUserRoleToBinding(
  user: User,
  role: NonNullable<User['roles']>[number],
  scopeDomain?: string,
  scopeId?: string,
): RoleBinding {
  const normalizedScope = normalizeScope(
    scopeDomain || PLATFORM_SCOPE_DOMAIN,
    scopeId || PLATFORM_SCOPE_KEY,
  );

  return {
    id: toRoleBindingId(user.id, role.id),
    subjectType: 'user',
    subjectId: user.id,
    roleId: role.id,
    roleCode: role.code || role.name,
    scopeDomain: normalizedScope.scopeDomain,
    scopeId: normalizedScope.scopeId,
    scopeType: DEFAULT_SCOPE_TYPE,
    status: user.status === 'inactive' ? 'inactive' : 'active',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function readUserRoleIds(userId: string): Promise<string[]> {
  const userResponse = await getUserById(userId);
  const user = userResponse.data;
  return dedupeRoleIds((user.roles || []).map(role => role.id));
}

function buildPagination<T>(list: T[], page: number, pageSize: number, total: number): ApiResponse<PaginatedResponse<T>> {
  const safeTotal = Math.max(total, list.length);
  const totalPages = Math.max(1, Math.ceil(safeTotal / pageSize));
  const pagination = {
    page,
    pageSize,
    total: safeTotal,
    totalPages,
    hasMore: page < totalPages,
  };

  return {
    data: {
      data: list,
      meta: {
        pagination,
      },
      error: null,
    },
    meta: {
      pagination,
    },
    error: null,
  };
}

export async function getRoleBindingList(params?: RoleBindingListParams): Promise<ApiResponse<PaginatedResponse<RoleBinding>>> {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 20;

  const usersResponse = await getUserList({
    page,
    pageSize,
    q: params?.subjectId || undefined,
    role_id: params?.roleId || undefined,
  });

  const normalized = normalizePaginatedPayload<User>(usersResponse, {
    listKeys: ['users'],
    defaultPage: page,
    defaultPageSize: pageSize,
  });

  const list = normalized.list
    .flatMap((user) => {
      return (user.roles || []).map(role => mapUserRoleToBinding(user, role, params?.scopeDomain, params?.scopeId));
    })
    .filter((binding) => {
      if (params?.scopeDomain && binding.scopeDomain !== params.scopeDomain) {
        return false;
      }
      if (params?.scopeId && binding.scopeId !== params.scopeId) {
        return false;
      }
      return true;
    });

  return buildPagination(list, normalized.page, normalized.pageSize, normalized.total);
}

export async function createRoleBinding(params: CreateRoleBindingParams): Promise<ApiResponse<RoleBinding>> {
  ensureUserSubject(params.subjectType);
  const normalizedScope = normalizeScope(params.scopeDomain, params.scopeId);

  const roleIds = await readUserRoleIds(params.subjectId);
  if (roleIds.includes(params.roleId)) {
    throw new BusinessError({
      code: 409,
      status: 409,
      name: 'RoleBindingConflict',
      message: '该用户在当前范围已绑定该角色',
    });
  }

  const nextRoleIds = dedupeRoleIds([...roleIds, params.roleId]);
  await assignUserRoles(
    params.subjectId,
    { roleIds: nextRoleIds },
  );

  return {
    data: {
      id: toRoleBindingId(params.subjectId, params.roleId),
      subjectType: params.subjectType,
      subjectId: params.subjectId,
      roleId: params.roleId,
      roleCode: params.roleId,
      scopeDomain: normalizedScope.scopeDomain,
      scopeId: normalizedScope.scopeId,
      scopeType: params.scopeType,
      status: params.status || 'active',
    },
    error: null,
  };
}

export async function updateRoleBinding(id: string, params: UpdateRoleBindingParams): Promise<ApiResponse<RoleBinding>> {
  const { userId, roleId: originalRoleId } = parseRoleBindingId(id);
  const currentRoleIds = await readUserRoleIds(userId);

  const nextRoleId = params.roleId || originalRoleId;
  let nextRoleIds = currentRoleIds.filter(currentRoleId => currentRoleId !== originalRoleId);

  if (params.status !== 'inactive') {
    nextRoleIds = dedupeRoleIds([...nextRoleIds, nextRoleId]);
  }

  await assignUserRoles(userId, { roleIds: nextRoleIds });

  return {
    data: {
      id: toRoleBindingId(userId, nextRoleId),
      subjectType: 'user',
      subjectId: userId,
      roleId: nextRoleId,
      roleCode: nextRoleId,
      scopeDomain: PLATFORM_SCOPE_DOMAIN,
      scopeId: PLATFORM_SCOPE_KEY,
      scopeType: params.scopeType || DEFAULT_SCOPE_TYPE,
      status: params.status || 'active',
    },
    error: null,
  };
}

export async function deleteRoleBinding(id: string): Promise<ApiResponse<void>> {
  const { userId, roleId } = parseRoleBindingId(id);
  const currentRoleIds = await readUserRoleIds(userId);
  const nextRoleIds = currentRoleIds.filter(currentRoleId => currentRoleId !== roleId);

  await assignUserRoles(userId, { roleIds: nextRoleIds });

  return {
    data: void 0,
    error: null,
  };
}
