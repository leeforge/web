import { Tag } from 'antd';
import { useStore } from 'zustand';
import { AuthStore } from '@/stores';

export function ImpersonationIndicator() {
  const impersonation = useStore(AuthStore, state => state.impersonation);

  if (!impersonation) {
    return null;
  }

  return (
    <Tag color="orange" className="m-0">
      代管中
    </Tag>
  );
}
