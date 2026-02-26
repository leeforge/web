import { useRouterState } from '@tanstack/react-router';
import nProgress from 'nprogress';
import { useEffect } from 'react';
import 'nprogress/nprogress.css';

nProgress.configure({
  showSpinner: false,
});

export function RouterProgress() {
  // 监听全局加载状态
  const isLoading = useRouterState({
    select: s => s.isLoading,
  });

  useEffect(() => {
    if (isLoading) {
      nProgress.start();
    }
    else {
      nProgress.done();
    }

    return () => {
      nProgress.done();
    };
  }, [isLoading]);

  return null;
}
