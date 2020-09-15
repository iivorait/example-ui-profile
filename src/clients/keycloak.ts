import { useEffect, useState, useRef } from 'react';
import Keycloak from 'keycloak-js';

import { Client, ClientStatus, User } from './index';
export interface KeycloakProviderSignOutProps {
  /**
   * Trigger a redirect of the current window to the end session endpoint
   *
   * You can also provide an object. This object will be sent with the
   * function.
   *
   * @example
   * ```javascript
   * const config = {
   *  signOutRedirect: {
   *    state: 'abrakadabra',
   *  },
   * };
   * ```
   */
  signoutRedirect?: boolean | unknown;
}
export interface KeycloakContextProps {
  readonly userManager: Client;
}

export interface KeycloakProviderProps {
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

  /**
   * On before sign in hook. Can be use to store the current url for use after signing in.
   *
   * This only gets called if autoSignIn is true
   */
  onBeforeSignIn?: () => void;
  /**
   * On sign out hook. Can be a async function.
   * @param userData User
   */
  onSignIn?: (userData: {} | null) => Promise<void> | void;
  /**
   * On sign out hook. Can be a async function.
   */
  onSignOut?: (options?: KeycloakProviderSignOutProps) => Promise<void> | void;
}

const defaultOptions: Keycloak.KeycloakConfig = {
  url: 'https://tunnistus.hel.ninja/auth',
  realm: 'helsinki-tunnistus',
  clientId: 'https://api.hel.fi/auth/example-ui-profile',
};

function setSessionStorageTokens({
  token,
  refreshToken,
}: {
  token: string | undefined;
  refreshToken: string | undefined;
}) {
  localStorage.setItem('token', token || '');
  localStorage.setItem('refreshToken', refreshToken || '');
}

function getSessionStorageTokens(): {
  token: string | undefined;
  refreshToken: string | undefined;
} {
  return {
    token: localStorage.getItem('token') || undefined,
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
  let status: ClientStatus = 'none';
  let initPromise:
    | Keycloak.KeycloakPromise<boolean, Keycloak.KeycloakError>
    | undefined = undefined;
  let user: User | undefined = undefined;
  client = {
    init: () => {
      if (initPromise) {
        return initPromise;
      }
      status = 'initializing';
      initPromise = keycloak.init({
        onLoad: 'check-sso',
        flow: 'hybrid',
        token: savedTokens.token,
        enableLogging: true,
      });
      status = 'initialized';
      initPromise
        .then(function(authenticated) {
          console.log(
            authenticated ? 'authenticated' : 'not authenticated',
            authenticated
          );
          status = authenticated ? 'authenticated' : 'unauthorized';
          if (authenticated) {
            setSessionStorageTokens({
              token: keycloak.token,
              refreshToken: keycloak.refreshToken,
            });
          }
        })
        .catch(function() {
          console.log('failed to initialize');
          status = 'authentication-error';
        });
      return initPromise;
    },
    login: () => {
      keycloak.login({
        redirectUri: 'http://localhost:3000/',
        scope: 'ad-groups',
      });
    },
    logout: () => {
      setSessionStorageTokens({ token: '', refreshToken: '' });
      keycloak.logout({
        redirectUri: 'http://localhost:3000/',
      });
    },
    isAuthenticated: () => status === 'authenticated',
    isInitialized: () =>
      status === 'authenticated' ||
      status === 'authentication-error' ||
      status === 'logging-out' ||
      status === 'unauthorized',
    clearSession: () => {
      user = undefined;
      return;
    },
    handleCallback: () => {
      return Promise.reject('not supported with keycloak');
    },
    loadUserProfile: () => {
      return new Promise((resolve, reject) => {
        keycloak
          .loadUserProfile()
          .then(data => {
            user = data;
            resolve(data);
          })
          .catch(e => {
            user = undefined;
            reject(e);
          });
      });
    },
    getUserProfile: () => {
      return user;
    },
    getStatus: () => {
      return status;
    },
  };
  return client;
}

export const useKeycloak = (): Client => {
  const clientRef: React.Ref<Client> = useRef(getClient({}));
  const client: Client = clientRef.current as Client;
  const [, setStatus] = useState<ClientStatus>(client.getStatus());
  useEffect(() => {
    const initClient = async (): Promise<void> => {
      if (!client.isInitialized()) {
        await client.init();
      }
      console.log('inititiated');
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
