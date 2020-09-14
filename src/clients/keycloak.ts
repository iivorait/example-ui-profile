import Keycloak from 'keycloak-js';

import { Client, ClientStatus } from './index';
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
  /**
   * Alias for userManager.signInRedirect
   */
  signIn: (args?: unknown) => Promise<void>;
  /**
   * Alias for removeUser
   */
  signOut: () => Promise<void>;
  /**
   *
   */
  signOutRedirect: (args?: unknown) => Promise<void>;
  userData?: any | null;
  status?: ClientStatus;
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
   * See [UserManager](https://github.com/IdentityModel/oidc-client-js/wiki#usermanager) for more details.
   */
  client?: Client;
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

export function createClient(config: Partial<Keycloak.KeycloakConfig>): Client {
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

  client = {
    init: () => {
      if (status !== 'none') {
        throw new Error('Cannot re-initialize keycloak');
      }
      const promise = keycloak.init({
        onLoad: 'check-sso',
        flow: 'hybrid',
        token: savedTokens.token,
      });
      status = 'initialized';
      promise
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
      return promise;
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
      return;
    },
    handleCallback: () => {
      return Promise.reject('not supported with keycloak');
    },
    loadUser: () => {
      return keycloak.loadUserProfile();
    },
    getStatus: () => {
      return status;
    },
  };
  return client;
}
