import type { PermissionListResponse } from '@/api/endpoints/permission.api';
import type { Role, SetRoleAPIsParams } from '@/api/endpoints/role.api';

export interface PermissionBindingOption {
  label: string;
  value: string;
}

export interface PermissionTreeNode {
  key: string;
  title: string;
  selectable?: boolean;
  children?: PermissionTreeNode[];
}

interface MutablePermissionTreeNode extends PermissionTreeNode {
  children: MutablePermissionTreeNode[];
  childMap: Map<string, MutablePermissionTreeNode>;
}

type PermissionLike = Record<string, unknown> | string | number | boolean;
const PERMISSION_HIERARCHY_SEPARATOR = /[:./]+/;

function extractPermissionArray(input: PermissionListResponse | undefined): PermissionLike[] {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input as PermissionLike[];
  }

  const record = input as Record<string, unknown>;
  if (Array.isArray(record.permissions)) {
    return record.permissions as PermissionLike[];
  }
  if (Array.isArray(record.items)) {
    return record.items as PermissionLike[];
  }
  if (Array.isArray(record.list)) {
    return record.list as PermissionLike[];
  }
  if (Array.isArray(record.data)) {
    return record.data as PermissionLike[];
  }

  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>;
    if (Array.isArray(nested.permissions)) {
      return nested.permissions as PermissionLike[];
    }
    if (Array.isArray(nested.items)) {
      return nested.items as PermissionLike[];
    }
    if (Array.isArray(nested.list)) {
      return nested.list as PermissionLike[];
    }
  }

  return [];
}

function toOption(item: PermissionLike): PermissionBindingOption | null {
  if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
    const value = String(item).trim();
    return value ? { label: value, value } : null;
  }

  if (!item || typeof item !== 'object') {
    return null;
  }

  const record = item as Record<string, unknown>;
  const rawValue = record.code ?? record.permission ?? record.value ?? record.key ?? record.name;
  if (rawValue === undefined || rawValue === null) {
    return null;
  }

  const value = String(rawValue).trim();
  if (!value) {
    return null;
  }

  const name = record.name ? String(record.name).trim() : '';
  const description = record.description ? String(record.description).trim() : '';
  const label = name || (description ? `${value} - ${description}` : value);

  return { label, value };
}

function collectPermissionOptions(item: PermissionLike, bucket: PermissionBindingOption[]) {
  const option = toOption(item);
  if (option) {
    bucket.push(option);
  }

  if (!item || typeof item !== 'object') {
    return;
  }

  const record = item as Record<string, unknown>;
  if (!Array.isArray(record.children)) {
    return;
  }

  for (const child of record.children as PermissionLike[]) {
    collectPermissionOptions(child, bucket);
  }
}

export function normalizePermissionBindingOptions(input: PermissionListResponse | undefined): PermissionBindingOption[] {
  const options: PermissionBindingOption[] = [];
  extractPermissionArray(input).forEach(item => collectPermissionOptions(item, options));

  const map = new Map<string, PermissionBindingOption>();
  options.forEach((option) => {
    if (!map.has(option.value)) {
      map.set(option.value, option);
    }
  });
  return Array.from(map.values());
}

export function extractRolePermissionCodes(role?: Pick<Role, 'permissions'> | null): string[] {
  const values = role?.permissions || [];
  return Array.from(new Set(values.map(item => String(item).trim()).filter(Boolean)));
}

export function buildSetRolePermissionsPayload(permissionCodes: string[]): SetRoleAPIsParams {
  return {
    permissionCodes: Array.from(new Set(permissionCodes.map(item => item.trim()).filter(Boolean))),
  };
}

function getGroupSegments(permissionCode: string): string[] {
  const segments = permissionCode
    .split(PERMISSION_HIERARCHY_SEPARATOR)
    .map(segment => segment.trim())
    .filter(Boolean);

  if (segments.length <= 1) {
    return [];
  }

  return segments.slice(0, -1);
}

function createGroupNode(path: string, segment: string): MutablePermissionTreeNode {
  return {
    key: `group:${path}`,
    title: segment,
    selectable: false,
    children: [],
    childMap: new Map(),
  };
}

function createLeafNode(option: PermissionBindingOption): MutablePermissionTreeNode {
  return {
    key: option.value,
    title: option.label,
    children: [],
    childMap: new Map(),
  };
}

function toTreeNode(node: MutablePermissionTreeNode): PermissionTreeNode {
  return {
    key: node.key,
    title: node.title,
    ...(node.selectable === false ? { selectable: false } : {}),
    ...(node.children.length > 0
      ? {
          children: node.children.map(toTreeNode),
        }
      : {}),
  };
}

export function toPermissionTreeData(input: PermissionListResponse | undefined): PermissionTreeNode[] {
  const roots: MutablePermissionTreeNode[] = [];
  const rootMap = new Map<string, MutablePermissionTreeNode>();
  const options = normalizePermissionBindingOptions(input);

  for (const option of options) {
    const groupSegments = getGroupSegments(option.value);
    let children = roots;
    let childMap = rootMap;
    let path = '';

    for (const segment of groupSegments) {
      path = path ? `${path}.${segment}` : segment;
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
    if (childMap.has(leafMapKey)) {
      continue;
    }
    const leafNode = createLeafNode(option);
    children.push(leafNode);
    childMap.set(leafMapKey, leafNode);
  }

  return roots.map(toTreeNode);
}
