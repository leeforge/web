import type { ModalOpenOptions } from '@leeforge/react-ui';
import type { Ref } from 'react';
import type {
  CreateOrganizationParams,
  Organization,
  OrganizationTreeNode,
} from '@/api/endpoints/organization.api';
import type { UISchema } from '@leeforge/react-ui';
import { Modal, useModal } from '@leeforge/react-ui';
import { TreeSelect } from 'antd';
import { useImperativeHandle, useMemo, useState } from 'react';
import {
  CreateOrganizationParamsSchema,
} from '@/api/endpoints/organization.api';
import { SchemaFormRenderer, useSchemaForm } from '@leeforge/react-ui';
import { useMsg } from '@/hooks/modules/useMsg';
import {
  useCreateOrganization,
  useOrganizationTree,
  useUpdateOrganization,
} from '../-hooks/useOrganization';

interface OrganizationFormOpenData {
  organization?: Organization | null;
  parentId?: string | null;
}

export interface OrganizationFormRef {
  open: (data?: ModalOpenOptions<OrganizationFormOpenData>) => void;
  close: () => void;
}

interface OrganizationFormProps {
  ref?: Ref<OrganizationFormRef>;
  onSuccess?: () => void;
}

// 组织表单 UI Schema
const organizationFormSchema: UISchema<CreateOrganizationParams> = {
  name: {
    label: '组织名称',
    placeholder: '请输入组织名称',
    required: true,
  },
  code: {
    label: '组织编码',
    placeholder: '请输入组织编码（租户内唯一）',
    required: true,
  },
  sort: {
    label: '排序',
    widget: 'number',
    min: 0,
    placeholder: '数字越小越靠前',
  },
};

function convertToTreeData(nodes: OrganizationTreeNode[], excludeId?: string | null): any[] {
  return nodes
    .filter(node => node.id !== excludeId)
    .map(node => ({
      title: node.name,
      value: node.id,
      key: node.id,
      children: node.children ? convertToTreeData(node.children, excludeId) : undefined,
    }));
}

/**
 * 组织表单组件（创建/编辑）
 */
export function OrganizationForm({
  ref,
  onSuccess,
}: OrganizationFormProps) {
  const { msgSuccess, msgError } = useMsg();
  const [isEdit, setIsEdit] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);

  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization();

  const defaultValues = useMemo<CreateOrganizationParams>(() => ({
    name: '',
    code: '',
    sort: 0,
    parentId: null,
  }), []);

  const form = useSchemaForm({
    schema: CreateOrganizationParamsSchema,
    uiSchema: organizationFormSchema,
    defaultValues,
    onSubmit: async (values) => {
      try {
        if (isEdit && organization) {
          await updateMutation.mutateAsync({
            id: organization.id,
            data: {
              name: values.name,
              code: values.code,
              parentId: values.parentId ?? null,
              sort: values.sort,
            },
          });

          msgSuccess('组织更新成功');
        }
        else {
          await createMutation.mutateAsync({
            name: values.name,
            code: values.code,
            sort: values.sort,
            parentId: values.parentId ?? null,
          });
          msgSuccess('组织创建成功');
        }

        onSuccess?.();
        // eslint-disable-next-line ts/no-use-before-define
        close();
      }
      catch (error: any) {
        msgError(error?.message || '操作失败');
      }
    },
  });

  const { open, visible, close } = useModal<OrganizationFormOpenData>({
    beforeOpen: (opts) => {
      const nextOrganization = opts?.data?.organization ?? null;
      const nextParentId = opts?.data?.parentId ?? nextOrganization?.parentId ?? null;

      if (!nextOrganization?.id) {
        setIsEdit(false);
        setOrganization(null);
        form.reset();
        form.setValues({ ...defaultValues, parentId: nextParentId });
        return;
      }

      setIsEdit(true);
      setOrganization(nextOrganization);
      form.setValues({
        name: nextOrganization.name,
        code: nextOrganization.code,
        sort: nextOrganization.sort || 0,
        parentId: nextParentId,
      });
    },
    afterClose: () => {
      setIsEdit(false);
      setOrganization(null);
      form.reset();
    },
  });

  useImperativeHandle(ref, () => ({
    open,
    close,
  }), [close, open]);

  const { data: treeResponse } = useOrganizationTree(visible);
  const treeData = useMemo(() => {
    if (!treeResponse?.data)
      return [];
    return convertToTreeData(treeResponse.data, organization?.id);
  }, [treeResponse, organization?.id]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      title={isEdit ? '编辑组织' : '新建组织'}
      visible={visible}
      onClose={close}
      footer={null}
      width={520}
      destroyOnHidden
    >
      <div className="mt-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">上级组织</label>
          <TreeSelect
            allowClear
            placeholder="选择上级组织（留空为顶级）"
            treeData={treeData}
            value={form.values.parentId ?? null}
            onChange={(value) => {
              form.setFieldValue('parentId', value || null);
            }}
            treeDefaultExpandAll
            className="w-full"
          />
        </div>

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
      </div>
    </Modal>
  );
}
