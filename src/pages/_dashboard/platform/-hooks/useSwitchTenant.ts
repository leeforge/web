import type { SwitchTenantParams } from '@/api/endpoints/platform.api';
import { useMutation } from '@tanstack/react-query';
import { startImpersonation } from '@/api/endpoints/platform.api';

export function useSwitchTenant() {
  return useMutation({
    mutationFn: (payload: SwitchTenantParams) => startImpersonation(payload),
  });
}
