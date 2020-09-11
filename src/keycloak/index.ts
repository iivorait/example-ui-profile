import KeycloakFactory, {
  KeycloakPromise,
  KeycloakError,
  KeycloakProfile,
} from 'keycloak-js';

export type KeyCloakActions = {
  init: () => KeycloakPromise<boolean, KeycloakError>;
  login: () => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isInitialized: () => boolean;
  clearSession: () => void;
  onLogin: () => void;
  loadUser: () => KeycloakPromise<KeycloakProfile, void>;
};

export type KeyCloakStatus =
  | 'none'
  | 'initialized'
  | 'authenticated'
  | 'unauthorized'
  | 'authentication-error'
  | 'logging-out';

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
  sessionStorage.setItem('token', token || '');
  sessionStorage.setItem('refreshToken', refreshToken || '');
}

function getSessionStorageTokens(): {
  token: string | undefined;
  refreshToken: string | undefined;
} {
  return {
    token: sessionStorage.getItem('token') || undefined,
    refreshToken: sessionStorage.getItem('refreshToken') || undefined,
  };
}

let actions: KeyCloakActions | null = null;

export function getKeyCloakActions(
  config: Partial<Keycloak.KeycloakConfig>
): KeyCloakActions {
  if (actions) {
    return actions;
  }
  const mergedConfig: Keycloak.KeycloakConfig = {
    ...defaultOptions,
    ...config,
  };
  const keycloak: Keycloak.KeycloakInstance = KeycloakFactory(mergedConfig);
  const savedTokens = getSessionStorageTokens();
  let status: KeyCloakStatus = 'none';
  console.log('savedTokens', savedTokens);

  actions = {
    init: () => {
      if (status !== 'none') {
        throw new Error('Cannot re-initialize keycloak');
      }
      console.log('init');
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
    onLogin: () => {
      return;
    },
    loadUser: () => {
      return keycloak.loadUserProfile();
      /*
              .then(function(profile) {
                console.log(JSON.stringify(profile, null, '  '));
              })
              .catch(function() {
                console.log('Failed to load user profile');
              });*/
    },
  };
  return actions;
}
