import { createFileRoute } from '@tanstack/react-router';
import { RolesListPage } from './-components/list';

export const Route = createFileRoute('/_dashboard/roles/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <RolesListPage />;
}
