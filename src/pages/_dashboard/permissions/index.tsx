import { createFileRoute } from '@tanstack/react-router';
import { PermissionsListPage } from './-components/list';

export const Route = createFileRoute('/_dashboard/permissions/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <PermissionsListPage />;
}
