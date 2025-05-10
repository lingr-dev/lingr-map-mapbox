import { config } from '../config.js';

import { isAborted } from '../common/promiseUtils.js';
import { getOrigin, hasSameOrigin, getAppUrl, urlToObject } from '../common/urlUtils.js';

/**
 * 加载图像资源并返回 Promise，支持取消操作
 * @param imageElement 图像元素
 * @param imageUrl 图像 URL
 * @param isObjectUrl 是否为对象 URL（加载完成后需要释放）
 * @param abortSignal 取消信号
 * @returns 解析为加载完成的图像元素的 Promise
 */
function loadImageAsync(
  imageElement: HTMLImageElement,
  imageUrl: string,
  isObjectUrl: boolean = false,
  abortSignal?: AbortSignal
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (abortSignal && isAborted(abortSignal)) {
      return reject(createAbortError());
    }

    // 错误处理函数
    const handleError = () => {
      cleanup();
      reject(new Error(`Unable to load ${imageUrl}`));
    };

    // 加载成功处理函数
    const handleLoad = () => {
      const loadedImage = imageElement;
      cleanup();
      resolve(loadedImage);
    };

    // 取消处理函数
    const handleAbort = () => {
      if (!imageElement) return;
      const abortedImage = imageElement;
      cleanup();
      abortedImage.src = '';
      reject(createAbortError());
    };

    // 清理资源和事件监听器
    const cleanup = () => {
      abortSignal?.removeEventListener('abort', handleAbort);

      if (isObjectUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };

    // 设置事件监听器
    if (abortSignal) {
      abortSignal.addEventListener('abort', handleAbort);
    }

    imageElement.decode().then(handleLoad, handleError);
  });
}

/**
 * 创建 AbortError 实例
 * @returns DOMException 或自定义错误对象
 */
function createAbortError(): DOMException | Error {
  try {
    return new DOMException('Aborted', 'AbortError');
  } catch {
    const error = new Error();
    error.name = 'AbortError';
    return error;
  }
}

const TIMEOUT_ERROR_MESSAGE = 'Timeout exceeded';

/**
 * 创建超时错误对象
 * @returns 超时错误对象
 */
function createTimeoutError(): Error {
  return new Error(TIMEOUT_ERROR_MESSAGE);
}

/**
 * 判断是否为超时错误
 * @param error 错误对象
 * @returns 是否为超时错误
 */
function isTimeoutError(error: any): boolean {
  return typeof error === 'object' && error !== null && 'message' in error && error.message === TIMEOUT_ERROR_MESSAGE;
}

/**
 * 注册不需要 CORS 的域名
 * @param domains 域名列表
 */
function registerNoCorsDomains(domains: string[]): void {
  if (!config.request.crossOriginNoCorsDomains) {
    config.request.crossOriginNoCorsDomains = {};
  }

  const noCorsDomains = config.request.crossOriginNoCorsDomains;

  for (let domain of domains) {
    domain = domain.toLowerCase();

    if (/^https?:\/\//.test(domain)) {
      const origin = getOrigin(domain) ?? '';
      noCorsDomains[origin] = 0;
    } else {
      // 同时注册 http 和 https 协议的域名
      noCorsDomains[getOrigin('http://' + domain) ?? ''] = 0;
      noCorsDomains[getOrigin('https://' + domain) ?? ''] = 0;
    }
  }
}

/**
 * 判断请求是否需要使用 no-cors 模式
 * @param url 请求 URL
 * @returns 是否需要使用 no-cors 模式
 */
function isNoCorsRequestRequired(url: string): boolean {
  const noCorsDomains = config.request.crossOriginNoCorsDomains;

  if (noCorsDomains) {
    let origin = getOrigin(url);

    if (origin) {
      origin = origin.toLowerCase();
      // 检查是否为非同域且在 no-cors 列表中，并且时间戳超过1小时
      return !hasSameOrigin(origin, getAppUrl()) && noCorsDomains[origin] < Date.now() - 3600000;
    }
  }

  return false;
}

/**
 * 发送 no-cors 请求以测试域名访问权限
 * @param url 请求 URL
 */
async function sendNoCorsRequest(url: string): Promise<void> {
  const urlObj = urlToObject(url);
  let requestUrl = urlObj.path;

  // 如果请求参数中包含 f=json，则添加到 URL
  if (urlObj.query?.f === 'json') {
    requestUrl += '?f=json';
  }

  try {
    await fetch(requestUrl as string, { mode: 'no-cors', credentials: 'include' });
  } catch {
    // 忽略错误
  }

  const noCorsDomains = config.request.crossOriginNoCorsDomains;
  const origin = getOrigin(requestUrl as string);

  if (noCorsDomains && origin) {
    noCorsDomains[origin.toLowerCase()] = Date.now();
  }
}

export {
  createTimeoutError,
  isNoCorsRequestRequired,
  isTimeoutError,
  loadImageAsync,
  registerNoCorsDomains,
  sendNoCorsRequest,
};
