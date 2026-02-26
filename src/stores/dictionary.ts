import type { ApiError } from '@/api';
import type { DictionaryDetail } from '@/api/endpoints/dictionary.api';
import { Result } from 'rusty-result-kit';
import { createStore } from 'zustand';
import { getDictionaryByCode } from '@/api/endpoints/dictionary.api';

/**
 * 字典状态管理 Store
 * 使用 object 结构存储不同字典的数据，通过 code 索引
 */

export interface DictionaryState {
  /** 字典数据缓存：{ [code]: DictionaryDetail[] } */
  dictionaries: Record<string, DictionaryDetail[]>;
  /** 加载状态：{ [code]: boolean } */
  loading: Record<string, boolean>;
  /** 错误状态：{ [code]: ApiError } */
  errors: Record<string, ApiError | null>;
}

export interface DictionaryActions {
  /** 获取字典数据（从缓存） */
  get: (code: string) => DictionaryDetail[] | undefined;
  /** 加载单个字典 */
  load: (code: string, force?: boolean) => Promise<DictionaryDetail[]>;
  /** 批量加载字典 */
  loadMany: (codes: string[], force?: boolean) => Promise<void>;
  /** 清除缓存 */
  clear: (code?: string) => void;
  /** 检查是否正在加载 */
  isLoading: (code: string) => boolean;
  /** 获取错误信息 */
  getError: (code: string) => ApiError | null;
}

export const DictionaryStore = createStore<DictionaryState & DictionaryActions>()(
  (set, get) => ({
    dictionaries: {},
    loading: {},
    errors: {},

    get: code => get().dictionaries[code],

    load: async (code, force = false) => {
      const state = get();

      // 如果已有缓存且不强制刷新，直接返回
      if (!force && state.dictionaries[code]) {
        return state.dictionaries[code];
      }

      // 如果正在加载，等待现有请求
      if (state.loading[code]) {
        return new Promise((resolve) => {
          const unsubscribe = DictionaryStore.subscribe((newState) => {
            if (!newState.loading[code]) {
              unsubscribe();
              resolve(newState.dictionaries[code] || []);
            }
          });
        });
      }

      // 设置加载状态
      set(state => ({
        loading: { ...state.loading, [code]: true },
        errors: { ...state.errors, [code]: null },
      }));

      const { ok, value, error } = await Result.fromPromise(getDictionaryByCode(code));

      if (ok && value?.data?.items) {
        const items = value.data.items;
        set(state => ({
          dictionaries: { ...state.dictionaries, [code]: items },
          loading: { ...state.loading, [code]: false },
        }));
        return items;
      }

      set(state => ({
        loading: { ...state.loading, [code]: false },
        errors: { ...state.errors, [code]: error as ApiError },
      }));
      return [];
    },

    loadMany: async (codes, force = false) => {
      const uniqueCodes = [...new Set(codes)];
      await Promise.all(uniqueCodes.map(code => get().load(code, force)));
    },

    clear: (code) => {
      if (code) {
        set((state) => {
          const { [code]: _dict, ...restDictionaries } = state.dictionaries;
          const { [code]: _err, ...restErrors } = state.errors;
          return {
            dictionaries: restDictionaries,
            errors: restErrors,
          };
        });
      }
      else {
        set({ dictionaries: {}, errors: {} });
      }
    },

    isLoading: code => get().loading[code] ?? false,

    getError: code => get().errors[code] ?? null,
  }),
);

/**
 * 工具函数：将字典项转换为 Select 选项格式
 */
export function toSelectOptions(items: DictionaryDetail[] | undefined) {
  if (!items)
    return [];
  return items.map(item => ({
    label: item.label,
    value: item.value,
  }));
}

/**
 * 工具函数：根据 value 获取对应的 label
 */
export function getLabelByValue(items: DictionaryDetail[] | undefined, value: string) {
  if (!items)
    return value;
  const item = items.find(i => i.value === value);
  return item?.label ?? value;
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
 * 工具函数：根据 value 获取完整的 Display 对象
 */
export function getDisplayByValue(items: DictionaryDetail[] | undefined, value: string) {
  if (!items)
    return undefined;
  const item = items.find(i => i.value === value);
  if (!item)
    return undefined;

  const extra = parseExtend(item.extend);
  return {
    label: item.label,
    value: item.value,
    extra: Object.keys(extra).length > 0 ? extra : undefined,
  };
}

/**
 * 自定义 Hook：使用字典数据
 */
export function useDictionary(code: string) {
  const store = DictionaryStore();

  // 自动加载
  if (!store.get(code) && !store.isLoading(code)) {
    store.load(code);
  }

  return {
    items: store.get(code),
    loading: store.isLoading(code),
    error: store.getError(code),
    reload: () => store.load(code, true),
    getLabel: (value: string) => getLabelByValue(store.get(code), value),
    getDisplay: (value: string) => getDisplayByValue(store.get(code), value),
    toOptions: () => toSelectOptions(store.get(code)),
  };
}
