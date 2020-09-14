export type Client = {
  init: () => Promise<any>;
  login: () => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isInitialized: () => boolean;
  clearSession: () => void;
  handleCallback: () => Promise<any>;
  loadUser: () => Promise<any>;
  getStatus: () => ClientStatus;
};

export type ClientStatus =
  | 'none'
  | 'initialized'
  | 'authenticated'
  | 'unauthorized'
  | 'authentication-error'
  | 'logging-out';
