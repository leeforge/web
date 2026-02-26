import type { ActionItem } from '@leeforge/react-ui';
import type { Color } from 'antd/es/color-picker';
import type { DictionaryDetail } from '@/api/endpoints/dictionary.api';
import { ProTable, RowActionBar } from '@leeforge/react-ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import {
  Breadcrumb,
  Button,
  Card,
  Col,
  ColorPicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import {
  createDictionaryDetail,
  deleteDictionaryDetail,
  getDictionaryByCode,
  getDictionaryList,
  updateDictionaryDetail,
} from '@/api/endpoints/dictionary.api';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import { useMsg } from '@/hooks';
import { DictionaryStore } from '@/stores/dictionary';

const { Text, Title } = Typography;

/** 预设颜色列表 */
const PRESET_COLORS = [
  '#1890ff', // 蓝色
  '#52c41a', // 绿色
  '#faad14', // 橙色
  '#f5222d', // 红色
  '#722ed1', // 紫色
  '#13c2c2', // 青色
  '#eb2f96', // 粉色
  '#fa8c16', // 金色
  '#a0d911', // 青柠
  '#2f54eb', // 极客蓝
];

/** 常用图标列表 */
const COMMON_ICONS = [
  'mdi:check-circle',
  'mdi:close-circle',
  'mdi:clock-outline',
  'mdi:alert-circle',
  'mdi:information',
  'mdi:star',
  'mdi:heart',
  'mdi:flag',
  'mdi:bookmark',
  'mdi:tag',
  'mdi:account',
  'mdi:cog',
];

/** 解析 extend JSON */
function parseExtend(extend?: string): { color?: string; icon?: string } {
  if (!extend)
    return {};
  try {
    return JSON.parse(extend);
  }
  catch {
    return {};
  }
}

/** 将 extend 对象转为 JSON 字符串 */
function stringifyExtend(obj: { color?: string; icon?: string }): string {
  const cleanObj: Record<string, string> = {};
  if (obj.color)
    cleanObj.color = obj.color;
  if (obj.icon)
    cleanObj.icon = obj.icon;
  return Object.keys(cleanObj).length > 0 ? JSON.stringify(cleanObj) : '';
}

/**
 * 字典项预览组件
 */
function DictItemPreview({
  label,
  extend,
}: {
  label: string;
  extend?: string;
}) {
  const { color, icon } = parseExtend(extend);
  return (
    <Tag color={color} className="inline-flex items-center gap-1">
      {icon && <CustomIcon icon={icon} width={14} />}
      {label}
    </Tag>
  );
}

/**
 * 字典数据管理页面
 */
export function DictionaryDataPage() {
  const { code } = useParams({ from: '/_dashboard/dictionaries/$code' });
  const queryClient = useQueryClient();
  const { msgSuccess, msgError } = useMsg();

  // 表单状态
  const [form] = Form.useForm();
  const [editingDetail, setEditingDetail] = useState<DictionaryDetail | null>(
    null,
  );
  const [extendColor, setExtendColor] = useState<string>('');
  const [extendIcon, setExtendIcon] = useState<string>('');

  // 获取字典列表（用于获取字典基本信息）
  const { data: listResponse } = useQuery({
    queryKey: ['dictionaries', code],
    queryFn: () => getDictionaryList(),
  });

  // const flattenDictionaries = (nodes: Dictionary[]): Dictionary[] => {
  //   const result: Dictionary[] = [];
  //   nodes.forEach((node) => {
  //     const { children, ...rest } = node;
  //     result.push({ ...rest });
  //     if (children?.length) {
  //       result.push(...flattenDictionaries(children));
  //     }
  //   });
  //   return result;
  // };

  // 从列表中查找当前字典
  const dictionary = useMemo(() => {
    if (!listResponse || !code)
      return null;
    return listResponse.data;
  }, [listResponse, code]);

  // 获取字典数据项
  const { data: dictResponse, isLoading } = useQuery({
    queryKey: ['dictionaries', 'code', code],
    queryFn: () => getDictionaryByCode(code),
    enabled: !!code,
  });

  const items = dictResponse?.data || [];

  // 创建字典数据 mutation
  const createMutation = useMutation({
    mutationFn: (params: Record<string, unknown>) => {
      if (!dictionary?.id) {
        return Promise.reject(new Error('字典不存在'));
      }
      return createDictionaryDetail(
        dictionary.id,
        params as Parameters<typeof createDictionaryDetail>[1],
      );
    },
    onSuccess: () => {
      msgSuccess('字典数据创建成功');
      queryClient.invalidateQueries({
        queryKey: ['dictionaries', 'code', code],
      });
      resetForm();
      // 刷新缓存
      DictionaryStore.getState().clear(code);
    },
    onError: (error: Error) => {
      msgError(`创建失败: ${error.message}`);
    },
  });

  // 更新字典数据 mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      params,
    }: {
      id: string;
      params: Record<string, unknown>;
    }) =>
      updateDictionaryDetail(
        id,
        params as Parameters<typeof updateDictionaryDetail>[1],
      ),
    onSuccess: () => {
      msgSuccess('字典数据更新成功');
      queryClient.invalidateQueries({
        queryKey: ['dictionaries', 'code', code],
      });
      resetForm();
      // 刷新缓存
      DictionaryStore.getState().clear(code);
    },
    onError: (error: Error) => {
      msgError(`更新失败: ${error.message}`);
    },
  });

  // 删除字典数据 mutation
  const deleteMutation = useMutation({
    mutationFn: deleteDictionaryDetail,
    onSuccess: () => {
      msgSuccess('字典数据删除成功');
      queryClient.invalidateQueries({
        queryKey: ['dictionaries', 'code', code],
      });
      // 刷新缓存
      DictionaryStore.getState().clear(code);
    },
    onError: (error: Error) => {
      msgError(`删除失败: ${error.message}`);
    },
  });

  // 重置表单
  const resetForm = () => {
    form.resetFields();
    setEditingDetail(null);
    setExtendColor('');
    setExtendIcon('');
  };

  // 提交表单
  const handleSubmit = (values: Record<string, unknown>) => {
    const extend = stringifyExtend({ color: extendColor, icon: extendIcon });
    const params = { ...values, extend };

    if (editingDetail) {
      updateMutation.mutate({ id: editingDetail.id, params });
    }
    else {
      createMutation.mutate(params);
    }
  };

  // 编辑数据项
  const handleEdit = (detail: DictionaryDetail) => {
    setEditingDetail(detail);
    form.setFieldsValue({
      label: detail.label,
      value: detail.value,
      sort: detail.sort ?? 0,
      status: detail.status ?? true,
    });
    const parsed = parseExtend(detail.extend);
    setExtendColor(parsed.color || '');
    setExtendIcon(parsed.icon || '');
  };

  const handleDelete = (detail: DictionaryDetail) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 "${detail.label}" 吗？`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutate(detail.id),
    });
  };

  // 处理颜色变化
  const handleColorChange = (color: Color) => {
    setExtendColor(color.toHexString());
  };

  // 表格列定义
  const columns = [
    {
      title: '预览',
      key: 'preview',
      width: 180,
      render: (_: unknown, detail: DictionaryDetail) => (
        <DictItemPreview label={detail.label} extend={detail.extend} />
      ),
    },
    {
      title: '展示名',
      dataIndex: 'label',
      key: 'label',
      width: 150,
    },
    {
      title: '字典值',
      dataIndex: 'value',
      key: 'value',
      width: 150,
      render: (value: string) => (
        <Tooltip title="点击复制">
          <Tag
            className="cursor-pointer"
            onClick={() => {
              navigator.clipboard.writeText(value);
              msgSuccess('已复制');
            }}
          >
            {value}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: '扩展配置',
      dataIndex: 'extend',
      key: 'extend',
      width: 150,
      render: (extend: string) => {
        const parsed = parseExtend(extend);
        if (!parsed.color && !parsed.icon)
          return <Text type="secondary">-</Text>;
        return (
          <Space size="small">
            {parsed.color && (
              <Tooltip title={parsed.color}>
                <div
                  className="w-5 h-5 rounded border border-gray-200"
                  style={{ backgroundColor: parsed.color }}
                />
              </Tooltip>
            )}
            {parsed.icon && (
              <Tooltip title={parsed.icon}>
                <CustomIcon icon={parsed.icon} width={18} />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 80,
      sorter: (a: DictionaryDetail, b: DictionaryDetail) =>
        (a.sort ?? 0) - (b.sort ?? 0),
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
      width: 140,
      render: (_: unknown, detail: DictionaryDetail) => {
        const actionItems: ActionItem<DictionaryDetail>[] = [
          {
            key: 'edit',
            label: '编辑',
            onClick: () => handleEdit(detail),
          },
          {
            key: 'delete',
            label: '删除',
            danger: true,
            disabled: deleteMutation.isPending,
            onClick: () => handleDelete(detail),
          },
        ];

        return (
          <RowActionBar
            items={actionItems}
            context={detail}
          />
        );
      },
    },
  ];

  return (
    <div>
      <div className="content-box-default">
        {/* 面包屑导航 */}
        <Breadcrumb
          className="mb-4"
          items={[
            { title: <Link to="/dictionaries">字典类型</Link> },
            { title: dictionary?.name || code },
          ]}
        />

        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Title level={4} className="!mb-0">
                {dictionary?.name || '加载中...'}
              </Title>
              <Tag color="blue">{code}</Tag>
            </div>
            <Text type="secondary">
              {dictionary?.description || '管理字典数据项'}
            </Text>
          </div>
          <Link to="/dictionaries">
            <Button icon={<CustomIcon icon="mdi:arrow-left" width={16} />}>
              返回列表
            </Button>
          </Link>
        </div>

        {/* 新建/编辑表单 */}
        <Card
          size="small"
          title={(
            <Space>
              <CustomIcon
                icon={editingDetail ? 'mdi:pencil' : 'mdi:plus'}
                width={16}
              />
              {editingDetail ? '编辑字典数据' : '新建字典数据'}
            </Space>
          )}
          className="mb-4"
          extra={
            editingDetail && (
              <Button size="small" onClick={resetForm}>
                取消编辑
              </Button>
            )
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ status: true, sort: 0 }}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item
                  name="label"
                  label="展示名"
                  rules={[{ required: true, message: '请输入展示名' }]}
                >
                  <Input placeholder="如：待处理、已完成" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="value"
                  label="字典值"
                  rules={[{ required: true, message: '请输入字典值' }]}
                >
                  <Input placeholder="如：pending、completed" />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item name="sort" label="排序">
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="0"
                  />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item name="status" label="状态" valuePropName="checked">
                  <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label=" ">
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={
                      createMutation.isPending || updateMutation.isPending
                    }
                  >
                    {editingDetail ? '更新' : '添加'}
                  </Button>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="标签颜色">
                  <Space>
                    <ColorPicker
                      value={extendColor || undefined}
                      onChange={handleColorChange}
                      presets={[{ label: '预设颜色', colors: PRESET_COLORS }]}
                      showText
                      allowClear
                      onClear={() => setExtendColor('')}
                    />
                    {(extendColor || extendIcon) && (
                      <DictItemPreview
                        label={form.getFieldValue('label') || '预览'}
                        extend={stringifyExtend({
                          color: extendColor,
                          icon: extendIcon,
                        })}
                      />
                    )}
                  </Space>
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item label="图标">
                  <Space wrap size="small">
                    <Input
                      placeholder="输入图标名，如：mdi:check-circle"
                      value={extendIcon}
                      onChange={e => setExtendIcon(e.target.value)}
                      style={{ width: 220 }}
                      allowClear
                      onClear={() => setExtendIcon('')}
                      suffix={
                        extendIcon && (
                          <CustomIcon
                            icon={extendIcon}
                            width={16}
                            style={{ color: extendColor || undefined }}
                          />
                        )
                      }
                    />
                    <div className="flex gap-1 flex-wrap">
                      {COMMON_ICONS.map(icon => (
                        <Tooltip key={icon} title={icon}>
                          <Button
                            size="small"
                            type={extendIcon === icon ? 'primary' : 'text'}
                            icon={<CustomIcon icon={icon} width={16} />}
                            onClick={() => setExtendIcon(icon)}
                          />
                        </Tooltip>
                      ))}
                    </div>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* 数据列表 */}
        <ProTable<DictionaryDetail, Record<string, never>>
          title={`字典数据 (${items.length})`}
          columns={columns}
          data={items}
          loading={isLoading}
          rowKey="id"
          pagination={false}
          tableProps={{ size: 'small' }}
        />
      </div>
    </div>
  );
}
