/* eslint-disable no-console */
/**
 * 日志插件
 * 仅在开发环境打印请求和响应日志
 */
import type { HookFetchPlugin } from 'hook-fetch';

const isDev = import.meta.env.DEV;

export const loggerPlugin: HookFetchPlugin = {
  name: 'logger-plugin',
  priority: 0, // 最低优先级，最后执行

  beforeRequest: async (context) => {
    if (!isDev)
      return context;

    console.group(`🚀 API Request: ${context.method || 'GET'} ${context.url}`);
    console.log('URL:', context.url);
    console.log('Headers:', context.headers);
    if (context.data) {
      console.log('Body:', context.data);
    }
    if (context.params) {
      console.log('Params:', context.params);
    }
    console.groupEnd();

    return context;
  },

  afterResponse: async (context) => {
    if (!isDev)
      return context;

    const { response } = context;
    // const contentType = response.headers.get('content-type');

    console.group(`✅ API Response: ${context.config.method || 'GET'} ${context.config.url}`);
    console.log('Status:', response.status, response.statusText);

    if (context.result) {
      console.log('Result:', context.result);
    }

    console.groupEnd();

    return context;
  },

  onError: async (error, config) => {
    if (!isDev)
      return error;

    console.group(`❌ API Error: ${config.method || 'GET'} ${config.url}`);
    console.error('Error:', error);
    console.groupEnd();

    return error;
  },
};
