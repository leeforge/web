import type { Color } from 'antd/es/color-picker';
import { ColorPicker, Space, Switch } from 'antd';
import { useMemo } from 'react';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import { useDarkMode } from '@/hooks/modules/useDarkMode';
import { useThemeColor } from '@/hooks/modules/useThemeColor';

/**
 * 主题设置组件
 * 提供主题色切换和暗色模式切换功能
 */
export default function ThemeSettings() {
  const { setPrimaryColor, setTempPrimaryColor, primaryColor }
    = useThemeColor();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const handleClick = () => {
    toggleDarkMode();
  };

  /**
   * 颜色拖拽时的即时反馈（不持久化）
   */
  const handleColorChange = (color: Color) => {
    const hexColor = color.toHexString();
    setTempPrimaryColor(hexColor);
  };

  /**
   * 颜色选择完成后的持久化
   */
  const handleColorChangeComplete = (color: Color) => {
    const hexColor = color.toHexString();
    setPrimaryColor(hexColor);
  };

  // 使用 useMemo 缓存预设颜色配置，避免不必要的重渲染
  const presets = useMemo(
    () => [
      {
        label: '推荐颜色',
        colors: [
          '#1677ff',
          '#52c41a',
          '#faad14',
          '#ff4d4f',
          '#722ed1',
          '#13c2c2',
        ],
      },
    ],
    [],
  );

  return (
    <Space>
      <Switch
        onClick={handleClick}
        checked={isDarkMode}
        checkedChildren={(
          <div className="h-full flex items-center justify-center pt-2px">
            <CustomIcon icon="line-md:sunny-filled-loop-to-moon-filled-alt-loop-transition" width={16} />
          </div>
        )}
        unCheckedChildren={(
          <div className="h-full flex items-center justify-center pt-2px">
            <CustomIcon icon="line-md:moon-filled-alt-to-sunny-filled-loop-transition" width={16} />
          </div>
        )}
      />
      <div className="h-full flex items-center justify-center ">
        <ColorPicker
          defaultValue={primaryColor}
          onChange={handleColorChange}
          onChangeComplete={handleColorChangeComplete}
          disabledAlpha
          presets={presets}
        />
      </div>
    </Space>
  );
}
