import type {
  CreateOrganizationParams,
  OrganizationListParams,
  UpdateOrganizationParams,
} from '@/api/endpoints/organization.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from 'zustand';
import {
  createOrganization,
  deleteOrganization,
  getOrganizationById,
  getOrganizationList,
  getOrganizationTree,
  updateOrganization,
} from '@/api/endpoints/organization.api';
import { AuthStore } from '@/stores';

const QUERY_KEY = 'organizations';

export function useOrganizationTree(enabled = true) {
  const actingDomain = useStore(AuthStore, state => state.actingDomain);
  return useQuery({
    queryKey: [QUERY_KEY, 'tree', actingDomain?.type, actingDomain?.key],
    queryFn: () => getOrganizationTree(),
    enabled,
  });
}

export function useOrganizationList(params?: OrganizationListParams) {
  const actingDomain = useStore(AuthStore, state => state.actingDomain);
  return useQuery({
    queryKey: [QUERY_KEY, 'list', actingDomain?.type, actingDomain?.key, params],
    queryFn: () => getOrganizationList(params),
  });
}

export function useOrganizationDetail(id?: string) {
  const actingDomain = useStore(AuthStore, state => state.actingDomain);
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', actingDomain?.type, actingDomain?.key, id],
    queryFn: () => getOrganizationById(id || ''),
    enabled: !!id,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateOrganizationParams) => createOrganization(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrganizationParams }) =>
      updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
