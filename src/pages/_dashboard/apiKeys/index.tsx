import { createFileRoute } from '@tanstack/react-router';
import { APIKeysListPage } from './-components/list';

export const Route = createFileRoute('/_dashboard/apiKeys/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <APIKeysListPage />;
}
