import { createFileRoute, useParams } from '@tanstack/react-router';
import { RolePermissionBindingConfig } from '../../-components/RolePermissionBindingConfig';

export const Route = createFileRoute('/_dashboard/roles/$roleId/permissions/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { roleId } = useParams({ from: '/_dashboard/roles/$roleId/permissions/' });
  return <RolePermissionBindingConfig roleId={roleId} />;
}
