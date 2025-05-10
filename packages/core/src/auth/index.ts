export interface BaseAuthInfoOptions {
  server: string;
  currentVersion: string;
  owningSystemUrl?: string;
  owningTenant?: string;
  shortLivedTokenValidity?: number;

  tokenServiceUrl?: string;
  adminTokenServiceUrl?: string;

  webTierAuth?: string;
}

export class BaseAuthInfo {
  server: string | null;

  owningSystemUrl: string | null;
  owningTenant: string | null;

  currentVersion: string | null;
  shortLivedTokenValidity: number | null;
  tokenServiceUrl: string | null;
  adminTokenServiceUrl: string | null;

  webTierAuth: string | null;

  static EMPTY = new BaseAuthInfo({ server: 'unknown', currentVersion: 'unknown', owningSystemUrl: 'unknown' });

  constructor({
    server,
    currentVersion,
    tokenServiceUrl,
    adminTokenServiceUrl,
    shortLivedTokenValidity,
    owningSystemUrl,
    owningTenant,
    webTierAuth,
  }: BaseAuthInfoOptions) {
    this.server = server;
    this.owningSystemUrl = owningSystemUrl || null;
    this.owningTenant = owningTenant || null;

    this.currentVersion = currentVersion;
    this.shortLivedTokenValidity = shortLivedTokenValidity || -1;
    this.tokenServiceUrl = tokenServiceUrl || null;
    this.adminTokenServiceUrl = adminTokenServiceUrl || null;
    this.webTierAuth = webTierAuth || null;
  }

  refreshToken(): Promise<null | string> {
    return Promise.resolve(null);
  }

  validate(token: string): Promise<boolean> {
    return Promise.resolve(!!token);
  }
}
