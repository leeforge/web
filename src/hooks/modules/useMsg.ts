import type { JointContent } from 'antd/es/message/interface';
import { App } from 'antd';
import { isValidElement } from 'react';

interface MsgHooksConfig {
  content: JointContent;
  duration?: number;
  onClose?: () => void;
}

type MsgArg = JointContent | MsgHooksConfig;

/**
 * @description 全局消息提示封装 (自动支持 Context) 不需要上下文就能和主题搭配
 */
export function useMsg() {
  // 从 App 上下文中获取 message 实例
  const { message } = App.useApp();

  const baseConfig: MsgHooksConfig = {
    content: '默认消息',
    duration: 3,
    onClose: () => { },
  };

  const resolveConfig = (args: MsgArg): MsgHooksConfig => {
    if (
      typeof args === 'string'
      || typeof args === 'number'
      || isValidElement(args)
    ) {
      return { ...baseConfig, content: args };
    }

    if (typeof args === 'object' && args !== null && 'content' in args) {
      return { ...baseConfig, ...(args as MsgHooksConfig) };
    }

    return { ...baseConfig, content: args as JointContent };
  };

  // 修改为同步调用，因为 App 提供的 message 方法本身就是受上下文支持的
  return {
    msgInfo: (args: MsgArg) => {
      const { content, duration, onClose } = resolveConfig(args);
      return message.info(content, duration, onClose);
    },
    msgSuccess: (args: MsgArg) => {
      const { content, duration, onClose } = resolveConfig(args);
      return message.success(content, duration, onClose);
    },
    msgError: (args: MsgArg) => {
      const { content, duration, onClose } = resolveConfig(args);
      return message.error(content, duration, onClose);
    },
    msgWarning: (args: MsgArg) => {
      const { content, duration, onClose } = resolveConfig(args);
      return message.warning(content, duration, onClose);
    },
    msgLoading: (args: MsgArg) => {
      const { content, duration, onClose } = resolveConfig(args);
      return message.loading(content, duration, onClose);
    },
    destroyAll: () => message.destroy(),
  };
}
