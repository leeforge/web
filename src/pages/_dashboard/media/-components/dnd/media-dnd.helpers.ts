import type { BulkMoveMediaInput, MediaNode } from '@/api/endpoints/media.api';

export type MediaDropTargetId = `folder:${string}` | 'root';

interface BuildBulkMoveInputFromDropParams {
  activeNodeId: string;
  overTargetId: MediaDropTargetId;
  nodes: MediaNode[];
}

function isDescendantPath(sourcePath: string, targetPath: string): boolean {
  const normalizedSource = sourcePath.endsWith('/') ? sourcePath : `${sourcePath}/`;
  return targetPath.startsWith(normalizedSource);
}

export function buildBulkMoveInputFromDrop(
  params: BuildBulkMoveInputFromDropParams,
): BulkMoveMediaInput | null {
  const activeNode = params.nodes.find(node => node.id === params.activeNodeId);
  if (!activeNode) {
    return null;
  }

  if (params.overTargetId === 'root') {
    return {
      fileIds: activeNode.kind === 'file' ? [activeNode.id] : [],
      folderIds: activeNode.kind === 'folder' ? [activeNode.id] : [],
      destinationFolderId: undefined,
      destinationRoot: true,
    };
  }

  const targetFolderId = params.overTargetId.replace('folder:', '');
  const targetFolder = params.nodes.find(
    node => node.kind === 'folder' && node.id === targetFolderId,
  );

  if (!targetFolder || targetFolder.kind !== 'folder') {
    return null;
  }

  if (activeNode.kind === 'folder') {
    if (activeNode.id === targetFolder.id) {
      return null;
    }
    if (activeNode.path && targetFolder.path && isDescendantPath(activeNode.path, targetFolder.path)) {
      return null;
    }
  }

  return {
    fileIds: activeNode.kind === 'file' ? [activeNode.id] : [],
    folderIds: activeNode.kind === 'folder' ? [activeNode.id] : [],
    destinationFolderId: targetFolder.id,
    destinationRoot: false,
  };
}
