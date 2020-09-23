import { useEffect, useState, useRef } from 'react';
import {
  UserManager,
  UserManagerSettings,
  WebStorageStateStore,
  User
} from 'oidc-client';

import {
  Client,
  ClientStatus,
  ClientStatusIds,
  User as ClientUser,
  ClientEvent,
  ClientError,
  createClient,
  ClientFactory
} from './index';

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
  post_logout_redirect_uri: `${location}/`
  // This calculates to 1 minute, good for debugging:
  // accessTokenExpiringNotificationTime: 59.65 * 60,
};
/* eslint-enable @typescript-eslint/camelcase */

let client: Client | null = null;

function oidcUserToClientUser(user: User): ClientUser {
  return (user as unknown) as ClientUser;
}

function bindEvents(
  manager: UserManager,
  eventFunctions: {
    onAuthChange: ClientFactory['onAuthChange'];
    setError: ClientFactory['setError'];
    eventTrigger: ClientFactory['eventTrigger'];
  }
): void {
  const { onAuthChange, setError, eventTrigger } = eventFunctions;
  manager.events.addUserUnloaded((): boolean => onAuthChange(false));
  manager.events.addUserSignedOut((): boolean => {
    return onAuthChange(false);
  });
  manager.events.addUserSessionChanged((): boolean => onAuthChange(false));
  manager.events.addSilentRenewError((renewError?: {}): void => {
    const errorObj = renewError
      ? ((renewError as unknown) as Error)
      : undefined;
    const message = errorObj ? errorObj.message : '';
    eventTrigger(ClientStatus.UNAUTHORIZED, { error: message });
    setError({
      type: ClientError.AUTH_REFRESH_ERROR,
      message
    });
  });
  manager.events.addAccessTokenExpired((): void =>
    eventTrigger(ClientEvent.USER_EXPIRED)
  );
}

export function getClient(config: Partial<UserManagerSettings>): Client {
  if (client) {
    return client;
  }
  const mergedConfig: UserManagerSettings = {
    ...defaultOptions,
    ...config
  };
  const manager = new UserManager(mergedConfig);
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
      const user = (getStoredUser() as unknown) as User;
      const userData = user && user.profile;
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

  let initPromise: Promise<ClientUser | undefined> | undefined;
  const init: Client['init'] = () => {
    if (initPromise) {
      return initPromise;
    }
    setStatus(ClientStatus.INITIALIZING);
    initPromise = new Promise((resolve, reject) => {
      manager
        .signinSilent()
        .then((loadedUser: User) => {
          const authenticated = !!loadedUser;
          if (authenticated) {
            const oidcUserAsClientUser = oidcUserToClientUser(loadedUser);
            setStoredUser(oidcUserAsClientUser);
            onAuthChange(true);
            resolve(oidcUserAsClientUser);
            return;
          }
          onAuthChange(false);
          resolve(undefined);
        })
        .catch((errorData?: Error) => {
          const reason = errorData ? errorData.message : '';
          onAuthChange(false);
          if (reason !== 'login_required') {
            setError({
              type: ClientError.AUTH_ERROR,
              message: reason
            });
            reject(errorData);
            return;
          }
          resolve(undefined);
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

  const login: Client['login'] = () => {
    manager.signinRedirect();
  };

  const logout: Client['logout'] = () => {
    eventTrigger(ClientEvent.LOGGING_OUT);
    manager.signoutRedirect();
  };

  const clearSession: Client['clearSession'] = () => false;

  const handleCallback: Client['handleCallback'] = () => {
    return new Promise((resolve, reject) => {
      setStatus(ClientStatus.INITIALIZING);
      manager
        .signinRedirectCallback()
        .then((loadedUser: User | undefined) => {
          const oidcUserAsClientUser = loadedUser
            ? oidcUserToClientUser(loadedUser)
            : undefined;
          setStoredUser(oidcUserAsClientUser);
          onAuthChange(true);
          resolve(oidcUserAsClientUser);
        })
        .catch(e => {
          setError({
            type: ClientError.AUTH_ERROR, // todo: new error type
            message: e && e.toString()
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
        .then(loadedUser => {
          const oidcUserAsClientUser = loadedUser
            ? oidcUserToClientUser(loadedUser)
            : undefined;
          setStoredUser(oidcUserAsClientUser);
          resolve(oidcUserAsClientUser);
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
  bindEvents(manager, { onAuthChange, eventTrigger, setError });
  return client;
}

export const useOidc = (): Client => {
  const clientRef: React.Ref<Client> = useRef(getClient({}));
  const clientFromRef: Client = clientRef.current as Client;
  const [, setStatus] = useState<ClientStatusIds>(clientFromRef.getStatus());
  useEffect(() => {
    const initClient = async (): Promise<void> => {
      if (!clientFromRef.isInitialized()) {
        await clientFromRef.getOrLoadUser().catch(e => {
          clientFromRef.setError({
            type: ClientError.INIT_ERROR,
            message: e && e.toString()
          });
        });
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

export const useOidcErrorDetection = (): ClientError => {
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

    return (): void => {
      errorListenerDisposer();
      statusListenerDisposer();
    };
  }, [clientFromRef]);
  return error;
};

export const useOidcCallback = (): Client => {
  const clientRef: React.Ref<Client> = useRef(getClient({}));
  const clientFromRef: Client = clientRef.current as Client;
  const [, setStatus] = useState<ClientStatusIds>(clientFromRef.getStatus());
  useEffect(() => {
    const initClient = async (): Promise<void> => {
      if (!clientFromRef.isInitialized()) {
        await clientFromRef.handleCallback().catch(e =>
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
