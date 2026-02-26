import type { ActionItem, ProTableSearchField } from '@leeforge/react-ui';
import type { DictionaryFormRef } from './DictionaryForm';
import type { Dictionary } from '@/api/endpoints/dictionary.api';
import { ProTable, RowActionBar, useProTableQuery } from '@leeforge/react-ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Button, Modal, Space, Tag, Tooltip } from 'antd';
import { useRef } from 'react';
import {
  deleteDictionary,
  getDictionaryList,
} from '@/api/endpoints/dictionary.api';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import { useMsg } from '@/hooks';
import { DictionaryForm } from './DictionaryForm';

interface DictionaryListParams {
  keyword?: string;
}

/**
 * 字典类型管理页面
 */
export function DictionariesListPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { msgSuccess, msgError } = useMsg();

  // 表单状态
  const formRef = useRef<DictionaryFormRef>(null);
  const table = useProTableQuery<Dictionary, DictionaryListParams>({
    useQuery,
    queryKey: ['dictionaries'],
    queryFn: async (params) => {
      const response = await getDictionaryList();
      const dictionaries = response.data ?? [];
      const keyword = typeof params.keyword === 'string'
        ? params.keyword.trim().toLowerCase()
        : '';
      const filtered = keyword
        ? dictionaries.filter(
          item =>
            item.name.toLowerCase().includes(keyword)
            || item.code.toLowerCase().includes(keyword),
        )
        : dictionaries;
      const page = typeof params.page === 'number' ? params.page : 1;
      const pageSize = typeof params.pageSize === 'number' && params.pageSize > 0
        ? params.pageSize
        : 10;
      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      const safePage = Math.min(Math.max(page, 1), totalPages);
      const start = (safePage - 1) * pageSize;
      return {
        list: filtered.slice(start, start + pageSize),
        total: filtered.length,
        page: safePage,
        pageSize,
      };
    },
    keepPreviousData: true,
  });

  // 删除字典 mutation
  const deleteMutation = useMutation({
    mutationFn: deleteDictionary,
    onSuccess: () => {
      msgSuccess('字典删除成功');
      queryClient.invalidateQueries({ queryKey: ['dictionaries'] });
    },
    onError: (error: Error) => {
      msgError(`删除失败: ${error.message}`);
    },
  });

  // 删除确认
  const handleDelete = (dictionary: Dictionary) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除字典 "${dictionary.name}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutate(dictionary.id),
    });
  };

  // 打开新建表单
  const handleCreate = () => {
    formRef.current?.open();
  };

  // 打开编辑表单
  const handleEdit = (dictionary: Dictionary) => {
    formRef.current?.open({ data: dictionary });
  };

  // 跳转到字典数据页面
  const handleViewData = (dictionary: Dictionary) => {
    navigate({ to: '/dictionaries/$code', params: { code: dictionary.code } });
  };

  // 刷新缓存
  // const handleRefreshCache = () => {
  //   DictionaryStore.getState().clear();
  //   table.refresh();
  //   msgSuccess('字典缓存已刷新');
  // };

  // 表格列定义
  const columns = [
    {
      title: '字典名称',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (name: string) => <span className="font-medium">{name}</span>,
    },
    {
      title: '字典编码',
      dataIndex: 'code',
      key: 'code',
      width: 200,
      render: (code: string) => (
        <Tooltip title="点击复制">
          <Tag
            color="blue"
            className="cursor-pointer"
            onClick={() => {
              navigator.clipboard.writeText(code);
              msgSuccess('已复制编码');
            }}
          >
            {code}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string) => description || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: boolean) => (
        <Tag color={status ? 'success' : 'default'}>
          {status ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 260,
      render: (_: unknown, dictionary: Dictionary) => {
        const actionItems: ActionItem<Dictionary>[] = [
          {
            key: 'data',
            label: '字典数据',
            onClick: () => handleViewData(dictionary),
          },
          {
            key: 'edit',
            label: '编辑',
            onClick: () => handleEdit(dictionary),
          },
          {
            key: 'delete',
            label: '删除',
            danger: true,
            disabled: deleteMutation.isPending,
            onClick: () => handleDelete(dictionary),
          },
        ];

        return (
          <RowActionBar
            items={actionItems}
            context={dictionary}
          />
        );
      },
    },
  ];

  const searchFields: ProTableSearchField<DictionaryListParams>[] = [
    {
      name: 'keyword',
      label: '关键词',
      placeholder: '搜索名称或编码',
    },
  ];

  return (
    <div className="h-full min-h-0">
      <ProTable<Dictionary, DictionaryListParams>
        columns={columns}
        data={table.data}
        loading={table.loading}
        rowKey="id"
        pagination={table.pagination}
        pageSizeOptions={[10, 20, 50, 100]}
        onPaginationChange={table.onPaginationChange}
        search={{
          fields: searchFields,
          values: table.search.values,
          onChange: table.search.onChange,
          onSubmit: table.search.onSubmit,
          onReset: table.search.onReset,
        }}
        onRefresh={table.onRefresh}
        actions={(
          <Space>
            <Button
              type="primary"
              icon={<CustomIcon icon="mdi:plus" width={16} />}
              onClick={handleCreate}
            >
              新建字典
            </Button>
          </Space>
        )}
      />

      {/* 字典表单弹窗 */}
      <DictionaryForm ref={formRef} />
    </div>
  );
}
