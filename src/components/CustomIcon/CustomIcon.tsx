import type { IconProps } from '@iconify/react';
import { Icon } from '@iconify/react';
import { useMemo } from 'react';

export interface CustomIconProps extends IconProps {
  hasDefaultClass?: boolean;
}

export default function CustomIcon(props: CustomIconProps) {
  const { hasDefaultClass = true, className, ...rest } = props;

  const finalClassName = useMemo(() => {
    if (!hasDefaultClass)
      return className;
    return ['icon-default icon-display', className].filter(Boolean).join(' ');
  }, [hasDefaultClass, className]);

  return <Icon {...rest} className={finalClassName} />;
}
