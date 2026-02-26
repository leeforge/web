import { createFileRoute } from '@tanstack/react-router';
import { LogsListPage } from './-components/list';

export const Route = createFileRoute('/_dashboard/logs/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <LogsListPage />;
}
