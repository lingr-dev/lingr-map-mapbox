export interface LogConfig {
  level: 'none' | 'error' | 'warn' | 'info';
}

export interface RequestOptions {
  authMode?: 'auto' | 'anonymous' | 'immediate' | 'no-prompt';
  body?: FormData | HTMLFormElement | string;
  cacheBust?: boolean;
  headers?: any;
  method?: 'auto' | 'delete' | 'head' | 'post' | 'put';
  query?: any | URLSearchParams;
  responseType?: 'json' | 'text' | 'array-buffer' | 'blob' | 'image' | 'native' | 'document' | 'xml';
  signal?: AbortSignal;
  timeout?: number;
  useProxy?: boolean;
  withCredentials?: boolean;
}

export interface RequestResponse {
  data?: any;
  ssl?: boolean;
  url?: string;
  httpStatus?: number;
  requestOptions?: RequestOptions;
  getHeader?: (_headerName: string) => string;
  getAllHeaders?: () => string[][];
}

export interface RequestInterceptor {
  urls?: string | RegExp | (string | RegExp)[];
  responseData?: any;
  query?: any;
  headers?: any;
  after?: (_response: RequestResponse) => void;
  before?: (_params: any) => any;
  error?: (_error: Error) => void;
}

export interface configRequestProxyRules {
  proxyUrl?: string;
  urlPrefix?: string;
}

export interface RequestConfig {
  httpsDomains?: string[];
  internalInterceptors?: RequestInterceptor[];
  interceptors?: RequestInterceptor[];
  maxUrlLength?: number;
  priority?: 'auto' | 'high' | 'low';
  proxyRules?: configRequestProxyRules[];
  proxyUrl?: string;
  timeout?: number;
  trustedServers?: string[];
  useIdentity?: boolean;
  crossOriginNoCorsDomains?: { [_key: string]: any };
}

export interface Config {
  applicationUrl: string;
  applicationName: string;

  request: RequestConfig;
  log: LogConfig;
}

export const config = {
  applicationUrl: '',
  applicationName: '',

  request: {
    proxyUrl: undefined,
    proxyRules: [],

    priority: 'high',

    timeout: 62e3,
    maxUrlLength: 2e3,

    useIdentity: true,

    trustedServers: [],
    crossOriginNoCorsDomains: undefined,
    httpsDomains: [
      'arcgis.com',
      'arcgisonline.com',
      'esrikr.com',
      'premiumservices.blackbridge.com',
      'esripremium.accuweather.com',
      'gbm.digitalglobe.com',
      'firstlook.digitalglobe.com',
      'msi.digitalglobe.com',
    ],
    internalInterceptors: [],
    interceptors: [],
  },
  log: {
    level: 'info',
  },
};
