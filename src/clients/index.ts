export type User = Record<string, string | number | boolean>;
export type Token = string | undefined;
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
};

export const ClientStatus = {
  NONE: 'NONE',
  INITIALIZING: 'INITIALIZING',
  AUTHORIZED: 'AUTHORIZED',
  UNAUTHORIZED: 'UNAUTHORIZED'
} as const;

export type ClientStatusId = typeof ClientStatus[keyof typeof ClientStatus];

export const ClientEvent = {
  USER_EXPIRED: 'USER_EXPIRED',
  USER_EXPIRING: 'USER_EXPIRING',
  ERROR: 'ERROR',
  STATUS_CHANGE: 'STATUS_CHANGE',
  AUTHORIZATION_TERMINATED: 'AUTHORIZATION_TERMINATED',
  LOGGING_OUT: 'LOGGING_OUT',
  ...ClientStatus
} as const;

export type ClientEventId = typeof ClientEvent[keyof typeof ClientEvent];

export const ClientError = {
  INIT_ERROR: 'INIT_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  AUTH_REFRESH_ERROR: 'AUTH_REFRESH_ERROR',
  LOAD_ERROR: 'LOAD_ERROR',
  UNEXPECTED_AUTH_CHANGE: 'UNEXPECTED_AUTH_CHANGE'
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
   * Not needed for keycloak client. Only for oidc-react.
   * Default: undefined
   */
  callbackPath: string | undefined;
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
   * Default: 'id_token token'
   */
  responseType?: string;
  /**
   * The scope being requested from the OIDC/OAuth2 provider.
   * Default: 'profile'
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
   * Default: 'check-sso'
   */
  loginType: 'check-sso' | 'login-required' | undefined;
  /**
   * Set the OpenID Connect flow. Valid values are standard, implicit or hybrid.
   * Only for keycloak client.
   * Default: 'hybrid'
   */
  flow: 'standard' | 'implicit' | 'hybrid' | undefined;
}

type EventHandlers = {
  addListener: Client['addListener'];
  eventTrigger: (eventType: ClientEventId, payload?: EventPayload) => void;
};

export const createEventHandling = (): EventHandlers => {
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
} & EventHandlers;

export const createClient = (): ClientFactory => {
  let status: ClientStatusId = ClientStatus.NONE;
  let error: ClientError;
  let user: User | undefined;
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
    isAuthenticated
  };
};

export type ClientType = 'keycloak' | 'oidc';
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
