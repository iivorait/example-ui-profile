export type User = Record<string, string | number | boolean>;
export type EventPayload =
  | User
  | undefined
  | Client
  | ClientStatusIds
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
  getStatus: () => ClientStatusIds;
  setStatus: (newStatus: ClientStatusIds) => boolean;
  getError: () => ClientError;
  setError: (newError?: ClientError) => boolean;
  getUserProfile: () => User | undefined;
  addListener: (eventType: ClientEventIds, listener: EventListener) => Function;
};

export const ClientStatus = {
  NONE: 'NONE',
  INITIALIZING: 'INITIALIZING',
  AUTHORIZED: 'AUTHORIZED',
  UNAUTHORIZED: 'UNAUTHORIZED'
} as const;

export type ClientStatusIds = typeof ClientStatus[keyof typeof ClientStatus]; // todo change plural -> single

export const ClientEvent = {
  USER_EXPIRED: 'USER_EXPIRED',
  USER_EXPIRING: 'USER_EXPIRING',
  ERROR: 'ERROR',
  STATUS_CHANGE: 'STATUS_CHANGE',
  AUTHORIZATION_TERMINATED: 'AUTHORIZATION_TERMINATED',
  LOGGING_OUT: 'LOGGING_OUT',
  ...ClientStatus
} as const;

export type ClientEventIds = typeof ClientEvent[keyof typeof ClientEvent]; // todo change plural -> single

export const ClientError = {
  INIT_ERROR: 'INIT_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  AUTH_REFRESH_ERROR: 'AUTH_REFRESH_ERROR',
  LOAD_ERROR: 'LOAD_ERROR',
  UNEXPECTED_AUTH_CHANGE: 'UNEXPECTED_AUTH_CHANGE'
} as const;

export type ClientError = { type: string; message: string } | undefined;

/* common client functions */

export const getOrLoadUser = (
  client: Client
): Promise<User | undefined | null> => {
  const user = client.getUser();
  if (user) {
    return Promise.resolve(user);
  }
  if (client.isInitialized()) {
    return Promise.resolve(undefined);
  }
  return client.init();
};

type EventHandlers = {
  addListener: Client['addListener'];
  eventTrigger: (eventType: ClientEventIds, payload?: EventPayload) => void;
};

export const createEventHandling = (): EventHandlers => {
  const listeners: Map<ClientEventIds, Set<EventListener>> = new Map(); // todo:
  const getListenerListForEventType = (
    eventType: ClientEventIds
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
    eventType: ClientEventIds,
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
