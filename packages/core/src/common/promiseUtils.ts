import { clock } from '../lang/clock.js';
import { AppError } from './AppError.js';
import { once } from '../lang/events.js';
import { nsLogger } from './logger.js';
import type { NamespaceLogger } from './logger.js';
import type { Handle } from '../lang/handleUtils.js';
import { removeMaybe } from '../lang/maybe.js';

/**
 * 过滤数组中的元素，根据异步判断函数的结果
 * @param items 待过滤的元素数组
 * @param predicate 异步判断函数
 * @returns 过滤后的元素数组
 */
async function filter<T>(items: T[], predicate: (_item: T, _index: number) => Promise<boolean>): Promise<T[]> {
  const itemCopy = items.slice();
  const results = await Promise.all(items.map((item, index) => predicate(item, index)));
  return itemCopy.filter((_, index) => results[index]);
}

/**
 * 创建一个 Abort 错误对象
 * @param message 错误消息，默认为 "Aborted"
 * @returns 自定义错误对象
 */
function createAbortError(message: string = 'Aborted'): AppError {
  return new AppError('AbortError', message);
}

/**
 * 如果信号已中止，则抛出 Abort 错误
 * @param signalOrOptions 中止信号或包含信号的选项对象
 * @param message 错误消息，默认为 "Aborted"
 */
function throwIfAborted(
  signalOrOptions: AbortSignal | { signal?: AbortSignal } | undefined,
  message: string = 'Aborted'
): void {
  if (isAborted(signalOrOptions)) {
    throw createAbortError(message);
  }
}

/**
 * 从信号或选项对象中提取中止信号
 * @param signalOrOptions 中止信号或包含信号的选项对象
 * @returns 中止信号或 undefined
 */
function signalFromSignalOrOptions(
  signalOrOptions: AbortSignal | { signal?: AbortSignal } | undefined
): AbortSignal | undefined {
  return signalOrOptions instanceof AbortSignal ? signalOrOptions : signalOrOptions?.signal;
}

/**
 * 判断信号是否已中止
 * @param signalOrOptions 中止信号或包含信号的选项对象
 * @returns 如果已中止返回 true，否则返回 false
 */
function isAborted(signalOrOptions: AbortSignal | { signal?: AbortSignal } | undefined): boolean {
  const signal = signalFromSignalOrOptions(signalOrOptions);
  return signal !== null && signal !== undefined && signal.aborted;
}

/**
 * 如果是 Abort 错误，则抛出该错误
 * @param error 错误对象
 */
function throwIfAbortError(error: any): void {
  if (isAbortError(error)) {
    throw error;
  }
}

/**
 * 如果不是 Abort 错误，则抛出该错误
 * @param error 错误对象
 */
function throwIfNotAbortError(error: any): void {
  if (!isAbortError(error)) {
    throw error;
  }
}

/**
 * 监听信号的中止事件，并在中止时执行回调
 * @param signalOrOptions 中止信号或包含信号的选项对象
 * @param callback 中止时执行的回调函数
 * @returns 移除事件监听器的函数
 */
function onAbort(
  signalOrOptions: AbortSignal | { signal?: AbortSignal } | undefined,
  callback: () => void
): Handle | undefined {
  const signal = signalFromSignalOrOptions(signalOrOptions);
  if (signal !== null && signal !== undefined) {
    if (!signal.aborted) {
      return once(signal, 'abort', () => callback());
    }
    callback();
  }
  return undefined;
}

/**
 * 监听信号的中止事件，并在中止时执行回调并抛出 Abort 错误
 * @param signalOrOptions 中止信号或包含信号的选项对象
 * @param callback 中止时执行的回调函数
 * @returns 移除事件监听器的函数
 */
function onAbortOrThrow(
  signalOrOptions: AbortSignal | { signal?: AbortSignal } | undefined,
  callback: (_error: AppError) => void
): Handle | undefined {
  const signal = signalFromSignalOrOptions(signalOrOptions);
  if (signal !== null && signal !== undefined) {
    throwIfAborted(signal);
    return once(signal, 'abort', () => callback(createAbortError()));
  }
  return undefined;
}

/**
 * 如果信号未定义，则返回原 Promise，否则在信号中止时拒绝 Promise
 * @param promise 原 Promise
 * @param signalOrOptions 中止信号或包含信号的选项对象
 * @returns 新的 Promise
 */
function whenOrAbort<T>(
  promise: Promise<T>,
  signalOrOptions: AbortSignal | { signal?: AbortSignal } | undefined
): Promise<T> {
  if (signalFromSignalOrOptions(signalOrOptions) === null || signalFromSignalOrOptions(signalOrOptions) === undefined) {
    return promise;
  }
  return new Promise((resolve, reject) => {
    let removeAbortListener: Handle | undefined | null = onAbort(signalOrOptions, () => reject(createAbortError()));
    const cleanup = () => {
      removeAbortListener = removeMaybe(removeAbortListener);
    };
    promise.then(cleanup, cleanup);
    promise.then(resolve, reject);
  });
}

/**
 * 在指定时间后返回一个 Promise，或在超时后抛出错误
 * @param promise 原 Promise
 * @param timeoutMs 超时时间（毫秒）
 * @param errorMessage 超时错误消息
 * @returns 新的 Promise
 */
function whenOrTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage?: string): Promise<T> {
  return Promise.race([
    promise,
    after(timeoutMs).then(() => {
      throw new AppError('timeout', `Did not resolve within ${timeoutMs} milliseconds (${errorMessage ?? 'timeout'})`);
    }),
  ]);
}

/**
 * 判断错误是否为 Abort 错误
 * @param error 错误对象
 * @returns 如果是 Abort 错误返回 true，否则返回 false
 */
function isAbortError(error: any): boolean {
  return error?.name === 'AbortError';
}

/**
 * 忽略 Abort 错误，其他错误继续抛出
 * @param promise 原 Promise
 * @returns 新的 Promise
 */
async function ignoreAbortErrors<T>(promise: Promise<T>): Promise<T | undefined> {
  try {
    return await promise;
  } catch (error) {
    if (!isAbortError(error)) {
      throw error;
    }
    return undefined;
  }
}

/**
 * 执行 Promise 并记录非 Abort 错误
 * @param promise 原 Promise
 * @param logger 日志记录器，默认为 esri 日志器
 * @returns 新的 Promise
 */
async function logOnError<T>(promise: Promise<T>, logger: NamespaceLogger = nsLogger.create('lingr')): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (!isAbortError(error)) {
      logger.error(error);
    }
    throw error;
  }
}

/**
 * 对对象或数组中的每个 Promise 执行操作，并返回结果对象或数组
 * @param input 对象或数组，包含多个 Promise
 * @returns 包含每个 Promise 结果的对象或数组
 */
async function eachAlways<T>(
  input: T | T[] | { [key: string]: T }
): Promise<{ promise: T; value?: any; error?: any }[] | { [key: string]: any } | undefined> {
  if (!input) {
    return undefined;
  }
  if (typeof (input as any).forEach !== 'function') {
    const keys = Object.keys(input as { [key: string]: T });
    const values = keys.map((key) => (input as { [key: string]: T })[key]);
    const results = await eachAlways(values);
    const output: { [key: string]: any } = {};
    keys.forEach((key, index) => {
      output[key] = (results as { promise: T; value?: any; error?: any }[])[index].value;
    });
    return output;
  }
  const promises = input as T[];
  return Promise.allSettled(promises).then((results) => {
    return Array.from(promises, (promise, index) => {
      const result = results[index];
      return result.status === 'fulfilled' ? { promise, value: result.value } : { promise, error: result.reason };
    });
  });
}

/**
 * 获取每个 Promise 成功执行的结果
 * @param input 对象或数组，包含多个 Promise
 * @returns 包含每个 Promise 成功结果的数组
 */
async function eachAlwaysValues<T>(input: T | T[] | { [key: string]: T }): Promise<any[]> {
  return ((await eachAlways(input)) as { promise: T; value?: any; error?: any }[])
    .filter((result) => !!result.value)
    .map((result) => result.value);
}

/**
 * 获取所有 Promise 成功执行的结果
 * @param promises Promise 数组
 * @returns 包含所有成功结果的数组
 */
async function allSettledValues<T>(promises: Promise<T>[]): Promise<T[]> {
  return (await Promise.allSettled(promises))
    .filter((result) => result.status === 'fulfilled')
    .map((result) => (result as PromiseFulfilledResult<T>).value);
}

/**
 * 获取所有 Promise 失败的错误
 * @param promises Promise 数组
 * @returns 包含所有失败错误的数组
 */
async function allSettledErrors(promises: Promise<any>[]): Promise<any[]> {
  return (await Promise.allSettled(promises))
    .filter((result) => result.status === 'rejected')
    .map((result) => (result as PromiseRejectedResult).reason);
}

/**
 * 在指定时间后返回一个 Promise
 * @param timeoutMs 等待时间（毫秒）
 * @param result 可选的返回结果
 * @param signalOrOptions 中止信号或包含信号的选项对象
 * @returns 新的 Promise
 */
function after<T>(
  timeoutMs: number,
  result?: T,
  signalOrOptions?: AbortSignal | { signal?: AbortSignal }
): Promise<T | undefined> {
  const controller = new AbortController();
  onAbort(signalOrOptions, () => controller.abort());
  return new Promise((resolve, reject) => {
    let timeoutId: any = setTimeout(() => {
      timeoutId = 0;
      resolve(result);
    }, timeoutMs);
    onAbort(controller, () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        reject(createAbortError());
      }
    });
  });
}

/**
 * 为 Promise 添加超时控制，如果超时则中止信号
 * @param promise 原 Promise
 * @param timeoutMs 超时时间（毫秒）
 * @param signal 可选的中止信号
 * @param error 超时错误对象
 * @returns 新的 Promise
 */
function timeout<T>(promise: Promise<T>, timeoutMs: number, signal?: AbortSignal, error?: AppError): Promise<T> {
  const abortSignal: any = signal && 'abort' in signal ? signal : null;
  const timeoutError =
    error ?? new AppError('promiseUtils:timeout', `The wrapped promise did not resolve within ${timeoutMs} ms`);
  let timeoutId: any = setTimeout(() => {
    timeoutId = 0;
    abortSignal?.abort();
  }, timeoutMs);
  const timeoutFn = () => timeoutError;
  return promise.then(
    (value) => {
      if (timeoutId === 0) {
        throw timeoutFn();
      }
      clearTimeout(timeoutId);
      return value;
    },
    (err) => {
      clearTimeout(timeoutId);
      if (timeoutId === 0) {
        throw timeoutFn();
      }
      throw err;
    }
  );
}

/**
 * 包装一个带有超时和中止信号的对象
 * @param options 原始选项对象
 * @param timeoutMs 超时时间（毫秒）
 * @returns 包装后的选项对象
 */
function wrapAbortWithTimeout(options: { [key: string]: any }, timeoutMs: number): { [key: string]: any } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  onAbort(options, () => {
    controller.abort();
    clearTimeout(timeoutId);
  });
  return {
    ...options,
    signal: controller.signal,
  };
}

/**
 * 判断一个对象是否为 Promise 类型
 * @param obj 待判断的对象
 * @returns 如果是 Promise 类型返回 true，否则返回 false
 */
function isPromiseLike(obj: any): boolean {
  return obj && typeof obj.then === 'function';
}

/**
 * 如果对象是 Promise 则返回原对象，否则将其包装为 Promise
 * @param obj 待处理的对象
 * @returns Promise 对象
 */
function when<T>(obj: T | Promise<T>): Promise<T> {
  return isPromiseLike(obj) ? (obj as Promise<T>) : Promise.resolve(obj);
}

/**
 * 创建一个可解析和拒绝的对象
 * @returns 包含 resolve、reject、timeout 方法和 promise 属性的对象
 */
function createResolver<T>(): {
  resolve: (_value: T | PromiseLike<T>) => void;
  reject: (_reason?: any) => void;
  timeout: (_timeoutMs: number, _error: any) => void;
  promise: Promise<T>;
} {
  let resolveFn: (_value: T | PromiseLike<T>) => void;
  let rejectFn: (_reason?: any) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });
  const resolver = (value: T) => {
    resolveFn(value);
  };
  resolver.resolve = (value: T | PromiseLike<T>) => resolveFn(value);
  resolver.reject = (reason?: any) => rejectFn(reason);
  resolver.timeout = (timeoutMs: number, error: any) => {
    clock.setTimeout(() => resolver.reject(error), timeoutMs);
  };
  resolver.promise = promise;
  return resolver;
}

/**
 * 对函数进行防抖处理
 * @param fn 原函数
 * @param waitMs 防抖时间（毫秒），-1 表示不防抖
 * @returns 防抖后的函数
 */
function debounce<T extends (..._args: any[]) => any>(
  fn: T,
  waitMs: number = -1
): (..._args: Parameters<T>) => ReturnType<T> extends Promise<infer U> ? Promise<U> : Promise<any> {
  let currentPromise: Promise<any> | undefined;
  let lastArgs: Parameters<T> | undefined;
  let activeResolver: ReturnType<typeof createResolver<any>> | undefined;
  let abortController: AbortController | null = null;

  const debouncedFn = async (...args: Parameters<T>): Promise<ReturnType<T> extends Promise<infer U> ? U : any> => {
    if (currentPromise) {
      lastArgs = args;
      activeResolver?.reject(createAbortError());
      activeResolver = createResolver();
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
      return activeResolver.promise;
    }

    activeResolver = activeResolver ?? createResolver();
    if (waitMs > 0) {
      abortController = new AbortController();
      currentPromise = when(fn(...args, abortController.signal));
      const currentPromiseRef = currentPromise;
      after(waitMs).then(() => {
        if (currentPromise === currentPromiseRef) {
          if (activeResolver) {
            abortController?.abort();
          } else {
            abortController = new AbortController();
          }
        }
      });
    } else {
      currentPromise = when(fn(...args));
    }

    const cleanup = () => {
      lastArgs = undefined;
      currentPromise = undefined;
      activeResolver = undefined;
      if (abortController) {
        abortController = null;
      }
      if (lastArgs) {
        debouncedFn(...lastArgs);
      }
    };

    currentPromise.then(cleanup, cleanup);
    currentPromise.then(activeResolver.resolve, activeResolver.reject);
    return activeResolver.promise;
  };

  return debouncedFn as (..._args: Parameters<T>) => ReturnType<T> extends Promise<infer U> ? Promise<U> : Promise<any>;
}

/**
 * 无论 Promise 成功或失败，都执行回调函数
 * @param promise 原 Promise
 * @param callback 回调函数
 * @returns 新的 Promise
 */
function always<T>(promise: Promise<T>, callback: (_result: T | any) => any): Promise<T> {
  return promise.then(callback, callback);
}

/**
 * 用一个 Promise 的结果解决或拒绝另一个可解析对象
 * @param resolver 可解析对象
 * @param promise 原 Promise
 */
function settleWithPromise<T>(
  resolver: { resolve: (_value: T | PromiseLike<T>) => void; reject: (_reason?: any) => void },
  promise: Promise<T>
): void {
  promise.then(resolver.resolve, resolver.reject);
}

/**
 * 等待一个 tick 后检查信号是否中止
 * @param signalOrOptions 中止信号或包含信号的选项对象
 */
async function waitTick(signalOrOptions: AbortSignal | { signal?: AbortSignal } | undefined): Promise<void> {
  await Promise.resolve();
  throwIfAborted(signalOrOptions);
}

export {
  filter,
  createAbortError,
  throwIfAborted,
  signalFromSignalOrOptions,
  isAborted,
  throwIfAbortError,
  throwIfNotAbortError,
  onAbort,
  onAbortOrThrow,
  whenOrAbort,
  whenOrTimeout,
  isAbortError,
  ignoreAbortErrors,
  logOnError,
  eachAlways,
  eachAlwaysValues,
  allSettledValues,
  allSettledErrors,
  after,
  timeout,
  wrapAbortWithTimeout,
  isPromiseLike,
  when,
  createResolver,
  debounce,
  always,
  settleWithPromise,
  waitTick,
};
