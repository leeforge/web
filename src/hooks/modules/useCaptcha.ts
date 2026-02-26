import type { CaptchaType } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { getCaptcha } from '@/api';

export interface UseCaptchaOptions {
  type?: CaptchaType;
  queryKey?: readonly unknown[];
  enabled?: boolean;
}

export function useCaptcha(options?: UseCaptchaOptions) {
  const {
    type = 'math',
    queryKey,
    enabled = true,
  } = options ?? {};

  const { data, refetch, isFetching } = useQuery({
    queryKey: queryKey ?? ['captcha', type],
    queryFn: () => getCaptcha(type),
    enabled,
  });

  const captchaImage = data?.data?.content;
  const captchaId = data?.data?.id;

  const refreshCaptcha = useCallback(() => refetch(), [refetch]);

  const widgetProps = useMemo(() => ({
    captchaImage,
    onRefresh: refreshCaptcha,
  }), [captchaImage, refreshCaptcha]);

  return {
    captchaImage,
    captchaId,
    refreshCaptcha,
    isFetching,
    widgetProps,
  };
}
