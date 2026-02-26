import { createFileRoute, useParams } from '@tanstack/react-router';
import { RoleMenuAccessConfig } from '../../-components/RoleMenuAccessConfig';

export const Route = createFileRoute('/_dashboard/roles/$roleId/menus/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { roleId } = useParams({ from: '/_dashboard/roles/$roleId/menus/' });
  return <RoleMenuAccessConfig roleId={roleId} />;
}
