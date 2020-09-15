export type User = Record<string, any>;
export type Client = {
  init: () => Promise<any>;
  login: () => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isInitialized: () => boolean;
  clearSession: () => void;
  handleCallback: () => Promise<any>;
  loadUserProfile: () => Promise<User>;
  getStatus: () => ClientStatus;
  getUserProfile: () => User | undefined;
};

export type ClientStatus =
  | 'none'
  | 'initializing'
  | 'initialized'
  | 'authenticated'
  | 'unauthorized'
  | 'authentication-error'
  | 'logging-out';
