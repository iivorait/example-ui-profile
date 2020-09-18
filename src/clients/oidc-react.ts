import { useEffect, useState, useRef } from 'react';
import Oidc, {
  UserManager,
  UserManagerSettings,
  WebStorageStateStore,
  User,
} from 'oidc-client';

import {
  Client,
  ClientError,
  ClientStatus,
  ClientStatusIds,
  User as ClientUser,
} from './index';

const location = window.location.origin;

/* eslint-disable @typescript-eslint/camelcase */
const defaultSettings: UserManagerSettings = {
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  authority: 'https://tunnistus.hel.ninja/auth/realms/helsinki-tunnistus',
  automaticSilentRenew: true,
  client_id: 'https://api.hel.fi/auth/example-ui-profile',
  redirect_uri: `${location}/callback`,
  response_type: 'id_token token',
  silent_redirect_uri: `${location}/silent_renew.html`,
  post_logout_redirect_uri: `${location}/`,
  // This calculates to 1 minute, good for debugging:
  // https://github.com/City-of-Helsinki/kukkuu-ui/blob/8029ed64c3d0496fa87fa57837c73520e8cbe37f/src/domain/auth/userManager.ts#L18
  // accessTokenExpiringNotificationTime: 59.65 * 60,
};
/* eslint-enable @typescript-eslint/camelcase */
let client: Client | null = null;

export function getClient(settings: Partial<UserManagerSettings>): Client {
  if (client) {
    return client;
  }
  Oidc.Log.logger = console;
  Oidc.Log.level = 4;
  const mergedSettings: UserManagerSettings = {
    ...defaultSettings,
    ...settings,
  };
  const manager = new UserManager(mergedSettings);
  let status: ClientStatusIds = ClientStatus.NONE;
  let initPromise:
    | Promise<ClientUser | undefined | null>
    | undefined = undefined;
  let user: User | undefined | null = undefined;
  let error: ClientError = undefined;

  const init: Client['init'] = () => {
    if (initPromise) {
      return initPromise;
    }
    status = ClientStatus.INITIALIZING;
    initPromise = new Promise((resolve, reject) => {
      const managerPromise = manager.signinSilent();

      managerPromise
        .then(function(user) {
          console.log(
            user ? ClientStatus.AUTHORIZED : 'not authenticated',
            user
          );
          status = user ? ClientStatus.AUTHORIZED : ClientStatus.UNAUTHORIZED;
          resolve((user as unknown) as ClientUser);
        })
        .catch(function() {
          console.log('failed to initialize');
          status = ClientStatus.UNAUTHORIZED; // set error?
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
      return Promise.reject(undefined);
    }
    return init();
  };

  const addListener: Client['addListener'] = (eventType, listener) => {
    console.log('event!', eventType);
    return () => true;
  };
  const setStatus: Client['setStatus'] = newStatus => {
    if (newStatus === status) {
      return false;
    }
    status = newStatus;
    // eventTrigger(ClientEvent.STATUS_CHANGE, status);
    return true;
  };

  client = {
    init,
    login: () => {
      manager.signinRedirect();
    },
    logout: () => {
      manager.signoutRedirect();
    },
    isAuthenticated: () => status === ClientStatus.AUTHORIZED,
    isInitialized: () =>
      status === ClientStatus.AUTHORIZED ||
      status === ClientStatus.UNAUTHORIZED,
    clearSession: () => {
      return;
    },
    addListener,
    loadUserProfile: () => {
      return new Promise((resolve, reject) => {
        manager
          .getUser()
          .then(data => {
            user = data || undefined;
            resolve(user ? ((user as unknown) as ClientUser) : undefined);
          })
          .catch(e => {
            user = undefined;
            reject(e);
          });
      });
    },
    getUser,
    getOrLoadUser,
    getUserProfile: () => {
      return user ? ((user as unknown) as ClientUser) : undefined;
    },
    handleCallback: () => {
      return new Promise((resolve, reject) => {
        manager
          .signinRedirectCallback()
          .then((e: any) => {
            console.log('signinRedirectCallback', e);
            resolve(e);
          })
          .catch(e => {
            console.log('signinRedirectCallback catch', e);
            reject(e);
          });
      });
    },
    getStatus: () => status,
    setStatus,
    getError: () => error,
    setError: err => !!((error = err) && false),
  };
  return client;
}

export const useOidc = (): Client => {
  const clientRef: React.Ref<Client> = useRef(getClient({}));
  const client: Client = clientRef.current as Client;
  const [, setStatus] = useState<ClientStatusIds>(client.getStatus());
  useEffect(() => {
    const initClient = async (): Promise<void> => {
      if (!client.isInitialized()) {
        await client.init();
      }
      console.log('initiated');
      if (client.isAuthenticated()) {
        await client.loadUserProfile();
        console.log('user loaded');
      }
      setStatus(client.getStatus());
      return;
    };
    initClient();
  }, [client]);
  return client;
};
