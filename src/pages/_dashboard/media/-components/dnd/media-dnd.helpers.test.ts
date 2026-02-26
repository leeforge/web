import { describe, expect, it } from 'bun:test';
import type { MediaNode } from '@/api/endpoints/media.api';
import { buildBulkMoveInputFromDrop } from './media-dnd.helpers';

const nodes: MediaNode[] = [
  { kind: 'folder', id: 'f-root', name: 'root-folder', path: '/root' },
  { kind: 'folder', id: 'f-a', name: 'A', path: '/root/a', parentId: 'f-root' },
  { kind: 'folder', id: 'f-b', name: 'B', path: '/root/b', parentId: 'f-root' },
  { kind: 'file', id: 'm-1', name: 'a.png', url: '/a.png', path: '/root/a/a.png', parentId: 'f-a' },
] as MediaNode[];

describe('buildBulkMoveInputFromDrop', () => {
  it('keeps root drop payload shape for dnd moves', () => {
    expect(buildBulkMoveInputFromDrop({
      activeNodeId: 'f-a',
      overTargetId: 'root',
      nodes,
    })).toEqual({
      fileIds: [],
      folderIds: ['f-a'],
      destinationFolderId: undefined,
      destinationRoot: true,
    });
  });

  it('moves file into folder target', () => {
    expect(buildBulkMoveInputFromDrop({
      activeNodeId: 'm-1',
      overTargetId: 'folder:f-root',
      nodes,
    })).toEqual({
      fileIds: ['m-1'],
      folderIds: [],
      destinationFolderId: 'f-root',
      destinationRoot: false,
    });
  });

  it('returns null when folder drops into itself', () => {
    expect(buildBulkMoveInputFromDrop({
      activeNodeId: 'f-a',
      overTargetId: 'folder:f-a',
      nodes,
    })).toBeNull();
  });

  it('returns null when folder drops into descendant', () => {
    expect(buildBulkMoveInputFromDrop({
      activeNodeId: 'f-root',
      overTargetId: 'folder:f-a',
      nodes,
    })).toBeNull();
  });

  it('moves node to root dropzone', () => {
    expect(buildBulkMoveInputFromDrop({
      activeNodeId: 'm-1',
      overTargetId: 'root',
      nodes,
    })).toEqual({
      fileIds: ['m-1'],
      folderIds: [],
      destinationFolderId: undefined,
      destinationRoot: true,
    });
  });
});
