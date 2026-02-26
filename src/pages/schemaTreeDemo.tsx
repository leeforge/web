import type { TableUISchema } from '@/components/SchemaTable';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { z } from 'zod';
import { SchemaTable } from '@/components/SchemaTable';

export const Route = createFileRoute('/schemaTreeDemo')({
  component: RouteComponent,
});

// 定义菜单 Schema
const menuSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  icon: z.string().optional(),
  sort: z.number(),
  status: z.enum(['active', 'inactive']),
  createdAt: z.string(),
});

type Menu = z.infer<typeof menuSchema> & { children?: Menu[] };

// 示例菜单数据
const initialMenuData: Menu[] = [
  {
    id: '1',
    name: '系统管理',
    path: '/system',
    icon: 'setting',
    sort: 1,
    status: 'active',
    createdAt: '2024-01-01',
    children: [
      {
        id: '1-1',
        name: '用户管理',
        path: '/system/user',
        icon: 'user',
        sort: 1,
        status: 'active',
        createdAt: '2024-01-02',
        children: [
          {
            id: '1-1-1',
            name: '用户列表',
            path: '/system/user/list',
            icon: 'list',
            sort: 1,
            status: 'active',
            createdAt: '2024-01-03',
          },
          {
            id: '1-1-2',
            name: '用户添加',
            path: '/system/user/add',
            icon: 'plus',
            sort: 2,
            status: 'active',
            createdAt: '2024-01-04',
          },
        ],
      },
      {
        id: '1-2',
        name: '角色管理',
        path: '/system/role',
        icon: 'team',
        sort: 2,
        status: 'active',
        createdAt: '2024-01-05',
      },
    ],
  },
  {
    id: '2',
    name: '内容管理',
    path: '/content',
    icon: 'file-text',
    sort: 2,
    status: 'active',
    createdAt: '2024-01-06',
    children: [
      {
        id: '2-1',
        name: '文章管理',
        path: '/content/article',
        icon: 'book',
        sort: 1,
        status: 'active',
        createdAt: '2024-01-07',
      },
    ],
  },
];

// UI Schema
const uiSchema: TableUISchema<Menu> = {
  name: {
    title: '菜单名称',
    width: 200,
    cell: 'text',
  },
  path: {
    title: '路径',
    width: 200,
    cell: 'text',
  },
  icon: {
    title: '图标',
    width: 80,
    cell: 'text',
  },
  sort: {
    title: '排序',
    width: 80,
    cell: 'number',
    align: 'center',
  },
  status: {
    title: '状态',
    width: 100,
    cell: 'status',
    statusOptions: [
      { value: 'active', label: '启用', color: 'success' },
      { value: 'inactive', label: '禁用', color: 'error' },
    ],
  },
  createdAt: {
    title: '创建时间',
    width: 150,
    cell: 'date',
  },
};

function RouteComponent() {
  const [menuData] = useState<Menu[]>(initialMenuData);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>(['1', '2']);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // 处理行选择变化
  const handleRowSelectionChange = (keys: string[]) => {
    setSelectedKeys(keys);
  };

  // 处理行点击
  const handleRowClick = (row: Menu) => {
    console.log('点击菜单:', row.name, row.path);
    // 可以在这里打开编辑弹窗或跳转页面
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">菜单管理</h1>
          <p className="text-gray-600 mt-1">管理系统的菜单结构，支持树形展示</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            新增菜单
          </button>
          <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            导出
          </button>
        </div>
      </div>

      {/* 操作栏 */}
      <div className="bg-white border rounded-lg p-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm"
            onClick={() => setExpandedRowKeys(['1', '2', '1-1'])}
          >
            展开一级
          </button>
          <button
            className="px-3 py-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 text-sm"
            onClick={() => setExpandedRowKeys(['1', '2', '1-1', '1-2', '2-1'])}
          >
            展开全部
          </button>
          <button
            className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 text-sm"
            onClick={() => setExpandedRowKeys([])}
          >
            收起全部
          </button>
        </div>
        <div className="flex-1" />
        <div className="text-sm text-gray-600">
          {selectedKeys.length > 0
            ? (
                <span className="text-blue-600 font-medium">
                  已选中
                  {selectedKeys.length}
                  {' '}
                  个菜单
                </span>
              )
            : (
                <span>未选择任何菜单</span>
              )}
        </div>
      </div>

      {/* 树形表格 */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <SchemaTable
          schema={menuSchema}
          uiSchema={uiSchema}
          data={menuData}
          pagination={false} // 不分页，完整展示树形结构
          enableSelection
          selectionMode="multiple"
          rowSelection={Object.fromEntries(selectedKeys.map(key => [key, true]))}
          onRowSelectionChange={handleRowSelectionChange}
          onRowClick={handleRowClick}
          treeConfig={{
            enabled: true,
            childrenField: 'children',
            expandedRowKeys,
            onExpandedRowsChange: setExpandedRowKeys,
            indentSize: 24,
          }}
          bordered
          size="middle"
        />
      </div>

      {/* 选中菜单信息 */}
      {selectedKeys.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">选中的菜单</h3>
          <div className="flex flex-wrap gap-2">
            {selectedKeys.map((id) => {
              const findNode = (nodes: Menu[]): Menu | undefined => {
                for (const node of nodes) {
                  if (node.id === id)
                    return node;
                  if (node.children) {
                    const found = findNode(node.children);
                    if (found)
                      return found;
                  }
                }
                return undefined;
              };
              const node = findNode(menuData);
              return node
                ? (
                    <span key={id} className="px-2 py-1 bg-white rounded text-sm text-blue-700">
                      {node.name}
                    </span>
                  )
                : null;
            })}
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm">
        <h3 className="font-medium mb-2">使用说明：</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>点击展开图标可以展开/收起子菜单</li>
          <li>点击表头的 ▸/▾ 按钮可以展开/收起全部</li>
          <li>勾选复选框支持选择</li>
          <li>点击行可以查看详情或编辑</li>
          <li>所有菜单完整展示，不分页</li>
        </ul>
      </div>
    </div>
  );
}
