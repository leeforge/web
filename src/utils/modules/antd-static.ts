import type { MessageInstance } from 'antd/es/message/interface';
import type { HookAPI } from 'antd/es/modal/useModal';
import type { NotificationInstance } from 'antd/es/notification/interface';

let staticMessage!: MessageInstance;
let staticModal!: HookAPI;
let staticNotification!: NotificationInstance;

export function setStaticApp(
  msg: MessageInstance,
  mod: HookAPI,
  not: NotificationInstance,
) {
  staticMessage = msg;
  staticModal = mod;
  staticNotification = not;
}

/**
 * @description 描述 在ts中使用message的时候可以获取正确的上下文和主题 直接导入message不能在ts中正确展示主题
 * @date 2026-02-02 14:54:41
 * @author tingfeng
 *
 * @export
 */
export function getMessage() {
  return staticMessage;
}

export function getModal() {
  return staticModal;
}

export function getNotification() {
  return staticNotification;
}
