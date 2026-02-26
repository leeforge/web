import type { ActionItem, ProTableSearchConfig, ProTableSearchField } from '@leeforge/react-ui';
import type {
  BulkMoveMediaInput,
  CreateMediaFolderInput,
  Media,
  MediaFileNode,
  MediaFolderNode,
  MediaListParams,
  MediaNode,
  UploadMediaInput,
  UpdateMediaFolderInput,
} from '@/api/endpoints/media.api';
import { ProTable, RowActionBar, SearchBar, useProTableQuery } from '@leeforge/react-ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Breadcrumb,
  Button,
  Card,
  Drawer,
  Empty,
  Form,
  Image,
  Input,
  message,
  Modal,
  Segmented,
  Select,
  Space,
  Switch,
  Tag,
  Upload,
} from 'antd';
import { useEffect, useRef, useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { normalizePaginatedPayload } from '@/api/adapters/paginated';
import {
  bulkDeleteMedia,
  bulkMoveMedia,
  createMediaFolder,
  deleteMedia,
  deleteMediaFolder,
  formatFileSize,
  getMediaList,
  getMediaType,
  mapMediaOperationError,
  parseMediaBrowseResponse,
  updateMediaWithThumbnail,
  updateMediaFolder,
  uploadMedia,
} from '@/api/endpoints/media.api';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import { buildBulkMoveInputFromDrop } from './dnd/media-dnd.helpers';
import { MediaDndGrid } from './dnd/MediaDndGrid';
import { getMediaRowActionLabels } from './media-row-actions';
import { buildMediaUpdatePayload } from './media-update-payload';
import { MediaUploadModal } from './upload/MediaUploadModal';

/**
 * 媒体列表页面
 */
export function MediaListPage() {
  const queryClient = useQueryClient();
  const listPaginationSnapshotRef = useRef<{ page: number; pageSize: number } | null>(null);

  // 视图模式
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 详情抽屉
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaFileNode | null>(null);
  const [detailForm] = Form.useForm();
  const [folderForm] = Form.useForm<CreateMediaFolderInput>();
  const [moveForm] = Form.useForm<BulkMoveMediaInput>();
  const [folderEditForm] = Form.useForm<UpdateMediaFolderInput>();
  const [currentParentId, setCurrentParentId] = useState<string | undefined>(undefined);
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [folderHistory, setFolderHistory] = useState<Array<{ id?: string; name: string; path: string }>>([{ name: '根目录', path: '/' }]);

  // 上传弹窗
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [folderEditOpen, setFolderEditOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<MediaFolderNode | null>(null);
  const [detailThumbnailFile, setDetailThumbnailFile] = useState<File | undefined>(undefined);

  // 获取媒体列表
  const table = useProTableQuery<MediaNode, MediaListParams>({
    useQuery,
    queryKey: ['media', currentParentId ?? 'root'],
    queryFn: params => getMediaList(params as MediaListParams),
    resultTransform: (data, params) => {
      const parsed = parseMediaBrowseResponse(data, params as MediaListParams);
      return normalizePaginatedPayload<MediaNode>({
        data: { nodes: parsed.nodes },
        meta: {
          pagination: {
            page: parsed.page ?? 1,
            pageSize: parsed.pageSize ?? 24,
            total: parsed.total ?? parsed.nodes.length,
            totalPages: parsed.totalPages ?? 1,
            hasMore: false,
          },
        },
      }, { defaultPageSize: 24, listKeys: ['nodes'] });
    },
    initialPagination: { pageSize: 24 },
    keepPreviousData: true,
    paramsTransform: (params) => {
      const next = { ...params } as Record<string, unknown>;
      next.parentId = currentParentId;
      next.include = params.include ?? 'all';
      next.foldersFirst = true;
      if (!params._q) {
        delete next._q;
      }
      if (!params.mimePrefix) {
        delete next.mimePrefix;
      }
      if (!params.provider) {
        delete next.provider;
      }
      if (!params.sort) {
        delete next.sort;
      }
      if (!params.order) {
        delete next.order;
      }
      return next;
    },
  });

  const folderNodes = table.data.filter((item): item is MediaFolderNode => item.kind === 'folder');
  const selectedNodes = table.data.filter(item => selectedRowKeys.includes(item.id));
  const hasSelectedNodes = selectedNodes.length > 0;

  const normalizeErrorMessage = (error: unknown, action: string) => {
    const mapped = mapMediaOperationError(error);
    if (mapped.status === 409) {
      const msg = mapped.message.toLowerCase();
      if (msg.includes('duplicate') || msg.includes('exists') || msg.includes('重名')) {
        return `${action}失败：存在重名冲突`;
      }
      if (msg.includes('cycle') || msg.includes('descendant') || msg.includes('循环')) {
        return `${action}失败：目录层级冲突（循环移动）`;
      }
      if (msg.includes('not empty') || msg.includes('非空')) {
        return `${action}失败：目录非空，需开启递归删除`;
      }
      return `${action}失败：业务冲突`;
    }
    if (mapped.status === 404) {
      return `${action}失败：资源不存在，请刷新后重试`;
    }
    if (mapped.status === 400) {
      return `${action}失败：请求参数无效`;
    }
    if (mapped.status && mapped.status >= 500) {
      return `${action}失败：服务异常，请稍后重试`;
    }
    return `${action}失败：${mapped.message}`;
  };

  // 删除媒体 mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMedia,
    onSuccess: () => {
      message.success('文件删除成功');
      queryClient.invalidateQueries({ queryKey: ['media'] });
      setDetailDrawerOpen(false);
      setSelectedMedia(null);
    },
    onError: (error: unknown) => {
      message.error(normalizeErrorMessage(error, '删除'));
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: ({ id, recursive }: { id: string; recursive: boolean }) => deleteMediaFolder(id, recursive),
    onSuccess: () => {
      message.success('目录删除成功');
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error: unknown) => {
      message.error(normalizeErrorMessage(error, '删除目录'));
    },
  });

  // 更新媒体 mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, params }: { id: string; params: any }) => updateMediaWithThumbnail(id, params),
    onSuccess: () => {
      message.success('更新成功');
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error: unknown) => {
      message.error(normalizeErrorMessage(error, '更新'));
    },
  });

  // 上传媒体 mutation
  const uploadMutation = useMutation({
    mutationFn: (input: UploadMediaInput) => uploadMedia(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error: unknown) => {
      message.error(normalizeErrorMessage(error, '上传'));
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteMedia,
    onSuccess: () => {
      message.success('批量删除成功');
      setSelectedRowKeys([]);
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error: unknown) => {
      message.error(normalizeErrorMessage(error, '批量删除'));
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: createMediaFolder,
    onSuccess: () => {
      message.success('目录创建成功');
      setCreateFolderOpen(false);
      folderForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error: unknown) => {
      message.error(normalizeErrorMessage(error, '创建目录'));
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMediaFolderInput }) => updateMediaFolder(id, input),
    onSuccess: () => {
      message.success('目录更新成功');
      setFolderEditOpen(false);
      setEditingFolder(null);
      folderEditForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error: unknown) => {
      message.error(normalizeErrorMessage(error, '更新目录'));
    },
  });

  const bulkMoveMutation = useMutation({
    mutationFn: bulkMoveMedia,
    onSuccess: () => {
      message.success('批量移动成功');
      setMoveModalOpen(false);
      moveForm.resetFields();
      setSelectedRowKeys([]);
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error: unknown) => {
      message.error(normalizeErrorMessage(error, '批量移动'));
    },
  });

  // 删除确认
  const handleDeleteMedia = (media: Media) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除文件 "${media.name}" 吗？此操作不可恢复。`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutate(media.id),
    });
  };

  const handleDeleteFolder = (folder: MediaNode) => {
    if (folder.kind !== 'folder') {
      return;
    }
    Modal.confirm({
      title: '删除目录',
      content: `确定要删除目录 "${folder.name}" 吗？`,
      okText: '递归删除',
      cancelText: '取消',
      onOk: () => deleteFolderMutation.mutate({ id: folder.id, recursive: true }),
    });
  };

  const handleCreateFolder = (values: CreateMediaFolderInput) => {
    createFolderMutation.mutate({
      ...values,
      parentId: currentParentId,
    });
  };

  const handleOpenEditFolder = (folder: MediaFolderNode) => {
    setEditingFolder(folder);
    folderEditForm.setFieldsValue({
      name: folder.name,
      parentId: undefined,
      moveToRoot: false,
    });
    setFolderEditOpen(true);
  };

  const handleSubmitEditFolder = (values: UpdateMediaFolderInput) => {
    if (!editingFolder) {
      return;
    }
    const input: UpdateMediaFolderInput = {
      name: values.name?.trim() || undefined,
      moveToRoot: values.moveToRoot ?? false,
    };
    if (!values.moveToRoot && values.parentId) {
      input.parentId = values.parentId;
    }
    updateFolderMutation.mutate({ id: editingFolder.id, input });
  };

  // 查看详情
  const handleViewDetail = (media: MediaNode) => {
    if (media.kind === 'folder') {
      setCurrentParentId(media.id);
      setCurrentPath(media.path || '/');
      setSelectedRowKeys([]);
      setFolderHistory(prev => [...prev, { id: media.id, name: media.name, path: media.path || '/' }]);
      return;
    }
    setSelectedMedia(media);
    detailForm.setFieldsValue({
      name: media.name,
      alternativeText: media.alternativeText,
      caption: media.caption,
      folderPath: media.folderPath ?? currentPath,
    });
    setDetailThumbnailFile(undefined);
    setDetailDrawerOpen(true);
  };

  // 更新详情
  const handleUpdateDetail = (values: Record<string, string>) => {
    if (selectedMedia) {
      updateMutation.mutate({
        id: selectedMedia.id,
        params: buildMediaUpdatePayload(values, detailThumbnailFile),
      });
    }
  };

  // 关闭详情抽屉
  const handleCloseDetailDrawer = () => {
    setDetailDrawerOpen(false);
    setSelectedMedia(null);
    setDetailThumbnailFile(undefined);
    detailForm.resetFields();
  };

  // 渲染媒体预览
  const renderMediaPreview = (media: MediaNode, size: 'small' | 'large' = 'small') => {
    if (media.kind === 'folder') {
      return (
        <div className="flex items-center justify-center bg-amber-50 text-amber-500" style={{ height: size === 'small' ? 150 : 200 }}>
          <CustomIcon icon="line-md:folder-open-twotone" width={size === 'small' ? 52 : 72} />
        </div>
      );
    }
    const mediaType = getMediaType(media.mime);
    const previewUrl = media.previewUrl || media.url;

    if (mediaType === 'image') {
      return (
        <Image
          src={previewUrl}
          alt={media.alternativeText || media.name}
          style={size === 'small' ? { width: '100%', height: 150, objectFit: 'cover' } : { maxWidth: '100%', maxHeight: 300 }}
          preview={size === 'large'}
        />
      );
    }

    const iconMap = {
      video: 'line-md:play',
      audio: 'line-md:play',
      document: 'line-md:document',
      other: 'line-md:file',
    };

    return (
      <div
        className="flex items-center justify-center bg-gray-100"
        style={{ height: size === 'small' ? 150 : 200 }}
      >
        <CustomIcon icon={iconMap[mediaType]} width={size === 'small' ? 48 : 64} className="text-gray-400" />
      </div>
    );
  };

  // 表格列定义（列表视图）
  const columns = [
    {
      title: '预览',
      key: 'preview',
      width: 80,
      render: (_: unknown, media: MediaNode) => (
        <div className="w-16 h-16 overflow-hidden rounded">
          {renderMediaPreview(media)}
        </div>
      ),
    },
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'mime',
      key: 'mime',
      width: 150,
      render: (_: string, media: MediaNode) => (
        media.kind === 'folder'
          ? <Tag color="gold">目录</Tag>
          : <Tag color="blue">{media.mime || '-'}</Tag>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (_: number, media: MediaNode) => (media.kind === 'folder' ? '-' : formatFileSize(media.size)),
    },
    {
      title: '尺寸',
      key: 'dimensions',
      width: 120,
      render: (_: unknown, media: MediaNode) => (
        media.kind === 'file' && media.width && media.height ? `${media.width} × ${media.height}` : '-'
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: unknown, media: MediaNode) => {
        const actionItems: ActionItem<MediaNode>[] = getMediaRowActionLabels(media.kind).map((label) => {
          if (label === '进入' || label === '详情') {
            return {
              key: label === '进入' ? 'open' : 'detail',
              label,
              onClick: () => handleViewDetail(media),
            };
          }
          if (label === '重命名/移动') {
            return {
              key: 'edit-folder',
              label,
              onClick: () => media.kind === 'folder' && handleOpenEditFolder(media),
            };
          }
          if (label === '删除目录') {
            return {
              key: 'delete-folder',
              label,
              danger: true,
              disabled: deleteMutation.isPending || deleteFolderMutation.isPending,
              onClick: () => handleDeleteFolder(media),
            };
          }
          return {
            key: 'delete-file',
            label,
            danger: true,
            disabled: deleteMutation.isPending || deleteFolderMutation.isPending,
            onClick: () => media.kind === 'file' && handleDeleteMedia(media),
          };
        });

        return (
          <RowActionBar
            items={actionItems}
            context={media}
          />
        );
      },
    },
  ];

  const searchFields: ProTableSearchField<MediaListParams>[] = [
    {
      name: '_q',
      label: '名称',
      placeholder: '搜索文件或目录名称',
    },
    {
      name: 'mimePrefix',
      label: '文件类型',
      type: 'select',
      options: [
        { label: '图片', value: 'image/' },
        { label: '视频', value: 'video/' },
        { label: '音频', value: 'audio/' },
        { label: '文档', value: 'application/' },
      ],
    },
    {
      name: 'include',
      label: '节点类型',
      type: 'select',
      options: [
        { label: '全部', value: 'all' },
        { label: '仅目录', value: 'folders' },
        { label: '仅文件', value: 'files' },
      ],
    },
    {
      name: 'sort',
      label: '排序字段',
      type: 'select',
      options: [
        { label: '创建时间', value: 'createdAt' },
        { label: '更新时间', value: 'updatedAt' },
        { label: '名称', value: 'name' },
        { label: '大小', value: 'size' },
      ],
    },
    {
      name: 'order',
      label: '排序方向',
      type: 'select',
      options: [
        { label: '降序', value: 'desc' },
        { label: '升序', value: 'asc' },
      ],
    },
  ];

  const handleNavigateToHistory = (index: number) => {
    const target = folderHistory[index];
    if (!target) {
      return;
    }
    const nextHistory = folderHistory.slice(0, index + 1);
    setFolderHistory(nextHistory);
    setCurrentParentId(target.id);
    setCurrentPath(target.path);
    setSelectedRowKeys([]);
  };

  const breadcrumbItems = folderHistory.map((item, index) => ({
    title: (
      <button
        type="button"
        className="text-primary"
        onClick={() => handleNavigateToHistory(index)}
      >
        {item.name}
      </button>
    ),
  }));
  const canNavigateBack = folderHistory.length > 1;
  const handleNavigateBack = () => {
    if (!canNavigateBack) {
      return;
    }
    handleNavigateToHistory(folderHistory.length - 2);
  };

  const handleBatchDelete = () => {
    if (selectedNodes.length === 0) {
      message.warning('请先选择要删除的资源');
      return;
    }
    const fileIds = selectedNodes.filter(node => node.kind === 'file').map(node => node.id);
    const folderIds = selectedNodes.filter(node => node.kind === 'folder').map(node => node.id);
    Modal.confirm({
      title: '批量删除',
      content: `将删除 ${fileIds.length} 个文件、${folderIds.length} 个目录。是否继续？`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => bulkDeleteMutation.mutate({ fileIds, folderIds, recursive: true }),
    });
  };

  const handleOpenBatchMove = () => {
    if (selectedNodes.length === 0) {
      message.warning('请先选择要移动的资源');
      return;
    }
    moveForm.setFieldsValue({
      destinationRoot: false,
      destinationFolderId: undefined,
    });
    setMoveModalOpen(true);
  };

  const handleSubmitBatchMove = (values: BulkMoveMediaInput) => {
    const fileIds = selectedNodes.filter(node => node.kind === 'file').map(node => node.id);
    const folderIds = selectedNodes.filter(node => node.kind === 'folder').map(node => node.id);

    bulkMoveMutation.mutate({
      fileIds,
      folderIds,
      destinationRoot: values.destinationRoot === true,
      destinationFolderId: values.destinationRoot ? undefined : values.destinationFolderId,
    });
  };

  const handleMoveSelectedToRoot = () => {
    if (selectedNodes.length === 0) {
      message.warning('请先选择要移动的资源');
      return;
    }
    const fileIds = selectedNodes.filter(node => node.kind === 'file').map(node => node.id);
    const folderIds = selectedNodes.filter(node => node.kind === 'folder').map(node => node.id);
    bulkMoveMutation.mutate({
      fileIds,
      folderIds,
      destinationRoot: true,
      destinationFolderId: undefined,
    });
  };

  const handleToggleGridSelection = (nodeId: string, checked: boolean) => {
    setSelectedRowKeys((prev) => {
      if (checked) {
        return prev.includes(nodeId) ? prev : [...prev, nodeId];
      }
      return prev.filter(id => id !== nodeId);
    });
  };

  const handleDropMove = (activeId: string, targetId: `folder:${string}` | 'root') => {
    if (targetId === 'root' && !currentParentId) {
      message.info('当前已在根目录，无需移动');
      return;
    }
    const input = buildBulkMoveInputFromDrop({
      activeNodeId: activeId,
      overTargetId: targetId,
      nodes: table.data,
    });
    if (!input) {
      message.warning('当前拖拽目标不合法，请更换目标目录');
      return;
    }
    bulkMoveMutation.mutate(input);
  };

  const searchConfig: ProTableSearchConfig<MediaListParams> = {
    fields: searchFields,
    values: table.search.values,
    onChange: table.search.onChange,
    onSubmit: table.search.onSubmit,
    onReset: table.search.onReset,
  };
  const pageSizeOptions = [12, 24, 48, 96];
  const handleViewModeChange = (value: string | number) => {
    const nextMode = value as 'grid' | 'list';
    if (nextMode === 'grid') {
      listPaginationSnapshotRef.current = {
        page: table.pagination.page,
        pageSize: table.pagination.pageSize,
      };
      table.onPaginationChange({
        ...table.pagination,
        page: 1,
        pageSize: 200,
      });
    }
    else if (listPaginationSnapshotRef.current) {
      table.onPaginationChange({
        ...table.pagination,
        page: listPaginationSnapshotRef.current.page,
        pageSize: listPaginationSnapshotRef.current.pageSize,
      });
    }
    setViewMode(nextMode);
  };

  useEffect(() => {
    if (viewMode !== 'grid') {
      return;
    }
    if (table.pagination.page === 1 && table.pagination.pageSize === 200) {
      return;
    }
    if (!listPaginationSnapshotRef.current) {
      listPaginationSnapshotRef.current = {
        page: table.pagination.page,
        pageSize: table.pagination.pageSize,
      };
    }
    table.onPaginationChange({
      ...table.pagination,
      page: 1,
      pageSize: 200,
    });
  }, [table.onPaginationChange, table.pagination, viewMode]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4">
        <SearchBar search={searchConfig} />
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Segmented
          value={viewMode}
          onChange={handleViewModeChange}
          options={[
            { label: '网格', icon: <CustomIcon icon="line-md:grid-3" width={16} />, value: 'grid' },
            { label: '列表', icon: <CustomIcon icon="line-md:list-3" width={16} />, value: 'list' },
          ]}
        />
        <Space wrap>
          <Button
            type="primary"
            icon={<CustomIcon icon="line-md:upload" width={16} />}
            onClick={() => setUploadModalOpen(true)}
          >
            上传文件
          </Button>
          <Button
            icon={<CustomIcon icon="line-md:folder-plus-twotone" width={16} />}
            onClick={() => setCreateFolderOpen(true)}
          >
            新建目录
          </Button>
          <Button
            icon={<CustomIcon icon="line-md:folder-arrow-right-twotone" width={16} />}
            disabled={!hasSelectedNodes}
            loading={bulkMoveMutation.isPending}
            onClick={handleOpenBatchMove}
          >
            批量移动
          </Button>
          <Button
            icon={<CustomIcon icon="line-md:folder-arrow-right-twotone" width={16} />}
            disabled={!hasSelectedNodes || !currentParentId}
            loading={bulkMoveMutation.isPending}
            onClick={handleMoveSelectedToRoot}
          >
            移到根目录
          </Button>
          <Button
            danger
            disabled={!hasSelectedNodes}
            loading={bulkDeleteMutation.isPending}
            onClick={handleBatchDelete}
          >
            批量删除
          </Button>
          {viewMode === 'grid' && (
            <>
              <Button
                disabled={table.data.length === 0}
                onClick={() => setSelectedRowKeys(table.data.map(node => node.id))}
              >
                全选当前页
              </Button>
              <Button
                disabled={!hasSelectedNodes}
                onClick={() => setSelectedRowKeys([])}
              >
                清空选择
              </Button>
            </>
          )}
          {hasSelectedNodes && <span className="text-xs text-gray-500">已选 {selectedNodes.length} 项</span>}
        </Space>
      </div>

      {viewMode === 'list'
        ? (
            <ProTable<MediaNode, MediaListParams>
              columns={columns}
              data={table.data}
              loading={table.loading}
              rowKey="id"
              pagination={table.pagination}
              pageSizeOptions={pageSizeOptions}
              onPaginationChange={table.onPaginationChange}
              onRefresh={table.onRefresh}
              tableProps={{
                title: () => (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <Button
                      size="small"
                      icon={<CustomIcon icon="line-md:arrow-left" width={14} />}
                      disabled={!canNavigateBack}
                      onClick={handleNavigateBack}
                    >
                      返回上级
                    </Button>
                    <div className="min-w-0 flex-1 overflow-x-auto">
                      <Breadcrumb items={breadcrumbItems} />
                    </div>
                  </div>
                ),
                rowSelection: {
                  selectedRowKeys,
                  onChange: keys => setSelectedRowKeys(keys as string[]),
                },
              }}
            />
          )
        : (
            <div className="flex min-h-0 flex-1 flex-col">
              <Card
                className="flex min-h-0 flex-1"
                styles={{
                  body: {
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    height: '100%',
                    padding: 16,
                  },
                }}
              >
                <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <Button
                    size="small"
                    icon={<CustomIcon icon="line-md:arrow-left" width={14} />}
                    disabled={!canNavigateBack}
                    onClick={handleNavigateBack}
                  >
                    返回上级
                  </Button>
                  <div className="min-w-0 flex-1 overflow-x-auto">
                    <Breadcrumb items={breadcrumbItems} />
                  </div>
                </div>
                <div className="max-h-[calc(100vh-360px)] min-h-0 flex-1 overflow-y-auto pr-1">
                  {table.data.length === 0 && !table.loading
                    ? <Empty description="暂无媒体文件" />
                    : (
                        <MediaDndGrid
                          nodes={table.data}
                          loading={table.loading}
                          selectedNodeIds={selectedRowKeys}
                          onOpenNode={handleViewDetail}
                          onSelectNode={handleToggleGridSelection}
                          onDropMove={handleDropMove}
                        />
                    )}
                </div>
              </Card>
            </div>
          )}

      {/* 上传弹窗 */}
      <MediaUploadModal
        open={uploadModalOpen}
        currentPath={currentPath}
        confirmLoading={uploadMutation.isPending}
        onCancel={() => setUploadModalOpen(false)}
        onSubmit={async input => uploadMutation.mutateAsync(input)}
      />

      <Modal
        title="新建目录"
        open={createFolderOpen}
        onCancel={() => {
          setCreateFolderOpen(false);
          folderForm.resetFields();
        }}
        onOk={() => folderForm.submit()}
        confirmLoading={createFolderMutation.isPending}
      >
        <Form<CreateMediaFolderInput>
          form={folderForm}
          layout="vertical"
          onFinish={handleCreateFolder}
        >
          <Form.Item
            name="name"
            label="目录名称"
            rules={[{ required: true, message: '请输入目录名称' }]}
          >
            <Input placeholder="例如：products" />
          </Form.Item>
          <Form.Item label="当前父目录">
            <Input value={currentPath} disabled />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量移动"
        open={moveModalOpen}
        onCancel={() => {
          setMoveModalOpen(false);
          moveForm.resetFields();
        }}
        onOk={() => moveForm.submit()}
        confirmLoading={bulkMoveMutation.isPending}
      >
        <Form<BulkMoveMediaInput>
          form={moveForm}
          layout="vertical"
          initialValues={{ destinationRoot: false }}
          onFinish={handleSubmitBatchMove}
        >
          <Form.Item name="destinationRoot" label="移动到根目录" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item noStyle shouldUpdate>
            {() => {
              const toRoot = moveForm.getFieldValue('destinationRoot') === true;
              return (
                <Form.Item
                  name="destinationFolderId"
                  label="目标目录"
                  rules={toRoot ? [] : [{ required: true, message: '请选择目标目录或启用根目录' }]}
                >
                  <Select
                    allowClear
                    disabled={toRoot}
                    placeholder="选择目标目录"
                    options={folderNodes
                      .map(folder => ({ value: folder.id, label: `${folder.name} (${folder.path || '/'})` }))}
                  />
                </Form.Item>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="目录重命名 / 移动"
        open={folderEditOpen}
        onCancel={() => {
          setFolderEditOpen(false);
          setEditingFolder(null);
          folderEditForm.resetFields();
        }}
        onOk={() => folderEditForm.submit()}
        confirmLoading={updateFolderMutation.isPending}
      >
        <Form<UpdateMediaFolderInput>
          form={folderEditForm}
          layout="vertical"
          onFinish={handleSubmitEditFolder}
        >
          <Form.Item name="name" label="目录名称">
            <Input placeholder="输入新目录名（可选）" />
          </Form.Item>
          <Form.Item name="moveToRoot" label="移动到根目录" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item noStyle shouldUpdate>
            {() => {
              const toRoot = folderEditForm.getFieldValue('moveToRoot') === true;
              return (
                <Form.Item name="parentId" label="移动到目标目录">
                  <Select
                    allowClear
                    disabled={toRoot}
                    placeholder="不选择则保持父目录不变"
                    options={folderNodes
                      .filter(folder => folder.id !== editingFolder?.id)
                      .map(folder => ({ value: folder.id, label: `${folder.name} (${folder.path || '/'})` }))}
                  />
                </Form.Item>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情抽屉 */}
      <Drawer
        title="文件详情"
        open={detailDrawerOpen}
        onClose={handleCloseDetailDrawer}
        width={500}
        extra={(
          <Button
            danger
            onClick={() => selectedMedia && handleDeleteMedia(selectedMedia)}
            loading={deleteMutation.isPending}
          >
            删除
          </Button>
        )}
      >
        {selectedMedia && (
          <div className="space-y-6">
            {/* 预览 */}
            <div className="text-center">
              {renderMediaPreview(selectedMedia, 'large')}
            </div>

            {/* 文件信息 */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">文件名</span>
                <span className="font-medium">{selectedMedia.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">类型</span>
                <span>{selectedMedia.mime || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">大小</span>
                <span>{formatFileSize(selectedMedia.size)}</span>
              </div>
              {selectedMedia.width && selectedMedia.height && (
                <div className="flex justify-between">
                  <span className="text-gray-500">尺寸</span>
                  <span>
                    {selectedMedia.width}
                    {' '}
                    ×
                    {selectedMedia.height}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">URL</span>
                <a href={selectedMedia.url} target="_blank" rel="noopener noreferrer" className="text-primary truncate max-w-[200px]">
                  查看原文件
                </a>
              </div>
            </div>

            {/* 编辑表单 */}
            <Form
              form={detailForm}
              layout="vertical"
              onFinish={handleUpdateDetail}
            >
              <Form.Item name="name" label="文件名" rules={[{ required: true, message: '请输入文件名' }]}>
                <Input placeholder="输入文件名（不含扩展名）" />
              </Form.Item>
              <Form.Item name="folder_path" hidden>
                <Input />
              </Form.Item>
              <Form.Item name="alternative_text" label="替代文本">
                <Input placeholder="用于无障碍访问的描述" />
              </Form.Item>
              <Form.Item name="caption" label="说明">
                <Input.TextArea rows={3} placeholder="文件说明" />
              </Form.Item>
              <Form.Item label="缩略图（可选）">
                <Space direction="vertical" size="small" className="w-full">
                  <Upload
                    accept="image/*"
                    maxCount={1}
                    showUploadList={false}
                    beforeUpload={() => false}
                    onChange={(event) => {
                      const file = event.file.originFileObj;
                      setDetailThumbnailFile(file);
                    }}
                  >
                    <Button icon={<UploadOutlined />}>上传缩略图</Button>
                  </Upload>
                  <span className="text-xs text-gray-500">
                    {detailThumbnailFile
                      ? `已选择：${detailThumbnailFile.name}`
                      : '不上传则保持原缩略图'}
                  </span>
                </Space>
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={updateMutation.isPending}
                  block
                >
                  保存修改
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Drawer>
    </div>
  );
}
