import { createFileRoute } from '@tanstack/react-router';
import { QuotaPage } from '../-components/QuotaPage';

export const Route = createFileRoute('/_dashboard/quotas/tenants/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <QuotaPage scopeType="tenant" title="租户配额管理" />;
}

