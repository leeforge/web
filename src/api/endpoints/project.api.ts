import type { PaginatedResponse } from '../types';
import { z } from 'zod';
import { BaseEntitySchema, PaginationParamsSchema } from '../types';
import { unsupportedGovernanceApi } from './governance-contract.api';

export const ProjectSchema = BaseEntitySchema.extend({
  domainType: z.string().optional(),
  domainKey: z.string().optional(),
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});
export type Project = z.infer<typeof ProjectSchema>;

export const ProjectListParamsSchema = PaginationParamsSchema.extend({
  q: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  domainType: z.string().optional(),
  domainKey: z.string().optional(),
});
export type ProjectListParams = z.infer<typeof ProjectListParamsSchema>;

export const CreateProjectParamsSchema = z.object({
  domainType: z.string().optional(),
  domainKey: z.string().optional(),
  code: z.string().min(1, '项目编码不能为空'),
  name: z.string().min(1, '项目名称不能为空'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});
export type CreateProjectParams = z.infer<typeof CreateProjectParamsSchema>;

export const UpdateProjectParamsSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});
export type UpdateProjectParams = z.infer<typeof UpdateProjectParamsSchema>;

export const ProjectMemberSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  userId: z.string(),
  username: z.string().optional(),
  email: z.string().optional(),
  roleId: z.string().optional(),
  roleCode: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type ProjectMember = z.infer<typeof ProjectMemberSchema>;

export const ProjectMemberListParamsSchema = PaginationParamsSchema.extend({
  q: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});
export type ProjectMemberListParams = z.infer<typeof ProjectMemberListParamsSchema>;

export const AddProjectMemberParamsSchema = z.object({
  userId: z.string().min(1, '用户 ID 不能为空'),
  roleId: z.string().min(1, '角色 ID 不能为空'),
  status: z.enum(['active', 'inactive']).optional(),
});
export type AddProjectMemberParams = z.infer<typeof AddProjectMemberParamsSchema>;

export const UpdateProjectMemberParamsSchema = z.object({
  roleId: z.string().min(1).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});
export type UpdateProjectMemberParams = z.infer<typeof UpdateProjectMemberParamsSchema>;

export function getProjectList(_params?: ProjectListParams) {
  return unsupportedGovernanceApi<PaginatedResponse<Project>>('project');
}

export function getProjectById(_id: string) {
  return unsupportedGovernanceApi<Project>('project');
}

export function createProject(_params: CreateProjectParams) {
  return unsupportedGovernanceApi<Project>('project');
}

export function updateProject(_id: string, _params: UpdateProjectParams) {
  return unsupportedGovernanceApi<Project>('project');
}

export function deleteProject(_id: string) {
  return unsupportedGovernanceApi<void>('project');
}

export function getProjectMembers(_projectId: string, _params?: ProjectMemberListParams) {
  return unsupportedGovernanceApi<PaginatedResponse<ProjectMember>>('project-membership');
}

export function addProjectMember(_projectId: string, _params: AddProjectMemberParams) {
  return unsupportedGovernanceApi<void>('project-membership');
}

export function updateProjectMember(_projectId: string, _memberId: string, _params: UpdateProjectMemberParams) {
  return unsupportedGovernanceApi<ProjectMember>('project-membership');
}

export function removeProjectMember(_projectId: string, _memberId: string) {
  return unsupportedGovernanceApi<void>('project-membership');
}
