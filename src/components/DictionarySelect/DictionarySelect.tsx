import type { SelectProps } from 'antd';
import type { DictionaryDetail } from '@/api/endpoints/dictionary.api';
import { Select, Tag } from 'antd';
import { useMemo } from 'react';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import { useDictionary } from '@/stores/dictionary';

export interface DictionarySelectProps extends Omit<SelectProps, 'options' | 'loading'> {
  /** 字典编码 */
  code: string;
  /** 是否显示图标和颜色 */
  showExtra?: boolean;
}

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

/**
 * 字典选择器组件
 *
 * @example
 * ```tsx
 * <Form.Item name="status" label="状态">
 *   <DictionarySelect code="invitation_status" />
 * </Form.Item>
 * ```
 */
export function DictionarySelect({ code, showExtra = true, ...props }: DictionarySelectProps) {
  const { items, loading, toOptions } = useDictionary(code);

  // 转换为 Select 选项
  const options = useMemo(() => toOptions(), [toOptions]);

  // 自定义渲染选项（带颜色和图标）
  const optionRender = useMemo(() => {
    if (!showExtra || !items)
      return undefined;

    return (option: { value?: string | number | null }) => {
      const item = items.find((i: DictionaryDetail) => i.value === option.value);
      if (!item)
        return option.value;

      const { color, icon } = parseExtend(item.extend);

      return (
        <span className="inline-flex items-center gap-1">
          {icon && <CustomIcon icon={icon} width={14} style={{ color: color || undefined }} />}
          <span>{item.label}</span>
        </span>
      );
    };
  }, [showExtra, items]);

  // 自定义渲染已选标签（多选模式）
  const tagRender = useMemo(() => {
    if (!showExtra || !items)
      return undefined;

    return (tagProps: { value: string; label: React.ReactNode; closable: boolean; onClose: () => void }) => {
      const item = items.find((i: DictionaryDetail) => i.value === tagProps.value);
      const { color, icon } = parseExtend(item?.extend);

      return (
        <Tag
          color={color}
          closable={tagProps.closable}
          onClose={tagProps.onClose}
          className="inline-flex items-center gap-1"
        >
          {icon && <CustomIcon icon={icon} width={12} />}
          {tagProps.label}
        </Tag>
      );
    };
  }, [showExtra, items]);

  return (
    <Select
      loading={loading}
      options={options}
      optionRender={showExtra ? optionRender : undefined}
      tagRender={props.mode === 'multiple' || props.mode === 'tags' ? tagRender : undefined}
      {...props}
    />
  );
}
