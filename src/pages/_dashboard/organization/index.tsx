import { createFileRoute } from '@tanstack/react-router';
import { OrganizationPage } from './-components/OrganizationPage';

export const Route = createFileRoute('/_dashboard/organization/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <OrganizationPage />;
}
