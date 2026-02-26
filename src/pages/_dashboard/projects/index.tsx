import type { ActionItem, ProTableSearchField } from '@leeforge/react-ui';
import type { ColumnsType } from 'antd/es/table';
import type { ProjectFormRef } from './-components/ProjectForm';
import type { CreateProjectParams, Project, UpdateProjectParams } from '@/api/endpoints/project.api';
import { ProTable, RowActionBar } from '@leeforge/react-ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button, Modal, Tag } from 'antd';
import { useMemo, useRef, useState } from 'react';
import { useStore } from 'zustand';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import { AuthStore } from '@/stores';
import { ProjectForm } from './-components/ProjectForm';

interface ProjectSearchParams {
  q?: string;
  status?: '' | 'active' | 'inactive';
}

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-cms-core',
    domainType: 'platform',
    domainKey: 'root',
    code: 'cms-core',
    name: 'CMS Core',
    description: '核心内容管理项目',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proj-portal',
    domainType: 'platform',
    domainKey: 'root',
    code: 'student-portal',
    name: 'Student Portal',
    description: '学生门户项目',
    status: 'inactive',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const Route = createFileRoute('/_dashboard/projects/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const formRef = useRef<ProjectFormRef>(null);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [searchValues, setSearchValues] = useState<ProjectSearchParams>({});
  const actingDomain = useStore(AuthStore, state => state.actingDomain);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const hitKeyword = !searchValues.q
        || project.name.toLowerCase().includes(searchValues.q.toLowerCase())
        || project.code.toLowerCase().includes(searchValues.q.toLowerCase());
      const hitStatus = !searchValues.status || project.status === searchValues.status;
      return hitKeyword && hitStatus;
    });
  }, [searchValues.q, searchValues.status, projects]);

  const handleSubmit = async (values: CreateProjectParams | UpdateProjectParams, isEdit: boolean, editingId?: string) => {
    const now = new Date().toISOString();
    if (isEdit && editingId) {
      setProjects(prev => prev.map(project => project.id === editingId
        ? { ...project, ...values, updatedAt: now }
        : project));
    }
    else {
      const createValues = values as CreateProjectParams;
      const id = `proj-${createValues.code}-${Date.now()}`;
      setProjects(prev => [
        {
          id,
          ...createValues,
          domainType: actingDomain?.type || 'platform',
          domainKey: actingDomain?.key || 'root',
          createdAt: now,
          updatedAt: now,
        },
        ...prev,
      ]);
    }
  };

  const toggleStatus = (project: Project) => {
    setProjects(prev => prev.map(item => item.id === project.id
      ? {
          ...item,
          status: item.status === 'active' ? 'inactive' : 'active',
          updatedAt: new Date().toISOString(),
        }
      : item));
  };

  const removeProject = (project: Project) => {
    Modal.confirm({
      title: '确认删除项目',
      content: `确定要删除项目 "${project.name}" 吗？`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => setProjects(prev => prev.filter(item => item.id !== project.id)),
    });
  };

  const columns: ColumnsType<Project> = [
    {
      title: '项目',
      key: 'name',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.name}</div>
          <div className="text-xs text-textSecondary">{record.code}</div>
        </div>
      ),
    },
    {
      title: '所属域',
      key: 'domain',
      width: 180,
      render: (_, record) => record.domainKey
        ? `${record.domainType || 'platform'}:${record.domainKey}`
        : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: Project['status']) => (
        <Tag color={value === 'active' ? 'green' : 'default'}>
          {value === 'active' ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      render: value => value || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const actionItems: ActionItem<Project>[] = [
          {
            key: 'members',
            label: '成员管理',
            onClick: () => navigate({ to: '/projects/$projectId/members', params: { projectId: record.id } }),
          },
          {
            key: 'edit',
            label: '编辑',
            onClick: () => formRef.current?.open({ data: record }),
          },
          {
            key: 'toggleStatus',
            label: record.status === 'active' ? '停用' : '启用',
            onClick: () => toggleStatus(record),
          },
          {
            key: 'delete',
            label: '删除',
            danger: true,
            onClick: () => removeProject(record),
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

  const searchFields: ProTableSearchField<ProjectSearchParams>[] = [
    {
      name: 'q',
      label: '关键词',
      placeholder: '按项目名称或编码搜索',
    },
    {
      name: 'status',
      label: '状态',
      type: 'select',
      options: [
        { label: '全部', value: '' },
        { label: '启用', value: 'active' },
        { label: '停用', value: 'inactive' },
      ],
    },
  ];

  return (
    <div className="h-full min-h-0">
      <ProTable<Project, ProjectSearchParams>
        rowKey="id"
        columns={columns}
        data={filteredProjects}
        pagination={{
          current: 1,
          pageSize: 10,
          total: filteredProjects.length,
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
            新建项目
          </Button>
        )}
      />

      <ProjectForm
        ref={formRef}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
