import type { ApiError, ApiResponse, InitializeParams, InitializeStatusDTO } from '@/api';
import Result from 'rusty-result-kit';
import { createStore } from 'zustand';
import { persist } from 'zustand/middleware';
import { checkInitStatus, initialize } from '@/api';

interface CheckResult {
  ok: boolean;
  data?: InitializeStatusDTO;
  error?: ApiError;
}

export interface InitState {
  initialized?: boolean;
}

export interface InitActions {
  check: () => Promise<CheckResult>;
  init: (params: InitializeParams) => Promise<Result<ApiResponse<void>, ApiError>>;
}

/**
 * 初始化状态
 */
export const InitStore = createStore<InitState & InitActions>()(
  persist(
    (set, get) => ({
      initialized: void 0,
      check: async () => {
        const flag = get().initialized;
        if (typeof flag === 'boolean') {
          return {
            ok: flag,
          };
        }
        const { ok, value, error } = await Result.fromPromise(checkInitStatus());
        if (ok) {
          if (value?.data.initialized) {
            set({ initialized: true });
            return { ok: true, data: value.data };
          }
          set({ initialized: false });
          return { ok: false, value };
        }
        return { ok: false, error };
      },
      init: async (params: InitializeParams) => {
        const res = await Result.fromPromise<ApiResponse<void>, ApiError>(initialize(params));
        const { ok } = res;
        if (ok) {
          set({ initialized: true });
        }
        return res;
      },
    }),
    {
      name: 'auth-storage',
      partialize: state => ({
        initialized: state.initialized,
      }),
    },
  ),
);
