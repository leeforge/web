import { createFileRoute } from '@tanstack/react-router';
import { QuotaPage } from '../-components/QuotaPage';

export const Route = createFileRoute('/_dashboard/quotas/projects/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <QuotaPage scopeType="project" title="项目配额管理" />;
}

