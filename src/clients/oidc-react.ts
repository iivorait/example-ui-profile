import { useEffect, useState, useRef } from 'react';
import Oidc, {
  UserManager,
  UserManagerSettings,
  WebStorageStateStore,
  User,
} from 'oidc-client';

import {
  Client,
  ClientStatus,
  ClientStatusIds,
  User as ClientUser,
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

const location = window.location.origin;

/* eslint-disable @typescript-eslint/camelcase */
const defaultOptions: UserManagerSettings = {
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  authority: 'https://tunnistus.hel.ninja/auth/realms/helsinki-tunnistus',
  automaticSilentRenew: true,
  client_id: 'https://api.hel.fi/auth/example-ui-profile',
  redirect_uri: `${location}/callback`,
  response_type: 'id_token token',
  silent_redirect_uri: `${location}/silent_renew.html`,
  post_logout_redirect_uri: `${location}/`,
  // This calculates to 1 minute, good for debugging:
  // accessTokenExpiringNotificationTime: 59.65 * 60,
};
/* eslint-enable @typescript-eslint/camelcase */

let client: Client | null = null;

export function getClient(config: Partial<UserManagerSettings>): Client {
  if (client) {
    return client;
  }
  const mergedConfig: UserManagerSettings = {
    ...defaultOptions,
    ...config,
  };
  Oidc.Log.logger = console;
  Oidc.Log.level = 4;
  const manager = new UserManager(mergedConfig);
  let status: ClientStatusIds = ClientStatus.NONE;
  let error: ClientError = undefined;
  let initPromise: Promise<ClientUser | undefined> | undefined = undefined;
  let user: User | undefined = undefined;
  const listeners: Map<ClientEventIds, Set<EventListener>> = new Map();

  const init: Client['init'] = () => {
    if (initPromise) {
      return initPromise;
    }
    status = ClientStatus.INITIALIZING;
    initPromise = new Promise((resolve, reject) => {
      manager
        .signinSilent()
        .then(function(loadedUser) {
          const authenticated = !!loadedUser;
          if (authenticated) {
            user = loadedUser;
            onAuthChange(true);
            resolve((loadedUser as unknown) as ClientUser);
            return;
          }
          onAuthChange(false);
          resolve(undefined);
        })
        .catch(function(errorData: Error) {
          setError({
            type: ClientError.AUTH_ERROR,
            message: errorData.message,
          });
          onAuthChange(false);
          reject(errorData);
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
      const userData = user && user.profile;
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
      return Promise.resolve(undefined);
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
    // console.log('eventTrigger', eventType);
    const source = listeners.get(eventType);
    source &&
      source.size &&
      source.forEach(listener => listener(client as Client, payload));
  };

  const onAuthChange = (authenticated: boolean) => {
    if (isInitialized() && authenticated === isAuthenticated()) {
      return false;
    }
    const statusChanged = setStatus(
      authenticated ? ClientStatus.AUTHORIZED : ClientStatus.UNAUTHORIZED
    );
    statusChanged && eventTrigger(status, getUser());
  };

  const login: Client['login'] = () => {
    manager.signinRedirect();
  };

  const logout: Client['logout'] = () => {
    manager.signoutRedirect();
  };

  const clearSession: Client['clearSession'] = () => false;

  const handleCallback: Client['handleCallback'] = () => {
    return new Promise((resolve, reject) => {
      setStatus(ClientStatus.INITIALIZING);
      manager
        .signinRedirectCallback()
        .then((e: User | undefined) => {
          user = e;
          onAuthChange(true);
          resolve(e);
        })
        .catch(e => {
          setError({
            type: ClientError.AUTH_ERROR, // todo: new error type
            message: e && e.toString(),
          });
          onAuthChange(false);
          reject(e);
        });
    });
  };

  const loadUserProfile: Client['loadUserProfile'] = () => {
    return new Promise((resolve, reject) => {
      manager
        .getUser()
        .then(data => {
          user = data || undefined;
          resolve(user ? ((user as unknown) as ClientUser) : undefined);
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
    return user ? ((user as unknown) as ClientUser) : undefined;
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

  // manager.events.onReady = authenticated => onAuthChange();
  // manager.events.onAuthRefreshSuccess = () => eventTrigger('onAuthRefreshSuccess');
  // manager.events.addAccessTokenExpiring
  // manager.events.addUserLoaded = () => onAuthChange(true);
  manager.events.addUserUnloaded = () => onAuthChange(false);
  manager.events.addUserSignedOut = () => onAuthChange(false);
  manager.events.addUserSessionChanged = () => onAuthChange(false);

  manager.events.addSilentRenewError = error => {
    eventTrigger(ClientStatus.UNAUTHORIZED, { error: true });
    setError({
      type: ClientError.AUTH_REFRESH_ERROR,
      message: error && ((error as unknown) as Error).message,
    });
  };
  manager.events.addAccessTokenExpired = () =>
    eventTrigger(ClientEvent.USER_EXPIRED);

  return client;
}

export const useOidc = (): Client => {
  const clientRef: React.Ref<Client> = useRef(getClient({}));
  const client: Client = clientRef.current as Client;
  const [, setStatus] = useState<ClientStatusIds>(client.getStatus());
  useEffect(() => {
    const initClient = async (): Promise<void> => {
      if (!client.isInitialized()) {
        await client.getOrLoadUser().catch(e =>
          client.setError({
            type: ClientError.INIT_ERROR,
            message: e && e.toString(),
          })
        );
      }
      setStatus(client.getStatus());
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

export const useOidcErrorDetection = (): ClientError => {
  const clientRef: React.Ref<Client> = useRef(getClient({}));
  const client: Client = clientRef.current as Client;
  const [error, setError] = useState<ClientError>(undefined);
  useEffect(() => {
    let isAuthorized = false;
    const statusListenerDisposer = client.addListener(
      ClientEvent.STATUS_CHANGE,
      (client, status) => {
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

export const useOidcCallback = (): Client => {
  const clientRef: React.Ref<Client> = useRef(getClient({}));
  const client: Client = clientRef.current as Client;
  const [, setStatus] = useState<ClientStatusIds>(client.getStatus());
  useEffect(() => {
    const initClient = async (): Promise<void> => {
      if (!client.isInitialized()) {
        await client.handleCallback().catch(e =>
          client.setError({
            type: ClientError.INIT_ERROR,
            message: e && e.toString(),
          })
        );
      }
      setStatus(client.getStatus());
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
