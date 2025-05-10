import { createHandle } from './handleUtils.js';

/**
 * 检查对象是否为Evented或EventTarget类型
 * @param target 待检查的对象
 */
export function isEventedOrEventTarget(target: any): target is Evented | EventTarget {
  return isEvented(target) || isEventTarget(target);
}

/**
 * 检查对象是否为Evented类型（具有on方法）
 * @param target 待检查的对象
 */
function isEvented(target: any): target is Evented {
  return target !== null && typeof target === 'object' && 'on' in target && typeof target.on === 'function';
}

/**
 * 检查对象是否为EventTarget类型（具有addEventListener方法）
 * @param target 待检查的对象
 */
function isEventTarget(target: any): target is EventTarget {
  return (
    target !== null &&
    typeof target === 'object' &&
    'addEventListener' in target &&
    typeof target.addEventListener === 'function'
  );
}

/**
 * 统一的事件监听方法，支持Evented和EventTarget类型
 * @param target 事件目标对象
 * @param event 事件名称或名称数组
 * @param listener 事件处理函数
 * @param options 可选配置项（仅用于EventTarget）
 */
export function on(
  target: Evented | EventTarget,
  event: string | string[],
  listener: globalThis.EventListener,
  options?: globalThis.AddEventListenerOptions
): Handle {
  if (!isEventedOrEventTarget(target)) {
    throw new TypeError('target is not a Evented or EventTarget object');
  }

  return isEventTarget(target)
    ? addEventListener(target, event, listener, options)
    : target.on(event as string, listener);
}

/**
 * 为EventTarget添加事件监听，支持事件数组
 * @param target 事件目标对象
 * @param event 事件名称或名称数组
 * @param listener 事件处理函数
 * @param options 可选配置项
 */
export function addEventListener(
  target: EventTarget,
  event: string | string[],
  listener: globalThis.EventListener,
  options?: globalThis.AddEventListenerOptions
): Handle {
  if (Array.isArray(event)) {
    const events = [...event];
    events.forEach((e) => target.addEventListener(e, listener, options));

    return createHandle(() => {
      events.forEach((e) => target.removeEventListener(e, listener, options));
    });
  }

  target.addEventListener(event, listener, options);
  return createHandle(() => {
    target.removeEventListener(event, listener, options);
  });
}

/**
 * 一次性事件监听，触发后自动移除
 * @param target 事件目标对象
 * @param event 事件名称
 * @param listener 事件处理函数
 */
export function once(target: Evented | EventTarget, event: string, listener: globalThis.EventListener): Handle {
  if (!isEventedOrEventTarget(target)) {
    throw new TypeError('target is not a Evented or EventTarget object');
  }

  // 如果对象原生支持once方法，则直接使用
  if ('once' in target && typeof target.once === 'function') {
    return (target as any).once(event, listener);
  }

  // 否则手动实现一次性监听
  const handle = on(target, event, (eventObj: Event) => {
    handle.remove();
    listener.call(target, eventObj);
  });

  return handle;
}

/**
 * 创建可暂停的事件监听器
 * @param target 事件目标对象
 * @param event 事件名称
 * @param listener 事件处理函数
 */
export function pausable(
  target: Evented | EventTarget,
  event: string,
  listener: globalThis.EventListener
): PausableHandle {
  let isPaused = false;

  const handle = on(target, event, (eventObj: Event) => {
    if (!isPaused) {
      listener.call(target, eventObj);
    }
  });

  return {
    resume() {
      isPaused = false;
    },
    pause() {
      isPaused = true;
    },
    remove() {
      handle.remove();
    },
  };
}

/**
 * 事件处理句柄接口
 */
interface Handle {
  remove(): void;
}

/**
 * 可暂停的事件处理句柄接口
 */
interface PausableHandle extends Handle {
  resume(): void;
  pause(): void;
}

/**
 * Evented对象接口
 */
interface Evented {
  on(_event: string, _listener: globalThis.EventListener): Handle;
  once?(_event: string, _listener: globalThis.EventListener): Handle;
}
