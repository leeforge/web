import type { WidgetProps } from '@leeforge/react-ui';
import { useDebounceFn } from 'ahooks';
import { Image, Input } from 'antd';
import { memo, useMemo } from 'react';

interface CaptchaWidgetExternalProps {
  captchaImage?: string;
  onRefresh?: () => void;
}
type CaptchaWidgetProps = WidgetProps<string, CaptchaWidgetExternalProps>;

export const CaptchaWidget = memo(({
  ui,
  value,
  onChange,
  onBlur,
  disabled,
  size,
  hasError,
}: CaptchaWidgetProps) => {
  const externalProps = ui.widgetProps as CaptchaWidgetExternalProps | undefined;
  const captchaImage = externalProps?.captchaImage;

  const refreshCaptcha = useMemo(() => externalProps?.onRefresh ?? (() => undefined), [externalProps?.onRefresh]);
  const { run: handleRefresh } = useDebounceFn(() => refreshCaptcha(), { wait: 500, leading: true, trailing: false });

  const safeValue = value ?? '';

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Input
        value={safeValue}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        size={size}
        placeholder={ui.placeholder || '请输入验证码'}
        status={hasError ? 'error' : undefined}
        style={{ flex: 1 }}
      />
      {captchaImage && (
        <Image
          src={captchaImage}
          onClick={handleRefresh}
          alt="验证码"
          style={{ height: 38, borderRadius: 4, cursor: 'pointer' }}
          preview={false}
        />
      )}
    </div>
  );
});
