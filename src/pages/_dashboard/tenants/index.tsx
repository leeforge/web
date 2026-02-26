import { createFileRoute } from '@tanstack/react-router';
import { TenantsListPage } from './-components/list';

export const Route = createFileRoute('/_dashboard/tenants/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <TenantsListPage />;
}
