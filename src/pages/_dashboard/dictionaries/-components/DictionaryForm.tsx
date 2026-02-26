import type { ModalOpenOptions } from '@leeforge/react-ui';
import type { Ref } from 'react';
import type {
  CreateDictionaryParams,
  Dictionary,
  UpdateDictionaryParams,
} from '@/api/endpoints/dictionary.api';
import type { UISchema } from '@leeforge/react-ui';
import { Modal, useModal } from '@leeforge/react-ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useImperativeHandle, useMemo, useState } from 'react';
import {
  createDictionary,
  CreateDictionaryParamsSchema,
  updateDictionary,
  UpdateDictionaryParamsSchema,
} from '@/api/endpoints/dictionary.api';
import { SchemaFormRenderer, useSchemaForm } from '@leeforge/react-ui';
import { useMsg } from '@/hooks';

export interface DictionaryFormRef {
  open: (data?: ModalOpenOptions<Dictionary>) => void;
  close: () => void;
}

interface DictionaryFormProps {
  ref?: Ref<DictionaryFormRef>;
  onSuccess?: () => void;
}

// 创建字典的 UI Schema
const createDictionaryUISchema: UISchema<CreateDictionaryParams> = {
  name: {
    label: '字典名称',
    placeholder: '请输入字典名称',
    required: true,
    span: 12,
  },
  code: {
    label: '字典编码',
    placeholder: '请输入字典编码（唯一标识）',
    required: true,
    span: 12,
  },
  description: {
    label: '描述',
    widget: 'textarea',
    placeholder: '请输入字典描述',
    rows: 3,
  },
  status: {
    label: '启用状态',
    widget: 'switch',
    span: 12,
  },
};

// 更新字典的 UI Schema
const updateDictionaryUISchema: UISchema<UpdateDictionaryParams> = {
  name: {
    label: '字典名称',
    placeholder: '请输入字典名称',
    span: 12,
  },
  code: {
    label: '字典编码',
    placeholder: '请输入字典编码',
    span: 12,
  },
  description: {
    label: '描述',
    widget: 'textarea',
    placeholder: '请输入字典描述',
    rows: 3,
  },
  status: {
    label: '启用状态',
    widget: 'switch',
    span: 12,
  },
};

/**
 * 字典表单组件（创建/编辑）
 */
export function DictionaryForm({
  ref,
  onSuccess,
}: DictionaryFormProps) {
  const queryClient = useQueryClient();
  const { msgSuccess, msgError } = useMsg();
  const [isEdit, setIsEdit] = useState(false);
  const [dictionaryId, setDictionaryId] = useState<string>();

  const defaultValues = useMemo(() => ({
    name: '',
    code: '',
    description: '',
    status: true,
  }), []);

  const createMutation = useMutation({
    mutationFn: createDictionary,
    onSuccess: () => {
      msgSuccess('字典创建成功');
      queryClient.invalidateQueries({ queryKey: ['dictionaries'] });
      onSuccess?.();
      // eslint-disable-next-line ts/no-use-before-define
      close();
    },
    onError: (error: any) => {
      msgError(`创建失败: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDictionaryParams }) =>
      updateDictionary(id, data),
    onSuccess: () => {
      msgSuccess('字典更新成功');
      queryClient.invalidateQueries({ queryKey: ['dictionaries'] });
      onSuccess?.();
      // eslint-disable-next-line ts/no-use-before-define
      close();
    },
    onError: (error: any) => {
      msgError(`更新失败: ${error.message}`);
    },
  });

  const form = useSchemaForm({
    schema: isEdit ? UpdateDictionaryParamsSchema : CreateDictionaryParamsSchema,
    uiSchema: isEdit ? updateDictionaryUISchema : createDictionaryUISchema,
    defaultValues,
    onSubmit: async (values) => {
      if (isEdit && dictionaryId) {
        updateMutation.mutate({
          id: dictionaryId,
          data: values as UpdateDictionaryParams,
        });
      }
      else {
        createMutation.mutate(values as CreateDictionaryParams);
      }
    },
  });

  const { open, visible, close } = useModal<Dictionary>({
    beforeOpen: (opts) => {
      if (!opts?.data?.id) {
        setIsEdit(false);
        setDictionaryId(void 0);
        form.reset();
        form.setValues(defaultValues);
        return;
      }

      setIsEdit(true);
      setDictionaryId(opts.data.id);
      form.setValues({
        name: opts.data.name,
        code: opts.data.code,
        description: opts.data.description || '',
        status: opts.data.status ?? true,
      });
    },
    afterClose: () => {
      setIsEdit(false);
      setDictionaryId(void 0);
      form.reset();
    },
  });

  useImperativeHandle(ref, () => ({
    open,
    close,
  }), [close, open]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      title={isEdit ? '编辑字典' : '新建字典'}
      visible={visible}
      onClose={close}
      footer={null}
      width={600}
      destroyOnHidden
    >
      <div className="mt-4">
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
