import type { DataNode, TreeProps } from 'antd/es/tree';
import type { OrganizationFormRef } from './OrganizationForm';
import type { Organization, OrganizationTreeNode } from '@/api/endpoints/organization.api';
import { DeleteOutlined, EditOutlined, MoreOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Dropdown, Modal, Tree } from 'antd';
import { useRef, useState } from 'react';
import { useMsg } from '@/hooks/modules/useMsg';
import {
  useDeleteOrganization,
  useOrganizationTree,
} from '../-hooks/useOrganization';
import { OrganizationForm } from './OrganizationForm';

interface OrganizationTreeProps {
  onSelect?: (org: Organization | null) => void;
  selectable?: boolean;
}

/**
 * 组织树组件
 */
export function OrganizationTree({ onSelect, selectable = true }: OrganizationTreeProps) {
  const { msgSuccess, msgError } = useMsg();
  const { data: treeResponse, refetch } = useOrganizationTree();
  const deleteMutation = useDeleteOrganization();

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const formRef = useRef<OrganizationFormRef>(null);

  const handleSelect: TreeProps['onSelect'] = (selectedKeys) => {
    const key = selectedKeys[0] as string | undefined;
    setSelectedKey(key || null);

    if (!onSelect) {
      return;
    }

    const findOrganization = (nodes: OrganizationTreeNode[]): Organization | null => {
      for (const node of nodes) {
        if (node.id === key) {
          return node;
        }
        if (node.children) {
          const found = findOrganization(node.children);
          if (found)
            return found;
        }
      }
      return null;
    };

    const nodes = treeResponse?.data || [];
    onSelect(key ? findOrganization(nodes) : null);
  };

  const handleAdd = (nextParentId: string | null = null) => {
    formRef.current?.open({
      data: {
        parentId: nextParentId,
      },
    });
  };

  const handleEdit = (org: Organization) => {
    formRef.current?.open({
      data: {
        organization: org,
        parentId: org.parentId ?? null,
      },
    });
  };

  const handleDelete = (org: Organization) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除组织 "${org.name}" 吗？删除后不可恢复。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(org.id);
          msgSuccess('删除成功');
          if (selectedKey === org.id) {
            setSelectedKey(null);
            onSelect?.(null);
          }
          refetch();
        }
        catch (error: any) {
          msgError(error?.message || '删除失败');
        }
      },
    });
  };

  const buildTreeData = (nodes: OrganizationTreeNode[]): DataNode[] =>
    nodes.map(node => ({
      key: node.id,
      title: (
        <div className="flex items-center justify-between group">
          <span className="flex items-center gap-2">
            {node.name}
            <span className="text-textSecondary text-xs">
              (
              {node.code}
              )
            </span>
          </span>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'add',
                  icon: <PlusOutlined />,
                  label: '添加子组织',
                  onClick: () => handleAdd(node.id),
                },
                {
                  key: 'edit',
                  icon: <EditOutlined />,
                  label: '编辑',
                  onClick: () => handleEdit(node),
                },
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: '删除',
                  danger: true,
                  onClick: () => handleDelete(node),
                },
              ],
            }}
            trigger={['click']}
          >
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              className="opacity-0 group-hover:opacity-100"
              onClick={(event) => {
                event.stopPropagation();
              }}
            />
          </Dropdown>
        </div>
      ),
      children: node.children ? buildTreeData(node.children) : undefined,
    }));

  const treeData = buildTreeData(treeResponse?.data || []);

  const handleFormSuccess = () => {
    refetch();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">组织架构</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd(null)}>
          新建组织
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <Tree
          showLine={{ showLeafIcon: false }}
          treeData={treeData}
          selectedKeys={selectedKey ? [selectedKey] : []}
          onSelect={handleSelect}
          selectable={selectable}
          defaultExpandAll
        />
      </div>

      <OrganizationForm
        ref={formRef}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
