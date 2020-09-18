export type User = Record<string, string | number | boolean>;
export type EventListener = (client: Client, payload?: any) => void;
export type Client = {
  init: () => Promise<User | undefined | null>;
  login: () => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isInitialized: () => boolean;
  clearSession: () => void;
  handleCallback: () => Promise<any>;
  getUser: () => User | undefined;
  getOrLoadUser: () => Promise<User | undefined | null>;
  loadUserProfile: () => Promise<User>;
  getStatus: () => ClientStatusIds;
  setStatus: (newStatus: ClientStatusIds) => boolean;
  getUserProfile: () => User | undefined;
  addListener: (eventType: ClientEventIds, listener: EventListener) => Function;
};

export const ClientStatus = {
  NONE: 'NONE',
  INITIALIZING: 'INITIALIZING',
  AUTHORIZED: 'AUTHORIZED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  'LOGGING-OUT': 'LOGGING-OUT',
} as const;

export type ClientStatusIds = typeof ClientStatus[keyof typeof ClientStatus];

export const ClientEvent = {
  USER_EXPIRED: 'USER_EXPIRED',
  USER_EXPIRING: 'USER_EXPIRING',
  ERROR: 'ERROR',
  STATUS_CHANGE: 'STATUS_CHANGE',
  ...ClientStatus,
} as const;

export type ClientEventIds = typeof ClientEvent[keyof typeof ClientEvent];
