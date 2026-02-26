/* eslint-disable no-console */
/**
 * 日志拦截器
 * 仅在开发环境打印请求和响应日志
 */
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const isDev = import.meta.env.DEV;

/**
 * 设置日志拦截器
 */
export function setupLoggerInterceptor(instance: AxiosInstance): void {
  // 请求日志
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (!isDev) {
        return config;
      }

      console.group(`🚀 API Request: ${config.method?.toUpperCase() || 'GET'} ${config.url}`);
      console.log('URL:', config.url);
      console.log('Headers:', config.headers.toJSON ? config.headers.toJSON() : config.headers);
      if (config.data) {
        console.log('Body:', config.data);
      }
      if (config.params) {
        console.log('Params:', config.params);
      }
      console.groupEnd();

      return config;
    },
    (error) => {
      if (isDev) {
        console.error('🚀 API Request Error:', error);
      }
      return Promise.reject(error);
    },
  );

  // 响应日志
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      if (!isDev) {
        return response;
      }

      console.group(`✅ API Response: ${response.config.method?.toUpperCase() || 'GET'} ${response.config.url}`);
      console.log('Status:', response.status, response.statusText);
      console.log('Result:', response.data);
      console.groupEnd();

      return response;
    },
    (error: AxiosError) => {
      if (!isDev) {
        return Promise.reject(error);
      }

      console.group(`❌ API Error: ${error.config?.method?.toUpperCase() || 'GET'} ${error.config?.url}`);
      console.error('Error:', error.message);
      if (error.response) {
        console.log('Status:', error.response.status, error.response.statusText);
        console.log('Data:', error.response.data);
      }
      console.groupEnd();

      return Promise.reject(error);
    },
  );
}
