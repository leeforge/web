import type { GlobalToken, ThemeConfig } from 'antd';
import { theme } from 'antd';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useStore } from 'zustand';
import { AuthStore } from '@/stores';
import { toRgbVar } from '@/utils';

const STYLE_ID = 'dynamic-antd-theme-vars';

const COLOR_KEYS = [
  'colorBgContainer',
  'colorTextBase',
  'colorError',
  'colorSuccess',
  'colorWarning',
  'colorInfo',
  'colorPrimary',
] as const;

/**
 * 获取或创建专门用于存放 CSS 变量的 Style 标签
 */
function getStyleTag(): HTMLStyleElement {
  let styleTag = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = STYLE_ID;
    document.head.appendChild(styleTag);
  }
  return styleTag;
}

/**
 * 核心逻辑：生成 CSS 变量字符串并写入 DOM
 */
function updateCSSVariables(token: GlobalToken, primaryColorOverride?: string) {
  const variables: string[] = [];

  COLOR_KEYS.forEach((key) => {
    let colorVal = token[key as keyof GlobalToken] as string;

    if (key === 'colorPrimary' && primaryColorOverride) {
      colorVal = primaryColorOverride;
    }

    if (!colorVal)
      return;

    variables.push(`--${key}: ${colorVal};`);
    variables.push(`--${key}-value: ${toRgbVar(colorVal)};`);
  });

  const cssContent = `:root {\n${variables.join('\n')}\n}`;

  const styleTag = getStyleTag();
  if (styleTag.textContent !== cssContent) {
    styleTag.textContent = cssContent;
  }
}

export function useThemeColor() {
  const themeConfig = useStore(AuthStore, s => s.theme);
  const setStorePrimaryColor = useStore(AuthStore, s => s.setPrimaryColor);
  const setStoreTempPrimaryColor = useStore(AuthStore, s => s.setTempPrimaryColor);

  // 缓存引用
  const prevPrimaryColorRef = useRef<string>('');
  const prevIsDarkModeRef = useRef<boolean>(false);

  // 计算当前生效的颜色：优先使用临时颜色，其次是持久化颜色
  const activePrimaryColor = themeConfig.tempPrimaryColor || themeConfig.primaryColor || '#1677ff';

  const derivedToken = useMemo(() => (
    theme.getDesignToken({
      token: {
        colorPrimary: activePrimaryColor,
      },
      algorithm: themeConfig.isDarkMode
        ? theme.darkAlgorithm
        : theme.defaultAlgorithm,
    })
  ), [activePrimaryColor, themeConfig.isDarkMode]);

  const antdThemeConfig: ThemeConfig = useMemo((): ThemeConfig => ({
    token: {
      colorPrimary: activePrimaryColor,
    },
    components: {
      Layout: {
        headerBg: derivedToken.colorBgContainer,
        triggerBg: derivedToken.colorBgContainer,
      },
    },
  }), [activePrimaryColor, derivedToken.colorBgContainer]);

  /**
   * 监听颜色变化并更新 CSS 变量
   */
  useLayoutEffect(() => {
    const needsUpdate = prevPrimaryColorRef.current !== activePrimaryColor
      || prevIsDarkModeRef.current !== themeConfig.isDarkMode;

    if (!needsUpdate)
      return;

    prevPrimaryColorRef.current = activePrimaryColor;
    prevIsDarkModeRef.current = themeConfig.isDarkMode;

    const derivedToken = theme.getDesignToken({
      token: {
        colorPrimary: activePrimaryColor,
      },
      algorithm: themeConfig.isDarkMode
        ? theme.darkAlgorithm
        : theme.defaultAlgorithm,
    });

    updateCSSVariables(derivedToken);
  }, [activePrimaryColor, themeConfig.isDarkMode]);

  /**
   * 修复点：移除了原本用来自动清理 tempPrimaryColor 的 useLayoutEffect。
   * 原本的 Effect 会在 setPrimaryColor 后立即触发，导致两次快速渲染，
   * 造成 ColorPicker 组件内部状态错乱从而回弹。
   */

  /**
   * 用户正在拖拽颜色选择器（即时反馈）
   */
  const setTempPrimaryColor = (color: string) => {
    setStoreTempPrimaryColor(color);
  };

  /**
   * 用户完成颜色选择（持久化）
   * 修复逻辑：先更新持久化颜色，再清理临时颜色。
   * 这样 activePrimaryColor 始终保持为新颜色，不会出现中间态闪烁。
   */
  const setPrimaryColor = (color: string) => {
    // 1. 先设置持久化颜色 (此时 activeColor 仍由 tempColor 决定，或者如果 temp 也是这个色，则无视觉变化)
    setStorePrimaryColor(color);
    // 2. 紧接着清理临时颜色 (此时 activeColor 切换为由 primaryColor 决定，值相同，无缝衔接)
    setStoreTempPrimaryColor(null);
  };

  return {
    token: derivedToken,
    primaryColor: activePrimaryColor,
    setPrimaryColor,
    setTempPrimaryColor,
    antdThemeConfig,
    themeConfig,
  };
}
