import Oidc, {
  UserManager,
  UserManagerSettings,
  WebStorageStateStore,
  User,
} from 'oidc-client';

import { Client, ClientStatus } from './index';

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
  let status: ClientStatus = 'none';

  client = {
    init: () => {
      if (status !== 'none') {
        throw new Error('Cannot re-initialize Oidc');
      }
      const promise = manager.signinSilent();

      status = 'initialized';
      promise
        .then(function(authenticated) {
          console.log(
            authenticated ? 'authenticated' : 'not authenticated',
            authenticated
          );
          status = authenticated ? 'authenticated' : 'unauthorized';
        })
        .catch(function() {
          console.log('failed to initialize');
          status = 'authentication-error';
        });
      return promise;
    },
    login: () => {
      manager.signinRedirect();
    },
    logout: () => {
      manager.signoutRedirect();
    },
    isAuthenticated: () => status === 'authenticated',
    isInitialized: () =>
      status === 'authenticated' ||
      status === 'authentication-error' ||
      status === 'logging-out' ||
      status === 'unauthorized',
    clearSession: () => {
      return;
    },
    loadUser: () => {
      return manager.getUser();
      /*
              .then(function(profile) {
                console.log(JSON.stringify(profile, null, '  '));
              })
              .catch(function() {
                console.log('Failed to load user profile');
              });*/
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
  };
  return client;
}
