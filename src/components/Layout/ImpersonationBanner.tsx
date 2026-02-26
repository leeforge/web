import { Alert, Button } from 'antd';
import { useEffect, useState } from 'react';
import { useStore } from 'zustand';
import { AuthStore } from '@/stores';

interface ImpersonationBannerProps {
  onExit: () => void;
}

function formatDateTime(value: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) {
    return value;
  }
  return new Date(time).toLocaleString('zh-CN');
}

function getRemainingMinutes(expiresAt: string, now: number): number {
  const time = Date.parse(expiresAt);
  if (Number.isNaN(time)) {
    return 0;
  }

  const remaining = time - now;
  if (remaining <= 0) {
    return 0;
  }

  return Math.ceil(remaining / 60000);
}

export function ImpersonationBanner({ onExit }: ImpersonationBannerProps) {
  const impersonation = useStore(AuthStore, state => state.impersonation);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!impersonation) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, [impersonation]);

  if (!impersonation) {
    return null;
  }

  const remainingMinutes = getRemainingMinutes(impersonation.expiresAt, now);

  return (
    <Alert
      showIcon
      type="warning"
      className="mb-4"
      message={(
        <div className="flex items-center justify-between gap-2">
          <span>
            当前处于代管模式，目标租户：
            {impersonation.targetTenantId}
            {' '}
            ，剩余约
            {' '}
            {remainingMinutes}
            {' '}
            分钟（到期时间：
            {formatDateTime(impersonation.expiresAt)}
            ）
          </span>
          <Button size="small" type="link" onClick={onExit}>
            退出代管
          </Button>
        </div>
      )}
    />
  );
}
