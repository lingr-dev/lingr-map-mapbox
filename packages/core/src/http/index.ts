/* eslint-disable */
import { config } from '../config.js';
import { IdentityManager } from '../auth/IdentityManager.js';
import { AppError } from '../common/AppError.js';
import { clone } from '../lang/object.js';
import { getOrCreateMapValue } from '../common/MapUtils.js';
import {
  queryToObject,
  isDataProtocol,
  isBlobProtocol,
  normalize,
  getInterceptor,
  isTrustedServer,
  getOrigin,
  toHTTPS,
  objectToQuery,
  getProxyRule,
  getProxyUrl,
  addQueryParameters,
  hasSameOrigin,
  getAppUrl,
  addProxyRule,
  isSecureProxyService,
} from '../common/urlUtils.js';
import { onAbort, isAbortError, createAbortError, isAborted } from '../common/promiseUtils.js';
import {
  registerNoCorsDomains,
  isNoCorsRequestRequired,
  sendNoCorsRequest,
  createTimeoutError,
  loadImageAsync,
} from './requestUtils.js';

// 定义请求选项类型
interface RequestOptions {
  query?: Record<string, string | string[]> | URLSearchParams;
  responseType?: 'json' | 'xml' | 'document' | 'array-buffer' | 'blob' | 'image' | 'native' | 'native-request-init';
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'head' | 'get' | 'post' | 'put' | 'delete';
  body?: string | FormData | HTMLFormElement;
  cacheBust?: boolean;
  headers?: Record<string, string>;
  authMode?: 'immediate' | 'no-prompt' | 'anonymous';
  useRequestQueue?: boolean;
  timeout?: number;
  useProxy?: boolean;
  withCredentials?: boolean;
  signal?: AbortSignal;
}

// 定义请求结果类型
interface RequestResult<T> {
  data: T;
  getAllHeaders: () => any[] | null;
  getHeader: (name: string) => string | null;
  httpStatus: number;
  requestOptions: RequestOptions;
  ssl: boolean;
  url: string;
}

// 定义拦截器类型
interface Interceptor {
  urls?: string | RegExp | Array<string | RegExp>;
  before?: (request: { url: string; requestOptions: RequestOptions }) => Promise<any>;
  after?: (response: RequestResult<any>) => Promise<any>;
  error?: (error: AppError) => Promise<any>;
  responseData?: any;
  headers?: Record<string, string>;
  query?: Record<string, string | string[]>;
}

// 定义请求上下文类型
interface RequestContext {
  controller: AbortController;
  credential: any;
  credentialToken: string | null;
  fetchOptions: RequestInit;
  hasToken: boolean;
  interceptor: Interceptor | null;
  params: { url: string; requestOptions: RequestOptions };
  redoRequest: boolean;
  useIdentity: boolean;
  useProxy: boolean;
  useSSL: boolean;
  withCredentials: boolean;
}

let requestExecutor: any;
const requestConfig = config.request;

const hasFormData = 'FormData' in globalThis;
const errorStatusCodes = new Set([499, 498, 403, 401]);
const errorMessageCodes = new Set(['COM_0056', 'COM_0057', 'SB_0008']);
const tokenUrls = [/\/arcgis\/tokens/i, /\/sharing(\/rest)?\/generatetoken/i, /\/rest\/info/i];
const getHeaders = () => null;
const privateSymbol = Symbol();

// 存储支持 CORS 的服务器
const corsServers: string[] = ['https://server.arcgisonline.com', 'https://services.arcgisonline.com'];

let beforeFetchHook: ((url: string, options: RequestInit) => Promise<void>) | undefined;
let afterFetchHook: ((response: Response) => Promise<void>) | undefined;

const requestQueueMap = new Map<string, any>();

// 添加 CORS 支持的服务器
function addCorsServer(url: string): void {
  const origin = getOrigin(url);
  if (origin && !corsServers.includes(origin)) {
    corsServers.push(origin);
  }
}

// 检查 URL 是否支持 CORS
function isCorsSupported(url: string): boolean {
  const origin = getOrigin(url);
  return !origin || origin.endsWith('.arcgis.com') || corsServers.includes(origin) || isTrustedServer(origin);
}

// 创建错误对象
function createRequestError(
  errorType: string,
  error: Error,
  requestParams: { url: string; requestOptions: RequestOptions },
  response?: Response
): AppError {
  let errorMessage = 'Error';
  const errorDetails = {
    url: requestParams.url,
    requestOptions: requestParams.requestOptions,
    getAllHeaders: getHeaders,
    getHeader: getHeaders,
    ssl: false,
    httpStatus: 0,
    subCode: 0,
    messageCode: '',
    messages: [] as string[],
    raw: error,
  };

  if (error instanceof AppError) {
    if (error.details) {
      error.details = clone(error.details);
      error.details.url = requestParams.url;
      error.details.requestOptions = requestParams.requestOptions;
    } else {
      error.details = errorDetails;
    }
    return error;
  }

  if (error) {
    const headersGetter = response && (() => Array.from(response.headers));
    const headerGetter = response && ((name: string) => response.headers.get(name));
    const status = response?.status;
    errorMessage = error.message || errorMessage;

    if (headersGetter && headerGetter) {
      errorDetails.getAllHeaders = headersGetter;
      errorDetails.getHeader = headerGetter;
    }

    errorDetails.httpStatus = (error as any).httpCode || (error as any).code || status || 0;
    errorDetails.subCode = (error as any).subcode || 0;
    errorDetails.messageCode = (error as any).messageCode || '';
    if (typeof (error as any).details === 'string') {
      errorDetails.messages = [(error as any).details];
    } else {
      errorDetails.messages = (error as any).details || [];
    }
    errorDetails.raw = privateSymbol in error ? (error as any)[privateSymbol] : error;
  }

  return isAbortError(error) ? createAbortError() : new AppError(errorType, errorMessage, errorDetails);
}

// 初始化身份管理器
async function initializeIdentityManager(): Promise<void> {
  if (!identityManagerId) {
    await import('./identity/IdentityManager.js');
  }
}

// 准备请求上下文
async function prepareRequestContext(context: RequestContext): Promise<void> {
  const {
    params: { url, requestOptions },
    controller,
  } = context;
  const signal = controller.signal;
  let formData: FormData | null = null;
  let bodyString: string | null = null;

  if (hasFormData && 'HTMLFormElement' in globalThis) {
    if (requestOptions.body instanceof FormData) {
      formData = requestOptions.body;
    } else if (requestOptions.body instanceof HTMLFormElement) {
      formData = new FormData(requestOptions.body);
    }
  }

  if (typeof requestOptions.body === 'string') {
    bodyString = requestOptions.body;
  }

  context.fetchOptions = {
    cache: requestOptions.cacheBust ? 'no-cache' : 'default',
    credentials: 'same-origin',
    headers: requestOptions.headers || {},
    method: requestOptions.method === 'head' ? 'HEAD' : 'GET',
    mode: 'cors',
    priority: requestConfig.priority,
    redirect: 'follow',
    signal,
  };

  if (formData || bodyString) {
    context.fetchOptions.body = formData || bodyString;
  }

  if (requestOptions.authMode === 'anonymous') {
    context.useIdentity = false;
  }

  context.hasToken = /token=/i.test(url) || requestOptions.query?.token || formData?.get('token');

  // if (!context.hasToken && isApiKeyApplicable(url)) {
  //   requestOptions.query = requestOptions.query || {};
  //   requestOptions.query.token = config.apiKey;
  //   context.hasToken = true;
  // }

  if (context.useIdentity && !context.hasToken && !context.credentialToken && !isTokenUrl(url) && !isAborted(signal)) {
    let credential: any;
    if (requestOptions.authMode === 'immediate') {
      await initializeIdentityManager();
      credential = await identityManagerId.getCredential(url, { signal });
    } else if (requestOptions.authMode === 'no-prompt') {
      await initializeIdentityManager();
      credential = await identityManagerId.getCredential(url, { prompt: false, signal }).catch(() => {});
    } else if (identityManagerId) {
      credential = identityManagerId.findCredential(url);
    }

    if (credential) {
      context.credentialToken = credential.token;
      context.useSSL = !!credential.ssl;
    }
  }
}

// 检查 URL 是否为获取令牌的 URL
function isTokenUrl(url: string): boolean {
  return tokenUrls.some((regex) => regex.test(url));
}

// 执行请求
async function executeRequest(context: RequestContext): Promise<[Response | null, any]> {
  let url = context.params.url;
  const { requestOptions } = context.params;
  const fetchOptions = context.fetchOptions || {};
  const isDataOrBlobUrl = isBlobProtocol(url) || isDataProtocol(url);
  const responseType = requestOptions.responseType || 'json';
  const timeout = isDataOrBlobUrl ? 0 : (requestOptions.timeout ?? requestConfig.timeout);

  let shouldUsePost = false;

  if (!isDataOrBlobUrl) {
    if (context.useSSL) {
      url = toHTTPS(url);
    }

    let queryParams: Record<string, any> = { ...requestOptions.query };
    if (context.credentialToken) {
      queryParams.token = context.credentialToken;
    }

    let queryString = objectToQuery(queryParams);
    if (has('esri-url-encodes-apostrophe')) {
      queryString = queryString.replaceAll("'", '%27');
    }

    const urlLength = url.length + 1 + queryString.length;

    shouldUsePost =
      requestOptions.method === 'delete' ||
      requestOptions.method === 'post' ||
      requestOptions.method === 'put' ||
      !!requestOptions.body ||
      urlLength > requestConfig.maxUrlLength;

    const useProxy = requestOptions.useProxy || !!getProxyRule(url);

    if (useProxy) {
      const proxyInfo = getProxyUrl(url);
      const proxyPath = proxyInfo.path;
      if (!shouldUsePost && proxyPath!.length + 1 + urlLength > requestConfig.maxUrlLength) {
        shouldUsePost = true;
      }
      if (proxyInfo.query) {
        queryParams = { ...proxyInfo.query, ...queryParams };
      }
      queryString = objectToQuery(queryParams);
    }

    if (fetchOptions.method === 'HEAD' && (shouldUsePost || useProxy)) {
      if (shouldUsePost) {
        if (urlLength > requestConfig.maxUrlLength) {
          throw createRequestError(
            'request:invalid-parameters',
            new Error('URL exceeds maximum length'),
            context.params
          );
        }
        throw createRequestError(
          'request:invalid-parameters',
          new Error("cannot use POST request when method is 'head'"),
          context.params
        );
      }
      if (useProxy) {
        throw createRequestError(
          'request:invalid-parameters',
          new Error("cannot use proxy when method is 'head'"),
          context.params
        );
      }
    }

    if (shouldUsePost) {
      fetchOptions.method =
        requestOptions.method === 'delete' ? 'DELETE' : requestOptions.method === 'put' ? 'PUT' : 'POST';
      if (requestOptions.body) {
        url = addQueryParameters(url, queryParams);
      } else {
        fetchOptions.body = queryString;
        fetchOptions.headers = fetchOptions.headers || {};
        fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    } else {
      url = addQueryParameters(url, queryParams);
    }

    if (useProxy) {
      context.useProxy = true;
      url = `${proxyInfo.path}?${url}`;
    }

    if (queryParams.token && hasFormData && fetchOptions.body instanceof FormData && !isSecureProxyService(url)) {
      (fetchOptions.body as FormData).set('token', queryParams.token);
    }

    if (requestOptions.hasOwnProperty('withCredentials')) {
      context.withCredentials = !!requestOptions.withCredentials;
    } else if (!hasSameOrigin(url, getAppUrl())) {
      if (isTrustedServer(url)) {
        context.withCredentials = true;
      } else if (identityManagerId) {
        const serverInfo = identityManagerId.findServerInfo(url);
        if (serverInfo?.webTierAuth) {
          context.withCredentials = true;
        }
      }
    }

    if (context.withCredentials) {
      fetchOptions.credentials = 'include';
      if (isNoCorsRequestRequired(url)) {
        await sendNoCorsRequest(shouldUsePost ? addQueryParameters(url, queryParams) : url);
      }
    }
  }

  let response: Response | null = null;
  let result: any = null;
  let timeoutId: NodeJS.Timeout | 0 = 0;
  let isTimedOut = false;

  if (timeout > 0) {
    timeoutId = setTimeout(() => {
      isTimedOut = true;
      context.controller.abort();
    }, timeout);
  }

  try {
    if (requestOptions.responseType === 'native-request-init') {
      result = { ...fetchOptions, url };
      if (requestOptions.signal) {
        result.signal = requestOptions.signal;
      } else {
        delete result.signal;
      }
    } else if (
      requestOptions.responseType !== 'image' ||
      fetchOptions.cache !== 'default' ||
      fetchOptions.method !== 'GET' ||
      shouldUsePost ||
      hasHeaders(requestOptions.headers) ||
      (!isDataOrBlobUrl && !context.useProxy && requestConfig.proxyUrl && !isCorsSupported(url))
    ) {
      if (beforeFetchHook) {
        await beforeFetchHook(url, fetchOptions);
      }
      response = await fetch(url, fetchOptions);
      if (afterFetchHook) {
        await afterFetchHook(response);
      }
      if (context.useProxy || addCorsServer(url)) {
        // 处理逻辑
      }

      if (requestOptions.responseType === 'native') {
        result = response;
      } else if (fetchOptions.method !== 'HEAD') {
        if (response.ok) {
          switch (responseType) {
            case 'array-buffer':
              result = await response.arrayBuffer();
              break;
            case 'blob':
            case 'image':
              result = await response.blob();
              break;
            default:
              result = await response.text();
          }

          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = 0;
          }

          if (responseType === 'json' || responseType === 'xml' || responseType === 'document') {
            if (result) {
              switch (responseType) {
                case 'json':
                  result = JSON.parse(result);
                  break;
                case 'xml':
                  result = parseXml(result, 'application/xml');
                  break;
                case 'document':
                  result = parseXml(result, 'text/html');
                  break;
              }
            } else {
              result = null;
            }
          }

          if (result) {
            if (responseType === 'array-buffer' || responseType === 'blob') {
              const contentType = response.headers.get('Content-Type');
              if (
                contentType &&
                /application\/json|text\/plain/i.test(contentType) &&
                (responseType === 'blob' ? result.size : result.byteLength) <= 750
              ) {
                try {
                  const jsonResult = await new Response(result).json();
                  if (jsonResult.error) {
                    result = jsonResult;
                  }
                } catch {}
              }
            }
            if (responseType === 'image' && result instanceof Blob) {
              result = await loadImageAsync(URL.createObjectURL(result), context, true);
            }
          }
        } else {
          result = await response.text();
          try {
            result = JSON.parse(result);
          } catch {}
        }
      }
    } else {
      result = await loadImageAsync(url, context);
    }
  } catch (error) {
    if ((error as any).name === 'AbortError') {
      if (isTimedOut) {
        throw createTimeoutError();
      }
      throw createAbortError('Request canceled');
    }

    if (
      !(response === null && error instanceof TypeError && requestConfig.proxyUrl) ||
      requestOptions.body ||
      requestOptions.method === 'delete' ||
      requestOptions.method === 'head' ||
      requestOptions.method === 'post' ||
      requestOptions.method === 'put' ||
      context.useProxy ||
      isCorsSupported(url)
    ) {
      throw error;
    }

    context.redoRequest = true;
    addProxyRule({ proxyUrl: requestConfig.proxyUrl, urlPrefix: getOrigin(url) ?? '' });
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }

  return [response, result];
}

// 执行拦截器
async function executeInterceptor(
  interceptor: Interceptor,
  request: { url: string; requestOptions: RequestOptions }
): Promise<any> {
  if (interceptor.responseData !== null) {
    return interceptor.responseData;
  }

  if (interceptor.headers) {
    request.requestOptions.headers = { ...request.requestOptions.headers, ...interceptor.headers };
  }

  if (interceptor.query) {
    request.requestOptions.query = { ...request.requestOptions.query, ...interceptor.query };
  }

  if (interceptor.before) {
    let result: any;
    let error: AppError | undefined;
    try {
      result = await interceptor.before(request);
    } catch (err) {
      error = createRequestError('request:interceptor', err as Error, request);
    }

    if (result instanceof Error || result instanceof AppError) {
      error = createRequestError('request:interceptor', result, request);
    }

    if (error) {
      if (interceptor.error) {
        await interceptor.error(error);
      }
      throw error;
    }

    return result;
  }

  return null;
}

// 检查对象是否有非空属性
function hasHeaders(obj: Record<string, string> | undefined): boolean {
  if (obj) {
    for (const key in obj) {
      if (obj[key]) {
        return true;
      }
    }
  }
  return false;
}

// 解析 XML 字符串
function parseXml(xmlString: string, mimeType: string): Document {
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(xmlString, mimeType);
  } catch {}

  if (!doc || doc.getElementsByTagName('parsererror').length > 0) {
    throw new SyntaxError('XML Parse error');
  }

  return doc;
}

// 将请求放入队列处理
async function processRequestInQueue(context: RequestContext): Promise<RequestResult<any>> {
  const parsedUrl = parseUrlInfo(context.params.url);
  if (!parsedUrl) {
    return executeRequestImmediately(context);
  }

  const { QueueProcessor } = await import('./core/QueueProcessor.js');
  const queue = getOrCreateMapValue(requestQueueMap, parsedUrl.origin, () => {
    const concurrency = parsedUrl.isHosted
      ? has('request-queue-concurrency-hosted')
      : has('request-queue-concurrency-non-hosted');
    return new QueueProcessor({
      concurrency,
      process: (ctx: RequestContext) => {
        if (isAborted(ctx.params.requestOptions)) {
          throw createRequestError('', createAbortError('Request canceled'), ctx.params);
        }
        return executeRequestImmediately(ctx);
      },
    });
  });

  return queue.push(context);
}

// 立即执行请求
async function executeRequestImmediately(context: RequestContext): Promise<RequestResult<any>> {
  let response: Response | null = null;
  let result: any = null;

  await prepareRequestContext(context);

  try {
    do {
      [response, result] = await executeRequest(context);
    } while (!(await shouldRetryRequest(context, response, result)));
  } catch (error) {
    const requestError = createRequestError('request:server', error as Error, context.params, response);
    requestError.details.ssl = context.useSSL;
    if (context.interceptor?.error) {
      await context.interceptor.error(requestError);
    }
    throw requestError;
  }

  const url = context.params.url;
  if (result && /\/sharing\/rest\/(accounts|portals)\/self/i.test(url)) {
    if (!context.hasToken && !context.credentialToken && result.user?.username && !isTrustedServer(url)) {
      const origin = getOrigin(url, true);
      if (origin) {
        requestConfig.trustedServers?.push(origin);
      }
    }
    if (Array.isArray(result.authorizedCrossOriginNoCorsDomains)) {
      registerNoCorsDomains(result.authorizedCrossOriginNoCorsDomains);
    }
  }

  if (context.credential && identityManagerId) {
    const serverInfo = identityManagerId.findServerInfo(context.credential.server);
    let owningSystemUrl = serverInfo?.owningSystemUrl;
    if (owningSystemUrl) {
      owningSystemUrl = owningSystemUrl.replace(/\/?$/, '/sharing');
      const credential = identityManagerId.findCredential(owningSystemUrl, context.credential.userId);
      if (credential && identityManagerId._getIdenticalSvcIdx(owningSystemUrl, credential) === -1) {
        credential.resources.unshift(owningSystemUrl);
      }
    }
  }

  return {
    data: result,
    getAllHeaders: response ? () => Array.from(response.headers) : getHeaders,
    getHeader: response ? (name: string) => response.headers.get(name) : getHeaders,
    httpStatus: response?.status ?? 200,
    requestOptions: context.params.requestOptions,
    ssl: context.useSSL,
    url,
  };
}

// 判断是否需要重试请求
async function shouldRetryRequest(context: RequestContext, response: Response | null, result: any): Promise<boolean> {
  if (context.redoRequest) {
    context.redoRequest = false;
    return false;
  }

  const { requestOptions } = context.params;
  if (!response || requestOptions.responseType === 'native' || requestOptions.responseType === 'native-request-init') {
    return true;
  }

  let error: any;
  if (result && result.error && typeof result.error === 'object') {
    error = result.error;
  } else if (result && result.status === 'error' && Array.isArray(result.messages)) {
    error = { ...result };
    error[privateSymbol] = result;
    error.details = result.messages;
  }

  if (!error && !response.ok) {
    error = new Error(`Unable to load ${response.url} status: ${response.status}`);
    error[privateSymbol] = result;
  }

  let errorCode: number | undefined;
  let subCode: number | null = null;
  let messageCode: string | undefined;
  if (error) {
    errorCode = Number(error.code);
    subCode = error.hasOwnProperty('subcode') ? Number(error.subcode) : null;
    messageCode = error.messageCode?.toUpperCase();
  }

  const authMode = requestOptions.authMode;

  if (
    errorCode === 403 &&
    (subCode === 4 ||
      (error.message?.toLowerCase().includes('ssl') && !error.message.toLowerCase().includes('permission')))
  ) {
    if (!context.useSSL) {
      context.useSSL = true;
      return false;
    }
  } else if (
    !context.hasToken &&
    context.useIdentity &&
    (authMode !== 'no-prompt' || errorCode === 498) &&
    errorCode !== undefined &&
    errorStatusCodes.has(errorCode) &&
    !isTokenUrl(context.params.url) &&
    (errorCode !== 403 ||
      ((!messageCode || !errorMessageCodes.has(messageCode)) &&
        (subCode === null || (subCode === 2 && context.credentialToken))))
  ) {
    await initializeIdentityManager();
    try {
      const credential = await identityManagerId.getCredential(context.params.url, {
        error: createRequestError('request:server', error, context.params),
        prompt: authMode !== 'no-prompt',
        signal: context.controller.signal,
        token: context.credentialToken,
      });
      context.credential = credential;
      context.credentialToken = credential.token;
      context.useSSL = context.useSSL || credential.ssl;
      return false;
    } catch (err) {
      if (authMode === 'no-prompt') {
        context.credential = undefined;
        context.credentialToken = null;
        return false;
      }
      error = err;
    }
  }

  if (error) {
    throw error;
  }

  return true;
}

// 加载图片异步
async function loadImageAsyncWrapper(
  url: string,
  context: RequestContext,
  isBlob: boolean = false
): Promise<HTMLImageElement> {
  const signal = context.controller.signal;
  const image = new Image();
  if (context.withCredentials) {
    image.crossOrigin = 'use-credentials';
  } else {
    image.crossOrigin = 'anonymous';
  }
  image.alt = '';
  image.fetchPriority = requestConfig.priority as string;
  image.src = url;
  return loadImageAsync(image, url, isBlob, signal);
}

// 解析 URL 信息
function parseUrlInfo(url: string | URL): { origin: string; isHosted: boolean } | null {
  let origin: string | null = null;
  let isHosted: boolean = false;

  if (typeof url === 'string') {
    origin = getOrigin(url, true);
    // isHosted = isHostedAgolService(url);
  } else {
    origin = url.origin;
    // isHosted = isHostedAgolService(url.toString());
  }

  return origin ? { origin, isHosted } : null;
}

// 主请求函数
async function request(url: string | URL, requestOptions: RequestOptions = {}): Promise<RequestResult<any>> {
  if (url instanceof URL) {
    url = url.toString();
  }

  if (requestOptions.query instanceof URLSearchParams) {
    requestOptions.query = queryToObject(requestOptions.query.toString().replaceAll('+', ' '));
  }

  const isDataUrl = isDataProtocol(url);
  const isBlobUrl = isBlobProtocol(url);

  if (!isDataUrl && !isBlobUrl) {
    url = normalize(url);
  }

  const requestParams = { url, requestOptions: { ...requestOptions } };
  const createResponse = (data: any) => ({
    data,
    getAllHeaders: getHeaders,
    getHeader: getHeaders,
    httpStatus: 200,
    requestOptions: requestParams.requestOptions,
    url: requestParams.url,
  });

  const internalInterceptor = getInterceptor(url, requestConfig.internalInterceptors);
  if (internalInterceptor) {
    const result = await executeInterceptor(internalInterceptor, requestParams);
    if (result !== null) {
      return createResponse(result);
    }
  }

  const interceptor = getInterceptor(url);
  if (interceptor) {
    const result = await executeInterceptor(interceptor, requestParams);
    if (result !== null) {
      return createResponse(result);
    }
    if (!interceptor.after && !interceptor.error) {
      interceptor = null;
    }
  }

  // if (requestOptions.responseType === 'image' && (has('host-webworker') || has('host-node'))) {
  //   throw createRequestError(
  //     'request:invalid-parameters',
  //     new Error("responseType 'image' is not supported in Web Workers or Node environment"),
  //     requestParams
  //   );
  // }

  if (requestOptions.method === 'head') {
    if (requestOptions.body) {
      throw createRequestError(
        'request:invalid-parameters',
        new Error("body parameter cannot be set when method is 'head'"),
        requestParams
      );
    }
    if (isDataUrl || isBlobUrl) {
      throw createRequestError(
        'request:invalid-parameters',
        new Error("data and blob URLs are not supported for method 'head'"),
        requestParams
      );
    }
  }

  // await initializeWebWorkerRequest();
  if (requestExecutor) {
    return requestExecutor.execute(url, requestOptions);
  }

  const abortController = new AbortController();
  const removeAbortListener = onAbort(requestOptions, () => abortController.abort());
  const context: RequestContext = {
    controller: abortController,
    credential: undefined,
    credentialToken: null,
    fetchOptions: {},
    hasToken: false,
    interceptor,
    params: requestParams,
    redoRequest: false,
    useIdentity: !!requestConfig.useIdentity,
    useProxy: false,
    useSSL: false,
    withCredentials: false,
  };

  const requestPromise = requestOptions.useRequestQueue
    ? processRequestInQueue(context)
    : executeRequestImmediately(context);
  const response = await requestPromise.finally(() => removeAbortListener?.remove());

  if (interceptor?.after) {
    return interceptor.after(response);
  }

  return response;
}

export { request };
