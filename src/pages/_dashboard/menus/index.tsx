import { createFileRoute } from '@tanstack/react-router';
import { MenusListPage } from './-components/list';

export const Route = createFileRoute('/_dashboard/menus/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <MenusListPage />;
}
