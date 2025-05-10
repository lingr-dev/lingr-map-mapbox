import { nanoid } from 'nanoid';
import type { BaseAuthInfo } from './index.ts';

export type IdentityOrigin = 'arcgis' | 'mapbox' | 'geoserver';
export type IdentityHost = 'online' | 'enterprise';
export type IdentityMode = 'manual' | 'auto';

export type IdentityProps = {
  origin: IdentityOrigin;
  auth?: BaseAuthInfo;
  host: IdentityHost;
  mode: IdentityMode;
  token?: string;

  onPrepare: () => void;
};

export class Identity {
  readonly id: string;
  readonly origin: IdentityOrigin;
  readonly host: IdentityHost;
  readonly mode: IdentityMode;

  token: string | null;
  refreshToken: string | null;
  expires: number;

  isValid?: boolean = true;

  auth?: BaseAuthInfo;

  hooks: {
    prepare?: () => void;
  };

  static fromToken(props: IdentityProps) {
    return new Identity(props);
  }

  constructor({ origin, mode = 'auto', host, token, auth, onPrepare }: IdentityProps) {
    this.id = nanoid();

    this.origin = origin;
    this.host = host;
    this.mode = mode;

    this.token = token || null;
    this.refreshToken = null;
    this.expires = -1;

    this.auth = auth;

    this.hooks = {
      prepare: onPrepare,
    };

    this.init();

    if (this.mode === 'manual') {
      this.validate();
    }
  }

  init() {
    this.hooks.prepare?.();
  }

  validate() {
    this.isValid = false;

    this.auth?.validate(this.token as string).then((res) => {
      this.isValid = res;
    });
  }

  isExpired() {
    return this.expires < Date.now();
  }
}

export type Identities = Record<string, Identity>;

export class IdentityManager {
  private readonly identities: Identities;

  constructor() {
    this.identities = {};
  }

  register(identity: Identity) {
    this.identities[identity.id] = identity;
  }

  has() {}
}

const lingrId = new IdentityManager();

export default lingrId;
