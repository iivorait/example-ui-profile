import { useEffect, useState, useRef } from 'react';
import Keycloak from 'keycloak-js';
import config from '../config';

import {
  Client,
  ClientStatus,
  ClientStatusIds,
  User,
  ClientEvent,
  ClientError,
  createClient,
  ClientFactory
} from './index';

/*
const defaultOptions: Keycloak.KeycloakConfig = {
  url: 'https://tunnistus.hel.ninja/auth',
  realm: 'helsinki-tunnistus',
  clientId: 'https://api.hel.fi/auth/example-ui-profile'
};
*/

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

function bindEvents(
  keycloak: Keycloak.KeycloakInstance,
  eventFunctions: {
    onAuthChange: ClientFactory['onAuthChange'];
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

export function getClient(
  configOverrides: Partial<Keycloak.KeycloakConfig>
): Client {
  if (client) {
    return client;
  }
  const mergedConfig: Keycloak.KeycloakConfig = {
    url: config.client.url,
    realm: config.client.realm,
    clientId: config.client.clientId,
    ...configOverrides
  };
  console.log('config is', config);
  const keycloak: Keycloak.KeycloakInstance = Keycloak(mergedConfig);
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

  const login: Client['login'] = () => {
    keycloak.login({
      redirectUri: config.getLocationBasedUri('/'), // todo redirect back to page login was initiated
      scope: config.client.scope
    });
  };

  const logout: Client['logout'] = () => {
    eventTrigger(ClientEvent.LOGGING_OUT);
    keycloak.logout({
      redirectUri: config.getLocationBasedUri('/')
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
        onLoad: config.client.loginType,
        flow: config.client.flow,
        token: savedTokens.token,
        refreshToken: savedTokens.refreshToken,
        idToken: savedTokens.idToken,
        enableLogging: true,
        silentCheckSsoRedirectUri: config.getLocationBasedUri(
          '/silent-check-sso.html'
        )
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
    ...clientFunctions
  };
  bindEvents(keycloak, { onAuthChange, eventTrigger, setError });
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
