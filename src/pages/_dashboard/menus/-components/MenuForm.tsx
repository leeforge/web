import type { ModalOpenOptions } from '@leeforge/react-ui';
import type { Ref } from 'react';
import type {
  CreateMenuParams,
  Menu,
  UpdateMenuParams,
} from '@/api/endpoints/menu.api';
import type { UISchema } from '@leeforge/react-ui';
import { Modal, useModal } from '@leeforge/react-ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TreeSelect } from 'antd';
import { useImperativeHandle, useMemo, useState } from 'react';
import {
  createMenu,
  CreateMenuParamsSchema,
  getMenuTree,
  updateMenu,
  UpdateMenuParamsSchema,
} from '@/api/endpoints/menu.api';
import { SchemaFormRenderer, useSchemaForm } from '@leeforge/react-ui';
import { useMsg } from '@/hooks/modules/useMsg';

export interface MenuFormRef {
  open: (data?: ModalOpenOptions<Menu>) => void;
  close: () => void;
}

interface MenuFormProps {
  ref?: Ref<MenuFormRef>;
  onSuccess?: () => void;
}

// 创建菜单的 UI Schema
const createMenuUISchema: UISchema<CreateMenuParams> = {
  name: {
    label: '菜单名称',
    placeholder: '请输入菜单名称',
    required: true,
    span: 12,
  },
  path: {
    label: '路由路径',
    placeholder: '请输入路由路径，如 /users',
    required: true,
    span: 12,
  },
  icon: {
    label: '图标',
    placeholder: '请输入图标名称',
    span: 12,
  },
  component: {
    label: '组件路径',
    placeholder: '前端组件路径',
    span: 12,
  },
  redirect: {
    label: '重定向',
    placeholder: '重定向路径',
    span: 12,
  },
  sort: {
    label: '排序',
    widget: 'number',
    min: 0,
    placeholder: '数字越小越靠前',
    span: 12,
  },
  hidden: {
    label: '隐藏菜单',
    widget: 'switch',
    span: 12,
  },
  affix: {
    label: '固定标签',
    widget: 'switch',
    span: 12,
  },
};

// 更新菜单的 UI Schema
const updateMenuUISchema: UISchema<UpdateMenuParams> = {
  name: {
    label: '菜单名称',
    placeholder: '请输入菜单名称',
    span: 12,
  },
  path: {
    label: '路由路径',
    placeholder: '请输入路由路径',
    span: 12,
  },
  icon: {
    label: '图标',
    placeholder: '请输入图标名称',
    span: 12,
  },
  component: {
    label: '组件路径',
    placeholder: '前端组件路径',
    span: 12,
  },
  redirect: {
    label: '重定向',
    placeholder: '重定向路径',
    span: 12,
  },
  sort: {
    label: '排序',
    widget: 'number',
    min: 0,
    placeholder: '数字越小越靠前',
    span: 12,
  },
  hidden: {
    label: '隐藏菜单',
    widget: 'switch',
    span: 12,
  },
  affix: {
    label: '固定标签',
    widget: 'switch',
    span: 12,
  },
};

// 将菜单树转换为 TreeSelect 数据
function convertToTreeData(menus: Menu[], excludeId?: string): any[] {
  return menus
    .filter(menu => menu.id !== excludeId)
    .map(menu => ({
      title: menu.name,
      value: menu.id,
      key: menu.id,
      children: menu.children
        ? convertToTreeData(menu.children, excludeId)
        : undefined,
    }));
}

/**
 * 菜单表单组件（创建/编辑）
 */
export function MenuForm({ ref, onSuccess }: MenuFormProps) {
  const queryClient = useQueryClient();
  const { msgSuccess, msgError } = useMsg();
  const [isEdit, setIsEdit] = useState(false);
  const [menuId, setMenuId] = useState<string>();

  const defaultValues = useMemo(() => ({
    name: '',
    path: '',
    icon: '',
    component: '',
    redirect: '',
    parentId: null as string | null,
    sort: 0,
    hidden: false,
    affix: false,
  }), []);

  const form = useSchemaForm({
    schema: isEdit ? UpdateMenuParamsSchema : CreateMenuParamsSchema,
    uiSchema: isEdit ? updateMenuUISchema : createMenuUISchema,
    defaultValues,
    onSubmit: async (values) => {
      if (isEdit && menuId) {
        // eslint-disable-next-line ts/no-use-before-define
        updateMutation.mutate({ id: menuId, data: values as UpdateMenuParams });
      }
      else {
        // eslint-disable-next-line ts/no-use-before-define
        createMutation.mutate(values as CreateMenuParams);
      }
    },
  });

  const { open, visible, close } = useModal<Menu>({
    beforeOpen: (opts) => {
      if (!opts?.data?.id) {
        setIsEdit(false);
        setMenuId(void 0);
        form.reset();
        form.setValues(defaultValues);
        return;
      }

      setIsEdit(true);
      setMenuId(opts.data.id);
      form.setValues({
        name: opts.data.name,
        path: opts.data.path,
        icon: opts.data.icon || '',
        component: opts.data.component || '',
        redirect: opts.data.redirect || '',
        parentId: opts.data.parentId || null,
        sort: opts.data.sort || 0,
        hidden: opts.data.hidden || false,
        affix: opts.data.affix || false,
      });
    },
    afterClose: () => {
      setIsEdit(false);
      setMenuId(void 0);
      form.reset();
    },
  });

  useImperativeHandle(ref, () => ({
    open,
    close,
  }), [close, open]);

  // 获取菜单树（用于选择父级菜单）
  const { data: menuTreeResponse } = useQuery({
    queryKey: ['menus', 'tree'],
    queryFn: () => getMenuTree(),
    enabled: visible,
  });

  // 父级菜单选项
  const parentOptions = useMemo(() => {
    if (!menuTreeResponse?.data)
      return [];
    return convertToTreeData(menuTreeResponse.data, menuId);
  }, [menuId, menuTreeResponse]);

  // 创建 mutation
  const createMutation = useMutation({
    mutationFn: createMenu,
    onSuccess: () => {
      msgSuccess('菜单创建成功');
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      onSuccess?.();

      close();
    },
    onError: (error: any) => {
      msgError(`创建失败: ${error.message}`);
    },
  });

  // 更新 mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuParams }) =>
      updateMenu(id, data),
    onSuccess: () => {
      msgSuccess('菜单更新成功');
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      onSuccess?.();

      close();
    },
    onError: (error: any) => {
      msgError(`更新失败: ${error.message}`);
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      title={isEdit ? '编辑菜单' : '新建菜单'}
      visible={visible}
      onClose={close}
      footer={null}
      width={700}
      destroyOnHidden
    >
      <div className="mt-4">
        {/* 父级菜单选择 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">父级菜单</label>
          <TreeSelect
            allowClear
            placeholder="选择父级菜单（留空为顶级菜单）"
            treeData={parentOptions}
            style={{ width: '100%' }}
            // Use the form value for controlled component
            value={form.values.parentId}
            onChange={(value) => {
              form.setFieldValue('parentId', value || null);
            }}
            treeDefaultExpandAll
          />
        </div>

        <SchemaFormRenderer
          form={form}
          layout={{ layout: 'vertical', columns: 2 }}
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
