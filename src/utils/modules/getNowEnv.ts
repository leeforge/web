/**
 * @description 描述 当前环境变量
 * @date 2026-01-23 09:46:39
 * @author tingfeng
 *
 * @export
 * @returns
 */
export function getEnvData(): ImportMetaEnv {
  const { PROD, VITE_APP_ENV_FROM_CONFIG } = import.meta.env;

  if (PROD && VITE_APP_ENV_FROM_CONFIG === 'true') {
    const AppWindow = window as any;
    return {
      ...import.meta.env,
      ...AppWindow.__VITE_APP_CONFIG__,
    };
  }
  return {
    ...import.meta.env,
  };
}
