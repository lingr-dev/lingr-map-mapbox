/* eslint-disable */

import { config } from '../config.js';
import { isSerializable } from './JSONSupport.js';
import { AppError } from './AppError.js';

// 获取日志记录器
// const getLogger = () => Logger.getLogger("esri.core.urlUtils");
const requestConfig = config.request;
const PROXY_URL_NOT_SET_MESSAGE = 'esri/config: esriConfig.request.proxyUrl is not set.';

// 正则表达式
const protocolRegex = /^\s*[a-z][a-z0-9-+.]*:(?![0-9])/i;
const httpRegex = /^\s*http:/i;
const httpsRegex = /^\s*https:/i;
const fileRegex = /^\s*file:/i;
const portRegex = /:\d+$/;
const arcgisSharingRegex = /^https?:\/\/[^/]+\.arcgis.com\/sharing(\/|$)/i;
const urlParseRegex = new RegExp('^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?$');
const authorityParseRegex = new RegExp('^((([^[:]+):)?([^@]+)@)?(\\[([^\\]]+)\\]|([^[:]*))(:([0-9]+))?$');

// URL 解析类
class UrlParser {
  uri: string;
  scheme: string | null;
  authority: string | null;
  path: string | null;
  query: string | null;
  fragment: string | null;
  user: string | null;
  password: string | null;
  host: string | null;
  port: string | null;

  constructor(uri: string = '') {
    this.uri = uri;
    this.scheme = null;
    this.authority = null;
    this.path = null;
    this.query = null;
    this.fragment = null;
    this.user = null;
    this.password = null;
    this.host = null;
    this.port = null;

    const urlMatch = this.uri.match(urlParseRegex);
    this.scheme = urlMatch?.[2] || (urlMatch?.[1] ? '' : null);
    this.authority = urlMatch?.[4] || (urlMatch?.[3] ? '' : null);
    this.path = urlMatch?.[5] || null;
    this.query = urlMatch?.[7] || (urlMatch?.[6] ? '' : null);
    this.fragment = urlMatch?.[9] || (urlMatch?.[8] ? '' : null);

    if (this.authority !== null) {
      const authorityMatch = this.authority.match(authorityParseRegex);
      this.user = authorityMatch?.[3] || null;
      this.password = authorityMatch?.[4] || null;
      this.host = authorityMatch?.[6] || authorityMatch?.[7] || null;
      this.port = authorityMatch?.[9] || null;
    }
  }

  toString(): string {
    return this.uri;
  }
}

const trustedServersUrlCache: { [key: string]: UrlParser[] } = {};
const appUrlParser = new UrlParser(config.applicationUrl);
let currentAppUrl = appUrlParser;
let appBaseUrl = getAppBaseUrlFromAppUrl();

// 从应用 URL 获取应用基础 URL
function getAppBaseUrlFromAppUrl(): string {
  const path = currentAppUrl.path;
  const basePath = path?.slice(0, path.lastIndexOf('/') + 1) || '';
  return `${currentAppUrl.scheme}://${currentAppUrl.host}${currentAppUrl.port ? `:${currentAppUrl.port}` : ''}`;
}

// 获取当前应用 URL
function getCurrentAppUrl(): UrlParser {
  return currentAppUrl;
}

// 获取当前应用基础 URL
function getCurrentAppBaseUrl(): string {
  return appBaseUrl;
}

// URL 工具类
const urlUtils = {
  // 设置应用 URL
  setAppUrl: (url: UrlParser) => {
    currentAppUrl = url;
  },
  // 设置应用基础 URL
  setAppBaseUrl: (url: string) => {
    appBaseUrl = url;
  },
  // 恢复默认 URL
  restoreUrls: () => {
    currentAppUrl = appUrlParser;
    appBaseUrl = getAppBaseUrlFromAppUrl();
  },
};

// 解析 URL 为路径和查询参数
function parseUrlToPathAndQuery(url: string): {
  path: string | null;
  query: { [key: string]: string | string[] } | null;
  hash?: string;
} {
  if (!url) return { path: null, query: null };
  const result: {
    path: string | null;
    query: { [key: string]: string | string[] } | null;
    hash?: string;
  } = { path: null, query: null };
  const urlParser = new UrlParser(url);
  const queryIndex = url.indexOf('?');

  if (urlParser.query === null) {
    result.path = url;
  } else {
    result.path = url.slice(0, queryIndex);
    result.query = parseQueryString(urlParser.query);
  }

  if (urlParser.fragment) {
    result.hash = urlParser.fragment;
    if (urlParser.query === null) {
      result.path = result.path?.slice(0, result.path.length - (urlParser.fragment.length + 1));
    }
  }

  return result;
}

// 解析查询字符串为对象
function parseQueryString(query: string): { [key: string]: string | string[] } {
  const queryParams = query.split('&');
  const result: { [key: string]: string | string[] } = {};

  for (const param of queryParams) {
    if (!param) continue;
    const equalsIndex = param.indexOf('=');
    let key: string, value: string;

    if (equalsIndex < 0) {
      key = decodeURIComponent(param);
      value = '';
    } else {
      key = decodeURIComponent(param.slice(0, equalsIndex));
      value = decodeURIComponent(param.slice(equalsIndex + 1));
    }

    if (typeof result[key] === 'string') {
      result[key] = [result[key] as string, value];
    } else if (Array.isArray(result[key])) {
      (result[key] as string[]).push(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// 将对象转换为查询字符串
function objectToQueryString(
  obj: { [key: string]: any },
  transformers?: { [key: string]: (value: any) => string }
): string {
  if (!obj) return '';

  return Object.keys(obj)
    .map((key) => {
      const value = obj[key];
      if (value === null) return '';

      const keyEncoded = encodeURIComponent(key) + '=';
      const transformer = transformers?.[key];

      if (transformer) {
        return keyEncoded + encodeURIComponent(transformer(value));
      } else if (Array.isArray(value)) {
        return value
          .map((item) => {
            if (isSerializable(item)) {
              return keyEncoded + encodeURIComponent(JSON.stringify(item));
            } else {
              return keyEncoded + encodeURIComponent(item);
            }
          })
          .join('&');
      } else if (isSerializable(value)) {
        return keyEncoded + encodeURIComponent(JSON.stringify(value));
      } else {
        return keyEncoded + encodeURIComponent(value);
      }
    })
    .filter((item) => item)
    .join('&');
}

// 获取代理 URL
function getProxyUrl(useHttps: boolean = false): {
  path: string | null;
  query: { [key: string]: string | string[] } | null;
} {
  let isHttps: boolean;
  let proxyUrl: string | null = requestConfig.proxyUrl;

  if (typeof useHttps === 'string') {
    isHttps = isHttpsProtocol(useHttps);
    const proxyRule = getProxyRule(useHttps);
    if (proxyRule) {
      proxyUrl = proxyRule.proxyUrl;
    }
  } else {
    isHttps = useHttps;
  }

  if (!proxyUrl) {
    // getLogger().warn(PROXY_URL_NOT_SET_MESSAGE);
    throw new AppError('urlUtils:proxy-not-set', PROXY_URL_NOT_SET_MESSAGE);
  }

  if (isHttps && isAppHttps()) {
    proxyUrl = convertToHttps(proxyUrl);
  }

  return parseUrlToPathAndQuery(proxyUrl);
}

// 为 URL 添加代理
function addProxyToUrl(url: string, useProxy: boolean = false): string {
  const proxyRule = getProxyRule(url);
  let proxyPath: string | null = null;
  let proxyQuery: { [key: string]: string | string[] } | null = null;

  if (proxyRule) {
    const parsedProxy = parseUrlToPathAndQuery(proxyRule.proxyUrl);
    proxyPath = parsedProxy.path;
    proxyQuery = parsedProxy.query;
  } else if (useProxy) {
    const proxyInfo = getProxyUrl(url);
    proxyPath = proxyInfo.path;
    proxyQuery = proxyInfo.query;
  }

  if (proxyPath) {
    const parsedUrl = parseUrlToPathAndQuery(url);
    let newUrl = proxyPath + '?' + parsedUrl.path;
    const combinedQuery = objectToQueryString({ ...proxyQuery, ...parsedUrl.query });

    if (combinedQuery) {
      newUrl += `?${combinedQuery}`;
    }

    return newUrl;
  }

  return url;
}

// 解析代理 URL 为路径和查询参数
function parseProxyUrl(proxyUrl: string): { path: string; query: string | null } {
  const queryIndex = proxyUrl.indexOf('?');
  if (queryIndex !== -1) {
    return {
      path: proxyUrl.slice(0, queryIndex),
      query: proxyUrl.slice(queryIndex + 1),
    };
  } else {
    return {
      path: proxyUrl,
      query: null,
    };
  }
}

// 规范化 URL 前缀
function normalizeUrlPrefix(url: string): string {
  let result = parseProxyUrl(url).path;
  result = ensureTrailingSlash(result);
  result = removeProtocolAndDoubleSlashes(result, true);
  return result.toLowerCase();
}

// 添加代理规则
function addProxyRule(rule: { proxyUrl: string; urlPrefix: string }): number {
  const normalizedRule = {
    proxyUrl: rule.proxyUrl,
    urlPrefix: normalizeUrlPrefix(rule.urlPrefix),
  };
  const proxyRules: any[] = requestConfig.proxyRules;
  const prefix = normalizedRule.urlPrefix;
  let insertIndex = proxyRules.length;

  for (let i = 0; i < proxyRules.length; i++) {
    const existingPrefix = proxyRules[i].urlPrefix;
    if (prefix.indexOf(existingPrefix) === 0) {
      if (prefix.length === existingPrefix.length) {
        return -1;
      }
      insertIndex = i;
      break;
    }
    if (existingPrefix.indexOf(prefix) === 0) {
      insertIndex = i + 1;
    }
  }

  proxyRules.splice(insertIndex, 0, normalizedRule);
  return insertIndex;
}

// 获取代理规则
function getProxyRule(url: string): { proxyUrl: string; urlPrefix: string } | undefined {
  const proxyRules: any[] = requestConfig.proxyRules;
  const normalizedUrl = normalizeUrlPrefix(url);

  for (let i = 0; i < proxyRules.length; i++) {
    if (normalizedUrl.indexOf(proxyRules[i].urlPrefix) === 0) {
      return proxyRules[i];
    }
  }

  return undefined;
}

// 判断两个 URL 是否属于同一个规范的 ArcGIS Online 门户
function hasSameCanonicalArcGISOnlinePortal(url1: string, url2: string): boolean {
  if (!url1 || !url2) return false;
  const parsedUrl1 = normalizeUrl(url1);
  const parsedUrl2 = normalizeUrl(url2);
  const portal1 = parseKnownArcGISOnlineDomain(parsedUrl1);
  const portal2 = parseKnownArcGISOnlineDomain(parsedUrl2);

  if (portal1 && portal2) {
    return portal1.portalHostname === portal2.portalHostname;
  } else {
    return !portal1 && !portal2 && hasSameOrigin(parsedUrl1, parsedUrl2, true);
  }
}

// 判断两个 URL 是否属于同一个规范的门户
function hasSameCanonicalPortal(url1: string, url2: string): boolean {
  if (!url1 || !url2) return false;
  const parsedUrl1 = normalizeUrl(url1);
  const parsedUrl2 = normalizeUrl(url2);
  const portal1 = parseKnownArcGISOnlineDomain(parsedUrl1);
  const portal2 = parseKnownArcGISOnlineDomain(parsedUrl2);

  return portal1 && portal2 && portal1.portalHostname === portal2.portalHostname;
}

// 判断两个 URL 是否具有相同的门户
function hasSamePortal(url1: string, url2: string): boolean {
  const parsedUrl1 = normalizeUrl(url1);
  const parsedUrl2 = normalizeUrl(url2);
  return removeProtocolAndDoubleSlashes(parsedUrl1) === removeProtocolAndDoubleSlashes(parsedUrl2);
}

// 规范化 URL
function normalizeUrl(url: string): string {
  let result = url.trim();
  result = makeAbsoluteUrl(result);
  result = removeDoubleSlashesInPath(result);
  result = replaceArcgisComWithWww(result);
  result = upgradeHttpToHttpsIfNeeded(result);
  return result;
}

// 获取拦截器
function getInterceptor(url: string, interceptors: any[] = requestConfig.interceptors): any {
  const matchUrl = (pattern: any) => {
    return (
      pattern === null ||
      (pattern instanceof RegExp && pattern.test(url)) ||
      (typeof pattern === 'string' && url.startsWith(pattern))
    );
  };

  if (interceptors) {
    for (const interceptor of interceptors) {
      if (Array.isArray(interceptor.urls)) {
        if (interceptor.urls.some(matchUrl)) {
          return interceptor;
        }
      } else if (matchUrl(interceptor.urls)) {
        return interceptor;
      }
    }
  }

  return null;
}

// 判断两个 URL 是否具有相同的源
function hasSameOrigin(url1: string | UrlParser, url2: string | UrlParser, ignoreScheme: boolean = false): boolean {
  if (!url1 || !url2) return false;
  const parsedUrl1 = typeof url1 === 'string' ? new UrlParser(makeAbsoluteUrl(url1)) : url1;
  const parsedUrl2 = typeof url2 === 'string' ? new UrlParser(makeAbsoluteUrl(url2)) : url2;

  if (!ignoreScheme && parsedUrl1.scheme !== parsedUrl2.scheme) {
    return false;
  }

  return (
    parsedUrl1.host !== null &&
    parsedUrl2.host !== null &&
    parsedUrl1.host.toLowerCase() === parsedUrl2.host.toLowerCase() &&
    parsedUrl1.port === parsedUrl2.port
  );
}

// 判断 URL 是否为受信任的服务器
function isTrustedServer(url: string | UrlParser): boolean {
  if (typeof url === 'string') {
    if (!isAbsoluteUrl(url)) return true;
    url = new UrlParser(makeAbsoluteUrl(url));
  }

  if (hasSameOrigin(url, currentAppUrl)) return true;

  const trustedServers = requestConfig.trustedServers || [];
  for (const server of trustedServers) {
    const parsedServers = getParsedServers(server);
    for (const parsedServer of parsedServers) {
      if (hasSameOrigin(url, parsedServer)) return true;
    }
  }

  return false;
}

// 获取解析后的服务器 URL
function getParsedServers(server: string): UrlParser[] {
  if (!trustedServersUrlCache[server]) {
    if (isProtocolRelative(server) || hasProtocol(server)) {
      trustedServersUrlCache[server] = [new UrlParser(makeAbsoluteUrl(server))];
    } else {
      trustedServersUrlCache[server] = [new UrlParser(`http://${server}`), new UrlParser(`https://${server}`)];
    }
  }
  return trustedServersUrlCache[server];
}

// 生成绝对 URL
function makeAbsoluteUrl(
  url: string,
  baseUrl: string = appBaseUrl,
  options?: { preserveProtocolRelative?: boolean }
): string {
  if (isProtocolRelative(url)) {
    if (options?.preserveProtocolRelative) {
      return url;
    } else if (currentAppUrl.scheme === 'http' && currentAppUrl.authority === getOrigin(url)?.slice(2)) {
      return `http:${url}`;
    } else {
      return `https:${url}`;
    }
  } else if (hasProtocol(url)) {
    return url;
  } else {
    return joinUrls(url.startsWith('/') ? getBasePathFromUrl(baseUrl) : baseUrl, url);
  }
}

// 生成相对 URL
function makeRelativeUrl(url: string, baseUrl: string = appBaseUrl, rootUrl?: string): string {
  if (url === null || !isAbsoluteUrl(url)) return url;
  const normalizedUrl = normalizeUrl(url);
  const normalizedBaseUrl = normalizeUrl(baseUrl).replace(/\/+$/, '');
  const normalizedRootUrl = rootUrl ? normalizeUrl(rootUrl).replace(/\/+$/, '') : null;

  if (normalizedRootUrl && normalizedBaseUrl.indexOf(normalizedRootUrl) !== 0) {
    return url;
  }

  const findIndex = (str: string, substr: string, start: number) => {
    const index = str.indexOf(substr, start);
    return index === -1 ? str.length : index;
  };

  let index = findIndex(normalizedUrl.toLowerCase(), '/', normalizedUrl.indexOf('//') + 2);
  let lastMatchIndex = -1;

  while (
    normalizedUrl.slice(0, index + 1) === normalizedBaseUrl.slice(0, index) + '/' &&
    (lastMatchIndex = index + 1) &&
    index !== normalizedUrl.length
  ) {
    index = findIndex(normalizedUrl.toLowerCase(), '/', index + 1);
  }

  if (lastMatchIndex === -1) return url;
  if (normalizedRootUrl && lastMatchIndex < normalizedRootUrl.length) return url;

  let relativePath = normalizedUrl.slice(lastMatchIndex);
  const levelsUp = normalizedBaseUrl.slice(lastMatchIndex - 1).replaceAll(/[^/]+/g, '').length;

  if (levelsUp > 0) {
    for (let i = 0; i < levelsUp; i++) {
      relativePath = `../${relativePath}`;
    }
  } else {
    relativePath = `./${relativePath}`;
  }

  return relativePath;
}

// 拼接 URL
function joinUrls(...parts: string[]): string {
  const validParts = parts.filter((p) => null != p);
  if (!validParts.length) return '';

  const resultParts: string[] = [];
  if (isAbsoluteUrl(validParts[0])) {
    const firstPart = validParts[0];
    const protocolIndex = firstPart.indexOf('//');
    if (protocolIndex !== -1) {
      resultParts.push(firstPart.slice(0, protocolIndex + 1));
      if (isFileProtocol(firstPart)) {
        resultParts[0] += '/';
      }
      validParts[0] = firstPart.slice(protocolIndex + 2);
    }
  } else if (validParts[0].startsWith('/')) {
    resultParts.push('');
  }

  const allParts = validParts.reduce((acc, part) => acc.concat(part.split('/')), [] as string[]);

  for (let i = 0; i < allParts.length; i++) {
    const part = allParts[i];
    if (part === '..') {
      if (resultParts.length > 0 && resultParts[resultParts.length - 1] !== '..') {
        resultParts.pop();
      }
    } else if ((!part && i === allParts.length - 1) || (part && (part !== '.' || resultParts.length === 0))) {
      resultParts.push(part);
    }
  }

  return resultParts.join('/');
}

// 获取 URL 的源
function getOrigin(url: string, normalize: boolean = false): string | null {
  if (url === null || isBlobProtocol(url) || isDataProtocol(url)) return null;
  let protocolIndex = url.indexOf('://');
  if (protocolIndex === -1 && isProtocolRelative(url)) {
    protocolIndex = 2;
  } else if (protocolIndex === -1) {
    return null;
  } else {
    protocolIndex += 3;
  }

  const pathIndex = url.indexOf('/', protocolIndex);
  if (pathIndex !== -1) {
    url = url.slice(0, pathIndex);
  }

  if (normalize) {
    url = removeProtocolAndDoubleSlashes(url, true);
  }

  return url;
}

// 判断 URL 是否为绝对 URL
function isAbsoluteUrl(url: string): boolean {
  return isProtocolRelative(url) || hasProtocol(url);
}

// 判断 URL 是否为 Blob 协议
function isBlobProtocol(url: string): boolean {
  return url !== null && url.slice(0, 5) === 'blob:';
}

// 判断 URL 是否为 Data 协议
function isDataProtocol(url: string): boolean {
  return url !== null && url.slice(0, 5) === 'data:';
}

function isFileProtocol(url: string): boolean {
  return url !== null && fileRegex.test(url);
}

// 将 Data URL 转换为 ArrayBuffer
function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer | null {
  const components = dataUrlComponents(dataUrl);
  return components?.isBase64 ? base64ToArrayBuffer(components.data) : null;
}

// 对 Base64 编码的 URL 进行编码
function base64UrlEncode(buffer: ArrayBuffer): string {
  return arrayBufferToBase64(buffer).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

// 解析 Data URL 组件
function dataUrlComponents(dataUrl: string): { mediaType: string; isBase64: boolean; data: string } | null {
  const match = dataUrl.match(/^data:(.*?)(;base64)?,(.*)$/);
  if (!match) return null;

  const [, mediaType, isBase64Str, data] = match;
  return {
    mediaType,
    isBase64: !!isBase64Str,
    data,
  };
}

// 将 Data URL 转换为 Blob
function dataUrlToBlob(dataUrl: string): Blob | null {
  const arrayBuffer = dataUrlToArrayBuffer(dataUrl);
  if (!arrayBuffer) return null;

  const components = dataUrlComponents(dataUrl);
  return new Blob([arrayBuffer], { type: components!.mediaType });
}

// 下载 Blob 为文件
function downloadBlobAsFile(blob: Blob, filename: string): boolean {
  if (!blob) return false;
  const link = document.createElement('a');
  if (!('download' in link)) return false;

  const url = URL.createObjectURL(blob);
  link.download = filename;
  link.href = url;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

// 下载 Data URL 为文件
function downloadDataUrlAsFile(dataUrl: string, filename: string): void {
  const blob = dataUrlToBlob(dataUrl);
  if (blob) {
    downloadBlobAsFile(blob, filename);
  }
}

// 确保 URL 有尾随斜杠
function ensureTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

// 移除 URL 的尾随斜杠
function removeTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

// 判断 URL 是否具有协议
function hasProtocol(url: string): boolean {
  return protocolRegex.test(url);
}

// 判断 URL 是否为 HTTPS 协议
function isHttpsProtocol(url: string): boolean {
  return httpsRegex.test(url) || (currentAppUrl.scheme === 'https' && isProtocolRelative(url));
}

// 判断 URL 是否为协议相对 URL
function isProtocolRelative(url: string): boolean {
  return url !== null && url[0] === '/' && url[1] === '/';
}

// 判断应用是否使用 HTTPS
function isAppHttps(): boolean {
  return currentAppUrl.scheme === 'https';
}

// 将 URL 转换为 HTTP 协议
function convertToHttp(url: string): string {
  return isProtocolRelative(url) ? `http:${url}` : url.replace(httpsRegex, 'http:');
}

// 将 URL 转换为 HTTPS 协议
function convertToHttps(url: string): string {
  return isProtocolRelative(url) ? `https:${url}` : url.replace(httpRegex, 'https:');
}

// 移除协议和双斜杠
function removeProtocolAndDoubleSlashes(url: string, normalize: boolean = false): string {
  if (isProtocolRelative(url)) {
    return url.slice(2);
  } else {
    url = url.replace(protocolRegex, '');
    if (normalize && url.length > 1 && url[0] === '/' && url[1] === '/') {
      url = url.slice(2);
    }
    return url;
  }
}

// 获取 URL 的基础路径
function getBasePathFromUrl(url: string): string {
  const protocolIndex = url.indexOf('//');
  const pathIndex = url.indexOf('/', protocolIndex + 2);
  return pathIndex === -1 ? url : url.slice(0, pathIndex);
}

// 移除路径中的双斜杠
function removeDoubleSlashesInPath(url: string): string {
  const parsedUrl = parseUrlToPathAndQuery(url);
  let path = parsedUrl.path?.replaceAll(/\/{2,}/g, '/').replace('/', '//') || '';
  if (parsedUrl.query) {
    path += `?${parsedUrl.query}`;
  }
  return path;
}

// 替换 arcgis.com 为 www.arcgis.com
function replaceArcgisComWithWww(url: string): string {
  return url.replace(/^(https?:\/\/)(arcgis\.com)/i, '$1www.$2');
}

// 根据配置将 HTTP 升级为 HTTPS
function upgradeHttpToHttpsIfNeeded(url: string): string {
  if (!isHttpProtocol(url)) return url;

  const pathIndex = url.indexOf('/', 7);
  let host = pathIndex === -1 ? url : url.slice(0, pathIndex);
  host = host.toLowerCase().slice(7);

  if (portRegex.test(host)) {
    if (!host.endsWith(':80')) return url;
    host = host.slice(0, -3);
    url = url.replace(':80', '');
  }

  if (
    (isAppHttp() && host === currentAppUrl.authority && !arcgisSharingRegex.test(url)) ||
    (isAppHttps() && host === currentAppUrl.authority) ||
    requestConfig.httpsDomains?.some((domain: string) => host === domain || host.endsWith(`.${domain}`)) ||
    (isAppHttps() && !getProxyRule(url))
  ) {
    return convertToHttps(url);
  }

  return url;
}

// 判断 URL 是否为 HTTP 协议
function isHttpProtocol(url: string): boolean {
  return httpRegex.test(url) || (currentAppUrl.scheme === 'http' && isProtocolRelative(url));
}

// 判断应用是否使用 HTTP
function isAppHttp(): boolean {
  return currentAppUrl.scheme === 'http';
}

// 更改 URL 的域名
function changeDomain(url: string, oldDomain: string, newDomain: string): string {
  if (!(oldDomain && newDomain && url && isAbsoluteUrl(url))) return url;
  const protocolIndex = url.indexOf('//');
  const pathIndex = url.indexOf('/', protocolIndex + 2);
  const portIndex = url.indexOf(':', protocolIndex + 2);
  const endIndex = Math.min(pathIndex < 0 ? url.length : pathIndex, portIndex < 0 ? url.length : portIndex);

  if (url.slice(protocolIndex + 2, endIndex).toLowerCase() !== oldDomain.toLowerCase()) return url;

  return `${url.slice(0, protocolIndex + 2)}${newDomain}${url.slice(endIndex)}`;
}

// 判断 URL 是否为 SVG
function isSvg(url: string): boolean {
  const svgRegex = /(^data:image\/svg|\.svg$)/i;
  return svgRegex.test(url);
}

// 移除 URL 的查询参数
function removeQueryParameters(url: string, logger?: any): string {
  const parsedUrl = parseUrlToPathAndQuery(url);
  const queryKeys = Object.keys(parsedUrl.query || {});

  if (queryKeys.length > 0 && logger) {
    logger.warn(
      'removeQueryParameters()',
      `Url query parameters are not supported, the following parameters have been removed: ${queryKeys.join(', ')}.`
    );
  }

  return parsedUrl.path || '';
}

// 为 URL 添加查询参数
function addQueryParameter(url: string, key: string, value: any): string {
  const parsedUrl = parseUrlToPathAndQuery(url);
  const query = parsedUrl.query || {};
  query[key] = String(value);
  const queryString = objectToQueryString(query);
  return `${parsedUrl.path}?${queryString}`;
}

// 为 URL 添加多个查询参数
function addQueryParameters(url: string, params: { [key: string]: any }): string {
  if (!params) return url;
  const parsedUrl = parseUrlToPathAndQuery(url);
  const query = parsedUrl.query || {};

  for (const [key, value] of Object.entries(params)) {
    if (value !== null) {
      query[key] = value;
    }
  }

  const queryString = objectToQueryString(query);
  return queryString ? `${parsedUrl.path}?${queryString}` : parsedUrl.path || '';
}

// 移除 URL 中的指定查询参数
function removeQueryParameter(url: string, key: string): string {
  const parsedUrl = parseUrlToPathAndQuery(url);
  if (!parsedUrl.query) return url;

  delete parsedUrl.query[key];
  const queryString = objectToQueryString(parsedUrl.query);
  return queryString ? `${parsedUrl.path}?${queryString}` : parsedUrl.path || '';
}

// 获取 URL 的文件名
function getFilename(url: string, extensions?: string[]): string {
  if (!url) return '';
  const path = parseUrlToPathAndQuery(url).path?.replace(/\/+$/, '') || '';
  const filename = path.slice(path.lastIndexOf('/') + 1);

  if (!extensions?.length) return filename;

  const extensionRegex = new RegExp(`\\.(${extensions.join('|')})$`, 'i');
  return filename.replace(extensionRegex, '');
}

// 获取 URL 的路径扩展名
function getPathExtension(url: string): string | null {
  if (url === null) return null;
  const match = url.match(/([^.]*)\.([^/]*)$/);
  return match ? match[2] : null;
}

// 拆分 URL 的路径和扩展名
function splitPathExtension(url: string): { path: string; extension: string | null } {
  if (url === null) return { path: '', extension: null };
  const match = url.match(/([^.]*)\.([^/]*)$/);
  return match ? { path: match[1], extension: match[2] } : { path: url, extension: null };
}

// 解析 Data URL 或 File 对象
async function parseData(data: string | File): Promise<{ mediaType: string; isBase64: boolean; data: string }> {
  if (typeof data === 'string') {
    return dataUrlComponents(data) || { data, mediaType: '', isBase64: false };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(data);
    reader.onload = () => {
      const components = dataUrlComponents(reader.result as string);
      if (components) {
        resolve(components);
      } else {
        reject(new Error('Failed to parse data'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

// 从 Blob URL 获取 Blob 对象
async function blobUrlToBlob(url: string): Promise<Blob> {
  return (await fetch(url)).blob();
}

// 生成 Data URL
function makeDataUrl(components: { mediaType: string; isBase64: boolean; data: string }): string {
  return components.isBase64
    ? `data:${components.mediaType};base64,${components.data}`
    : `data:${components.mediaType},${components.data}`;
}

// 移除文件路径
function removeFilePath(url: string): string {
  let startIndex = 0;
  if (isAbsoluteUrl(url)) {
    const protocolIndex = url.indexOf('//');
    if (protocolIndex !== -1) {
      startIndex = protocolIndex + 2;
    }
  }
  const lastSlashIndex = url.lastIndexOf('/');
  return lastSlashIndex < startIndex ? url : url.slice(0, lastSlashIndex + 1);
}

// 测试函数
const testFunctions = {
  setAppUrl: urlUtils.setAppUrl,
  setAppBaseUrl: urlUtils.setAppBaseUrl,
  restoreUrls: urlUtils.restoreUrls,
};

export {
  UrlParser as Url,
  addProxyToUrl as addProxy,
  addProxyRule,
  addQueryParameter,
  addQueryParameters,
  base64UrlEncode,
  blobUrlToBlob,
  changeDomain,
  dataUrlComponents as dataComponents,
  dataUrlToArrayBuffer as dataToArrayBuffer,
  dataUrlToBlob as dataToBlob,
  downloadBlobAsFile,
  downloadDataUrlAsFile,
  ensureTrailingSlash,
  getCurrentAppBaseUrl as getAppBaseUrl,
  getCurrentAppUrl as getAppUrl,
  getFilename,
  getInterceptor,
  getOrigin,
  getPathExtension,
  getProxyRule,
  getProxyUrl,
  hasProtocol,
  hasSameCanonicalArcGISOnlinePortal,
  hasSameCanonicalPortal,
  hasSameOrigin,
  hasSamePortal,
  isAbsoluteUrl as isAbsolute,
  isAppHttps,
  isBlobProtocol,
  isDataProtocol,
  isHttpsProtocol,
  isProtocolRelative,
  isSvg,
  isTrustedServer,
  joinUrls as join,
  makeAbsoluteUrl as makeAbsolute,
  makeDataUrl as makeData,
  makeRelativeUrl as makeRelative,
  normalizeUrl as normalize,
  objectToQueryString as objectToQuery,
  parseData,
  parseQueryString as queryToObject,
  removeFilePath as removeFile,
  removeQueryParameter,
  removeQueryParameters,
  removeTrailingSlash,
  splitPathExtension,
  testFunctions as test,
  convertToHttp as toHTTP,
  convertToHttps as toHTTPS,
  trustedServersUrlCache,
  parseUrlToPathAndQuery as urlToObject,
};
