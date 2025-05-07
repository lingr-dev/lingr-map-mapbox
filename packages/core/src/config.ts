export const config = {
  applicationUrl: '',

  request: {
    proxyUrl: null,
    proxyRules: [],

    priority: 'high',

    timeout: 62e3,
    maxUrlLength: 2e3,

    useIdentity: true,

    trustedServers: [],
    crossOriginNoCorsDomains: null,
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
    level: null,
  },
};
