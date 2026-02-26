import { describe, expect, it } from 'bun:test';
import {
  buildUploadMediaFormData,
  buildUpdateMediaFormData,
  inferMediaNodeKind,
  parseMediaBrowseResponse,
  toMediaUpdateContractPayload,
  UpdateMediaParamsSchema,
  validateBulkDeleteMediaInput,
  validateBulkMoveMediaInput,
  validateCreateMediaFolderInput,
  validateUpdateMediaFolderInput,
} from './media.api';

describe('media api contract helpers', () => {
  it('infers folder/file kind for mixed nodes', () => {
    expect(inferMediaNodeKind({ kind: 'folder', id: 'f1', name: 'folder' })).toBe('folder');
    expect(inferMediaNodeKind({ id: 'm1', name: 'file.png', url: 'https://cdn/file.png' })).toBe('file');
    expect(inferMediaNodeKind({ id: 'f2', name: 'docs', childrenCount: 1 })).toBe('folder');
  });

  it('parses browse response with nodes and pagination', () => {
    const payload = {
      data: {
        nodes: [
          { kind: 'folder', id: 'f1', name: 'images', childrenCount: 2 },
          { kind: 'file', id: 'm1', name: 'a.png', url: '/a.png' },
        ],
      },
      meta: {
        pagination: { page: 2, pageSize: 10, total: 25, totalPages: 3, hasMore: true },
      },
      error: null,
    };

    const normalized = parseMediaBrowseResponse(payload as any);
    expect(normalized.nodes).toHaveLength(2);
    expect(normalized.page).toBe(2);
    expect(normalized.pageSize).toBe(10);
    expect(normalized.total).toBe(25);
    expect(normalized.totalPages).toBe(3);
  });

  it('validates create folder input in name/path mode', () => {
    expect(() => validateCreateMediaFolderInput({ name: 'assets' })).not.toThrow();
    expect(() => validateCreateMediaFolderInput({ path: '/assets/images' })).not.toThrow();
    expect(() => validateCreateMediaFolderInput({})).toThrow();
    expect(() => validateCreateMediaFolderInput({ path: 'assets/images' })).toThrow();
  });

  it('validates update folder input combinations', () => {
    expect(() => validateUpdateMediaFolderInput({ name: 'images-v2' })).not.toThrow();
    expect(() => validateUpdateMediaFolderInput({ moveToRoot: true })).not.toThrow();
    expect(() => validateUpdateMediaFolderInput({})).toThrow();
    expect(() => validateUpdateMediaFolderInput({ parentId: 'p1', moveToRoot: true })).toThrow();
  });

  it('validates bulk move and bulk delete payloads', () => {
    expect(() => validateBulkMoveMediaInput({
      fileIds: ['m1'],
      destinationFolderId: 'f2',
      destinationRoot: false,
    })).not.toThrow();

    expect(() => validateBulkMoveMediaInput({
      fileIds: ['m1'],
      destinationFolderId: 'f2',
      destinationRoot: true,
    })).toThrow();

    expect(() => validateBulkMoveMediaInput({
      fileIds: [],
      folderIds: [],
      destinationRoot: true,
    })).toThrow();

    expect(() => validateBulkMoveMediaInput({
      fileIds: ['m1'],
      destinationRoot: true,
    })).not.toThrow();

    expect(() => validateBulkDeleteMediaInput({ fileIds: ['m1'] })).not.toThrow();
    expect(() => validateBulkDeleteMediaInput({ folderIds: ['f1'] })).not.toThrow();
    expect(() => validateBulkDeleteMediaInput({ fileIds: [], folderIds: [] })).toThrow();
  });

  it('builds upload form data with file name and thumbnail', () => {
    const file = new File(['main'], 'origin.png', { type: 'image/png' });
    const thumbnail = new File(['thumb'], 'thumb.png', { type: 'image/png' });

    const form = buildUploadMediaFormData({
      file,
      folder: '/products',
      fileName: 'hero-banner',
      thumbnail,
    });

    expect(form.get('folder_path')).toBe('/products');
    expect(form.get('name')).toBe('hero-banner');
    const formThumbnail = form.get('thumbnail');
    expect(formThumbnail).toBeInstanceOf(File);
    expect((formThumbnail as File).name).toBe('thumb.png');
    const aliasThumbnail = form.get('thumbnail_file');
    expect(aliasThumbnail).toBeInstanceOf(File);
    expect((aliasThumbnail as File).name).toBe('thumb.png');
  });

  it('accepts media name in update payload schema', () => {
    const parsed = UpdateMediaParamsSchema.parse({ name: 'hero-banner' });
    expect(parsed.name).toBe('hero-banner');
  });

  it('maps frontend media update fields to backend usage contract', () => {
    expect(toMediaUpdateContractPayload({
      name: 'hero.jpg',
      alternative_text: 'hero alt',
      caption: 'hero caption',
      folder_path: '/products/iphone',
    })).toEqual({
      title: 'hero.jpg',
      altText: 'hero alt',
      caption: 'hero caption',
      folderPath: '/products/iphone',
    });
  });

  it('builds update formData using backend multipart field names', () => {
    const thumbnail = new File(['thumb'], 'thumb.png', { type: 'image/png' });
    const form = buildUpdateMediaFormData({
      name: 'hero.jpg',
      alternative_text: 'hero alt',
      caption: 'hero caption',
      folder_path: '/products/iphone',
      thumbnail,
    });

    expect(form.get('title')).toBe('hero.jpg');
    expect(form.get('altText')).toBe('hero alt');
    expect(form.get('caption')).toBe('hero caption');
    expect(form.get('folderPath')).toBe('/products/iphone');

    const thumbnailField = form.get('thumbnail');
    expect(thumbnailField).toBeInstanceOf(File);
    expect((thumbnailField as File).name).toBe('thumb.png');
  });

  it('supports multipart update using backend usage field names', () => {
    const thumbnail = new File(['thumb'], 'thumb.png', { type: 'image/png' });
    const form = buildUpdateMediaFormData({
      name: 'hero-banner',
      alternative_text: 'hero alt',
      caption: 'hero caption',
      folder_path: '/products',
      thumbnail,
    });

    expect(form.get('title')).toBe('hero-banner');
    expect(form.get('altText')).toBe('hero alt');
    expect(form.get('caption')).toBe('hero caption');
    expect(form.get('folderPath')).toBe('/products');
    expect((form.get('thumbnail') as File).name).toBe('thumb.png');
  });
});
