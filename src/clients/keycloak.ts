import { useEffect, useState, useRef } from 'react';
import Keycloak from 'keycloak-js';

import {
  Client,
  ClientStatus,
  ClientStatusId,
  User,
  ClientEvent,
  ClientError,
  createClient,
  ClientFactory,
  Token,
  getClientConfig,
  hasValidClientConfig,
  getLocationBasedUri
} from './index';

function setSessionStorageTokens({
  token,
  idToken,
  refreshToken
}: {
  token: Token;
  idToken: Token;
  refreshToken: Token;
}): void {
  localStorage.setItem('token', token || '');
  localStorage.setItem('idToken', idToken || '');
  localStorage.setItem('refreshToken', refreshToken || '');
}

export function getSessionStorageTokens(): {
  token: Token;
  idToken: Token;
  refreshToken: Token;
} {
  return {
    token: localStorage.getItem('token') || undefined,
    idToken: localStorage.getItem('idToken') || undefined,
    refreshToken: localStorage.getItem('refreshToken') || undefined
  };
}

let client: Client | null = null;

function bindEvents(
  keycloak: Keycloak.KeycloakInstance,
  eventFunctions: {
    onAuthChange: Client['onAuthChange'];
    setError: ClientFactory['setError'];
    eventTrigger: ClientFactory['eventTrigger'];
  }
): void {
  const { onAuthChange, setError, eventTrigger } = eventFunctions;
  /* eslint-disable no-param-reassign */
  keycloak.onReady = (authenticated): boolean => onAuthChange(!!authenticated);
  keycloak.onAuthSuccess = (): boolean => onAuthChange(true);
  keycloak.onAuthError = (errorData): void => {
    onAuthChange(false);
    setError({
      type: ClientError.AUTH_ERROR,
      message: errorData.error_description
    });
  };
  keycloak.onAuthRefreshError = (): void => {
    eventTrigger(ClientStatus.UNAUTHORIZED, { error: true });
    setError({
      type: ClientError.AUTH_REFRESH_ERROR,
      message: ''
    });
  };
  keycloak.onAuthLogout = (): boolean => onAuthChange(false);
  keycloak.onTokenExpired = (): void => eventTrigger(ClientEvent.USER_EXPIRED);
  /* eslint-enable no-param-reassign */
}

export function createKeycloakClient(): Client {
  if (!hasValidClientConfig()) {
    const errorMessage = 'Invalid client config';
    // eslint-disable-next-line no-console
    console.error(errorMessage, getClientConfig());
    throw new Error(errorMessage);
  }
  const clientConfig = getClientConfig();
  const config: Keycloak.KeycloakConfig = {
    url: clientConfig.url,
    realm: clientConfig.realm,
    clientId: clientConfig.clientId
  };
  const keycloak: Keycloak.KeycloakInstance = Keycloak(config);
  const savedTokens = getSessionStorageTokens();
  const {
    eventTrigger,
    getStoredUser,
    setStoredUser,
    ...clientFunctions
  } = createClient();

  const {
    isAuthenticated,
    isInitialized,
    setStatus,
    getStatus,
    setError
  } = clientFunctions;

  const getUser: Client['getUser'] = () => {
    if (isAuthenticated()) {
      const userData = keycloak.tokenParsed as User;
      if (userData && userData.email && userData.session_state) {
        return userData;
      }
    }
    return undefined;
  };

  const onAuthChange = (authenticated: boolean): boolean => {
    if (isInitialized() && authenticated === isAuthenticated()) {
      return false;
    }
    const statusChanged = setStatus(
      authenticated ? ClientStatus.AUTHORIZED : ClientStatus.UNAUTHORIZED
    );
    if (statusChanged) {
      eventTrigger(getStatus(), getUser());
    }
    return true;
  };

  const clearSession: Client['clearSession'] = () => {
    setSessionStorageTokens({ token: '', refreshToken: '', idToken: '' });
  };

  const login: Client['login'] = () => {
    keycloak.login({
      redirectUri: getLocationBasedUri('/'), // todo redirect back to page login was initiated.
      scope: clientConfig.scope
    });
  };

  const logout: Client['logout'] = () => {
    eventTrigger(ClientEvent.LOGGING_OUT);
    clearSession();
    keycloak.logout({
      redirectUri: getLocationBasedUri('/')
    });
  };

  const handleCallback: Client['handleCallback'] = () => {
    return Promise.reject(new Error('not supported with keycloak'));
  };

  const loadUserProfile: Client['loadUserProfile'] = () => {
    return new Promise((resolve, reject) => {
      keycloak
        .loadUserProfile()
        .then(data => {
          setStoredUser(data as User);
          resolve(getStoredUser());
        })
        .catch(e => {
          setStoredUser(undefined);
          setError({
            type: ClientError.LOAD_ERROR,
            message: e && e.toString()
          });
          reject(e);
        });
    });
  };

  const getUserProfile: Client['getUserProfile'] = () => {
    return getStoredUser();
  };

  let initPromise: Promise<User | undefined> | undefined;
  const init: Client['init'] = () => {
    if (initPromise) {
      return initPromise;
    }
    setStatus(ClientStatus.INITIALIZING);
    initPromise = new Promise((resolve, reject) => {
      const keyCloakPromise = keycloak.init({
        onLoad: clientConfig.loginType,
        flow: clientConfig.flow,
        token: savedTokens.token,
        refreshToken: savedTokens.refreshToken,
        idToken: savedTokens.idToken,
        enableLogging: clientConfig.enableLogging,
        silentCheckSsoRedirectUri: getLocationBasedUri('/silent-check-sso.html')
      });

      keyCloakPromise
        .then((authenticated): void => {
          onAuthChange(authenticated);
          if (authenticated) {
            setSessionStorageTokens({
              token: keycloak.token,
              idToken: keycloak.idToken,
              refreshToken: keycloak.refreshToken
            });
            resolve(keycloak.tokenParsed as User);
            return;
          }
          resolve(undefined);
        })
        .catch((e?: {}) => {
          onAuthChange(false);
          reject(e);
        });
    });
    return initPromise;
  };

  const getOrLoadUser: Client['getOrLoadUser'] = () => {
    const currentUser = getUser();
    if (currentUser) {
      return Promise.resolve(currentUser);
    }
    if (isInitialized()) {
      return Promise.resolve(undefined);
    }
    return new Promise((resolve, reject) => {
      init()
        .then(() => resolve(getUser()))
        .catch(e => reject(e));
    });
  };

  client = {
    init,
    login,
    logout,
    loadUserProfile,
    getUserProfile,
    getUser,
    clearSession,
    handleCallback,
    getOrLoadUser,
    onAuthChange,
    ...clientFunctions
  };
  bindEvents(keycloak, { onAuthChange, eventTrigger, setError });
  return client;
}

export function getClient(): Client {
  if (client) {
    return client;
  }
  client = createKeycloakClient();
  return client;
}

export const useKeycloak = (): Client => {
  const clientRef: React.Ref<Client> = useRef(getClient());
  const clientFromRef: Client = clientRef.current as Client;
  const [, setStatus] = useState<ClientStatusId>(clientFromRef.getStatus());
  useEffect(() => {
    const initClient = async (): Promise<void> => {
      if (!clientFromRef.isInitialized()) {
        await clientFromRef.getOrLoadUser().catch(e =>
          clientFromRef.setError({
            type: ClientError.INIT_ERROR,
            message: e && e.toString()
          })
        );
      }
    };
    const statusListenerDisposer = clientFromRef.addListener(
      ClientEvent.STATUS_CHANGE,
      status => {
        setStatus(status as ClientStatusId);
      }
    );

    initClient();
    return (): void => {
      statusListenerDisposer();
    };
  }, [clientFromRef]);
  return clientFromRef;
};

export const useKeycloakErrorDetection = (): ClientError => {
  const clientRef: React.Ref<Client> = useRef(getClient());
  const clientFromRef: Client = clientRef.current as Client;
  const [error, setError] = useState<ClientError>(undefined);
  useEffect(() => {
    let isAuthorized = false;
    const statusListenerDisposer = clientFromRef.addListener(
      ClientEvent.STATUS_CHANGE,
      status => {
        if (status === ClientStatus.AUTHORIZED) {
          isAuthorized = true;
        }
        if (isAuthorized && status === ClientStatus.UNAUTHORIZED) {
          setError({ type: ClientError.UNEXPECTED_AUTH_CHANGE, message: '' });
          isAuthorized = false;
        }
      }
    );

    const errorListenerDisposer = clientFromRef.addListener(
      ClientEvent.ERROR,
      newError => {
        setError(newError as ClientError);
      }
    );
    const logoutListenerDisposer = clientFromRef.addListener(
      ClientEvent.LOGGING_OUT,
      (): void => {
        isAuthorized = false;
      }
    );

    return (): void => {
      errorListenerDisposer();
      statusListenerDisposer();
      logoutListenerDisposer();
    };
  }, [clientFromRef]);
  return error;
};
