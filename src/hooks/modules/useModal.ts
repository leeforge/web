import type { ModalFuncProps } from 'antd';
import { App } from 'antd';

type ModalHooksProps = ModalFuncProps;

const baseProps: ModalHooksProps = {
  centered: true,
  okButtonProps: { type: 'primary' },
  cancelButtonProps: { type: 'default' },
  className: 'custom-use-modal-hooks',
};

/**
 * @description 描述 简单的模态框hooks (自动支持 Context) 不需要上下文就能和主题搭配
 */
export function useModal() {
  // 从 App 上下文中获取 message 实例
  const { modal } = App.useApp();

  const defaultProps: ModalHooksProps = {
    ...baseProps,
    okText: '确认',
    cancelText: '取消',
    onCancel() {
      return Promise.resolve('onCancel');
    },
    onOk() {
      return Promise.resolve('onOk');
    },
  };
  const merge = (props?: ModalHooksProps) =>
    ({ ...defaultProps, ...props } as ModalHooksProps);
  const modalInfo = (props: ModalHooksProps) => modal.info({ ...merge(props) });

  const modalSuccess = (props: ModalHooksProps) =>
    modal.success({ ...merge(props) });

  const modalError = (props: ModalHooksProps) =>
    modal.error({ ...merge(props) });

  const modalWarning = (props: ModalHooksProps) =>
    modal.warning({ ...merge(props) });

  const modalConfirm = (props: ModalHooksProps) =>
    modal.confirm({ ...merge(props) });

  return {
    modalApi: modal,
    modalInfo,
    modalSuccess,
    modalError,
    modalWarning,
    modalConfirm,
  };
}
