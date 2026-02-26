import { createFileRoute } from '@tanstack/react-router';
import { UsersListPage } from './-components/list';

export const Route = createFileRoute('/_dashboard/users/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <UsersListPage />;
}
