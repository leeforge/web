import type { ApiResponse, PaginatedResponse } from '../types';
import { z } from 'zod';
import { normalizePaginatedPayload } from '../adapters/paginated';
import { http } from '../client';
import { BaseEntitySchema, PaginationParamsSchema } from '../types';
import { AuthStore } from '@/stores';

/**
 * 组织实体 Schema
 */
export const OrganizationSchema = BaseEntitySchema.extend({
  domainType: z.string().optional(),
  domainKey: z.string().optional(),
  name: z.string(),
  code: z.string(),
  path: z.string().optional(),
  level: z.number().int().optional(),
  sort: z.number().int().optional(),
  parentId: z.string().nullable().optional(),
});
export type Organization = z.infer<typeof OrganizationSchema>;

export interface OrganizationTreeNode extends Organization {
  children?: OrganizationTreeNode[];
}

export const OrganizationTreeNodeSchema: z.ZodType<OrganizationTreeNode> = OrganizationSchema.extend({
  children: z.array(z.lazy(() => OrganizationTreeNodeSchema)).optional(),
});

/**
 * 组织列表查询参数 Schema
 */
export const OrganizationListParamsSchema = PaginationParamsSchema.extend({
  keyword: z.string().optional(),
  parentId: z.string().optional(),
});
export type OrganizationListParams = z.infer<typeof OrganizationListParamsSchema>;

/**
 * 创建组织参数 Schema
 */
export const CreateOrganizationParamsSchema = z.object({
  name: z.string().min(1, '组织名称不能为空'),
  code: z.string().min(1, '组织编码不能为空'),
  parentId: z.string().nullable().optional(),
  sort: z.number().int().min(0).optional(),
});
export type CreateOrganizationParams = z.infer<typeof CreateOrganizationParamsSchema>;

/**
 * 更新组织参数 Schema
 */
export const UpdateOrganizationParamsSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  parentId: z.string().nullable().optional(),
  sort: z.number().int().min(0).optional(),
});
export type UpdateOrganizationParams = z.infer<typeof UpdateOrganizationParamsSchema>;

const OU_BASE_PATH = '/ou/organizations';

export function buildOuOrganizationsPath(path = '') {
  return `${OU_BASE_PATH}${path}`;
}

export function requireDomainContextHeaders(domain: { type: string; key: string } | null) {
  if (!domain?.type || !domain?.key) {
    throw new Error('Missing domain context');
  }
  return {
    'X-Domain-Type': domain.type,
    'X-Domain-Key': domain.key,
  };
}

function getDomainContextHeaders() {
  return requireDomainContextHeaders(AuthStore.getState().actingDomain);
}

function buildPagination(total: number, page: number, pageSize: number) {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  return {
    total,
    page,
    pageSize: safePageSize,
    totalPages,
    hasMore: page < totalPages,
  };
}

export function buildOrganizationTree(items: Organization[]): OrganizationTreeNode[] {
  const sorted = [...items].sort((a, b) => {
    const sortA = a.sort ?? 0;
    const sortB = b.sort ?? 0;
    if (sortA !== sortB) {
      return sortA - sortB;
    }
    return a.name.localeCompare(b.name);
  });

  const nodes = new Map<string, OrganizationTreeNode>();
  sorted.forEach((item) => {
    nodes.set(item.id, {
      ...item,
      children: [],
    });
  });

  const roots: OrganizationTreeNode[] = [];

  sorted.forEach((item) => {
    const node = nodes.get(item.id);
    if (!node) {
      return;
    }

    const parentId = item.parentId ?? null;
    if (!parentId) {
      roots.push(node);
      return;
    }

    const parentNode = nodes.get(parentId);
    if (!parentNode) {
      roots.push(node);
      return;
    }

    parentNode.children = parentNode.children || [];
    parentNode.children.push(node);
  });

  return roots;
}

/**
 * 获取组织树
 */
export function getOrganizationTree() {
  return http.get<OrganizationTreeNode[]>(buildOuOrganizationsPath('/tree'), {
    headers: getDomainContextHeaders(),
  }) as Promise<ApiResponse<OrganizationTreeNode[]>>;
}

/**
 * 获取组织列表（分页）
 */
export function getOrganizationList(params?: OrganizationListParams) {
  return http.get<unknown>(buildOuOrganizationsPath(''), {
    params,
    headers: getDomainContextHeaders(),
  }).then((response) => {
    const normalized = normalizePaginatedPayload<Organization>(response, {
      listKeys: ['items', 'data'],
      defaultPage: params?.page ?? 1,
      defaultPageSize: params?.pageSize ?? 20,
    });

    return {
      data: normalized.list,
      meta: {
        pagination: buildPagination(normalized.total, normalized.page, normalized.pageSize),
      },
      error: null,
    } as PaginatedResponse<Organization>;
  });
}

/**
 * 获取组织详情
 */
export function getOrganizationById(id: string) {
  return http.get<Organization>(buildOuOrganizationsPath(`/${id}`), {
    headers: getDomainContextHeaders(),
  });
}

/**
 * 创建组织
 */
export function createOrganization(params: CreateOrganizationParams) {
  return http.post<Organization>(buildOuOrganizationsPath(''), params, {
    headers: getDomainContextHeaders(),
  });
}

/**
 * 更新组织
 */
export function updateOrganization(id: string, params: UpdateOrganizationParams) {
  return http.put<Organization>(buildOuOrganizationsPath(`/${id}`), params, {
    headers: getDomainContextHeaders(),
  });
}

/**
 * 删除组织
 */
export function deleteOrganization(id: string) {
  return http.delete<void>(buildOuOrganizationsPath(`/${id}`), {
    headers: getDomainContextHeaders(),
  });
}

export function addOrganizationMember(id: string, params: { userId: string; isPrimary?: boolean }) {
  return http.post<void>(buildOuOrganizationsPath(`/${id}/members`), params, {
    headers: getDomainContextHeaders(),
  });
}
