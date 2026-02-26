import type { ModalOpenOptions, UISchema } from '@leeforge/react-ui';
import type { Ref } from 'react';
import type {
  CreateDataScopePolicyParams,
  DataScopePolicy,
  ScopeType,
  UpdateDataScopePolicyParams,
} from '@/api/endpoints/data-scope.api';
import { Modal, SchemaFormRenderer, useModal, useSchemaForm } from '@leeforge/react-ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Spin } from 'antd';
import { useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { z } from 'zod';
import { normalizePaginatedPayload } from '@/api/adapters/paginated';
import {
  createPolicy,
  getDataScopePolicyById,
  getOrganizationLists,
  ScopeTypeLabels,
  updatePolicy,
} from '@/api/endpoints/data-scope.api';
import { getOrganizationTree } from '@/api/endpoints/organization.api';
import { getRoleList } from '@/api/endpoints/role.api';
import { useMsg } from '@/hooks';

const formScopeTypes: ScopeType[] = ['TENANT', 'ORG_SUBTREE', 'ORG_NODE', 'ORG_LIST', 'SELF'];

interface DataScopePolicyFormValues {
  roleCode?: string;
  resourceKey?: string;
  scopeType?: ScopeType;
  scopeValue?: string | string[] | null;
}

const createSchema = z.object({
  roleCode: z.string().min(1, '请选择角色'),
  resourceKey: z.string().min(1, '请输入资源标识'),
  scopeType: z.enum(formScopeTypes as [ScopeType, ...ScopeType[]]),
  scopeValue: z.union([z.string(), z.array(z.string())]).optional().nullable(),
});

const updateSchema = z.object({
  roleCode: z.string().min(1).optional(),
  resourceKey: z.string().min(1).optional(),
  scopeType: z.enum(formScopeTypes as [ScopeType, ...ScopeType[]]).optional(),
  scopeValue: z.union([z.string(), z.array(z.string())]).optional().nullable(),
});

export interface DataScopePolicyFormRef {
  open: (options?: ModalOpenOptions<DataScopePolicy>) => void;
  close: () => void;
}

interface DataScopePolicyFormProps {
  ref?: Ref<DataScopePolicyFormRef>;
  onSuccess?: () => void;
}

function flattenOrganizations(nodes: any[] | undefined): Array<{ label: string; value: string }> {
  if (!nodes || nodes.length === 0) {
    return [];
  }

  const result: Array<{ label: string; value: string }> = [];
  const walk = (items: any[], depth: number) => {
    items.forEach((item) => {
      result.push({
        label: `${'  '.repeat(depth)}${item.name} (${item.code})`,
        value: item.id,
      });
      if (Array.isArray(item.children) && item.children.length > 0) {
        walk(item.children, depth + 1);
      }
    });
  };

  walk(nodes, 0);
  return result;
}

function parseInitialScopeValue(policy: DataScopePolicy): string | string[] | null {
  if (!policy.scopeValue) {
    return null;
  }

  if (policy.scopeType === 'ORG_LIST') {
    if (policy.scopeValue.startsWith('oulist:')) {
      return policy.scopeValue.replace('oulist:', '').split(',').filter(Boolean);
    }
    return policy.scopeValue.split(',').filter(Boolean);
  }

  if (policy.scopeValue.startsWith('ou:')) {
    return policy.scopeValue.replace('ou:', '');
  }

  return policy.scopeValue;
}

function normalizeScopeValue(scopeType: ScopeType | undefined, scopeValue: DataScopePolicyFormValues['scopeValue']): string | null {
  if (!scopeType) {
    return null;
  }

  if (scopeType === 'TENANT') {
    return '*';
  }

  if (scopeType === 'SELF') {
    return null;
  }

  if (scopeType === 'ORG_NODE' || scopeType === 'ORG_SUBTREE') {
    if (!scopeValue || Array.isArray(scopeValue)) {
      return null;
    }
    return scopeValue.startsWith('ou:') ? scopeValue : `ou:${scopeValue}`;
  }

  if (scopeType === 'ORG_LIST') {
    if (Array.isArray(scopeValue)) {
      return scopeValue.length > 0 ? `oulist:${scopeValue.join(',')}` : null;
    }
    if (!scopeValue) {
      return null;
    }
    return scopeValue.startsWith('oulist:') ? scopeValue : `oulist:${scopeValue}`;
  }

  return typeof scopeValue === 'string' ? scopeValue : null;
}

export function DataScopePolicyForm({ ref, onSuccess }: DataScopePolicyFormProps) {
  const queryClient = useQueryClient();
  const { msgSuccess, msgError } = useMsg();

  const [isEdit, setIsEdit] = useState(false);
  const [policyId, setPolicyId] = useState<string>();
  const [policyData, setPolicyData] = useState<DataScopePolicy>();
  const [scopeType, setScopeType] = useState<ScopeType>('SELF');
  const [shouldResetScopeValue, setShouldResetScopeValue] = useState(false);
  let closeModal = () => {};

  const detailQuery = useQuery({
    queryKey: ['data-scope-policies', policyId, 'detail'],
    queryFn: () => getDataScopePolicyById(policyId || ''),
    enabled: isEdit && !!policyId,
    retry: false,
  });

  const rolesQuery = useQuery({
    queryKey: ['roles', 'options'],
    queryFn: async () => {
      const response = await getRoleList({ page: 1, pageSize: 200 });
      return normalizePaginatedPayload(response, {
        listKeys: ['items', 'data'],
        defaultPageSize: 200,
      });
    },
  });

  const organizationTreeQuery = useQuery({
    queryKey: ['organizations', 'tree', 'options'],
    queryFn: async () => {
      const response = await getOrganizationTree();
      return response.data || [];
    },
  });

  const organizationListsQuery = useQuery({
    queryKey: ['organization-lists', 'options'],
    queryFn: async () => {
      const response = await getOrganizationLists({ page: 1, pageSize: 200 });
      return normalizePaginatedPayload(response, {
        listKeys: ['items'],
        defaultPageSize: 200,
      });
    },
  });

  const roleOptions = useMemo(() => {
    return (rolesQuery.data?.list || []).map((role: any) => ({
      label: `${role.name} (${role.code})`,
      value: role.code,
    }));
  }, [rolesQuery.data?.list]);

  const orgOptions = useMemo(
    () => flattenOrganizations(organizationTreeQuery.data as any[] | undefined),
    [organizationTreeQuery.data],
  );

  const orgListOptions = useMemo(() => {
    return (organizationListsQuery.data?.list || []).map((item: any) => ({
      label: item.name,
      value: item.id,
    }));
  }, [organizationListsQuery.data?.list]);

  const scopeValueConfig = useMemo(() => {
    if (scopeType === 'TENANT' || scopeType === 'SELF') {
      return {
        hidden: true,
        placeholder: 'N/A',
        options: [] as Array<{ label: string; value: string }>,
        multiple: false,
        help: scopeType === 'TENANT' ? '系统将自动写入 *' : 'SELF 类型无需额外 scopeValue',
      };
    }

    if (scopeType === 'ORG_LIST') {
      return {
        hidden: false,
        placeholder: '请选择组织列表（可多选）',
        options: orgListOptions,
        multiple: true,
        help: '保存时将编码为 oulist:{ids}',
      };
    }

    return {
      hidden: false,
      placeholder: '请选择组织节点',
      options: orgOptions,
      multiple: false,
      help: '保存时将编码为 ou:{orgId}',
    };
  }, [orgListOptions, orgOptions, scopeType]);

  const uiSchema: UISchema<DataScopePolicyFormValues> = useMemo(() => ({
    roleCode: {
      label: '角色',
      widget: 'select',
      options: roleOptions,
      showSearch: true,
      allowClear: true,
      required: true,
    },
    resourceKey: {
      label: '资源标识',
      placeholder: '例如：cms.entry',
      required: true,
    },
    scopeType: {
      label: '范围类型',
      widget: 'select',
      options: formScopeTypes.map(type => ({
        label: ScopeTypeLabels[type],
        value: type,
      })),
      required: true,
    },
    scopeValue: {
      label: '范围值',
      widget: 'select',
      placeholder: scopeValueConfig.placeholder,
      options: scopeValueConfig.options,
      multiple: scopeValueConfig.multiple,
      hidden: scopeValueConfig.hidden,
      allowClear: true,
      showSearch: true,
      help: scopeValueConfig.help,
    },
  }), [roleOptions, scopeValueConfig]);

  const resolvedPolicy = detailQuery.data?.data ?? policyData;

  const createMutation = useMutation({
    mutationFn: (params: CreateDataScopePolicyParams) => createPolicy(params),
    onSuccess: () => {
      msgSuccess('策略创建成功');
      queryClient.invalidateQueries({ queryKey: ['data-scope-policies'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      msgError(error?.message || '策略创建失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDataScopePolicyParams }) => updatePolicy(id, data),
    onSuccess: () => {
      msgSuccess('策略更新成功');
      queryClient.invalidateQueries({ queryKey: ['data-scope-policies'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      msgError(error?.message || '策略更新失败');
    },
  });

  const form = useSchemaForm({
    schema: isEdit ? updateSchema : createSchema,
    uiSchema,
    defaultValues: {
      roleCode: '',
      resourceKey: '',
      scopeType: 'SELF',
      scopeValue: null,
    },
    onValuesChange: (changedValues, allValues, prevValues) => {
      const nextScopeType = allValues.scopeType;
      if (nextScopeType && nextScopeType !== scopeType) {
        setScopeType(nextScopeType);
      }

      if (
        Object.prototype.hasOwnProperty.call(changedValues, 'scopeType')
        && prevValues.scopeType !== allValues.scopeType
        && !Object.prototype.hasOwnProperty.call(changedValues, 'scopeValue')
      ) {
        setShouldResetScopeValue(true);
      }
    },
    onSubmit: async (values) => {
      const normalizedScopeValue = normalizeScopeValue(values.scopeType, values.scopeValue);

      if (isEdit && policyId) {
        await updateMutation.mutateAsync({
          id: policyId,
          data: {
            roleCode: values.roleCode,
            resourceKey: values.resourceKey,
            scopeType: values.scopeType,
            scopeValue: normalizedScopeValue,
          },
        });
        closeModal();
        return;
      }

      await createMutation.mutateAsync({
        roleCode: values.roleCode as string,
        resourceKey: values.resourceKey as string,
        scopeType: values.scopeType as ScopeType,
        scopeValue: normalizedScopeValue,
      });
      closeModal();
    },
  });

  const { open, visible, close } = useModal<DataScopePolicy>({
    beforeOpen: (options) => {
      if (!options?.data?.id) {
        setIsEdit(false);
        setPolicyId(undefined);
        setPolicyData(undefined);
        setScopeType('SELF');
        setShouldResetScopeValue(false);
        form.reset();
        form.setValues({
          roleCode: '',
          resourceKey: '',
          scopeType: 'SELF',
          scopeValue: null,
        });
        return;
      }

      setIsEdit(true);
      setPolicyId(options.data.id);
      setPolicyData(options.data);
      setScopeType(options.data.scopeType as ScopeType);
      setShouldResetScopeValue(false);
      form.setValues({
        roleCode: options.data.roleCode,
        resourceKey: options.data.resourceKey,
        scopeType: options.data.scopeType as ScopeType,
        scopeValue: parseInitialScopeValue(options.data),
      });
    },
    afterClose: () => {
      setIsEdit(false);
      setPolicyId(undefined);
      setPolicyData(undefined);
      setScopeType('SELF');
      setShouldResetScopeValue(false);
      form.reset();
    },
  });
  closeModal = close;

  useImperativeHandle(ref, () => ({
    open,
    close,
  }), [close, open]);

  useEffect(() => {
    if (visible && isEdit && resolvedPolicy) {
      const nextScopeType = resolvedPolicy.scopeType as ScopeType;
      setScopeType(nextScopeType);
      setShouldResetScopeValue(false);
      form.setValues({
        roleCode: resolvedPolicy.roleCode,
        resourceKey: resolvedPolicy.resourceKey,
        scopeType: nextScopeType,
        scopeValue: parseInitialScopeValue(resolvedPolicy),
      });
    }
  }, [form, isEdit, resolvedPolicy, visible]);

  useEffect(() => {
    if (!shouldResetScopeValue) {
      return;
    }

    form.setFieldValue('scopeValue', scopeType === 'ORG_LIST' ? [] : null);
    setShouldResetScopeValue(false);
  }, [form, scopeType, shouldResetScopeValue]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isDetailLoading = visible && isEdit && detailQuery.isLoading;

  return (
    <Modal
      title={isEdit ? '编辑数据范围策略' : '新建数据范围策略'}
      visible={visible}
      onClose={close}
      footer={null}
      width={680}
      destroyOnHidden
    >
      <div className="mt-4">
        {isDetailLoading
          ? (
              <div className="py-8 flex justify-center">
                <Spin />
              </div>
            )
          : (
              <SchemaFormRenderer
                form={form}
                layout={{ layout: 'vertical' }}
                onCancel={close}
                submitText={isEdit ? '更新' : '创建'}
                cancelText="取消"
                showCancel
                loading={isPending}
                buttonAlign="right"
              />
            )}
      </div>
    </Modal>
  );
}
