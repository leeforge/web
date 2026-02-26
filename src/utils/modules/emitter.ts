import EventEmitter from 'eventemitter3';

// 基础demo
export interface AppEventPayload { path: string }
export interface AppEvents {
  // 刷新页面
  refreshPage: AppEventPayload;
}

class AppEventEmitter {
  #instance: EventEmitter;
  constructor() {
    this.#instance = new EventEmitter();
  }

  on(event: keyof AppEvents, listener: (payload: AppEventPayload) => void): void {
    this.#instance.on(event, listener);
  }

  off(event: keyof AppEvents, listener: (payload: AppEventPayload) => void): void {
    this.#instance.off(event, listener);
  }

  emit(event: keyof AppEvents, payload: AppEventPayload): void {
    this.#instance.emit(event, payload);
  }
}

export const appEventEmitter = new AppEventEmitter();
