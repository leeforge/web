import type { Menu } from '@/api/endpoints/menu.api';

export interface SiderMenuNode {
  key: string;
  path: string;
  title: string;
  icon?: string;
  children?: SiderMenuNode[];
}

export function normalizeMenuTreePayload(payload: unknown): Menu[] {
  if (Array.isArray(payload)) {
    return payload as Menu[];
  }
  if (
    payload
    && typeof payload === 'object'
    && Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: Menu[] }).data;
  }
  return [];
}

function normalizePath(path: string | undefined, fallback: string) {
  if (!path?.trim()) {
    return fallback;
  }
  return path.startsWith('/') ? path : `/${path}`;
}

function isPathMatch(menuPath: string, currentPath: string) {
  if (!menuPath.startsWith('/')) {
    return false;
  }
  if (menuPath === '/') {
    return currentPath === '/';
  }
  return currentPath === menuPath || currentPath.startsWith(`${menuPath}/`);
}

export function buildSiderMenuNodes(menus: Menu[]): SiderMenuNode[] {
  return [...menus]
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .filter(menu => !menu.hidden)
    .map((menu) => {
      const key = normalizePath(menu.path, menu.id);
      const children = menu.children?.length ? buildSiderMenuNodes(menu.children) : undefined;
      return {
        key,
        path: key,
        title: menu.name,
        icon: menu.icon,
        children: children?.length ? children : undefined,
      };
    });
}

type MatchResult = {
  key: string;
  openKeys: string[];
  score: number;
};

function findBestMatch(
  nodes: SiderMenuNode[],
  currentPath: string,
  parentKeys: string[] = [],
): MatchResult | null {
  let best: MatchResult | null = null;

  for (const node of nodes) {
    const nextParents = [...parentKeys, node.key];
    const selfMatched = isPathMatch(node.path, currentPath)
      ? { key: node.key, openKeys: parentKeys, score: node.path.length }
      : null;

    const childMatched = node.children?.length
      ? findBestMatch(node.children, currentPath, nextParents)
      : null;

    for (const candidate of [selfMatched, childMatched]) {
      if (!candidate) {
        continue;
      }
      if (!best || candidate.score > best.score) {
        best = candidate;
      }
    }
  }

  return best;
}

export function resolveSiderState(nodes: SiderMenuNode[], currentPath: string) {
  const matched = findBestMatch(nodes, currentPath);
  if (matched) {
    return {
      selectedKeys: [matched.key],
      openKeys: matched.openKeys,
    };
  }

  const hasHome = nodes.some(node => node.key === '/');
  return {
    selectedKeys: hasHome ? ['/'] : [],
    openKeys: [],
  };
}
