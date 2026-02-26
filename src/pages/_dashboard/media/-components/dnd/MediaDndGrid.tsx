import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, PointerSensor, pointerWithin, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, Checkbox } from 'antd';
import type { CSSProperties, MouseEvent, PointerEvent } from 'react';
import type { MediaFileNode, MediaNode } from '@/api/endpoints/media.api';
import { formatFileSize, getMediaType } from '@/api/endpoints/media.api';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import type { MediaDropTargetId } from './media-dnd.helpers';

interface MediaDndGridProps {
  nodes: MediaNode[];
  loading?: boolean;
  selectedNodeIds: string[];
  onSelectNode: (nodeId: string, checked: boolean) => void;
  onOpenNode: (node: MediaNode) => void;
  onDropMove: (activeId: string, targetId: MediaDropTargetId) => void;
}

interface MediaCardProps {
  node: MediaNode;
  selected: boolean;
  onSelectNode: (nodeId: string, checked: boolean) => void;
  onOpenNode: (node: MediaNode) => void;
}

function resolveFilePreview(file: MediaFileNode): string | null {
  const mediaType = getMediaType(file.mime);
  const thumbnail = file.previewUrl?.trim();
  if (mediaType === 'image') {
    return (thumbnail || file.url || '').trim() || null;
  }
  return thumbnail || null;
}

function renderFolderVisual() {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
      <CustomIcon icon="line-md:folder-open-twotone" width={28} />
    </div>
  );
}

function renderFileVisual(file: MediaFileNode) {
  const preview = resolveFilePreview(file);
  if (preview) {
    return (
      <img
        src={preview}
        alt={file.alternativeText || file.name}
        className="h-full w-full object-cover"
      />
    );
  }

  const mediaType = getMediaType(file.mime);
  const iconMap: Record<string, string> = {
    video: 'line-md:film-twotone',
    audio: 'line-md:soundcloud-loop',
    document: 'line-md:document-list',
    other: 'line-md:file',
  };
  return (
    <div className="flex h-full items-center justify-center rounded-xl bg-gray-100 text-gray-500">
      <CustomIcon icon={iconMap[mediaType] || iconMap.other} width={34} />
    </div>
  );
}

function MediaDraggableCard({
  node,
  selected,
  onSelectNode,
  onOpenNode,
}: MediaCardProps) {
  const isFolder = node.kind === 'folder';
  const draggable = useDraggable({ id: node.id });
  const droppable = useDroppable({
    id: isFolder ? (`folder:${node.id}` as MediaDropTargetId) : `file:${node.id}`,
    disabled: !isFolder,
  });

  const setNodeRef = (element: HTMLElement | null) => {
    draggable.setNodeRef(element);
    droppable.setNodeRef(element);
  };

  const style: CSSProperties = {
    transform: CSS.Translate.toString(draggable.transform),
    opacity: draggable.isDragging ? 0.35 : 1,
    borderColor: droppable.isOver ? 'var(--ant-color-primary, #1677ff)' : undefined,
  };

  const stopEventBubble = (event: MouseEvent | PointerEvent) => {
    event.stopPropagation();
  };

  return (
    <div
      ref={setNodeRef}
      data-drag-id={node.id}
      data-drop-target={isFolder ? `folder:${node.id}` : undefined}
      className="relative"
      style={style}
      {...draggable.attributes}
      {...draggable.listeners}
    >
      <div
        className="absolute left-2 top-2 z-20 rounded-md bg-white/90 p-1 shadow-sm"
        onClick={stopEventBubble}
        onPointerDown={stopEventBubble}
      >
        <Checkbox
          checked={selected}
          onChange={event => onSelectNode(node.id, event.target.checked)}
          aria-label={`选择 ${node.name}`}
        />
      </div>
      {isFolder
        ? (
            <Card
              hoverable
              className="cursor-pointer border-amber-100 bg-amber-50/40 transition-all duration-200 hover:border-amber-200 hover:shadow-sm"
              styles={{ body: { padding: 10 } }}
              onClick={() => onOpenNode(node)}
            >
              <div className="flex items-center gap-3">
                {renderFolderVisual()}
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-800">{node.name}</span>
                  <span className="block text-xs text-amber-600">
                    {`${node.filesCount ?? 0} 文件 · ${node.childrenCount ?? 0} 子目录`}
                  </span>
                </div>
              </div>
            </Card>
          )
        : (
            <Card
              hoverable
              className="cursor-pointer overflow-hidden border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-md"
              styles={{ body: { padding: 12 } }}
              cover={(
                <div className="h-[148px] w-full overflow-hidden bg-gray-50 p-2">
                  {renderFileVisual(node)}
                </div>
              )}
              onClick={() => onOpenNode(node)}
            >
              <div className="space-y-1">
                <span className="block truncate text-sm font-medium text-gray-800">{node.name}</span>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="truncate pr-2">{node.mime || '文件'}</span>
                  <span>{formatFileSize(node.size)}</span>
                </div>
              </div>
            </Card>
          )}
    </div>
  );
}

export function MediaDndGrid({
  nodes,
  loading = false,
  selectedNodeIds,
  onSelectNode,
  onOpenNode,
  onDropMove,
}: MediaDndGridProps) {
  const folders = nodes.filter((node): node is Extract<MediaNode, { kind: 'folder' }> => node.kind === 'folder');
  const files = nodes.filter((node): node is Extract<MediaNode, { kind: 'file' }> => node.kind === 'file');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id || '');
    const overId = String(event.over?.id || '');
    if (!activeId || !overId) {
      return;
    }
    if (!overId.startsWith('folder:')) {
      return;
    }
    onDropMove(activeId, overId as MediaDropTargetId);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      {folders.length > 0 && (
        <div className="mb-4 space-y-2">
          {folders.map(node => (
            <MediaDraggableCard
              key={node.id}
              node={node}
              selected={selectedNodeIds.includes(node.id)}
              onSelectNode={onSelectNode}
              onOpenNode={onOpenNode}
            />
          ))}
        </div>
      )}
      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
          {files.map(node => (
            <MediaDraggableCard
              key={node.id}
              node={node}
              selected={selectedNodeIds.includes(node.id)}
              onSelectNode={onSelectNode}
              onOpenNode={onOpenNode}
            />
          ))}
        </div>
      )}
      {loading ? <div className="mt-3 text-xs text-gray-400">加载中...</div> : null}
    </DndContext>
  );
}
