import type { ApiError, ApiResponse, LoginData, LoginParams, User } from '@/api';
import { Result } from 'rusty-result-kit';
import { createStore } from 'zustand';
import { persist } from 'zustand/middleware';
import { getUserInfo, login, logout } from '@/api';
import { checkPlatformAdmin } from '@/utils';

export type DomainContextSource = 'explicit' | 'default' | 'fallback';

export interface DomainContext {
  type: string;
  key: string;
  id?: string;
  displayName?: string;
  source: DomainContextSource;
}

type DomainLike = Pick<DomainContext, 'type' | 'key'>;

function buildDomainContext(type: string, key: string, source: DomainContextSource, partial?: Partial<DomainContext>): DomainContext {
  return {
    type,
    key,
    source,
    ...partial,
  };
}

export function createPlatformDomainContext(source: DomainContextSource = 'fallback'): DomainContext {
  return buildDomainContext('platform', 'root', source, {
    id: 'platform:root',
    displayName: 'Platform Root',
  });
}

export function createTenantDomainContext(tenantId: string, source: DomainContextSource = 'fallback', displayName?: string): DomainContext {
  return buildDomainContext('tenant', tenantId, source, {
    id: tenantId,
    displayName,
  });
}

export function isTenantDomain(domain: DomainLike | null | undefined): boolean {
  return domain?.type === 'tenant' && Boolean(domain.key);
}

export function isPlatformDomain(domain: DomainLike | null | undefined): boolean {
  return domain?.type === 'platform' && domain?.key === 'root';
}

function sameDomain(left: DomainContext | null | undefined, right: DomainContext | null | undefined): boolean {
  if (!left && !right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  return left.type === right.type && left.key === right.key;
}

function resolveDomainAfterUserLoaded(user: User, previous: DomainContext | null): DomainContext | null {
  const isPlatformAdmin = checkPlatformAdmin(user);

  if (isPlatformAdmin) {
    if (previous && previous.type !== 'platform') {
      return previous;
    }
    return createPlatformDomainContext(previous?.source || 'fallback');
  }

  if (previous && previous.type !== 'platform') {
    return previous;
  }

  return null;
}

export function migratePersistedAuthState(persistedState: unknown): Record<string, unknown> {
  const state = (persistedState || {}) as Record<string, unknown>;

  if (!state.selectedProjectId && typeof state.currentProjectId === 'string') {
    state.selectedProjectId = state.currentProjectId;
  }

  const storedDomain = state.actingDomain as DomainContext | undefined;
  if (!storedDomain || !storedDomain.type || !storedDomain.key) {
    state.actingDomain = null;
  }

  delete state.currentTenantId;
  delete state.selectedTenantId;
  delete state.currentProjectId;

  return state;
}

export interface ThemeConfig {
  primaryColor: string;
  isDarkMode: boolean;
  tempPrimaryColor: string | null;
}

export interface ImpersonationSession {
  token: string;
  targetTenantId: string;
  expiresAt: string;
  reason?: string;
  durationMinutes?: number;
  sourceDomainType: string;
  sourceDomainKey: string;
  startedAt: string;
}

export interface StartImpersonationInput {
  token: string;
  targetTenantId: string;
  expiresAt: string;
  reason?: string;
  durationMinutes?: number;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  actingDomain: DomainContext | null;
  selectedProjectId: string | null;
  impersonation: ImpersonationSession | null;
  theme: ThemeConfig;
}

interface CheckResult {
  ok: boolean;
  user: User | null;
  error: ApiError | null;
}

export interface AuthActions {
  login: (data: LoginParams) => Promise<Result<ApiResponse<LoginData>, ApiError>>;
  logout: () => void;
  check: () => Promise<CheckResult>;
  setUser: (user: User) => void;
  updateAccessToken: (token: string) => void;
  updateRefreshToken: (token: string) => void;
  setActingDomain: (domain: DomainContext | null) => void;
  setSelectedProjectId: (projectId: string | null) => void;
  isPlatformScope: () => boolean;
  startImpersonation: (input: StartImpersonationInput) => void;
  stopImpersonation: () => void;
  getImpersonationSession: () => ImpersonationSession | null;
  isImpersonationActive: () => boolean;
  setPrimaryColor: (color: string) => void;
  setTempPrimaryColor: (color: string | null) => void;
  setDarkMode: (isDark: boolean) => void;
  toggleDarkMode: () => void;
  requestUserInfo: () => Promise<Result<ApiResponse<User>, ApiError>>;
}

/**
 * 认证状态管理 Store
 * 使用 zustand + persist 持久化到 localStorage
 *
 * Web 鉴权模式：
 * - accessToken: 用于 API 请求认证（短时有效）
 * - refreshToken: 兼容字段（Web 场景通常由 HttpOnly Cookie 承载）
 */
export const AuthStore = createStore<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      actingDomain: null,
      selectedProjectId: null,
      impersonation: null,
      theme: {
        primaryColor: '#1677ff', // Ant Design 默认主色
        isDarkMode: false,
        tempPrimaryColor: null,
      },

      check: async () => {
        if (!get().accessToken) {
          return {
            ok: false,
            user: null,
            error: null,
          };
        }
        if (!get().user) {
          const { ok, value, error } = await get().requestUserInfo();
          if (ok) {
            return {
              ok: true,
              user: value?.data as User,
              error: null,
            };
          }
          return {
            ok: false,
            user: null,
            error: error as ApiError,
          };
        }
        return {
          ok: true,
          user: get().user,
          error: null,
        };
      },

      login: async (data: LoginParams) => {
        const result = await Result.fromPromise(login(data));
        const { ok, value } = result;
        if (ok && value?.data) {
          const { accessToken, refreshToken, user } = value.data;

          set({
            user,
            accessToken,
            refreshToken: refreshToken ?? null,
            actingDomain: resolveDomainAfterUserLoaded(user, get().actingDomain),
            selectedProjectId: null,
            impersonation: null,
          });
        }
        return result;
      },

      logout: () => {
        // 调用后端登出接口（将 Token 加入黑名单）
        logout().catch(() => {
          // 忽略登出失败的错误
        });

        // 清除 store 状态
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          actingDomain: null,
          selectedProjectId: null,
          impersonation: null,
        });
      },

      setUser: (user: User) => {
        const nextDomain = resolveDomainAfterUserLoaded(user, get().actingDomain);
        const shouldResetProject = !sameDomain(get().actingDomain, nextDomain);
        set({
          user,
          actingDomain: nextDomain,
          selectedProjectId: shouldResetProject ? null : get().selectedProjectId,
        });
      },

      requestUserInfo: async () => {
        const result = await Result.fromPromise(getUserInfo());
        const { ok, value } = result;
        if (ok && value?.data) {
          const nextDomain = resolveDomainAfterUserLoaded(value.data, get().actingDomain);
          const shouldResetProject = !sameDomain(get().actingDomain, nextDomain);
          set({
            user: value.data,
            actingDomain: nextDomain,
            selectedProjectId: shouldResetProject ? null : get().selectedProjectId,
          });
        }
        return result;
      },

      updateAccessToken: (token: string) => {
        set({ accessToken: token });
      },

      updateRefreshToken: (token: string) => {
        set({ refreshToken: token });
      },

      setActingDomain: (domain: DomainContext | null) => {
        const current = get().actingDomain;
        const shouldResetProject = !sameDomain(current, domain);
        set({
          actingDomain: domain,
          selectedProjectId: shouldResetProject ? null : get().selectedProjectId,
        });
      },

      setSelectedProjectId: (projectId: string | null) => {
        set({ selectedProjectId: projectId });
      },

      isPlatformScope: () => {
        const state = get();
        return isPlatformDomain(state.actingDomain) && checkPlatformAdmin(state.user);
      },

      startImpersonation: (input: StartImpersonationInput) => {
        const actingDomain = get().actingDomain;
        const sourceDomainType = actingDomain?.type || 'platform';
        const sourceDomainKey = actingDomain?.key || 'root';

        set({
          impersonation: {
            ...input,
            sourceDomainType,
            sourceDomainKey,
            startedAt: new Date().toISOString(),
          },
        });
      },

      stopImpersonation: () => {
        set({ impersonation: null });
      },

      getImpersonationSession: () => {
        const session = get().impersonation;
        if (!session) {
          return null;
        }

        const expiresAt = Date.parse(session.expiresAt);
        if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
          set({ impersonation: null });
          return null;
        }

        return session;
      },

      isImpersonationActive: () => {
        return Boolean(get().getImpersonationSession());
      },

      setPrimaryColor: (color: string) => {
        set({
          theme: {
            ...get().theme,
            primaryColor: color,
          },
        });
      },

      setTempPrimaryColor: (color: string | null) => {
        set({
          theme: {
            ...get().theme,
            tempPrimaryColor: color,
          },
        });
      },

      setDarkMode: (isDark: boolean) => {
        set({
          theme: {
            ...get().theme,
            isDarkMode: isDark,
          },
        });
      },

      toggleDarkMode: () => {
        set({
          theme: {
            ...get().theme,
            isDarkMode: !get().theme.isDarkMode,
          },
        });
      },
    }),
    {
      name: 'auth-storage',
      version: 3,
      migrate: (persistedState: unknown, _version: number) => {
        return migratePersistedAuthState(persistedState);
      },
      partialize: state => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        actingDomain: state.actingDomain,
        selectedProjectId: state.selectedProjectId,
        impersonation: state.impersonation,
        theme: {
          primaryColor: state.theme.primaryColor,
          isDarkMode: state.theme.isDarkMode,
          tempPrimaryColor: state.theme.tempPrimaryColor,
        },
      }),
    },
  ),
);
