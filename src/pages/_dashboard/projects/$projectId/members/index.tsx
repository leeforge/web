import type { ActionItem, ProTableSearchField } from '@leeforge/react-ui';
import type { ColumnsType } from 'antd/es/table';
import type { ProjectMemberFormRef } from './-components/ProjectMemberForm';
import type { AddProjectMemberParams, ProjectMember, UpdateProjectMemberParams } from '@/api/endpoints/project.api';
import { ProTable, RowActionBar } from '@leeforge/react-ui';
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { Breadcrumb, Button, Modal, Tag } from 'antd';
import { useMemo, useRef, useState } from 'react';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import { ProjectMemberForm } from './-components/ProjectMemberForm';

interface MemberSearchParams {
  q?: string;
}

const DEFAULT_MEMBERS: ProjectMember[] = [
  {
    id: 'pm-1',
    projectId: 'proj-cms-core',
    userId: 'user-admin',
    username: 'admin',
    email: 'admin@example.com',
    roleId: 'role-project-admin',
    roleCode: 'project_admin',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const Route = createFileRoute('/_dashboard/projects/$projectId/members/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { projectId } = useParams({ from: '/_dashboard/projects/$projectId/members/' });
  const formRef = useRef<ProjectMemberFormRef>(null);
  const [members, setMembers] = useState<ProjectMember[]>(DEFAULT_MEMBERS.filter(item => item.projectId === projectId));
  const [searchValues, setSearchValues] = useState<MemberSearchParams>({});

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (!searchValues.q) {
        return true;
      }
      const searchText = `${member.userId} ${member.username || ''} ${member.email || ''}`.toLowerCase();
      return searchText.includes(searchValues.q.toLowerCase());
    });
  }, [searchValues.q, members]);

  const handleSubmit = async (values: AddProjectMemberParams | UpdateProjectMemberParams, isEdit: boolean, editingId?: string) => {
    const now = new Date().toISOString();
    if (isEdit && editingId) {
      setMembers(prev => prev.map(member => member.id === editingId
        ? { ...member, ...values, updatedAt: now }
        : member));
    }
    else {
      const createValues = values as AddProjectMemberParams;
      setMembers(prev => [
        {
          id: `pm-${Date.now()}`,
          projectId,
          userId: createValues.userId,
          roleId: createValues.roleId,
          status: createValues.status || 'active',
          createdAt: now,
          updatedAt: now,
        },
        ...prev,
      ]);
    }
  };

  const removeMember = (member: ProjectMember) => {
    Modal.confirm({
      title: '确认移除成员',
      content: `确定要移除成员 "${member.username || member.userId}" 吗？`,
      okText: '确认移除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => setMembers(prev => prev.filter(item => item.id !== member.id)),
    });
  };

  const columns: ColumnsType<ProjectMember> = [
    {
      title: '成员',
      key: 'member',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.username || record.userId}</div>
          <div className="text-xs text-textSecondary">{record.email || '-'}</div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'roleCode',
      key: 'roleCode',
      render: value => <Tag color="blue">{value || '-'}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: value => (
        <Tag color={value === 'active' ? 'green' : 'default'}>
          {value === 'active' ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const actionItems: ActionItem<ProjectMember>[] = [
          {
            key: 'edit',
            label: '编辑',
            onClick: () => formRef.current?.open({ data: record }),
          },
          {
            key: 'remove',
            label: '移除',
            danger: true,
            onClick: () => removeMember(record),
          },
        ];

        return (
          <RowActionBar
            items={actionItems}
            context={record}
          />
        );
      },
    },
  ];

  const searchFields: ProTableSearchField<MemberSearchParams>[] = [
    {
      name: 'q',
      label: '关键词',
      placeholder: '按用户 ID / 用户名 / 邮箱搜索',
    },
  ];

  return (
    <div className="h-full min-h-0">
      <div className="mb-3">
        <Breadcrumb
          items={[
            {
              title: (
                <a
                  onClick={(event) => {
                    event.preventDefault();
                    navigate({ to: '/projects' });
                  }}
                >
                  项目列表
                </a>
              ),
            },
            { title: `成员管理：${projectId}` },
          ]}
        />
      </div>

      <ProTable<ProjectMember, MemberSearchParams>
        rowKey="id"
        columns={columns}
        data={filteredMembers}
        pagination={{
          current: 1,
          pageSize: 10,
          total: filteredMembers.length,
        }}
        search={{
          fields: searchFields,
          values: searchValues,
          onChange: setSearchValues,
          onSubmit: () => {},
          onReset: () => setSearchValues({}),
        }}
        actions={(
          <Button
            type="primary"
            icon={<CustomIcon icon="line-md:plus" width={16} />}
            onClick={() => formRef.current?.open()}
          >
            添加成员
          </Button>
        )}
      />

      <ProjectMemberForm
        ref={formRef}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
