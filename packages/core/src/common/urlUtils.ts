/* eslint-disable */

import { requestConfig } from '../config.js';
import { isSerializable } from './JSONSupport.js';

const trustedServersUrlCache = {};
const regUrl = new RegExp('^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?$');
const regAuth = new RegExp('^((([^[:]+):)?([^@]+)@)?(\\[([^\\]]+)\\]|([^[:]*))(:([0-9]+))?$');
const regProtocol = /^\s*[a-z][a-z0-9-+.]*:(?![0-9])/i;
const regHttp = /^\s*http:/i;
const regHttps = /^\s*https:/i;

export class Url {
  uri: string = '';
  scheme: string | null;
  authority: string | null;
  path: string | null;
  query: string | null;
  fragment: string | null;
  user: string | null;
  password: string | null;
  host: string | null;
  port: string | number | null;

  constructor(t = '') {
    this.uri = t;
    this.scheme = null;
    this.authority = null;
    this.path = null;
    this.query = null;
    this.fragment = null;
    this.user = null;
    this.password = null;
    this.host = null;
    this.port = null;

    let uriSegs = this.uri.match(regUrl);
    this.scheme = uriSegs![2] || (uriSegs![1] ? '' : null);

    this.authority = uriSegs![4] || (uriSegs![3] ? '' : null);
    this.path = uriSegs![5];
    this.query = uriSegs![7] || (uriSegs![6] ? '' : null);
    this.fragment = uriSegs![9] || (uriSegs![8] ? '' : null);

    if (null != this.authority) {
      uriSegs = this.authority.match(regAuth);
      this.user = uriSegs![3] || null;
      this.password = uriSegs![4] || null;
      this.host = uriSegs![6] || uriSegs![7];
      this.port = uriSegs![9] || null;
    }
  }

  toString() {
    return this.uri;
  }
}

const applicationUrl = new Url(requestConfig.applicationUrl);
let runtimeUrl = applicationUrl;

export const getAppUrl = () => runtimeUrl;

export function isBlobUrl(url: string | null) {
  return null != url && 'blob:' === url.slice(0, 5);
}

export function isDataUrl(url: string | null) {
  return null != url && 'data:' === url.slice(0, 5);
}

export function isHTTPSProtocol(url: string | null) {
  return (null != url && regHttps.test(url)) || ('https' === runtimeUrl.scheme && isProtocolRelative(url));
}

export function isProtocolRelative(url: string | null) {
  return null != url && /^\s*[a-z][a-z0-9-+.]*:(?![0-9])/i.test(url);
}

export function hasProtocol(url: string | null) {
  return null != url && '/' === url[0] && '/' === url[1];
}

export function isAbsolute(url: string | null) {
  return isProtocolRelative(url) || hasProtocol(url);
}

export function isAppHTTPS() {
  return 'https' === runtimeUrl.scheme;
}

export function makeAbsolute(url: string | null) {}

function extractUrlHost(url: string, stripProtocol = false) {
  if (isProtocolRelative(url)) return url.slice(2);

  const protocol = url.replace(regProtocol, '');
  if (stripProtocol && protocol.length > 1 && '/' === protocol[0] && '/' === protocol[1]) {
    protocol.slice(2);
  }

  return protocol;
}

export function getOrigin(url: string | null, stripProtocol = false) {
  if (null == url || isBlobUrl(url) || isDataUrl(url)) return null;
  let i = url.indexOf('://');
  if (-1 === i && isProtocolRelative(url)) {
    i = 2;
  } else {
    if (-1 === i) {
      return null;
    }

    i += 3;
  }

  const firstSlash = url.indexOf('/', i);
  let origin = '';
  if (-1 !== firstSlash) {
    origin = url.slice(0, firstSlash);
  }
  if (stripProtocol) {
    origin = extractUrlHost(origin, true);
  }

  return origin;
}

export function hasSameOrigin(source: string | null, target: string | null, ignoreScheme = !1) {
  if (!source || !target) return false;

  const sourceUrl = toUriObject(source);
  const targetUrl = toUriObject(target);

  return (
    !ignoreScheme &&
    sourceUrl.scheme !== targetUrl.scheme &&
    sourceUrl.host != null &&
    targetUrl.host != null &&
    sourceUrl.host.toLowerCase() === targetUrl.host.toLowerCase() &&
    sourceUrl.port === targetUrl.port
  );
}

function toUriObject(url: string) {
  if ('string' === typeof url) {
    return new Url(makeAbsolute(url));
  }

  if (!url.scheme) {
    url.scheme = runtimeUrl.scheme;
  }

  return url;
}

export function addQueryParameters(url, query) {
  if (!query) return url;

  const urlObj = urlToObject(url);
  const urlQuery = urlObj.query || {};
  for (const [qKey, qValue] of Object.entries(query)) {
    if (null != qValue) {
      urlQuery[qKey] = qValue;
    }
  }
  const queryString = objectToQuery(urlQuery);
  return queryString ? `${urlObj.path}?${queryString}` : urlObj.path;
}

function addTrustedServerUrlCache(trustedServer) {
  if (!trustedServersUrlCache[trustedServer]) {
    if (hasProtocol(trustedServer) || isProtocolRelative(trustedServer)) {
      trustedServersUrlCache[trustedServer] = [new Url(makeAbsolute(trustedServer))];
    } else {
      trustedServersUrlCache[trustedServer] = [new Url(`http://${trustedServer}`), new Url(`https://${trustedServer}`)];
    }
  }

  return trustedServersUrlCache[trustedServer];
}

export function isTrustedServer(url) {
  let urlObj;
  if (typeof url === 'string') {
    if (!isAbsolute(url)) return true;

    urlObj = toUriObject(url);
  }

  if (hasSameOrigin(urlObj, runtimeUrl)) return true;
  const trustedServers = requestConfig.trustedServers || [];
  for (let e = 0; e < trustedServers.length; e++) {
    const serverUrls = addTrustedServerUrlCache(trustedServers[e]);
    for (let n = 0; n < serverUrls.length; n++) {
      if (hasSameOrigin(urlObj, serverUrls[n])) return true;
    }
  }
}

export function normalize(url) {
  // TODO:
  return url;
}

export function queryToObject(query) {
  const params = query.split('&');
  const queryObject = {};

  for (const p of params) {
    if (!p) continue;

    const i = p.indexOf('=');
    let key, value;

    if (i < 0) {
      key = decodeURIComponent(p);
      value = '';
    } else {
      key = decodeURIComponent(p.slice(0, i));
      value = decodeURIComponent(p.slice(i + 1));
    }

    let q = queryObject[key];
    if (typeof q === 'string') {
      q = queryObject[key] = [q];
    }

    if (Array.isArray(q)) {
      q.push(value);
    } else {
      queryObject[key] = value;
    }
  }

  return queryObject;
}

export function objectToQuery(o, encodeValue) {
  if (o) {
    if (encodeValue && 'function' === typeof encodeValue) {
      return Object.keys(o)
        .map((key) => {
          return encodeURIComponent(key) + '=' + encodeURIComponent(encodeValue(key, o[key]));
        })
        .join('&');
    } else {
      return Object.keys(o)
        .map((key) => {
          const value = o[key];
          if (null == value) return '';
          const qKey = encodeURIComponent(key) + '=';
          const qValue = encodeValue?.[key];
          if (qValue) {
            return qKey + encodeURIComponent(qValue(value));
          }

          if (Array.isArray(value)) {
            return value
              .map((v) => {
                if (isSerializable(v)) {
                  return qKey + encodeURIComponent(JSON.stringify(v));
                } else {
                  return qKey + encodeURIComponent(v);
                }
              })
              .join('&');
          } else {
            return isSerializable(value)
              ? qKey + encodeURIComponent(JSON.stringify(value))
              : qKey + encodeURIComponent(value);
          }
        })
        .filter((t) => t)
        .join('&');
    }
  }

  return '';
}

export function urlToObject(url) {
  if (!url) return null;
  const urlObj = {
    path: null,
    query: null,
  };
  const oUrl = new Url(url);
  const qIndex = url.indexOf('?');
  if (oUrl.query === null) {
    urlObj.path = url;
  } else {
    urlObj.path = url.slice(0, qIndex);
    urlObj.query = queryToObject(oUrl.query);
  }
  if (oUrl.fragment) {
    oUrl.hash = oUrl.fragment;
    if (null === oUrl.query) {
      urlObj.path = urlObj.path.slice(0, urlObj.path.length - (oUrl.fragment.length + 1));
    }
  }

  return urlObj;
}

export function toHttp(url) {
  return isProtocolRelative(url) ? `http:${url}` : url.replace(regHttps, 'http:');
}

export function toHttps(url) {
  return isProtocolRelative(url) ? `https:${url}` : url.replace(regHttp, 'https:');
}

function dtorUrlPathAndQuery(url) {}

function normalizeUrlForProxy(url) {}

export function getProxyRule(url) {
  const proxyRules = requestConfig.proxyRules;
  const normalUrl = normalizeUrlForProxy(url);
  for (let r = 0; r < proxyRules.length; r++) {
    if (0 === normalUrl.indexOf(proxyRules[r].urlPrefix)) {
      return proxyRules[r];
    }
  }
}

export function getProxyUrl(exactUrl = false) {
  let isHttps;
  let proxyUrl = requestConfig.proxyUrl;
  if ('string' === typeof exactUrl) {
    isHttps = isHTTPSProtocol(exactUrl);
    const proxyRules = getProxyRule(exactUrl);
    if (proxyRules) {
      proxyUrl = proxyRules.proxyUrl;
    }
  } else {
    isHttps = !!exactUrl;
  }
  if (!proxyUrl) {
    throw new Error('urlUtils:proxy-not-set');
  }

  if (isHttps && isAppHTTPS()) {
    proxyUrl = toHttps(proxyUrl);
  }

  return urlToObject(proxyUrl);
}

export function isSecureProxyService(url) {
  return /\/(sharing|usrsvcs)\/(appservices|servers)\//i.test(url);
}
