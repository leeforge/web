/**
 * 数据解包插件
 * 自动提取响应中的 data 字段
 */
import type { HookFetchPlugin } from 'hook-fetch';
import type { ApiResponse } from '../types';

export const unwrapPlugin: HookFetchPlugin = {
  name: 'unwrap-plugin',
  priority: 60, // 在 error-plugin (50) 之后执行

  afterResponse: async (context) => {
    const result = context.result as ApiResponse;

    // 检查是否符合 ApiResponse 结构
    if (result && typeof result === 'object' && 'data' in result) {
      // 提取 data 字段作为最终结果
      context.result = result;
    }

    return context;
  },
};
