// following ts-ignore + eslint-disable fixes "Could not find declaration file for module" error for await-handler
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import to from 'await-handler';

export type User = Record<string, string | number | boolean>;
export type Token = string | undefined;
export type ClientType = 'keycloak' | 'oidc';
export type JWTPayload = Record<string, string>;
export type EventPayload =
  | User
  | undefined
  | Client
  | ClientStatusId
  | ClientError;
export type EventListener = (payload?: EventPayload) => void;
export type Client = {
  init: () => Promise<User | undefined | null>;
  login: () => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isInitialized: () => boolean;
  clearSession: () => void;
  handleCallback: () => Promise<User | undefined | Error>;
  getUser: () => User | undefined;
  getOrLoadUser: () => Promise<User | undefined | null>;
  loadUserProfile: () => Promise<User>;
  getStatus: () => ClientStatusId;
  setStatus: (newStatus: ClientStatusId) => boolean;
  getError: () => ClientError;
  setError: (newError?: ClientError) => boolean;
  getUserProfile: () => User | undefined;
  addListener: (eventType: ClientEventId, listener: EventListener) => Function;
  onAuthChange: (authenticated: boolean) => boolean;
  getApiAccessToken: (
    options: FetchApiTokenOptions
  ) => Promise<JWTPayload | FetchError>;
  getApiTokens: () => JWTPayload;
  addApiTokens: (newToken: JWTPayload) => JWTPayload;
  removeApiToken: (name: string) => JWTPayload;
  getUserTokens: () => Record<string, string | undefined> | undefined;
};

export const ClientStatus = {
  NONE: 'NONE',
  INITIALIZING: 'INITIALIZING',
  AUTHORIZED: 'AUTHORIZED',
  UNAUTHORIZED: 'UNAUTHORIZED'
} as const;

export type ClientStatusId = typeof ClientStatus[keyof typeof ClientStatus];

export type FetchApiTokenOptions = {
  grantType: string;
  audience: string;
  permission: string;
};

export type FetchApiTokenConfiguration = FetchApiTokenOptions & {
  uri: string;
  accessToken: string;
};

export type FetchError = {
  status?: number;
  error?: Error;
  message?: string;
};

export const ClientEvent = {
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_EXPIRING: 'TOKEN_EXPIRING',
  ERROR: 'ERROR',
  STATUS_CHANGE: 'STATUS_CHANGE',
  AUTHORIZATION_TERMINATED: 'AUTHORIZATION_TERMINATED',
  LOGGING_OUT: 'LOGGING_OUT',
  CLIENT_READY: 'CLIENT_READY',
  CLIENT_AUTH_SUCCESS: 'CLIENT_AUTH_SUCCESS',
  ...ClientStatus
} as const;

export type ClientEventId = typeof ClientEvent[keyof typeof ClientEvent];

export const ClientError = {
  INIT_ERROR: 'INIT_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  AUTH_REFRESH_ERROR: 'AUTH_REFRESH_ERROR',
  LOAD_ERROR: 'LOAD_ERROR',
  UNEXPECTED_AUTH_CHANGE: 'UNEXPECTED_AUTH_CHANGE',
  USER_DATA_ERROR: 'USER_DATA_ERROR'
} as const;

export type ClientError = { type: string; message: string } | undefined;

export interface ClientProps {
  /**
   * realm for the OIDC/OAuth2 endpoint
   */
  realm: string;
  /**
   * The URL of the OIDC/OAuth2 endpoint
   */
  url: string;
  /**
   * authority for the OIDC/OAuth2. Not configurable, value is props.url+'/realms/'+props.realm
   */
  authority: string;
  /**
   * Your client application's identifier as registered with the OIDC/OAuth2 provider.
   */
  clientId: string;
  /**
   * The redirect URI of your client application to receive a response from the OIDC/OAuth2 provider.
   * Not needed for keycloak client. Only for oidc-react. Use empty string with keycloak.
   */
  callbackPath: string;
  /**
   * The redirect URI of your client application after logout
   * Default: '/'
   */
  logoutPath?: string;
  /**
   * The path for silent authentication checks: silent renew (oidc-react) or silent sso check (keycloak)
   */
  silentAuthPath?: string;
  /**
   * The type of response desired from the OIDC/OAuth2 provider.
   */
  responseType?: string;
  /**
   * The scope being requested from the OIDC/OAuth2 provider.
   */
  scope?: string;
  /**
   * Default: true
   */
  autoSignIn?: boolean;
  /**
   * Default: true
   */
  automaticSilentRenew?: boolean;
  /**
   * Default: false
   */
  enableLogging?: boolean;
  /**
   * Specifies an action to do on load. Supported values are login-required or check-sso.
   * Only for keycloak client.
   */
  loginType: 'check-sso' | 'login-required' | undefined;
  /**
   * Set the OpenID Connect flow. Valid values are standard, implicit or hybrid.
   * Only for keycloak client.
   * Default: 'standard'
   */
  flow: 'standard' | 'implicit' | 'hybrid' | undefined;
  /**
   * Type of the client
   */
  type: ClientType;
  /**
   * Path for exchanging tokens. Leave blank to use default keycloak path realms/<realm>/protocol/openid-connect/token
   */
  tokenExchangePath?: string;
}

type EventHandlers = {
  addListener: Client['addListener'];
  eventTrigger: (eventType: ClientEventId, payload?: EventPayload) => void;
};

export type ClientFactory = {
  addListener: Client['addListener'];
  eventTrigger: EventHandlers['eventTrigger'];
  getStoredUser: () => User | undefined;
  setStoredUser: (newUser: User | undefined) => void;
  getStatus: Client['getStatus'];
  setStatus: Client['setStatus'];
  getError: Client['getError'];
  setError: Client['setError'];
  isInitialized: Client['isInitialized'];
  isAuthenticated: Client['isAuthenticated'];
  fetchApiToken: (
    options: FetchApiTokenConfiguration
  ) => Promise<JWTPayload | FetchError>;
  getApiTokens: Client['getApiTokens'];
  addApiTokens: Client['addApiTokens'];
  removeApiToken: Client['removeApiToken'];
} & EventHandlers;

export function createEventHandling(): EventHandlers {
  const listeners: Map<ClientEventId, Set<EventListener>> = new Map();
  const getListenerListForEventType = (
    eventType: ClientEventId
  ): Set<EventListener> => {
    if (!listeners.has(eventType)) {
      listeners.set(eventType, new Set());
    }
    return listeners.get(eventType) as Set<EventListener>;
  };

  const addListener: Client['addListener'] = (eventType, listener) => {
    const listenerList = getListenerListForEventType(eventType);
    listenerList.add(listener);
    return (): void => {
      const targetList = listeners.get(eventType);
      if (targetList) {
        targetList.delete(listener);
      }
    };
  };
  const eventTrigger = (
    eventType: ClientEventId,
    payload?: EventPayload
  ): void => {
    const source = listeners.get(eventType);
    if (source && source.size) {
      source.forEach(listener => listener(payload));
    }
  };
  return {
    addListener,
    eventTrigger
  };
}

export function createClient(): ClientFactory {
  let status: ClientStatusId = ClientStatus.NONE;
  let error: ClientError;
  let user: User | undefined;
  const tokenStorage: JWTPayload = {};
  const { addListener, eventTrigger } = createEventHandling();

  const getStoredUser = (): User | undefined => {
    return user;
  };

  const setStoredUser = (newUser: User | undefined): void => {
    user = newUser;
  };

  const getStatus: Client['getStatus'] = () => {
    return status;
  };

  const getError: Client['getError'] = () => {
    return error;
  };

  const isAuthenticated: Client['isAuthenticated'] = () =>
    status === ClientStatus.AUTHORIZED;

  const isInitialized: Client['isInitialized'] = () =>
    status === ClientStatus.AUTHORIZED || status === ClientStatus.UNAUTHORIZED;

  const setError: Client['setError'] = newError => {
    const oldType = error && error.type;
    const newType = newError && newError.type;
    if (oldType === newType) {
      return false;
    }
    error = newError;
    eventTrigger(ClientEvent.ERROR, error);
    return true;
  };

  const setStatus: Client['setStatus'] = newStatus => {
    if (newStatus === status) {
      return false;
    }
    status = newStatus;
    eventTrigger(ClientEvent.STATUS_CHANGE, status);
    return true;
  };

  const getApiTokens: ClientFactory['getApiTokens'] = () => tokenStorage;
  const addApiTokens: ClientFactory['addApiTokens'] = newToken => {
    Object.assign(tokenStorage, newToken);
    return tokenStorage;
  };
  const removeApiToken: ClientFactory['removeApiToken'] = name => {
    delete tokenStorage[name];
    return tokenStorage;
  };

  const fetchApiToken: ClientFactory['fetchApiToken'] = async options => {
    const myHeaders = new Headers();
    myHeaders.append('Authorization', `Bearer ${options.accessToken}`);
    myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');

    const urlencoded = new URLSearchParams();
    urlencoded.append('grant_type', options.grantType);
    urlencoded.append('audience', options.audience);
    urlencoded.append('permission', options.permission);

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: urlencoded
    };

    const [fetchError, fetchResponse] = await to(
      fetch(options.uri, requestOptions)
    );
    if (fetchError) {
      return {
        error: fetchError,
        message: 'Network or CORS error occured'
      } as FetchError;
    }
    if (!fetchResponse.ok) {
      return {
        status: fetchResponse.status,
        message: fetchResponse.statusText,
        error: new Error(fetchResponse.body)
      } as FetchError;
    }
    const [parseError, json] = await to(fetchResponse.json());
    if (parseError) {
      return {
        error: parseError,
        message: 'Returned data is not valid json'
      } as FetchError;
    }
    const jwt = json as JWTPayload;
    addApiTokens(jwt);
    return jwt;
  };

  return {
    addListener,
    eventTrigger,
    getStatus,
    getError,
    getStoredUser,
    setStoredUser,
    setStatus,
    setError,
    isInitialized,
    isAuthenticated,
    fetchApiToken,
    getApiTokens,
    addApiTokens,
    removeApiToken
  };
}

let config: ClientProps;

export function setClientConfig(newConfig: ClientProps): ClientProps {
  config = newConfig;
  return config;
}

export function getClientConfig(): ClientProps {
  return config;
}

export function hasValidClientConfig(): boolean {
  return !!(config && config.url && config.clientId);
}

export function getLocationBasedUri(
  property: string | undefined
): string | undefined {
  const location = window.location.origin;
  if (property === undefined) {
    return undefined;
  }
  return `${location}${property}`;
}

export function getTokenUri(clientProps: ClientProps): string {
  if (clientProps.tokenExchangePath) {
    return `${clientProps.url}${clientProps.tokenExchangePath}`;
  }
  return `${clientProps.url}/realms/${clientProps.realm}/protocol/openid-connect/token`;
}
