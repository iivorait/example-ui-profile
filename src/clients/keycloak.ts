import { useEffect, useState, useRef } from 'react';
import Keycloak from 'keycloak-js';

import {
  Client,
  ClientStatus,
  ClientStatusIds,
  User,
  ClientEventIds,
  ClientEvent,
  EventListener,
  ClientError,
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
  clientId: 'https://api.hel.fi/auth/example-ui-profile',
};

function setSessionStorageTokens({
  token,
  idToken,
  refreshToken,
}: {
  token: string | undefined;
  idToken: string | undefined;
  refreshToken: string | undefined;
}) {
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
    refreshToken: localStorage.getItem('refreshToken') || undefined,
  };
}

let client: Client | null = null;

export function getClient(config: Partial<Keycloak.KeycloakConfig>): Client {
  if (client) {
    return client;
  }
  const mergedConfig: Keycloak.KeycloakConfig = {
    ...defaultOptions,
    ...config,
  };
  const keycloak: Keycloak.KeycloakInstance = Keycloak(mergedConfig);
  const savedTokens = getSessionStorageTokens();
  let status: ClientStatusIds = ClientStatus.NONE;
  let error: ClientError = undefined;
  let initPromise: Promise<User | undefined> | undefined = undefined;
  let user: User | undefined = undefined;
  const listeners: Map<ClientEventIds, Set<EventListener>> = new Map();

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
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      });

      keyCloakPromise
        .then(function(authenticated) {
          onAuthChange(authenticated);
          if (authenticated) {
            setSessionStorageTokens({
              token: keycloak.token,
              idToken: keycloak.idToken,
              refreshToken: keycloak.refreshToken,
            });
            resolve(keycloak.tokenParsed as User);
          }
          resolve(undefined);
        })
        .catch(function(e: any) {
          status = ClientStatus.UNAUTHORIZED;
          // error set in event
          reject();
        });
    });
    return initPromise;
  };

  const isAuthenticated: Client['isAuthenticated'] = () =>
    status === ClientStatus.AUTHORIZED;

  const isInitialized: Client['isInitialized'] = () =>
    status === ClientStatus.AUTHORIZED || status === ClientStatus.UNAUTHORIZED;

  const getUser: Client['getUser'] = () => {
    if (isAuthenticated()) {
      const userData = keycloak.tokenParsed as Record<string, string | number>;
      if (userData && userData.email && userData.session_state) {
        return userData;
      }
    }
    return undefined;
  };

  const getOrLoadUser: Client['getOrLoadUser'] = () => {
    const user = getUser();
    if (user) {
      return Promise.resolve(user);
    }
    if (isInitialized()) {
      return Promise.reject(undefined);
    }
    return init();
  };

  const addListener: Client['addListener'] = (eventType, listener) => {
    if (!listeners.has(eventType)) {
      listeners.set(eventType, new Set());
    }
    const source = listeners.get(eventType);
    source?.add(listener);
    return () => {
      const source = listeners.get(eventType);
      source && source.delete(listener);
    };
  };

  const eventTrigger = (
    eventType: ClientEventIds,
    payload?: string | {} | boolean
  ) => {
    console.log('eventTrigger', eventType);
    const source = listeners.get(eventType);
    source &&
      source.size &&
      source.forEach(listener => listener(client as Client, payload));
  };

  const onAuthChange = (authenticated: boolean) => {
    console.log('onAuthChange', authenticated, status);
    if (isInitialized() && authenticated === isAuthenticated()) {
      return false;
    }
    const statusChanged = setStatus(
      authenticated ? ClientStatus.AUTHORIZED : ClientStatus.UNAUTHORIZED
    );
    statusChanged && eventTrigger(status, getUser());
  };

  keycloak.onReady = authenticated => onAuthChange(!!authenticated);
  keycloak.onAuthSuccess = () => onAuthChange(true);
  keycloak.onAuthError = errorData => {
    onAuthChange(false);
    setError({
      type: ClientError.AUTH_ERROR,
      message: errorData.error_description,
    });
  };
  // keycloak.onAuthRefreshSuccess = () => eventTrigger('onAuthRefreshSuccess');
  keycloak.onAuthRefreshError = () => {
    eventTrigger(ClientStatus.UNAUTHORIZED, { error: true });
    setError({
      type: ClientError.AUTH_REFRESH_ERROR,
      message: '',
    });
  };
  keycloak.onAuthLogout = () => onAuthChange(false);
  keycloak.onTokenExpired = () => eventTrigger(ClientEvent.USER_EXPIRED);

  const login: Client['login'] = () => {
    keycloak.login({
      redirectUri: 'http://localhost:3000/',
      scope: 'ad-groups',
    });
  };

  const logout: Client['logout'] = () => {
    keycloak.logout({
      redirectUri: 'http://localhost:3000/',
    });
  };

  const clearSession: Client['clearSession'] = () => {
    setSessionStorageTokens({ token: '', refreshToken: '', idToken: '' });
  };

  const handleCallback: Client['handleCallback'] = () => {
    return Promise.reject('not supported with keycloak');
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
            message: e && e.toString(),
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

  const setStatus: Client['setStatus'] = newStatus => {
    if (newStatus === status) {
      return false;
    }
    status = newStatus;
    eventTrigger(ClientEvent.STATUS_CHANGE, status);
    return true;
  };

  const getError: Client['getError'] = () => {
    return error;
  };

  const setError: Client['setError'] = newError => {
    const oldType = error && error.type;
    const newType = newError && newError.type;
    if (oldType === newType) {
      return false;
    }
    error = newError;
    newType && eventTrigger(ClientEvent.ERROR, error);
    return true;
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
    setError,
  };
  return client;
}

export const useKeycloak = (): Client => {
  const clientRef: React.Ref<Client> = useRef(getClient({}));
  const client: Client = clientRef.current as Client;
  const [, setStatus] = useState<ClientStatusIds>(client.getStatus());
  const [, setError] = useState<ClientError>(undefined);
  useEffect(() => {
    const initClient = async (): Promise<void> => {
      if (!client.isInitialized()) {
        await client.getOrLoadUser();
      }
      setStatus(client.getStatus());
      return;
    };
    const statusListenerDisposer = client.addListener(
      ClientEvent.STATUS_CHANGE,
      (client, status) => {
        setStatus(status);
      }
    );

    initClient();
    return () => {
      statusListenerDisposer();
    };
  }, [client]);
  return client;
};

export const useKeycloakErrorDetection = (): ClientError => {
  const clientRef: React.Ref<Client> = useRef(getClient({}));
  const client: Client = clientRef.current as Client;
  const [error, setError] = useState<ClientError>(undefined);
  useEffect(() => {
    let isAuthorized = false;
    const statusListenerDisposer = client.addListener(
      ClientEvent.STATUS_CHANGE,
      (client, status) => {
        console.log('error detection status change:', status);
        if (status === ClientStatus.AUTHORIZED) {
          isAuthorized = true;
        }
        if (isAuthorized && status === ClientStatus.UNAUTHORIZED) {
          setError({ type: ClientError.UNEXPECTED_AUTH_CHANGE, message: '' });
          isAuthorized = false;
        }
      }
    );

    const errorListenerDisposer = client.addListener(
      ClientEvent.ERROR,
      (client, newError) => {
        setError(newError);
      }
    );

    return () => {
      errorListenerDisposer();
      statusListenerDisposer();
    };
  }, [client]);
  return error;
};
