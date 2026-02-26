import type { FieldOption, WidgetProps } from '@leeforge/react-ui';
import type { PermissionListResponse } from '@/api/endpoints/permission.api';
import { useQuery } from '@tanstack/react-query';
import { Button, Space, TreeSelect } from 'antd';
import { useMemo } from 'react';
import { getPermissionList } from '@/api/endpoints/permission.api';

const GROUP_NODE_PREFIX = '__permission_group__:';
const HIERARCHY_SEPARATOR = /[:./]+/;

interface PermissionOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface PermissionTreeNode {
  key: string;
  value: string;
  title: string;
  searchText: string;
  disabled?: boolean;
  selectable?: boolean;
  disableCheckbox?: boolean;
  children?: PermissionTreeNode[];
}

interface MutableTreeNode extends PermissionTreeNode {
  children: MutableTreeNode[];
  childMap: Map<string, MutableTreeNode>;
}

function extractPermissionArray(input: PermissionListResponse | undefined): unknown[] {
  if (!input)
    return [];

  if (Array.isArray(input))
    return input;

  const record = input as Record<string, unknown>;

  if (Array.isArray(record.permissions))
    return record.permissions;

  if (Array.isArray(record.items))
    return record.items;

  if (Array.isArray(record.list))
    return record.list;

  if (Array.isArray(record.data))
    return record.data;

  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>;
    if (Array.isArray(nested.permissions))
      return nested.permissions;
    if (Array.isArray(nested.items))
      return nested.items;
    if (Array.isArray(nested.list))
      return nested.list;
  }

  return [];
}

function normalizeStringValue(input: unknown): string | null {
  if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
    const value = String(input).trim();
    return value || null;
  }

  if (!input || typeof input !== 'object')
    return null;

  const record = input as Record<string, unknown>;
  const rawValue = record.value ?? record.key;

  if (rawValue === undefined || rawValue === null)
    return null;

  const value = String(rawValue).trim();
  return value || null;
}

function optionFromItem(item: unknown): PermissionOption | null {
  const primitiveValue = normalizeStringValue(item);
  if (primitiveValue && (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'))
    return { label: primitiveValue, value: primitiveValue };

  if (!item || typeof item !== 'object')
    return null;

  const record = item as Record<string, unknown>;
  const rawValue = record.code ?? record.value ?? record.key ?? record.id ?? record.permission ?? record.name;
  if (rawValue === undefined || rawValue === null)
    return null;

  const value = String(rawValue).trim();
  if (!value)
    return null;

  const rawLabel = record.label ?? record.name ?? record.title ?? value;
  const label = String(rawLabel).trim() || value;
  const description = record.description ? String(record.description).trim() : '';
  const labelText = description ? `${label} - ${description}` : label;

  return { label: labelText, value };
}

function collectPermissionOptions(item: unknown, bucket: PermissionOption[]) {
  const option = optionFromItem(item);
  if (option)
    bucket.push(option);

  if (!item || typeof item !== 'object')
    return;

  const record = item as Record<string, unknown>;
  if (!Array.isArray(record.children))
    return;

  for (const child of record.children)
    collectPermissionOptions(child, bucket);
}

function dedupeOptions(options: PermissionOption[]): PermissionOption[] {
  const map = new Map<string, PermissionOption>();
  for (const option of options) {
    if (!map.has(option.value))
      map.set(option.value, option);
  }
  return Array.from(map.values());
}

function normalizePermissionOptions(input: PermissionListResponse | undefined): PermissionOption[] {
  const list = extractPermissionArray(input);
  const options: PermissionOption[] = [];
  for (const item of list)
    collectPermissionOptions(item, options);
  return dedupeOptions(options);
}

function normalizeUiOptions(options: FieldOption[] | undefined): PermissionOption[] {
  if (!options?.length)
    return [];

  return options
    .map((option) => {
      const value = String(option.value).trim();
      if (!value)
        return null;
      const label = String(option.label ?? value).trim() || value;
      return {
        value,
        label,
        disabled: option.disabled,
      } as PermissionOption;
    })
    .filter(Boolean) as PermissionOption[];
}

function normalizeSelectedValues(value: unknown): string[] {
  if (!Array.isArray(value))
    return [];

  const values = value
    .map(item => normalizeStringValue(item))
    .filter(Boolean) as string[];

  return Array.from(new Set(values));
}

function mergeSelectedOptions(options: PermissionOption[], value: unknown): PermissionOption[] {
  const map = new Map(options.map(option => [option.value, option]));
  const selectedValues = normalizeSelectedValues(value);

  for (const item of selectedValues) {
    if (!map.has(item)) {
      map.set(item, { label: item, value: item });
    }
  }

  return Array.from(map.values());
}

function getGroupSegments(permissionValue: string): string[] {
  const segments = permissionValue
    .split(HIERARCHY_SEPARATOR)
    .map(segment => segment.trim())
    .filter(Boolean);

  if (segments.length <= 1)
    return [];

  return segments.slice(0, -1);
}

function createGroupNode(path: string, segment: string): MutableTreeNode {
  const groupValue = `${GROUP_NODE_PREFIX}${path}`;

  return {
    key: groupValue,
    value: groupValue,
    title: segment,
    searchText: `${path} ${segment}`.toLowerCase(),
    selectable: false,
    children: [],
    childMap: new Map(),
  };
}

function createLeafNode(option: PermissionOption): MutableTreeNode {
  return {
    key: option.value,
    value: option.value,
    title: option.label,
    searchText: `${option.label} ${option.value}`.toLowerCase(),
    disabled: option.disabled,
    children: [],
    childMap: new Map(),
  };
}

function toTreeNode(node: MutableTreeNode): PermissionTreeNode {
  const nextNode: PermissionTreeNode = {
    key: node.key,
    value: node.value,
    title: node.title,
    searchText: node.searchText,
  };

  if (node.disabled)
    nextNode.disabled = true;
  if (node.selectable === false)
    nextNode.selectable = false;
  if (node.disableCheckbox)
    nextNode.disableCheckbox = true;
  if (node.children.length > 0)
    nextNode.children = node.children.map(toTreeNode);

  return nextNode;
}

function buildPermissionTree(options: PermissionOption[]): PermissionTreeNode[] {
  const roots: MutableTreeNode[] = [];
  const rootMap = new Map<string, MutableTreeNode>();

  for (const option of options) {
    const segments = getGroupSegments(option.value);
    let children = roots;
    let childMap = rootMap;
    let path = '';

    for (const segment of segments) {
      path = path ? `${path}:${segment}` : segment;
      const groupMapKey = `group:${path}`;
      let groupNode = childMap.get(groupMapKey);

      if (!groupNode) {
        groupNode = createGroupNode(path, segment);
        children.push(groupNode);
        childMap.set(groupMapKey, groupNode);
      }

      children = groupNode.children;
      childMap = groupNode.childMap;
    }

    const leafMapKey = `leaf:${option.value}`;
    if (childMap.has(leafMapKey))
      continue;

    const leafNode = createLeafNode(option);
    children.push(leafNode);
    childMap.set(leafMapKey, leafNode);
  }

  return roots.map(toTreeNode);
}

function normalizeTreeSelectValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    const list = value
      .map(item => normalizeStringValue(item))
      .filter(Boolean) as string[];
    return Array.from(new Set(list));
  }

  const singleValue = normalizeStringValue(value);
  return singleValue ? [singleValue] : [];
}

function handleActionMouseDown(event: React.MouseEvent<HTMLElement>) {
  event.preventDefault();
  event.stopPropagation();
}

export function PermissionSelectWidget({
  ui,
  value,
  onChange,
  onBlur,
  disabled,
  size,
  hasError,
}: WidgetProps<string[]>) {
  const shouldFetch = !ui.options || ui.options.length === 0;
  const permissionsQuery = useQuery({
    queryKey: ['permissions', 'list'],
    queryFn: () => getPermissionList(),
    enabled: shouldFetch,
    retry: false,
  });

  const baseOptions = useMemo(() => {
    const uiOptions = normalizeUiOptions(ui.options);
    if (uiOptions.length > 0)
      return uiOptions;
    return normalizePermissionOptions(permissionsQuery.data?.data);
  }, [ui.options, permissionsQuery.data?.data]);

  const selectedValues = useMemo(() => normalizeSelectedValues(value), [value]);
  const options = useMemo(() => mergeSelectedOptions(baseOptions, value), [baseOptions, value]);
  const treeData = useMemo(() => buildPermissionTree(options), [options]);
  const allSelectableValues = useMemo(
    () => options.filter(option => !option.disabled).map(option => option.value),
    [options],
  );
  const disabledOptionValueSet = useMemo(
    () => new Set(options.filter(option => option.disabled).map(option => option.value)),
    [options],
  );
  const selectedValueSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const isAllSelected = useMemo(
    () => allSelectableValues.length > 0 && allSelectableValues.every(item => selectedValueSet.has(item)),
    [allSelectableValues, selectedValueSet],
  );
  const loading = shouldFetch && permissionsQuery.isLoading;
  const placeholder = ui.placeholder
    ?? (permissionsQuery.isError
      ? '权限加载失败，请稍后重试'
      : loading
        ? '正在加载权限...'
        : '请选择权限');
  const notFoundContent = permissionsQuery.isError ? '权限加载失败' : '暂无可选权限';

  return (
    <TreeSelect
      value={selectedValues}
      onChange={nextValue => onChange(normalizeTreeSelectValue(nextValue))}
      onBlur={() => onBlur()}
      disabled={disabled}
      size={size}
      placeholder={placeholder}
      showSearch={ui.showSearch ?? true}
      allowClear={ui.allowClear ?? true}
      treeData={treeData}
      treeCheckable
      treeDefaultExpandAll
      showCheckedStrategy={TreeSelect.SHOW_CHILD}
      treeNodeFilterProp="searchText"
      filterTreeNode={(input, node) => {
        const keyword = input.trim().toLowerCase();
        if (!keyword)
          return true;

        const searchText = typeof node.searchText === 'string'
          ? node.searchText
          : `${String(node.title ?? '')} ${String(node.value ?? '')}`;

        return searchText.toLowerCase().includes(keyword);
      }}
      loading={loading}
      maxTagCount="responsive"
      notFoundContent={notFoundContent}
      popupRender={menu => (
        <div>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(5, 5, 5, 0.06)' }}>
            <Space size={8}>
              <Button
                type="link"
                size="small"
                disabled={allSelectableValues.length === 0 || isAllSelected}
                onMouseDown={handleActionMouseDown}
                onClick={() => {
                  const disabledSelectedValues = selectedValues.filter(item => disabledOptionValueSet.has(item));
                  onChange(Array.from(new Set([...allSelectableValues, ...disabledSelectedValues])));
                }}
              >
                全选
              </Button>
              <Button
                type="link"
                size="small"
                disabled={selectedValues.length === 0}
                onMouseDown={handleActionMouseDown}
                onClick={() => onChange([])}
              >
                清空
              </Button>
            </Space>
          </div>
          {menu}
        </div>
      )}
      status={hasError ? 'error' : undefined}
    />
  );
}
