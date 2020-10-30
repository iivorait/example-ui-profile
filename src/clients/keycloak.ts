import { useEffect, useState, useRef } from 'react';
import Keycloak, { KeycloakTokenParsed } from 'keycloak-js';

import {
  Client,
  ClientStatus,
  ClientStatusId,
  User,
  ClientEvent,
  ClientError,
  createClient,
  ClientFactory,
  getClientConfig,
  hasValidClientConfig,
  getLocationBasedUri,
  ClientProps,
  getTokenUri,
  FetchApiTokenOptions
} from './index';

function getLocalStorageId(config: ClientProps, useType: string): string {
  return `${config.clientId}-${useType}`;
}

export function getUserFromToken(
  tokenParsed: KeycloakTokenParsed
): User | undefined {
  if (!tokenParsed || !tokenParsed.session_state) {
    return undefined;
  }
  const userData = tokenParsed as User;
  if (!userData.name) {
    return undefined;
  }
  /* eslint-disable @typescript-eslint/camelcase */
  return {
    name: userData.name,
    given_name: userData.given_name,
    family_name: userData.family_name,
    email: userData.email
  };
  /* eslint-enable @typescript-eslint/camelcase */
}

export function saveUserToLocalStorage(
  token?: KeycloakTokenParsed,
  user?: User
): void {
  const storageId = getLocalStorageId(getClientConfig(), 'userData');
  const identifier = (token && token.session_state) || '';
  const data = JSON.stringify({
    identifier,
    user: user || ''
  });
  localStorage.setItem(storageId, data);
}

export function getUserFromLocalStorage(
  token: KeycloakTokenParsed
): User | undefined {
  const storageId = getLocalStorageId(getClientConfig(), 'userData');
  const identifier = (token && token.session_state) || '';
  const rawData = localStorage.getItem(storageId);
  if (!rawData) {
    return undefined;
  }
  const data = JSON.parse(rawData);
  if (!identifier || !data.identifier || data.identifier !== identifier) {
    localStorage.setItem(storageId, '');
    return undefined;
  }
  if (!data.user || !data.user.given_name) {
    localStorage.setItem(storageId, '');
    return undefined;
  }
  return data.user;
}

let client: Client | null = null;

function bindEvents(
  keycloak: Keycloak.KeycloakInstance,
  eventFunctions: {
    onAuthChange: Client['onAuthChange'];
    setError: ClientFactory['setError'];
    eventTrigger: ClientFactory['eventTrigger'];
    clearSession: Client['clearSession'];
  }
): void {
  const { onAuthChange, setError, eventTrigger, clearSession } = eventFunctions;
  /* eslint-disable no-param-reassign */
  keycloak.onReady = (): void => eventTrigger(ClientEvent.CLIENT_READY);
  keycloak.onAuthSuccess = (): void =>
    eventTrigger(ClientEvent.CLIENT_AUTH_SUCCESS);
  keycloak.onAuthError = (errorData): void => {
    onAuthChange(false);
    setError({
      type: ClientError.AUTH_ERROR,
      message: errorData.error_description
    });
  };
  keycloak.onAuthRefreshError = (): void => {
    const error = {
      type: ClientError.AUTH_REFRESH_ERROR,
      message: ''
    };
    setError(error);
  };
  keycloak.onAuthLogout = (): void => {
    clearSession();
    onAuthChange(false);
  };
  keycloak.onTokenExpired = (): void => eventTrigger(ClientEvent.TOKEN_EXPIRED);
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
  const {
    eventTrigger,
    getStoredUser,
    setStoredUser,
    fetchApiToken,
    ...clientFunctions
  } = createClient();

  const {
    isAuthenticated,
    isInitialized,
    setStatus,
    getStatus,
    setError
  } = clientFunctions;

  const saveUserData = (user: User | undefined): void => {
    saveUserToLocalStorage(keycloak.tokenParsed, user);
    setStoredUser(user);
  };

  const getUserData = (): User | undefined => {
    return (
      getStoredUser() ||
      getUserFromLocalStorage(keycloak.tokenParsed as KeycloakTokenParsed) ||
      undefined
    );
  };

  const getUser: Client['getUser'] = () => {
    if (!isAuthenticated()) {
      return undefined;
    }
    return getUserData();
  };

  const clearSession: Client['clearSession'] = () => {
    saveUserData(undefined);
  };

  const storeUserDataFromToken = (): User | undefined => {
    const userInToken = getUserFromToken(
      keycloak.tokenParsed as KeycloakTokenParsed
    );
    if (userInToken) {
      saveUserData(userInToken);
      return userInToken;
    }
    return undefined;
  };

  const onAuthChange = (authenticated: boolean): boolean => {
    if (isInitialized() && authenticated === isAuthenticated()) {
      return false;
    }
    if (authenticated && !getUserData()) {
      const userInToken = storeUserDataFromToken();
      if (!userInToken) {
        setError({
          type: ClientError.USER_DATA_ERROR,
          message:
            'user is logged in, but data not found in token or localstorage'
        });
      }
    }
    if (!authenticated) {
      clearSession();
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
      redirectUri: getLocationBasedUri('/'), // todo when relevant: redirect back to page login was initiated.
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
        enableLogging: clientConfig.enableLogging,
        silentCheckSsoRedirectUri: getLocationBasedUri(
          clientConfig.silentAuthPath
        )
      });

      keyCloakPromise
        .then((authenticated): void => {
          if (authenticated) {
            storeUserDataFromToken();
            onAuthChange(true);
            resolve(getUser());
            return;
          }
          onAuthChange(false);
          clearSession();
          resolve(undefined);
        })
        .catch((e?: {}) => {
          clearSession();
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

  const getApiAccessToken: Client['getApiAccessToken'] = async (
    options: FetchApiTokenOptions
  ) => {
    const tokenResponse = await fetchApiToken({
      uri: getTokenUri(getClientConfig()),
      accessToken: keycloak.token as string,
      ...options
    });
    return tokenResponse;
  };

  const getUserTokens: Client['getUserTokens'] = () => {
    if (!isAuthenticated()) {
      return undefined;
    }
    return {
      accessToken: keycloak.token,
      idToken: keycloak.idToken,
      refreshToken: keycloak.refreshToken
    };
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
    getApiAccessToken,
    getUserTokens,
    ...clientFunctions
  };
  bindEvents(keycloak, { onAuthChange, eventTrigger, setError, clearSession });
  return client;
}

export function getClient(): Client {
  if (client) {
    return client;
  }
  client = createKeycloakClient();
  return client;
}

export function useKeycloak(): Client {
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
}

export function useKeycloakErrorDetection(): ClientError {
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
}
