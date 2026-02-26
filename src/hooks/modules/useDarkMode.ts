import { useStore } from 'zustand';
import { AuthStore } from '@/stores';

/**
 * 暗色/亮色模式切换 Hook
 *
 * 功能：
 * 1. 读取/设置暗色模式状态
 * 2. 切换暗色/亮色模式
 * 3. data-theme 属性由 main.tsx 中的 ThemeSynchronizer 管理
 * 4. 同步到 Zustand store 持久化
 *
 * 图标库：
 * - @iconify-json/line-md: line-md 图标集
 * - @iconify-json/material-symbols: material-symbols 图标集
 * - @iconify-json/vscode-icons: vscode-icons 图标集
 *
 * @example
 * ```tsx
 * const { isDarkMode, toggleDarkMode } = useDarkMode()
 * ```
 */
export function useDarkMode() {
  const isDarkMode = useStore(AuthStore, state => state.theme.isDarkMode);
  const setDarkMode = useStore(AuthStore, state => state.setDarkMode);
  const toggleDarkMode = useStore(AuthStore, state => state.toggleDarkMode);

  return {
    isDarkMode,
    setDarkMode,
    toggleDarkMode,
  };
}
