import type { TagProps } from 'antd';
import { Tag } from 'antd';
import CustomIcon from '@/components/CustomIcon/CustomIcon';

export interface DictionaryDisplay {
  label: string;
  value: string;
  extra?: {
    color?: string;
    icon?: string;
  };
}

export interface DictionaryTagProps extends Omit<TagProps, 'color'> {
  /** 后端返回的 display 数据 */
  display?: DictionaryDisplay;
  /** 原始值（display 不存在时显示） */
  fallback?: string;
}

/**
 * 字典标签组件 - 用于表格展示
 *
 * @example
 * ```tsx
 * // 表格列渲染
 * {
 *   title: '状态',
 *   dataIndex: 'status',
 *   render: (_, record) => (
 *     <DictionaryTag display={record.statusDisplay} fallback={record.status} />
 *   ),
 * }
 * ```
 */
export function DictionaryTag({ display, fallback, ...props }: DictionaryTagProps) {
  if (!display) {
    return <Tag {...props}>{fallback || '-'}</Tag>;
  }

  const { color, icon } = display.extra || {};

  return (
    <Tag color={color} className="inline-flex items-center gap-1" {...props}>
      {icon && <CustomIcon icon={icon} width={14} />}
      {display.label}
    </Tag>
  );
}
