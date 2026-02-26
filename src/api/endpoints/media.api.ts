import type { ApiResponse, Pagination, PaginationParams } from '../types';
import { z } from 'zod';
import { http } from '../client';
import { PaginationParamsSchema } from '../types';

/**
 * 媒体格式 Schema
 */
export const MediaFormatSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  size: z.number().optional(),
  mime: z.string().optional(),
  ext: z.string().optional(),
});
export type MediaFormat = z.infer<typeof MediaFormatSchema>;

/**
 * 媒体实体 Schema
 */
export const MediaSchema = z.object({
  id: z.string(),
  name: z.string(),
  alias: z.string().optional(),
  url: z.string(),
  previewUrl: z.string().optional(),
  mime: z.string().optional(),
  ext: z.string().optional(),
  size: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  hash: z.string().optional(),
  folderPath: z.string().optional(),
  provider: z.string().optional(),
  isUrlSigned: z.boolean().optional(),
  alternativeText: z.string().optional(),
  caption: z.string().optional(),
  locale: z.string().optional(),
  ownerId: z.string().optional(),
  providerMetadata: z.record(z.string(), z.any()).optional(),
  formats: z.array(MediaFormatSchema).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Media = z.infer<typeof MediaSchema>;

export type MediaKind = 'folder' | 'file';

export const MediaFolderNodeSchema = z.object({
  id: z.string(),
  kind: z.literal('folder'),
  name: z.string(),
  parentId: z.string().nullable().optional(),
  path: z.string().optional(),
  childrenCount: z.number().int().nonnegative().optional(),
  filesCount: z.number().int().nonnegative().optional(),
  sizeBytes: z.number().nonnegative().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type MediaFolderNode = z.infer<typeof MediaFolderNodeSchema>;

export const MediaFileNodeSchema = MediaSchema.extend({
  kind: z.literal('file'),
  parentId: z.string().nullable().optional(),
  path: z.string().optional(),
});
export type MediaFileNode = z.infer<typeof MediaFileNodeSchema>;

export const MediaNodeSchema = z.union([MediaFolderNodeSchema, MediaFileNodeSchema]);
export type MediaNode = z.infer<typeof MediaNodeSchema>;

export const MediaBrowseResponseSchema = z.object({
  nodes: z.array(MediaNodeSchema),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
  total: z.number().int().nonnegative().optional(),
  totalPages: z.number().int().nonnegative().optional(),
});
export type MediaBrowseResponse = z.infer<typeof MediaBrowseResponseSchema>;

/**
 * 媒体列表查询参数 Schema
 */
export const MediaListParamsSchema = PaginationParamsSchema.extend({
  parentId: z.string().optional(),
  path: z.string().optional(),
  include: z.enum(['all', 'folders', 'files']).optional(),
  _q: z.string().optional(),
  mimePrefix: z.string().optional(),
  provider: z.string().optional(),
  sort: z.enum(['name', 'createdAt', 'updatedAt', 'size']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  foldersFirst: z.boolean().optional(),
});
export type MediaListParams = z.infer<typeof MediaListParamsSchema>;

/**
 * 更新媒体参数 Schema
 */
export const UpdateMediaParamsSchema = z.object({
  name: z.string().min(1).optional(),
  alias: z.string().optional(),
  alternativeText: z.string().optional(),
  caption: z.string().optional(),
  folderId: z.string().nullable().optional(),
});
export type UpdateMediaParams = z.infer<typeof UpdateMediaParamsSchema>;

export interface UpdateMediaWithThumbnailInput extends UpdateMediaParams {
  thumbnail?: File;
}

export interface MediaUpdateDraftInput {
  name?: string;
  alternativeText?: string;
  caption?: string;
  folderPath?: string;
  thumbnail?: File;
}

export interface MediaUpdateContractPayload {
  title?: string;
  altText?: string;
  caption?: string;
  folderPath?: string;
}

export interface UploadMediaInput {
  file: File;
  folder?: string;
  fileName?: string;
  thumbnail?: File;
}

export const SignedMediaURLSchema = z.object({
  url: z.string(),
  expiry: z.number().int().positive().optional(),
  expiresAt: z.string().optional(),
  signed: z.boolean().optional(),
});
export type SignedMediaURL = z.infer<typeof SignedMediaURLSchema>;

export const CreateMediaFolderInputSchema = z.object({
  name: z.string().min(1).optional(),
  parentId: z.string().optional(),
  path: z.string().min(1).optional(),
});
export type CreateMediaFolderInput = z.infer<typeof CreateMediaFolderInputSchema>;

export const UpdateMediaFolderInputSchema = z.object({
  name: z.string().min(1).optional(),
  parentId: z.string().optional(),
  moveToRoot: z.boolean().optional(),
});
export type UpdateMediaFolderInput = z.infer<typeof UpdateMediaFolderInputSchema>;

export const BulkMoveMediaInputSchema = z.object({
  fileIds: z.array(z.string()).optional(),
  folderIds: z.array(z.string()).optional(),
  destinationFolderId: z.string().optional(),
  destinationRoot: z.boolean().optional(),
});
export type BulkMoveMediaInput = z.infer<typeof BulkMoveMediaInputSchema>;

export const BulkDeleteMediaInputSchema = z.object({
  fileIds: z.array(z.string()).optional(),
  folderIds: z.array(z.string()).optional(),
  recursive: z.boolean().optional(),
});
export type BulkDeleteMediaInput = z.infer<typeof BulkDeleteMediaInputSchema>;

export interface MediaBulkMoveResult {
  movedFiles: number;
  movedFolders: number;
}

export interface MediaBulkDeleteResult {
  deletedFiles: number;
  deletedFolders: number;
}

function getCandidateList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!payload || typeof payload !== 'object') {
    return [];
  }
  const source = payload as Record<string, unknown>;
  const data = source.data && typeof source.data === 'object' ? source.data as Record<string, unknown> : null;
  const candidates = [
    source.nodes,
    source.items,
    source.records,
    source.list,
    data?.nodes,
    data?.items,
    data?.records,
    data?.list,
    source.data,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }
  return [];
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeFileNode(raw: Record<string, unknown>): MediaFileNode {
  return {
    kind: 'file',
    ...(raw as Media),
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    url: String(raw.url ?? ''),
  };
}

function normalizeFolderNode(raw: Record<string, unknown>): MediaFolderNode {
  return {
    kind: 'folder',
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    parentId: (raw.parentId as string | null | undefined) ?? null,
    path: (raw.path as string | undefined) ?? '/',
    childrenCount: readNumber(raw.childrenCount),
    filesCount: readNumber(raw.filesCount),
    sizeBytes: readNumber(raw.sizeBytes),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
  };
}

export function inferMediaNodeKind(raw: unknown): MediaKind {
  if (!raw || typeof raw !== 'object') {
    return 'file';
  }
  const node = raw as Record<string, unknown>;
  if (node.kind === 'folder' || node.kind === 'file') {
    return node.kind;
  }
  const hasFolderOnlyFields = 'childrenCount' in node
    || 'filesCount' in node
    || 'sizeBytes' in node
    || ('path' in node && !('url' in node));
  return hasFolderOnlyFields ? 'folder' : 'file';
}

export function normalizeMediaNodes(payload: unknown): MediaNode[] {
  const list = getCandidateList(payload);
  return list
    .filter(node => node && typeof node === 'object')
    .map((node) => {
      const record = node as Record<string, unknown>;
      const kind = inferMediaNodeKind(record);
      return kind === 'folder' ? normalizeFolderNode(record) : normalizeFileNode(record);
    })
    .filter(node => Boolean(node.id));
}

export function normalizeMediaPagination(payload: unknown, fallback: PaginationParams = {}): Pagination {
  const source = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const pagination = source.meta && typeof source.meta === 'object'
    ? (source.meta as Record<string, unknown>).pagination
    : undefined;
  const paginationRecord = pagination && typeof pagination === 'object'
    ? pagination as Record<string, unknown>
    : source;

  const page = readNumber(paginationRecord.page) ?? fallback.page ?? 1;
  const pageSize = readNumber(paginationRecord.pageSize) ?? fallback.pageSize ?? 20;
  const total = readNumber(paginationRecord.total) ?? normalizeMediaNodes(payload).length;
  const totalPages = readNumber(paginationRecord.totalPages) ?? (Math.ceil(total / pageSize) || 1);

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}

export function parseMediaBrowseResponse(
  response: ApiResponse<unknown>,
  fallback: PaginationParams = {},
): MediaBrowseResponse {
  return {
    nodes: normalizeMediaNodes(response),
    ...normalizeMediaPagination(response, fallback),
  };
}

function normalizeNodeIdList(values?: string[]): string[] {
  return (values ?? []).map(value => value.trim()).filter(Boolean);
}

function ensureNonEmptyResourceSelection(fileIds?: string[], folderIds?: string[]) {
  if (normalizeNodeIdList(fileIds).length === 0 && normalizeNodeIdList(folderIds).length === 0) {
    throw new Error('请至少选择一个文件或目录');
  }
}

export function validateCreateMediaFolderInput(input: CreateMediaFolderInput): void {
  const name = input.name?.trim();
  const path = input.path?.trim();
  if (!name && !path) {
    throw new Error('创建目录必须提供 name 或 path');
  }
  if (path && path !== '/' && !path.startsWith('/')) {
    throw new Error('path 必须以 "/" 开头');
  }
}

export function validateUpdateMediaFolderInput(input: UpdateMediaFolderInput): void {
  const name = input.name?.trim();
  const hasParentId = Boolean(input.parentId?.trim());
  const moveToRoot = input.moveToRoot === true;
  if (!name && !hasParentId && !moveToRoot) {
    throw new Error('更新目录至少需要 name、parentId 或 moveToRoot 中的一项');
  }
  if (hasParentId && moveToRoot) {
    throw new Error('parentId 与 moveToRoot 不能同时设置');
  }
}

export function validateBulkMoveMediaInput(input: BulkMoveMediaInput): void {
  const fileIds = normalizeNodeIdList(input.fileIds);
  const folderIds = normalizeNodeIdList(input.folderIds);
  const destinationFolderId = input.destinationFolderId?.trim();
  const destinationRoot = input.destinationRoot === true;

  ensureNonEmptyResourceSelection(fileIds, folderIds);

  if (Boolean(destinationFolderId) === destinationRoot) {
    throw new Error('destinationFolderId 与 destinationRoot=true 只能二选一');
  }
}

export function validateBulkDeleteMediaInput(input: BulkDeleteMediaInput): void {
  ensureNonEmptyResourceSelection(input.fileIds, input.folderIds);
}

export interface MediaOperationError {
  status?: number;
  code?: number;
  message: string;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null;
}

export function mapMediaOperationError(error: unknown): MediaOperationError {
  const fallback: MediaOperationError = { message: '操作失败，请稍后重试' };
  const root = toRecord(error);
  if (!root) {
    return fallback;
  }

  const response = toRecord(root.response);
  const status = typeof response?.status === 'number' ? response.status : undefined;
  const data = toRecord(response?.data);
  const payloadError = toRecord(data?.error);
  const messageText = [
    typeof payloadError?.message === 'string' ? payloadError.message : '',
    typeof data?.message === 'string' ? data.message : '',
    typeof root.message === 'string' ? root.message : '',
  ].find(Boolean) || fallback.message;
  const code = typeof payloadError?.code === 'number' ? payloadError.code : undefined;

  return { status, code, message: messageText };
}

export function buildUploadMediaFormData(input: UploadMediaInput): FormData {
  const formData = new FormData();
  formData.append('file', input.file);
  formData.append('folder_path', input.folder?.trim() || '/');
  if (input.fileName?.trim()) {
    formData.append('name', input.fileName.trim());
  }
  if (input.thumbnail) {
    formData.append('thumbnail', input.thumbnail);
    // Support both field names because backend contracts may vary.
    formData.append('thumbnail_file', input.thumbnail);
  }
  return formData;
}

export function toMediaUpdateContractPayload(input: MediaUpdateDraftInput): MediaUpdateContractPayload {
  return {
    title: input.name?.trim() || undefined,
    altText: input.alternativeText,
    caption: input.caption,
    folderPath: input.folderPath,
  };
}

export function buildUpdateMediaFormData(input: MediaUpdateDraftInput): FormData {
  const payload = toMediaUpdateContractPayload(input);
  const formData = new FormData();
  if (payload.title) {
    formData.append('title', payload.title);
  }
  if (payload.altText !== undefined) {
    formData.append('altText', payload.altText);
  }
  if (payload.caption !== undefined) {
    formData.append('caption', payload.caption);
  }
  if (payload.folderPath !== undefined) {
    formData.append('folderPath', payload.folderPath);
  }
  if (input.thumbnail) {
    formData.append('thumbnail', input.thumbnail);
  }
  return formData;
}

/**
 * 获取媒体列表（分页）
 */
export function getMediaList(params?: MediaListParams) {
  return http.get<MediaBrowseResponse>('/media', { params });
}

/**
 * 获取媒体详情
 */
export function getMediaById(id: string) {
  return http.get<Media>(`/media/${id}`);
}

/**
 * 上传媒体文件
 */
export function uploadMedia(inputOrFile: UploadMediaInput | File, folder?: string) {
  const input: UploadMediaInput = inputOrFile instanceof File
    ? { file: inputOrFile, folder }
    : inputOrFile;
  const formData = buildUploadMediaFormData(input);
  return http.post<Media>('/media', formData, {
    headers: {
      'Content-Type': undefined as any, // 让浏览器自动设置
    },
  });
}

/**
 * 更新媒体元数据
 */
export function updateMedia(id: string, params: UpdateMediaParams) {
  return http.put<Media>(`/media/${id}`, toMediaUpdateContractPayload(params));
}

export function updateMediaWithThumbnail(id: string, input: MediaUpdateDraftInput) {
  if (!input.thumbnail) {
    return updateMedia(id, input);
  }
  const formData = buildUpdateMediaFormData(input);
  return http.put<Media>(`/media/${id}`, formData, {
    headers: {
      'Content-Type': undefined as any, // 让浏览器自动设置
    },
  });
}

/**
 * 删除媒体文件
 */
export function deleteMedia(id: string) {
  return http.delete<void>(`/media/${id}`);
}

/**
 * 获取媒体签名 URL
 */
export function getMediaSignedUrl(id: string) {
  return http.get<SignedMediaURL>(`/media/${id}/signed`);
}

export function createMediaFolder(input: CreateMediaFolderInput) {
  validateCreateMediaFolderInput(input);
  return http.post<MediaFolderNode>('/media/folders', input);
}

export function updateMediaFolder(id: string, input: UpdateMediaFolderInput) {
  validateUpdateMediaFolderInput(input);
  return http.put<MediaFolderNode>(`/media/folders/${id}`, input);
}

export function deleteMediaFolder(id: string, recursive = false) {
  return http.delete<MediaBulkDeleteResult>(`/media/folders/${id}`, { params: { recursive } });
}

export function bulkMoveMedia(input: BulkMoveMediaInput) {
  validateBulkMoveMediaInput(input);
  return http.post<MediaBulkMoveResult>('/media/actions/bulk-move', input);
}

export function bulkDeleteMedia(input: BulkDeleteMediaInput) {
  validateBulkDeleteMediaInput(input);
  return http.post<MediaBulkDeleteResult>('/media/actions/bulk-delete', input);
}

/**
 * 判断媒体类型
 */
export function getMediaType(mime?: string): 'image' | 'video' | 'audio' | 'document' | 'other' {
  if (!mime)
    return 'other';
  if (mime.startsWith('image/'))
    return 'image';
  if (mime.startsWith('video/'))
    return 'video';
  if (mime.startsWith('audio/'))
    return 'audio';
  if (
    mime.includes('pdf')
    || mime.includes('document')
    || mime.includes('spreadsheet')
    || mime.includes('presentation')
    || mime.includes('text/')
  ) {
    return 'document';
  }
  return 'other';
}

/**
 * 格式化文件大小
 */
export function formatFileSize(sizeInMB?: number): string {
  if (!sizeInMB)
    return '-';
  if (sizeInMB < 1) {
    return `${(sizeInMB * 1024).toFixed(2)} KB`;
  }
  if (sizeInMB >= 1024) {
    return `${(sizeInMB / 1024).toFixed(2)} GB`;
  }
  return `${sizeInMB.toFixed(2)} MB`;
}
