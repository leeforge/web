import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMenuTree } from '@/api/endpoints/menu.api';
import { getRoleById, setRoleMenus } from '@/api/endpoints/role.api';

export function useRoleMenuAccess(roleId: string) {
  const queryClient = useQueryClient();

  const roleQuery = useQuery({
    queryKey: ['roles', roleId, 'detail'],
    queryFn: () => getRoleById(roleId),
    enabled: !!roleId,
  });

  const menuTreeQuery = useQuery({
    queryKey: ['menus', 'tree'],
    queryFn: () => getMenuTree(),
    enabled: !!roleId,
  });

  const saveMutation = useMutation({
    mutationFn: (menuIds: string[]) => setRoleMenus(roleId, { menuIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', roleId, 'detail'] });
    },
  });

  return {
    roleQuery,
    menuTreeQuery,
    saveMutation,
  };
}
