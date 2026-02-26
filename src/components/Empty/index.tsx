import type { EmptyProps as AntdEmptyProps } from 'antd';
import type { ReactNode } from 'react';
import type { VariantProps } from 'tailwind-variants';
import { Empty as AntdEmpty } from 'antd';
import { useMemo } from 'react';
import { tv } from 'tailwind-variants';
import EmptyBoxJson from '@/assets/lottie-json/emptyBox.json';
import CustomIcon from '../CustomIcon/CustomIcon';
import LottieAnimation from '../LottieAnimation/Suspend';

const emptyStyles = tv({
  slots: {
    icon: 'text-gray-400',
  },
  variants: {
    size: {
      sm: {
        icon: 'text-[30px]',
      },
      md: {
        icon: 'text-[40px]',
      },
      lg: {
        icon: 'text-[50px]',
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type EmptyVariants = VariantProps<typeof emptyStyles>;

export interface EmptyProps extends EmptyVariants, Omit<AntdEmptyProps, 'image'> {
  icon?: ReactNode | string;
}

function Empty({
  icon,
  size = 'md',
  children,
  ...antdProps
}: EmptyProps) {
  const styles = emptyStyles({ size });

  const iconNode = useMemo<ReactNode>(() => {
    if (!icon) {
      return (
        <LottieAnimation
          animationData={EmptyBoxJson}
          name="'emptyBox'"
          loop={true}
          autoplay={true}
          speed={0.3}
        />
      );
    }
    if (typeof icon === 'string') {
      return (
        <CustomIcon
          icon={icon}
          className={styles.icon()}
        />
      );
    }
    return icon;
  }, [icon, styles]);

  return (
    <AntdEmpty image={iconNode} {...antdProps}>
      {children}
    </AntdEmpty>
  );
}

export { Empty };
