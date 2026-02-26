import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
/**
 * API Hooks
 * 结合 hook-fetch 和 @tanstack/react-query
 */
import { useMutation, useQuery } from '@tanstack/react-query';

/**
 * 通用查询 Hook
 *
 * @example
 * const { data, isLoading } = useApiQuery({
 *   queryKey: ['users'],
 *   queryFn: () => getUserList({ page: 1, pageSize: 20 }),
 * });
 */
export function useApiQuery<TData = unknown, TError = Error>(
  options: UseQueryOptions<TData, TError>,
) {
  return useQuery<TData, TError>(options);
}

/**
 * 通用变更 Hook
 *
 * @example
 * const { mutate } = useApiMutation({
 *   mutationFn: (params) => createUser(params),
 *   onSuccess: () => {
 *     message.success('创建成功');
 *     queryClient.invalidateQueries(['users']);
 *   },
 * });
 */
export function useApiMutation<TData = unknown, TError = Error, TVariables = void>(
  options: UseMutationOptions<TData, TError, TVariables>,
) {
  return useMutation<TData, TError, TVariables>(options);
}
