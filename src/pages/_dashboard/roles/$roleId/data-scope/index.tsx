import { createFileRoute, useParams } from '@tanstack/react-router';
import { Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getRoleById } from '@/api/endpoints/role.api';
import { DataScopeConfig } from '../../-components/DataScopeConfig';

export const Route = createFileRoute('/_dashboard/roles/$roleId/data-scope/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { roleId } = useParams({ from: '/_dashboard/roles/$roleId/data-scope/' });
  const { data: roleResponse, isLoading } = useQuery({
    queryKey: ['roles', roleId, 'detail'],
    queryFn: () => getRoleById(roleId),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spin />
      </div>
    );
  }

  const role = roleResponse?.data;
  if (!role) {
    return <div>角色不存在</div>;
  }

  return <DataScopeConfig roleId={role.id} roleName={role.name} />;
}
