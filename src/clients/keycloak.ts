import { useEffect, useState, useRef } from 'react';
import Keycloak from 'keycloak-js';

import {
  Client,
  ClientStatus,
  ClientStatusIds,
  User,
  ClientEvent,
  ClientError,
  createEventHandling
} from './index';

export interface KeycloakProps {
  /**
   * realm to true
   */
  realm?: string;
  /**
   * realm to true
   */
  url?: string;
  /**
   * The URL of the OIDC/OAuth2 provider.
   */
  authority?: string;
  /**
   * Your client application's identifier as registered with the OIDC/OAuth2 provider.
   */
  clientId?: string;
  /**
   * Client secret defined on the identity server
   */
  clientSecret?: string;
  /**
   * The redirect URI of your client application to receive a response from the OIDC/OAuth2 provider.
   */
  redirectUri?: string;
  /**
   * Tells the authorization server which grant to execute
   *
   * Read more: https://tools.ietf.org/html/rfc6749#section-3.1.1
   */
  responseType?: string;
  /**
   * A space-delimited list of permissions that the application requires.
   */
  scope?: string;
  /**
   * Defaults to `windows.location`.
   */
  location?: Location;
  /**
   * defaults to true
   */
  autoSignIn?: boolean;
}

const defaultOptions: Keycloak.KeycloakConfig = {
  url: 'https://tunnistus.hel.ninja/auth',
  realm: 'helsinki-tunnistus',
  clientId: 'https://api.hel.fi/auth/example-ui-profile'
};

function setSessionStorageTokens({
  token,
  idToken,
  refreshToken
}: {
  token: string | undefined;
  idToken: string | undefined;
  refreshToken: string | undefined;
}): void {
  localStorage.setItem('token', token || '');
  localStorage.setItem('idToken', idToken || '');
  localStorage.setItem('refreshToken', refreshToken || '');
}

function getSessionStorageTokens(): {
  token: string | undefined;
  idToken: string | undefined;
  refreshToken: string | undefined;
} {
  return {
    token: localStorage.getItem('token') || undefined,
    idToken: localStorage.getItem('idToken') || undefined,
    refreshToken: localStorage.getItem('refreshToken') || undefined
  };
}

let client: Client | null = null;

export function getClient(config: Partial<Keycloak.KeycloakConfig>): Client {
  if (client) {
    return client;
  }
  const mergedConfig: Keycloak.KeycloakConfig = {
    ...defaultOptions,
    ...config
  };
  const keycloak: Keycloak.KeycloakInstance = Keycloak(mergedConfig);
  const savedTokens = getSessionStorageTokens();
  let status: ClientStatusIds = ClientStatus.NONE;
  let error: ClientError;
  let initPromise: Promise<User | undefined> | undefined;
  let user: User | undefined;
  const { addListener, eventTrigger } = createEventHandling();
  const isAuthenticated: Client['isAuthenticated'] = () =>
    status === ClientStatus.AUTHORIZED;

  const isInitialized: Client['isInitialized'] = () =>
    status === ClientStatus.AUTHORIZED || status === ClientStatus.UNAUTHORIZED;

  /*  
  const eventTrigger = (
    eventType: ClientEventIds,
    payload?: EventPayload
  ): void => {
    const source = listeners.get(eventType);
    if (source && source.size) {
      source.forEach(listener => listener(client as Client, payload));
    }
  };
  */

  const setError: Client['setError'] = newError => {
    const oldType = error && error.type;
    const newType = newError && newError.type;
    if (oldType === newType) {
      return false;
    }
    error = newError;
    if (newType) {
      eventTrigger(ClientEvent.ERROR, error);
    }
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

  const getUser: Client['getUser'] = () => {
    if (isAuthenticated()) {
      const userData = keycloak.tokenParsed as Record<string, string | number>;
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
      eventTrigger(status, getUser());
    }
    return true;
  };

  const init: Client['init'] = () => {
    if (initPromise) {
      return initPromise;
    }
    status = ClientStatus.INITIALIZING;
    initPromise = new Promise((resolve, reject) => {
      const keyCloakPromise = keycloak.init({
        onLoad: 'check-sso',
        flow: 'hybrid',
        token: savedTokens.token,
        refreshToken: savedTokens.refreshToken,
        idToken: savedTokens.idToken,
        enableLogging: true,
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`
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
        .catch(() => {
          onAuthChange(false);
          // error set in event listener
          reject();
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
    return init();
  };

  /*  
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
  */
  const login: Client['login'] = () => {
    keycloak.login({
      redirectUri: 'http://localhost:3000/',
      scope: 'ad-groups'
    });
  };

  const logout: Client['logout'] = () => {
    eventTrigger(ClientEvent.LOGGING_OUT);
    keycloak.logout({
      redirectUri: 'http://localhost:3000/'
    });
  };

  const clearSession: Client['clearSession'] = () => {
    setSessionStorageTokens({ token: '', refreshToken: '', idToken: '' });
  };

  const handleCallback: Client['handleCallback'] = () => {
    return Promise.reject(new Error('not supported with keycloak'));
  };

  const loadUserProfile: Client['loadUserProfile'] = () => {
    return new Promise((resolve, reject) => {
      keycloak
        .loadUserProfile()
        .then(data => {
          user = data as User;
          resolve(user);
        })
        .catch(e => {
          user = undefined;
          setError({
            type: ClientError.LOAD_ERROR,
            message: e && e.toString()
          });
          reject(e);
        });
    });
  };

  const getUserProfile: Client['getUserProfile'] = () => {
    return user;
  };

  const getStatus: Client['getStatus'] = () => {
    return status;
  };

  const getError: Client['getError'] = () => {
    return error;
  };

  client = {
    init,
    login,
    logout,
    isAuthenticated,
    isInitialized,
    addListener,
    clearSession,
    handleCallback,
    getUser,
    getOrLoadUser,
    loadUserProfile,
    getUserProfile,
    getStatus,
    setStatus,
    getError,
    setError
  };

  keycloak.onReady = (authenticated): boolean => onAuthChange(!!authenticated);
  keycloak.onAuthSuccess = (): boolean => onAuthChange(true);
  keycloak.onAuthError = (errorData): void => {
    onAuthChange(false);
    setError({
      type: ClientError.AUTH_ERROR,
      message: errorData.error_description
    });
  };
  // keycloak.onAuthRefreshSuccess = () => eventTrigger('onAuthRefreshSuccess');
  keycloak.onAuthRefreshError = (): void => {
    eventTrigger(ClientStatus.UNAUTHORIZED, { error: true });
    setError({
      type: ClientError.AUTH_REFRESH_ERROR,
      message: ''
    });
  };
  keycloak.onAuthLogout = (): boolean => onAuthChange(false);
  keycloak.onTokenExpired = (): void => eventTrigger(ClientEvent.USER_EXPIRED);

  return client;
}

export const useKeycloak = (): Client => {
  const clientRef: React.Ref<Client> = useRef(getClient({}));
  const clientFromRef: Client = clientRef.current as Client;
  const [, setStatus] = useState<ClientStatusIds>(clientFromRef.getStatus());
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
        setStatus(status as ClientStatusIds);
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
  const clientRef: React.Ref<Client> = useRef(getClient({}));
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
