// src/components/AntdContextSetter.tsx
import { App } from 'antd';
import { useEffect } from 'react';
import { setStaticApp } from './antd-static';

function AntdContextSetter() {
  const { message, modal, notification } = App.useApp();

  // 监听这三个实例的变化，一旦主题/国际化改变，提供新的实例
  useEffect(() => {
    setStaticApp(message, modal, notification);
  }, [message, modal, notification]);

  return null;
}

export default AntdContextSetter;
